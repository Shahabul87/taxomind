-- CreateEnum
CREATE TYPE "BloomsFeedbackType" AS ENUM ('EXPLICIT', 'IMPLICIT', 'EXPERT');

-- CreateEnum
CREATE TYPE "CognitiveLevel" AS ENUM ('REMEMBERER', 'UNDERSTANDER', 'APPLIER', 'ANALYZER', 'EVALUATOR', 'CREATOR');

-- CreateEnum
CREATE TYPE "CognitiveMilestoneType" AS ENUM ('FIRST_ACTIVITY', 'LEVEL_UP', 'STREAK', 'MASTERY', 'BREAKTHROUGH', 'CREATOR_STATUS');

-- CreateTable
CREATE TABLE "blooms_classification_feedback" (
    "id" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "predictedLevel" INTEGER NOT NULL,
    "predictedSubLevel" TEXT,
    "predictedConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "actualLevel" INTEGER,
    "actualSubLevel" TEXT,
    "assessmentOutcome" DOUBLE PRECISION,
    "feedbackType" "BloomsFeedbackType" NOT NULL DEFAULT 'IMPLICIT',
    "userId" TEXT,
    "courseId" TEXT,
    "sectionId" TEXT,
    "analysisMethod" TEXT,
    "contentSample" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blooms_classification_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blooms_calibration_metrics" (
    "id" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "periodType" TEXT NOT NULL DEFAULT 'daily',
    "totalSamples" INTEGER NOT NULL DEFAULT 0,
    "explicitFeedback" INTEGER NOT NULL DEFAULT 0,
    "implicitFeedback" INTEGER NOT NULL DEFAULT 0,
    "expertFeedback" INTEGER NOT NULL DEFAULT 0,
    "accuracyByLevel" JSONB NOT NULL DEFAULT '{}',
    "calibrationBuckets" JSONB NOT NULL DEFAULT '{}',
    "overallAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expectedCalibrationError" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxCalibrationError" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "levelAdjustments" JSONB NOT NULL DEFAULT '{}',
    "confidenceAdjustment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blooms_calibration_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_cognitive_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "overallLevel" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "levelName" "CognitiveLevel" NOT NULL DEFAULT 'REMEMBERER',
    "rememberScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "understandScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "applyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "analyzeScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "evaluateScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rememberXP" INTEGER NOT NULL DEFAULT 0,
    "understandXP" INTEGER NOT NULL DEFAULT 0,
    "applyXP" INTEGER NOT NULL DEFAULT 0,
    "analyzeXP" INTEGER NOT NULL DEFAULT 0,
    "evaluateXP" INTEGER NOT NULL DEFAULT 0,
    "createXP" INTEGER NOT NULL DEFAULT 0,
    "rememberLevel" INTEGER NOT NULL DEFAULT 1,
    "understandLevel" INTEGER NOT NULL DEFAULT 0,
    "applyLevel" INTEGER NOT NULL DEFAULT 0,
    "analyzeLevel" INTEGER NOT NULL DEFAULT 0,
    "evaluateLevel" INTEGER NOT NULL DEFAULT 0,
    "createLevel" INTEGER NOT NULL DEFAULT 0,
    "startingLevel" DOUBLE PRECISION,
    "peakLevel" DOUBLE PRECISION,
    "totalGrowth" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "topStrengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "primaryGrowthArea" TEXT,
    "totalActivities" INTEGER NOT NULL DEFAULT 0,
    "lastActivityAt" TIMESTAMP(3),
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_cognitive_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_course_growth" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "startingLevel" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "currentLevel" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "levelGrowth" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "startingDistribution" JSONB,
    "currentDistribution" JSONB,
    "topImprovements" JSONB,
    "activitiesCompleted" INTEGER NOT NULL DEFAULT 0,
    "assessmentsTaken" INTEGER NOT NULL DEFAULT 0,
    "averageScore" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "user_course_growth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cognitive_milestones" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "type" "CognitiveMilestoneType" NOT NULL,
    "level" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "courseId" TEXT,
    "triggeredBy" TEXT,

    CONSTRAINT "cognitive_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_cognitive_quality" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "cognitiveGrade" TEXT NOT NULL DEFAULT 'C',
    "cognitiveScore" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "rememberPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "understandPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "applyPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "analyzePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "evaluatePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "levelDiversity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "higherOrderRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recommendations" JSONB,
    "topRecommendation" TEXT,
    "categoryId" TEXT,
    "categoryRank" INTEGER,
    "categoryPercentile" DOUBLE PRECISION,
    "meetsQualityGate" BOOLEAN NOT NULL DEFAULT false,
    "qualityGateIssues" JSONB,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_cognitive_quality_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blooms_classification_feedback_contentHash_idx" ON "blooms_classification_feedback"("contentHash");
CREATE INDEX "blooms_classification_feedback_userId_createdAt_idx" ON "blooms_classification_feedback"("userId", "createdAt");
CREATE INDEX "blooms_classification_feedback_predictedLevel_actualLevel_idx" ON "blooms_classification_feedback"("predictedLevel", "actualLevel");
CREATE INDEX "blooms_classification_feedback_feedbackType_createdAt_idx" ON "blooms_classification_feedback"("feedbackType", "createdAt");

CREATE INDEX "blooms_calibration_metrics_periodType_periodStart_idx" ON "blooms_calibration_metrics"("periodType", "periodStart");
CREATE INDEX "blooms_calibration_metrics_calculatedAt_idx" ON "blooms_calibration_metrics"("calculatedAt");

CREATE UNIQUE INDEX "blooms_calibration_metrics_periodType_periodStart_key" ON "blooms_calibration_metrics"("periodType", "periodStart");

CREATE UNIQUE INDEX "user_cognitive_profiles_userId_key" ON "user_cognitive_profiles"("userId");
CREATE INDEX "user_cognitive_profiles_userId_idx" ON "user_cognitive_profiles"("userId");
CREATE INDEX "user_cognitive_profiles_overallLevel_idx" ON "user_cognitive_profiles"("overallLevel");
CREATE INDEX "user_cognitive_profiles_levelName_idx" ON "user_cognitive_profiles"("levelName");

CREATE UNIQUE INDEX "user_course_growth_userId_courseId_key" ON "user_course_growth"("userId", "courseId");
CREATE INDEX "user_course_growth_userId_idx" ON "user_course_growth"("userId");
CREATE INDEX "user_course_growth_courseId_idx" ON "user_course_growth"("courseId");
CREATE INDEX "user_course_growth_profileId_idx" ON "user_course_growth"("profileId");

CREATE INDEX "cognitive_milestones_profileId_idx" ON "cognitive_milestones"("profileId");
CREATE INDEX "cognitive_milestones_type_idx" ON "cognitive_milestones"("type");
CREATE INDEX "cognitive_milestones_achievedAt_idx" ON "cognitive_milestones"("achievedAt");

CREATE UNIQUE INDEX "course_cognitive_quality_courseId_key" ON "course_cognitive_quality"("courseId");
CREATE INDEX "course_cognitive_quality_courseId_idx" ON "course_cognitive_quality"("courseId");
CREATE INDEX "course_cognitive_quality_cognitiveGrade_idx" ON "course_cognitive_quality"("cognitiveGrade");
CREATE INDEX "course_cognitive_quality_cognitiveScore_idx" ON "course_cognitive_quality"("cognitiveScore");
CREATE INDEX "course_cognitive_quality_categoryId_idx" ON "course_cognitive_quality"("categoryId");

-- AddForeignKey
ALTER TABLE "blooms_classification_feedback" ADD CONSTRAINT "blooms_classification_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_cognitive_profiles" ADD CONSTRAINT "user_cognitive_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_course_growth" ADD CONSTRAINT "user_course_growth_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "user_cognitive_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cognitive_milestones" ADD CONSTRAINT "cognitive_milestones_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "user_cognitive_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_cognitive_quality" ADD CONSTRAINT "course_cognitive_quality_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex (Performance indexes on existing tables)
CREATE INDEX "User_subscriptionTier_hasAIAccess_idx" ON "User"("subscriptionTier", "hasAIAccess");
CREATE INDEX "User_isPremium_premiumExpiresAt_idx" ON "User"("isPremium", "premiumExpiresAt");
CREATE INDEX "User_dailyAiUsageResetAt_idx" ON "User"("dailyAiUsageResetAt");
CREATE INDEX "UserExamAttempt_userId_status_startedAt_idx" ON "UserExamAttempt"("userId", "status", "startedAt");
CREATE INDEX "UserExamAttempt_examId_status_startedAt_idx" ON "UserExamAttempt"("examId", "status", "startedAt");
