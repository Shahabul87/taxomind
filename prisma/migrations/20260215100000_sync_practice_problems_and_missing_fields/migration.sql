-- Migration: sync_practice_problems_and_missing_fields
-- Date: 2026-02-15
-- Description: Syncs local schema with production. Adds 4 new practice problem
--   tables, 22 missing fields across 7 models, 1 new enum, 2 new FKs, and indexes.
--   ALL changes are additive (no DROP, DELETE, or TRUNCATE). Zero data loss.
--
-- Excluded from this migration (handled separately):
--   - 7x updatedAt DROP DEFAULT (cosmetic Prisma introspection artifact, no-op)
--   - 3x embeddingVector vector(1536) columns (requires pgvector extension setup)
--   - 1x sam_preset_effectiveness.id DROP DEFAULT (cosmetic, both produce unique IDs)

-- ============================================================
-- 1. Create new enum
-- ============================================================
CREATE TYPE "SAMThreadType" AS ENUM ('MAIN', 'BRANCH', 'FOLLOW_UP');

-- ============================================================
-- 2. Add missing fields to existing tables
-- ============================================================

-- CognitiveSkillProgress: decay tracking + trend analysis
ALTER TABLE "CognitiveSkillProgress"
  ADD COLUMN "confidence" DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN "lastDecayAppliedAt" TIMESTAMP(3),
  ADD COLUMN "trend" TEXT DEFAULT 'stable';

-- Notification: feedback + dismissal tracking
ALTER TABLE "Notification"
  ADD COLUMN "dismissedAt" TIMESTAMP(3),
  ADD COLUMN "feedback" TEXT;

-- Section: activity + concepts metadata
ALTER TABLE "Section"
  ADD COLUMN "keyConceptsCovered" TEXT,
  ADD COLUMN "practicalActivity" TEXT;

-- SelfAssessmentExam: adaptive exam support
ALTER TABLE "SelfAssessmentExam"
  ADD COLUMN "enableAdaptive" BOOLEAN NOT NULL DEFAULT false;

-- SpacedRepetitionSchedule: Bloom's-weighted decay + priority
ALTER TABLE "SpacedRepetitionSchedule"
  ADD COLUMN "bloomsLevel" "BloomsLevel",
  ADD COLUMN "lastDecayAppliedAt" TIMESTAMP(3),
  ADD COLUMN "priority" TEXT,
  ADD COLUMN "quality" INTEGER;

-- UserAIPreferences: per-capability model selection
ALTER TABLE "UserAIPreferences"
  ADD COLUMN "analysisModel" TEXT,
  ADD COLUMN "chatModel" TEXT,
  ADD COLUMN "codeModel" TEXT,
  ADD COLUMN "courseModel" TEXT,
  ADD COLUMN "skillRoadmapModel" TEXT;

-- SAMConversation: threading support
ALTER TABLE "sam_conversations"
  ADD COLUMN "parentConversationId" TEXT,
  ADD COLUMN "summary" TEXT,
  ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "threadType" "SAMThreadType" NOT NULL DEFAULT 'MAIN',
  ADD COLUMN "topic" TEXT;

-- ============================================================
-- 3. Create new tables: Practice Problem system
-- ============================================================

CREATE TABLE "PracticeProblemSet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" TEXT,
    "topic" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "difficulty" TEXT DEFAULT 'intermediate',
    "bloomsLevel" "BloomsLevel" DEFAULT 'APPLY',
    "questionCount" INTEGER NOT NULL DEFAULT 5,
    "questionTypes" TEXT[] DEFAULT ARRAY['MULTIPLE_CHOICE', 'SHORT_ANSWER']::TEXT[],
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "bestScore" DOUBLE PRECISION,
    "avgScore" DOUBLE PRECISION,
    "lastAttemptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PracticeProblemSet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PracticeProblemQuestion" (
    "id" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "questionType" "QuestionType" NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    "question" TEXT NOT NULL,
    "options" JSONB,
    "correctAnswer" TEXT NOT NULL,
    "explanation" TEXT,
    "acceptableVariations" JSONB,
    "bloomsLevel" "BloomsLevel" NOT NULL DEFAULT 'APPLY',
    "difficulty" "QuestionDifficulty" NOT NULL DEFAULT 'MEDIUM',
    "points" INTEGER NOT NULL DEFAULT 10,
    "order" INTEGER NOT NULL DEFAULT 0,
    "hints" JSONB,
    "relatedConcepts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cognitiveSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "estimatedTime" INTEGER,
    "totalAttempts" INTEGER NOT NULL DEFAULT 0,
    "correctAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PracticeProblemQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserPracticeAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "scorePercentage" DOUBLE PRECISION,
    "earnedPoints" INTEGER NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "timeSpent" INTEGER,
    "bloomsPerformance" JSONB,
    "weakAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "strongAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recommendations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserPracticeAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserPracticeAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "isCorrect" BOOLEAN,
    "pointsEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeSpent" INTEGER,
    "evaluationType" "EvaluationType" NOT NULL DEFAULT 'AUTO_GRADED',
    "aiFeedback" TEXT,
    "aiScore" DOUBLE PRECISION,
    "aiAccuracy" DOUBLE PRECISION,
    "aiCompleteness" DOUBLE PRECISION,
    "targetBloomsLevel" "BloomsLevel",
    "demonstratedLevel" "BloomsLevel",
    "misconceptions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "knowledgeGaps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserPracticeAnswer_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- 4. Create indexes
-- ============================================================

CREATE INDEX "PracticeProblemSet_userId_sectionId_idx" ON "PracticeProblemSet"("userId", "sectionId");
CREATE INDEX "PracticeProblemSet_userId_createdAt_idx" ON "PracticeProblemSet"("userId", "createdAt");
CREATE INDEX "PracticeProblemQuestion_setId_order_idx" ON "PracticeProblemQuestion"("setId", "order");
CREATE INDEX "UserPracticeAttempt_userId_setId_idx" ON "UserPracticeAttempt"("userId", "setId");
CREATE INDEX "UserPracticeAttempt_userId_status_idx" ON "UserPracticeAttempt"("userId", "status");
CREATE UNIQUE INDEX "UserPracticeAttempt_userId_setId_attemptNumber_key" ON "UserPracticeAttempt"("userId", "setId", "attemptNumber");
CREATE INDEX "UserPracticeAnswer_attemptId_idx" ON "UserPracticeAnswer"("attemptId");
CREATE INDEX "UserPracticeAnswer_questionId_idx" ON "UserPracticeAnswer"("questionId");
CREATE UNIQUE INDEX "UserPracticeAnswer_attemptId_questionId_key" ON "UserPracticeAnswer"("attemptId", "questionId");
CREATE INDEX "SpacedRepetitionSchedule_priority_idx" ON "SpacedRepetitionSchedule"("priority");
CREATE INDEX "sam_conversations_parentConversationId_idx" ON "sam_conversations"("parentConversationId");

-- ============================================================
-- 5. Add foreign keys
-- ============================================================

-- SAMConversation self-referencing FK for thread parent
ALTER TABLE "sam_conversations"
  ADD CONSTRAINT "sam_conversations_parentConversationId_fkey"
  FOREIGN KEY ("parentConversationId") REFERENCES "sam_conversations"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Missing FKs for practice_sessions and skill_mastery_10k
ALTER TABLE "practice_sessions"
  ADD CONSTRAINT "practice_sessions_skillId_fkey"
  FOREIGN KEY ("skillId") REFERENCES "SkillBuildDefinition"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "skill_mastery_10k"
  ADD CONSTRAINT "skill_mastery_10k_skillId_fkey"
  FOREIGN KEY ("skillId") REFERENCES "SkillBuildDefinition"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- PracticeProblemSet FKs
ALTER TABLE "PracticeProblemSet"
  ADD CONSTRAINT "PracticeProblemSet_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PracticeProblemSet"
  ADD CONSTRAINT "PracticeProblemSet_sectionId_fkey"
  FOREIGN KEY ("sectionId") REFERENCES "Section"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- PracticeProblemQuestion FK
ALTER TABLE "PracticeProblemQuestion"
  ADD CONSTRAINT "PracticeProblemQuestion_setId_fkey"
  FOREIGN KEY ("setId") REFERENCES "PracticeProblemSet"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- UserPracticeAttempt FKs
ALTER TABLE "UserPracticeAttempt"
  ADD CONSTRAINT "UserPracticeAttempt_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserPracticeAttempt"
  ADD CONSTRAINT "UserPracticeAttempt_setId_fkey"
  FOREIGN KEY ("setId") REFERENCES "PracticeProblemSet"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- UserPracticeAnswer FKs
ALTER TABLE "UserPracticeAnswer"
  ADD CONSTRAINT "UserPracticeAnswer_attemptId_fkey"
  FOREIGN KEY ("attemptId") REFERENCES "UserPracticeAttempt"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserPracticeAnswer"
  ADD CONSTRAINT "UserPracticeAnswer_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "PracticeProblemQuestion"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================
-- 6. Rename indexes (cosmetic alignment with local schema)
-- ============================================================

ALTER INDEX "SAMPresetEffectiveness_bayesianScore_idx" RENAME TO "sam_preset_effectiveness_bayesianScore_idx";
ALTER INDEX "SAMPresetEffectiveness_modeId_idx" RENAME TO "sam_preset_effectiveness_modeId_idx";
