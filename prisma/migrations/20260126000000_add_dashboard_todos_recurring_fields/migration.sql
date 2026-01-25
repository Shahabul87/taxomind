-- Add missing recurring and progress columns to dashboard_todos
-- All columns have defaults or are optional to prevent data loss

-- Recurring task fields
ALTER TABLE "dashboard_todos" ADD COLUMN IF NOT EXISTS "isRecurring" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "dashboard_todos" ADD COLUMN IF NOT EXISTS "recurringPattern" TEXT;
ALTER TABLE "dashboard_todos" ADD COLUMN IF NOT EXISTS "recurringDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
ALTER TABLE "dashboard_todos" ADD COLUMN IF NOT EXISTS "parentTodoId" TEXT;

-- Progress tracking fields
ALTER TABLE "dashboard_todos" ADD COLUMN IF NOT EXISTS "progressPercent" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "dashboard_todos" ADD COLUMN IF NOT EXISTS "timeSpentMinutes" INTEGER NOT NULL DEFAULT 0;

-- AI/SAM integration fields
ALTER TABLE "dashboard_todos" ADD COLUMN IF NOT EXISTS "aiSuggested" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "dashboard_todos" ADD COLUMN IF NOT EXISTS "suggestedReason" TEXT;

-- Add self-referential foreign key for recurring todos (optional, soft delete compatible)
-- Only add if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'dashboard_todos_parentTodoId_fkey'
    ) THEN
        ALTER TABLE "dashboard_todos"
        ADD CONSTRAINT "dashboard_todos_parentTodoId_fkey"
        FOREIGN KEY ("parentTodoId") REFERENCES "dashboard_todos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Create index for parentTodoId lookups
CREATE INDEX IF NOT EXISTS "dashboard_todos_parentTodoId_idx" ON "dashboard_todos"("parentTodoId");
