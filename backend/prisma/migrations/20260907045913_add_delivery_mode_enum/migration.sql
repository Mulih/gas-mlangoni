/*
  Warnings:

  - Changed the type of `delivery_mode` on the `orders` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "DeliveryMode" AS ENUM ('ON_DEMAND', 'SCHEDULED');

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "delivery_mode",
ADD COLUMN     "delivery_mode" "DeliveryMode" NOT NULL;
