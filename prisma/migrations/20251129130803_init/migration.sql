-- CreateEnum
CREATE TYPE "development"."user_gender" AS ENUM ('Male', 'Female', 'Others');

-- CreateEnum
CREATE TYPE "development"."user_theme" AS ENUM ('Light', 'Dark');

-- CreateEnum
CREATE TYPE "development"."currency_type" AS ENUM ('INR');

-- CreateEnum
CREATE TYPE "development"."billing_cycle_type" AS ENUM ('Yearly', 'Semester', 'Monthly');

-- CreateEnum
CREATE TYPE "development"."order_status_type" AS ENUM ('Created', 'Cancelled', 'Failed', 'Paid');

-- CreateEnum
CREATE TYPE "development"."payment_provider" AS ENUM ('RazorPay');

-- CreateEnum
CREATE TYPE "development"."priority" AS ENUM ('High', 'Medium', 'Low');

-- CreateTable
CREATE TABLE "development"."users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "mobile" VARCHAR(10) NOT NULL,
    "first_name" VARCHAR(255) NOT NULL,
    "last_name" VARCHAR(255) NOT NULL,
    "dob" DATE,
    "gender" "development"."user_gender",
    "ref_id" UUID NOT NULL,
    "mobile_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "prefered_course_type" INTEGER,
    "prefered_theme" "development"."user_theme" NOT NULL DEFAULT 'Light',
    "allow_notifications" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "development"."complaints" (
    "id" SERIAL NOT NULL,
    "question" VARCHAR(255) NOT NULL,
    "answer" VARCHAR(2000) NOT NULL,
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
    "notificationId" VARCHAR(255) NOT NULL,
    "subtitle" VARCHAR(255) NOT NULL,
    "imageUrl" VARCHAR(1000),
    "navigationUrl" VARCHAR(1000),
    "priority" "development"."priority" NOT NULL DEFAULT 'Medium',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "development"."college_type" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "college_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "development"."college" (
    "id" SERIAL NOT NULL,
    "ref_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "short_name" VARCHAR(30),
    "area" VARCHAR(255) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "website" VARCHAR(255) NOT NULL,
    "college_type_id" INTEGER NOT NULL,
    "fee_details" TEXT,
    "ug_courses" TEXT,
    "pg_courses" TEXT,
    "doctoral_courses" TEXT,
    "deadline" DATE,
    "description" TEXT NOT NULL,
    "logo_url" VARCHAR(500) NOT NULL,
    "cover_url" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "college_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "development"."degree_type" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "short_name" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "degree_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "development"."degree" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "degree_type_id" INTEGER NOT NULL,
    "specialization" VARCHAR(255),
    "duration_months" INTEGER NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "degree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "development"."college_degree_fee_range" (
    "id" SERIAL NOT NULL,
    "college_id" INTEGER NOT NULL,
    "degree_id" INTEGER NOT NULL,
    "academic_year" VARCHAR(20) NOT NULL,
    "year" VARCHAR(4) NOT NULL,
    "min_annual_fee" DECIMAL(12,2),
    "max_annual_fee" DECIMAL(12,2),
    "application_fee" DECIMAL(12,2),
    "currency" "development"."currency_type" NOT NULL DEFAULT 'INR',
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "college_degree_fee_range_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "development"."hostel_sharing_type" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hostel_sharing_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "development"."hostel_facility" (
    "id" SERIAL NOT NULL,
    "college_id" INTEGER NOT NULL,
    "gender" "development"."user_gender" NOT NULL,
    "hostel_sharing_type_id" INTEGER NOT NULL,
    "ac" BOOLEAN NOT NULL DEFAULT false,
    "room_fee" DECIMAL(12,2),
    "mess_fee" DECIMAL(12,2),
    "billing_cycle" "development"."billing_cycle_type",
    "currency" "development"."currency_type",
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hostel_facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "development"."eligibility_criteria" (
    "id" SERIAL NOT NULL,
    "college_id" INTEGER NOT NULL,
    "criteria_type" VARCHAR(255) NOT NULL,
    "criteria" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eligibility_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "development"."scholarships" (
    "id" SERIAL NOT NULL,
    "college_id" INTEGER NOT NULL,
    "schemes" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scholarships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "development"."saved_colleges" (
    "id" SERIAL NOT NULL,
    "college_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "saved_colleges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "development"."application_status" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "development"."applied_colleges" (
    "id" SERIAL NOT NULL,
    "college_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "application_status_id" INTEGER NOT NULL DEFAULT 1,
    "ref_id" UUID NOT NULL,
    "amount" DECIMAL(12,2),
    "hsc_path" TEXT,
    "sslc_path" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "ready_to_pay" BOOLEAN NOT NULL DEFAULT false,
    "paid_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMPTZ(6),
    "reviewed_at" TIMESTAMPTZ(6),
    "accepted_at" TIMESTAMPTZ(6),
    "documents_verified_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applied_colleges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "development"."top_recruiters" (
    "id" SERIAL NOT NULL,
    "college_id" INTEGER NOT NULL,
    "company" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "top_recruiters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "development"."college_placement_stats" (
    "id" SERIAL NOT NULL,
    "college_id" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "min_package_lpa" DECIMAL(8,2),
    "highest_package_lpa" DECIMAL(8,2),
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "college_placement_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "development"."placement_cell_info" (
    "id" SERIAL NOT NULL,
    "college_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "placement_cell_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "development"."orders" (
    "id" UUID NOT NULL,
    "user_id" INTEGER NOT NULL,
    "application_id" UUID NOT NULL,
    "provider" "development"."payment_provider" NOT NULL,
    "provider_order_id" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "development"."currency_type" NOT NULL DEFAULT 'INR',
    "status" "development"."order_status_type" NOT NULL DEFAULT 'Created',
    "receipt_no" VARCHAR(100),
    "meta" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "development"."payments" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "provider_payment_id" VARCHAR(255) NOT NULL,
    "verification_signature" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "development"."currency_type",
    "status" BOOLEAN,
    "method" VARCHAR(50),
    "captured_at" TIMESTAMPTZ(6),
    "failure_reason" TEXT,
    "meta" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "development"."otp_verification" (
    "id" UUID NOT NULL,
    "mobile" VARCHAR(10) NOT NULL,
    "otp" VARCHAR(6) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "verified" BOOLEAN,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "development"."app_data_migration" (
    "name" TEXT NOT NULL,
    "duration_ms" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "development"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_mobile_key" ON "development"."users"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "users_ref_id_key" ON "development"."users"("ref_id");

-- CreateIndex
CREATE UNIQUE INDEX "complaints_question_key" ON "development"."complaints"("question");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_notificationId_key" ON "development"."notifications"("notificationId");

-- CreateIndex
CREATE UNIQUE INDEX "college_type_name_key" ON "development"."college_type"("name");

-- CreateIndex
CREATE UNIQUE INDEX "college_ref_id_key" ON "development"."college"("ref_id");

-- CreateIndex
CREATE UNIQUE INDEX "degree_type_name_key" ON "development"."degree_type"("name");

-- CreateIndex
CREATE INDEX "degree_name_idx" ON "development"."degree"("name");

-- CreateIndex
CREATE UNIQUE INDEX "degree_name_specialization_key" ON "development"."degree"("name", "specialization");

-- CreateIndex
CREATE INDEX "college_degree_fee_range_college_id_idx" ON "development"."college_degree_fee_range"("college_id");

-- CreateIndex
CREATE INDEX "college_degree_fee_range_degree_id_idx" ON "development"."college_degree_fee_range"("degree_id");

-- CreateIndex
CREATE UNIQUE INDEX "college_degree_fee_range_college_id_degree_id_academic_year_key" ON "development"."college_degree_fee_range"("college_id", "degree_id", "academic_year");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_sharing_type_name_key" ON "development"."hostel_sharing_type"("name");

-- CreateIndex
CREATE INDEX "hostel_facility_college_id_idx" ON "development"."hostel_facility"("college_id");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_facility_college_id_hostel_sharing_type_id_gender_ac_key" ON "development"."hostel_facility"("college_id", "hostel_sharing_type_id", "gender", "ac");

-- CreateIndex
CREATE INDEX "eligibility_criteria_college_id_idx" ON "development"."eligibility_criteria"("college_id");

-- CreateIndex
CREATE UNIQUE INDEX "eligibility_criteria_college_id_criteria_type_key" ON "development"."eligibility_criteria"("college_id", "criteria_type");

-- CreateIndex
CREATE INDEX "scholarships_college_id_idx" ON "development"."scholarships"("college_id");

-- CreateIndex
CREATE INDEX "saved_colleges_college_id_idx" ON "development"."saved_colleges"("college_id");

-- CreateIndex
CREATE INDEX "saved_colleges_user_id_idx" ON "development"."saved_colleges"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_colleges_college_id_user_id_key" ON "development"."saved_colleges"("college_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "application_status_name_key" ON "development"."application_status"("name");

-- CreateIndex
CREATE UNIQUE INDEX "applied_colleges_ref_id_key" ON "development"."applied_colleges"("ref_id");

-- CreateIndex
CREATE INDEX "applied_colleges_college_id_idx" ON "development"."applied_colleges"("college_id");

-- CreateIndex
CREATE INDEX "applied_colleges_user_id_idx" ON "development"."applied_colleges"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "applied_colleges_college_id_user_id_is_active_key" ON "development"."applied_colleges"("college_id", "user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "top_recruiters_college_id_key" ON "development"."top_recruiters"("college_id");

-- CreateIndex
CREATE INDEX "college_placement_stats_college_id_idx" ON "development"."college_placement_stats"("college_id");

-- CreateIndex
CREATE UNIQUE INDEX "college_placement_stats_college_id_year_key" ON "development"."college_placement_stats"("college_id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "placement_cell_info_college_id_key" ON "development"."placement_cell_info"("college_id");

-- CreateIndex
CREATE INDEX "placement_cell_info_college_id_idx" ON "development"."placement_cell_info"("college_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_provider_order_id_key" ON "development"."orders"("provider_order_id");

-- CreateIndex
CREATE INDEX "orders_application_id_idx" ON "development"."orders"("application_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "development"."orders"("status");

-- CreateIndex
CREATE INDEX "orders_user_id_idx" ON "development"."orders"("user_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "development"."payments"("status");

-- CreateIndex
CREATE INDEX "payments_order_id_idx" ON "development"."payments"("order_id");

-- CreateIndex
CREATE INDEX "otp_verification_mobile_is_active_idx" ON "development"."otp_verification"("mobile", "is_active");

-- CreateIndex
CREATE INDEX "otp_verification_mobile_created_at_idx" ON "development"."otp_verification"("mobile", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "app_data_migration_name_key" ON "development"."app_data_migration"("name");

-- AddForeignKey
ALTER TABLE "development"."user_compliance" ADD CONSTRAINT "user_compliance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "development"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development"."user_compliance" ADD CONSTRAINT "user_compliance_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "development"."complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "development"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development"."college" ADD CONSTRAINT "college_college_type_id_fkey" FOREIGN KEY ("college_type_id") REFERENCES "development"."college_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development"."degree" ADD CONSTRAINT "degree_degree_type_id_fkey" FOREIGN KEY ("degree_type_id") REFERENCES "development"."degree_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development"."college_degree_fee_range" ADD CONSTRAINT "college_degree_fee_range_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "development"."college"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development"."college_degree_fee_range" ADD CONSTRAINT "college_degree_fee_range_degree_id_fkey" FOREIGN KEY ("degree_id") REFERENCES "development"."degree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development"."hostel_facility" ADD CONSTRAINT "hostel_facility_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "development"."college"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development"."hostel_facility" ADD CONSTRAINT "hostel_facility_hostel_sharing_type_id_fkey" FOREIGN KEY ("hostel_sharing_type_id") REFERENCES "development"."hostel_sharing_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development"."eligibility_criteria" ADD CONSTRAINT "eligibility_criteria_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "development"."college"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development"."scholarships" ADD CONSTRAINT "scholarships_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "development"."college"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development"."saved_colleges" ADD CONSTRAINT "saved_colleges_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "development"."college"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development"."saved_colleges" ADD CONSTRAINT "saved_colleges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "development"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development"."applied_colleges" ADD CONSTRAINT "applied_colleges_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "development"."college"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development"."applied_colleges" ADD CONSTRAINT "applied_colleges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "development"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development"."applied_colleges" ADD CONSTRAINT "applied_colleges_application_status_id_fkey" FOREIGN KEY ("application_status_id") REFERENCES "development"."application_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development"."top_recruiters" ADD CONSTRAINT "top_recruiters_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "development"."college"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development"."college_placement_stats" ADD CONSTRAINT "college_placement_stats_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "development"."college"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development"."placement_cell_info" ADD CONSTRAINT "placement_cell_info_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "development"."college"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development"."orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "development"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "development"."payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "development"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
