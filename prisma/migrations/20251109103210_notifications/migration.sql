-- CreateEnum
CREATE TYPE "development"."priority" AS ENUM ('High', 'Medium', 'Low');

-- CreateTable
CREATE TABLE "development"."complaints" (
    "id" SERIAL NOT NULL,
    "complaint" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "development"."user_compliance" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "complaint_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_compliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "development"."notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "subtitle" VARCHAR(255) NOT NULL,
    "imageUrl" VARCHAR(1000),
    "navigationUrl" VARCHAR(1000),
    "priority" "development"."priority" NOT NULL DEFAULT 'Medium',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "complaints_complaint_key" ON "development"."complaints"("complaint");

-- AddForeignKey
ALTER TABLE "development"."user_compliance" ADD CONSTRAINT "user_compliance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "development"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development"."user_compliance" ADD CONSTRAINT "user_compliance_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "development"."complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "development"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
