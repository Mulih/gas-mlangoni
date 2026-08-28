import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { validate } from "../../middleware/validate";
import { createVendorSchema } from "./vendorsSchemas";

export const vendorsRouter = Router();

vendorsRouter.post("/", validate(createVendorSchema), async (req, res) => {
    const { businessName, epraPermitNumber } = req.body;

    // permitStatus isn't set here. It uses the schema's @default(PENDING)
    // from schema.prisma, which is the only valid starting state for a 
    // brand-new vendor.
    const vendor = await prisma.vendor.create({
        data: { businessName, epraPermitNumber },
    });

    res.status(201).json(vendor);
})