/*
  Warnings:

  - A unique constraint covering the columns `[phone]` on the table `riders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `phone` to the `riders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "riders" ADD COLUMN     "phone" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "riders_phone_key" ON "riders"("phone");
