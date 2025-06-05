/*
  Warnings:

  - You are about to drop the column `columnHeaders` on the `CsvFile` table. All the data in the column will be lost.
  - You are about to drop the column `fileName` on the `CsvFile` table. All the data in the column will be lost.
  - You are about to drop the column `originalName` on the `CsvFile` table. All the data in the column will be lost.
  - You are about to drop the column `rowCount` on the `CsvFile` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedAt` on the `CsvFile` table. All the data in the column will be lost.
  - You are about to drop the column `rowData` on the `CsvRow` table. All the data in the column will be lost.
  - You are about to drop the column `rowIndex` on the `CsvRow` table. All the data in the column will be lost.
  - You are about to drop the column `emailVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VerificationToken` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[clerkId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `CsvFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `CsvFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `data` to the `CsvRow` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clerkId` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropIndex
DROP INDEX "CsvRow_csvFileId_rowIndex_idx";

-- AlterTable
ALTER TABLE "CsvFile" DROP COLUMN "columnHeaders",
DROP COLUMN "fileName",
DROP COLUMN "originalName",
DROP COLUMN "rowCount",
DROP COLUMN "uploadedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "CsvRow" DROP COLUMN "rowData",
DROP COLUMN "rowIndex",
ADD COLUMN     "data" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailVerified",
DROP COLUMN "image",
ADD COLUMN     "clerkId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "email" SET NOT NULL;

-- DropTable
DROP TABLE "Account";

-- DropTable
DROP TABLE "Session";

-- DropTable
DROP TABLE "VerificationToken";

-- CreateTable
CREATE TABLE "CsvColumn" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "csvFileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CsvColumn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CsvColumn_name_csvFileId_key" ON "CsvColumn"("name", "csvFileId");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- AddForeignKey
ALTER TABLE "CsvColumn" ADD CONSTRAINT "CsvColumn_csvFileId_fkey" FOREIGN KEY ("csvFileId") REFERENCES "CsvFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
