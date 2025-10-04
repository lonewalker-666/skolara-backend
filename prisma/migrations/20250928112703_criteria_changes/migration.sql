/*
  Warnings:

  - You are about to drop the column `degree_id` on the `eligibility_criteria` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[college_id,criteria_type]` on the table `eligibility_criteria` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "development"."eligibility_criteria" DROP CONSTRAINT "eligibility_criteria_degree_id_fkey";

-- DropIndex
DROP INDEX "development"."eligibility_criteria_college_id_degree_id_criteria_type_key";

-- DropIndex
DROP INDEX "development"."eligibility_criteria_degree_id_idx";

-- AlterTable
ALTER TABLE "development"."eligibility_criteria" DROP COLUMN "degree_id";

-- CreateIndex
CREATE UNIQUE INDEX "eligibility_criteria_college_id_criteria_type_key" ON "development"."eligibility_criteria"("college_id", "criteria_type");
