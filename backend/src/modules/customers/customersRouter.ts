import { Router } from "express";
import { prisma } from "../../lib/prisma";

export const customersRouter = Router();

customersRouter.post("/", async (req, res) => {
    const { phone, name } = req.body;

    if (typeof phone !== "string" || phone.length === 0) {
        return res.status(400).json({ error: "phone is required" })
    }

    const customer = await prisma.customer.create({
        data: { phone, name },
    });

    res.status(201).json(customer);
});