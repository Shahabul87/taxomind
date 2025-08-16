-- CreateEnum
CREATE TYPE "public"."InstructorStatus" AS ENUM ('PENDING', 'VERIFIED', 'SUSPENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."InstructorTier" AS ENUM ('BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "public"."LearningStyle" AS ENUM ('VISUAL', 'AUDITORY', 'KINESTHETIC', 'READING_WRITING');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."UserRole" ADD VALUE 'INSTRUCTOR';
ALTER TYPE "public"."UserRole" ADD VALUE 'LEARNER';
ALTER TYPE "public"."UserRole" ADD VALUE 'MODERATOR';
ALTER TYPE "public"."UserRole" ADD VALUE 'AFFILIATE';

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "bloomsProgress" JSONB,
ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "instructorRating" DECIMAL(65,30),
ADD COLUMN     "instructorStatus" "public"."InstructorStatus" DEFAULT 'PENDING',
ADD COLUMN     "instructorTier" "public"."InstructorTier" DEFAULT 'BASIC',
ADD COLUMN     "instructorVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "isAccountLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "lastLoginIp" TEXT,
ADD COLUMN     "learningStyle" "public"."LearningStyle",
ADD COLUMN     "lockReason" TEXT,
ADD COLUMN     "passwordChangedAt" TIMESTAMP(3),
ADD COLUMN     "paypalAccountId" TEXT,
ADD COLUMN     "stripeAccountId" TEXT,
ADD COLUMN     "totalCoursesCreated" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalCoursesSold" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalRevenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "walletBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,
ALTER COLUMN "role" SET DEFAULT 'LEARNER';

-- AlterTable
ALTER TABLE "public"."audit_logs" ADD COLUMN     "eventType" TEXT,
ADD COLUMN     "message" TEXT,
ADD COLUMN     "metadata" TEXT,
ADD COLUMN     "requestId" TEXT,
ADD COLUMN     "resourceId" TEXT,
ADD COLUMN     "resourceType" TEXT,
ADD COLUMN     "riskScore" INTEGER,
ADD COLUMN     "sessionId" TEXT,
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userEmail" TEXT,
ADD COLUMN     "userRole" TEXT;

-- AlterTable
ALTER TABLE "public"."collaboration_sessions" ADD COLUMN     "activities" JSONB,
ADD COLUMN     "chapterId" TEXT,
ADD COLUMN     "courseId" TEXT,
ADD COLUMN     "initiatorId" TEXT,
ADD COLUMN     "insights" JSONB,
ADD COLUMN     "metrics" JSONB,
ADD COLUMN     "sessionType" TEXT;

-- CreateTable
CREATE TABLE "public"."collaboration_participants" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "contributions" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "collaboration_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."collaboration_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "replyToId" TEXT,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collaboration_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MultiMediaAnalysis" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "chapterId" TEXT,
    "contentType" TEXT NOT NULL,
    "contentUrl" TEXT,
    "analysis" JSONB NOT NULL,
    "engagementScore" DOUBLE PRECISION,
    "accessibilityScore" DOUBLE PRECISION,
    "effectivenessScore" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MultiMediaAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MultiModalAnalysis" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "insights" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MultiModalAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PredictiveLearningAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "courseId" TEXT,
    "predictionType" TEXT NOT NULL,
    "predictionData" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "validatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PredictiveLearningAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ResourceDiscovery" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "topicName" TEXT NOT NULL,
    "resources" JSONB NOT NULL,
    "resourceCount" INTEGER NOT NULL,
    "avgQualityScore" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceDiscovery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ResourceROIAnalysis" (
    "id" TEXT NOT NULL,
    "resourceUrl" TEXT NOT NULL,
    "resourceTitle" TEXT NOT NULL,
    "costBenefitRatio" DOUBLE PRECISION NOT NULL,
    "learningEfficiency" DOUBLE PRECISION NOT NULL,
    "recommendation" TEXT NOT NULL,
    "analysis" JSONB NOT NULL,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourceROIAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PersonalizedResourceRecommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recommendations" JSONB NOT NULL,
    "topRecommendation" TEXT NOT NULL,
    "avgMatchScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalizedResourceRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GeneratedContent" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "metadata" JSONB,
    "quality" DOUBLE PRECISION,
    "usage" INTEGER NOT NULL DEFAULT 0,
    "feedback" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LearningStyleAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "primaryStyle" TEXT NOT NULL,
    "secondaryStyle" TEXT,
    "styleStrengths" JSONB NOT NULL,
    "evidenceFactors" TEXT[],
    "confidence" DOUBLE PRECISION NOT NULL,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningStyleAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContentOptimization" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "adaptations" JSONB NOT NULL,
    "presentationOrder" TEXT[],
    "optimizationData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentOptimization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EmotionalStateAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentEmotion" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "trend" TEXT NOT NULL,
    "indicators" JSONB NOT NULL,
    "recommendations" TEXT[],
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmotionalStateAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MotivationProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "intrinsicFactors" JSONB NOT NULL,
    "extrinsicFactors" JSONB NOT NULL,
    "currentLevel" DOUBLE PRECISION NOT NULL,
    "triggers" TEXT[],
    "barriers" TEXT[],
    "sustainabilityScore" DOUBLE PRECISION NOT NULL,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MotivationProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PersonalizedLearningPath" (
    "id" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetOutcome" TEXT NOT NULL,
    "nodes" JSONB NOT NULL,
    "edges" JSONB NOT NULL,
    "estimatedDuration" DOUBLE PRECISION NOT NULL,
    "alternativePaths" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalizedLearningPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PersonalizationResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recommendations" JSONB NOT NULL,
    "adaptations" JSONB NOT NULL,
    "insights" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalizationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrganizationAnalytics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "totalLearners" INTEGER NOT NULL,
    "activeLearners" INTEGER NOT NULL,
    "engagementRate" DOUBLE PRECISION NOT NULL,
    "completionRate" DOUBLE PRECISION NOT NULL,
    "averageSkillGrowth" DOUBLE PRECISION NOT NULL,
    "departmentMetrics" JSONB NOT NULL,
    "skillGaps" JSONB NOT NULL,
    "roiMetrics" JSONB NOT NULL,
    "complianceMetrics" JSONB NOT NULL,
    "budgetMetrics" JSONB NOT NULL,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkforcePrediction" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "timeHorizon" INTEGER NOT NULL,
    "currentCapabilities" JSONB NOT NULL,
    "futureNeeds" JSONB NOT NULL,
    "developmentPlan" JSONB NOT NULL,
    "talentMetrics" JSONB NOT NULL,
    "predictedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkforcePrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExecutiveReport" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "executiveSummary" TEXT NOT NULL,
    "keyMetrics" JSONB NOT NULL,
    "trends" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "risks" JSONB NOT NULL,
    "opportunities" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExecutiveReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FinancialSnapshot" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "totalRevenue" DOUBLE PRECISION NOT NULL,
    "totalCosts" DOUBLE PRECISION NOT NULL,
    "netProfit" DOUBLE PRECISION NOT NULL,
    "profitMargin" DOUBLE PRECISION NOT NULL,
    "activeSubscribers" INTEGER NOT NULL,
    "monthlyRecurringRevenue" DOUBLE PRECISION NOT NULL,
    "metrics" JSONB NOT NULL,
    "period" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PricingExperiment" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "courseId" TEXT,
    "name" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "originalPrice" DOUBLE PRECISION NOT NULL,
    "testPrice" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "significance" DOUBLE PRECISION,
    "winner" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingExperiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SubscriptionAnalytics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "cohortMonth" TEXT NOT NULL,
    "initialSubscribers" INTEGER NOT NULL,
    "activeSubscribers" INTEGER NOT NULL,
    "churnedSubscribers" INTEGER NOT NULL,
    "upgrades" INTEGER NOT NULL,
    "downgrades" INTEGER NOT NULL,
    "revenue" DOUBLE PRECISION NOT NULL,
    "retentionRate" DOUBLE PRECISION NOT NULL,
    "ltv" DOUBLE PRECISION NOT NULL,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CollaborationContribution" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contributionType" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "impact" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollaborationContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CollaborationReaction" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reactionType" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollaborationReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CollaborationAnalytics" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sessionAnalytics" JSONB NOT NULL,
    "participantAnalytics" JSONB NOT NULL,
    "contentAnalytics" JSONB NOT NULL,
    "networkAnalytics" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollaborationAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CognitiveFitnessAssessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "dimensions" JSONB NOT NULL,
    "exercises" JSONB NOT NULL,
    "progress" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CognitiveFitnessAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FitnessSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" DOUBLE PRECISION,
    "performance" JSONB,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FitnessSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FitnessMilestone" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "improvement" DOUBLE PRECISION NOT NULL,
    "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FitnessMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LearningDNA" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dnaSequence" JSONB NOT NULL,
    "traits" JSONB NOT NULL,
    "heritage" JSONB NOT NULL,
    "mutations" JSONB NOT NULL,
    "phenotype" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningDNA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StudyBuddy" (
    "id" TEXT NOT NULL,
    "buddyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "personality" JSONB NOT NULL,
    "avatar" JSONB NOT NULL,
    "relationship" JSONB NOT NULL,
    "capabilities" JSONB NOT NULL,
    "effectiveness" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudyBuddy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BuddyInteraction" (
    "id" TEXT NOT NULL,
    "buddyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "interactionType" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "userResponse" TEXT,
    "effectiveness" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuddyInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BuddyAdjustment" (
    "id" TEXT NOT NULL,
    "buddyId" TEXT NOT NULL,
    "adjustmentType" TEXT NOT NULL,
    "parameters" JSONB NOT NULL,
    "reason" TEXT NOT NULL,
    "impact" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuddyAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuantumLearningPath" (
    "id" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "learningGoal" TEXT NOT NULL,
    "superposition" JSONB NOT NULL,
    "entanglements" JSONB NOT NULL,
    "probability" JSONB NOT NULL,
    "coherenceLevel" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "collapsed" BOOLEAN NOT NULL DEFAULT false,
    "collapse" JSONB,
    "finalStateId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuantumLearningPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuantumObservation" (
    "id" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "observationId" TEXT NOT NULL,
    "observationType" TEXT NOT NULL,
    "observer" TEXT NOT NULL,
    "impact" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuantumObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_consents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "purpose" TEXT,
    "grantedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "version" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."gdpr_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "reason" TEXT,
    "responseData" JSONB,
    "verificationToken" TEXT,
    "processedBy" TEXT,
    "notes" TEXT,

    CONSTRAINT "gdpr_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."data_processing_activities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "legalBasis" TEXT NOT NULL,
    "dataCategories" TEXT[],
    "dataSubjects" TEXT[],
    "recipients" TEXT[],
    "retentionPeriod" TEXT NOT NULL,
    "securityMeasures" TEXT NOT NULL,
    "thirdCountryTransfers" BOOLEAN NOT NULL DEFAULT false,
    "transferSafeguards" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_processing_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."privacy_policies" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "privacy_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."data_breaches" (
    "id" TEXT NOT NULL,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "discoveryDate" TIMESTAMP(3) NOT NULL,
    "reportedDate" TIMESTAMP(3),
    "severity" TEXT NOT NULL,
    "affectedUsers" INTEGER NOT NULL,
    "dataTypes" TEXT[],
    "description" TEXT NOT NULL,
    "cause" TEXT NOT NULL,
    "measures" TEXT NOT NULL,
    "notifications" JSONB,
    "status" TEXT NOT NULL,
    "reportedToAuthority" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_breaches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."social_learning_analyses" (
    "id" TEXT NOT NULL,
    "groupId" TEXT,
    "communityId" TEXT,
    "analysisType" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_learning_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."mentor_mentee_matches" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "menteeId" TEXT NOT NULL,
    "compatibilityScore" DOUBLE PRECISION NOT NULL,
    "matchingFactors" JSONB NOT NULL,
    "suggestedActivities" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "feedback" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentor_mentee_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "deviceInfo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."api_keys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "hashedKey" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "rateLimit" INTEGER NOT NULL DEFAULT 1000,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."enhanced_audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enhanced_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."role_permissions" (
    "id" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_permissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."instructor_verifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "verificationNotes" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "status" "public"."InstructorStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instructor_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rate_limits" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."password_histories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "collaboration_participants_sessionId_isActive_idx" ON "public"."collaboration_participants"("sessionId", "isActive");

-- CreateIndex
CREATE INDEX "collaboration_participants_userId_idx" ON "public"."collaboration_participants"("userId");

-- CreateIndex
CREATE INDEX "collaboration_participants_lastActivity_idx" ON "public"."collaboration_participants"("lastActivity");

-- CreateIndex
CREATE UNIQUE INDEX "collaboration_participants_sessionId_userId_key" ON "public"."collaboration_participants"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "collaboration_messages_sessionId_createdAt_idx" ON "public"."collaboration_messages"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "collaboration_messages_userId_idx" ON "public"."collaboration_messages"("userId");

-- CreateIndex
CREATE INDEX "collaboration_messages_replyToId_idx" ON "public"."collaboration_messages"("replyToId");

-- CreateIndex
CREATE INDEX "MultiMediaAnalysis_courseId_contentType_idx" ON "public"."MultiMediaAnalysis"("courseId", "contentType");

-- CreateIndex
CREATE INDEX "MultiMediaAnalysis_chapterId_idx" ON "public"."MultiMediaAnalysis"("chapterId");

-- CreateIndex
CREATE INDEX "MultiModalAnalysis_courseId_idx" ON "public"."MultiModalAnalysis"("courseId");

-- CreateIndex
CREATE INDEX "PredictiveLearningAnalysis_userId_predictionType_idx" ON "public"."PredictiveLearningAnalysis"("userId", "predictionType");

-- CreateIndex
CREATE INDEX "PredictiveLearningAnalysis_courseId_predictionType_idx" ON "public"."PredictiveLearningAnalysis"("courseId", "predictionType");

-- CreateIndex
CREATE INDEX "PredictiveLearningAnalysis_createdAt_idx" ON "public"."PredictiveLearningAnalysis"("createdAt");

-- CreateIndex
CREATE INDEX "ResourceDiscovery_topicId_idx" ON "public"."ResourceDiscovery"("topicId");

-- CreateIndex
CREATE INDEX "ResourceDiscovery_topicName_idx" ON "public"."ResourceDiscovery"("topicName");

-- CreateIndex
CREATE INDEX "ResourceROIAnalysis_resourceUrl_idx" ON "public"."ResourceROIAnalysis"("resourceUrl");

-- CreateIndex
CREATE INDEX "ResourceROIAnalysis_recommendation_idx" ON "public"."ResourceROIAnalysis"("recommendation");

-- CreateIndex
CREATE INDEX "PersonalizedResourceRecommendation_userId_createdAt_idx" ON "public"."PersonalizedResourceRecommendation"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "GeneratedContent_contentType_createdAt_idx" ON "public"."GeneratedContent"("contentType", "createdAt");

-- CreateIndex
CREATE INDEX "GeneratedContent_quality_idx" ON "public"."GeneratedContent"("quality");

-- CreateIndex
CREATE INDEX "LearningStyleAnalysis_userId_analyzedAt_idx" ON "public"."LearningStyleAnalysis"("userId", "analyzedAt");

-- CreateIndex
CREATE INDEX "ContentOptimization_userId_contentId_idx" ON "public"."ContentOptimization"("userId", "contentId");

-- CreateIndex
CREATE INDEX "EmotionalStateAnalysis_userId_analyzedAt_idx" ON "public"."EmotionalStateAnalysis"("userId", "analyzedAt");

-- CreateIndex
CREATE INDEX "MotivationProfile_userId_idx" ON "public"."MotivationProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalizedLearningPath_pathId_key" ON "public"."PersonalizedLearningPath"("pathId");

-- CreateIndex
CREATE INDEX "PersonalizedLearningPath_userId_createdAt_idx" ON "public"."PersonalizedLearningPath"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PersonalizedLearningPath_pathId_idx" ON "public"."PersonalizedLearningPath"("pathId");

-- CreateIndex
CREATE INDEX "PersonalizationResult_userId_appliedAt_idx" ON "public"."PersonalizationResult"("userId", "appliedAt");

-- CreateIndex
CREATE INDEX "OrganizationAnalytics_organizationId_analyzedAt_idx" ON "public"."OrganizationAnalytics"("organizationId", "analyzedAt");

-- CreateIndex
CREATE INDEX "WorkforcePrediction_organizationId_predictedAt_idx" ON "public"."WorkforcePrediction"("organizationId", "predictedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExecutiveReport_reportId_key" ON "public"."ExecutiveReport"("reportId");

-- CreateIndex
CREATE INDEX "ExecutiveReport_organizationId_reportType_generatedAt_idx" ON "public"."ExecutiveReport"("organizationId", "reportType", "generatedAt");

-- CreateIndex
CREATE INDEX "ExecutiveReport_reportId_idx" ON "public"."ExecutiveReport"("reportId");

-- CreateIndex
CREATE INDEX "FinancialSnapshot_organizationId_createdAt_idx" ON "public"."FinancialSnapshot"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "FinancialSnapshot_period_idx" ON "public"."FinancialSnapshot"("period");

-- CreateIndex
CREATE UNIQUE INDEX "PricingExperiment_experimentId_key" ON "public"."PricingExperiment"("experimentId");

-- CreateIndex
CREATE INDEX "PricingExperiment_courseId_status_idx" ON "public"."PricingExperiment"("courseId", "status");

-- CreateIndex
CREATE INDEX "PricingExperiment_experimentId_idx" ON "public"."PricingExperiment"("experimentId");

-- CreateIndex
CREATE INDEX "SubscriptionAnalytics_organizationId_cohortMonth_idx" ON "public"."SubscriptionAnalytics"("organizationId", "cohortMonth");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionAnalytics_organizationId_cohortMonth_key" ON "public"."SubscriptionAnalytics"("organizationId", "cohortMonth");

-- CreateIndex
CREATE INDEX "CollaborationContribution_sessionId_userId_idx" ON "public"."CollaborationContribution"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "CollaborationContribution_contributionType_idx" ON "public"."CollaborationContribution"("contributionType");

-- CreateIndex
CREATE INDEX "CollaborationReaction_contributionId_idx" ON "public"."CollaborationReaction"("contributionId");

-- CreateIndex
CREATE INDEX "CollaborationReaction_userId_idx" ON "public"."CollaborationReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CollaborationReaction_contributionId_userId_reactionType_key" ON "public"."CollaborationReaction"("contributionId", "userId", "reactionType");

-- CreateIndex
CREATE UNIQUE INDEX "CollaborationAnalytics_sessionId_key" ON "public"."CollaborationAnalytics"("sessionId");

-- CreateIndex
CREATE INDEX "CollaborationAnalytics_sessionId_idx" ON "public"."CollaborationAnalytics"("sessionId");

-- CreateIndex
CREATE INDEX "CognitiveFitnessAssessment_userId_createdAt_idx" ON "public"."CognitiveFitnessAssessment"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "FitnessSession_userId_exerciseId_idx" ON "public"."FitnessSession"("userId", "exerciseId");

-- CreateIndex
CREATE INDEX "FitnessSession_status_idx" ON "public"."FitnessSession"("status");

-- CreateIndex
CREATE INDEX "FitnessMilestone_userId_dimension_idx" ON "public"."FitnessMilestone"("userId", "dimension");

-- CreateIndex
CREATE INDEX "LearningDNA_userId_createdAt_idx" ON "public"."LearningDNA"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StudyBuddy_buddyId_key" ON "public"."StudyBuddy"("buddyId");

-- CreateIndex
CREATE INDEX "StudyBuddy_userId_isActive_idx" ON "public"."StudyBuddy"("userId", "isActive");

-- CreateIndex
CREATE INDEX "StudyBuddy_buddyId_idx" ON "public"."StudyBuddy"("buddyId");

-- CreateIndex
CREATE INDEX "BuddyInteraction_buddyId_userId_idx" ON "public"."BuddyInteraction"("buddyId", "userId");

-- CreateIndex
CREATE INDEX "BuddyInteraction_interactionType_idx" ON "public"."BuddyInteraction"("interactionType");

-- CreateIndex
CREATE INDEX "BuddyAdjustment_buddyId_idx" ON "public"."BuddyAdjustment"("buddyId");

-- CreateIndex
CREATE UNIQUE INDEX "QuantumLearningPath_pathId_key" ON "public"."QuantumLearningPath"("pathId");

-- CreateIndex
CREATE INDEX "QuantumLearningPath_userId_isActive_idx" ON "public"."QuantumLearningPath"("userId", "isActive");

-- CreateIndex
CREATE INDEX "QuantumLearningPath_pathId_idx" ON "public"."QuantumLearningPath"("pathId");

-- CreateIndex
CREATE UNIQUE INDEX "QuantumObservation_observationId_key" ON "public"."QuantumObservation"("observationId");

-- CreateIndex
CREATE INDEX "QuantumObservation_pathId_idx" ON "public"."QuantumObservation"("pathId");

-- CreateIndex
CREATE INDEX "QuantumObservation_observationId_idx" ON "public"."QuantumObservation"("observationId");

-- CreateIndex
CREATE INDEX "user_consents_userId_consentType_idx" ON "public"."user_consents"("userId", "consentType");

-- CreateIndex
CREATE INDEX "user_consents_granted_idx" ON "public"."user_consents"("granted");

-- CreateIndex
CREATE INDEX "gdpr_requests_userId_status_idx" ON "public"."gdpr_requests"("userId", "status");

-- CreateIndex
CREATE INDEX "gdpr_requests_requestType_status_idx" ON "public"."gdpr_requests"("requestType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "privacy_policies_version_key" ON "public"."privacy_policies"("version");

-- CreateIndex
CREATE INDEX "privacy_policies_isActive_effectiveDate_idx" ON "public"."privacy_policies"("isActive", "effectiveDate");

-- CreateIndex
CREATE INDEX "social_learning_analyses_groupId_idx" ON "public"."social_learning_analyses"("groupId");

-- CreateIndex
CREATE INDEX "social_learning_analyses_communityId_idx" ON "public"."social_learning_analyses"("communityId");

-- CreateIndex
CREATE INDEX "social_learning_analyses_analysisType_idx" ON "public"."social_learning_analyses"("analysisType");

-- CreateIndex
CREATE INDEX "social_learning_analyses_analyzedAt_idx" ON "public"."social_learning_analyses"("analyzedAt");

-- CreateIndex
CREATE INDEX "mentor_mentee_matches_mentorId_idx" ON "public"."mentor_mentee_matches"("mentorId");

-- CreateIndex
CREATE INDEX "mentor_mentee_matches_menteeId_idx" ON "public"."mentor_mentee_matches"("menteeId");

-- CreateIndex
CREATE INDEX "mentor_mentee_matches_status_idx" ON "public"."mentor_mentee_matches"("status");

-- CreateIndex
CREATE INDEX "mentor_mentee_matches_compatibilityScore_idx" ON "public"."mentor_mentee_matches"("compatibilityScore");

-- CreateIndex
CREATE UNIQUE INDEX "mentor_mentee_matches_mentorId_menteeId_key" ON "public"."mentor_mentee_matches"("mentorId", "menteeId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "public"."sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "public"."sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "public"."sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "public"."sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "public"."api_keys"("key");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_hashedKey_key" ON "public"."api_keys"("hashedKey");

-- CreateIndex
CREATE INDEX "api_keys_hashedKey_idx" ON "public"."api_keys"("hashedKey");

-- CreateIndex
CREATE INDEX "api_keys_userId_idx" ON "public"."api_keys"("userId");

-- CreateIndex
CREATE INDEX "enhanced_audit_logs_userId_idx" ON "public"."enhanced_audit_logs"("userId");

-- CreateIndex
CREATE INDEX "enhanced_audit_logs_action_idx" ON "public"."enhanced_audit_logs"("action");

-- CreateIndex
CREATE INDEX "enhanced_audit_logs_resource_idx" ON "public"."enhanced_audit_logs"("resource");

-- CreateIndex
CREATE INDEX "enhanced_audit_logs_severity_idx" ON "public"."enhanced_audit_logs"("severity");

-- CreateIndex
CREATE INDEX "enhanced_audit_logs_createdAt_idx" ON "public"."enhanced_audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "public"."permissions"("name");

-- CreateIndex
CREATE INDEX "permissions_category_idx" ON "public"."permissions"("category");

-- CreateIndex
CREATE INDEX "role_permissions_role_idx" ON "public"."role_permissions"("role");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_permissionId_key" ON "public"."role_permissions"("role", "permissionId");

-- CreateIndex
CREATE INDEX "user_permissions_userId_idx" ON "public"."user_permissions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_permissions_userId_permissionId_key" ON "public"."user_permissions"("userId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "instructor_verifications_userId_key" ON "public"."instructor_verifications"("userId");

-- CreateIndex
CREATE INDEX "instructor_verifications_status_idx" ON "public"."instructor_verifications"("status");

-- CreateIndex
CREATE INDEX "rate_limits_identifier_idx" ON "public"."rate_limits"("identifier");

-- CreateIndex
CREATE INDEX "rate_limits_windowStart_idx" ON "public"."rate_limits"("windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limits_identifier_endpoint_windowStart_key" ON "public"."rate_limits"("identifier", "endpoint", "windowStart");

-- CreateIndex
CREATE INDEX "password_histories_userId_idx" ON "public"."password_histories"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_eventType_timestamp_idx" ON "public"."audit_logs"("eventType", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_riskScore_timestamp_idx" ON "public"."audit_logs"("riskScore", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_sessionId_idx" ON "public"."audit_logs"("sessionId");

-- CreateIndex
CREATE INDEX "audit_logs_requestId_idx" ON "public"."audit_logs"("requestId");

-- CreateIndex
CREATE INDEX "collaboration_sessions_courseId_isActive_idx" ON "public"."collaboration_sessions"("courseId", "isActive");

-- CreateIndex
CREATE INDEX "collaboration_sessions_initiatorId_idx" ON "public"."collaboration_sessions"("initiatorId");

-- AddForeignKey
ALTER TABLE "public"."collaboration_participants" ADD CONSTRAINT "collaboration_participants_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."collaboration_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collaboration_participants" ADD CONSTRAINT "collaboration_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collaboration_messages" ADD CONSTRAINT "collaboration_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."collaboration_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collaboration_messages" ADD CONSTRAINT "collaboration_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collaboration_messages" ADD CONSTRAINT "collaboration_messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "public"."collaboration_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MultiMediaAnalysis" ADD CONSTRAINT "MultiMediaAnalysis_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MultiMediaAnalysis" ADD CONSTRAINT "MultiMediaAnalysis_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "public"."Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MultiModalAnalysis" ADD CONSTRAINT "MultiModalAnalysis_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PredictiveLearningAnalysis" ADD CONSTRAINT "PredictiveLearningAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PredictiveLearningAnalysis" ADD CONSTRAINT "PredictiveLearningAnalysis_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PersonalizedResourceRecommendation" ADD CONSTRAINT "PersonalizedResourceRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LearningStyleAnalysis" ADD CONSTRAINT "LearningStyleAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentOptimization" ADD CONSTRAINT "ContentOptimization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmotionalStateAnalysis" ADD CONSTRAINT "EmotionalStateAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MotivationProfile" ADD CONSTRAINT "MotivationProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PersonalizedLearningPath" ADD CONSTRAINT "PersonalizedLearningPath_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PersonalizationResult" ADD CONSTRAINT "PersonalizationResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PricingExperiment" ADD CONSTRAINT "PricingExperiment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CollaborationContribution" ADD CONSTRAINT "CollaborationContribution_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."collaboration_sessions"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CollaborationReaction" ADD CONSTRAINT "CollaborationReaction_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "public"."CollaborationContribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CollaborationReaction" ADD CONSTRAINT "CollaborationReaction_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."collaboration_sessions"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CollaborationAnalytics" ADD CONSTRAINT "CollaborationAnalytics_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."collaboration_sessions"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CognitiveFitnessAssessment" ADD CONSTRAINT "CognitiveFitnessAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LearningDNA" ADD CONSTRAINT "LearningDNA_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudyBuddy" ADD CONSTRAINT "StudyBuddy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BuddyInteraction" ADD CONSTRAINT "BuddyInteraction_buddyId_fkey" FOREIGN KEY ("buddyId") REFERENCES "public"."StudyBuddy"("buddyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BuddyAdjustment" ADD CONSTRAINT "BuddyAdjustment_buddyId_fkey" FOREIGN KEY ("buddyId") REFERENCES "public"."StudyBuddy"("buddyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuantumLearningPath" ADD CONSTRAINT "QuantumLearningPath_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuantumObservation" ADD CONSTRAINT "QuantumObservation_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "public"."QuantumLearningPath"("pathId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_consents" ADD CONSTRAINT "user_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."gdpr_requests" ADD CONSTRAINT "gdpr_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_learning_analyses" ADD CONSTRAINT "social_learning_analyses_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mentor_mentee_matches" ADD CONSTRAINT "mentor_mentee_matches_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mentor_mentee_matches" ADD CONSTRAINT "mentor_mentee_matches_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."enhanced_audit_logs" ADD CONSTRAINT "enhanced_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_permissions" ADD CONSTRAINT "user_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."instructor_verifications" ADD CONSTRAINT "instructor_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."password_histories" ADD CONSTRAINT "password_histories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
