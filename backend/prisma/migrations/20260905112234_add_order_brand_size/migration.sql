/*
  Warnings:

  - Added the required column `brand` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "brand" TEXT NOT NULL,
ADD COLUMN     "size" TEXT NOT NULL;
