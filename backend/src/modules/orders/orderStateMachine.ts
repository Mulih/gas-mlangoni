// Import ONLY the type, not the runtime object - we don't need
// OrderStatus's actual values here, just its type, to make sure every
// key and value below is a real, valid status and nothing else.
import type { OrderStatus } from "../../generated/prisma/client";

// Describe one allowed transition: which status it leads to, and
// whether that transition may only happen through the admin console
type Transition = {
    to: OrderStatus;
    manual: boolean;
};

// The actual transition table

export const ORDER_TRANSITIONS: Record<OrderStatus, Transition[]> = {
    PLACED: [
        { to: "ESCROW_HELD", manual: false },
        { to: "CANCELLED", manual: false },
    ],
    ESCROW_HELD: [{ to: "DISPATCHING", manual: false }],
    DISPATCHING: [
        { to: "ASSIGNED", manual: false },
        { to: "DISPATCH_TIMEOUT", manual: false },
    ],
    DISPATCH_TIMEOUT: [
        { to: "ASSIGNED", manual: true},
        { to: "REFUNDED", manual: true },
    ],
    ASSIGNED: [{ to: "EN_ROUTE", manual: false }],
    EN_ROUTE: [{ to: "AUDIT_IN_PROGRESS", manual: false }],
    AUDIT_IN_PROGRESS: [
        { to: "DELIVERED", manual: false },
        { to: "AUDIT_FAILED", manual: false },
    ],
    AUDIT_FAILED: [
        { to: "REFUNDED", manual: true },
        { to: "DELIVERED", manual: true },
    ],
    DELIVERED: [{ to: "PAYOUT_RELEASED", manual: true }],
    PAYOUT_RELEASED: [{ to: "COMPLETED", manual: false }],
    // Terminal states: empty arrays, meaning "no transitions allowed out of
    // here at all" — not left out entirely, since Record<OrderStatus, ...>
    // requires every status to have an entry, terminal or not.
    COMPLETED: [],
    CANCELLED: [],
    REFUNDED: [],
};

// A customer error class rather than a generic server error 
export class InvalidOrderTransitionError extends Error {
    constructor(from: OrderStatus, to: OrderStatus) {
        super(`Cannot transition order from ${from} to ${to}`);
        this.name = "InvalidOrderTrnsitionError";
    }
}

/**
 * 
 */