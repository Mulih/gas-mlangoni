import { z } from "zod";

// Deliberately does not accept totalAmount 
// the client says what they want; the server decides what it costs.
export const createOrderSchema = z.object({
    vendorId: z.uuid(),
    addressId: z.uuid(),
    brand: z.string().min(1),
    size: z.string().min(1),
    deliveryMode: z.enum(["ON_DEMAND", "SCHEDULED"]),
    orderType: z.enum(["REFILL", "NEW_CYLINDER"]),
});

// Every OrderStatus value, listed explicitly rather than derived from
// the Prisma enum automatically - keeps schema.prisma, this file, and
// the state-machine doc all requiring a human to update them together,
// rather than one silently drifting from the others.
export const updateOrderStatusSchema = z.object({
    to: z.enum([
        "PLACED", "ESCROW_HELD", "DISPATCHING", "DISPATCH_TIMEOUT", "ASSIGNED",
        "EN_ROUTE", "AUDIT_IN_PROGRESS", "AUDIT_FAILED", "DELIVERED",
        "PAYOUT_RELEASED", "COMPLETED", "CANCELLED", "REFUNDED",
    ]),
});

// no fields at all from the request body - everything this endpoint
// needs (amount, phone) comes from the Order and Customer records
// themselves, never from what a client claims. Same principle as
// totalAmount in createOrderSchema: clients says which order to pay for
// not how much or to whaht number.
export const initiatePaymentSchema = z.object({});

export const confirmDeliverySchema = z.object({
    measuredWeight: z.number().positive("measuredWeight must be greater than zero"),
});