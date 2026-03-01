-- AlterTable (safe: nullable column, no data loss)
ALTER TABLE "Course" ADD COLUMN "qualityHistory" JSONB;
