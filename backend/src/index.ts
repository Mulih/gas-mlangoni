import express from "express";
import { customersRouter } from "./modules/customers/customersRouter";
import { vendorsRouter } from "./modules/vendors/vendorsRouter";
import { cylinderPricesRouter } from "./modules/cylinderPrices/cylinderPricesRouter";
import { ridersRouter } from "./modules/riders/ridersRouter";
import { ordersRouter } from "./modules/orders/ordersRouter";
import { getAccessToken } from "./modules/payments/darajaClient";


const app = express();
const port = 3000;


app.use(express.json());
app.use("/customers", customersRouter);
app.use("/vendors", vendorsRouter);
app.use("/cylinder-prices", cylinderPricesRouter);
app.use("/riders", ridersRouter);
app.use(ordersRouter);

app.use(
    (err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
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
            console.error("Prisma error:", prismaErr.code, prismaErr.meta);

            return res.status(400).json({ error: prismaErr.code, meta: prismaErr.meta });
        }

        console.error(" Unexpected error:", err);
        res.status(500).json({error: "Internal server error" });
    },
);

app.get("/health", async (req, res) => {
    const token = await getAccessToken();
    res.json({ status: "ok", darajaToken: token.slice(0, 10)+ "..." });
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});