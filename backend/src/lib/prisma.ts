import { PrismaClient } from "../generated/prisma/client";

// One shared instance for the whole app. Creating a new PrismaClient per
// request would open a new connection pool each time and exhaust Postgres's
// connection limit under any real load- this is a common first mistake
export const prisma = new PrismaClient();