import type { Request, Response, NextFunction } from "express";
import { z, type ZodType } from "zod";

// This is a "middleware factory" - a function that returns a middleware
// function, rather than being middleware itself. It exists so we can 
// write validate(someSchema) and get back something Express can call for 
// any schema, instead of writing near identical validation code by hand
// in every single route handler.
export function validate(schema: ZodType) {
    // This is the actual middleware Express will run - same (req, res,
    // next) signature as every other middleware, including the router
    // handlers themselves.
    return (req: Request, res: Response, next: NextFunction) => {
        // safeParse (as opposed to parse) returns a result object instead of
        // throwing an exception on invalid input. We want that here - an
        // invalid request body is an expected, everyday outcome to handle
        // gracefully, not an exceptional program state to crash on.
        const result = schema.safeParse(req.body);

        if (!result.success) {
            // z.flattenError() turns Zod's internal error into a plain
            // { fieldName: ["message"] } shape - readable in a curl response,
            // rather than a deeply nested internal structure. We also return a 400 Bad Request status code, since
            // the client sent us something we can't process.
            return res.status(400).json({ error: "validation failed", details: z.flattenError(result.error) });
        }

        // Overwrite the req.body with the *parsed* result, not the original.
        // This matters: Zod can coerce and transform values (e.g. trimming
        // whitespace, converting a numeric string to an actual number), so
        // the parsed version is the one every downstream handler should
        // trust - not the raw, unvalidated body that arrived over HTTP.
        req.body = result.data;
        next();
    };
}