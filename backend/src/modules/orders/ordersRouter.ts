import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { validate } from "../../middleware/validate";
import { assertValidTransition, InvalidOrderTransitionError } from "./orderStateMachine";
import { createOrderSchema, updateOrderStatusSchema } from "./ordersSchemas";
import { resolveOrderPricing, OrderPricingError } from "./orderPricing";

export const ordersRouter = Router();

// Nested under /customers':customerId, not standalone - an order always
// belongs to the customer placing it, same reasoning as addresses being
// nested under a customer rather than free-floating.
ordersRouter.post<{ customerId: string }>(
    "/customers/:customerId/orders",
    validate(createOrderSchema),
    async (req, res) => {
        const { customerId } = req.params;
        const { vendorId, addressId, brand, size, deliveryMode } = req.body;

        // The ownership check the schema itself can't enforce, flagged when
        // we added addressId: confirm this address actually belongs to this
        // customer, not just that it exists somewhere in the database.
        const address = await prisma.address.findUnique({ where: { id: addressId } });
        if (!address || address.customerId != customerId) {
            return res.status(400).json({ error: "AddressId does not belong to this customer" });
        }

        // Pricing and stock, resolved entirely server-side
        let totalAmount;
        try {
            ({ totalAmount } = await resolveOrderPricing(vendorId, brand, size));
        } catch (err) {
            if (err instanceof OrderPricingError) {
                return res.status(400).json({ error: err.message });
            }
            // Anythin else is unexpected - let it be handled by
            // the error handling middleware rather than swallowing it
            // here
            throw err;
        }

        const order = await prisma.order.create({
            data: {
                customerId,
                vendorId,
                addressId,
                brand,
                size,
                deliveryMode,
                totalAmount,
                // status isn't set here - @default(PLACED) is the only legal
                // starting state, same reasoningas every other enum default
                // in this schema.
            },
        });

        res.status(201).json(order);
    },
);

// checks whether a transition is VALID per the state
// machine, but not who is allowed to trigger it.
ordersRouter.patch<{ orderId: string }>(
    "/orders/:orderId/status",
    validate(updateOrderStatusSchema),
    async (req, res) => {
        const { orderId } = req.params;
        const { to } = req.body;

        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) {
            return res.status(400).json({ error: "order not found" });
        }

        try {
            // orderStateMachine.ts
            assertValidTransition(order.status, to);
        } catch (err) {
            if (err instanceof InvalidOrderTransitionError) {
                return res.status(400).json({ error: err.message });
            }
            throw err;
        }

        const updated = await prisma.order.update({
            where: { id: orderId },
            data: { status: to },
        });

        res.status(200).json(updated);
    },
);
    