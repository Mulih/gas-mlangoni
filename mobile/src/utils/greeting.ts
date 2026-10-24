// Pick a greeting for the hour of dat (0 - 23). The hour is a parameter, not read from the clock, so a test can fix it.
export function getGreeting(hour: number): string {
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}

// First word of a full name: "Alvin Mulih" -> "Alvin". Returns "" when there is no name.
export function firstName(name?: string): string {
    // ?? "" covers undefined; split(/\s+/) cuts on any run of spaces; [0] takes the first piece.
    return (name ?? "").trim().split(/\s+/)[0] ?? "";
}