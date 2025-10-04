-- AlterTable
ALTER TABLE "development"."applied_colleges" ADD COLUMN     "accepted_at" TIMESTAMPTZ(6),
ADD COLUMN     "applied_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "documents_verified_at" TIMESTAMPTZ(6),
ADD COLUMN     "paid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paid_at" TIMESTAMPTZ(6),
ADD COLUMN     "ready_to_pay" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reviewed_at" TIMESTAMPTZ(6),
ADD COLUMN     "submitted_at" TIMESTAMPTZ(6);
