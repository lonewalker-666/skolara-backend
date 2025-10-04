/*
  Warnings:

  - You are about to drop the column `duration_months` on the `college_degree_fee_range` table. All the data in the column will be lost.
  - Added the required column `duration_months` to the `degree` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "development"."college_degree_fee_range" DROP COLUMN "duration_months";

-- AlterTable
ALTER TABLE "development"."degree" ADD COLUMN     "duration_months" INTEGER NOT NULL;
