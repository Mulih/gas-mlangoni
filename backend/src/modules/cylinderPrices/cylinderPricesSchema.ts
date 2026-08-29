import { z } from "zod";

// Schema for POST /cylinder-prices. Sets or updates the single
// platform-wide price for a brand-sze. No vendorId here as price
// isn't an individual vendor controls.
export const setCylinderPriceSchema = z.object({
    brand: z.string().min(1, "brand is required"),
    size: z.string().min(1, "size is required"),
    //.positive() rejects zero and negative prices outright
    // both are physicsally meaningless for something being sold
    price: z.number().positive("price must be greater than zero"),
});