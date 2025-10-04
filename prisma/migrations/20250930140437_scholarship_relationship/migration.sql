-- CreateIndex
CREATE INDEX "scholarships_college_id_idx" ON "development"."scholarships"("college_id");

-- AddForeignKey
ALTER TABLE "development"."scholarships" ADD CONSTRAINT "scholarships_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "development"."college"("id") ON DELETE CASCADE ON UPDATE CASCADE;
