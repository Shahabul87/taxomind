-- Migration: Simplify MathExplanation Schema
-- This migration consolidates redundant fields and adds new features

-- Step 1: Add new columns (before removing old ones to preserve data)
ALTER TABLE "MathExplanation" ADD COLUMN IF NOT EXISTS "latexEquation" TEXT;
ALTER TABLE "MathExplanation" ADD COLUMN IF NOT EXISTS "explanation" TEXT;
ALTER TABLE "MathExplanation" ADD COLUMN IF NOT EXISTS "position" INTEGER DEFAULT 0;

-- Step 2: Migrate existing data to new columns
-- Consolidate equation data: prefer 'equation' field, fallback to 'latex'
UPDATE "MathExplanation"
SET "latexEquation" = COALESCE("equation", "latex")
WHERE "latexEquation" IS NULL;

-- Consolidate explanation data: use 'content' field
UPDATE "MathExplanation"
SET "explanation" = COALESCE("content", '')
WHERE "explanation" IS NULL OR "explanation" = '';

-- Set default position based on creation order
WITH numbered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY "sectionId" ORDER BY "createdAt") - 1 AS row_num
  FROM "MathExplanation"
)
UPDATE "MathExplanation"
SET position = numbered.row_num
FROM numbered
WHERE "MathExplanation".id = numbered.id;

-- Step 3: Make explanation NOT NULL (after migration)
ALTER TABLE "MathExplanation" ALTER COLUMN "explanation" SET NOT NULL;

-- Step 4: Drop redundant columns
ALTER TABLE "MathExplanation" DROP COLUMN IF EXISTS "latex";
ALTER TABLE "MathExplanation" DROP COLUMN IF EXISTS "equation";
ALTER TABLE "MathExplanation" DROP COLUMN IF EXISTS "content";
ALTER TABLE "MathExplanation" DROP COLUMN IF EXISTS "mode";

-- Step 5: Add composite index for better query performance
CREATE INDEX IF NOT EXISTS "MathExplanation_sectionId_position_idx"
ON "MathExplanation"("sectionId", "position");

-- Step 6: Update column types for optimization
ALTER TABLE "MathExplanation" ALTER COLUMN "title" TYPE VARCHAR(200);
ALTER TABLE "MathExplanation" ALTER COLUMN "imageUrl" TYPE VARCHAR(500);
