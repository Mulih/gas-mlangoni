import { z } from "zod";

// Deliberately does not accept totalAmount 
// the client says what they want; the server decides what it costs.
export const createOrderSchema = z.object({
    vendorId: z.uuid(),
    addressId: z.uuid(),
    brand: z.string().min(1),
    size: z.string().min(1),
    deliveryMode: z.enum(["ON_DEMAND", "SCHEDULED"]),
});