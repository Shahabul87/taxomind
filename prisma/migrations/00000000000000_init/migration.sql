-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "public"."InstructorStatus" AS ENUM ('PENDING', 'VERIFIED', 'SUSPENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."InstructorTier" AS ENUM ('BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "public"."LearningStyle" AS ENUM ('VISUAL', 'AUDITORY', 'KINESTHETIC', 'READING_WRITING');

-- CreateEnum
CREATE TYPE "public"."QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY', 'FILL_IN_BLANK', 'MATCHING', 'ORDERING');

-- CreateEnum
CREATE TYPE "public"."ActivityType" AS ENUM ('LOGIN', 'LOGOUT', 'COURSE_START', 'COURSE_COMPLETE', 'CHAPTER_START', 'CHAPTER_COMPLETE', 'SECTION_START', 'SECTION_COMPLETE', 'VIDEO_WATCH', 'VIDEO_PAUSE', 'VIDEO_RESUME', 'VIDEO_COMPLETE', 'QUIZ_START', 'QUIZ_SUBMIT', 'QUIZ_COMPLETE', 'EXAM_START', 'EXAM_SUBMIT', 'EXAM_COMPLETE', 'DISCUSSION_POST', 'DISCUSSION_REPLY', 'RESOURCE_DOWNLOAD', 'BOOKMARK_ADD', 'BOOKMARK_REMOVE', 'SEARCH', 'NAVIGATION', 'ERROR', 'FEEDBACK');

-- CreateEnum
CREATE TYPE "public"."ContentType" AS ENUM ('VIDEO', 'AUDIO', 'ARTICLE', 'BLOG', 'PODCAST', 'COURSE', 'BOOK', 'DOCUMENT', 'IMAGE', 'CHAPTER', 'SECTION', 'EXAM', 'QUESTION', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."InteractionType" AS ENUM ('VIEWED', 'ACCEPTED', 'REJECTED', 'DEFERRED');

-- CreateEnum
CREATE TYPE "public"."AchievementType" AS ENUM ('FIRST_COURSE', 'COURSE_COMPLETION', 'CHAPTER_COMPLETION', 'PERFECT_QUIZ', 'STUDY_STREAK', 'TIME_MILESTONE', 'SKILL_MASTERY', 'PEER_HELPER', 'EARLY_BIRD', 'NIGHT_OWL', 'CONSISTENT_LEARNER', 'FAST_LEARNER', 'THOROUGH_LEARNER', 'QUESTION_MASTER', 'DISCUSSION_CONTRIBUTOR');

-- CreateEnum
CREATE TYPE "public"."BadgeLevel" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND');

-- CreateEnum
CREATE TYPE "public"."TrendDirection" AS ENUM ('IMPROVING', 'STABLE', 'DECLINING');

-- CreateEnum
CREATE TYPE "public"."AlertType" AS ENUM ('STRUGGLING', 'AT_RISK', 'INACTIVE', 'MILESTONE', 'ENCOURAGEMENT');

-- CreateEnum
CREATE TYPE "public"."AIContentType" AS ENUM ('COURSE_DESCRIPTION', 'COURSE_OBJECTIVES', 'COURSE_OUTLINE', 'CHAPTER_CONTENT', 'LESSON_PLAN', 'LESSON_CONTENT', 'EXAM_QUESTIONS', 'PRACTICE_EXERCISES', 'EXPLANATIONS', 'EXAMPLES', 'STUDY_GUIDE', 'ASSESSMENT', 'RUBRIC');

-- CreateEnum
CREATE TYPE "public"."AIGenerationRequest" AS ENUM ('COURSE_PLANNING', 'CONTENT_CREATION', 'ASSESSMENT_DESIGN', 'EXERCISE_GENERATION', 'EXPLANATION_CREATION', 'CURRICULUM_DESIGN');

-- CreateEnum
CREATE TYPE "public"."AITemplateType" AS ENUM ('COURSE_OUTLINE', 'LESSON_PLAN', 'EXAM_QUESTIONS', 'PRACTICE_EXERCISES', 'EXPLANATIONS', 'EXAMPLES', 'ASSESSMENTS', 'CURRICULUM');

-- CreateEnum
CREATE TYPE "public"."AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."AnalyticsType" AS ENUM ('CONTENT_CONSUMED', 'TIME_SPENT', 'COURSE_PROGRESS', 'SOCIAL_ENGAGEMENT', 'SUBSCRIPTION_SPENDING', 'GOAL_PROGRESS', 'PRODUCTIVITY_SCORE');

-- CreateEnum
CREATE TYPE "public"."AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'GRADED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."BillCategory" AS ENUM ('UTILITY', 'INTERNET', 'INSURANCE', 'RENT', 'MORTGAGE', 'SUBSCRIPTION', 'TAX', 'CREDIT_CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."BillStatus" AS ENUM ('PAID', 'UNPAID', 'OVERDUE', 'UPCOMING', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."BillingCycle" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'LIFETIME');

-- CreateEnum
CREATE TYPE "public"."BloomsLevel" AS ENUM ('REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE');

-- CreateEnum
CREATE TYPE "public"."EngagementTrend" AS ENUM ('IMPROVING', 'STABLE', 'DECLINING');

-- CreateEnum
CREATE TYPE "public"."EnrollmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "public"."ExamAnalyticsType" AS ENUM ('QUESTION_TIME', 'DIFFICULTY_SCORE', 'CONFIDENCE_LEVEL', 'REVIEW_COUNT', 'HINT_USAGE');

-- CreateEnum
CREATE TYPE "public"."GenerationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."GenerationType" AS ENUM ('MANUAL', 'AI_GENERATED', 'HYBRID');

-- CreateEnum
CREATE TYPE "public"."GoalCategory" AS ENUM ('LEARNING', 'CONTENT_CREATION', 'SOCIAL_GROWTH', 'FINANCIAL', 'PRODUCTIVITY', 'HEALTH', 'CAREER', 'PERSONAL');

-- CreateEnum
CREATE TYPE "public"."GoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."MetricType" AS ENUM ('FOLLOWERS', 'FOLLOWING', 'POSTS', 'LIKES', 'COMMENTS', 'SHARES', 'VIEWS', 'ENGAGEMENT_RATE', 'REACH', 'IMPRESSIONS');

-- CreateEnum
CREATE TYPE "public"."MetricsPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "public"."NodeStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "public"."PathContentType" AS ENUM ('COURSE', 'CHAPTER', 'SKILL', 'ASSESSMENT', 'PROJECT');

-- CreateEnum
CREATE TYPE "public"."PathDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "public"."PostType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'CAROUSEL', 'STORY', 'REEL', 'SHORT', 'LIVE');

-- CreateEnum
CREATE TYPE "public"."QuestionDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "public"."RecommendationType" AS ENUM ('PERFORMANCE_BASED', 'SKILL_GAP', 'INTEREST_BASED', 'POPULAR', 'SEQUENTIAL', 'REMEDIAL');

-- CreateEnum
CREATE TYPE "public"."RecurringType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."SessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED', 'STRUGGLING');

-- CreateEnum
CREATE TYPE "public"."SocialPlatform" AS ENUM ('YOUTUBE', 'INSTAGRAM', 'TWITTER', 'FACEBOOK', 'LINKEDIN', 'TIKTOK', 'TWITCH', 'DISCORD', 'REDDIT', 'MEDIUM', 'GITHUB', 'DRIBBBLE', 'BEHANCE');

-- CreateEnum
CREATE TYPE "public"."SubscriptionCategory" AS ENUM ('STREAMING', 'EDUCATION', 'PRODUCTIVITY', 'DESIGN', 'DEVELOPMENT', 'FITNESS', 'MUSIC', 'NEWS', 'GAMING', 'SOCIAL', 'STORAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('PAYMENT', 'REFUND', 'CHARGEBACK', 'CREDIT');

-- CreateEnum
CREATE TYPE "public"."SubscriptionTier" AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "public"."EnterpriseMetricType" AS ENUM ('USER_ENGAGEMENT', 'CONTENT_PERFORMANCE', 'AI_USAGE', 'SYSTEM_PERFORMANCE', 'REVENUE', 'COMPLIANCE', 'SECURITY', 'COLLABORATION');

-- CreateEnum
CREATE TYPE "public"."AggregationPeriod" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "public"."ComplianceEventType" AS ENUM ('DATA_ACCESS', 'DATA_EXPORT', 'DATA_DELETION', 'POLICY_VIOLATION', 'SECURITY_INCIDENT', 'AUDIT_REQUIREMENT');

-- CreateEnum
CREATE TYPE "public"."ComplianceFramework" AS ENUM ('GDPR', 'CCPA', 'FERPA', 'HIPAA', 'SOX', 'COPPA', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."ComplianceStatus" AS ENUM ('COMPLIANT', 'NON_COMPLIANT', 'UNDER_REVIEW', 'PENDING_ACTION', 'RESOLVED');

-- CreateEnum
CREATE TYPE "public"."ComplianceSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT', 'PUBLISH', 'UNPUBLISH');

-- CreateEnum
CREATE TYPE "public"."AuditSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."AIPerformanceCategory" AS ENUM ('ACCURACY', 'RESPONSE_TIME', 'RESOURCE_USAGE', 'USER_SATISFACTION', 'LEARNING_EFFECTIVENESS');

-- CreateEnum
CREATE TYPE "public"."SecurityEventType" AS ENUM ('UNAUTHORIZED_ACCESS', 'SUSPICIOUS_ACTIVITY', 'DATA_BREACH', 'POLICY_VIOLATION', 'SYSTEM_INTRUSION', 'MALWARE_DETECTION', 'AUTHENTICATION_FAILURE');

-- CreateEnum
CREATE TYPE "public"."SecuritySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."SecurityStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "public"."SAMTutorMode" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."SAMMessageType" AS ENUM ('USER', 'SAM', 'SYSTEM', 'ACTION');

-- CreateEnum
CREATE TYPE "public"."SAMEmotion" AS ENUM ('ENCOURAGING', 'SUPPORTIVE', 'EXCITED', 'THOUGHTFUL', 'CELEBRATORY', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "public"."SAMInteractionType" AS ENUM ('FORM_POPULATE', 'FORM_SUBMIT', 'FORM_VALIDATE', 'CONTENT_GENERATE', 'NAVIGATION', 'CHAT_MESSAGE', 'QUICK_ACTION', 'ANALYTICS_VIEW', 'GAMIFICATION_ACTION', 'LEARNING_ASSISTANCE');

-- CreateEnum
CREATE TYPE "public"."SAMPointsCategory" AS ENUM ('FORM_INTERACTION', 'CONTENT_CREATION', 'CHAT_ENGAGEMENT', 'ACHIEVEMENT_UNLOCK', 'DAILY_ACTIVITY', 'LEARNING_PROGRESS', 'TEACHING_ACTIVITY', 'COLLABORATION');

-- CreateEnum
CREATE TYPE "public"."SAMBadgeType" AS ENUM ('FIRST_INTERACTION', 'FORM_MASTER', 'CONTENT_CREATOR', 'CHAT_EXPERT', 'STREAK_KEEPER', 'LEARNING_CHAMPION', 'TEACHING_MENTOR', 'ANALYTICS_EXPLORER', 'PRODUCTIVITY_HERO');

-- CreateEnum
CREATE TYPE "public"."SAMStreakType" AS ENUM ('DAILY_INTERACTION', 'WEEKLY_ENGAGEMENT', 'FORM_COMPLETION', 'CONTENT_CREATION', 'CHAT_ACTIVITY');

-- CreateEnum
CREATE TYPE "public"."SAMLearningStyle" AS ENUM ('VISUAL', 'AUDITORY', 'KINESTHETIC', 'READING_WRITING', 'MIXED');

-- CreateEnum
CREATE TYPE "public"."SAMTone" AS ENUM ('ENCOURAGING', 'PROFESSIONAL', 'FRIENDLY', 'CHALLENGING', 'SUPPORTIVE');

-- CreateEnum
CREATE TYPE "public"."SAMTeachingMethod" AS ENUM ('SOCRATIC', 'DIRECT', 'SCAFFOLDING', 'DISCOVERY', 'ADAPTIVE');

-- CreateEnum
CREATE TYPE "public"."SAMResponseStyle" AS ENUM ('DETAILED', 'CONCISE', 'VISUAL', 'EXAMPLE_HEAVY', 'STEP_BY_STEP');

-- CreateEnum
CREATE TYPE "public"."SAMMetricType" AS ENUM ('INTERACTION_COUNT', 'FORM_SUCCESS_RATE', 'CONTENT_GENERATION_COUNT', 'CHAT_ENGAGEMENT_TIME', 'POINTS_EARNED', 'BADGES_UNLOCKED', 'STREAK_LENGTH', 'LEARNING_VELOCITY', 'TEACHING_EFFECTIVENESS');

-- CreateEnum
CREATE TYPE "public"."AnalyticsPeriod" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "public"."CollaborativeRole" AS ENUM ('VIEWER', 'COMMENTER', 'EDITOR', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."PermissionType" AS ENUM ('READ', 'WRITE', 'COMMENT', 'MODERATE', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."CommentStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'DELETED');

-- CreateEnum
CREATE TYPE "public"."CommentType" AS ENUM ('COMMENT', 'SUGGESTION', 'QUESTION', 'ISSUE');

-- CreateEnum
CREATE TYPE "public"."ConflictStatus" AS ENUM ('PENDING', 'RESOLVED', 'IGNORED');

-- CreateEnum
CREATE TYPE "public"."ConflictType" AS ENUM ('EDIT_OVERLAP', 'CONCURRENT_EDIT', 'VERSION_MISMATCH', 'LOCK_CONFLICT');

-- CreateEnum
CREATE TYPE "public"."ConflictPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."OperationType" AS ENUM ('INSERT', 'DELETE', 'RETAIN', 'FORMAT', 'UPDATE');

-- CreateEnum
CREATE TYPE "public"."ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ApprovalPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."WorkflowStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('EMAIL', 'IN_APP', 'SMS', 'PUSH', 'SLACK', 'WEBHOOK');

-- CreateEnum
CREATE TYPE "public"."ApprovalAutoCondition" AS ENUM ('NONE', 'MINOR_CHANGE', 'TRUSTED_AUTHOR', 'TIME_BASED', 'CONSENSUS_REACHED', 'QUALITY_SCORE_MET');

-- CreateEnum
CREATE TYPE "public"."BulkOperationType" AS ENUM ('APPROVE_ALL', 'REJECT_ALL', 'REQUEST_REVISION_ALL', 'CANCEL_ALL', 'ARCHIVE_ALL');

-- CreateEnum
CREATE TYPE "public"."BulkOperationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'PARTIALLY_COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "isTwoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "totpSecret" TEXT,
    "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "totpVerified" BOOLEAN NOT NULL DEFAULT false,
    "recoveryCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isAccountLocked" BOOLEAN NOT NULL DEFAULT false,
    "lockReason" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "passwordChangedAt" TIMESTAMP(3),
    "stripeAccountId" TEXT,
    "paypalAccountId" TEXT,
    "walletBalance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalCoursesCreated" INTEGER NOT NULL DEFAULT 0,
    "totalCoursesSold" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "instructorRating" DECIMAL(65,30),
    "learningStyle" "public"."LearningStyle",
    "bloomsProgress" JSONB,
    "samTotalPoints" INTEGER NOT NULL DEFAULT 0,
    "samLevel" INTEGER NOT NULL DEFAULT 1,
    "samActiveChallenges" JSONB,
    "samCompletedChallenges" JSONB,
    "samChallengeStartDate" TIMESTAMP(3),
    "affiliateActivatedAt" TIMESTAMP(3),
    "affiliateCode" TEXT,
    "affiliateEarnings" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "isAffiliate" BOOLEAN NOT NULL DEFAULT false,
    "isTeacher" BOOLEAN NOT NULL DEFAULT false,
    "teacherActivatedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TwoFactorToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TwoFactorToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TwoFactorConfirmation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TwoFactorConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ActiveSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "deviceType" TEXT,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ActiveSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuthAudit" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "action" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "deviceType" TEXT,
    "countryCode" TEXT,
    "city" TEXT,
    "status" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BackupCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackupCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LoginAttempt" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TOTPSecret" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TOTPSecret_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."auth_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "deviceInfo" JSONB,
    "fingerprintHash" TEXT,
    "fingerprintData" JSONB,
    "deviceId" TEXT,
    "deviceName" TEXT,
    "isTrustedDevice" BOOLEAN NOT NULL DEFAULT false,
    "trustEstablishedAt" TIMESTAMP(3),
    "lastFingerprintCheck" TIMESTAMP(3),
    "fingerprintMismatches" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "public"."password_histories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."permission_rules" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "userId" TEXT,
    "userRole" TEXT,
    "permissions" TEXT[],
    "conditions" JSONB DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."permission_activities" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserCapability" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "capability" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "requirements" JSONB,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "revokeReason" TEXT,

    CONSTRAINT "UserCapability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdminAccount" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdminActiveSession" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "deviceType" TEXT,
    "deviceInfo" TEXT,
    "location" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminActiveSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdminTwoFactorConfirmation" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminTwoFactorConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdminVerificationToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdminPasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminPasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdminTwoFactorToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminTwoFactorToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cleanDescription" TEXT,
    "imageUrl" TEXT,
    "price" DOUBLE PRECISION,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "courseGoals" TEXT,
    "categoryId" TEXT,
    "courseRatings" TEXT,
    "activeLearners" INTEGER,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "whatYouWillLearn" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "slug" TEXT,
    "subtitle" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "organizationId" TEXT,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Attachment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Chapter" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "courseGoals" TEXT,
    "learningOutcomes" TEXT,
    "position" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "sectionCount" INTEGER,
    "totalDuration" INTEGER,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "estimatedTime" TEXT,
    "difficulty" TEXT,
    "prerequisites" TEXT,
    "resources" TEXT,
    "status" TEXT,

    CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Section" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "learningObjectives" TEXT,
    "videoUrl" TEXT,
    "position" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "duration" INTEGER,
    "chapterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" TEXT,
    "isPreview" BOOLEAN,
    "completionStatus" TEXT,
    "resourceUrls" TEXT,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Video" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "youtubeUrl" TEXT,
    "url" TEXT,
    "duration" INTEGER,
    "rating" INTEGER,
    "position" INTEGER NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "thumbnail" TEXT,
    "platform" TEXT,
    "embedUrl" TEXT,
    "author" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Exam" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "endDate" TIMESTAMP(3),
    "instructions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "passingScore" DOUBLE PRECISION NOT NULL DEFAULT 70,
    "showResults" BOOLEAN NOT NULL DEFAULT true,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
    "startDate" TIMESTAMP(3),
    "timeLimit" INTEGER,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Question" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sectionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CourseReview" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 0,
    "comment" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Answer" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "questionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Enrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExamQuestion" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB,
    "points" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "examId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "explanation" TEXT,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL,
    "videoUrl" TEXT,
    "correctAnswer" JSONB NOT NULL,
    "questionType" "public"."QuestionType" NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    "bloomsLevel" "public"."BloomsLevel",
    "difficulty" "public"."QuestionDifficulty" NOT NULL DEFAULT 'MEDIUM',

    CONSTRAINT "ExamQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LearningPath" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "difficulty" "public"."PathDifficulty" NOT NULL DEFAULT 'BEGINNER',
    "estimatedDuration" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "generationType" "public"."GenerationType" NOT NULL DEFAULT 'MANUAL',
    "creatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LearningPathNode" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "contentType" "public"."PathContentType" NOT NULL,
    "contentId" TEXT,
    "prerequisites" TEXT[],
    "pathId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningPathNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NodeProgress" (
    "id" TEXT NOT NULL,
    "status" "public"."NodeStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "enrollmentId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NodeProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PathEnrollment" (
    "id" TEXT NOT NULL,
    "status" "public"."EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "progressPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PathEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PathRecommendation" (
    "id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "basedOn" "public"."RecommendationType" NOT NULL,
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "pathId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PathRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserAnswer" (
    "id" TEXT NOT NULL,
    "answer" JSONB NOT NULL,
    "isCorrect" BOOLEAN,
    "pointsEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeSpent" INTEGER,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserExamAttempt" (
    "id" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" "public"."AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "timeSpent" INTEGER,
    "totalQuestions" INTEGER NOT NULL,
    "correctAnswers" INTEGER NOT NULL DEFAULT 0,
    "scorePercentage" DOUBLE PRECISION,
    "isPassed" BOOLEAN,
    "userId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserExamAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CourseBloomsAnalysis" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "bloomsDistribution" JSONB NOT NULL,
    "cognitiveDepth" DOUBLE PRECISION NOT NULL,
    "learningPathway" JSONB NOT NULL,
    "skillsMatrix" JSONB NOT NULL,
    "gapAnalysis" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "contentHash" TEXT,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseBloomsAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SectionBloomsMapping" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "bloomsLevel" "public"."BloomsLevel" NOT NULL,
    "primaryLevel" "public"."BloomsLevel" NOT NULL,
    "secondaryLevels" JSONB NOT NULL,
    "activities" JSONB NOT NULL,
    "assessments" JSONB NOT NULL,
    "learningObjectives" JSONB NOT NULL,

    CONSTRAINT "SectionBloomsMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExamBloomsProfile" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "targetDistribution" JSONB NOT NULL,
    "actualDistribution" JSONB NOT NULL,
    "difficultyMatrix" JSONB NOT NULL,
    "skillsAssessed" JSONB NOT NULL,
    "coverageMap" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamBloomsProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuestionBank" (
    "id" TEXT NOT NULL,
    "courseId" TEXT,
    "subject" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "subtopic" TEXT,
    "question" TEXT NOT NULL,
    "questionType" "public"."QuestionType" NOT NULL,
    "bloomsLevel" "public"."BloomsLevel" NOT NULL,
    "difficulty" "public"."QuestionDifficulty" NOT NULL,
    "options" JSONB,
    "correctAnswer" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "hints" JSONB,
    "tags" TEXT[],
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION,
    "avgTimeSpent" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionBank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StudentBloomsProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT,
    "bloomsScores" JSONB NOT NULL,
    "strengthAreas" JSONB NOT NULL,
    "weaknessAreas" JSONB NOT NULL,
    "progressHistory" JSONB NOT NULL,
    "lastAssessedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentBloomsProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BloomsPerformanceMetric" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT,
    "bloomsLevel" "public"."BloomsLevel" NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "avgResponseTime" DOUBLE PRECISION NOT NULL,
    "totalAttempts" INTEGER NOT NULL,
    "successfulAttempts" INTEGER NOT NULL,
    "improvementRate" DOUBLE PRECISION NOT NULL,
    "challengeAreas" JSONB NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BloomsPerformanceMetric_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "public"."UserCourseEnrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "certificateIssued" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,

    CONSTRAINT "UserCourseEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserChapterCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,

    CONSTRAINT "UserChapterCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserSectionCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "score" DOUBLE PRECISION,
    "metadata" JSONB,

    CONSTRAINT "UserSectionCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LearningSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER NOT NULL DEFAULT 0,
    "activities" JSONB,
    "engagement" DOUBLE PRECISION,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SectionCompletionTracking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "completionType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "engagement" DOUBLE PRECISION,
    "interactions" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SectionCompletionTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Blog" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "author" TEXT,
    "description" TEXT,
    "rating" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "position" INTEGER,
    "sectionId" TEXT,
    "userId" TEXT NOT NULL,
    "category" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Article" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "source" TEXT,
    "summary" TEXT,
    "publishedAt" TIMESTAMP(3),
    "sectionId" TEXT,
    "userId" TEXT NOT NULL,
    "category" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Note" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isImportant" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    "sectionId" TEXT,
    "userId" TEXT NOT NULL,
    "category" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CodeExplanation" (
    "id" TEXT NOT NULL,
    "heading" TEXT,
    "code" TEXT,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sectionId" TEXT,
    "language" TEXT DEFAULT 'typescript',
    "order" INTEGER DEFAULT 0,

    CONSTRAINT "CodeExplanation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MathExplanation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "latex" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "equation" TEXT,
    "imageUrl" TEXT,
    "mode" TEXT,

    CONSTRAINT "MathExplanation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Post" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "published" BOOLEAN,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "body" TEXT NOT NULL DEFAULT '',
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Comment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Reply" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentReplyId" TEXT,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "path" TEXT,

    CONSTRAINT "Reply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContentCollection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT DEFAULT '#6366f1',
    "icon" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContentItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "platform" TEXT,
    "contentType" "public"."ContentType" NOT NULL,
    "author" TEXT,
    "duration" INTEGER,
    "publishedAt" TIMESTAMP(3),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "rating" INTEGER,
    "notes" TEXT,
    "watchedAt" TIMESTAMP(3),
    "watchProgress" DOUBLE PRECISION,
    "userId" TEXT NOT NULL,
    "collectionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomTab" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CustomTab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FavoriteArticle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FavoriteArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FavoriteAudio" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FavoriteAudio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FavoriteBlog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FavoriteBlog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FavoriteImage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imageUrl" TEXT NOT NULL,

    CONSTRAINT "FavoriteImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FavoriteVideo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FavoriteVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PostChapterSection" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "isPublished" BOOLEAN DEFAULT false,
    "isFree" BOOLEAN DEFAULT false,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "content" TEXT,

    CONSTRAINT "PostChapterSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PostImageSection" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostImageSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."content_versions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "contentId" TEXT NOT NULL,
    "contentType" "public"."ContentType" NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT,
    "changes" JSONB NOT NULL,
    "changesSummary" TEXT,
    "authorId" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_versions_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "public"."ContentVersionApproval" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "status" "public"."ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentVersionApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ContentFlag" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "flagType" TEXT NOT NULL,
    "flaggedById" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Purchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StripeCustomer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Bill" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "public"."BillCategory" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "startDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."BillStatus" NOT NULL DEFAULT 'UNPAID',
    "recurringType" "public"."RecurringType",
    "recurringPeriod" INTEGER,
    "notifyBefore" INTEGER NOT NULL DEFAULT 3,
    "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifySMS" BOOLEAN NOT NULL DEFAULT false,
    "lastPaidAmount" DOUBLE PRECISION,
    "lastPaidDate" TIMESTAMP(3),
    "autoPayEnabled" BOOLEAN NOT NULL DEFAULT false,
    "paymentMethod" TEXT,
    "accountNumber" TEXT,
    "provider" TEXT,
    "accountId" TEXT,
    "website" TEXT,
    "supportContact" TEXT,
    "notes" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BillAttachment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "billId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BillPayment" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reference" TEXT,
    "billId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripe_current_period_end" TIMESTAMP(3),
    "stripe_customer_id" TEXT,
    "stripe_price_id" TEXT,
    "stripe_subscription_id" TEXT,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SubscriptionService" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "public"."SubscriptionCategory" NOT NULL,
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SubscriptionTransaction" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "transactionType" "public"."TransactionType" NOT NULL,
    "status" "public"."TransactionStatus" NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "subscriptionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserSubscription" (
    "id" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "planName" TEXT,
    "cost" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billingCycle" "public"."BillingCycle" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "nextBillingDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "paymentMethod" TEXT,
    "lastPaymentDate" TIMESTAMP(3),
    "lastPaymentAmount" DOUBLE PRECISION,
    "usageLimit" INTEGER,
    "currentUsage" INTEGER DEFAULT 0,
    "userId" TEXT NOT NULL,
    "serviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "public"."Activity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "progress" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExamAnalytics" (
    "id" TEXT NOT NULL,
    "analyticsType" "public"."ExamAnalyticsType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "attemptId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SocialMetric" (
    "id" TEXT NOT NULL,
    "platform" "public"."SocialPlatform" NOT NULL,
    "metricType" "public"."MetricType" NOT NULL,
    "value" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "socialMediaAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserAnalytics" (
    "id" TEXT NOT NULL,
    "analyticsType" "public"."AnalyticsType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."learning_metrics" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "courseId" TEXT,
    "overallProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "learningVelocity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "engagementTrend" "public"."EngagementTrend" NOT NULL DEFAULT 'STABLE',
    "strugglingAreas" TEXT[],
    "strengths" TEXT[],
    "predictedCompletionDate" TIMESTAMP(3),
    "riskScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastActivityDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "averageSessionDuration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalStudyTime" INTEGER NOT NULL DEFAULT 0,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "completedSessions" INTEGER NOT NULL DEFAULT 0,
    "averageEngagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageQuizScore" DOUBLE PRECISION,
    "improvementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "consistencyScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."learning_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "courseId" TEXT,
    "chapterId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "activeDuration" INTEGER,
    "completionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "strugglingIndicators" TEXT[],
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "interactionCount" INTEGER NOT NULL DEFAULT 0,
    "pauseCount" INTEGER NOT NULL DEFAULT 0,
    "seekCount" INTEGER NOT NULL DEFAULT 0,
    "quizAttempts" INTEGER,
    "quizScore" DOUBLE PRECISION,
    "status" "public"."SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."performance_metrics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "period" "public"."MetricsPeriod" NOT NULL DEFAULT 'DAILY',
    "learningVelocity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "retentionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quizPerformance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalLearningTime" INTEGER NOT NULL DEFAULT 0,
    "activeTime" INTEGER NOT NULL DEFAULT 0,
    "sessionsCount" INTEGER NOT NULL DEFAULT 0,
    "averageSessionLength" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "velocityTrend" "public"."TrendDirection" NOT NULL DEFAULT 'STABLE',
    "engagementTrend" "public"."TrendDirection" NOT NULL DEFAULT 'STABLE',
    "performanceTrend" "public"."TrendDirection" NOT NULL DEFAULT 'STABLE',
    "peerComparisonScore" DOUBLE PRECISION,
    "improvementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."progress_alerts" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "courseId" TEXT,
    "chapterId" TEXT,
    "alertType" "public"."AlertType" NOT NULL,
    "severity" "public"."AlertSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "aiSuggestion" TEXT NOT NULL,
    "actionRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "metadata" JSONB,

    CONSTRAINT "progress_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."realtime_activities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityType" "public"."ActivityType" NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "courseId" TEXT,
    "chapterId" TEXT,
    "sectionId" TEXT,
    "duration" INTEGER,
    "progress" DOUBLE PRECISION,
    "score" DOUBLE PRECISION,
    "metadata" JSONB,
    "sessionId" TEXT,
    "deviceInfo" TEXT,
    "ipAddress" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "realtime_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."study_streaks" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "courseId" TEXT,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastStudyDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "streakStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weeklyGoalMinutes" INTEGER NOT NULL DEFAULT 0,
    "weeklyActualMinutes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_streaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_achievements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementType" "public"."AchievementType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconUrl" TEXT,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "badgeLevel" "public"."BadgeLevel" NOT NULL DEFAULT 'BRONZE',
    "courseId" TEXT,
    "metadata" JSONB,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT,
    "chapterId" TEXT,
    "sectionId" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "progressPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "averageScore" DOUBLE PRECISION,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."enterprise_analytics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "metricType" "public"."EnterpriseMetricType" NOT NULL,
    "metricCategory" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "dimensions" JSONB,
    "aggregationPeriod" "public"."AggregationPeriod" NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enterprise_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sam_analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metricType" "public"."SAMMetricType" NOT NULL,
    "metricValue" DOUBLE PRECISION NOT NULL,
    "period" "public"."AnalyticsPeriod" NOT NULL DEFAULT 'DAILY',
    "context" JSONB,
    "courseId" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sam_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeacherInsights" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "insightType" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "priority" INTEGER NOT NULL,
    "actionable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherInsights_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "public"."ApprovalAnalytics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalWorkflows" INTEGER NOT NULL DEFAULT 0,
    "pendingApprovals" INTEGER NOT NULL DEFAULT 0,
    "approvedCount" INTEGER NOT NULL DEFAULT 0,
    "rejectedCount" INTEGER NOT NULL DEFAULT 0,
    "averageApprovalTime" INTEGER,
    "bottlenecks" JSONB,
    "performanceMetrics" JSONB,
    "organizationId" TEXT,

    CONSTRAINT "ApprovalAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."analytics" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT,
    "eventType" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CertificateAnalytics" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "totalVerifications" INTEGER NOT NULL DEFAULT 0,
    "uniqueVerifiers" INTEGER NOT NULL DEFAULT 0,
    "lastVerified" TIMESTAMP(3),
    "verificationsByDay" JSONB,
    "verificationsByMethod" JSONB,
    "fraudAttempts" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertificateAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserLearningPattern" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patternType" TEXT NOT NULL,
    "patterns" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "effectiveness" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recommendations" JSONB,
    "lastAnalyzed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserLearningPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CourseCompletionAnalytics" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "totalEnrollments" INTEGER NOT NULL DEFAULT 0,
    "totalCompletions" INTEGER NOT NULL DEFAULT 0,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageTime" INTEGER NOT NULL DEFAULT 0,
    "averageScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dropoffPoints" JSONB,
    "engagementMetrics" JSONB,
    "demographics" JSONB,
    "timeToComplete" JSONB,
    "satisfactionScore" DOUBLE PRECISION,
    "metadata" JSONB,
    "lastAnalyzed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseCompletionAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Reaction" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "commentId" TEXT,
    "replyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProfileLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "ProfileLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "privacy" TEXT,
    "rules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorId" TEXT NOT NULL,
    "courseId" TEXT,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GroupDiscussion" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groupId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "likesCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GroupDiscussion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GroupDiscussionComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupDiscussionComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GroupDiscussionLike" (
    "id" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupDiscussionLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GroupMember" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GroupNotification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GroupResource" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "thumbnail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groupId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "GroupResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Idea" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "visibility" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "tags" TEXT[],
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "collaborators" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Idea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IdeaComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdeaComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."IdeaLike" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdeaLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Mind" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" JSONB NOT NULL,
    "category" TEXT NOT NULL,
    "visibility" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "tags" TEXT[],
    "likes" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mind_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MindLike" (
    "id" TEXT NOT NULL,
    "mindId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MindLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SocialMediaAccount" (
    "id" TEXT NOT NULL,
    "platform" "public"."SocialPlatform" NOT NULL,
    "platformUserId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "profileUrl" TEXT,
    "profileImageUrl" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "followerCount" INTEGER DEFAULT 0,
    "followingCount" INTEGER DEFAULT 0,
    "postsCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialMediaAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SocialPost" (
    "id" TEXT NOT NULL,
    "platformPostId" TEXT NOT NULL,
    "platform" "public"."SocialPlatform" NOT NULL,
    "content" TEXT,
    "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "postUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "likesCount" INTEGER DEFAULT 0,
    "commentsCount" INTEGER DEFAULT 0,
    "sharesCount" INTEGER DEFAULT 0,
    "viewsCount" INTEGER DEFAULT 0,
    "postType" "public"."PostType",
    "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mentions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "socialMediaAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."collaboration_sessions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "sessionId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" "public"."ContentType" NOT NULL,
    "participants" JSONB NOT NULL,
    "activeParticipants" JSONB NOT NULL,
    "sessionData" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "courseId" TEXT,
    "chapterId" TEXT,
    "initiatorId" TEXT,
    "sessionType" TEXT,
    "activities" JSONB,
    "metrics" JSONB,
    "insights" JSONB,

    CONSTRAINT "collaboration_sessions_pkey" PRIMARY KEY ("id")
);

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
CREATE TABLE "public"."collaborative_sessions" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "title" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lockType" TEXT NOT NULL DEFAULT 'NONE',
    "lockedBy" TEXT,
    "lockedAt" TIMESTAMP(3),
    "yjsState" BYTEA,
    "yjsUpdates" BYTEA,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collaborative_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session_participants" (
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "cursorColor" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_participants_pkey" PRIMARY KEY ("sessionId","userId")
);

-- CreateTable
CREATE TABLE "public"."collaborative_activities" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collaborative_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session_comments" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "position" INTEGER,
    "line" INTEGER,
    "column" INTEGER,
    "selectionStart" INTEGER,
    "selectionEnd" INTEGER,
    "selectionText" TEXT,
    "parentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "type" TEXT NOT NULL DEFAULT 'COMMENT',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session_conflicts" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "user1Id" TEXT NOT NULL,
    "user2Id" TEXT NOT NULL,
    "conflictType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "conflictData" JSONB NOT NULL DEFAULT '{}',
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "resolutionType" TEXT,
    "operation1Data" TEXT,
    "operation2Data" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."edit_conflicts" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "conflictData" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "edit_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session_snapshots" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "snapshotType" TEXT NOT NULL DEFAULT 'MANUAL',
    "content" JSONB NOT NULL,
    "yjsState" BYTEA,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."collaborative_cursors" (
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "line" INTEGER,
    "column" INTEGER,
    "selectionStart" INTEGER,
    "selectionEnd" INTEGER,
    "isTyping" BOOLEAN NOT NULL DEFAULT false,
    "lastUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collaborative_cursors_pkey" PRIMARY KEY ("sessionId","userId")
);

-- CreateTable
CREATE TABLE "public"."collaborative_operations" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "operationType" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "length" INTEGER,
    "content" TEXT,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "revision" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collaborative_operations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."collaborative_permissions" (
    "userId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "permissions" TEXT[],
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "grantedBy" TEXT,
    "grantedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "revokedBy" TEXT,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "collaborative_permissions_pkey" PRIMARY KEY ("userId","contentType","contentId")
);

-- CreateTable
CREATE TABLE "public"."AIContentGeneration" (
    "id" TEXT NOT NULL,
    "requestType" "public"."AIGenerationRequest" NOT NULL,
    "status" "public"."GenerationStatus" NOT NULL DEFAULT 'PENDING',
    "input" JSONB NOT NULL,
    "parameters" JSONB,
    "output" JSONB,
    "errorMessage" TEXT,
    "tokensUsed" INTEGER,
    "generationTime" INTEGER,
    "cost" DOUBLE PRECISION,
    "userId" TEXT NOT NULL,
    "templateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIContentGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AIContentTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "templateType" "public"."AITemplateType" NOT NULL,
    "category" TEXT,
    "promptTemplate" TEXT NOT NULL,
    "contentStructure" JSONB,
    "parameters" JSONB,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "creatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIContentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AIGeneratedContent" (
    "id" TEXT NOT NULL,
    "contentType" "public"."AIContentType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "promptUsed" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'claude-3-5-sonnet-20241022',
    "tokensUsed" INTEGER,
    "generationTime" INTEGER,
    "rating" DOUBLE PRECISION,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "templateId" TEXT,
    "creatorId" TEXT NOT NULL,
    "courseId" TEXT,
    "chapterId" TEXT,
    "sectionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIGeneratedContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AIUsageMetrics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "period" "public"."MetricsPeriod" NOT NULL DEFAULT 'DAILY',
    "totalGenerations" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "courseGenerations" INTEGER NOT NULL DEFAULT 0,
    "chapterGenerations" INTEGER NOT NULL DEFAULT 0,
    "lessonGenerations" INTEGER NOT NULL DEFAULT 0,
    "examGenerations" INTEGER NOT NULL DEFAULT 0,
    "exerciseGenerations" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION,
    "approvalRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIUsageMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RecommendationInteraction" (
    "id" TEXT NOT NULL,
    "action" "public"."InteractionType" NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserAIPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "defaultModel" TEXT NOT NULL DEFAULT 'claude-3-5-sonnet-20241022',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 2000,
    "tone" TEXT NOT NULL DEFAULT 'professional',
    "complexity" TEXT NOT NULL DEFAULT 'intermediate',
    "includeExamples" BOOLEAN NOT NULL DEFAULT true,
    "includeReferences" BOOLEAN NOT NULL DEFAULT false,
    "notifyOnCompletion" BOOLEAN NOT NULL DEFAULT true,
    "emailSummaries" BOOLEAN NOT NULL DEFAULT false,
    "dailyLimit" INTEGER,
    "monthlyLimit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAIPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_model_performance" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "modelName" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "metricValue" DOUBLE PRECISION NOT NULL,
    "benchmarkValue" DOUBLE PRECISION,
    "performanceCategory" "public"."AIPerformanceCategory" NOT NULL,
    "evaluationData" JSONB,
    "testCases" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_model_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sam_conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "courseId" TEXT,
    "chapterId" TEXT,
    "sectionId" TEXT,
    "context" JSONB,
    "tutorMode" "public"."SAMTutorMode" NOT NULL DEFAULT 'TEACHER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "totalMessages" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sam_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sam_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "messageType" "public"."SAMMessageType" NOT NULL,
    "content" TEXT NOT NULL,
    "emotion" "public"."SAMEmotion",
    "context" JSONB,
    "suggestions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "actions" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sam_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sam_interactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "interactionType" "public"."SAMInteractionType" NOT NULL,
    "context" JSONB NOT NULL,
    "formId" TEXT,
    "formData" JSONB,
    "actionTaken" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "duration" INTEGER,
    "courseId" TEXT,
    "chapterId" TEXT,
    "sectionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sam_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sam_points" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "category" "public"."SAMPointsCategory" NOT NULL,
    "context" JSONB,
    "courseId" TEXT,
    "chapterId" TEXT,
    "sectionId" TEXT,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sam_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sam_badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeType" "public"."SAMBadgeType" NOT NULL,
    "badgeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconUrl" TEXT,
    "level" "public"."BadgeLevel" NOT NULL DEFAULT 'BRONZE',
    "pointsRequired" INTEGER NOT NULL DEFAULT 0,
    "context" JSONB,
    "courseId" TEXT,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sam_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sam_streaks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActivityDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "streakType" "public"."SAMStreakType" NOT NULL DEFAULT 'DAILY_INTERACTION',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sam_streaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sam_learning_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "learningStyle" "public"."SAMLearningStyle" NOT NULL DEFAULT 'MIXED',
    "preferredTone" "public"."SAMTone" NOT NULL DEFAULT 'ENCOURAGING',
    "teachingMethod" "public"."SAMTeachingMethod" NOT NULL DEFAULT 'SOCRATIC',
    "responseStyle" "public"."SAMResponseStyle" NOT NULL DEFAULT 'DETAILED',
    "adaptationHistory" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "preferences" JSONB,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sam_learning_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StudentCognitiveProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "overallCognitiveLevel" DOUBLE PRECISION NOT NULL,
    "bloomsMastery" JSONB NOT NULL,
    "learningTrajectory" JSONB NOT NULL,
    "skillsInventory" JSONB NOT NULL,
    "performancePatterns" JSONB NOT NULL,
    "optimalLearningStyle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentCognitiveProfile_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "public"."SupportTicket" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "slug" TEXT NOT NULL,
    "brandingConfig" JSONB,
    "subscriptionTier" "public"."SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "maxUsers" INTEGER NOT NULL DEFAULT 100,
    "maxCourses" INTEGER NOT NULL DEFAULT 10,
    "customFeatures" JSONB,
    "settings" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organization_users" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "public"."OrganizationRole" NOT NULL DEFAULT 'MEMBER',
    "permissions" JSONB,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "organization_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."compliance_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "eventType" "public"."ComplianceEventType" NOT NULL,
    "complianceFramework" "public"."ComplianceFramework" NOT NULL,
    "status" "public"."ComplianceStatus" NOT NULL,
    "severity" "public"."ComplianceSeverity" NOT NULL DEFAULT 'LOW',
    "details" JSONB NOT NULL,
    "affectedUsers" JSONB,
    "affectedContent" JSONB,
    "actionTaken" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT,
    "action" "public"."AuditAction" NOT NULL,
    "eventType" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityName" TEXT,
    "changes" JSONB,
    "context" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "requestId" TEXT,
    "userEmail" TEXT,
    "userRole" TEXT,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "metadata" TEXT,
    "riskScore" INTEGER,
    "severity" "public"."AuditSeverity" NOT NULL DEFAULT 'INFO',
    "message" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."security_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "eventType" "public"."SecurityEventType" NOT NULL,
    "severity" "public"."SecuritySeverity" NOT NULL DEFAULT 'LOW',
    "source" TEXT,
    "description" TEXT NOT NULL,
    "details" JSONB,
    "affectedUsers" JSONB,
    "mitigationActions" JSONB,
    "status" "public"."SecurityStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "public"."error_logs" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "userAgent" TEXT,
    "url" TEXT,
    "component" TEXT,
    "errorType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "context" TEXT,
    "metadata" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApprovalWorkflowTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "stages" JSONB NOT NULL,
    "autoApprovalRules" JSONB,
    "escalationRules" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT,

    CONSTRAINT "ApprovalWorkflowTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApprovalWorkflow" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "contentVersionId" TEXT NOT NULL,
    "status" "public"."WorkflowStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentStage" INTEGER NOT NULL DEFAULT 0,
    "stageData" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "priority" "public"."ApprovalPriority" NOT NULL DEFAULT 'MEDIUM',
    "metadata" JSONB,

    CONSTRAINT "ApprovalWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApprovalNotification" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL DEFAULT 'IN_APP',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ApprovalAuditLog" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "details" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BulkApprovalOperation" (
    "id" TEXT NOT NULL,
    "type" "public"."BulkOperationType" NOT NULL,
    "status" "public"."BulkOperationStatus" NOT NULL DEFAULT 'PENDING',
    "targetWorkflows" JSONB NOT NULL,
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "totalCount" INTEGER NOT NULL,
    "results" JSONB,
    "performedById" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "BulkApprovalOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."error_alerts" (
    "id" TEXT NOT NULL,
    "errorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "metadata" TEXT,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "error_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."error_metrics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalErrors" INTEGER NOT NULL,
    "errorsByType" TEXT NOT NULL,
    "errorsBySeverity" TEXT NOT NULL,
    "errorsByComponent" TEXT NOT NULL,
    "uniqueUsers" INTEGER NOT NULL,
    "resolvedErrors" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "error_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserContext" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activeCapability" TEXT NOT NULL DEFAULT 'STUDENT',
    "lastSwitchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preferences" JSONB,
    "sessionData" JSONB,

    CONSTRAINT "UserContext_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdminMetadata" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionTimeout" INTEGER NOT NULL DEFAULT 14400,
    "sessionRefreshInterval" INTEGER NOT NULL DEFAULT 1800,
    "mfaEnforced" BOOLEAN NOT NULL DEFAULT true,
    "mfaMethods" TEXT[] DEFAULT ARRAY['TOTP', 'EMAIL']::TEXT[],
    "ipWhitelist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allowedLoginHours" TEXT,
    "maxConcurrentSessions" INTEGER NOT NULL DEFAULT 1,
    "lastPasswordChange" TIMESTAMP(3),
    "passwordExpiryDays" INTEGER NOT NULL DEFAULT 90,
    "passwordHistoryCount" INTEGER NOT NULL DEFAULT 5,
    "failedLoginThreshold" INTEGER NOT NULL DEFAULT 3,
    "accountLockDuration" INTEGER NOT NULL DEFAULT 900,
    "auditLogRetention" INTEGER NOT NULL DEFAULT 365,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdminAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actionCategory" TEXT NOT NULL,
    "resource" TEXT,
    "resourceId" TEXT,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "requestMethod" TEXT,
    "requestPath" TEXT,
    "success" BOOLEAN NOT NULL,
    "statusCode" INTEGER,
    "failureReason" TEXT,
    "errorDetails" TEXT,
    "previousValue" JSONB,
    "newValue" JSONB,
    "metadata" JSONB,
    "duration" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdminSessionMetrics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sessionToken" TEXT,
    "loginTime" TIMESTAMP(3) NOT NULL,
    "lastActivity" TIMESTAMP(3) NOT NULL,
    "logoutTime" TIMESTAMP(3),
    "sessionDuration" INTEGER,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "deviceType" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "location" TEXT,
    "actionsCount" INTEGER NOT NULL DEFAULT 0,
    "apiCallsCount" INTEGER NOT NULL DEFAULT 0,
    "dataAccessed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pagesVisited" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isSuspicious" BOOLEAN NOT NULL DEFAULT false,
    "suspicionReason" TEXT,
    "securityScore" INTEGER NOT NULL DEFAULT 100,
    "logoutReason" TEXT,
    "wasForced" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AdminSessionMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Goal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "public"."GoalCategory" NOT NULL,
    "targetValue" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION DEFAULT 0,
    "unit" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Milestone" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetValue" DOUBLE PRECISION,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "goalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Milestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "status" "public"."TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "public"."TaskPriority" NOT NULL DEFAULT 'MEDIUM',

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."intervention_actions" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "actionData" JSONB NOT NULL,
    "triggered" BOOLEAN NOT NULL DEFAULT false,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "effectivenesScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intervention_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CourseMarketAnalysis" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "marketValue" DOUBLE PRECISION NOT NULL,
    "demandScore" DOUBLE PRECISION NOT NULL,
    "competitorAnalysis" JSONB NOT NULL,
    "pricingAnalysis" JSONB NOT NULL,
    "trendAnalysis" JSONB NOT NULL,
    "brandingScore" DOUBLE PRECISION NOT NULL,
    "targetAudienceMatch" DOUBLE PRECISION NOT NULL,
    "recommendedPrice" DOUBLE PRECISION NOT NULL,
    "marketPosition" TEXT NOT NULL,
    "opportunities" JSONB NOT NULL,
    "threats" JSONB NOT NULL,
    "lastAnalyzedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseMarketAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CourseCompetitor" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "competitorName" TEXT NOT NULL,
    "competitorUrl" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "rating" DOUBLE PRECISION,
    "enrollments" INTEGER,
    "features" JSONB NOT NULL,
    "strengths" JSONB NOT NULL,
    "weaknesses" JSONB NOT NULL,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseCompetitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserBadge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "verificationCode" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Badge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "badgeType" TEXT NOT NULL,
    "category" TEXT,
    "level" "public"."BadgeLevel" NOT NULL DEFAULT 'BRONZE',
    "points" INTEGER NOT NULL DEFAULT 0,
    "iconUrl" TEXT,
    "iconData" JSONB,
    "colorScheme" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Badge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CourseGuideAnalysis" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "depthScore" DOUBLE PRECISION NOT NULL,
    "engagementMetrics" JSONB NOT NULL,
    "marketAcceptance" JSONB NOT NULL,
    "studentOutcomes" JSONB NOT NULL,
    "contentQuality" JSONB NOT NULL,
    "improvementAreas" JSONB NOT NULL,
    "competitiveEdge" JSONB NOT NULL,
    "lastAnalyzedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseGuideAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CourseOptimizationSuggestion" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "suggestionType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "implementation" JSONB NOT NULL,
    "estimatedEffort" TEXT NOT NULL,
    "expectedOutcome" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseOptimizationSuggestion_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "public"."BadgeDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "badgeType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "level" "public"."BadgeLevel" NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "iconUrl" TEXT,
    "iconData" JSONB,
    "colorScheme" JSONB,
    "unlockCriteria" JSONB NOT NULL,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BadgeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BadgeProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "targetValue" INTEGER NOT NULL,
    "lastUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "BadgeProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserProgressAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "relatedContent" JSONB,
    "actionRequired" BOOLEAN NOT NULL DEFAULT false,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserProgressAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "bloomsLevel" TEXT,
    "prerequisites" JSONB,
    "difficulty" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SkillProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "currentLevel" INTEGER NOT NULL DEFAULT 0,
    "targetLevel" INTEGER NOT NULL DEFAULT 100,
    "mastery" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "lastPracticed" TIMESTAMP(3),
    "achievements" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SkillGap" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "gapType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "currentLevel" INTEGER NOT NULL,
    "requiredLevel" INTEGER NOT NULL,
    "recommendations" JSONB,
    "identifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,

    CONSTRAINT "SkillGap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LearningEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventCategory" TEXT NOT NULL,
    "contentType" TEXT,
    "contentId" TEXT,
    "sessionId" TEXT,
    "duration" INTEGER,
    "engagement" DOUBLE PRECISION,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GroupEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "location" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "meetingUrl" TEXT,
    "maxAttendees" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'upcoming',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorId" TEXT,
    "organizerId" TEXT,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "GroupEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GroupEventAttendee" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'attending',
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupEventAttendee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BadgeEvent" (
    "id" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BadgeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CalendarEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "recurringEndDate" TIMESTAMP(3),
    "parentEventId" TEXT,
    "externalId" TEXT,
    "source" TEXT,
    "lastSync" TIMESTAMP(3),
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT NOT NULL,
    "color" TEXT,
    "recurringType" TEXT,
    "taskId" TEXT,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserCalendarSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "defaultView" TEXT NOT NULL DEFAULT 'month',
    "firstDayOfWeek" INTEGER NOT NULL DEFAULT 0,
    "showWeekNumbers" BOOLEAN NOT NULL DEFAULT false,
    "enableNotifications" BOOLEAN NOT NULL DEFAULT true,
    "notificationTime" INTEGER NOT NULL DEFAULT 30,
    "timeZone" TEXT NOT NULL DEFAULT 'UTC',
    "workingHoursStart" TEXT NOT NULL DEFAULT '09:00',
    "workingHoursEnd" TEXT NOT NULL DEFAULT '17:00',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCalendarSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Certification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "templateId" TEXT,
    "verificationCode" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CertificateTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "templateType" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertificateTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CertificateVerification" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT,
    "badgeId" TEXT,
    "verificationCode" TEXT NOT NULL,
    "verifierIp" TEXT NOT NULL,
    "verifierInfo" JSONB,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CertificateVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CertificateEvent" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CertificateEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_PostToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PostToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_IdeaCollaborators" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_IdeaCollaborators_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_MindCollaborators" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MindCollaborators_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_affiliateCode_key" ON "public"."User"("affiliateCode");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_email_token_key" ON "public"."VerificationToken"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "public"."PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_email_token_key" ON "public"."PasswordResetToken"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "TwoFactorToken_token_key" ON "public"."TwoFactorToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "TwoFactorToken_email_token_key" ON "public"."TwoFactorToken"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "TwoFactorConfirmation_userId_key" ON "public"."TwoFactorConfirmation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ActiveSession_sessionToken_key" ON "public"."ActiveSession"("sessionToken");

-- CreateIndex
CREATE INDEX "ActiveSession_expiresAt_idx" ON "public"."ActiveSession"("expiresAt");

-- CreateIndex
CREATE INDEX "ActiveSession_sessionToken_idx" ON "public"."ActiveSession"("sessionToken");

-- CreateIndex
CREATE INDEX "ActiveSession_userId_idx" ON "public"."ActiveSession"("userId");

-- CreateIndex
CREATE INDEX "AuthAudit_action_idx" ON "public"."AuthAudit"("action");

-- CreateIndex
CREATE INDEX "AuthAudit_createdAt_idx" ON "public"."AuthAudit"("createdAt");

-- CreateIndex
CREATE INDEX "AuthAudit_ipAddress_idx" ON "public"."AuthAudit"("ipAddress");

-- CreateIndex
CREATE INDEX "AuthAudit_userId_idx" ON "public"."AuthAudit"("userId");

-- CreateIndex
CREATE INDEX "BackupCode_userId_idx" ON "public"."BackupCode"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BackupCode_userId_code_key" ON "public"."BackupCode"("userId", "code");

-- CreateIndex
CREATE INDEX "LoginAttempt_createdAt_idx" ON "public"."LoginAttempt"("createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_email_ipAddress_idx" ON "public"."LoginAttempt"("email", "ipAddress");

-- CreateIndex
CREATE INDEX "LoginAttempt_ipAddress_idx" ON "public"."LoginAttempt"("ipAddress");

-- CreateIndex
CREATE UNIQUE INDEX "TOTPSecret_userId_key" ON "public"."TOTPSecret"("userId");

-- CreateIndex
CREATE INDEX "TOTPSecret_userId_idx" ON "public"."TOTPSecret"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_token_key" ON "public"."auth_sessions"("token");

-- CreateIndex
CREATE INDEX "auth_sessions_userId_idx" ON "public"."auth_sessions"("userId");

-- CreateIndex
CREATE INDEX "auth_sessions_token_idx" ON "public"."auth_sessions"("token");

-- CreateIndex
CREATE INDEX "auth_sessions_expiresAt_idx" ON "public"."auth_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "auth_sessions_fingerprintHash_idx" ON "public"."auth_sessions"("fingerprintHash");

-- CreateIndex
CREATE INDEX "auth_sessions_deviceId_idx" ON "public"."auth_sessions"("deviceId");

-- CreateIndex
CREATE INDEX "auth_sessions_userId_isTrustedDevice_idx" ON "public"."auth_sessions"("userId", "isTrustedDevice");

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
CREATE INDEX "password_histories_userId_idx" ON "public"."password_histories"("userId");

-- CreateIndex
CREATE INDEX "permission_rules_contentType_contentId_idx" ON "public"."permission_rules"("contentType", "contentId");

-- CreateIndex
CREATE INDEX "permission_rules_isActive_idx" ON "public"."permission_rules"("isActive");

-- CreateIndex
CREATE INDEX "permission_activities_actorId_idx" ON "public"."permission_activities"("actorId");

-- CreateIndex
CREATE INDEX "permission_activities_targetUserId_idx" ON "public"."permission_activities"("targetUserId");

-- CreateIndex
CREATE INDEX "permission_activities_contentType_contentId_idx" ON "public"."permission_activities"("contentType", "contentId");

-- CreateIndex
CREATE INDEX "permission_activities_timestamp_idx" ON "public"."permission_activities"("timestamp");

-- CreateIndex
CREATE INDEX "UserCapability_userId_idx" ON "public"."UserCapability"("userId");

-- CreateIndex
CREATE INDEX "UserCapability_capability_idx" ON "public"."UserCapability"("capability");

-- CreateIndex
CREATE INDEX "UserCapability_isActive_idx" ON "public"."UserCapability"("isActive");

-- CreateIndex
CREATE INDEX "UserCapability_expiresAt_idx" ON "public"."UserCapability"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserCapability_userId_capability_key" ON "public"."UserCapability"("userId", "capability");

-- CreateIndex
CREATE INDEX "AdminAccount_adminId_idx" ON "public"."AdminAccount"("adminId");

-- CreateIndex
CREATE INDEX "AdminAccount_provider_idx" ON "public"."AdminAccount"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "AdminAccount_provider_providerAccountId_key" ON "public"."AdminAccount"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminActiveSession_sessionToken_key" ON "public"."AdminActiveSession"("sessionToken");

-- CreateIndex
CREATE INDEX "AdminActiveSession_adminId_idx" ON "public"."AdminActiveSession"("adminId");

-- CreateIndex
CREATE INDEX "AdminActiveSession_sessionToken_idx" ON "public"."AdminActiveSession"("sessionToken");

-- CreateIndex
CREATE INDEX "AdminActiveSession_expiresAt_idx" ON "public"."AdminActiveSession"("expiresAt");

-- CreateIndex
CREATE INDEX "AdminActiveSession_isActive_idx" ON "public"."AdminActiveSession"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AdminTwoFactorConfirmation_adminId_key" ON "public"."AdminTwoFactorConfirmation"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminVerificationToken_token_key" ON "public"."AdminVerificationToken"("token");

-- CreateIndex
CREATE INDEX "AdminVerificationToken_email_idx" ON "public"."AdminVerificationToken"("email");

-- CreateIndex
CREATE INDEX "AdminVerificationToken_token_idx" ON "public"."AdminVerificationToken"("token");

-- CreateIndex
CREATE INDEX "AdminVerificationToken_expires_idx" ON "public"."AdminVerificationToken"("expires");

-- CreateIndex
CREATE UNIQUE INDEX "AdminVerificationToken_email_token_key" ON "public"."AdminVerificationToken"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "AdminPasswordResetToken_token_key" ON "public"."AdminPasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "AdminPasswordResetToken_email_idx" ON "public"."AdminPasswordResetToken"("email");

-- CreateIndex
CREATE INDEX "AdminPasswordResetToken_token_idx" ON "public"."AdminPasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "AdminPasswordResetToken_expires_idx" ON "public"."AdminPasswordResetToken"("expires");

-- CreateIndex
CREATE UNIQUE INDEX "AdminPasswordResetToken_email_token_key" ON "public"."AdminPasswordResetToken"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "AdminTwoFactorToken_token_key" ON "public"."AdminTwoFactorToken"("token");

-- CreateIndex
CREATE INDEX "AdminTwoFactorToken_email_idx" ON "public"."AdminTwoFactorToken"("email");

-- CreateIndex
CREATE INDEX "AdminTwoFactorToken_token_idx" ON "public"."AdminTwoFactorToken"("token");

-- CreateIndex
CREATE INDEX "AdminTwoFactorToken_expires_idx" ON "public"."AdminTwoFactorToken"("expires");

-- CreateIndex
CREATE UNIQUE INDEX "AdminTwoFactorToken_email_token_key" ON "public"."AdminTwoFactorToken"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "public"."Category"("name");

-- CreateIndex
CREATE INDEX "Course_categoryId_idx" ON "public"."Course"("categoryId");

-- CreateIndex
CREATE INDEX "Course_organizationId_idx" ON "public"."Course"("organizationId");

-- CreateIndex
CREATE INDEX "Attachment_courseId_idx" ON "public"."Attachment"("courseId");

-- CreateIndex
CREATE INDEX "Chapter_courseId_idx" ON "public"."Chapter"("courseId");

-- CreateIndex
CREATE INDEX "Section_chapterId_idx" ON "public"."Section"("chapterId");

-- CreateIndex
CREATE INDEX "Video_sectionId_idx" ON "public"."Video"("sectionId");

-- CreateIndex
CREATE INDEX "Video_userId_idx" ON "public"."Video"("userId");

-- CreateIndex
CREATE INDEX "Exam_sectionId_idx" ON "public"."Exam"("sectionId");

-- CreateIndex
CREATE INDEX "Exam_isPublished_isActive_idx" ON "public"."Exam"("isPublished", "isActive");

-- CreateIndex
CREATE INDEX "CourseReview_courseId_idx" ON "public"."CourseReview"("courseId");

-- CreateIndex
CREATE INDEX "CourseReview_userId_idx" ON "public"."CourseReview"("userId");

-- CreateIndex
CREATE INDEX "Enrollment_courseId_idx" ON "public"."Enrollment"("courseId");

-- CreateIndex
CREATE INDEX "Enrollment_userId_idx" ON "public"."Enrollment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_userId_courseId_key" ON "public"."Enrollment"("userId", "courseId");

-- CreateIndex
CREATE INDEX "ExamQuestion_examId_order_idx" ON "public"."ExamQuestion"("examId", "order");

-- CreateIndex
CREATE INDEX "LearningPath_creatorId_idx" ON "public"."LearningPath"("creatorId");

-- CreateIndex
CREATE INDEX "LearningPathNode_pathId_idx" ON "public"."LearningPathNode"("pathId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPathNode_pathId_order_key" ON "public"."LearningPathNode"("pathId", "order");

-- CreateIndex
CREATE INDEX "NodeProgress_enrollmentId_idx" ON "public"."NodeProgress"("enrollmentId");

-- CreateIndex
CREATE INDEX "NodeProgress_nodeId_idx" ON "public"."NodeProgress"("nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "NodeProgress_enrollmentId_nodeId_key" ON "public"."NodeProgress"("enrollmentId", "nodeId");

-- CreateIndex
CREATE INDEX "PathEnrollment_pathId_idx" ON "public"."PathEnrollment"("pathId");

-- CreateIndex
CREATE INDEX "PathEnrollment_userId_idx" ON "public"."PathEnrollment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PathEnrollment_userId_pathId_key" ON "public"."PathEnrollment"("userId", "pathId");

-- CreateIndex
CREATE INDEX "PathRecommendation_pathId_idx" ON "public"."PathRecommendation"("pathId");

-- CreateIndex
CREATE INDEX "PathRecommendation_userId_isActive_idx" ON "public"."PathRecommendation"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PathRecommendation_userId_pathId_key" ON "public"."PathRecommendation"("userId", "pathId");

-- CreateIndex
CREATE INDEX "UserAnswer_attemptId_idx" ON "public"."UserAnswer"("attemptId");

-- CreateIndex
CREATE INDEX "UserAnswer_questionId_idx" ON "public"."UserAnswer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAnswer_attemptId_questionId_key" ON "public"."UserAnswer"("attemptId", "questionId");

-- CreateIndex
CREATE INDEX "UserExamAttempt_status_idx" ON "public"."UserExamAttempt"("status");

-- CreateIndex
CREATE INDEX "UserExamAttempt_userId_examId_idx" ON "public"."UserExamAttempt"("userId", "examId");

-- CreateIndex
CREATE UNIQUE INDEX "UserExamAttempt_userId_examId_attemptNumber_key" ON "public"."UserExamAttempt"("userId", "examId", "attemptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "CourseBloomsAnalysis_courseId_key" ON "public"."CourseBloomsAnalysis"("courseId");

-- CreateIndex
CREATE INDEX "CourseBloomsAnalysis_courseId_idx" ON "public"."CourseBloomsAnalysis"("courseId");

-- CreateIndex
CREATE INDEX "CourseBloomsAnalysis_contentHash_idx" ON "public"."CourseBloomsAnalysis"("contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "SectionBloomsMapping_sectionId_key" ON "public"."SectionBloomsMapping"("sectionId");

-- CreateIndex
CREATE INDEX "SectionBloomsMapping_sectionId_idx" ON "public"."SectionBloomsMapping"("sectionId");

-- CreateIndex
CREATE INDEX "SectionBloomsMapping_bloomsLevel_idx" ON "public"."SectionBloomsMapping"("bloomsLevel");

-- CreateIndex
CREATE UNIQUE INDEX "ExamBloomsProfile_examId_key" ON "public"."ExamBloomsProfile"("examId");

-- CreateIndex
CREATE INDEX "ExamBloomsProfile_examId_idx" ON "public"."ExamBloomsProfile"("examId");

-- CreateIndex
CREATE INDEX "QuestionBank_courseId_subject_topic_idx" ON "public"."QuestionBank"("courseId", "subject", "topic");

-- CreateIndex
CREATE INDEX "QuestionBank_bloomsLevel_difficulty_idx" ON "public"."QuestionBank"("bloomsLevel", "difficulty");

-- CreateIndex
CREATE INDEX "QuestionBank_questionType_idx" ON "public"."QuestionBank"("questionType");

-- CreateIndex
CREATE INDEX "StudentBloomsProgress_userId_idx" ON "public"."StudentBloomsProgress"("userId");

-- CreateIndex
CREATE INDEX "StudentBloomsProgress_courseId_idx" ON "public"."StudentBloomsProgress"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentBloomsProgress_userId_courseId_key" ON "public"."StudentBloomsProgress"("userId", "courseId");

-- CreateIndex
CREATE INDEX "BloomsPerformanceMetric_userId_courseId_idx" ON "public"."BloomsPerformanceMetric"("userId", "courseId");

-- CreateIndex
CREATE INDEX "BloomsPerformanceMetric_bloomsLevel_idx" ON "public"."BloomsPerformanceMetric"("bloomsLevel");

-- CreateIndex
CREATE INDEX "PersonalizedResourceRecommendation_userId_createdAt_idx" ON "public"."PersonalizedResourceRecommendation"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LearningStyleAnalysis_userId_analyzedAt_idx" ON "public"."LearningStyleAnalysis"("userId", "analyzedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalizedLearningPath_pathId_key" ON "public"."PersonalizedLearningPath"("pathId");

-- CreateIndex
CREATE INDEX "PersonalizedLearningPath_userId_createdAt_idx" ON "public"."PersonalizedLearningPath"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PersonalizedLearningPath_pathId_idx" ON "public"."PersonalizedLearningPath"("pathId");

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
CREATE INDEX "UserCourseEnrollment_userId_idx" ON "public"."UserCourseEnrollment"("userId");

-- CreateIndex
CREATE INDEX "UserCourseEnrollment_courseId_idx" ON "public"."UserCourseEnrollment"("courseId");

-- CreateIndex
CREATE INDEX "UserCourseEnrollment_status_idx" ON "public"."UserCourseEnrollment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UserCourseEnrollment_userId_courseId_key" ON "public"."UserCourseEnrollment"("userId", "courseId");

-- CreateIndex
CREATE INDEX "UserChapterCompletion_userId_idx" ON "public"."UserChapterCompletion"("userId");

-- CreateIndex
CREATE INDEX "UserChapterCompletion_chapterId_idx" ON "public"."UserChapterCompletion"("chapterId");

-- CreateIndex
CREATE UNIQUE INDEX "UserChapterCompletion_userId_chapterId_key" ON "public"."UserChapterCompletion"("userId", "chapterId");

-- CreateIndex
CREATE INDEX "UserSectionCompletion_userId_idx" ON "public"."UserSectionCompletion"("userId");

-- CreateIndex
CREATE INDEX "UserSectionCompletion_sectionId_idx" ON "public"."UserSectionCompletion"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSectionCompletion_userId_sectionId_key" ON "public"."UserSectionCompletion"("userId", "sectionId");

-- CreateIndex
CREATE INDEX "LearningSession_userId_idx" ON "public"."LearningSession"("userId");

-- CreateIndex
CREATE INDEX "LearningSession_sessionType_idx" ON "public"."LearningSession"("sessionType");

-- CreateIndex
CREATE INDEX "LearningSession_contentId_idx" ON "public"."LearningSession"("contentId");

-- CreateIndex
CREATE INDEX "LearningSession_startTime_idx" ON "public"."LearningSession"("startTime");

-- CreateIndex
CREATE INDEX "SectionCompletionTracking_userId_idx" ON "public"."SectionCompletionTracking"("userId");

-- CreateIndex
CREATE INDEX "SectionCompletionTracking_sectionId_idx" ON "public"."SectionCompletionTracking"("sectionId");

-- CreateIndex
CREATE INDEX "SectionCompletionTracking_status_idx" ON "public"."SectionCompletionTracking"("status");

-- CreateIndex
CREATE INDEX "SectionCompletionTracking_completedAt_idx" ON "public"."SectionCompletionTracking"("completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SectionCompletionTracking_userId_sectionId_completionType_key" ON "public"."SectionCompletionTracking"("userId", "sectionId", "completionType");

-- CreateIndex
CREATE INDEX "CodeExplanation_sectionId_idx" ON "public"."CodeExplanation"("sectionId");

-- CreateIndex
CREATE INDEX "MathExplanation_sectionId_idx" ON "public"."MathExplanation"("sectionId");

-- CreateIndex
CREATE INDEX "Post_userId_idx" ON "public"."Post"("userId");

-- CreateIndex
CREATE INDEX "Comment_postId_idx" ON "public"."Comment"("postId");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "public"."Comment"("userId");

-- CreateIndex
CREATE INDEX "Reply_commentId_idx" ON "public"."Reply"("commentId");

-- CreateIndex
CREATE INDEX "Reply_parentReplyId_idx" ON "public"."Reply"("parentReplyId");

-- CreateIndex
CREATE INDEX "Reply_path_idx" ON "public"."Reply"("path");

-- CreateIndex
CREATE INDEX "Reply_postId_idx" ON "public"."Reply"("postId");

-- CreateIndex
CREATE INDEX "Reply_userId_idx" ON "public"."Reply"("userId");

-- CreateIndex
CREATE INDEX "ContentCollection_userId_idx" ON "public"."ContentCollection"("userId");

-- CreateIndex
CREATE INDEX "ContentItem_collectionId_idx" ON "public"."ContentItem"("collectionId");

-- CreateIndex
CREATE INDEX "ContentItem_userId_contentType_idx" ON "public"."ContentItem"("userId", "contentType");

-- CreateIndex
CREATE INDEX "CustomTab_userId_idx" ON "public"."CustomTab"("userId");

-- CreateIndex
CREATE INDEX "FavoriteImage_userId_idx" ON "public"."FavoriteImage"("userId");

-- CreateIndex
CREATE INDEX "PostChapterSection_postId_idx" ON "public"."PostChapterSection"("postId");

-- CreateIndex
CREATE INDEX "PostImageSection_postId_idx" ON "public"."PostImageSection"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "public"."Tag"("name");

-- CreateIndex
CREATE INDEX "content_versions_organizationId_contentType_createdAt_idx" ON "public"."content_versions"("organizationId", "contentType", "createdAt");

-- CreateIndex
CREATE INDEX "content_versions_contentId_isActive_idx" ON "public"."content_versions"("contentId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "content_versions_contentId_versionNumber_key" ON "public"."content_versions"("contentId", "versionNumber");

-- CreateIndex
CREATE INDEX "MultiMediaAnalysis_courseId_contentType_idx" ON "public"."MultiMediaAnalysis"("courseId", "contentType");

-- CreateIndex
CREATE INDEX "MultiMediaAnalysis_chapterId_idx" ON "public"."MultiMediaAnalysis"("chapterId");

-- CreateIndex
CREATE INDEX "MultiModalAnalysis_courseId_idx" ON "public"."MultiModalAnalysis"("courseId");

-- CreateIndex
CREATE INDEX "GeneratedContent_contentType_createdAt_idx" ON "public"."GeneratedContent"("contentType", "createdAt");

-- CreateIndex
CREATE INDEX "GeneratedContent_quality_idx" ON "public"."GeneratedContent"("quality");

-- CreateIndex
CREATE INDEX "ContentOptimization_userId_contentId_idx" ON "public"."ContentOptimization"("userId", "contentId");

-- CreateIndex
CREATE INDEX "ContentVersionApproval_workflowId_idx" ON "public"."ContentVersionApproval"("workflowId");

-- CreateIndex
CREATE INDEX "ContentVersionApproval_approverId_idx" ON "public"."ContentVersionApproval"("approverId");

-- CreateIndex
CREATE INDEX "ContentVersionApproval_status_idx" ON "public"."ContentVersionApproval"("status");

-- CreateIndex
CREATE INDEX "ContentFlag_contentType_contentId_idx" ON "public"."ContentFlag"("contentType", "contentId");

-- CreateIndex
CREATE INDEX "ContentFlag_flaggedById_idx" ON "public"."ContentFlag"("flaggedById");

-- CreateIndex
CREATE INDEX "ContentFlag_status_idx" ON "public"."ContentFlag"("status");

-- CreateIndex
CREATE INDEX "Purchase_courseId_idx" ON "public"."Purchase"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_userId_courseId_key" ON "public"."Purchase"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeCustomer_userId_key" ON "public"."StripeCustomer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeCustomer_stripeCustomerId_key" ON "public"."StripeCustomer"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Bill_dueDate_idx" ON "public"."Bill"("dueDate");

-- CreateIndex
CREATE INDEX "Bill_userId_idx" ON "public"."Bill"("userId");

-- CreateIndex
CREATE INDEX "BillAttachment_billId_idx" ON "public"."BillAttachment"("billId");

-- CreateIndex
CREATE INDEX "BillPayment_billId_idx" ON "public"."BillPayment"("billId");

-- CreateIndex
CREATE INDEX "Subscription_stripe_customer_id_idx" ON "public"."Subscription"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "Subscription_stripe_subscription_id_idx" ON "public"."Subscription"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "public"."Subscription"("userId");

-- CreateIndex
CREATE INDEX "SubscriptionTransaction_subscriptionId_transactionDate_idx" ON "public"."SubscriptionTransaction"("subscriptionId", "transactionDate");

-- CreateIndex
CREATE INDEX "UserSubscription_userId_isActive_idx" ON "public"."UserSubscription"("userId", "isActive");

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
CREATE INDEX "Activity_dueDate_idx" ON "public"."Activity"("dueDate");

-- CreateIndex
CREATE INDEX "Activity_status_idx" ON "public"."Activity"("status");

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "public"."Activity"("type");

-- CreateIndex
CREATE INDEX "Activity_userId_idx" ON "public"."Activity"("userId");

-- CreateIndex
CREATE INDEX "ExamAnalytics_attemptId_analyticsType_idx" ON "public"."ExamAnalytics"("attemptId", "analyticsType");

-- CreateIndex
CREATE INDEX "SocialMetric_socialMediaAccountId_recordedAt_idx" ON "public"."SocialMetric"("socialMediaAccountId", "recordedAt");

-- CreateIndex
CREATE INDEX "UserAnalytics_userId_analyticsType_recordedAt_idx" ON "public"."UserAnalytics"("userId", "analyticsType", "recordedAt");

-- CreateIndex
CREATE INDEX "performance_metrics_date_idx" ON "public"."performance_metrics"("date");

-- CreateIndex
CREATE INDEX "performance_metrics_userId_idx" ON "public"."performance_metrics"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "performance_metrics_userId_date_period_key" ON "public"."performance_metrics"("userId", "date", "period");

-- CreateIndex
CREATE INDEX "realtime_activities_activityType_timestamp_idx" ON "public"."realtime_activities"("activityType", "timestamp");

-- CreateIndex
CREATE INDEX "realtime_activities_courseId_timestamp_idx" ON "public"."realtime_activities"("courseId", "timestamp");

-- CreateIndex
CREATE INDEX "realtime_activities_sessionId_idx" ON "public"."realtime_activities"("sessionId");

-- CreateIndex
CREATE INDEX "realtime_activities_userId_timestamp_idx" ON "public"."realtime_activities"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "user_achievements_achievementType_idx" ON "public"."user_achievements"("achievementType");

-- CreateIndex
CREATE INDEX "user_achievements_userId_idx" ON "public"."user_achievements"("userId");

-- CreateIndex
CREATE INDEX "user_progress_courseId_idx" ON "public"."user_progress"("courseId");

-- CreateIndex
CREATE INDEX "user_progress_isCompleted_idx" ON "public"."user_progress"("isCompleted");

-- CreateIndex
CREATE INDEX "user_progress_userId_idx" ON "public"."user_progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_progress_userId_courseId_chapterId_sectionId_key" ON "public"."user_progress"("userId", "courseId", "chapterId", "sectionId");

-- CreateIndex
CREATE INDEX "enterprise_analytics_organizationId_metricType_recordedAt_idx" ON "public"."enterprise_analytics"("organizationId", "metricType", "recordedAt");

-- CreateIndex
CREATE INDEX "enterprise_analytics_metricType_aggregationPeriod_idx" ON "public"."enterprise_analytics"("metricType", "aggregationPeriod");

-- CreateIndex
CREATE INDEX "sam_analytics_userId_metricType_recordedAt_idx" ON "public"."sam_analytics"("userId", "metricType", "recordedAt");

-- CreateIndex
CREATE INDEX "sam_analytics_metricType_period_idx" ON "public"."sam_analytics"("metricType", "period");

-- CreateIndex
CREATE INDEX "TeacherInsights_teacherId_courseId_idx" ON "public"."TeacherInsights"("teacherId", "courseId");

-- CreateIndex
CREATE INDEX "TeacherInsights_insightType_idx" ON "public"."TeacherInsights"("insightType");

-- CreateIndex
CREATE INDEX "PredictiveLearningAnalysis_userId_predictionType_idx" ON "public"."PredictiveLearningAnalysis"("userId", "predictionType");

-- CreateIndex
CREATE INDEX "PredictiveLearningAnalysis_courseId_predictionType_idx" ON "public"."PredictiveLearningAnalysis"("courseId", "predictionType");

-- CreateIndex
CREATE INDEX "PredictiveLearningAnalysis_createdAt_idx" ON "public"."PredictiveLearningAnalysis"("createdAt");

-- CreateIndex
CREATE INDEX "ResourceROIAnalysis_resourceUrl_idx" ON "public"."ResourceROIAnalysis"("resourceUrl");

-- CreateIndex
CREATE INDEX "ResourceROIAnalysis_recommendation_idx" ON "public"."ResourceROIAnalysis"("recommendation");

-- CreateIndex
CREATE INDEX "OrganizationAnalytics_organizationId_analyzedAt_idx" ON "public"."OrganizationAnalytics"("organizationId", "analyzedAt");

-- CreateIndex
CREATE INDEX "WorkforcePrediction_organizationId_predictedAt_idx" ON "public"."WorkforcePrediction"("organizationId", "predictedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CollaborationAnalytics_sessionId_key" ON "public"."CollaborationAnalytics"("sessionId");

-- CreateIndex
CREATE INDEX "CollaborationAnalytics_sessionId_idx" ON "public"."CollaborationAnalytics"("sessionId");

-- CreateIndex
CREATE INDEX "LearningDNA_userId_createdAt_idx" ON "public"."LearningDNA"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "social_learning_analyses_groupId_idx" ON "public"."social_learning_analyses"("groupId");

-- CreateIndex
CREATE INDEX "social_learning_analyses_communityId_idx" ON "public"."social_learning_analyses"("communityId");

-- CreateIndex
CREATE INDEX "social_learning_analyses_analysisType_idx" ON "public"."social_learning_analyses"("analysisType");

-- CreateIndex
CREATE INDEX "social_learning_analyses_analyzedAt_idx" ON "public"."social_learning_analyses"("analyzedAt");

-- CreateIndex
CREATE INDEX "ApprovalAnalytics_date_idx" ON "public"."ApprovalAnalytics"("date");

-- CreateIndex
CREATE INDEX "ApprovalAnalytics_organizationId_idx" ON "public"."ApprovalAnalytics"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "CertificateAnalytics_certificateId_key" ON "public"."CertificateAnalytics"("certificateId");

-- CreateIndex
CREATE INDEX "CertificateAnalytics_totalVerifications_idx" ON "public"."CertificateAnalytics"("totalVerifications");

-- CreateIndex
CREATE INDEX "CertificateAnalytics_lastVerified_idx" ON "public"."CertificateAnalytics"("lastVerified");

-- CreateIndex
CREATE UNIQUE INDEX "UserLearningPattern_userId_key" ON "public"."UserLearningPattern"("userId");

-- CreateIndex
CREATE INDEX "UserLearningPattern_patternType_idx" ON "public"."UserLearningPattern"("patternType");

-- CreateIndex
CREATE INDEX "UserLearningPattern_confidence_idx" ON "public"."UserLearningPattern"("confidence");

-- CreateIndex
CREATE INDEX "UserLearningPattern_lastAnalyzed_idx" ON "public"."UserLearningPattern"("lastAnalyzed");

-- CreateIndex
CREATE UNIQUE INDEX "CourseCompletionAnalytics_courseId_key" ON "public"."CourseCompletionAnalytics"("courseId");

-- CreateIndex
CREATE INDEX "CourseCompletionAnalytics_completionRate_idx" ON "public"."CourseCompletionAnalytics"("completionRate");

-- CreateIndex
CREATE INDEX "CourseCompletionAnalytics_averageScore_idx" ON "public"."CourseCompletionAnalytics"("averageScore");

-- CreateIndex
CREATE INDEX "CourseCompletionAnalytics_lastAnalyzed_idx" ON "public"."CourseCompletionAnalytics"("lastAnalyzed");

-- CreateIndex
CREATE INDEX "Reaction_commentId_idx" ON "public"."Reaction"("commentId");

-- CreateIndex
CREATE INDEX "Reaction_replyId_idx" ON "public"."Reaction"("replyId");

-- CreateIndex
CREATE INDEX "Reaction_userId_idx" ON "public"."Reaction"("userId");

-- CreateIndex
CREATE INDEX "Group_categoryId_idx" ON "public"."Group"("categoryId");

-- CreateIndex
CREATE INDEX "Group_courseId_idx" ON "public"."Group"("courseId");

-- CreateIndex
CREATE INDEX "Group_creatorId_idx" ON "public"."Group"("creatorId");

-- CreateIndex
CREATE INDEX "GroupDiscussion_authorId_idx" ON "public"."GroupDiscussion"("authorId");

-- CreateIndex
CREATE INDEX "GroupDiscussion_groupId_idx" ON "public"."GroupDiscussion"("groupId");

-- CreateIndex
CREATE INDEX "GroupDiscussionComment_authorId_idx" ON "public"."GroupDiscussionComment"("authorId");

-- CreateIndex
CREATE INDEX "GroupDiscussionComment_discussionId_idx" ON "public"."GroupDiscussionComment"("discussionId");

-- CreateIndex
CREATE INDEX "GroupDiscussionLike_discussionId_idx" ON "public"."GroupDiscussionLike"("discussionId");

-- CreateIndex
CREATE INDEX "GroupDiscussionLike_userId_idx" ON "public"."GroupDiscussionLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupDiscussionLike_discussionId_userId_key" ON "public"."GroupDiscussionLike"("discussionId", "userId");

-- CreateIndex
CREATE INDEX "GroupMember_groupId_idx" ON "public"."GroupMember"("groupId");

-- CreateIndex
CREATE INDEX "GroupMember_userId_idx" ON "public"."GroupMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_userId_groupId_key" ON "public"."GroupMember"("userId", "groupId");

-- CreateIndex
CREATE INDEX "GroupNotification_groupId_idx" ON "public"."GroupNotification"("groupId");

-- CreateIndex
CREATE INDEX "GroupNotification_userId_idx" ON "public"."GroupNotification"("userId");

-- CreateIndex
CREATE INDEX "GroupResource_authorId_idx" ON "public"."GroupResource"("authorId");

-- CreateIndex
CREATE INDEX "GroupResource_groupId_idx" ON "public"."GroupResource"("groupId");

-- CreateIndex
CREATE INDEX "Idea_userId_idx" ON "public"."Idea"("userId");

-- CreateIndex
CREATE INDEX "IdeaComment_ideaId_idx" ON "public"."IdeaComment"("ideaId");

-- CreateIndex
CREATE INDEX "IdeaComment_userId_idx" ON "public"."IdeaComment"("userId");

-- CreateIndex
CREATE INDEX "IdeaLike_ideaId_idx" ON "public"."IdeaLike"("ideaId");

-- CreateIndex
CREATE INDEX "IdeaLike_userId_idx" ON "public"."IdeaLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "IdeaLike_ideaId_userId_key" ON "public"."IdeaLike"("ideaId", "userId");

-- CreateIndex
CREATE INDEX "Message_recipientId_idx" ON "public"."Message"("recipientId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "public"."Message"("senderId");

-- CreateIndex
CREATE INDEX "Mind_userId_idx" ON "public"."Mind"("userId");

-- CreateIndex
CREATE INDEX "MindLike_mindId_idx" ON "public"."MindLike"("mindId");

-- CreateIndex
CREATE INDEX "MindLike_userId_idx" ON "public"."MindLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MindLike_mindId_userId_key" ON "public"."MindLike"("mindId", "userId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "public"."Notification"("userId");

-- CreateIndex
CREATE INDEX "SocialMediaAccount_userId_platform_idx" ON "public"."SocialMediaAccount"("userId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "SocialMediaAccount_userId_platform_platformUserId_key" ON "public"."SocialMediaAccount"("userId", "platform", "platformUserId");

-- CreateIndex
CREATE INDEX "SocialPost_socialMediaAccountId_publishedAt_idx" ON "public"."SocialPost"("socialMediaAccountId", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SocialPost_platformPostId_socialMediaAccountId_key" ON "public"."SocialPost"("platformPostId", "socialMediaAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "collaboration_sessions_sessionId_key" ON "public"."collaboration_sessions"("sessionId");

-- CreateIndex
CREATE INDEX "collaboration_sessions_organizationId_contentId_isActive_idx" ON "public"."collaboration_sessions"("organizationId", "contentId", "isActive");

-- CreateIndex
CREATE INDEX "collaboration_sessions_sessionId_isActive_idx" ON "public"."collaboration_sessions"("sessionId", "isActive");

-- CreateIndex
CREATE INDEX "collaboration_sessions_courseId_isActive_idx" ON "public"."collaboration_sessions"("courseId", "isActive");

-- CreateIndex
CREATE INDEX "collaboration_sessions_initiatorId_idx" ON "public"."collaboration_sessions"("initiatorId");

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
CREATE UNIQUE INDEX "collaborative_sessions_roomId_key" ON "public"."collaborative_sessions"("roomId");

-- CreateIndex
CREATE INDEX "collaborative_sessions_contentType_contentId_idx" ON "public"."collaborative_sessions"("contentType", "contentId");

-- CreateIndex
CREATE INDEX "collaborative_sessions_isActive_idx" ON "public"."collaborative_sessions"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "collaborative_sessions_contentType_contentId_key" ON "public"."collaborative_sessions"("contentType", "contentId");

-- CreateIndex
CREATE INDEX "session_participants_sessionId_idx" ON "public"."session_participants"("sessionId");

-- CreateIndex
CREATE INDEX "session_participants_userId_idx" ON "public"."session_participants"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_participants_sessionId_userId_key" ON "public"."session_participants"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "collaborative_activities_sessionId_idx" ON "public"."collaborative_activities"("sessionId");

-- CreateIndex
CREATE INDEX "collaborative_activities_userId_idx" ON "public"."collaborative_activities"("userId");

-- CreateIndex
CREATE INDEX "collaborative_activities_activityType_idx" ON "public"."collaborative_activities"("activityType");

-- CreateIndex
CREATE INDEX "session_comments_sessionId_idx" ON "public"."session_comments"("sessionId");

-- CreateIndex
CREATE INDEX "session_comments_authorId_idx" ON "public"."session_comments"("authorId");

-- CreateIndex
CREATE INDEX "session_comments_status_idx" ON "public"."session_comments"("status");

-- CreateIndex
CREATE INDEX "session_comments_parentId_idx" ON "public"."session_comments"("parentId");

-- CreateIndex
CREATE INDEX "session_conflicts_sessionId_idx" ON "public"."session_conflicts"("sessionId");

-- CreateIndex
CREATE INDEX "session_conflicts_resolved_idx" ON "public"."session_conflicts"("resolved");

-- CreateIndex
CREATE INDEX "session_conflicts_status_idx" ON "public"."session_conflicts"("status");

-- CreateIndex
CREATE INDEX "session_conflicts_priority_idx" ON "public"."session_conflicts"("priority");

-- CreateIndex
CREATE INDEX "edit_conflicts_sessionId_idx" ON "public"."edit_conflicts"("sessionId");

-- CreateIndex
CREATE INDEX "edit_conflicts_status_idx" ON "public"."edit_conflicts"("status");

-- CreateIndex
CREATE INDEX "session_snapshots_sessionId_idx" ON "public"."session_snapshots"("sessionId");

-- CreateIndex
CREATE INDEX "session_snapshots_createdAt_idx" ON "public"."session_snapshots"("createdAt");

-- CreateIndex
CREATE INDEX "collaborative_cursors_sessionId_idx" ON "public"."collaborative_cursors"("sessionId");

-- CreateIndex
CREATE INDEX "collaborative_cursors_userId_idx" ON "public"."collaborative_cursors"("userId");

-- CreateIndex
CREATE INDEX "collaborative_cursors_lastUpdate_idx" ON "public"."collaborative_cursors"("lastUpdate");

-- CreateIndex
CREATE UNIQUE INDEX "collaborative_cursors_sessionId_userId_key" ON "public"."collaborative_cursors"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "collaborative_operations_sessionId_idx" ON "public"."collaborative_operations"("sessionId");

-- CreateIndex
CREATE INDEX "collaborative_operations_userId_idx" ON "public"."collaborative_operations"("userId");

-- CreateIndex
CREATE INDEX "collaborative_operations_revision_idx" ON "public"."collaborative_operations"("revision");

-- CreateIndex
CREATE INDEX "collaborative_operations_timestamp_idx" ON "public"."collaborative_operations"("timestamp");

-- CreateIndex
CREATE INDEX "collaborative_permissions_contentType_contentId_idx" ON "public"."collaborative_permissions"("contentType", "contentId");

-- CreateIndex
CREATE INDEX "collaborative_permissions_isActive_idx" ON "public"."collaborative_permissions"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "collaborative_permissions_userId_contentType_contentId_key" ON "public"."collaborative_permissions"("userId", "contentType", "contentId");

-- CreateIndex
CREATE INDEX "AIContentGeneration_requestType_idx" ON "public"."AIContentGeneration"("requestType");

-- CreateIndex
CREATE INDEX "AIContentGeneration_status_idx" ON "public"."AIContentGeneration"("status");

-- CreateIndex
CREATE INDEX "AIContentGeneration_userId_idx" ON "public"."AIContentGeneration"("userId");

-- CreateIndex
CREATE INDEX "AIContentTemplate_creatorId_idx" ON "public"."AIContentTemplate"("creatorId");

-- CreateIndex
CREATE INDEX "AIContentTemplate_templateType_idx" ON "public"."AIContentTemplate"("templateType");

-- CreateIndex
CREATE INDEX "AIGeneratedContent_chapterId_idx" ON "public"."AIGeneratedContent"("chapterId");

-- CreateIndex
CREATE INDEX "AIGeneratedContent_contentType_idx" ON "public"."AIGeneratedContent"("contentType");

-- CreateIndex
CREATE INDEX "AIGeneratedContent_courseId_idx" ON "public"."AIGeneratedContent"("courseId");

-- CreateIndex
CREATE INDEX "AIGeneratedContent_creatorId_idx" ON "public"."AIGeneratedContent"("creatorId");

-- CreateIndex
CREATE INDEX "AIGeneratedContent_sectionId_idx" ON "public"."AIGeneratedContent"("sectionId");

-- CreateIndex
CREATE INDEX "AIUsageMetrics_date_idx" ON "public"."AIUsageMetrics"("date");

-- CreateIndex
CREATE INDEX "AIUsageMetrics_userId_idx" ON "public"."AIUsageMetrics"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AIUsageMetrics_userId_date_period_key" ON "public"."AIUsageMetrics"("userId", "date", "period");

-- CreateIndex
CREATE INDEX "RecommendationInteraction_recommendationId_idx" ON "public"."RecommendationInteraction"("recommendationId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAIPreferences_userId_key" ON "public"."UserAIPreferences"("userId");

-- CreateIndex
CREATE INDEX "ai_model_performance_organizationId_modelName_recordedAt_idx" ON "public"."ai_model_performance"("organizationId", "modelName", "recordedAt");

-- CreateIndex
CREATE INDEX "ai_model_performance_modelName_metricName_recordedAt_idx" ON "public"."ai_model_performance"("modelName", "metricName", "recordedAt");

-- CreateIndex
CREATE INDEX "sam_conversations_userId_isActive_idx" ON "public"."sam_conversations"("userId", "isActive");

-- CreateIndex
CREATE INDEX "sam_conversations_sessionId_idx" ON "public"."sam_conversations"("sessionId");

-- CreateIndex
CREATE INDEX "sam_conversations_courseId_userId_idx" ON "public"."sam_conversations"("courseId", "userId");

-- CreateIndex
CREATE INDEX "sam_messages_conversationId_createdAt_idx" ON "public"."sam_messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "sam_interactions_userId_interactionType_createdAt_idx" ON "public"."sam_interactions"("userId", "interactionType", "createdAt");

-- CreateIndex
CREATE INDEX "sam_interactions_interactionType_success_idx" ON "public"."sam_interactions"("interactionType", "success");

-- CreateIndex
CREATE INDEX "sam_interactions_courseId_userId_idx" ON "public"."sam_interactions"("courseId", "userId");

-- CreateIndex
CREATE INDEX "sam_points_userId_awardedAt_idx" ON "public"."sam_points"("userId", "awardedAt");

-- CreateIndex
CREATE INDEX "sam_points_category_awardedAt_idx" ON "public"."sam_points"("category", "awardedAt");

-- CreateIndex
CREATE INDEX "sam_badges_userId_earnedAt_idx" ON "public"."sam_badges"("userId", "earnedAt");

-- CreateIndex
CREATE INDEX "sam_badges_badgeType_idx" ON "public"."sam_badges"("badgeType");

-- CreateIndex
CREATE UNIQUE INDEX "sam_badges_userId_badgeId_key" ON "public"."sam_badges"("userId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "sam_streaks_userId_key" ON "public"."sam_streaks"("userId");

-- CreateIndex
CREATE INDEX "sam_streaks_streakType_currentStreak_idx" ON "public"."sam_streaks"("streakType", "currentStreak");

-- CreateIndex
CREATE UNIQUE INDEX "sam_learning_profiles_userId_key" ON "public"."sam_learning_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentCognitiveProfile_userId_key" ON "public"."StudentCognitiveProfile"("userId");

-- CreateIndex
CREATE INDEX "StudentCognitiveProfile_userId_idx" ON "public"."StudentCognitiveProfile"("userId");

-- CreateIndex
CREATE INDEX "ResourceDiscovery_topicId_idx" ON "public"."ResourceDiscovery"("topicId");

-- CreateIndex
CREATE INDEX "ResourceDiscovery_topicName_idx" ON "public"."ResourceDiscovery"("topicName");

-- CreateIndex
CREATE INDEX "EmotionalStateAnalysis_userId_analyzedAt_idx" ON "public"."EmotionalStateAnalysis"("userId", "analyzedAt");

-- CreateIndex
CREATE INDEX "MotivationProfile_userId_idx" ON "public"."MotivationProfile"("userId");

-- CreateIndex
CREATE INDEX "PersonalizationResult_userId_appliedAt_idx" ON "public"."PersonalizationResult"("userId", "appliedAt");

-- CreateIndex
CREATE INDEX "CognitiveFitnessAssessment_userId_createdAt_idx" ON "public"."CognitiveFitnessAssessment"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_idx" ON "public"."SupportTicket"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_domain_key" ON "public"."organizations"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "public"."organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organization_users_organizationId_userId_key" ON "public"."organization_users"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "compliance_events_organizationId_eventType_createdAt_idx" ON "public"."compliance_events"("organizationId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "compliance_events_complianceFramework_status_idx" ON "public"."compliance_events"("complianceFramework", "status");

-- CreateIndex
CREATE INDEX "audit_logs_organizationId_userId_createdAt_idx" ON "public"."audit_logs"("organizationId", "userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_entityType_createdAt_idx" ON "public"."audit_logs"("action", "entityType", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_severity_createdAt_idx" ON "public"."audit_logs"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_eventType_timestamp_idx" ON "public"."audit_logs"("eventType", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_riskScore_timestamp_idx" ON "public"."audit_logs"("riskScore", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_sessionId_idx" ON "public"."audit_logs"("sessionId");

-- CreateIndex
CREATE INDEX "audit_logs_requestId_idx" ON "public"."audit_logs"("requestId");

-- CreateIndex
CREATE INDEX "security_events_organizationId_eventType_severity_createdAt_idx" ON "public"."security_events"("organizationId", "eventType", "severity", "createdAt");

-- CreateIndex
CREATE INDEX "security_events_severity_status_createdAt_idx" ON "public"."security_events"("severity", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExecutiveReport_reportId_key" ON "public"."ExecutiveReport"("reportId");

-- CreateIndex
CREATE INDEX "ExecutiveReport_organizationId_reportType_generatedAt_idx" ON "public"."ExecutiveReport"("organizationId", "reportType", "generatedAt");

-- CreateIndex
CREATE INDEX "ExecutiveReport_reportId_idx" ON "public"."ExecutiveReport"("reportId");

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
CREATE INDEX "ApprovalWorkflowTemplate_organizationId_idx" ON "public"."ApprovalWorkflowTemplate"("organizationId");

-- CreateIndex
CREATE INDEX "ApprovalWorkflow_templateId_idx" ON "public"."ApprovalWorkflow"("templateId");

-- CreateIndex
CREATE INDEX "ApprovalWorkflow_contentVersionId_idx" ON "public"."ApprovalWorkflow"("contentVersionId");

-- CreateIndex
CREATE INDEX "ApprovalWorkflow_status_idx" ON "public"."ApprovalWorkflow"("status");

-- CreateIndex
CREATE INDEX "ApprovalNotification_workflowId_idx" ON "public"."ApprovalNotification"("workflowId");

-- CreateIndex
CREATE INDEX "ApprovalNotification_recipientId_idx" ON "public"."ApprovalNotification"("recipientId");

-- CreateIndex
CREATE INDEX "ApprovalNotification_status_idx" ON "public"."ApprovalNotification"("status");

-- CreateIndex
CREATE INDEX "ApprovalAuditLog_workflowId_idx" ON "public"."ApprovalAuditLog"("workflowId");

-- CreateIndex
CREATE INDEX "ApprovalAuditLog_actorId_idx" ON "public"."ApprovalAuditLog"("actorId");

-- CreateIndex
CREATE INDEX "ApprovalAuditLog_timestamp_idx" ON "public"."ApprovalAuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "BulkApprovalOperation_performedById_idx" ON "public"."BulkApprovalOperation"("performedById");

-- CreateIndex
CREATE INDEX "BulkApprovalOperation_status_idx" ON "public"."BulkApprovalOperation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "error_metrics_date_key" ON "public"."error_metrics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "UserContext_userId_key" ON "public"."UserContext"("userId");

-- CreateIndex
CREATE INDEX "UserContext_userId_idx" ON "public"."UserContext"("userId");

-- CreateIndex
CREATE INDEX "UserContext_activeCapability_idx" ON "public"."UserContext"("activeCapability");

-- CreateIndex
CREATE UNIQUE INDEX "AdminMetadata_userId_key" ON "public"."AdminMetadata"("userId");

-- CreateIndex
CREATE INDEX "AdminMetadata_userId_idx" ON "public"."AdminMetadata"("userId");

-- CreateIndex
CREATE INDEX "AdminMetadata_updatedAt_idx" ON "public"."AdminMetadata"("updatedAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_userId_timestamp_idx" ON "public"."AdminAuditLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_timestamp_idx" ON "public"."AdminAuditLog"("action", "timestamp");

-- CreateIndex
CREATE INDEX "AdminAuditLog_actionCategory_timestamp_idx" ON "public"."AdminAuditLog"("actionCategory", "timestamp");

-- CreateIndex
CREATE INDEX "AdminAuditLog_success_timestamp_idx" ON "public"."AdminAuditLog"("success", "timestamp");

-- CreateIndex
CREATE INDEX "AdminAuditLog_sessionId_idx" ON "public"."AdminAuditLog"("sessionId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_ipAddress_idx" ON "public"."AdminAuditLog"("ipAddress");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSessionMetrics_sessionId_key" ON "public"."AdminSessionMetrics"("sessionId");

-- CreateIndex
CREATE INDEX "AdminSessionMetrics_userId_loginTime_idx" ON "public"."AdminSessionMetrics"("userId", "loginTime");

-- CreateIndex
CREATE INDEX "AdminSessionMetrics_sessionId_idx" ON "public"."AdminSessionMetrics"("sessionId");

-- CreateIndex
CREATE INDEX "AdminSessionMetrics_loginTime_idx" ON "public"."AdminSessionMetrics"("loginTime");

-- CreateIndex
CREATE INDEX "AdminSessionMetrics_isSuspicious_idx" ON "public"."AdminSessionMetrics"("isSuspicious");

-- CreateIndex
CREATE INDEX "Goal_userId_status_idx" ON "public"."Goal"("userId", "status");

-- CreateIndex
CREATE INDEX "Milestone_goalId_idx" ON "public"."Milestone"("goalId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseMarketAnalysis_courseId_key" ON "public"."CourseMarketAnalysis"("courseId");

-- CreateIndex
CREATE INDEX "CourseMarketAnalysis_courseId_idx" ON "public"."CourseMarketAnalysis"("courseId");

-- CreateIndex
CREATE INDEX "CourseCompetitor_courseId_idx" ON "public"."CourseCompetitor"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_verificationCode_key" ON "public"."UserBadge"("verificationCode");

-- CreateIndex
CREATE INDEX "UserBadge_userId_idx" ON "public"."UserBadge"("userId");

-- CreateIndex
CREATE INDEX "UserBadge_badgeId_idx" ON "public"."UserBadge"("badgeId");

-- CreateIndex
CREATE INDEX "UserBadge_verificationCode_idx" ON "public"."UserBadge"("verificationCode");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeId_key" ON "public"."UserBadge"("userId", "badgeId");

-- CreateIndex
CREATE INDEX "Badge_badgeType_idx" ON "public"."Badge"("badgeType");

-- CreateIndex
CREATE INDEX "Badge_category_idx" ON "public"."Badge"("category");

-- CreateIndex
CREATE UNIQUE INDEX "CourseGuideAnalysis_courseId_key" ON "public"."CourseGuideAnalysis"("courseId");

-- CreateIndex
CREATE INDEX "CourseGuideAnalysis_courseId_idx" ON "public"."CourseGuideAnalysis"("courseId");

-- CreateIndex
CREATE INDEX "CourseOptimizationSuggestion_courseId_status_idx" ON "public"."CourseOptimizationSuggestion"("courseId", "status");

-- CreateIndex
CREATE INDEX "CourseOptimizationSuggestion_suggestionType_idx" ON "public"."CourseOptimizationSuggestion"("suggestionType");

-- CreateIndex
CREATE INDEX "FitnessSession_userId_exerciseId_idx" ON "public"."FitnessSession"("userId", "exerciseId");

-- CreateIndex
CREATE INDEX "FitnessSession_status_idx" ON "public"."FitnessSession"("status");

-- CreateIndex
CREATE INDEX "FitnessMilestone_userId_dimension_idx" ON "public"."FitnessMilestone"("userId", "dimension");

-- CreateIndex
CREATE UNIQUE INDEX "BadgeDefinition_slug_key" ON "public"."BadgeDefinition"("slug");

-- CreateIndex
CREATE INDEX "BadgeDefinition_badgeType_idx" ON "public"."BadgeDefinition"("badgeType");

-- CreateIndex
CREATE INDEX "BadgeDefinition_category_idx" ON "public"."BadgeDefinition"("category");

-- CreateIndex
CREATE INDEX "BadgeDefinition_level_idx" ON "public"."BadgeDefinition"("level");

-- CreateIndex
CREATE INDEX "BadgeProgress_userId_idx" ON "public"."BadgeProgress"("userId");

-- CreateIndex
CREATE INDEX "BadgeProgress_badgeId_idx" ON "public"."BadgeProgress"("badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "BadgeProgress_userId_badgeId_key" ON "public"."BadgeProgress"("userId", "badgeId");

-- CreateIndex
CREATE INDEX "UserProgressAlert_userId_idx" ON "public"."UserProgressAlert"("userId");

-- CreateIndex
CREATE INDEX "UserProgressAlert_alertType_idx" ON "public"."UserProgressAlert"("alertType");

-- CreateIndex
CREATE INDEX "UserProgressAlert_severity_idx" ON "public"."UserProgressAlert"("severity");

-- CreateIndex
CREATE INDEX "UserProgressAlert_isRead_idx" ON "public"."UserProgressAlert"("isRead");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_slug_key" ON "public"."Skill"("slug");

-- CreateIndex
CREATE INDEX "Skill_category_idx" ON "public"."Skill"("category");

-- CreateIndex
CREATE INDEX "Skill_bloomsLevel_idx" ON "public"."Skill"("bloomsLevel");

-- CreateIndex
CREATE INDEX "Skill_difficulty_idx" ON "public"."Skill"("difficulty");

-- CreateIndex
CREATE INDEX "SkillProgress_userId_idx" ON "public"."SkillProgress"("userId");

-- CreateIndex
CREATE INDEX "SkillProgress_skillId_idx" ON "public"."SkillProgress"("skillId");

-- CreateIndex
CREATE INDEX "SkillProgress_currentLevel_idx" ON "public"."SkillProgress"("currentLevel");

-- CreateIndex
CREATE UNIQUE INDEX "SkillProgress_userId_skillId_key" ON "public"."SkillProgress"("userId", "skillId");

-- CreateIndex
CREATE INDEX "SkillGap_userId_idx" ON "public"."SkillGap"("userId");

-- CreateIndex
CREATE INDEX "SkillGap_skillId_idx" ON "public"."SkillGap"("skillId");

-- CreateIndex
CREATE INDEX "SkillGap_gapType_idx" ON "public"."SkillGap"("gapType");

-- CreateIndex
CREATE INDEX "SkillGap_severity_idx" ON "public"."SkillGap"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "SkillGap_userId_skillId_key" ON "public"."SkillGap"("userId", "skillId");

-- CreateIndex
CREATE INDEX "LearningEvent_userId_idx" ON "public"."LearningEvent"("userId");

-- CreateIndex
CREATE INDEX "LearningEvent_eventType_idx" ON "public"."LearningEvent"("eventType");

-- CreateIndex
CREATE INDEX "LearningEvent_eventCategory_idx" ON "public"."LearningEvent"("eventCategory");

-- CreateIndex
CREATE INDEX "LearningEvent_contentType_idx" ON "public"."LearningEvent"("contentType");

-- CreateIndex
CREATE INDEX "LearningEvent_sessionId_idx" ON "public"."LearningEvent"("sessionId");

-- CreateIndex
CREATE INDEX "LearningEvent_timestamp_idx" ON "public"."LearningEvent"("timestamp");

-- CreateIndex
CREATE INDEX "GroupEvent_creatorId_idx" ON "public"."GroupEvent"("creatorId");

-- CreateIndex
CREATE INDEX "GroupEvent_groupId_idx" ON "public"."GroupEvent"("groupId");

-- CreateIndex
CREATE INDEX "GroupEvent_organizerId_idx" ON "public"."GroupEvent"("organizerId");

-- CreateIndex
CREATE INDEX "GroupEventAttendee_eventId_idx" ON "public"."GroupEventAttendee"("eventId");

-- CreateIndex
CREATE INDEX "GroupEventAttendee_userId_idx" ON "public"."GroupEventAttendee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupEventAttendee_eventId_userId_key" ON "public"."GroupEventAttendee"("eventId", "userId");

-- CreateIndex
CREATE INDEX "BadgeEvent_badgeId_idx" ON "public"."BadgeEvent"("badgeId");

-- CreateIndex
CREATE INDEX "BadgeEvent_userId_idx" ON "public"."BadgeEvent"("userId");

-- CreateIndex
CREATE INDEX "BadgeEvent_eventType_idx" ON "public"."BadgeEvent"("eventType");

-- CreateIndex
CREATE INDEX "CalendarEvent_parentEventId_idx" ON "public"."CalendarEvent"("parentEventId");

-- CreateIndex
CREATE INDEX "CalendarEvent_startDate_idx" ON "public"."CalendarEvent"("startDate");

-- CreateIndex
CREATE INDEX "CalendarEvent_userId_idx" ON "public"."CalendarEvent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_externalId_source_key" ON "public"."CalendarEvent"("externalId", "source");

-- CreateIndex
CREATE UNIQUE INDEX "UserCalendarSettings_userId_key" ON "public"."UserCalendarSettings"("userId");

-- CreateIndex
CREATE INDEX "UserCalendarSettings_userId_idx" ON "public"."UserCalendarSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Certification_verificationCode_key" ON "public"."Certification"("verificationCode");

-- CreateIndex
CREATE INDEX "Certification_userId_idx" ON "public"."Certification"("userId");

-- CreateIndex
CREATE INDEX "Certification_courseId_idx" ON "public"."Certification"("courseId");

-- CreateIndex
CREATE INDEX "Certification_verificationCode_idx" ON "public"."Certification"("verificationCode");

-- CreateIndex
CREATE INDEX "CertificateTemplate_templateType_idx" ON "public"."CertificateTemplate"("templateType");

-- CreateIndex
CREATE INDEX "CertificateVerification_certificateId_idx" ON "public"."CertificateVerification"("certificateId");

-- CreateIndex
CREATE INDEX "CertificateVerification_badgeId_idx" ON "public"."CertificateVerification"("badgeId");

-- CreateIndex
CREATE INDEX "CertificateVerification_verificationCode_idx" ON "public"."CertificateVerification"("verificationCode");

-- CreateIndex
CREATE INDEX "CertificateVerification_verifiedAt_idx" ON "public"."CertificateVerification"("verifiedAt");

-- CreateIndex
CREATE INDEX "CertificateEvent_certificateId_idx" ON "public"."CertificateEvent"("certificateId");

-- CreateIndex
CREATE INDEX "CertificateEvent_eventType_idx" ON "public"."CertificateEvent"("eventType");

-- CreateIndex
CREATE INDEX "CertificateEvent_userId_idx" ON "public"."CertificateEvent"("userId");

-- CreateIndex
CREATE INDEX "CertificateEvent_createdAt_idx" ON "public"."CertificateEvent"("createdAt");

-- CreateIndex
CREATE INDEX "_PostToTag_B_index" ON "public"."_PostToTag"("B");

-- CreateIndex
CREATE INDEX "_IdeaCollaborators_B_index" ON "public"."_IdeaCollaborators"("B");

-- CreateIndex
CREATE INDEX "_MindCollaborators_B_index" ON "public"."_MindCollaborators"("B");

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TwoFactorConfirmation" ADD CONSTRAINT "TwoFactorConfirmation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActiveSession" ADD CONSTRAINT "ActiveSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuthAudit" ADD CONSTRAINT "AuthAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BackupCode" ADD CONSTRAINT "BackupCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TOTPSecret" ADD CONSTRAINT "TOTPSecret_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."auth_sessions" ADD CONSTRAINT "auth_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_permissions" ADD CONSTRAINT "user_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."password_histories" ADD CONSTRAINT "password_histories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."permission_rules" ADD CONSTRAINT "permission_rules_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."permission_activities" ADD CONSTRAINT "permission_activities_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."permission_activities" ADD CONSTRAINT "permission_activities_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserCapability" ADD CONSTRAINT "UserCapability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdminAccount" ADD CONSTRAINT "AdminAccount_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdminActiveSession" ADD CONSTRAINT "AdminActiveSession_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdminTwoFactorConfirmation" ADD CONSTRAINT "AdminTwoFactorConfirmation_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Course" ADD CONSTRAINT "Course_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Course" ADD CONSTRAINT "Course_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Course" ADD CONSTRAINT "Course_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attachment" ADD CONSTRAINT "Attachment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Chapter" ADD CONSTRAINT "Chapter_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Section" ADD CONSTRAINT "Section_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "public"."Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Video" ADD CONSTRAINT "Video_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Video" ADD CONSTRAINT "Video_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Exam" ADD CONSTRAINT "Exam_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseReview" ADD CONSTRAINT "CourseReview_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseReview" ADD CONSTRAINT "CourseReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExamQuestion" ADD CONSTRAINT "ExamQuestion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "public"."Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LearningPath" ADD CONSTRAINT "LearningPath_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LearningPathNode" ADD CONSTRAINT "LearningPathNode_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "public"."LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NodeProgress" ADD CONSTRAINT "NodeProgress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "public"."PathEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NodeProgress" ADD CONSTRAINT "NodeProgress_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "public"."LearningPathNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PathEnrollment" ADD CONSTRAINT "PathEnrollment_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "public"."LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PathEnrollment" ADD CONSTRAINT "PathEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PathRecommendation" ADD CONSTRAINT "PathRecommendation_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "public"."LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PathRecommendation" ADD CONSTRAINT "PathRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserAnswer" ADD CONSTRAINT "UserAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "public"."UserExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserAnswer" ADD CONSTRAINT "UserAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."ExamQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserExamAttempt" ADD CONSTRAINT "UserExamAttempt_examId_fkey" FOREIGN KEY ("examId") REFERENCES "public"."Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserExamAttempt" ADD CONSTRAINT "UserExamAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseBloomsAnalysis" ADD CONSTRAINT "CourseBloomsAnalysis_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SectionBloomsMapping" ADD CONSTRAINT "SectionBloomsMapping_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExamBloomsProfile" ADD CONSTRAINT "ExamBloomsProfile_examId_fkey" FOREIGN KEY ("examId") REFERENCES "public"."Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuestionBank" ADD CONSTRAINT "QuestionBank_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentBloomsProgress" ADD CONSTRAINT "StudentBloomsProgress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentBloomsProgress" ADD CONSTRAINT "StudentBloomsProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BloomsPerformanceMetric" ADD CONSTRAINT "BloomsPerformanceMetric_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BloomsPerformanceMetric" ADD CONSTRAINT "BloomsPerformanceMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PersonalizedResourceRecommendation" ADD CONSTRAINT "PersonalizedResourceRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LearningStyleAnalysis" ADD CONSTRAINT "LearningStyleAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PersonalizedLearningPath" ADD CONSTRAINT "PersonalizedLearningPath_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuantumLearningPath" ADD CONSTRAINT "QuantumLearningPath_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuantumObservation" ADD CONSTRAINT "QuantumObservation_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "public"."QuantumLearningPath"("pathId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserCourseEnrollment" ADD CONSTRAINT "UserCourseEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserCourseEnrollment" ADD CONSTRAINT "UserCourseEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserChapterCompletion" ADD CONSTRAINT "UserChapterCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserChapterCompletion" ADD CONSTRAINT "UserChapterCompletion_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "public"."Chapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserSectionCompletion" ADD CONSTRAINT "UserSectionCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserSectionCompletion" ADD CONSTRAINT "UserSectionCompletion_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LearningSession" ADD CONSTRAINT "LearningSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SectionCompletionTracking" ADD CONSTRAINT "SectionCompletionTracking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SectionCompletionTracking" ADD CONSTRAINT "SectionCompletionTracking_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Blog" ADD CONSTRAINT "Blog_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Blog" ADD CONSTRAINT "Blog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Article" ADD CONSTRAINT "Article_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Article" ADD CONSTRAINT "Article_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Note" ADD CONSTRAINT "Note_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CodeExplanation" ADD CONSTRAINT "CodeExplanation_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MathExplanation" ADD CONSTRAINT "MathExplanation_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Post" ADD CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reply" ADD CONSTRAINT "Reply_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "public"."Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reply" ADD CONSTRAINT "Reply_parentReplyId_fkey" FOREIGN KEY ("parentReplyId") REFERENCES "public"."Reply"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reply" ADD CONSTRAINT "Reply_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reply" ADD CONSTRAINT "Reply_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentCollection" ADD CONSTRAINT "ContentCollection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentItem" ADD CONSTRAINT "ContentItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "public"."ContentCollection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentItem" ADD CONSTRAINT "ContentItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomTab" ADD CONSTRAINT "CustomTab_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FavoriteArticle" ADD CONSTRAINT "FavoriteArticle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FavoriteAudio" ADD CONSTRAINT "FavoriteAudio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FavoriteBlog" ADD CONSTRAINT "FavoriteBlog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FavoriteImage" ADD CONSTRAINT "FavoriteImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FavoriteVideo" ADD CONSTRAINT "FavoriteVideo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostChapterSection" ADD CONSTRAINT "PostChapterSection_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostImageSection" ADD CONSTRAINT "PostImageSection_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."content_versions" ADD CONSTRAINT "content_versions_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."content_versions" ADD CONSTRAINT "content_versions_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."content_versions" ADD CONSTRAINT "content_versions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MultiMediaAnalysis" ADD CONSTRAINT "MultiMediaAnalysis_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "public"."Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MultiMediaAnalysis" ADD CONSTRAINT "MultiMediaAnalysis_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MultiModalAnalysis" ADD CONSTRAINT "MultiModalAnalysis_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentOptimization" ADD CONSTRAINT "ContentOptimization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentVersionApproval" ADD CONSTRAINT "ContentVersionApproval_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "public"."ApprovalWorkflow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentVersionApproval" ADD CONSTRAINT "ContentVersionApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentFlag" ADD CONSTRAINT "ContentFlag_flaggedById_fkey" FOREIGN KEY ("flaggedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ContentFlag" ADD CONSTRAINT "ContentFlag_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Purchase" ADD CONSTRAINT "Purchase_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Bill" ADD CONSTRAINT "Bill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BillAttachment" ADD CONSTRAINT "BillAttachment_billId_fkey" FOREIGN KEY ("billId") REFERENCES "public"."Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BillPayment" ADD CONSTRAINT "BillPayment_billId_fkey" FOREIGN KEY ("billId") REFERENCES "public"."Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubscriptionTransaction" ADD CONSTRAINT "SubscriptionTransaction_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "public"."UserSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserSubscription" ADD CONSTRAINT "UserSubscription_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."SubscriptionService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserSubscription" ADD CONSTRAINT "UserSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PricingExperiment" ADD CONSTRAINT "PricingExperiment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExamAnalytics" ADD CONSTRAINT "ExamAnalytics_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "public"."UserExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SocialMetric" ADD CONSTRAINT "SocialMetric_socialMediaAccountId_fkey" FOREIGN KEY ("socialMediaAccountId") REFERENCES "public"."SocialMediaAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserAnalytics" ADD CONSTRAINT "UserAnalytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."learning_metrics" ADD CONSTRAINT "learning_metrics_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."learning_metrics" ADD CONSTRAINT "learning_metrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."learning_sessions" ADD CONSTRAINT "learning_sessions_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "public"."Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."learning_sessions" ADD CONSTRAINT "learning_sessions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."learning_sessions" ADD CONSTRAINT "learning_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."performance_metrics" ADD CONSTRAINT "performance_metrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."progress_alerts" ADD CONSTRAINT "progress_alerts_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "public"."Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."progress_alerts" ADD CONSTRAINT "progress_alerts_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."progress_alerts" ADD CONSTRAINT "progress_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."realtime_activities" ADD CONSTRAINT "realtime_activities_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "public"."Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."realtime_activities" ADD CONSTRAINT "realtime_activities_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."realtime_activities" ADD CONSTRAINT "realtime_activities_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."realtime_activities" ADD CONSTRAINT "realtime_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."study_streaks" ADD CONSTRAINT "study_streaks_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."study_streaks" ADD CONSTRAINT "study_streaks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_achievements" ADD CONSTRAINT "user_achievements_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_achievements" ADD CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_progress" ADD CONSTRAINT "user_progress_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "public"."Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_progress" ADD CONSTRAINT "user_progress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_progress" ADD CONSTRAINT "user_progress_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_progress" ADD CONSTRAINT "user_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."enterprise_analytics" ADD CONSTRAINT "enterprise_analytics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sam_analytics" ADD CONSTRAINT "sam_analytics_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sam_analytics" ADD CONSTRAINT "sam_analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherInsights" ADD CONSTRAINT "TeacherInsights_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherInsights" ADD CONSTRAINT "TeacherInsights_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PredictiveLearningAnalysis" ADD CONSTRAINT "PredictiveLearningAnalysis_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PredictiveLearningAnalysis" ADD CONSTRAINT "PredictiveLearningAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CollaborationAnalytics" ADD CONSTRAINT "CollaborationAnalytics_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."collaboration_sessions"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LearningDNA" ADD CONSTRAINT "LearningDNA_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_learning_analyses" ADD CONSTRAINT "social_learning_analyses_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovalAnalytics" ADD CONSTRAINT "ApprovalAnalytics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CertificateAnalytics" ADD CONSTRAINT "CertificateAnalytics_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "public"."Certification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserLearningPattern" ADD CONSTRAINT "UserLearningPattern_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseCompletionAnalytics" ADD CONSTRAINT "CourseCompletionAnalytics_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reaction" ADD CONSTRAINT "Reaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "public"."Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reaction" ADD CONSTRAINT "Reaction_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "public"."Reply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProfileLink" ADD CONSTRAINT "ProfileLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Group" ADD CONSTRAINT "Group_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Group" ADD CONSTRAINT "Group_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Group" ADD CONSTRAINT "Group_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupDiscussion" ADD CONSTRAINT "GroupDiscussion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupDiscussion" ADD CONSTRAINT "GroupDiscussion_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupDiscussionComment" ADD CONSTRAINT "GroupDiscussionComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupDiscussionComment" ADD CONSTRAINT "GroupDiscussionComment_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "public"."GroupDiscussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupDiscussionLike" ADD CONSTRAINT "GroupDiscussionLike_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "public"."GroupDiscussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupDiscussionLike" ADD CONSTRAINT "GroupDiscussionLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupMember" ADD CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupNotification" ADD CONSTRAINT "GroupNotification_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupNotification" ADD CONSTRAINT "GroupNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupResource" ADD CONSTRAINT "GroupResource_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupResource" ADD CONSTRAINT "GroupResource_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Idea" ADD CONSTRAINT "Idea_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IdeaComment" ADD CONSTRAINT "IdeaComment_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "public"."Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IdeaComment" ADD CONSTRAINT "IdeaComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IdeaLike" ADD CONSTRAINT "IdeaLike_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "public"."Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."IdeaLike" ADD CONSTRAINT "IdeaLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Mind" ADD CONSTRAINT "Mind_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MindLike" ADD CONSTRAINT "MindLike_mindId_fkey" FOREIGN KEY ("mindId") REFERENCES "public"."Mind"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MindLike" ADD CONSTRAINT "MindLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SocialMediaAccount" ADD CONSTRAINT "SocialMediaAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SocialPost" ADD CONSTRAINT "SocialPost_socialMediaAccountId_fkey" FOREIGN KEY ("socialMediaAccountId") REFERENCES "public"."SocialMediaAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collaboration_sessions" ADD CONSTRAINT "collaboration_sessions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collaboration_participants" ADD CONSTRAINT "collaboration_participants_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."collaboration_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collaboration_participants" ADD CONSTRAINT "collaboration_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collaboration_messages" ADD CONSTRAINT "collaboration_messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "public"."collaboration_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collaboration_messages" ADD CONSTRAINT "collaboration_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."collaboration_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collaboration_messages" ADD CONSTRAINT "collaboration_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CollaborationContribution" ADD CONSTRAINT "CollaborationContribution_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."collaboration_sessions"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CollaborationReaction" ADD CONSTRAINT "CollaborationReaction_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "public"."CollaborationContribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CollaborationReaction" ADD CONSTRAINT "CollaborationReaction_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."collaboration_sessions"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudyBuddy" ADD CONSTRAINT "StudyBuddy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BuddyInteraction" ADD CONSTRAINT "BuddyInteraction_buddyId_fkey" FOREIGN KEY ("buddyId") REFERENCES "public"."StudyBuddy"("buddyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BuddyAdjustment" ADD CONSTRAINT "BuddyAdjustment_buddyId_fkey" FOREIGN KEY ("buddyId") REFERENCES "public"."StudyBuddy"("buddyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mentor_mentee_matches" ADD CONSTRAINT "mentor_mentee_matches_menteeId_fkey" FOREIGN KEY ("menteeId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."mentor_mentee_matches" ADD CONSTRAINT "mentor_mentee_matches_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collaborative_sessions" ADD CONSTRAINT "collaborative_sessions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_participants" ADD CONSTRAINT "session_participants_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."collaborative_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_participants" ADD CONSTRAINT "session_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collaborative_activities" ADD CONSTRAINT "collaborative_activities_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."collaborative_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collaborative_activities" ADD CONSTRAINT "collaborative_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_comments" ADD CONSTRAINT "session_comments_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."collaborative_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_comments" ADD CONSTRAINT "session_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_comments" ADD CONSTRAINT "session_comments_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_comments" ADD CONSTRAINT "session_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."session_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_conflicts" ADD CONSTRAINT "session_conflicts_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."collaborative_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_conflicts" ADD CONSTRAINT "session_conflicts_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_conflicts" ADD CONSTRAINT "session_conflicts_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_snapshots" ADD CONSTRAINT "session_snapshots_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."collaborative_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_snapshots" ADD CONSTRAINT "session_snapshots_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collaborative_cursors" ADD CONSTRAINT "collaborative_cursors_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."collaborative_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collaborative_cursors" ADD CONSTRAINT "collaborative_cursors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collaborative_operations" ADD CONSTRAINT "collaborative_operations_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."collaborative_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collaborative_operations" ADD CONSTRAINT "collaborative_operations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collaborative_permissions" ADD CONSTRAINT "collaborative_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collaborative_permissions" ADD CONSTRAINT "collaborative_permissions_grantedBy_fkey" FOREIGN KEY ("grantedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collaborative_permissions" ADD CONSTRAINT "collaborative_permissions_revokedBy_fkey" FOREIGN KEY ("revokedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIContentGeneration" ADD CONSTRAINT "AIContentGeneration_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."AIContentTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIContentGeneration" ADD CONSTRAINT "AIContentGeneration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIContentTemplate" ADD CONSTRAINT "AIContentTemplate_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIGeneratedContent" ADD CONSTRAINT "AIGeneratedContent_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "public"."Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIGeneratedContent" ADD CONSTRAINT "AIGeneratedContent_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIGeneratedContent" ADD CONSTRAINT "AIGeneratedContent_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIGeneratedContent" ADD CONSTRAINT "AIGeneratedContent_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIGeneratedContent" ADD CONSTRAINT "AIGeneratedContent_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."AIContentTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIUsageMetrics" ADD CONSTRAINT "AIUsageMetrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecommendationInteraction" ADD CONSTRAINT "RecommendationInteraction_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "public"."PathRecommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserAIPreferences" ADD CONSTRAINT "UserAIPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_model_performance" ADD CONSTRAINT "ai_model_performance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sam_conversations" ADD CONSTRAINT "sam_conversations_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "public"."Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sam_conversations" ADD CONSTRAINT "sam_conversations_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sam_conversations" ADD CONSTRAINT "sam_conversations_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sam_conversations" ADD CONSTRAINT "sam_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sam_messages" ADD CONSTRAINT "sam_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."sam_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sam_interactions" ADD CONSTRAINT "sam_interactions_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "public"."Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sam_interactions" ADD CONSTRAINT "sam_interactions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sam_interactions" ADD CONSTRAINT "sam_interactions_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sam_interactions" ADD CONSTRAINT "sam_interactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sam_points" ADD CONSTRAINT "sam_points_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "public"."Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sam_points" ADD CONSTRAINT "sam_points_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sam_points" ADD CONSTRAINT "sam_points_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sam_points" ADD CONSTRAINT "sam_points_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sam_badges" ADD CONSTRAINT "sam_badges_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sam_badges" ADD CONSTRAINT "sam_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sam_streaks" ADD CONSTRAINT "sam_streaks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sam_learning_profiles" ADD CONSTRAINT "sam_learning_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentCognitiveProfile" ADD CONSTRAINT "StudentCognitiveProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EmotionalStateAnalysis" ADD CONSTRAINT "EmotionalStateAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MotivationProfile" ADD CONSTRAINT "MotivationProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PersonalizationResult" ADD CONSTRAINT "PersonalizationResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CognitiveFitnessAssessment" ADD CONSTRAINT "CognitiveFitnessAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."organization_users" ADD CONSTRAINT "organization_users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."organization_users" ADD CONSTRAINT "organization_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."compliance_events" ADD CONSTRAINT "compliance_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."security_events" ADD CONSTRAINT "security_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_consents" ADD CONSTRAINT "user_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."gdpr_requests" ADD CONSTRAINT "gdpr_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."enhanced_audit_logs" ADD CONSTRAINT "enhanced_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."instructor_verifications" ADD CONSTRAINT "instructor_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovalWorkflowTemplate" ADD CONSTRAINT "ApprovalWorkflowTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovalWorkflow" ADD CONSTRAINT "ApprovalWorkflow_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."ApprovalWorkflowTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovalWorkflow" ADD CONSTRAINT "ApprovalWorkflow_contentVersionId_fkey" FOREIGN KEY ("contentVersionId") REFERENCES "public"."content_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovalNotification" ADD CONSTRAINT "ApprovalNotification_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "public"."ApprovalWorkflow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovalNotification" ADD CONSTRAINT "ApprovalNotification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovalAuditLog" ADD CONSTRAINT "ApprovalAuditLog_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "public"."ApprovalWorkflow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ApprovalAuditLog" ADD CONSTRAINT "ApprovalAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BulkApprovalOperation" ADD CONSTRAINT "BulkApprovalOperation_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserContext" ADD CONSTRAINT "UserContext_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdminMetadata" ADD CONSTRAINT "AdminMetadata_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AdminSessionMetrics" ADD CONSTRAINT "AdminSessionMetrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Milestone" ADD CONSTRAINT "Milestone_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "public"."Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."intervention_actions" ADD CONSTRAINT "intervention_actions_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "public"."progress_alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseMarketAnalysis" ADD CONSTRAINT "CourseMarketAnalysis_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseCompetitor" ADD CONSTRAINT "CourseCompetitor_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBadge" ADD CONSTRAINT "UserBadge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "public"."Badge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBadge" ADD CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseGuideAnalysis" ADD CONSTRAINT "CourseGuideAnalysis_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseOptimizationSuggestion" ADD CONSTRAINT "CourseOptimizationSuggestion_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BadgeProgress" ADD CONSTRAINT "BadgeProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BadgeProgress" ADD CONSTRAINT "BadgeProgress_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "public"."BadgeDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserProgressAlert" ADD CONSTRAINT "UserProgressAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SkillProgress" ADD CONSTRAINT "SkillProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SkillProgress" ADD CONSTRAINT "SkillProgress_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "public"."Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SkillGap" ADD CONSTRAINT "SkillGap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SkillGap" ADD CONSTRAINT "SkillGap_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "public"."Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LearningEvent" ADD CONSTRAINT "LearningEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupEvent" ADD CONSTRAINT "GroupEvent_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupEvent" ADD CONSTRAINT "GroupEvent_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupEvent" ADD CONSTRAINT "GroupEvent_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupEventAttendee" ADD CONSTRAINT "GroupEventAttendee_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."GroupEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupEventAttendee" ADD CONSTRAINT "GroupEventAttendee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BadgeEvent" ADD CONSTRAINT "BadgeEvent_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "public"."BadgeDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BadgeEvent" ADD CONSTRAINT "BadgeEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CalendarEvent" ADD CONSTRAINT "CalendarEvent_parentEventId_fkey" FOREIGN KEY ("parentEventId") REFERENCES "public"."CalendarEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CalendarEvent" ADD CONSTRAINT "CalendarEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserCalendarSettings" ADD CONSTRAINT "UserCalendarSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Certification" ADD CONSTRAINT "Certification_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Certification" ADD CONSTRAINT "Certification_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."CertificateTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Certification" ADD CONSTRAINT "Certification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CertificateVerification" ADD CONSTRAINT "CertificateVerification_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "public"."UserBadge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CertificateVerification" ADD CONSTRAINT "CertificateVerification_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "public"."Certification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CertificateEvent" ADD CONSTRAINT "CertificateEvent_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "public"."Certification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CertificateEvent" ADD CONSTRAINT "CertificateEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_PostToTag" ADD CONSTRAINT "_PostToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_PostToTag" ADD CONSTRAINT "_PostToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_IdeaCollaborators" ADD CONSTRAINT "_IdeaCollaborators_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_IdeaCollaborators" ADD CONSTRAINT "_IdeaCollaborators_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_MindCollaborators" ADD CONSTRAINT "_MindCollaborators_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Mind"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_MindCollaborators" ADD CONSTRAINT "_MindCollaborators_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

