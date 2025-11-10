-- CreateEnum for DashboardActivityType
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

-- CreateEnum for DashboardActivityStatus (if not exists)
DO $$ BEGIN
    CREATE TYPE "DashboardActivityStatus" AS ENUM (
        'NOT_STARTED',
        'IN_PROGRESS',
        'SUBMITTED',
        'GRADED',
        'OVERDUE',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum for Priority (if not exists)
DO $$ BEGIN
    CREATE TYPE "Priority" AS ENUM (
        'LOW',
        'MEDIUM',
        'HIGH',
        'URGENT'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable dashboard_activities (if not exists)
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (if not exists)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'dashboard_activities_userId_dueDate_idx') THEN
        CREATE INDEX "dashboard_activities_userId_dueDate_idx" ON "dashboard_activities"("userId", "dueDate");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'dashboard_activities_userId_status_idx') THEN
        CREATE INDEX "dashboard_activities_userId_status_idx" ON "dashboard_activities"("userId", "status");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'dashboard_activities_courseId_idx') THEN
        CREATE INDEX "dashboard_activities_courseId_idx" ON "dashboard_activities"("courseId");
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'dashboard_activities_googleEventId_key') THEN
        CREATE UNIQUE INDEX "dashboard_activities_googleEventId_key" ON "dashboard_activities"("googleEventId");
    END IF;
END $$;

-- AddForeignKey (if not exists)
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'dashboard_activities_userId_fkey'
    ) THEN
        ALTER TABLE "dashboard_activities" ADD CONSTRAINT "dashboard_activities_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'dashboard_activities_courseId_fkey'
    ) THEN
        ALTER TABLE "dashboard_activities" ADD CONSTRAINT "dashboard_activities_courseId_fkey"
            FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
