import { z } from "zod";

// Schema for POST /vendors. Deliberately does NOT accept permitStatus or
// permitExpiry from the request body, those are set by an admin
// reviewing a real permit later (EPRA verification is manual, not a live API)
// never by the vendor self-declaring their own status at signunp
export const createVendorSchema = z.object({
    businessName: z.string().min(1, "businessName is required"),
    epraPermitNumber: z.string().optional(),
});