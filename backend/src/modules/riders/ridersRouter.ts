 import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { validate } from "../../middleware/validate";
import { createRidersSchema, RegisterPushTokenSchema } from "./ridersSchemas";

export const ridersRouter = Router();

ridersRouter.post("/", validate(createRidersSchema), async (req, res) => {
    const { name, phone } = req.body;

    // status isn't set here - it uses the schema's @defaul(OFFLINE), the
    // only valid starting state for a newly registered rider.
    const rider = await prisma.rider.create({
        data: { name, phone },
    });

    res.status(201).json(rider);
});

ridersRouter.patch<{ riderId: string }>(
    "/:riderId/push-token",
    validate(RegisterPushTokenSchema),
    async (req, res) => {
        const rider = await prisma.rider.update({
            where: { id: req.params.riderId },
            data: { pushToken: req.params.pushToken },
        });
        res.json(rider);
    },
);