import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { validate } from "../../middleware/validate";
import { createVendorSchema, setInventorySchema } from "./vendorsSchemas";

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

// POST /vendors/:vendorId/inventory - a vendor reports their current
// stock for a brand+size. Also an upsert, same reasoning as cylinder
// prices: restocking updates the existing. row rather than erroring.
vendorsRouter.post<{ vendorId: string }>(
    "/:vendorId/inventory",
    validate(setInventorySchema),
    async (req, res) => {
        const { vendorId } = req.params;
        const { brand, size, quantity } = req.body;

        const stock = await prisma.inventoryStock.upsert({
            // Same auto-generated naming pattern as CylinderPrice's
            // "brand_size", just with vendorId added - and note this uses the
            // Prisma *field* name (vendorId), not the mapped column name
            // (vendor_id).
            where: { vendorId_brand_size: { vendorId, brand, size } },
            update: { quantity },
            create: { vendorId, brand, size, quantity },
        });

        res.status(200).json(stock);
    },
);