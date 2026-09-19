import { prisma } from "../../lib/prisma";
import { assertValidTransition } from "./orderStateMachine";

// called directly by the payment callback the instant escrow is confirmed
export async function dispatchOrder(orderId: string) {
    assertValidTransition("ESCROW_HELD", "DISPATCHING");
    await prisma.order.update({ where: { id: orderId }, data: { status: "DISPATCHING" } });

    // simplification: first available rider, no proximity matching
    // - RiderGpsPing not yet implemented
    const rider = await prisma.rider.findFirst({ where: { status: "AVAILABLE" } });

    if (!rider) {
        await prisma.order.update({ where: { id: orderId }, data: { status: "DISPATCH_TIMEOUT" } });
        return;
    }

    await prisma.$transaction([
        prisma.order.update({ where: { id: orderId }, data: { status: "ASSIGNED", riderId: rider.id } }),
        prisma.rider.update({ where: { id: rider.id }, data: { status: "ON_DELIVERY" } }),
    ]);
}