#!/bin/bash

# Emergency script to fix dashboard_activities table in production
# Run this directly in Railway console if needed

echo "🚨 Emergency Dashboard Activities Table Fix"
echo "==========================================="
echo ""

# First, try to run the Node.js fix scripts
echo "Step 1: Running Node.js fix scripts..."
node scripts/fix-dashboard-migration.js
if [ $? -eq 0 ]; then
  echo "✅ Node.js fix script succeeded"
  exit 0
fi

echo "⚠️ Node.js script didn't complete. Trying direct SQL..."
echo ""

# If that doesn't work, use psql directly
echo "Step 2: Direct PostgreSQL table creation..."

# Use environment variable for database URL
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not set"
  exit 1
fi

# Run SQL directly using psql
psql "$DATABASE_URL" << 'EOF'
-- Create enums if they don't exist
DO $$ BEGIN
  CREATE TYPE "DashboardActivityType" AS ENUM (
    'ASSIGNMENT', 'QUIZ', 'EXAM', 'READING', 'VIDEO',
    'DISCUSSION', 'STUDY_SESSION', 'PROJECT', 'PRESENTATION', 'CUSTOM'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "DashboardActivityStatus" AS ENUM (
    'NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'GRADED', 'OVERDUE', 'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create table
CREATE TABLE IF NOT EXISTS "dashboard_activities" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "DashboardActivityType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "courseId" TEXT,
  "dueDate" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "status" "DashboardActivityStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "points" INTEGER NOT NULL DEFAULT 0,
  "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
  "googleEventId" TEXT,
  "calendarSynced" BOOLEAN NOT NULL DEFAULT false,
  "lastSyncedAt" TIMESTAMP(3),
  "estimatedMinutes" INTEGER,
  "actualMinutes" INTEGER,
  "tags" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "dashboard_activities_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "dashboard_activities_userId_dueDate_idx"
ON "dashboard_activities"("userId", "dueDate");

CREATE INDEX IF NOT EXISTS "dashboard_activities_userId_status_idx"
ON "dashboard_activities"("userId", "status");

CREATE INDEX IF NOT EXISTS "dashboard_activities_courseId_idx"
ON "dashboard_activities"("courseId");

-- Add foreign keys
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dashboard_activities_userId_fkey'
  ) THEN
    ALTER TABLE "dashboard_activities"
    ADD CONSTRAINT "dashboard_activities_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dashboard_activities_courseId_fkey'
  ) THEN
    ALTER TABLE "dashboard_activities"
    ADD CONSTRAINT "dashboard_activities_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "courses"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Mark migration as applied
INSERT INTO "_prisma_migrations" (
  "id", "checksum", "finished_at", "migration_name", "logs",
  "rolled_back_at", "started_at", "applied_steps_count"
)
SELECT
  gen_random_uuid()::text, '0', NOW(),
  '20251109223911_fix_dashboard_activity_type',
  'Applied by emergency fix script', NULL, NOW(), 1
WHERE NOT EXISTS (
  SELECT 1 FROM "_prisma_migrations"
  WHERE "migration_name" = '20251109223911_fix_dashboard_activity_type'
)
ON CONFLICT (migration_name) DO NOTHING;

-- Verify
SELECT COUNT(*) as record_count FROM dashboard_activities;
EOF

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Table created successfully via direct SQL"
else
  echo "❌ Failed to create table"
  exit 1
fi

echo ""
echo "==========================================="
echo "✅ Emergency fix complete!"
echo "Please restart your application now."