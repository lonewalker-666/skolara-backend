/*
  Warnings:

  - A unique constraint covering the columns `[notificationId]` on the table `notifications` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "notifications_notificationId_key" ON "development"."notifications"("notificationId");
