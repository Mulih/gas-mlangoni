// one offer in the monthly offers banner.
// the type is a contract for the backend. GET /offers should return Offer[].
export interface Offer {
    id: string;     // unique id
    title: string;  // heading, e.g. "Monthly offers"
    description: string;    // one line
    ctaLabel: string;       // button text
    badge: string;      // short text in the round badge
}

// Sample data used until the backend has an offers endpoint.
const MOCK_OFFERS: Offer[] = [
    { id: "monthly-1", title: "Monthly offers", description: "Save more on your LPG", ctaLabel: "View deals", badge: "%" },
];

// Screens call this function. When the backend is wired, only this body changes to:
//    returns api.get<Offer[]>("/offers");
export async function getOffers(): Promise<Offer[]> {
    return MOCK_OFFERS;     // async on purpose, so it has the same shape as sthe real API call and callers never change
}