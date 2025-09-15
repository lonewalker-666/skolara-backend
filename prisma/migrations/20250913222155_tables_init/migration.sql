-- CreateEnum
CREATE TYPE "user_gender" AS ENUM ('Male', 'Female', 'Others');

-- CreateEnum
CREATE TYPE "user_theme" AS ENUM ('Light', 'Dark');

-- CreateEnum
CREATE TYPE "currency_type" AS ENUM ('INR');

-- CreateEnum
CREATE TYPE "billing_cycle_type" AS ENUM ('Yearly', 'Semester', 'Monthly');

-- CreateEnum
CREATE TYPE "order_status_type" AS ENUM ('Created', 'Cancelled', 'Failed', 'Paid');

-- CreateEnum
CREATE TYPE "payment_provider" AS ENUM ('RazorPay');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "mobile" VARCHAR(10) NOT NULL,
    "first_name" VARCHAR(255) NOT NULL,
    "last_name" VARCHAR(255) NOT NULL,
    "dob" DATE,
    "gender" "user_gender",
    "ref_id" UUID NOT NULL,
    "mobile_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "prefered_course_type" INTEGER,
    "prefered_theme" "user_theme" NOT NULL DEFAULT 'Light',
    "allow_notifications" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "college_type" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "college_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "college" (
    "id" SERIAL NOT NULL,
    "ref_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "area" VARCHAR(255) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "website" VARCHAR(255) NOT NULL,
    "college_type_id" INTEGER NOT NULL,
    "deadline" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "logo_url" VARCHAR(500) NOT NULL,
    "cover_url" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "college_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "degree_type" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "short_name" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "degree_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "degree" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "degree_type_id" INTEGER NOT NULL,
    "specialization" VARCHAR(255),
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "degree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "college_degree_fee_range" (
    "id" SERIAL NOT NULL,
    "college_id" INTEGER NOT NULL,
    "degree_id" INTEGER NOT NULL,
    "academic_year" VARCHAR(20) NOT NULL,
    "year" VARCHAR(4) NOT NULL,
    "min_annual_fee" DECIMAL(12,2),
    "max_annual_fee" DECIMAL(12,2),
    "duration_months" INTEGER NOT NULL,
    "application_fee" DECIMAL(12,2),
    "currency" "currency_type" NOT NULL DEFAULT 'INR',
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "college_degree_fee_range_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_sharing_type" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hostel_sharing_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hostel_facility" (
    "id" SERIAL NOT NULL,
    "college_id" INTEGER NOT NULL,
    "gender" "user_gender" NOT NULL,
    "hostel_sharing_type_id" INTEGER NOT NULL,
    "ac" BOOLEAN NOT NULL DEFAULT false,
    "room_fee" DECIMAL(12,2),
    "mess_fee" DECIMAL(12,2),
    "billing_cycle" "billing_cycle_type",
    "currency" "currency_type",
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hostel_facility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entrance_exam" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entrance_exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eligibility_criteria" (
    "id" SERIAL NOT NULL,
    "college_id" INTEGER NOT NULL,
    "degree_id" INTEGER NOT NULL,
    "criteria" TEXT,
    "entrance_exam_id" INTEGER,
    "min_percentage" DECIMAL(3,2),
    "max_percentage" DECIMAL(3,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "eligibility_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_colleges" (
    "id" SERIAL NOT NULL,
    "college_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "saved_colleges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_status" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applied_colleges" (
    "id" SERIAL NOT NULL,
    "college_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applied_colleges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_tracking" (
    "id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "application_status_id" INTEGER NOT NULL DEFAULT 1,
    "ssl_marksheet" VARCHAR(255),
    "hsc_marksheet" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "top_recruiters" (
    "id" SERIAL NOT NULL,
    "college_id" INTEGER NOT NULL,
    "company" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "top_recruiters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "college_placement_stats" (
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
CREATE TABLE "placement_cell_info" (
    "id" SERIAL NOT NULL,
    "college_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "placement_cell_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "user_id" INTEGER NOT NULL,
    "application_id" UUID NOT NULL,
    "provider" "payment_provider" NOT NULL,
    "provider_order_id" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "currency_type" NOT NULL DEFAULT 'INR',
    "status" "order_status_type" NOT NULL DEFAULT 'Created',
    "receipt_no" VARCHAR(100),
    "meta" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "provider_payment_id" VARCHAR(255) NOT NULL,
    "verification_signature" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "currency_type",
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
CREATE TABLE "otp_verification" (
    "id" UUID NOT NULL,
    "mobile" VARCHAR(10) NOT NULL,
    "otp" VARCHAR(6) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "verified" BOOLEAN,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_mobile_key" ON "users"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "users_ref_id_key" ON "users"("ref_id");

-- CreateIndex
CREATE UNIQUE INDEX "college_type_name_key" ON "college_type"("name");

-- CreateIndex
CREATE UNIQUE INDEX "college_ref_id_key" ON "college"("ref_id");

-- CreateIndex
CREATE UNIQUE INDEX "degree_type_name_key" ON "degree_type"("name");

-- CreateIndex
CREATE INDEX "degree_name_idx" ON "degree"("name");

-- CreateIndex
CREATE UNIQUE INDEX "degree_name_specialization_key" ON "degree"("name", "specialization");

-- CreateIndex
CREATE INDEX "college_degree_fee_range_college_id_idx" ON "college_degree_fee_range"("college_id");

-- CreateIndex
CREATE INDEX "college_degree_fee_range_degree_id_idx" ON "college_degree_fee_range"("degree_id");

-- CreateIndex
CREATE UNIQUE INDEX "college_degree_fee_range_college_id_degree_id_academic_year_key" ON "college_degree_fee_range"("college_id", "degree_id", "academic_year");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_sharing_type_name_key" ON "hostel_sharing_type"("name");

-- CreateIndex
CREATE INDEX "hostel_facility_college_id_idx" ON "hostel_facility"("college_id");

-- CreateIndex
CREATE UNIQUE INDEX "hostel_facility_college_id_hostel_sharing_type_id_gender_ac_key" ON "hostel_facility"("college_id", "hostel_sharing_type_id", "gender", "ac");

-- CreateIndex
CREATE UNIQUE INDEX "entrance_exam_name_key" ON "entrance_exam"("name");

-- CreateIndex
CREATE INDEX "eligibility_criteria_college_id_idx" ON "eligibility_criteria"("college_id");

-- CreateIndex
CREATE INDEX "eligibility_criteria_degree_id_idx" ON "eligibility_criteria"("degree_id");

-- CreateIndex
CREATE UNIQUE INDEX "eligibility_criteria_college_id_degree_id_key" ON "eligibility_criteria"("college_id", "degree_id");

-- CreateIndex
CREATE INDEX "saved_colleges_college_id_idx" ON "saved_colleges"("college_id");

-- CreateIndex
CREATE INDEX "saved_colleges_user_id_idx" ON "saved_colleges"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "saved_colleges_college_id_user_id_key" ON "saved_colleges"("college_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "application_status_name_key" ON "application_status"("name");

-- CreateIndex
CREATE INDEX "applied_colleges_college_id_idx" ON "applied_colleges"("college_id");

-- CreateIndex
CREATE INDEX "applied_colleges_user_id_idx" ON "applied_colleges"("user_id");

-- CreateIndex
CREATE INDEX "applied_colleges_college_id_user_id_idx" ON "applied_colleges"("college_id", "user_id");

-- CreateIndex
CREATE INDEX "application_tracking_application_id_idx" ON "application_tracking"("application_id");

-- CreateIndex
CREATE INDEX "application_tracking_application_status_id_idx" ON "application_tracking"("application_status_id");

-- CreateIndex
CREATE UNIQUE INDEX "application_tracking_application_id_application_status_id_key" ON "application_tracking"("application_id", "application_status_id");

-- CreateIndex
CREATE UNIQUE INDEX "top_recruiters_college_id_key" ON "top_recruiters"("college_id");

-- CreateIndex
CREATE INDEX "college_placement_stats_college_id_idx" ON "college_placement_stats"("college_id");

-- CreateIndex
CREATE UNIQUE INDEX "college_placement_stats_college_id_year_key" ON "college_placement_stats"("college_id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "placement_cell_info_college_id_key" ON "placement_cell_info"("college_id");

-- CreateIndex
CREATE INDEX "placement_cell_info_college_id_idx" ON "placement_cell_info"("college_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_provider_order_id_key" ON "orders"("provider_order_id");

-- CreateIndex
CREATE INDEX "orders_application_id_idx" ON "orders"("application_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_user_id_idx" ON "orders"("user_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");

-- AddForeignKey
ALTER TABLE "college" ADD CONSTRAINT "college_college_type_id_fkey" FOREIGN KEY ("college_type_id") REFERENCES "college_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "degree" ADD CONSTRAINT "degree_degree_type_id_fkey" FOREIGN KEY ("degree_type_id") REFERENCES "degree_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "college_degree_fee_range" ADD CONSTRAINT "college_degree_fee_range_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "college"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "college_degree_fee_range" ADD CONSTRAINT "college_degree_fee_range_degree_id_fkey" FOREIGN KEY ("degree_id") REFERENCES "degree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_facility" ADD CONSTRAINT "hostel_facility_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "college"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hostel_facility" ADD CONSTRAINT "hostel_facility_hostel_sharing_type_id_fkey" FOREIGN KEY ("hostel_sharing_type_id") REFERENCES "hostel_sharing_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eligibility_criteria" ADD CONSTRAINT "eligibility_criteria_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "college"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eligibility_criteria" ADD CONSTRAINT "eligibility_criteria_degree_id_fkey" FOREIGN KEY ("degree_id") REFERENCES "degree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eligibility_criteria" ADD CONSTRAINT "eligibility_criteria_entrance_exam_id_fkey" FOREIGN KEY ("entrance_exam_id") REFERENCES "entrance_exam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_colleges" ADD CONSTRAINT "saved_colleges_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "college"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_colleges" ADD CONSTRAINT "saved_colleges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applied_colleges" ADD CONSTRAINT "applied_colleges_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "college"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applied_colleges" ADD CONSTRAINT "applied_colleges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_tracking" ADD CONSTRAINT "application_tracking_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applied_colleges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_tracking" ADD CONSTRAINT "application_tracking_application_status_id_fkey" FOREIGN KEY ("application_status_id") REFERENCES "application_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "top_recruiters" ADD CONSTRAINT "top_recruiters_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "college"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "college_placement_stats" ADD CONSTRAINT "college_placement_stats_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "college"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_cell_info" ADD CONSTRAINT "placement_cell_info_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "college"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
