-- Fix Production Database Schema Mismatch
-- Run this SQL on your Railway production database

-- Add isFree column to Course table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'Course'
        AND column_name = 'isFree'
    ) THEN
        ALTER TABLE "Course" ADD COLUMN "isFree" BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added isFree column to Course table';
    ELSE
        RAISE NOTICE 'isFree column already exists in Course table';
    END IF;
END $$;

-- Add priceType column to Course table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'Course'
        AND column_name = 'priceType'
    ) THEN
        ALTER TABLE "Course" ADD COLUMN "priceType" TEXT DEFAULT 'ONE_TIME';
        RAISE NOTICE 'Added priceType column to Course table';
    ELSE
        RAISE NOTICE 'priceType column already exists in Course table';
    END IF;
END $$;

-- Verify the columns were added
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Course'
  AND column_name IN ('isFree', 'priceType')
ORDER BY column_name;

-- Show success message
SELECT 'Database schema updated successfully! The Course table now has isFree and priceType columns.' AS status;
