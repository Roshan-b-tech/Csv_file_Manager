-- AlterTable
ALTER TABLE "User" ADD COLUMN     "receiveCsvImportNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "receiveProductUpdates" BOOLEAN NOT NULL DEFAULT true;
