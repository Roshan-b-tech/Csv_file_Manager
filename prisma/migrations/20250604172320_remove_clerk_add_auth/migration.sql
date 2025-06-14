/*
  Warnings:

  - You are about to drop the column `clerkId` on the `User` table. All the data in the column will be lost.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "CsvColumn_name_csvFileId_key";

-- DropIndex
DROP INDEX "User_clerkId_key";

-- AlterTable
ALTER TABLE "CsvColumn" ALTER COLUMN "type" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "clerkId",
ADD COLUMN     "password" TEXT NOT NULL;
