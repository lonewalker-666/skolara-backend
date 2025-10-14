/*
  Warnings:

  - A unique constraint covering the columns `[ref_id]` on the table `applied_colleges` will be added. If there are existing duplicate values, this will fail.
  - The required column `ref_id` was added to the `applied_colleges` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "development"."applied_colleges" ADD COLUMN     "ref_id" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "applied_colleges_ref_id_key" ON "development"."applied_colleges"("ref_id");
