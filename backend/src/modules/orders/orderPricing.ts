import { prisma } from "../../lib/prisma";

// A dedicated error type
// - callers can catch this specifically and turn it into a clean 400
// rather than it look like an unexpected server failure
export class OrderPricingError extends Error {}

/**
 * Looks up the real, platform-set price for a brand+size, and confirms
 * the vendor actually has stock - entirely server-side, using nothing
 * the client sent us except which brand/size/vendor they want. This is
 * the function that makes the CylinderPrice design decision actually
 * matters in practice, not just in the schema.
 */
export async function resolveOrderPricing(vendorId: string, brand: string, size: string) {
    // Run both lookups concurrently with Promise.all rather than one after the other
    // they dont depend on each other's result, so there's no
    // reason to make the reqquest for them sequentially.
    const [cylinderPrice, stock] = await Promise.all([
        prisma.cylinderPrice.findUnique({
            where: { brand_size: { brand, size } },
        }),
        prisma.inventoryStock.findUnique({
            where: { vendorId_brand_size: { vendorId, brand, size } },
        }),
    ]);

    // No platform price exists for this brand+size at all -
    // gets a distinct worded error
    if (!cylinderPrice) {
        throw new OrderPricingError(`No price set for ${brand} ${size}`);
    }

    // Either the vendor has never stocked this brand+size at all (no row),
    // or they have a row but its at zero -  both imply the order cant be fulfilled
    if (!stock || stock.quantity <= 0) {
        throw new OrderPricingError(`Vendor has no stock of ${brand} ${size}`);
    }

    return { totalAmount: cylinderPrice.price };
}