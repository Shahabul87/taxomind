-- Migration: Fix Skill Roadmap Schema
-- This migration drops incorrectly created tables and recreates them with correct schema
-- Safe: These tables have no data yet

-- ============================================================================
-- DROP EXISTING TABLES (no data loss - tables are new/empty)
-- ============================================================================

DROP TABLE IF EXISTS "SkillBuildAchievement" CASCADE;
DROP TABLE IF EXISTS "SkillBuildPracticeLog" CASCADE;
DROP TABLE IF EXISTS "SkillBuildBenchmarkData" CASCADE;
DROP TABLE IF EXISTS "SkillBuildRoadmapMilestone" CASCADE;
DROP TABLE IF EXISTS "SkillBuildRoadmap" CASCADE;
DROP TABLE IF EXISTS "SkillBuildEvidence" CASCADE;
DROP TABLE IF EXISTS "SkillBuildProfile" CASCADE;
DROP TABLE IF EXISTS "SkillBuildDefinition" CASCADE;
DROP TABLE IF EXISTS "sam_page_context_snapshots" CASCADE;

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
-- CREATE TABLES (exact match with Prisma schema)
-- ============================================================================

-- SkillBuildDefinition (matches prisma/schema.prisma:13289)
CREATE TABLE "SkillBuildDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "SkillBuildCategory" NOT NULL,
    "parentId" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "difficultyFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "retentionDifficulty" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "applicationComplexity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "demandLevel" TEXT,
    "demandTrend" TEXT,
    "avgSalaryImpact" DOUBLE PRECISION,
    "jobPostingCount" INTEGER,
    "topIndustries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "topRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "demandLastUpdated" TIMESTAMP(3),
    "frameworkMappings" JSONB,
    "prerequisites" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relatedSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bloomsLevels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillBuildDefinition_pkey" PRIMARY KEY ("id")
);

-- SkillBuildProfile (matches prisma/schema.prisma:13344)
CREATE TABLE "SkillBuildProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "masteryScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "retentionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "applicationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "calibrationScore" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "compositeScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "proficiencyLevel" "SkillBuildProficiencyLevel" NOT NULL DEFAULT 'NOVICE',
    "learningSpeed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sessionsToNextLevel" INTEGER NOT NULL DEFAULT 999,
    "daysToNextLevel" INTEGER NOT NULL DEFAULT 999,
    "velocityTrend" "SkillBuildTrend" NOT NULL DEFAULT 'STAGNANT',
    "velocityAcceleration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recentScores" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[],
    "velocityCalculatedAt" TIMESTAMP(3),
    "decayRate" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "daysSinceLastPractice" INTEGER NOT NULL DEFAULT 0,
    "halfLifeDays" INTEGER NOT NULL DEFAULT 14,
    "daysUntilLevelDrop" INTEGER,
    "recommendedReviewDate" TIMESTAMP(3),
    "decayRiskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "totalMinutes" INTEGER NOT NULL DEFAULT 0,
    "averageSessionMinutes" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "bestScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "sessionsThisWeek" INTEGER NOT NULL DEFAULT 0,
    "sessionsThisMonth" INTEGER NOT NULL DEFAULT 0,
    "targetLevel" "SkillBuildProficiencyLevel",
    "progressToTarget" DOUBLE PRECISION,
    "levelHistory" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastPracticedAt" TIMESTAMP(3),

    CONSTRAINT "SkillBuildProfile_pkey" PRIMARY KEY ("id")
);

-- SkillBuildEvidence (matches prisma/schema.prisma:13418)
CREATE TABLE "SkillBuildEvidence" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "type" "SkillBuildEvidenceType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sourceId" TEXT,
    "sourceUrl" TEXT,
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "demonstratedLevel" "SkillBuildProficiencyLevel" NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "date" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillBuildEvidence_pkey" PRIMARY KEY ("id")
);

-- SkillBuildRoadmap (matches prisma/schema.prisma:13451)
CREATE TABLE "SkillBuildRoadmap" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillBuildRoadmap_pkey" PRIMARY KEY ("id")
);

-- SkillBuildRoadmapMilestone (matches prisma/schema.prisma:13490)
CREATE TABLE "SkillBuildRoadmapMilestone" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillBuildRoadmapMilestone_pkey" PRIMARY KEY ("id")
);

-- SkillBuildBenchmarkData (matches prisma/schema.prisma:13535)
CREATE TABLE "SkillBuildBenchmarkData" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "source" "SkillBuildBenchmarkSource" NOT NULL,
    "distribution" JSONB NOT NULL,
    "levelDistribution" JSONB NOT NULL,
    "timeToLevel" JSONB,
    "sampleSize" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillBuildBenchmarkData_pkey" PRIMARY KEY ("id")
);

-- SkillBuildPracticeLog (matches prisma/schema.prisma:13567)
CREATE TABLE "SkillBuildPracticeLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "isAssessment" BOOLEAN NOT NULL DEFAULT false,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "sourceId" TEXT,
    "sourceType" TEXT,
    "notes" TEXT,
    "dimensionChanges" JSONB,
    "compositeScoreChange" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillBuildPracticeLog_pkey" PRIMARY KEY ("id")
);

-- SkillBuildAchievement (matches prisma/schema.prisma:13600)
CREATE TABLE "SkillBuildAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "skillId" TEXT,
    "skillName" TEXT,
    "level" "SkillBuildProficiencyLevel",
    "rarity" TEXT NOT NULL DEFAULT 'COMMON',
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillBuildAchievement_pkey" PRIMARY KEY ("id")
);

-- SAMPageContextSnapshot (matches prisma/schema.prisma)
CREATE TABLE "sam_page_context_snapshots" (
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
-- CREATE INDEXES
-- ============================================================================

-- SkillBuildDefinition indexes
CREATE INDEX "SkillBuildDefinition_category_idx" ON "SkillBuildDefinition"("category");
CREATE INDEX "SkillBuildDefinition_parentId_idx" ON "SkillBuildDefinition"("parentId");
CREATE INDEX "SkillBuildDefinition_demandLevel_idx" ON "SkillBuildDefinition"("demandLevel");

-- SkillBuildProfile indexes
CREATE UNIQUE INDEX "SkillBuildProfile_userId_skillId_key" ON "SkillBuildProfile"("userId", "skillId");
CREATE INDEX "SkillBuildProfile_userId_idx" ON "SkillBuildProfile"("userId");
CREATE INDEX "SkillBuildProfile_skillId_idx" ON "SkillBuildProfile"("skillId");
CREATE INDEX "SkillBuildProfile_proficiencyLevel_idx" ON "SkillBuildProfile"("proficiencyLevel");
CREATE INDEX "SkillBuildProfile_decayRiskLevel_idx" ON "SkillBuildProfile"("decayRiskLevel");
CREATE INDEX "SkillBuildProfile_lastPracticedAt_idx" ON "SkillBuildProfile"("lastPracticedAt");

-- SkillBuildEvidence indexes
CREATE INDEX "SkillBuildEvidence_profileId_idx" ON "SkillBuildEvidence"("profileId");
CREATE INDEX "SkillBuildEvidence_type_idx" ON "SkillBuildEvidence"("type");
CREATE INDEX "SkillBuildEvidence_verified_idx" ON "SkillBuildEvidence"("verified");

-- SkillBuildRoadmap indexes
CREATE INDEX "SkillBuildRoadmap_userId_idx" ON "SkillBuildRoadmap"("userId");
CREATE INDEX "SkillBuildRoadmap_status_idx" ON "SkillBuildRoadmap"("status");

-- SkillBuildRoadmapMilestone indexes
CREATE INDEX "SkillBuildRoadmapMilestone_roadmapId_idx" ON "SkillBuildRoadmapMilestone"("roadmapId");
CREATE INDEX "SkillBuildRoadmapMilestone_status_idx" ON "SkillBuildRoadmapMilestone"("status");

-- SkillBuildBenchmarkData indexes
CREATE UNIQUE INDEX "SkillBuildBenchmarkData_skillId_source_key" ON "SkillBuildBenchmarkData"("skillId", "source");
CREATE INDEX "SkillBuildBenchmarkData_skillId_idx" ON "SkillBuildBenchmarkData"("skillId");
CREATE INDEX "SkillBuildBenchmarkData_source_idx" ON "SkillBuildBenchmarkData"("source");

-- SkillBuildPracticeLog indexes
CREATE INDEX "SkillBuildPracticeLog_userId_idx" ON "SkillBuildPracticeLog"("userId");
CREATE INDEX "SkillBuildPracticeLog_profileId_idx" ON "SkillBuildPracticeLog"("profileId");
CREATE INDEX "SkillBuildPracticeLog_skillId_idx" ON "SkillBuildPracticeLog"("skillId");
CREATE INDEX "SkillBuildPracticeLog_timestamp_idx" ON "SkillBuildPracticeLog"("timestamp");

-- SkillBuildAchievement indexes
CREATE INDEX "SkillBuildAchievement_userId_idx" ON "SkillBuildAchievement"("userId");
CREATE INDEX "SkillBuildAchievement_type_idx" ON "SkillBuildAchievement"("type");
CREATE INDEX "SkillBuildAchievement_earnedAt_idx" ON "SkillBuildAchievement"("earnedAt");

-- SAMPageContextSnapshot indexes
CREATE INDEX "sam_page_context_snapshots_userId_createdAt_idx" ON "sam_page_context_snapshots"("userId", "createdAt" DESC);
CREATE INDEX "sam_page_context_snapshots_userId_pagePath_idx" ON "sam_page_context_snapshots"("userId", "pagePath");
CREATE INDEX "sam_page_context_snapshots_contentHash_idx" ON "sam_page_context_snapshots"("contentHash");

-- ============================================================================
-- ADD FOREIGN KEYS
-- ============================================================================

-- SkillBuildDefinition self-reference
ALTER TABLE "SkillBuildDefinition" ADD CONSTRAINT "SkillBuildDefinition_parentId_fkey"
FOREIGN KEY ("parentId") REFERENCES "SkillBuildDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- SkillBuildProfile foreign keys
ALTER TABLE "SkillBuildProfile" ADD CONSTRAINT "SkillBuildProfile_skillId_fkey"
FOREIGN KEY ("skillId") REFERENCES "SkillBuildDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SkillBuildProfile" ADD CONSTRAINT "SkillBuildProfile_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SkillBuildEvidence foreign keys
ALTER TABLE "SkillBuildEvidence" ADD CONSTRAINT "SkillBuildEvidence_profileId_fkey"
FOREIGN KEY ("profileId") REFERENCES "SkillBuildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SkillBuildRoadmap foreign keys
ALTER TABLE "SkillBuildRoadmap" ADD CONSTRAINT "SkillBuildRoadmap_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SkillBuildRoadmapMilestone foreign keys
ALTER TABLE "SkillBuildRoadmapMilestone" ADD CONSTRAINT "SkillBuildRoadmapMilestone_roadmapId_fkey"
FOREIGN KEY ("roadmapId") REFERENCES "SkillBuildRoadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SkillBuildBenchmarkData foreign keys
ALTER TABLE "SkillBuildBenchmarkData" ADD CONSTRAINT "SkillBuildBenchmarkData_skillId_fkey"
FOREIGN KEY ("skillId") REFERENCES "SkillBuildDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SkillBuildPracticeLog foreign keys
ALTER TABLE "SkillBuildPracticeLog" ADD CONSTRAINT "SkillBuildPracticeLog_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SkillBuildPracticeLog" ADD CONSTRAINT "SkillBuildPracticeLog_profileId_fkey"
FOREIGN KEY ("profileId") REFERENCES "SkillBuildProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SkillBuildAchievement foreign keys
ALTER TABLE "SkillBuildAchievement" ADD CONSTRAINT "SkillBuildAchievement_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SAMPageContextSnapshot foreign keys
ALTER TABLE "sam_page_context_snapshots" ADD CONSTRAINT "sam_page_context_snapshots_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
