import express from "express";
import { customersRouter } from "./modules/customers/customersRouter";

const app = express();
const port = 3000;


app.use(express.json());
app.use("/customers", customersRouter);

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});