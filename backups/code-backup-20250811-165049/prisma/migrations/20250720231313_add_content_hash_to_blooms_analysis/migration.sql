-- AlterTable
ALTER TABLE "CourseBloomsAnalysis" ADD COLUMN     "contentHash" TEXT;

-- CreateIndex
CREATE INDEX "CourseBloomsAnalysis_contentHash_idx" ON "CourseBloomsAnalysis"("contentHash");
