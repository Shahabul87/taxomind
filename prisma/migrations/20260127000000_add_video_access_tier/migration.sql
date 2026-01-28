-- CreateEnum
CREATE TYPE "VideoAccessTier" AS ENUM ('FREE', 'ENROLLED', 'PREMIUM');

-- AlterTable
ALTER TABLE "Video" ADD COLUMN "accessTier" "VideoAccessTier" NOT NULL DEFAULT 'ENROLLED';
