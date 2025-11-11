/*
  Warnings:

  - You are about to drop the column `complaint` on the `complaints` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[question]` on the table `complaints` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `answer` to the `complaints` table without a default value. This is not possible if the table is not empty.
  - Added the required column `question` to the `complaints` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "development"."complaints_complaint_key";

-- AlterTable
ALTER TABLE "development"."complaints" DROP COLUMN "complaint",
ADD COLUMN     "answer" VARCHAR(2000) NOT NULL,
ADD COLUMN     "question" VARCHAR(255) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "complaints_question_key" ON "development"."complaints"("question");
