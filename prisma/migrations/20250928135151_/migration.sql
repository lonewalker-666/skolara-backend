/*
  Warnings:

  - You are about to drop the column `application_status_id` on the `application_tracking` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[college_id,user_id,is_active]` on the table `applied_colleges` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `degree` to the `applied_colleges` table without a default value. This is not possible if the table is not empty.
  - Made the column `is_active` on table `applied_colleges` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "development"."application_tracking" DROP CONSTRAINT "application_tracking_application_status_id_fkey";

-- DropIndex
DROP INDEX "development"."application_tracking_application_id_application_status_id_key";

-- DropIndex
DROP INDEX "development"."application_tracking_application_status_id_idx";

-- DropIndex
DROP INDEX "development"."applied_colleges_college_id_user_id_idx";

-- AlterTable
ALTER TABLE "development"."application_tracking" DROP COLUMN "application_status_id",
ADD COLUMN     "application_statusId" INTEGER;

-- AlterTable
ALTER TABLE "development"."applied_colleges" ADD COLUMN     "amount" DECIMAL(12,2),
ADD COLUMN     "application_status_id" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "degree" VARCHAR(100) NOT NULL,
ALTER COLUMN "is_active" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "applied_colleges_college_id_user_id_is_active_key" ON "development"."applied_colleges"("college_id", "user_id", "is_active");

-- AddForeignKey
ALTER TABLE "development"."applied_colleges" ADD CONSTRAINT "applied_colleges_application_status_id_fkey" FOREIGN KEY ("application_status_id") REFERENCES "development"."application_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development"."application_tracking" ADD CONSTRAINT "application_tracking_application_statusId_fkey" FOREIGN KEY ("application_statusId") REFERENCES "development"."application_status"("id") ON DELETE SET NULL ON UPDATE CASCADE;
