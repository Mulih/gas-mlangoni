import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET;

// Fail at startup, not on the first request - a missing secret  here
// would otherwise let token verification behave unpredicatably instead
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
}
export function signCustomerToken(customerId: string): string {
    // no expiry set - a current simplification, not an oversight.
    return jwt.sign(
        { customerId },
        JWT_SECRET as string,
    { expiresIn: '30d' });
}

// 
declare global {
    namespace Express {
        interface Request {
            customerId?: string;
        }
    }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or malformed Authorization header" });
    }
    try {
        const payload = jwt.verify(header.slice(7), JWT_SECRET) as { customerId: string };
        req.customerId = payload.customerId;
        next();
    } catch {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

// chained after requireAuth on any route with :customerId in the URL -
// confirms the token actually belongs to the customer being accessed, not some other customer.
export function requireCustomerMatch(req: Request, res: Response, next: NextFunction) {
    if (req.customerId !== req.params.customerId) {
        return res.status(403).json({ error: "Access denied" });
    }
    next();
}