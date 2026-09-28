import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { validate } from "../../middleware/validate";
import { assertValidTransition, InvalidOrderTransitionError } from "./orderStateMachine";
import { initiateStkPush } from "../payments/darajaClient";
import { createOrderSchema, updateOrderStatusSchema, initiatePaymentSchema, confirmDeliverySchema } from "./ordersSchemas";
import { resolveOrderPricing, OrderPricingError } from "./orderPricing";
import { dispatchOrder } from "./dispatch";


export const ordersRouter = Router();

// Nested under /customers':customerId, not standalone - an order always
// belongs to the customer placing it, same reasoning as addresses being
// nested under a customer rather than free-floating.
ordersRouter.post<{ customerId: string }>(
    "/customers/:customerId/orders",
    validate(createOrderSchema),
    async (req, res) => {
        const { customerId } = req.params;
        const { vendorId, addressId, brand, size, deliveryMode, orderType } = req.body;

        // The ownership check the schema itself can't enforce, flagged when
        // we added addressId: confirm this address actually belongs to this
        // customer, not just that it exists somewhere in the database.
        const address = await prisma.address.findUnique({ where: { id: addressId } });
        if (!address || address.customerId != customerId) {
            return res.status(400).json({ error: "AddressId does not belong to this customer" });
        }

        // Flat fee for MVP - the original spec's "Zone Delivery Fee" concept
        // is real but not for right now. This constant is the one place to change if/when
        // zone-based pricing gets built later; nothing else in this file needs to know about it
        const DELIVERY_FEE = 200;

        const NEW_CYLINDER_SURCHAGE = 1500;

        // Pricing and stock, resolved entirely server-side
        let totalAmount;
        try {           
            const pricing = await resolveOrderPricing(vendorId, brand, size);
            totalAmount = Number(pricing.totalAmount) + DELIVERY_FEE + (orderType === "NEW_CYLINDER" ? NEW_CYLINDER_SURCHAGE : 0);
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
                orderType,
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

ordersRouter.post<{ orderId: string}>(
    "/orders/:orderId/pay",
    validate(initiatePaymentSchema),
    async (req, res) => {
        const { orderId } = req.params;

        // include: { customer: true } - we need the customer's phone number
        // to actually send the STK push to, which lives on a related table,
        // not on Order itself.
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { customer: true },
        });

        if (!order) {
            return res.status(400).json({ error: "order not found" });
        }

        // An order can only be paid for once, from its correct starting
        // state - reusing the same state-machine thinking as
        // orderStateMachine.ts even though this specific check lives here
        // rather than in that file, since it's checking Order.status against
        // a fixed value, not a general transition.
        if (order.status !== "PLACED") {
            return res.status(400).json({ error: `Cannot initiate payment for an order in status ${order.status}` });
        }

        // Daraja expects phone numbers without the leading "+" (confirmed
        // testing by hand with the sandbox number, 254708374149) but our
        // own Customer.phone is stored with one ("+254700000001"), per the
        // strips exactly the first character.
        const phoneForDaraja = order.customer.phone.slice(1);
        
        const result = await initiateStkPush({
            phone: phoneForDaraja,
            amount: Number(order.totalAmount),
            orderId: order.id,
            accountReference: order.id,
        });

        const payment = await prisma.payment.upsert({
            where: { orderId: order.id },
            update: {
                merchantRequestId: result.merchantRequestId,
                checkoutRequestId: result.checkoutRequestId,
                status: "PENDING",
                mpesaReceiptNumber: null,
            },
            create: {
                orderId: order.id,
                merchantRequestId: result.merchantRequestId,
                checkoutRequestId: result.checkoutRequestId,
                amount: order.totalAmount,
            },
        });

        res.status(201).json(payment);
    },
);

// GET /customers/:customerId/orders - every order this customer has
// placed, newest first. This is what the Orders tab and "My Orders"
// actually list.
ordersRouter.get<{ customerId: string }>("/customers/:customerId/orders", async (req, res) => {
    const { customerId } = req.params;

    const orders = await prisma.order.findMany({
        where: { customerId },
        orderBy: { createdAt: "desc" },
    });

    res.json(orders);
});

ordersRouter.get<{ orderId: string}>("/orders/:orderId", async (req, res) => {
    const order = await prisma.order.findUnique({ 
        where: { id: req.params.orderId},
        include: { rider: true, address: true }, 
    });
    if (!order) return res.status(404).json({ error: "order not found" });
    res.json(order);
});

ordersRouter.post<{ orderId: string }>("/orders/:orderId/debug-dispatch", async (req, res) => {
    await dispatchOrder(req.params.orderId);
    res.json({ ok: true });
});

ordersRouter.patch<{ orderId: string }>("/orders/:orderId/cancel", async (req, res) => {
    const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
    if (!order) return res.status(400).json({ error: "order not found" });

    try {
        assertValidTransition(order.status, "CANCELLED");
    } catch (err) {
        if (err instanceof InvalidOrderTransitionError) return res.status(400).json({ error: err.message });
        throw err;
    }

    res.json(await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } }));
});

// PATCH /orders/:orderId/confirm-delivery - the customer enters the
// weight shown on the rider's scale and confirms. Two automated transitions in one call
// since there's no separate rider-side "arrived" trigger, and no
// dispute path yet every confirmation will go straight through.
ordersRouter.patch<{ orderId: string }>(
    "/orders/:orderId/confirm-delivery",
    validate(confirmDeliverySchema),
    async (req, res) => {
        const { measuredWeight } = req.body;
        const order = await prisma.order.findUnique({ where: { id: req.params.orderId } });
        if (!order) return res.status(404).json({ error: "order not found" });

        try {
            assertValidTransition(order.status, "AUDIT_IN_PROGRESS");
        } catch (err) {
            if (err instanceof InvalidOrderTransitionError) return res.status(400).json({ error: err.message });
            throw err;
        }

        await prisma.order.update({ where: { id: order.id }, data: { status: "AUDIT_IN_PROGRESS" } });
        assertValidTransition("AUDIT_IN_PROGRESS", "DELIVERED");

        // include: rider 
        const updated = await prisma.order.update({ where: { id: order.id }, data: { status: "DELIVERED" }, include: { rider: true } });

        await prisma.weightAuditLog.create({ data: { orderId: order.id, measuredWeight, customerConfirmed: true } });

        res.json(updated);
    },
);

ordersRouter.get<{ riderId: string }>("/riders/:riderId/current-order", async (req, res) => {
    const order = await prisma.order.findFirst({
        where: { riderId: req.params.riderId, status: { in: ["EN_ROUTE", "ASSIGNED"] } },
        include: { customer: true, address: true },
    });
    res.json(order);
});