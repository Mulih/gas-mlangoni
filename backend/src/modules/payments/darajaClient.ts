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
    const credentials = Buffer.from(`&{consumerKey}:${consumerSecret}`).toString("base64");

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