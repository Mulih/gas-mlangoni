-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PLACED', 'ESCROW_HELD', 'DISPATCHING', 'DISPATCH_TIMEOUT', 'ASSIGNED', 'EN_ROUTE', 'AUDIT_IN_PROCESS', 'AUDIT_FAILED', 'DELIVERED', 'PAYOUT_RELEASED', 'COMPLETED', 'CANCELLED', 'REFUNDED');

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "rider_id" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PLACED',
    "delivery_mode" TEXT NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "orders_customer_id_idx" ON "orders"("customer_id");

-- CreateIndex
CREATE INDEX "orders_vendor_id_idx" ON "orders"("vendor_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "riders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
