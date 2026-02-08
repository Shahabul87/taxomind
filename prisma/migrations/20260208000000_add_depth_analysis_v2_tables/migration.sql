-- Migration: Add Course Depth Analysis V2 Tables
-- Safe migration: Only creates new enums, tables, indexes, and foreign keys
-- No existing tables or data are modified

-- ============================================================================
-- CREATE ENUMS (with duplicate protection)
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE "DepthAnalysisStatus" AS ENUM ('QUEUED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'NEEDS_REANALYSIS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "IssueSeverity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "IssueType" AS ENUM ('STRUCTURE', 'CONTENT', 'FLOW', 'DUPLICATE', 'CONSISTENCY', 'DEPTH', 'OBJECTIVE', 'ASSESSMENT', 'TIME', 'PREREQUISITE', 'GAP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "IssueStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'SKIPPED', 'WONT_FIX');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- CREATE TABLES
-- ============================================================================

-- CourseDepthAnalysisV2
CREATE TABLE "course_depth_analysis_v2" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    -- Overall Scores (0-100)
    "overallScore" DOUBLE PRECISION NOT NULL,
    "depthScore" DOUBLE PRECISION NOT NULL,
    "consistencyScore" DOUBLE PRECISION NOT NULL,
    "flowScore" DOUBLE PRECISION NOT NULL,
    "qualityScore" DOUBLE PRECISION NOT NULL,

    -- Bloom's Analysis
    "bloomsDistribution" JSONB NOT NULL,
    "bloomsBalance" TEXT,

    -- Detailed Chapter Analysis
    "chapterAnalysis" JSONB NOT NULL,

    -- Issue Summary Counts
    "issueCountCritical" INTEGER NOT NULL DEFAULT 0,
    "issueCountHigh" INTEGER NOT NULL DEFAULT 0,
    "issueCountMedium" INTEGER NOT NULL DEFAULT 0,
    "issueCountLow" INTEGER NOT NULL DEFAULT 0,
    "totalIssues" INTEGER NOT NULL DEFAULT 0,

    -- Learning Outcomes
    "learningOutcomes" JSONB,
    "skillsGained" JSONB,
    "knowledgeGaps" JSONB,

    -- Content Analysis Results
    "duplicateContent" JSONB,
    "thinSections" JSONB,
    "contentFlowAnalysis" JSONB,

    -- Metadata
    "contentHash" TEXT,
    "status" "DepthAnalysisStatus" NOT NULL DEFAULT 'COMPLETED',
    "errorMessage" TEXT,
    "analysisMethod" TEXT,

    -- Comparison with previous version
    "previousVersionId" TEXT,
    "scoreImprovement" DOUBLE PRECISION,
    "issuesResolved" INTEGER,

    -- Timestamps
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_depth_analysis_v2_pkey" PRIMARY KEY ("id")
);

-- DepthAnalysisIssue
CREATE TABLE "depth_analysis_issues" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,

    -- Issue Classification
    "type" "IssueType" NOT NULL,
    "severity" "IssueSeverity" NOT NULL,
    "status" "IssueStatus" NOT NULL DEFAULT 'OPEN',

    -- Location
    "chapterId" TEXT,
    "chapterTitle" TEXT,
    "chapterPosition" INTEGER,
    "sectionId" TEXT,
    "sectionTitle" TEXT,
    "sectionPosition" INTEGER,
    "contentType" TEXT,

    -- Problem Description
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" JSONB,

    -- Impact
    "impactArea" TEXT,
    "impactDescription" TEXT,

    -- Fix Instructions
    "fixAction" TEXT,
    "fixWhat" TEXT,
    "fixWhy" TEXT,
    "fixHow" TEXT,
    "suggestedContent" TEXT,
    "fixExamples" JSONB,

    -- Related Issues
    "relatedIssueIds" TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- User Actions
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "userNotes" TEXT,
    "skippedReason" TEXT,

    -- Timestamps
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "depth_analysis_issues_pkey" PRIMARY KEY ("id")
);

-- ChapterConsistencyAnalysis
CREATE TABLE "chapter_consistency_analysis" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,

    -- Consistency Scores
    "goalAlignmentScore" DOUBLE PRECISION NOT NULL,
    "depthConsistencyScore" DOUBLE PRECISION NOT NULL,
    "flowScore" DOUBLE PRECISION NOT NULL,

    -- Bloom's Distribution for Chapter
    "bloomsDistribution" JSONB NOT NULL,
    "dominantLevel" TEXT NOT NULL,

    -- Section Analysis
    "sectionCount" INTEGER NOT NULL,
    "sectionsAnalyzed" JSONB NOT NULL,

    -- Issues in this chapter
    "issueIds" TEXT[] DEFAULT ARRAY[]::TEXT[],

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chapter_consistency_analysis_pkey" PRIMARY KEY ("id")
);

-- DuplicateContentPair
CREATE TABLE "duplicate_content_pairs" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,

    -- Source A
    "sourceAChapterId" TEXT NOT NULL,
    "sourceAChapterTitle" TEXT NOT NULL,
    "sourceASectionId" TEXT,
    "sourceASectionTitle" TEXT,
    "sourceAContent" TEXT NOT NULL,

    -- Source B
    "sourceBChapterId" TEXT NOT NULL,
    "sourceBChapterTitle" TEXT NOT NULL,
    "sourceBSectionId" TEXT,
    "sourceBSectionTitle" TEXT,
    "sourceBContent" TEXT NOT NULL,

    -- Similarity Analysis
    "similarityScore" DOUBLE PRECISION NOT NULL,
    "overlappingConcepts" JSONB,
    "recommendation" TEXT NOT NULL,
    "recommendationReason" TEXT,

    -- Status
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolution" TEXT,

    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "duplicate_content_pairs_pkey" PRIMARY KEY ("id")
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- CourseDepthAnalysisV2 indexes
CREATE UNIQUE INDEX "course_depth_analysis_v2_courseId_version_key" ON "course_depth_analysis_v2"("courseId", "version");
CREATE INDEX "course_depth_analysis_v2_courseId_idx" ON "course_depth_analysis_v2"("courseId");
CREATE INDEX "course_depth_analysis_v2_courseId_version_idx" ON "course_depth_analysis_v2"("courseId", "version");
CREATE INDEX "course_depth_analysis_v2_status_idx" ON "course_depth_analysis_v2"("status");
CREATE INDEX "course_depth_analysis_v2_contentHash_idx" ON "course_depth_analysis_v2"("contentHash");

-- DepthAnalysisIssue indexes
CREATE INDEX "depth_analysis_issues_analysisId_idx" ON "depth_analysis_issues"("analysisId");
CREATE INDEX "depth_analysis_issues_analysisId_severity_idx" ON "depth_analysis_issues"("analysisId", "severity");
CREATE INDEX "depth_analysis_issues_analysisId_type_idx" ON "depth_analysis_issues"("analysisId", "type");
CREATE INDEX "depth_analysis_issues_analysisId_status_idx" ON "depth_analysis_issues"("analysisId", "status");
CREATE INDEX "depth_analysis_issues_chapterId_idx" ON "depth_analysis_issues"("chapterId");
CREATE INDEX "depth_analysis_issues_sectionId_idx" ON "depth_analysis_issues"("sectionId");

-- ChapterConsistencyAnalysis indexes
CREATE UNIQUE INDEX "chapter_consistency_analysis_analysisId_chapterId_key" ON "chapter_consistency_analysis"("analysisId", "chapterId");
CREATE INDEX "chapter_consistency_analysis_analysisId_idx" ON "chapter_consistency_analysis"("analysisId");
CREATE INDEX "chapter_consistency_analysis_chapterId_idx" ON "chapter_consistency_analysis"("chapterId");

-- DuplicateContentPair indexes
CREATE INDEX "duplicate_content_pairs_analysisId_idx" ON "duplicate_content_pairs"("analysisId");
CREATE INDEX "duplicate_content_pairs_similarityScore_idx" ON "duplicate_content_pairs"("similarityScore");

-- ============================================================================
-- ADD FOREIGN KEYS
-- ============================================================================

-- CourseDepthAnalysisV2 → Course
ALTER TABLE "course_depth_analysis_v2" ADD CONSTRAINT "course_depth_analysis_v2_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DepthAnalysisIssue → CourseDepthAnalysisV2
ALTER TABLE "depth_analysis_issues" ADD CONSTRAINT "depth_analysis_issues_analysisId_fkey"
FOREIGN KEY ("analysisId") REFERENCES "course_depth_analysis_v2"("id") ON DELETE CASCADE ON UPDATE CASCADE;
