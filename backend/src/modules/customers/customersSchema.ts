import { z } from "zod";

// Schema for POST /customers. Note this doesn't just require phone to be
// a non-empty string like the original hand-written check did. It also
// enforces a specific shape: a +254 country code followed by exactly 9
// digits, matching how Kenyan mobile numbers actually look in E.164
// format.
export const createCustomerSchema = z.object({
    phone: z
      .string()
      .regex(/^\+254\d{9}$/, "phone must be in the format +254XXXXXXXXX"),
    // .optional() means this field can be left out of the request entirely
    // matches the actor catalog's registration flow, where only phone is
    // required at signup.
    name: z.string().optional(),
});