/*
  Warnings:

  - You are about to drop the `application_tracking` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `sslc_path` to the `applied_colleges` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "development"."application_tracking" DROP CONSTRAINT "application_tracking_application_id_fkey";

-- DropForeignKey
ALTER TABLE "development"."application_tracking" DROP CONSTRAINT "application_tracking_application_statusId_fkey";

-- AlterTable
ALTER TABLE "development"."applied_colleges" ADD COLUMN     "hsc_path" TEXT,
ADD COLUMN     "sslc_path" TEXT NOT NULL;

-- DropTable
DROP TABLE "development"."application_tracking";
