-- CreateTable
CREATE TABLE "cylinder_prices" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "cylinder_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_stock" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "inventory_stock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cylinder_prices_brand_size_key" ON "cylinder_prices"("brand", "size");

-- CreateIndex
CREATE INDEX "inventory_stock_vendor_id_idx" ON "inventory_stock"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_stock_vendor_id_brand_size_key" ON "inventory_stock"("vendor_id", "brand", "size");

-- AddForeignKey
ALTER TABLE "inventory_stock" ADD CONSTRAINT "inventory_stock_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
