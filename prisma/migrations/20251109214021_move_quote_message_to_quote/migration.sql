/*
  Warnings:

  - You are about to drop the column `quoteMessage` on the `Company` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Company" DROP COLUMN "quoteMessage";

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "quoteMessage" TEXT;
