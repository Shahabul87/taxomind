-- AlterTable: Add missing fields to user_progress table
-- This migration is safe - all new fields are optional or have defaults

-- Add completedItems column (JSON, nullable)
ALTER TABLE "user_progress" ADD COLUMN IF NOT EXISTS "completedItems" JSONB;

-- Add overallProgress column (Float, default 0)
ALTER TABLE "user_progress" ADD COLUMN IF NOT EXISTS "overallProgress" DOUBLE PRECISION DEFAULT 0;

-- Update id column to have default (if not already set)
-- Note: This only affects NEW rows, existing rows keep their IDs
ALTER TABLE "user_progress" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- Update updatedAt to have automatic update trigger
-- First, ensure the column exists and is timestamp
DO $$
BEGIN
    -- Check if updatedAt column needs to be updated
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_progress'
        AND column_name = 'updatedAt'
    ) THEN
        -- Update existing NULL values to current timestamp
        UPDATE "user_progress" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;
    END IF;
END $$;

-- Create or replace the trigger function for auto-updating updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_user_progress_updated_at ON "user_progress";

CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON "user_progress"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
