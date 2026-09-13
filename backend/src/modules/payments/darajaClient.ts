export interface StkPushRequest {
    phone: string;
    amount: number;
    orderId: string;
    accountReference: string;
}

export interface StkPushResult {
    merchantRequestId: string;
    checkoutRequestId: string;
}

export interface TransactionStatusResult {
    resultCode: number,
    resultDesc: string,
}

// Daraja's access tokens are short-lived (~1hr per "expires_in":"3599")
// every authenticateed call needs one.
// Module-level variables, not a class - this file is only ever imported 
// once per running process, so a plain variable is the single shared
// cache
let cachedToken: string | null = null;
let tokenExpiresAt = 0; // epoch milliseconds

export async function getAccessToken(): Promise<string> {
    // Reuse the cached token if it's still valid, rather than requesting a 
    // fresh one every single API call
    if (cachedToken && Date.now() < tokenExpiresAt) {
        return cachedToken;
    }

    const consumerKey = process.env.DARAJA_CONSUMER_KEY;
    const consumerSecret = process.env.DARAJA_CONSUMER_SECRET;



    // Fail loudly and immediately if these are missing, rather than
    // sending a request we already know will be rejected and getting a
    // confusing error back from Daraja instead of an obvious one from us.
    if (!consumerKey || !consumerSecret) {
        throw new Error("DARAJA_CONSUMER_KEY or DARAJA_CONSUMER_SECRET is not set.");
    }

    // Basic Auth
    const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

    const response = await fetch(
        "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
        { headers: { Authorization: `Basic ${credentials}` } },
    );

    if (!response.ok) {
        throw new Error(`Daraja OAuth failed: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as { access_token: string; expires_in: string };

    cachedToken = data.access_token;
    // Subtract 60 seconds from the real expiry as a safety margin
    // we'd rather refresh a few seconds early than have a token expire
    // mid-request and fail a real STK Push because of timing.
    tokenExpiresAt = Date.now() + (Number(data.expires_in) - 60) * 1000;

    return cachedToken;
}

export async function initiateStkPush(req: StkPushRequest): Promise<StkPushResult> {
    const shortcode = process.env.DARAJA_SHORTCODE;
    const passkey = process.env.DARAJA_PASSKEY;
    const callbackUrl = process.env.DARAJA_CALLBACK_URL;

    if (!shortcode || !passkey || !callbackUrl) {
        throw new Error("DARAJA_SHORTCODE, DARAJA_PASSKEY, or DARAJA_CALLBACK_URL is not set");
    }

    const accessToken = await getAccessToken();

    // Daraja requests exactly this format YYYMMMDDDHHmmss, no separators -
    // generated fresh for this specific request, since it's baked directly
    // into the password below.
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);

    // Daraja's own documented password scheme: base64 of
    // shortcode + passkey + timestamp, concatenated as plain strings in
    // that exact order
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

    const response = await fetch("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            // Fixed value Daraja requires for this specific product (Lipa Na
            // M-Pesa Online / STK Push) 
            TransactionType: "CustomerPayBillOnline",
            Amount: req.amount,
            PartyA: req.phone,
            PartyB: shortcode,
            PhoneNumber: req.phone,
            CallBackURL: callbackUrl,
            AccountReference: req.accountReference,
            TransactionDesc: `Gas Mlangoni order ${req.orderId}`,
        }),
    });

    const data = await response.json();

    // ResponseCode "0" specifically means the PUSH was successfully sent
    // to the phone - NOT that payment succeeded. The actual payment
    // outcome only arrives later, via the callback, which is why this 
    // function returns IDs to track the request, not a payment result.
    if (!response.ok || data.ResponseCode != "0") {
        throw new Error(`Daraja STK Push failed: ${JSON.stringify(data)}`);
    }

    return {
        merchantRequestId: data.MerchantRequestID,
        checkoutRequestId: data.CheckoutRequestID,
    };
}

export async function queryTransactionStatus(checkoutRequestId: string): Promise<TransactionStatusResult> {
    const shortcode = process.env.DARAJA_SHORTCODE;
    const passkey = process.env.DARAJA_PASSKEY;

    if (!shortcode || !passkey) {
        throw new Error("DARAJA_SHORTCODE of DARAJA_PASSKEY is not set");
    }

    const accessToken = await getAccessToken();

    // Same timestamp/password scheme as initiateStkPush - Daraja requires
    // a freshly-generated one for this call too, not the one from the
    // original push request.
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

    console.log(JSON.stringify({ BusinessShortCode: shortcode, Password: password, Timestamp: timestamp, CheckoutRequestID: checkoutRequestId }))
    const response = await fetch("https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            checkoutRequestId: checkoutRequestId,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Daraja status query failed: ${JSON.stringify(data)}`);
    }

    // Note: this endpoint's response uses ResultCode as a STRING ("0"),
    // unlike the callback payload where it's a genuine number (0) - a real
    // inconsitency in Daraja's own API
    // Number() normalizes it so the caller's dont have to know which shape
    // they're dealing with.
    return {
        resultCode: Number(data.ResultCode),
        resultDesc: data.ResultDesc,
    };
}