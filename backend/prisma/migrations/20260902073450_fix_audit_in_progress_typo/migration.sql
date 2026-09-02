/*
  Warnings:

  - The values [AUDIT_IN_PROCESS] on the enum `OrderStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderStatus_new" AS ENUM ('PLACED', 'ESCROW_HELD', 'DISPATCHING', 'DISPATCH_TIMEOUT', 'ASSIGNED', 'EN_ROUTE', 'AUDIT_IN_PROGRESS', 'AUDIT_FAILED', 'DELIVERED', 'PAYOUT_RELEASED', 'COMPLETED', 'CANCELLED', 'REFUNDED');
ALTER TABLE "public"."orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "status" TYPE "OrderStatus_new" USING ("status"::text::"OrderStatus_new");
ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";
ALTER TYPE "OrderStatus_new" RENAME TO "OrderStatus";
DROP TYPE "public"."OrderStatus_old";
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PLACED';
COMMIT;
