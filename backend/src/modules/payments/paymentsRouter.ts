import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { darajaCallbackSchema } from "./paymentsSchemas";
import { assertValidTransition } from "../orders/orderStateMachine";
import { dispatchOrder } from "../orders/dispatch";

export const paymentsRouter = Router();

paymentsRouter.post("/callback", async (req, res) => {
    // Deliberately NOT using our usual validate() middleware here - that
    // middleware responds 400 on bad input, Daraja needs 200
    // regardless of what we think of the payload, or it'll keep retrying.
    const acknowledge = () => res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });

    // Everything below is wrapped in one try/catch that swallows any
    // error rather than letting it propagate - normally we'd want errors
    // surfaced, but this specific endpoint's contract with Daraja requires
    // always returning 200. Logged in full server-side so we still find
    // out about it, just not by falling the webhook itself.
    try {
        const parsed = darajaCallbackSchema.safeParse(req.body);
        if (!parsed.success) {
            console.error("Unrecognized Daraja callback shape:", JSON.stringify(req.body));
            return acknowledge();
        }

        const { CheckoutRequestID, ResultCode, CallbackMetadata } = parsed.data.Body.stkCallback;

        const payment = await prisma.payment.findUnique({
            where: { checkoutRequestId: CheckoutRequestID },
            include: { order: true },
        });

        if (!payment) {
            console.error("Callback for unknown CheckoutRequestID:", CheckoutRequestID);
            return acknowledge();
        }

        // Idempotency: if this payment isn't PENDING anymore, we've already
        // processed a callback for it - whehter Daraja actually redelivers
        // callbacks is something the docs themselves disagreed on when we
        // protect against it regardless.
        if (payment.status !== "PENDING") {
            return acknowledge();
        }

        if (ResultCode === 0) {
            // Find the receipt number among the metadata items by name - the
            // array's order isn't guaranteed, so .find() by Name is the
            // correct approach, not assuming a fixed position.
            const receiptItem = CallbackMetadata?.Item.find((i) => i.Name === "MpesaReceiptNumber");
            const mpesaReceiptNumber = receiptItem ? String(receiptItem.Value) : null;

            await prisma.payment.update({
                where: { id: payment.id },
                data: { status: "COMPLETED", mpesaReceiptNumber },
            });

            // This is the transition we deliberately deferred when we first
            // builtPayment: PLACED -> ESCROW_HELD only happens once payment
            // is genuinely confirmed
            assertValidTransition(payment.order.status, "ESCROW_HELD");
            await prisma.order.update({
                where: { id: payment.orderId },
                data: { status: "ESCROW_HELD" },
            });
            await dispatchOrder(payment.orderId);
        } else {
            // 1032 is Daraja's specific code for "user cancelled"
            // anything else gets the more general FAILED status
            // rather than us trying to enumerate every possible
            // failure code individually.
            console.log("Payment not completed. ResultCode:", ResultCode, "ResultDesc:", parsed.data.Body.stkCallback.ResultDesc);
            const status = ResultCode === 1032 ? "CANCELLED" : "FAILED";
            await prisma.payment.update({ where: { id: payment.id }, data: { status } });
        }
    } catch(err) {
        console.error("Error processing Daraja callback:", err);
    }

    return acknowledge();
})