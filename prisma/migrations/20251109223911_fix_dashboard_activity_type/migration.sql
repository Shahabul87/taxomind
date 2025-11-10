-- Fix DashboardActivity to use correct enum type
-- This migration changes the type column from ActivityType to DashboardActivityType

-- Step 1: Create the new enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "DashboardActivityType" AS ENUM (
        'ASSIGNMENT',
        'QUIZ',
        'EXAM',
        'READING',
        'VIDEO',
        'DISCUSSION',
        'STUDY_SESSION',
        'PROJECT',
        'PRESENTATION',
        'CUSTOM'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Update the column to use the new type (safe if table is empty)
ALTER TABLE "dashboard_activities" 
    ALTER COLUMN "type" TYPE "DashboardActivityType" 
    USING "type"::text::"DashboardActivityType";
