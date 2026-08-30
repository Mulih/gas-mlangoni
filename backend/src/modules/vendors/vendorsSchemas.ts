import { z } from "zod";

// Schema for POST /vendors. Deliberately does NOT accept permitStatus or
// permitExpiry from the request body, those are set by an admin
// reviewing a real permit later (EPRA verification is manual, not a live API)
// never by the vendor self-declaring their own status at signunp
export const createVendorSchema = z.object({
    businessName: z.string().min(1, "businessName is required"),
    epraPermitNumber: z.string().optional(),
});

// Schema for POST /vendors/:vendorId/inventory. No price field
// a vendor reports how much stock they have, never what it costs.
export const setInventorySchema = z.object({
    brand: z.string().min(1, "brand is required"),
    size: z.string().min(1, "size is required"),
    // .int() + .nonnegative(): whole numbers only, zero or greater no
    // half cylinders, no negative stock counts.
    quantity: z.number().int().nonnegative("qunatity must be zero or greater"),
});