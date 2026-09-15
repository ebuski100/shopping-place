-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deliveryNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "orderNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "promotionalNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "theme" TEXT NOT NULL DEFAULT 'system';
