import { randomUUID } from "crypto";
import type { Request, Response, NextFunction } from "express";

declare global {
    namespace Express {
        interface Request {
            requestId?: string;
        }
    }
}

// Runs first on every request
export function requestId(req: Request, res: Response, next: NextFunction) {
    // Reuse the id the app sent so both sides share it; otherwise make a new one
    const id = (req.headers["x-request-id"] as string | undefined) ?? randomUUID();
    req.requestId = id;     // available to every later handler
    res.setHeader("x-request-id", id);  // send it back so the app can read it
    next();             // continue to the next middleware or route
}