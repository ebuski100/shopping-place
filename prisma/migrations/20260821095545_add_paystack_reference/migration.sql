/*
  Warnings:

  - You are about to drop the column `paymentProvider` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `paymentReference` on the `Order` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[payStackReference]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Order_paymentReference_key";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "paymentProvider",
DROP COLUMN "paymentReference",
ADD COLUMN     "payStackReference" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_payStackReference_key" ON "Order"("payStackReference");
