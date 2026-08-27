-- CreateEnum
CREATE TYPE "PermitStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "epra_permit_number" TEXT,
    "permit_status" "PermitStatus" NOT NULL DEFAULT 'PENDING',
    "permit_expiry" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);
