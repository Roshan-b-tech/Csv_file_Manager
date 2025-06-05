/*
  Warnings:

  - Added the required column `rowIndex` to the `CsvRow` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CsvRow" ADD COLUMN     "rowIndex" INTEGER NOT NULL;
