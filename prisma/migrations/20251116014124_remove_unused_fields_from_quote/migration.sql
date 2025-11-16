/*
  Warnings:

  - You are about to drop the column `amount` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `details` on the `Quote` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Quote" DROP COLUMN "amount",
DROP COLUMN "details";
