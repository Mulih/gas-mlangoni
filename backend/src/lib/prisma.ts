import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";


const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000, // fail fast instead of hanging on a bad connection
    max: 10
});
// One shared instance for the whole app. Creating a new PrismaClient per
// request would open a new connection pool each time and exhaust Postgres's
// connection limit under any real load- this is a common first mistake
export const prisma = new PrismaClient({ adapter });
