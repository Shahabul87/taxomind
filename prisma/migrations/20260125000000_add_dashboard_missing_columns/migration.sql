-- Add missing columns to dashboard_todos
-- All new columns are optional or have defaults to prevent data loss

-- Add taskType column with default value
ALTER TABLE "dashboard_todos" ADD COLUMN IF NOT EXISTS "taskType" TEXT NOT NULL DEFAULT 'STUDY';

-- Add chapterId column (optional) - NO foreign key constraint since chapters table may not exist
ALTER TABLE "dashboard_todos" ADD COLUMN IF NOT EXISTS "chapterId" TEXT;

-- Add missing columns to dashboard_study_sessions
-- All new columns are optional or have defaults

ALTER TABLE "dashboard_study_sessions" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "dashboard_study_sessions" ADD COLUMN IF NOT EXISTS "productivity" INTEGER DEFAULT 0;
ALTER TABLE "dashboard_study_sessions" ADD COLUMN IF NOT EXISTS "notifyEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "dashboard_study_sessions" ADD COLUMN IF NOT EXISTS "notifyMinutesBefore" INTEGER NOT NULL DEFAULT 15;
ALTER TABLE "dashboard_study_sessions" ADD COLUMN IF NOT EXISTS "notificationSentAt" TIMESTAMP(3);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS "dashboard_todos_userId_taskType_idx" ON "dashboard_todos"("userId", "taskType");
CREATE INDEX IF NOT EXISTS "dashboard_todos_chapterId_idx" ON "dashboard_todos"("chapterId");
CREATE INDEX IF NOT EXISTS "dashboard_study_sessions_notifyEnabled_startTime_idx" ON "dashboard_study_sessions"("notifyEnabled", "startTime");
