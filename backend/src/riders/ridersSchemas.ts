import { z } from "zod";

export const createRidersSchema = z.object({
    name: z.string().min(1, "name is requied"),
    // Same E.164-style Kenyan format we enforce for Customer.phone
    // consistent validation rule whenever a phone number is collected.
    phone: z.string().regex(/^\+254\d{9}$/, "phone must be the format +2547XXXXXXXX"),
});