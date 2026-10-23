// The shape of one order as returned by GET /customers/:id/orders.
export interface Order {
    id: string;
    brand: string;
    size: string;
    status: string;
    totalAmount: string;
    createdAt: string;
}

// short customer-faceing labels for each internal state
export const STATUS_LABELS: Record<string, string> = {
    PLACED: "Awaiting payment",
    ESCROW_HELD: "Payment confirmed",
    DISPTATCHING: "Finding rider",
    DISPATCH_TIMEOUT: "Delayed",
    ASSIGNED: "Rider assigned",
    EN_ROUTE: "Out for delivery",
    AUDIT_IN_PROGRESS: "Arriving",
    AUDIT_FAILED: "Under review",
    DELIVERED: "Delivered",
    PAYOUT_RELEASED: "Delivered",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    REFUNDED: "Refunded",
};

// One friendly line shown under the status title on an active card
export const STATUS_MESSAGES: Record<string, string> = {
    PLACED: "Pay to confirm your order",
    ESCROW_HELD: "Payment received, finding a rider",
    DISPATCHING: "Finding a rider near you",
    DISPATCH_TIMEOUT: "Taking longer than usual",
    ASSIGNED: "A rider is collecting your gas",
    EN_ROUTE: "Your LPG is on the way!",
    AUDIT_IN_PROGRESS: "Weight check in progress",
    AUDIT_FAILED: "Our team is reviewing this order",
};

// Labels under the four stepper nodes, in order
export const STAGES = ["Confirmed", "Assigned", "On the way", "Arriving"] as const;

// which stepper node is the current one for each active state.
const STAGE_BY_STATUS: Record<string, number> = {
    ESCROW_HELD: 0, // paid, waiting for a rider
    DISPATCHING: 0,
    DISPATCH_TIMEOUT: 0,
    ASSIGNED: 1,       // a rider has accepted
    EN_ROUTE: 2,       // rider is driving to the customer
    AUDIT_IN_PROGRESS: 3,   // rider has arrived, weight check
    AUDIT_FAILED: 3,
};

// States where the order is finished
const PAST_STATUSES = ["DELIVERED", "PAYOUT_RELEASED", "COMPLETED", "CANCELLED", "REFUNDED"];

// true = the order still needs attention or is still on its way ("Active").
export function isActive(status: string): boolean {
    return !PAST_STATUSES.includes(status); // active = not finished
}

// Current stepper node (0-3), 0r -1 when no stepper should show (unpaid or finished orders).
export function stageOf(status: string): number {
    return STAGE_BY_STATUS[status] ?? -1; // unknown/non-stepper states fall back to -1
}

// "2450.00" -> "KSh 2,450".
export function formatKsh(amount: string): string {
    const value = Number(amount);       // string -> number
    if (Number.isNaN(value)) return `KSh ${amount}`;    // bad data: show it as-is
    const whole = Math.round(value).toString();         // drop cents;
    return `KSh ${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;    // insert a comma before every group of 3 digits
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// PAds a number to two digits: 7 -> "07".
const pad = (n: number) => n.toString().padStart(2, "0");

// "Today, 14:30" / "Yesterday, 14:30" / "12 Aug 2025". `now` is a parameter so tests can fix the date.
export function formatOrderDate(iso: string, now: Date = new Date()): string {
    const date = new Date(iso); // parse the ISO string
    if (Number.isNaN(date.getTime())) return "";    // invalid date show nothing
    const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;   // 24 hour clock
    // Midnight at the start of a date
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    // Whole days between today and the order date
    const dayDiff = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
    if (dayDiff === 0) return `Today, ${time}`;
    if (dayDiff === 1) return `Yesterday, ${time}`;
    return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}