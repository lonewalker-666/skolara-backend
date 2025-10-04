-- CreateTable
CREATE TABLE "development"."scholarships" (
    "id" SERIAL NOT NULL,
    "college_id" INTEGER NOT NULL,
    "schemes" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scholarships_pkey" PRIMARY KEY ("id")
);
