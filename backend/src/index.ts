import "./instrument";
import express from "express";
import { requestId } from "./middleware/requestId";
import { customersRouter } from "./modules/customers/customersRouter";
import { vendorsRouter } from "./modules/vendors/vendorsRouter";
import { cylinderPricesRouter } from "./modules/cylinderPrices/cylinderPricesRouter";
import { ridersRouter } from "./modules/riders/ridersRouter";
import { ordersRouter } from "./modules/orders/ordersRouter";
import { paymentsRouter } from "./modules/payments/paymentsRouter";



const app = express(); // web server
const port = 3000;  // the port it listens on


app.use(express.json()); // read JSON request bodies
app.use(requestId); // every route gets an id

app.use("/customers", customersRouter);
app.use("/vendors", vendorsRouter);
app.use("/cylinder-prices", cylinderPricesRouter);
app.use("/riders", ridersRouter);
app.use(ordersRouter);
app.use("/payments", paymentsRouter);

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

app.use(
    (err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
        const rid = req.requestId;
        // Prisma database errors carry a "code"
        if (
            err &&
            typeof err === "object" &&
            "code" in err &&
            typeof (err as { code: unknown }).code === "string" &&
            (err as { code: string }).code.startsWith("P")
        ) {
            const prismaErr = err as { code: string; meta?: unknown};
            // Logged in full server-side 
            console.error(`[${rid}] Prisma error:`, prismaErr.code, prismaErr.meta);

            return res.status(400).json({ error: prismaErr.code, meta: prismaErr.meta });
        }

        console.error(`[${rid}] Unexpected error:`, err);
        res.status(500).json({error: "Internal server error", requestId: rid  });
    },
);



app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});