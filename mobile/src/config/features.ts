// switches for features that arent wired  to backend yet.
// true = visible.
export const FEATURES = {
    offers: true,   // Monthly offers banner on Home 
    weightAudit: true, // Weight audit quick action home
    wallet: true,   // wallet tab
} as const;     // values are fixed