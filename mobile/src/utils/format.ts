export function formatKsh(value: string | number): string {
    // Prisma sends Decimal values as strings, so convert to a number first
    const amount = typeof value === "string" ? Number(value) : value;
    // If the value isn't a real number, show zero instead of "NaN"
    if (!Number.isFinite(amount)) return "KS 0";
    // Round to whole shillings, then insert a comma before every group of 3 digits
    const withCommas = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    // Prefix with the currency, matching the mockup's "KSh" spelling
    return `KSh ${withCommas}`;
}