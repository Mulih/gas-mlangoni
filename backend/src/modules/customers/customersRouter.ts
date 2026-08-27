import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { validate } from "../../middleware/validate";
import { createCustomerSchema, createAddressSchema } from "./customersSchema";

export const customersRouter = Router();

// GET /customers/:customerId - fetch one customer, including all of their
// saved addresses. First query in this project that reads across a
// relation, not just a single table.
customersRouter.get("/:customerId", async (req, res) => {
    // Express pulls the ":customerId" part of the URL into req.params,
    // always as a string, regardless of what it looks like.
    const { customerId } = req.params;

    //`include` tells Prisma to also fetch the related Address rows in the
    // same call, instead of writing a second query afterward yourself.
    const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: { addresses: true },
    });

    // findUnique returns null, not an error, when nothing matches - has to
    // be checked explicitly, or a missing customer would silently come back
    // as a confusing 200 with an empty body instead of a real 404.
    if (!customer) {
        return res.status(404).json({ error: "customer not found" });
    }

    // `customer` already contains an `addresses` array here, populated by
    // the `include` above
    res.json(customer);
});

// POST /customers/:customerId/addresses - add an existing
// customer, Nestedunder /customers/:customerId because an address only
// ever makes sense attached to the customer that owns it - it isn't a 
// standalone resource on its own.
customersRouter.post<{ customerId: string }>(
    "/:customerId/addresses", 
    validate(createAddressSchema),
    async (req, res) => {
      const { customerId } = req.params;
      const { estateName, gpsLat, gpsLng } = req.body;

    // Same "just enough to prove it works" validation as the Customer route
    // - a ral validation layer would be more robust, but this is just a demo.
    if (typeof estateName !== "string" || estateName.length === 0) {
        return res.status(400).json({ error: "estateName is required" });
    }

    const address = await prisma.address.create({
        data: {
            // actual link: setting the foreign key tcolumn to the 
            // customer id from the URL
            customerId,
            estateName,
            gpsLat,
            gpsLng,
        },
    });

    res.status(201).json(address);
})

customersRouter.post("/", validate(createCustomerSchema), async (req, res) => {
    const { phone, name } = req.body;

    if (typeof phone !== "string" || phone.length === 0) {
        return res.status(400).json({ error: "phone is required" })
    }

    const customer = await prisma.customer.create({
        data: { phone, name },
    });

    res.status(201).json(customer);
});