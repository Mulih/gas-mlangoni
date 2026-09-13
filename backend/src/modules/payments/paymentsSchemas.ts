import { z } from "zod";

// Matches Daraja's real callback shape, confirmed against several
// independent working integrations, not assumed. CallbackMetadata is
// .optional() specificallly because a FAILED callback (wrong PIN,
// cancelled, timeout) omits it entirely - only a successful payment
// includes it.
export const darajaCallbackSchema = z.object({
    Body: z.object({
        stkCallback: z.object({
            MerchantRequestID: z.string(),
            CheckoutRequestID: z.string(),
            ResultCode: z.number(),
            ResultDesc: z.string(),
            CallbackMetadata: z
                .object({
                    Item: z.array(
                        z.object({
                            Name: z.string(),
                            // DAraja mixes strings and numbers across different
                            // fields in the same array (Amount is a number,
                            // MpesaReceiptNumber is a string) - z.union covers both
                            // without us having to guess which fields are which type.
                            Value: z.union([z.string(), z.number()]).optional(),
                        }),
                    ),
                })
                .optional(),
        }),
    }),
});