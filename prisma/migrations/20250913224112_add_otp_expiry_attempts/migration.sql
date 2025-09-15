/*
  Warnings:

  - Added the required column `expires_at` to the `otp_verification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "otp_verification" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "expires_at" TIMESTAMPTZ(6) NOT NULL;

-- CreateIndex
CREATE INDEX "otp_verification_mobile_created_at_idx" ON "otp_verification"("mobile", "created_at");
