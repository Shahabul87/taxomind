-- AlterTable
-- Add isFree and priceType columns to Course table
-- Applied manually to production on 2025-11-09

-- Add isFree column (allows free courses)
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "isFree" BOOLEAN DEFAULT false;

-- Add priceType column (supports different pricing models)
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "priceType" TEXT DEFAULT 'ONE_TIME';

-- Note: These columns were manually added to production database
-- This migration file documents the change for future deployments
