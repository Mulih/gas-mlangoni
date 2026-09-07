import { describe, it, expect } from "vitest";
import {
    assertValidTransition,
    isTerminal,
    InvalidOrderTransitionError,
} from "../src/modules/orders/orderStateMachine";

// describe() groups related tests together under one label - purely
// organizational, shows up as a heading in the test output.
describe("order state machine", () => {
    // Each it() is one specific behaviour being verified. Names read like a
    // sentence on purpose: "it allows a valid automated transition" - so a 
    // failure report tells you in plain English what broke, not just
    // which function.
    it("allows a valid automated transition", () => {
        const t = assertValidTransition("PLACED", "ESCROW_HELD");
        // expect(...).toBe(...) is the actual assertion: fails the test if
        // t.manual isn't exactly false.
        expect(t.manual).toBe(false);
    });

    it("flags manual-only transitions correctly", () => {
        const t = assertValidTransition("DELIVERED", "PAYOUT_RELEASED");
        expect(t.manual).toBe(true);
    });

    it("rejects an invalid transition", () => {
        // Skipping straight from PLACED to DELIVERED isn't in the transition
        // table at all - this has to throw
        // expect(() => ...) wraps the call in a function rather than calling it
        // normally would just crash the test file itself.
        expect(() => assertValidTransition("PLACED", "DELIVERED")).toThrow(
            InvalidOrderTransitionError,
        );
    });

    it("rejects skipping the dispatch timeout escalation", () => {
        // DISPATCHING can only go to ASSIGNED or DISPATCH_TIMEOUT - jumping
        // straight to REFUNDED bypasses the whole escalation path we
        // designed, and must be rejected the same as any other invalid move.
        expect(() => assertValidTransition("DISPATCHING", "REFUNDED")).toThrow();
    });

    it("recognizes terminal states correctly", () => {
        expect(isTerminal("COMPLETED")).toBe(true);
        expect(isTerminal("CANCELLED")).toBe(true);
        expect(isTerminal("REFUNDED")).toBe(true);
        expect(isTerminal("PLACED")).toBe(false);
    });
});