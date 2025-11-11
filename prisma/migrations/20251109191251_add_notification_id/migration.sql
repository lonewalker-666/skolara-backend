/*
  Warnings:

  - Added the required column `notificationId` to the `notifications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "development"."notifications" ADD COLUMN     "notificationId" VARCHAR(255) NOT NULL;
