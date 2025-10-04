/*
  Warnings:

  - Made the column `criteria` on table `eligibility_criteria` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "development"."eligibility_criteria" ALTER COLUMN "criteria" SET NOT NULL;
