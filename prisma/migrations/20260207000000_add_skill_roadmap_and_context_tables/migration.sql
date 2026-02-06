-- Migration: Add Skill Roadmap Tables and SAM Context Snapshot
-- This migration adds missing tables for the Skill Roadmap feature and SAM context snapshots
-- Safe migration: Only adds new objects, does not modify existing tables

-- ============================================================================
-- CREATE ENUMS (with duplicate protection)
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE "SkillBuildCategory" AS ENUM ('TECHNICAL', 'SOFT', 'DOMAIN', 'TOOL', 'METHODOLOGY', 'CERTIFICATION', 'LEADERSHIP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SkillBuildProficiencyLevel" AS ENUM ('NOVICE', 'BEGINNER', 'COMPETENT', 'PROFICIENT', 'ADVANCED', 'EXPERT', 'STRATEGIST');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SkillBuildFramework" AS ENUM ('SFIA', 'ONET', 'ESCO', 'NICE', 'DREYFUS', 'CUSTOM');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SkillBuildEvidenceType" AS ENUM ('ASSESSMENT', 'PROJECT', 'CERTIFICATION', 'COURSE_COMPLETION', 'PEER_REVIEW', 'SELF_ASSESSMENT', 'PRACTICE_SESSION', 'REAL_WORLD', 'TEACHING');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SkillBuildRoadmapStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SkillBuildMilestoneStatus" AS ENUM ('LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SkillBuildBenchmarkSource" AS ENUM ('INDUSTRY', 'ROLE', 'PEER_GROUP', 'ORGANIZATION', 'MARKET');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SkillBuildTrend" AS ENUM ('ACCELERATING', 'STEADY', 'SLOWING', 'STAGNANT', 'DECLINING');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- CREATE TABLES (all use IF NOT EXISTS for safety)
-- ============================================================================

-- SkillBuildDefinition
CREATE TABLE IF NOT EXISTS "SkillBuildDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "SkillBuildCategory" NOT NULL,
    "framework" "SkillBuildFramework" NOT NULL DEFAULT 'CUSTOM',
    "externalId" TEXT,
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relatedSkillIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "parentSkillId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillBuildDefinition_pkey" PRIMARY KEY ("id")
);

-- SkillBuildProfile
CREATE TABLE IF NOT EXISTS "SkillBuildProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "currentLevel" "SkillBuildProficiencyLevel" NOT NULL DEFAULT 'NOVICE',
    "targetLevel" "SkillBuildProficiencyLevel",
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "lastAssessedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "trend" "SkillBuildTrend",
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillBuildProfile_pkey" PRIMARY KEY ("id")
);

-- SkillBuildEvidence
CREATE TABLE IF NOT EXISTS "SkillBuildEvidence" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "type" "SkillBuildEvidenceType" NOT NULL,
    "description" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "sourceId" TEXT,
    "sourceType" TEXT,
    "metadata" JSONB,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillBuildEvidence_pkey" PRIMARY KEY ("id")
);

-- SkillBuildRoadmap
CREATE TABLE IF NOT EXISTS "SkillBuildRoadmap" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "SkillBuildRoadmapStatus" NOT NULL DEFAULT 'DRAFT',
    "targetOutcome" JSONB NOT NULL,
    "totalEstimatedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "targetCompletionDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "adjustments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillBuildRoadmap_pkey" PRIMARY KEY ("id")
);

-- SkillBuildRoadmapMilestone
CREATE TABLE IF NOT EXISTS "SkillBuildRoadmapMilestone" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "SkillBuildMilestoneStatus" NOT NULL DEFAULT 'LOCKED',
    "skills" JSONB NOT NULL,
    "estimatedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualHours" DOUBLE PRECISION,
    "targetDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "prerequisites" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "resources" JSONB,
    "assessmentRequired" BOOLEAN NOT NULL DEFAULT false,
    "matchedCourseIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillBuildRoadmapMilestone_pkey" PRIMARY KEY ("id")
);

-- SkillBuildBenchmarkData
CREATE TABLE IF NOT EXISTS "SkillBuildBenchmarkData" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "source" "SkillBuildBenchmarkSource" NOT NULL,
    "distribution" JSONB NOT NULL,
    "levelDistribution" JSONB NOT NULL,
    "timeToLevel" JSONB,
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillBuildBenchmarkData_pkey" PRIMARY KEY ("id")
);

-- SkillBuildPracticeLog
CREATE TABLE IF NOT EXISTS "SkillBuildPracticeLog" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "description" TEXT,
    "durationMinutes" INTEGER NOT NULL DEFAULT 0,
    "difficulty" INTEGER,
    "feedback" TEXT,
    "outcome" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillBuildPracticeLog_pkey" PRIMARY KEY ("id")
);

-- SkillBuildAchievement
CREATE TABLE IF NOT EXISTS "SkillBuildAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "skillId" TEXT,
    "metadata" JSONB,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillBuildAchievement_pkey" PRIMARY KEY ("id")
);

-- SAMPageContextSnapshot
CREATE TABLE IF NOT EXISTS "sam_page_context_snapshots" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pageType" TEXT NOT NULL,
    "pagePath" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sam_page_context_snapshots_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- CREATE INDEXES (wrapped in DO blocks for safety)
-- ============================================================================

-- SkillBuildDefinition indexes (only if column exists)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'SkillBuildDefinition' AND column_name = 'category') THEN
        CREATE INDEX IF NOT EXISTS "SkillBuildDefinition_category_idx" ON "SkillBuildDefinition"("category");
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'SkillBuildDefinition' AND column_name = 'framework') THEN
        CREATE INDEX IF NOT EXISTS "SkillBuildDefinition_framework_idx" ON "SkillBuildDefinition"("framework");
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'SkillBuildDefinition_name_key') THEN
        CREATE UNIQUE INDEX "SkillBuildDefinition_name_key" ON "SkillBuildDefinition"("name");
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- SkillBuildProfile indexes
CREATE INDEX IF NOT EXISTS "SkillBuildProfile_userId_idx" ON "SkillBuildProfile"("userId");
CREATE INDEX IF NOT EXISTS "SkillBuildProfile_skillId_idx" ON "SkillBuildProfile"("skillId");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'SkillBuildProfile_userId_skillId_key') THEN
        CREATE UNIQUE INDEX "SkillBuildProfile_userId_skillId_key" ON "SkillBuildProfile"("userId", "skillId");
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- SkillBuildEvidence indexes
CREATE INDEX IF NOT EXISTS "SkillBuildEvidence_profileId_idx" ON "SkillBuildEvidence"("profileId");

-- SkillBuildRoadmap indexes
CREATE INDEX IF NOT EXISTS "SkillBuildRoadmap_userId_idx" ON "SkillBuildRoadmap"("userId");
CREATE INDEX IF NOT EXISTS "SkillBuildRoadmap_status_idx" ON "SkillBuildRoadmap"("status");

-- SkillBuildRoadmapMilestone indexes
CREATE INDEX IF NOT EXISTS "SkillBuildRoadmapMilestone_roadmapId_idx" ON "SkillBuildRoadmapMilestone"("roadmapId");
CREATE INDEX IF NOT EXISTS "SkillBuildRoadmapMilestone_status_idx" ON "SkillBuildRoadmapMilestone"("status");

-- SkillBuildBenchmarkData indexes
CREATE INDEX IF NOT EXISTS "SkillBuildBenchmarkData_skillId_idx" ON "SkillBuildBenchmarkData"("skillId");

-- SkillBuildPracticeLog indexes
CREATE INDEX IF NOT EXISTS "SkillBuildPracticeLog_profileId_idx" ON "SkillBuildPracticeLog"("profileId");

-- SkillBuildAchievement indexes
CREATE INDEX IF NOT EXISTS "SkillBuildAchievement_userId_idx" ON "SkillBuildAchievement"("userId");
CREATE INDEX IF NOT EXISTS "SkillBuildAchievement_skillId_idx" ON "SkillBuildAchievement"("skillId");

-- SAMPageContextSnapshot indexes
CREATE INDEX IF NOT EXISTS "sam_page_context_snapshots_userId_createdAt_idx" ON "sam_page_context_snapshots"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "sam_page_context_snapshots_userId_pagePath_idx" ON "sam_page_context_snapshots"("userId", "pagePath");
CREATE INDEX IF NOT EXISTS "sam_page_context_snapshots_contentHash_idx" ON "sam_page_context_snapshots"("contentHash");

-- ============================================================================
-- ADD FOREIGN KEYS (with duplicate protection)
-- ============================================================================

-- SkillBuildDefinition self-reference (only if parentSkillId column exists)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'SkillBuildDefinition' AND column_name = 'parentSkillId') THEN
        ALTER TABLE "SkillBuildDefinition" ADD CONSTRAINT "SkillBuildDefinition_parentSkillId_fkey"
        FOREIGN KEY ("parentSkillId") REFERENCES "SkillBuildDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- SkillBuildProfile foreign keys
DO $$ BEGIN
    ALTER TABLE "SkillBuildProfile" ADD CONSTRAINT "SkillBuildProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "SkillBuildProfile" ADD CONSTRAINT "SkillBuildProfile_skillId_fkey"
    FOREIGN KEY ("skillId") REFERENCES "SkillBuildDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- SkillBuildEvidence foreign keys
DO $$ BEGIN
    ALTER TABLE "SkillBuildEvidence" ADD CONSTRAINT "SkillBuildEvidence_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "SkillBuildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- SkillBuildRoadmap foreign keys
DO $$ BEGIN
    ALTER TABLE "SkillBuildRoadmap" ADD CONSTRAINT "SkillBuildRoadmap_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- SkillBuildRoadmapMilestone foreign keys
DO $$ BEGIN
    ALTER TABLE "SkillBuildRoadmapMilestone" ADD CONSTRAINT "SkillBuildRoadmapMilestone_roadmapId_fkey"
    FOREIGN KEY ("roadmapId") REFERENCES "SkillBuildRoadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- SkillBuildBenchmarkData foreign keys
DO $$ BEGIN
    ALTER TABLE "SkillBuildBenchmarkData" ADD CONSTRAINT "SkillBuildBenchmarkData_skillId_fkey"
    FOREIGN KEY ("skillId") REFERENCES "SkillBuildDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- SkillBuildPracticeLog foreign keys
DO $$ BEGIN
    ALTER TABLE "SkillBuildPracticeLog" ADD CONSTRAINT "SkillBuildPracticeLog_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "SkillBuildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- SkillBuildAchievement foreign keys
DO $$ BEGIN
    ALTER TABLE "SkillBuildAchievement" ADD CONSTRAINT "SkillBuildAchievement_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'SkillBuildAchievement' AND column_name = 'skillId') THEN
        ALTER TABLE "SkillBuildAchievement" ADD CONSTRAINT "SkillBuildAchievement_skillId_fkey"
        FOREIGN KEY ("skillId") REFERENCES "SkillBuildDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- SAMPageContextSnapshot foreign keys
DO $$ BEGIN
    ALTER TABLE "sam_page_context_snapshots" ADD CONSTRAINT "sam_page_context_snapshots_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
