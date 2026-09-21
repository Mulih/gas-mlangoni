-- CreateTable
CREATE TABLE "weight_audit_logs" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "measured_weight" DOUBLE PRECISION NOT NULL,
    "customer_confirmed" BOOLEAN NOT NULL DEFAULT true,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weight_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weight_audit_logs_order_id_key" ON "weight_audit_logs"("order_id");

-- AddForeignKey
ALTER TABLE "weight_audit_logs" ADD CONSTRAINT "weight_audit_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
