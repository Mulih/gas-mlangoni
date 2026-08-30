-- CreateEnum
CREATE TYPE "RiderStatus" AS ENUM ('OFFLINE', 'AVAILABLE', 'ON_DELIVERY');

-- CreateTable
CREATE TABLE "riders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "RiderStatus" NOT NULL DEFAULT 'OFFLINE',

    CONSTRAINT "riders_pkey" PRIMARY KEY ("id")
);
