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

// GET /vendors/:vendorId/inventory - what a customer actually sees when
// browsing this vendor: only brand+size combos with real price AND real
// stock. A vendor could technically stock something with no platform
// price set yet, or have a price set with zero stock - neither should
// ever appear as orderable, so this is an inner join in spirit, not a
// left join: only rows present in BOTH tables.
vendorsRouter.get<{ vendorId: string }>("/:vendorId/inventory", async (req, res) => {
    const { vendorId } = req.params;

    const stock = await prisma.inventoryStock.findMany({
        where: { vendorId, quantity: { gt: 0 } },
    });

    // Prisma has no native cross-table join and filter for two unrelated
    // models like this (InventoryStock and CylinderPrice share no foreign
    // key), so we fetch both and match them in application code - fine at
    // current scale, worth revisiting only if this vendor ever stocks
    // hundreds of distinct brand/size combinations.
    const prices = await prisma.cylinderPrice.findMany();

    const catalog = stock
      .map((item) => {
        const price = prices.find((p) => p.brand === item.brand && p.size === item.size);
        if (!price) return null;
        return { brand: item.brand, size: item.size, quantity: item.quantity, price: price.price };
      })
      .filter((item) => item !== null);

    res.json(catalog);
});