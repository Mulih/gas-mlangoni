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

// Schema for POST /customers/:customerId/addresses.
export const createAddressSchema = z.object({
    estateName: z.string().min(1, "estateName is required"),
    // -90 to 90 and -180 to 180 are arbitrary limits, they're the 
    // actual valid range of latitude and longitude on Earth. A value
    // outside this range isn't a business-rule violation, it's physically
    // meaningless, so it belongs in the schema rather than a manual check.
    gpsLat: z.number().min(-90).max(90),
    gpsLng: z.number().min(-180).max(180), 
});