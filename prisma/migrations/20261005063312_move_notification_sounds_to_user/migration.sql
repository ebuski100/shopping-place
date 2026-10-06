/*
  Warnings:

  - You are about to drop the column `notificationSounds` on the `Notification` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "notificationSounds";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notificationSounds" BOOLEAN NOT NULL DEFAULT true;
