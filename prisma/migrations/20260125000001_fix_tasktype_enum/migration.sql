-- Fix taskType column to use proper enum instead of TEXT
-- This migration safely converts TEXT to LearningTaskType enum

-- Step 1: Create the enum type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LearningTaskType') THEN
        CREATE TYPE "LearningTaskType" AS ENUM (
            'STUDY',
            'PRACTICE',
            'REVIEW',
            'QUIZ_PREP',
            'WATCH',
            'READ',
            'ASSIGNMENT',
            'OTHER'
        );
    END IF;
END$$;

-- Step 2: Check if taskType column exists as TEXT and convert it
DO $$
BEGIN
    -- If column exists as TEXT, convert it to enum
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'dashboard_todos'
        AND column_name = 'taskType'
        AND data_type = 'text'
    ) THEN
        -- First, ensure all values are valid enum values
        UPDATE "dashboard_todos"
        SET "taskType" = 'STUDY'
        WHERE "taskType" IS NULL OR "taskType" NOT IN ('STUDY', 'PRACTICE', 'REVIEW', 'QUIZ_PREP', 'WATCH', 'READ', 'ASSIGNMENT', 'OTHER');

        -- Drop the default constraint first
        ALTER TABLE "dashboard_todos"
        ALTER COLUMN "taskType" DROP DEFAULT;

        -- Then alter the column type
        ALTER TABLE "dashboard_todos"
        ALTER COLUMN "taskType" TYPE "LearningTaskType"
        USING "taskType"::"LearningTaskType";

        -- Re-add the default with proper enum type
        ALTER TABLE "dashboard_todos"
        ALTER COLUMN "taskType" SET DEFAULT 'STUDY'::"LearningTaskType";

        -- Ensure NOT NULL
        ALTER TABLE "dashboard_todos"
        ALTER COLUMN "taskType" SET NOT NULL;
    END IF;

    -- If column doesn't exist at all, add it with correct type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'dashboard_todos'
        AND column_name = 'taskType'
    ) THEN
        ALTER TABLE "dashboard_todos"
        ADD COLUMN "taskType" "LearningTaskType" NOT NULL DEFAULT 'STUDY'::"LearningTaskType";
    END IF;
END$$;

-- Step 3: Ensure chapterId column exists (optional, no FK)
ALTER TABLE "dashboard_todos"
ADD COLUMN IF NOT EXISTS "chapterId" TEXT;

-- Step 4: Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS "dashboard_todos_userId_taskType_idx"
ON "dashboard_todos"("userId", "taskType");

CREATE INDEX IF NOT EXISTS "dashboard_todos_chapterId_idx"
ON "dashboard_todos"("chapterId");
