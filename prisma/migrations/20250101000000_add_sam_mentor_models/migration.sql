-- SAM Mentor System Migration
-- This migration adds new tables and enums for the SAM Mentor feature
-- Safe migration: Only adds new objects, does not modify existing tables

-- CreateEnum: SAM Mentor Plan Status
DO $$ BEGIN
    CREATE TYPE "SAMMentorPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum: SAM Mentor Session Status
DO $$ BEGIN
    CREATE TYPE "SAMMentorSessionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'RESCHEDULED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum: SAM Review Priority
DO $$ BEGIN
    CREATE TYPE "SAMReviewPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum: SAM Misconception Severity
DO $$ BEGIN
    CREATE TYPE "SAMMisconceptionSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum: SAM Misconception Status
DO $$ BEGIN
    CREATE TYPE "SAMMisconceptionStatus" AS ENUM ('DETECTED', 'ADDRESSING', 'RESOLVED', 'RECURRING');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum: SAM Intervention Priority
DO $$ BEGIN
    CREATE TYPE "SAMInterventionPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum: SAM Intervention Status
DO $$ BEGIN
    CREATE TYPE "SAMInterventionStatus" AS ENUM ('PENDING', 'SENT', 'ACKNOWLEDGED', 'COMPLETED', 'DISMISSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable: SAM Mentor Plans
CREATE TABLE IF NOT EXISTS "sam_mentor_plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT,
    "goal" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "timeBudgetMinutes" INTEGER NOT NULL DEFAULT 240,
    "weeklyPlan" JSONB NOT NULL,
    "status" "SAMMentorPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentWeek" INTEGER NOT NULL DEFAULT 1,
    "completedSessions" INTEGER NOT NULL DEFAULT 0,
    "estimatedMasteryGain" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualMasteryGain" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "sam_mentor_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SAM Mentor Sessions
CREATE TABLE IF NOT EXISTS "sam_mentor_sessions" (
    "id" TEXT NOT NULL,
    "planId" TEXT,
    "weekNumber" INTEGER NOT NULL,
    "sessionType" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "content" JSONB,
    "outcome" JSONB,
    "scheduledDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "estimatedDuration" INTEGER,
    "actualDuration" INTEGER,
    "status" "SAMMentorSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sam_mentor_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SAM Review Entries (Spaced Repetition)
CREATE TABLE IF NOT EXISTS "sam_review_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT,
    "chapterId" TEXT,
    "sectionId" TEXT,
    "topic" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "priority" "SAMReviewPriority" NOT NULL DEFAULT 'MEDIUM',
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "masteryLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nextReviewDate" TIMESTAMP(3) NOT NULL,
    "lastReviewDate" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sam_review_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SAM Misconceptions
CREATE TABLE IF NOT EXISTS "sam_misconceptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "SAMMisconceptionSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "SAMMisconceptionStatus" NOT NULL DEFAULT 'DETECTED',
    "evidence" JSONB,
    "resolution" TEXT,
    "remediationAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastRemediationAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sam_misconceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SAM Confidence Logs
CREATE TABLE IF NOT EXISTS "sam_confidence_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "predictedScore" DOUBLE PRECISION NOT NULL,
    "actualScore" DOUBLE PRECISION,
    "calibrationError" DOUBLE PRECISION,
    "context" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sam_confidence_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SAM Teacher Interventions
CREATE TABLE IF NOT EXISTS "sam_teacher_interventions" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "suggestions" JSONB,
    "priority" "SAMInterventionPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "SAMInterventionStatus" NOT NULL DEFAULT 'PENDING',
    "outcome" JSONB,
    "notes" TEXT,
    "triggeredBy" JSONB,
    "scheduledFor" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sam_teacher_interventions_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX IF NOT EXISTS "sam_mentor_plans_userId_status_idx" ON "sam_mentor_plans"("userId", "status");
CREATE INDEX IF NOT EXISTS "sam_mentor_plans_courseId_idx" ON "sam_mentor_plans"("courseId");
CREATE INDEX IF NOT EXISTS "sam_mentor_sessions_planId_idx" ON "sam_mentor_sessions"("planId");
CREATE INDEX IF NOT EXISTS "sam_mentor_sessions_status_idx" ON "sam_mentor_sessions"("status");
CREATE INDEX IF NOT EXISTS "sam_review_entries_userId_nextReviewDate_idx" ON "sam_review_entries"("userId", "nextReviewDate");
CREATE INDEX IF NOT EXISTS "sam_review_entries_courseId_idx" ON "sam_review_entries"("courseId");
CREATE INDEX IF NOT EXISTS "sam_review_entries_priority_idx" ON "sam_review_entries"("priority");
CREATE INDEX IF NOT EXISTS "sam_misconceptions_userId_status_idx" ON "sam_misconceptions"("userId", "status");
CREATE INDEX IF NOT EXISTS "sam_misconceptions_severity_idx" ON "sam_misconceptions"("severity");
CREATE INDEX IF NOT EXISTS "sam_confidence_logs_userId_idx" ON "sam_confidence_logs"("userId");
CREATE INDEX IF NOT EXISTS "sam_confidence_logs_topic_idx" ON "sam_confidence_logs"("topic");
CREATE INDEX IF NOT EXISTS "sam_teacher_interventions_teacherId_idx" ON "sam_teacher_interventions"("teacherId");
CREATE INDEX IF NOT EXISTS "sam_teacher_interventions_studentId_idx" ON "sam_teacher_interventions"("studentId");
CREATE INDEX IF NOT EXISTS "sam_teacher_interventions_courseId_idx" ON "sam_teacher_interventions"("courseId");
CREATE INDEX IF NOT EXISTS "sam_teacher_interventions_status_idx" ON "sam_teacher_interventions"("status");

-- AddForeignKeys (with IF NOT EXISTS pattern using DO blocks)
DO $$ BEGIN
    ALTER TABLE "sam_mentor_plans" ADD CONSTRAINT "sam_mentor_plans_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "sam_mentor_plans" ADD CONSTRAINT "sam_mentor_plans_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "sam_mentor_sessions" ADD CONSTRAINT "sam_mentor_sessions_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "sam_mentor_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "sam_review_entries" ADD CONSTRAINT "sam_review_entries_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "sam_review_entries" ADD CONSTRAINT "sam_review_entries_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "sam_misconceptions" ADD CONSTRAINT "sam_misconceptions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "sam_confidence_logs" ADD CONSTRAINT "sam_confidence_logs_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "sam_teacher_interventions" ADD CONSTRAINT "sam_teacher_interventions_teacherId_fkey"
    FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "sam_teacher_interventions" ADD CONSTRAINT "sam_teacher_interventions_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "sam_teacher_interventions" ADD CONSTRAINT "sam_teacher_interventions_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
