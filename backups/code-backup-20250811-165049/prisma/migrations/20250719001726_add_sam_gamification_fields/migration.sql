-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY', 'FILL_IN_BLANK', 'MATCHING', 'ORDERING');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('LOGIN', 'LOGOUT', 'COURSE_START', 'COURSE_COMPLETE', 'CHAPTER_START', 'CHAPTER_COMPLETE', 'SECTION_START', 'SECTION_COMPLETE', 'VIDEO_WATCH', 'VIDEO_PAUSE', 'VIDEO_RESUME', 'VIDEO_COMPLETE', 'QUIZ_START', 'QUIZ_SUBMIT', 'QUIZ_COMPLETE', 'EXAM_START', 'EXAM_SUBMIT', 'EXAM_COMPLETE', 'DISCUSSION_POST', 'DISCUSSION_REPLY', 'RESOURCE_DOWNLOAD', 'BOOKMARK_ADD', 'BOOKMARK_REMOVE', 'SEARCH', 'NAVIGATION', 'ERROR', 'FEEDBACK');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('VIDEO', 'AUDIO', 'ARTICLE', 'BLOG', 'PODCAST', 'COURSE', 'BOOK', 'DOCUMENT', 'IMAGE', 'CHAPTER', 'SECTION', 'EXAM', 'QUESTION', 'OTHER');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('VIEWED', 'ACCEPTED', 'REJECTED', 'DEFERRED');

-- CreateEnum
CREATE TYPE "AchievementType" AS ENUM ('FIRST_COURSE', 'COURSE_COMPLETION', 'CHAPTER_COMPLETION', 'PERFECT_QUIZ', 'STUDY_STREAK', 'TIME_MILESTONE', 'SKILL_MASTERY', 'PEER_HELPER', 'EARLY_BIRD', 'NIGHT_OWL', 'CONSISTENT_LEARNER', 'FAST_LEARNER', 'THOROUGH_LEARNER', 'QUESTION_MASTER', 'DISCUSSION_CONTRIBUTOR');

-- CreateEnum
CREATE TYPE "BadgeLevel" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND');

-- CreateEnum
CREATE TYPE "TrendDirection" AS ENUM ('IMPROVING', 'STABLE', 'DECLINING');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('STRUGGLING', 'AT_RISK', 'INACTIVE', 'MILESTONE', 'ENCOURAGEMENT');

-- CreateEnum
CREATE TYPE "AIContentType" AS ENUM ('COURSE_DESCRIPTION', 'COURSE_OBJECTIVES', 'COURSE_OUTLINE', 'CHAPTER_CONTENT', 'LESSON_PLAN', 'LESSON_CONTENT', 'EXAM_QUESTIONS', 'PRACTICE_EXERCISES', 'EXPLANATIONS', 'EXAMPLES', 'STUDY_GUIDE', 'ASSESSMENT', 'RUBRIC');

-- CreateEnum
CREATE TYPE "AIGenerationRequest" AS ENUM ('COURSE_PLANNING', 'CONTENT_CREATION', 'ASSESSMENT_DESIGN', 'EXERCISE_GENERATION', 'EXPLANATION_CREATION', 'CURRICULUM_DESIGN');

-- CreateEnum
CREATE TYPE "AITemplateType" AS ENUM ('COURSE_OUTLINE', 'LESSON_PLAN', 'EXAM_QUESTIONS', 'PRACTICE_EXERCISES', 'EXPLANATIONS', 'EXAMPLES', 'ASSESSMENTS', 'CURRICULUM');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AnalyticsType" AS ENUM ('CONTENT_CONSUMED', 'TIME_SPENT', 'COURSE_PROGRESS', 'SOCIAL_ENGAGEMENT', 'SUBSCRIPTION_SPENDING', 'GOAL_PROGRESS', 'PRODUCTIVITY_SCORE');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'GRADED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BillCategory" AS ENUM ('UTILITY', 'INTERNET', 'INSURANCE', 'RENT', 'MORTGAGE', 'SUBSCRIPTION', 'TAX', 'CREDIT_CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('PAID', 'UNPAID', 'OVERDUE', 'UPCOMING', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'LIFETIME');

-- CreateEnum
CREATE TYPE "BloomsLevel" AS ENUM ('REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE');

-- CreateEnum
CREATE TYPE "EngagementTrend" AS ENUM ('IMPROVING', 'STABLE', 'DECLINING');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "ExamAnalyticsType" AS ENUM ('QUESTION_TIME', 'DIFFICULTY_SCORE', 'CONFIDENCE_LEVEL', 'REVIEW_COUNT', 'HINT_USAGE');

-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GenerationType" AS ENUM ('MANUAL', 'AI_GENERATED', 'HYBRID');

-- CreateEnum
CREATE TYPE "GoalCategory" AS ENUM ('LEARNING', 'CONTENT_CREATION', 'SOCIAL_GROWTH', 'FINANCIAL', 'PRODUCTIVITY', 'HEALTH', 'CAREER', 'PERSONAL');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MetricType" AS ENUM ('FOLLOWERS', 'FOLLOWING', 'POSTS', 'LIKES', 'COMMENTS', 'SHARES', 'VIEWS', 'ENGAGEMENT_RATE', 'REACH', 'IMPRESSIONS');

-- CreateEnum
CREATE TYPE "MetricsPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "NodeStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "PathContentType" AS ENUM ('COURSE', 'CHAPTER', 'SKILL', 'ASSESSMENT', 'PROJECT');

-- CreateEnum
CREATE TYPE "PathDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'CAROUSEL', 'STORY', 'REEL', 'SHORT', 'LIVE');

-- CreateEnum
CREATE TYPE "QuestionDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('PERFORMANCE_BASED', 'SKILL_GAP', 'INTEREST_BASED', 'POPULAR', 'SEQUENTIAL', 'REMEDIAL');

-- CreateEnum
CREATE TYPE "RecurringType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED', 'STRUGGLING');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('YOUTUBE', 'INSTAGRAM', 'TWITTER', 'FACEBOOK', 'LINKEDIN', 'TIKTOK', 'TWITCH', 'DISCORD', 'REDDIT', 'MEDIUM', 'GITHUB', 'DRIBBBLE', 'BEHANCE');

-- CreateEnum
CREATE TYPE "SubscriptionCategory" AS ENUM ('STREAMING', 'EDUCATION', 'PRODUCTIVITY', 'DESIGN', 'DEVELOPMENT', 'FITNESS', 'MUSIC', 'NEWS', 'GAMING', 'SOCIAL', 'STORAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PAYMENT', 'REFUND', 'CHARGEBACK', 'CREDIT');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "EnterpriseMetricType" AS ENUM ('USER_ENGAGEMENT', 'CONTENT_PERFORMANCE', 'AI_USAGE', 'SYSTEM_PERFORMANCE', 'REVENUE', 'COMPLIANCE', 'SECURITY', 'COLLABORATION');

-- CreateEnum
CREATE TYPE "AggregationPeriod" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "ComplianceEventType" AS ENUM ('DATA_ACCESS', 'DATA_EXPORT', 'DATA_DELETION', 'POLICY_VIOLATION', 'SECURITY_INCIDENT', 'AUDIT_REQUIREMENT');

-- CreateEnum
CREATE TYPE "ComplianceFramework" AS ENUM ('GDPR', 'CCPA', 'FERPA', 'HIPAA', 'SOX', 'COPPA', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('COMPLIANT', 'NON_COMPLIANT', 'UNDER_REVIEW', 'PENDING_ACTION', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ComplianceSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT', 'PUBLISH', 'UNPUBLISH');

-- CreateEnum
CREATE TYPE "AuditSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AIPerformanceCategory" AS ENUM ('ACCURACY', 'RESPONSE_TIME', 'RESOURCE_USAGE', 'USER_SATISFACTION', 'LEARNING_EFFECTIVENESS');

-- CreateEnum
CREATE TYPE "SecurityEventType" AS ENUM ('UNAUTHORIZED_ACCESS', 'SUSPICIOUS_ACTIVITY', 'DATA_BREACH', 'POLICY_VIOLATION', 'SYSTEM_INTRUSION', 'MALWARE_DETECTION', 'AUTHENTICATION_FAILURE');

-- CreateEnum
CREATE TYPE "SecuritySeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SecurityStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "SAMTutorMode" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "SAMMessageType" AS ENUM ('USER', 'SAM', 'SYSTEM', 'ACTION');

-- CreateEnum
CREATE TYPE "SAMEmotion" AS ENUM ('ENCOURAGING', 'SUPPORTIVE', 'EXCITED', 'THOUGHTFUL', 'CELEBRATORY', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "SAMInteractionType" AS ENUM ('FORM_POPULATE', 'FORM_SUBMIT', 'FORM_VALIDATE', 'CONTENT_GENERATE', 'NAVIGATION', 'CHAT_MESSAGE', 'QUICK_ACTION', 'ANALYTICS_VIEW', 'GAMIFICATION_ACTION', 'LEARNING_ASSISTANCE');

-- CreateEnum
CREATE TYPE "SAMPointsCategory" AS ENUM ('FORM_INTERACTION', 'CONTENT_CREATION', 'CHAT_ENGAGEMENT', 'ACHIEVEMENT_UNLOCK', 'DAILY_ACTIVITY', 'LEARNING_PROGRESS', 'TEACHING_ACTIVITY', 'COLLABORATION');

-- CreateEnum
CREATE TYPE "SAMBadgeType" AS ENUM ('FIRST_INTERACTION', 'FORM_MASTER', 'CONTENT_CREATOR', 'CHAT_EXPERT', 'STREAK_KEEPER', 'LEARNING_CHAMPION', 'TEACHING_MENTOR', 'ANALYTICS_EXPLORER', 'PRODUCTIVITY_HERO');

-- CreateEnum
CREATE TYPE "SAMStreakType" AS ENUM ('DAILY_INTERACTION', 'WEEKLY_ENGAGEMENT', 'FORM_COMPLETION', 'CONTENT_CREATION', 'CHAT_ACTIVITY');

-- CreateEnum
CREATE TYPE "SAMLearningStyle" AS ENUM ('VISUAL', 'AUDITORY', 'KINESTHETIC', 'READING_WRITING', 'MIXED');

-- CreateEnum
CREATE TYPE "SAMTone" AS ENUM ('ENCOURAGING', 'PROFESSIONAL', 'FRIENDLY', 'CHALLENGING', 'SUPPORTIVE');

-- CreateEnum
CREATE TYPE "SAMTeachingMethod" AS ENUM ('SOCRATIC', 'DIRECT', 'SCAFFOLDING', 'DISCOVERY', 'ADAPTIVE');

-- CreateEnum
CREATE TYPE "SAMResponseStyle" AS ENUM ('DETAILED', 'CONCISE', 'VISUAL', 'EXAMPLE_HEAVY', 'STEP_BY_STEP');

-- CreateEnum
CREATE TYPE "SAMMetricType" AS ENUM ('INTERACTION_COUNT', 'FORM_SUCCESS_RATE', 'CONTENT_GENERATION_COUNT', 'CHAT_ENGAGEMENT_TIME', 'POINTS_EARNED', 'BADGES_UNLOCKED', 'STREAK_LENGTH', 'LEARNING_VELOCITY', 'TEACHING_EFFECTIVENESS');

-- CreateEnum
CREATE TYPE "AnalyticsPeriod" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "confirmPassword" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isTwoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "samTotalPoints" INTEGER NOT NULL DEFAULT 0,
    "samLevel" INTEGER NOT NULL DEFAULT 1,
    "samActiveChallenges" JSONB,
    "samCompletedChallenges" JSONB,
    "samChallengeStartDate" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
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
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwoFactorToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TwoFactorToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TwoFactorConfirmation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "TwoFactorConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
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
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chapter" (
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
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
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
CREATE TABLE "Video" (
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
CREATE TABLE "Blog" (
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
CREATE TABLE "Article" (
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
CREATE TABLE "Note" (
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
CREATE TABLE "CodeExplanation" (
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
CREATE TABLE "MathExplanation" (
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
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeCustomer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
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
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reply" (
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
CREATE TABLE "Reaction" (
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
CREATE TABLE "ProfileLink" (
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
CREATE TABLE "Exam" (
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
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sectionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseReview" (
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
CREATE TABLE "Group" (
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
CREATE TABLE "AIContentGeneration" (
    "id" TEXT NOT NULL,
    "requestType" "AIGenerationRequest" NOT NULL,
    "status" "GenerationStatus" NOT NULL DEFAULT 'PENDING',
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
CREATE TABLE "AIContentTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "templateType" "AITemplateType" NOT NULL,
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
CREATE TABLE "AIGeneratedContent" (
    "id" TEXT NOT NULL,
    "contentType" "AIContentType" NOT NULL,
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
CREATE TABLE "AIUsageMetrics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "period" "MetricsPeriod" NOT NULL DEFAULT 'DAILY',
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
CREATE TABLE "ActiveSession" (
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
CREATE TABLE "Activity" (
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
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "questionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthAudit" (
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
CREATE TABLE "BackupCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BackupCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "BillCategory" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "startDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "BillStatus" NOT NULL DEFAULT 'UNPAID',
    "recurringType" "RecurringType",
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
CREATE TABLE "BillAttachment" (
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
CREATE TABLE "BillPayment" (
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
CREATE TABLE "CalendarEvent" (
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
CREATE TABLE "ContentCollection" (
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
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "platform" TEXT,
    "contentType" "ContentType" NOT NULL,
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
CREATE TABLE "CustomTab" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CustomTab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamAnalytics" (
    "id" TEXT NOT NULL,
    "analyticsType" "ExamAnalyticsType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "attemptId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamQuestion" (
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
    "questionType" "QuestionType" NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    "bloomsLevel" "BloomsLevel",
    "difficulty" "QuestionDifficulty" NOT NULL DEFAULT 'MEDIUM',

    CONSTRAINT "ExamQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteArticle" (
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
CREATE TABLE "FavoriteAudio" (
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
CREATE TABLE "FavoriteBlog" (
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
CREATE TABLE "FavoriteImage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imageUrl" TEXT NOT NULL,

    CONSTRAINT "FavoriteImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteVideo" (
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
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "GoalCategory" NOT NULL,
    "targetValue" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION DEFAULT 0,
    "unit" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupDiscussion" (
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
CREATE TABLE "GroupDiscussionComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupDiscussionComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupDiscussionLike" (
    "id" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupDiscussionLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupEvent" (
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
CREATE TABLE "GroupEventAttendee" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'attending',
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupEventAttendee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupNotification" (
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
CREATE TABLE "GroupResource" (
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
CREATE TABLE "Idea" (
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
CREATE TABLE "IdeaComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdeaComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdeaLike" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdeaLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPath" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "difficulty" "PathDifficulty" NOT NULL DEFAULT 'BEGINNER',
    "estimatedDuration" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "generationType" "GenerationType" NOT NULL DEFAULT 'MANUAL',
    "creatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPathNode" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "contentType" "PathContentType" NOT NULL,
    "contentId" TEXT,
    "prerequisites" TEXT[],
    "pathId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningPathNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Milestone" (
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
CREATE TABLE "Mind" (
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
CREATE TABLE "MindLike" (
    "id" TEXT NOT NULL,
    "mindId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MindLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NodeProgress" (
    "id" TEXT NOT NULL,
    "status" "NodeStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "enrollmentId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NodeProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
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
CREATE TABLE "PathEnrollment" (
    "id" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
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
CREATE TABLE "PathRecommendation" (
    "id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "basedOn" "RecommendationType" NOT NULL,
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
CREATE TABLE "PostChapterSection" (
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
CREATE TABLE "PostImageSection" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostImageSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationInteraction" (
    "id" TEXT NOT NULL,
    "action" "InteractionType" NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialMediaAccount" (
    "id" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
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
CREATE TABLE "SocialMetric" (
    "id" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "metricType" "MetricType" NOT NULL,
    "value" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "socialMediaAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "platformPostId" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "content" TEXT,
    "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "postUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "likesCount" INTEGER DEFAULT 0,
    "commentsCount" INTEGER DEFAULT 0,
    "sharesCount" INTEGER DEFAULT 0,
    "viewsCount" INTEGER DEFAULT 0,
    "postType" "PostType",
    "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mentions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "socialMediaAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripe_current_period_end" TIMESTAMP(3),
    "stripe_customer_id" TEXT,
    "stripe_price_id" TEXT,
    "stripe_subscription_id" TEXT,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionService" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "SubscriptionCategory" NOT NULL,
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionTransaction" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "transactionType" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "subscriptionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
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
CREATE TABLE "TOTPSecret" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TOTPSecret_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedDate" TIMESTAMP(3),
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAIPreferences" (
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
CREATE TABLE "UserAnalytics" (
    "id" TEXT NOT NULL,
    "analyticsType" "AnalyticsType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAnswer" (
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
CREATE TABLE "UserCalendarSettings" (
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
CREATE TABLE "UserExamAttempt" (
    "id" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
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
CREATE TABLE "UserSubscription" (
    "id" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "planName" TEXT,
    "cost" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billingCycle" "BillingCycle" NOT NULL,
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
CREATE TABLE "intervention_actions" (
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
CREATE TABLE "learning_metrics" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "courseId" TEXT,
    "overallProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "learningVelocity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "engagementTrend" "EngagementTrend" NOT NULL DEFAULT 'STABLE',
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
CREATE TABLE "learning_sessions" (
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
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_metrics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "period" "MetricsPeriod" NOT NULL DEFAULT 'DAILY',
    "learningVelocity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "retentionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "engagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quizPerformance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalLearningTime" INTEGER NOT NULL DEFAULT 0,
    "activeTime" INTEGER NOT NULL DEFAULT 0,
    "sessionsCount" INTEGER NOT NULL DEFAULT 0,
    "averageSessionLength" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "velocityTrend" "TrendDirection" NOT NULL DEFAULT 'STABLE',
    "engagementTrend" "TrendDirection" NOT NULL DEFAULT 'STABLE',
    "performanceTrend" "TrendDirection" NOT NULL DEFAULT 'STABLE',
    "peerComparisonScore" DOUBLE PRECISION,
    "improvementRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_alerts" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "courseId" TEXT,
    "chapterId" TEXT,
    "alertType" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
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
CREATE TABLE "realtime_activities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
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
CREATE TABLE "study_streaks" (
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
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementType" "AchievementType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconUrl" TEXT,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "badgeLevel" "BadgeLevel" NOT NULL DEFAULT 'BRONZE',
    "courseId" TEXT,
    "metadata" JSONB,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_progress" (
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
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "slug" TEXT NOT NULL,
    "brandingConfig" JSONB,
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
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
CREATE TABLE "organization_users" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "OrganizationRole" NOT NULL DEFAULT 'MEMBER',
    "permissions" JSONB,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "organization_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enterprise_analytics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "metricType" "EnterpriseMetricType" NOT NULL,
    "metricCategory" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "dimensions" JSONB,
    "aggregationPeriod" "AggregationPeriod" NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enterprise_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "eventType" "ComplianceEventType" NOT NULL,
    "complianceFramework" "ComplianceFramework" NOT NULL,
    "status" "ComplianceStatus" NOT NULL,
    "severity" "ComplianceSeverity" NOT NULL DEFAULT 'LOW',
    "details" JSONB NOT NULL,
    "affectedUsers" JSONB,
    "affectedContent" JSONB,
    "actionTaken" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_versions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "contentId" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
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
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityName" TEXT,
    "changes" JSONB,
    "context" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "severity" "AuditSeverity" NOT NULL DEFAULT 'INFO',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collaboration_sessions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "sessionId" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "participants" JSONB NOT NULL,
    "activeParticipants" JSONB NOT NULL,
    "sessionData" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "collaboration_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_model_performance" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "modelName" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "metricValue" DOUBLE PRECISION NOT NULL,
    "benchmarkValue" DOUBLE PRECISION,
    "performanceCategory" "AIPerformanceCategory" NOT NULL,
    "evaluationData" JSONB,
    "testCases" JSONB,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_model_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "eventType" "SecurityEventType" NOT NULL,
    "severity" "SecuritySeverity" NOT NULL DEFAULT 'LOW',
    "source" TEXT,
    "description" TEXT NOT NULL,
    "details" JSONB,
    "affectedUsers" JSONB,
    "mitigationActions" JSONB,
    "status" "SecurityStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sam_conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "courseId" TEXT,
    "chapterId" TEXT,
    "sectionId" TEXT,
    "context" JSONB,
    "tutorMode" "SAMTutorMode" NOT NULL DEFAULT 'TEACHER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "totalMessages" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sam_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sam_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "messageType" "SAMMessageType" NOT NULL,
    "content" TEXT NOT NULL,
    "emotion" "SAMEmotion",
    "context" JSONB,
    "suggestions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "actions" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sam_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sam_interactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "interactionType" "SAMInteractionType" NOT NULL,
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
CREATE TABLE "sam_points" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "category" "SAMPointsCategory" NOT NULL,
    "context" JSONB,
    "courseId" TEXT,
    "chapterId" TEXT,
    "sectionId" TEXT,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sam_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sam_badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeType" "SAMBadgeType" NOT NULL,
    "badgeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconUrl" TEXT,
    "level" "BadgeLevel" NOT NULL DEFAULT 'BRONZE',
    "pointsRequired" INTEGER NOT NULL DEFAULT 0,
    "context" JSONB,
    "courseId" TEXT,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sam_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sam_streaks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActivityDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "streakType" "SAMStreakType" NOT NULL DEFAULT 'DAILY_INTERACTION',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sam_streaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sam_learning_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "learningStyle" "SAMLearningStyle" NOT NULL DEFAULT 'MIXED',
    "preferredTone" "SAMTone" NOT NULL DEFAULT 'ENCOURAGING',
    "teachingMethod" "SAMTeachingMethod" NOT NULL DEFAULT 'SOCRATIC',
    "responseStyle" "SAMResponseStyle" NOT NULL DEFAULT 'DETAILED',
    "adaptationHistory" JSONB[] DEFAULT ARRAY[]::JSONB[],
    "preferences" JSONB,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sam_learning_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sam_analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metricType" "SAMMetricType" NOT NULL,
    "metricValue" DOUBLE PRECISION NOT NULL,
    "period" "AnalyticsPeriod" NOT NULL DEFAULT 'DAILY',
    "context" JSONB,
    "courseId" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sam_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PostToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PostToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_IdeaCollaborators" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_IdeaCollaborators_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_MindCollaborators" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MindCollaborators_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_email_token_key" ON "VerificationToken"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_email_token_key" ON "PasswordResetToken"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "TwoFactorToken_token_key" ON "TwoFactorToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "TwoFactorToken_email_token_key" ON "TwoFactorToken"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "TwoFactorConfirmation_userId_key" ON "TwoFactorConfirmation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Course_categoryId_idx" ON "Course"("categoryId");

-- CreateIndex
CREATE INDEX "Course_organizationId_idx" ON "Course"("organizationId");

-- CreateIndex
CREATE INDEX "Attachment_courseId_idx" ON "Attachment"("courseId");

-- CreateIndex
CREATE INDEX "Chapter_courseId_idx" ON "Chapter"("courseId");

-- CreateIndex
CREATE INDEX "Section_chapterId_idx" ON "Section"("chapterId");

-- CreateIndex
CREATE INDEX "Video_sectionId_idx" ON "Video"("sectionId");

-- CreateIndex
CREATE INDEX "Video_userId_idx" ON "Video"("userId");

-- CreateIndex
CREATE INDEX "CodeExplanation_sectionId_idx" ON "CodeExplanation"("sectionId");

-- CreateIndex
CREATE INDEX "MathExplanation_sectionId_idx" ON "MathExplanation"("sectionId");

-- CreateIndex
CREATE INDEX "Purchase_courseId_idx" ON "Purchase"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_userId_courseId_key" ON "Purchase"("userId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeCustomer_userId_key" ON "StripeCustomer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeCustomer_stripeCustomerId_key" ON "StripeCustomer"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Post_userId_idx" ON "Post"("userId");

-- CreateIndex
CREATE INDEX "Comment_postId_idx" ON "Comment"("postId");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");

-- CreateIndex
CREATE INDEX "Reply_commentId_idx" ON "Reply"("commentId");

-- CreateIndex
CREATE INDEX "Reply_parentReplyId_idx" ON "Reply"("parentReplyId");

-- CreateIndex
CREATE INDEX "Reply_path_idx" ON "Reply"("path");

-- CreateIndex
CREATE INDEX "Reply_postId_idx" ON "Reply"("postId");

-- CreateIndex
CREATE INDEX "Reply_userId_idx" ON "Reply"("userId");

-- CreateIndex
CREATE INDEX "Reaction_commentId_idx" ON "Reaction"("commentId");

-- CreateIndex
CREATE INDEX "Reaction_replyId_idx" ON "Reaction"("replyId");

-- CreateIndex
CREATE INDEX "Reaction_userId_idx" ON "Reaction"("userId");

-- CreateIndex
CREATE INDEX "Exam_sectionId_idx" ON "Exam"("sectionId");

-- CreateIndex
CREATE INDEX "Exam_isPublished_isActive_idx" ON "Exam"("isPublished", "isActive");

-- CreateIndex
CREATE INDEX "CourseReview_courseId_idx" ON "CourseReview"("courseId");

-- CreateIndex
CREATE INDEX "CourseReview_userId_idx" ON "CourseReview"("userId");

-- CreateIndex
CREATE INDEX "Group_categoryId_idx" ON "Group"("categoryId");

-- CreateIndex
CREATE INDEX "Group_courseId_idx" ON "Group"("courseId");

-- CreateIndex
CREATE INDEX "Group_creatorId_idx" ON "Group"("creatorId");

-- CreateIndex
CREATE INDEX "AIContentGeneration_requestType_idx" ON "AIContentGeneration"("requestType");

-- CreateIndex
CREATE INDEX "AIContentGeneration_status_idx" ON "AIContentGeneration"("status");

-- CreateIndex
CREATE INDEX "AIContentGeneration_userId_idx" ON "AIContentGeneration"("userId");

-- CreateIndex
CREATE INDEX "AIContentTemplate_creatorId_idx" ON "AIContentTemplate"("creatorId");

-- CreateIndex
CREATE INDEX "AIContentTemplate_templateType_idx" ON "AIContentTemplate"("templateType");

-- CreateIndex
CREATE INDEX "AIGeneratedContent_chapterId_idx" ON "AIGeneratedContent"("chapterId");

-- CreateIndex
CREATE INDEX "AIGeneratedContent_contentType_idx" ON "AIGeneratedContent"("contentType");

-- CreateIndex
CREATE INDEX "AIGeneratedContent_courseId_idx" ON "AIGeneratedContent"("courseId");

-- CreateIndex
CREATE INDEX "AIGeneratedContent_creatorId_idx" ON "AIGeneratedContent"("creatorId");

-- CreateIndex
CREATE INDEX "AIGeneratedContent_sectionId_idx" ON "AIGeneratedContent"("sectionId");

-- CreateIndex
CREATE INDEX "AIUsageMetrics_date_idx" ON "AIUsageMetrics"("date");

-- CreateIndex
CREATE INDEX "AIUsageMetrics_userId_idx" ON "AIUsageMetrics"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AIUsageMetrics_userId_date_period_key" ON "AIUsageMetrics"("userId", "date", "period");

-- CreateIndex
CREATE UNIQUE INDEX "ActiveSession_sessionToken_key" ON "ActiveSession"("sessionToken");

-- CreateIndex
CREATE INDEX "ActiveSession_expiresAt_idx" ON "ActiveSession"("expiresAt");

-- CreateIndex
CREATE INDEX "ActiveSession_sessionToken_idx" ON "ActiveSession"("sessionToken");

-- CreateIndex
CREATE INDEX "ActiveSession_userId_idx" ON "ActiveSession"("userId");

-- CreateIndex
CREATE INDEX "Activity_dueDate_idx" ON "Activity"("dueDate");

-- CreateIndex
CREATE INDEX "Activity_status_idx" ON "Activity"("status");

-- CreateIndex
CREATE INDEX "Activity_type_idx" ON "Activity"("type");

-- CreateIndex
CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");

-- CreateIndex
CREATE INDEX "AuthAudit_action_idx" ON "AuthAudit"("action");

-- CreateIndex
CREATE INDEX "AuthAudit_createdAt_idx" ON "AuthAudit"("createdAt");

-- CreateIndex
CREATE INDEX "AuthAudit_ipAddress_idx" ON "AuthAudit"("ipAddress");

-- CreateIndex
CREATE INDEX "AuthAudit_userId_idx" ON "AuthAudit"("userId");

-- CreateIndex
CREATE INDEX "BackupCode_userId_idx" ON "BackupCode"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BackupCode_userId_code_key" ON "BackupCode"("userId", "code");

-- CreateIndex
CREATE INDEX "Bill_dueDate_idx" ON "Bill"("dueDate");

-- CreateIndex
CREATE INDEX "Bill_userId_idx" ON "Bill"("userId");

-- CreateIndex
CREATE INDEX "BillAttachment_billId_idx" ON "BillAttachment"("billId");

-- CreateIndex
CREATE INDEX "BillPayment_billId_idx" ON "BillPayment"("billId");

-- CreateIndex
CREATE INDEX "CalendarEvent_parentEventId_idx" ON "CalendarEvent"("parentEventId");

-- CreateIndex
CREATE INDEX "CalendarEvent_startDate_idx" ON "CalendarEvent"("startDate");

-- CreateIndex
CREATE INDEX "CalendarEvent_userId_idx" ON "CalendarEvent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_externalId_source_key" ON "CalendarEvent"("externalId", "source");

-- CreateIndex
CREATE INDEX "ContentCollection_userId_idx" ON "ContentCollection"("userId");

-- CreateIndex
CREATE INDEX "ContentItem_collectionId_idx" ON "ContentItem"("collectionId");

-- CreateIndex
CREATE INDEX "ContentItem_userId_contentType_idx" ON "ContentItem"("userId", "contentType");

-- CreateIndex
CREATE INDEX "CustomTab_userId_idx" ON "CustomTab"("userId");

-- CreateIndex
CREATE INDEX "Enrollment_courseId_idx" ON "Enrollment"("courseId");

-- CreateIndex
CREATE INDEX "Enrollment_userId_idx" ON "Enrollment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_userId_courseId_key" ON "Enrollment"("userId", "courseId");

-- CreateIndex
CREATE INDEX "ExamAnalytics_attemptId_analyticsType_idx" ON "ExamAnalytics"("attemptId", "analyticsType");

-- CreateIndex
CREATE INDEX "ExamQuestion_examId_order_idx" ON "ExamQuestion"("examId", "order");

-- CreateIndex
CREATE INDEX "FavoriteImage_userId_idx" ON "FavoriteImage"("userId");

-- CreateIndex
CREATE INDEX "Goal_userId_status_idx" ON "Goal"("userId", "status");

-- CreateIndex
CREATE INDEX "GroupDiscussion_authorId_idx" ON "GroupDiscussion"("authorId");

-- CreateIndex
CREATE INDEX "GroupDiscussion_groupId_idx" ON "GroupDiscussion"("groupId");

-- CreateIndex
CREATE INDEX "GroupDiscussionComment_authorId_idx" ON "GroupDiscussionComment"("authorId");

-- CreateIndex
CREATE INDEX "GroupDiscussionComment_discussionId_idx" ON "GroupDiscussionComment"("discussionId");

-- CreateIndex
CREATE INDEX "GroupDiscussionLike_discussionId_idx" ON "GroupDiscussionLike"("discussionId");

-- CreateIndex
CREATE INDEX "GroupDiscussionLike_userId_idx" ON "GroupDiscussionLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupDiscussionLike_discussionId_userId_key" ON "GroupDiscussionLike"("discussionId", "userId");

-- CreateIndex
CREATE INDEX "GroupEvent_creatorId_idx" ON "GroupEvent"("creatorId");

-- CreateIndex
CREATE INDEX "GroupEvent_groupId_idx" ON "GroupEvent"("groupId");

-- CreateIndex
CREATE INDEX "GroupEvent_organizerId_idx" ON "GroupEvent"("organizerId");

-- CreateIndex
CREATE INDEX "GroupEventAttendee_eventId_idx" ON "GroupEventAttendee"("eventId");

-- CreateIndex
CREATE INDEX "GroupEventAttendee_userId_idx" ON "GroupEventAttendee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupEventAttendee_eventId_userId_key" ON "GroupEventAttendee"("eventId", "userId");

-- CreateIndex
CREATE INDEX "GroupMember_groupId_idx" ON "GroupMember"("groupId");

-- CreateIndex
CREATE INDEX "GroupMember_userId_idx" ON "GroupMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_userId_groupId_key" ON "GroupMember"("userId", "groupId");

-- CreateIndex
CREATE INDEX "GroupNotification_groupId_idx" ON "GroupNotification"("groupId");

-- CreateIndex
CREATE INDEX "GroupNotification_userId_idx" ON "GroupNotification"("userId");

-- CreateIndex
CREATE INDEX "GroupResource_authorId_idx" ON "GroupResource"("authorId");

-- CreateIndex
CREATE INDEX "GroupResource_groupId_idx" ON "GroupResource"("groupId");

-- CreateIndex
CREATE INDEX "Idea_userId_idx" ON "Idea"("userId");

-- CreateIndex
CREATE INDEX "IdeaComment_ideaId_idx" ON "IdeaComment"("ideaId");

-- CreateIndex
CREATE INDEX "IdeaComment_userId_idx" ON "IdeaComment"("userId");

-- CreateIndex
CREATE INDEX "IdeaLike_ideaId_idx" ON "IdeaLike"("ideaId");

-- CreateIndex
CREATE INDEX "IdeaLike_userId_idx" ON "IdeaLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "IdeaLike_ideaId_userId_key" ON "IdeaLike"("ideaId", "userId");

-- CreateIndex
CREATE INDEX "LearningPath_creatorId_idx" ON "LearningPath"("creatorId");

-- CreateIndex
CREATE INDEX "LearningPathNode_pathId_idx" ON "LearningPathNode"("pathId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPathNode_pathId_order_key" ON "LearningPathNode"("pathId", "order");

-- CreateIndex
CREATE INDEX "LoginAttempt_createdAt_idx" ON "LoginAttempt"("createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_email_ipAddress_idx" ON "LoginAttempt"("email", "ipAddress");

-- CreateIndex
CREATE INDEX "LoginAttempt_ipAddress_idx" ON "LoginAttempt"("ipAddress");

-- CreateIndex
CREATE INDEX "Message_recipientId_idx" ON "Message"("recipientId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Milestone_goalId_idx" ON "Milestone"("goalId");

-- CreateIndex
CREATE INDEX "Mind_userId_idx" ON "Mind"("userId");

-- CreateIndex
CREATE INDEX "MindLike_mindId_idx" ON "MindLike"("mindId");

-- CreateIndex
CREATE INDEX "MindLike_userId_idx" ON "MindLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MindLike_mindId_userId_key" ON "MindLike"("mindId", "userId");

-- CreateIndex
CREATE INDEX "NodeProgress_enrollmentId_idx" ON "NodeProgress"("enrollmentId");

-- CreateIndex
CREATE INDEX "NodeProgress_nodeId_idx" ON "NodeProgress"("nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "NodeProgress_enrollmentId_nodeId_key" ON "NodeProgress"("enrollmentId", "nodeId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "PathEnrollment_pathId_idx" ON "PathEnrollment"("pathId");

-- CreateIndex
CREATE INDEX "PathEnrollment_userId_idx" ON "PathEnrollment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PathEnrollment_userId_pathId_key" ON "PathEnrollment"("userId", "pathId");

-- CreateIndex
CREATE INDEX "PathRecommendation_pathId_idx" ON "PathRecommendation"("pathId");

-- CreateIndex
CREATE INDEX "PathRecommendation_userId_isActive_idx" ON "PathRecommendation"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PathRecommendation_userId_pathId_key" ON "PathRecommendation"("userId", "pathId");

-- CreateIndex
CREATE INDEX "PostChapterSection_postId_idx" ON "PostChapterSection"("postId");

-- CreateIndex
CREATE INDEX "PostImageSection_postId_idx" ON "PostImageSection"("postId");

-- CreateIndex
CREATE INDEX "RecommendationInteraction_recommendationId_idx" ON "RecommendationInteraction"("recommendationId");

-- CreateIndex
CREATE INDEX "SocialMediaAccount_userId_platform_idx" ON "SocialMediaAccount"("userId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "SocialMediaAccount_userId_platform_platformUserId_key" ON "SocialMediaAccount"("userId", "platform", "platformUserId");

-- CreateIndex
CREATE INDEX "SocialMetric_socialMediaAccountId_recordedAt_idx" ON "SocialMetric"("socialMediaAccountId", "recordedAt");

-- CreateIndex
CREATE INDEX "SocialPost_socialMediaAccountId_publishedAt_idx" ON "SocialPost"("socialMediaAccountId", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SocialPost_platformPostId_socialMediaAccountId_key" ON "SocialPost"("platformPostId", "socialMediaAccountId");

-- CreateIndex
CREATE INDEX "Subscription_stripe_customer_id_idx" ON "Subscription"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "Subscription_stripe_subscription_id_idx" ON "Subscription"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "SubscriptionTransaction_subscriptionId_transactionDate_idx" ON "SubscriptionTransaction"("subscriptionId", "transactionDate");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_idx" ON "SupportTicket"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TOTPSecret_userId_key" ON "TOTPSecret"("userId");

-- CreateIndex
CREATE INDEX "TOTPSecret_userId_idx" ON "TOTPSecret"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserAIPreferences_userId_key" ON "UserAIPreferences"("userId");

-- CreateIndex
CREATE INDEX "UserAnalytics_userId_analyticsType_recordedAt_idx" ON "UserAnalytics"("userId", "analyticsType", "recordedAt");

-- CreateIndex
CREATE INDEX "UserAnswer_attemptId_idx" ON "UserAnswer"("attemptId");

-- CreateIndex
CREATE INDEX "UserAnswer_questionId_idx" ON "UserAnswer"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAnswer_attemptId_questionId_key" ON "UserAnswer"("attemptId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCalendarSettings_userId_key" ON "UserCalendarSettings"("userId");

-- CreateIndex
CREATE INDEX "UserCalendarSettings_userId_idx" ON "UserCalendarSettings"("userId");

-- CreateIndex
CREATE INDEX "UserExamAttempt_status_idx" ON "UserExamAttempt"("status");

-- CreateIndex
CREATE INDEX "UserExamAttempt_userId_examId_idx" ON "UserExamAttempt"("userId", "examId");

-- CreateIndex
CREATE UNIQUE INDEX "UserExamAttempt_userId_examId_attemptNumber_key" ON "UserExamAttempt"("userId", "examId", "attemptNumber");

-- CreateIndex
CREATE INDEX "UserSubscription_userId_isActive_idx" ON "UserSubscription"("userId", "isActive");

-- CreateIndex
CREATE INDEX "performance_metrics_date_idx" ON "performance_metrics"("date");

-- CreateIndex
CREATE INDEX "performance_metrics_userId_idx" ON "performance_metrics"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "performance_metrics_userId_date_period_key" ON "performance_metrics"("userId", "date", "period");

-- CreateIndex
CREATE INDEX "realtime_activities_activityType_timestamp_idx" ON "realtime_activities"("activityType", "timestamp");

-- CreateIndex
CREATE INDEX "realtime_activities_courseId_timestamp_idx" ON "realtime_activities"("courseId", "timestamp");

-- CreateIndex
CREATE INDEX "realtime_activities_sessionId_idx" ON "realtime_activities"("sessionId");

-- CreateIndex
CREATE INDEX "realtime_activities_userId_timestamp_idx" ON "realtime_activities"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "user_achievements_achievementType_idx" ON "user_achievements"("achievementType");

-- CreateIndex
CREATE INDEX "user_achievements_userId_idx" ON "user_achievements"("userId");

-- CreateIndex
CREATE INDEX "user_progress_courseId_idx" ON "user_progress"("courseId");

-- CreateIndex
CREATE INDEX "user_progress_isCompleted_idx" ON "user_progress"("isCompleted");

-- CreateIndex
CREATE INDEX "user_progress_userId_idx" ON "user_progress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_progress_userId_courseId_chapterId_sectionId_key" ON "user_progress"("userId", "courseId", "chapterId", "sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_domain_key" ON "organizations"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organization_users_organizationId_userId_key" ON "organization_users"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "enterprise_analytics_organizationId_metricType_recordedAt_idx" ON "enterprise_analytics"("organizationId", "metricType", "recordedAt");

-- CreateIndex
CREATE INDEX "enterprise_analytics_metricType_aggregationPeriod_idx" ON "enterprise_analytics"("metricType", "aggregationPeriod");

-- CreateIndex
CREATE INDEX "compliance_events_organizationId_eventType_createdAt_idx" ON "compliance_events"("organizationId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "compliance_events_complianceFramework_status_idx" ON "compliance_events"("complianceFramework", "status");

-- CreateIndex
CREATE INDEX "content_versions_organizationId_contentType_createdAt_idx" ON "content_versions"("organizationId", "contentType", "createdAt");

-- CreateIndex
CREATE INDEX "content_versions_contentId_isActive_idx" ON "content_versions"("contentId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "content_versions_contentId_versionNumber_key" ON "content_versions"("contentId", "versionNumber");

-- CreateIndex
CREATE INDEX "audit_logs_organizationId_userId_createdAt_idx" ON "audit_logs"("organizationId", "userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_entityType_createdAt_idx" ON "audit_logs"("action", "entityType", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_severity_createdAt_idx" ON "audit_logs"("severity", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "collaboration_sessions_sessionId_key" ON "collaboration_sessions"("sessionId");

-- CreateIndex
CREATE INDEX "collaboration_sessions_organizationId_contentId_isActive_idx" ON "collaboration_sessions"("organizationId", "contentId", "isActive");

-- CreateIndex
CREATE INDEX "collaboration_sessions_sessionId_isActive_idx" ON "collaboration_sessions"("sessionId", "isActive");

-- CreateIndex
CREATE INDEX "ai_model_performance_organizationId_modelName_recordedAt_idx" ON "ai_model_performance"("organizationId", "modelName", "recordedAt");

-- CreateIndex
CREATE INDEX "ai_model_performance_modelName_metricName_recordedAt_idx" ON "ai_model_performance"("modelName", "metricName", "recordedAt");

-- CreateIndex
CREATE INDEX "security_events_organizationId_eventType_severity_createdAt_idx" ON "security_events"("organizationId", "eventType", "severity", "createdAt");

-- CreateIndex
CREATE INDEX "security_events_severity_status_createdAt_idx" ON "security_events"("severity", "status", "createdAt");

-- CreateIndex
CREATE INDEX "sam_conversations_userId_isActive_idx" ON "sam_conversations"("userId", "isActive");

-- CreateIndex
CREATE INDEX "sam_conversations_sessionId_idx" ON "sam_conversations"("sessionId");

-- CreateIndex
CREATE INDEX "sam_conversations_courseId_userId_idx" ON "sam_conversations"("courseId", "userId");

-- CreateIndex
CREATE INDEX "sam_messages_conversationId_createdAt_idx" ON "sam_messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "sam_interactions_userId_interactionType_createdAt_idx" ON "sam_interactions"("userId", "interactionType", "createdAt");

-- CreateIndex
CREATE INDEX "sam_interactions_interactionType_success_idx" ON "sam_interactions"("interactionType", "success");

-- CreateIndex
CREATE INDEX "sam_interactions_courseId_userId_idx" ON "sam_interactions"("courseId", "userId");

-- CreateIndex
CREATE INDEX "sam_points_userId_awardedAt_idx" ON "sam_points"("userId", "awardedAt");

-- CreateIndex
CREATE INDEX "sam_points_category_awardedAt_idx" ON "sam_points"("category", "awardedAt");

-- CreateIndex
CREATE INDEX "sam_badges_userId_earnedAt_idx" ON "sam_badges"("userId", "earnedAt");

-- CreateIndex
CREATE INDEX "sam_badges_badgeType_idx" ON "sam_badges"("badgeType");

-- CreateIndex
CREATE UNIQUE INDEX "sam_badges_userId_badgeId_key" ON "sam_badges"("userId", "badgeId");

-- CreateIndex
CREATE UNIQUE INDEX "sam_streaks_userId_key" ON "sam_streaks"("userId");

-- CreateIndex
CREATE INDEX "sam_streaks_streakType_currentStreak_idx" ON "sam_streaks"("streakType", "currentStreak");

-- CreateIndex
CREATE UNIQUE INDEX "sam_learning_profiles_userId_key" ON "sam_learning_profiles"("userId");

-- CreateIndex
CREATE INDEX "sam_analytics_userId_metricType_recordedAt_idx" ON "sam_analytics"("userId", "metricType", "recordedAt");

-- CreateIndex
CREATE INDEX "sam_analytics_metricType_period_idx" ON "sam_analytics"("metricType", "period");

-- CreateIndex
CREATE INDEX "_PostToTag_B_index" ON "_PostToTag"("B");

-- CreateIndex
CREATE INDEX "_IdeaCollaborators_B_index" ON "_IdeaCollaborators"("B");

-- CreateIndex
CREATE INDEX "_MindCollaborators_B_index" ON "_MindCollaborators"("B");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TwoFactorConfirmation" ADD CONSTRAINT "TwoFactorConfirmation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blog" ADD CONSTRAINT "Blog_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blog" ADD CONSTRAINT "Blog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeExplanation" ADD CONSTRAINT "CodeExplanation_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MathExplanation" ADD CONSTRAINT "MathExplanation_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_parentReplyId_fkey" FOREIGN KEY ("parentReplyId") REFERENCES "Reply"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "Reply"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileLink" ADD CONSTRAINT "ProfileLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseReview" ADD CONSTRAINT "CourseReview_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseReview" ADD CONSTRAINT "CourseReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIContentGeneration" ADD CONSTRAINT "AIContentGeneration_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AIContentTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIContentGeneration" ADD CONSTRAINT "AIContentGeneration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIContentTemplate" ADD CONSTRAINT "AIContentTemplate_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIGeneratedContent" ADD CONSTRAINT "AIGeneratedContent_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIGeneratedContent" ADD CONSTRAINT "AIGeneratedContent_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIGeneratedContent" ADD CONSTRAINT "AIGeneratedContent_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIGeneratedContent" ADD CONSTRAINT "AIGeneratedContent_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIGeneratedContent" ADD CONSTRAINT "AIGeneratedContent_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AIContentTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIUsageMetrics" ADD CONSTRAINT "AIUsageMetrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveSession" ADD CONSTRAINT "ActiveSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthAudit" ADD CONSTRAINT "AuthAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BackupCode" ADD CONSTRAINT "BackupCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillAttachment" ADD CONSTRAINT "BillAttachment_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillPayment" ADD CONSTRAINT "BillPayment_billId_fkey" FOREIGN KEY ("billId") REFERENCES "Bill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_parentEventId_fkey" FOREIGN KEY ("parentEventId") REFERENCES "CalendarEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentCollection" ADD CONSTRAINT "ContentCollection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "ContentCollection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomTab" ADD CONSTRAINT "CustomTab_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAnalytics" ADD CONSTRAINT "ExamAnalytics_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "UserExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamQuestion" ADD CONSTRAINT "ExamQuestion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteArticle" ADD CONSTRAINT "FavoriteArticle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteAudio" ADD CONSTRAINT "FavoriteAudio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteBlog" ADD CONSTRAINT "FavoriteBlog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteImage" ADD CONSTRAINT "FavoriteImage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteVideo" ADD CONSTRAINT "FavoriteVideo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupDiscussion" ADD CONSTRAINT "GroupDiscussion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupDiscussion" ADD CONSTRAINT "GroupDiscussion_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupDiscussionComment" ADD CONSTRAINT "GroupDiscussionComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupDiscussionComment" ADD CONSTRAINT "GroupDiscussionComment_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "GroupDiscussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupDiscussionLike" ADD CONSTRAINT "GroupDiscussionLike_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "GroupDiscussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupDiscussionLike" ADD CONSTRAINT "GroupDiscussionLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupEvent" ADD CONSTRAINT "GroupEvent_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupEvent" ADD CONSTRAINT "GroupEvent_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupEvent" ADD CONSTRAINT "GroupEvent_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupEventAttendee" ADD CONSTRAINT "GroupEventAttendee_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "GroupEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupEventAttendee" ADD CONSTRAINT "GroupEventAttendee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupNotification" ADD CONSTRAINT "GroupNotification_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupNotification" ADD CONSTRAINT "GroupNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupResource" ADD CONSTRAINT "GroupResource_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupResource" ADD CONSTRAINT "GroupResource_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdeaComment" ADD CONSTRAINT "IdeaComment_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdeaComment" ADD CONSTRAINT "IdeaComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdeaLike" ADD CONSTRAINT "IdeaLike_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdeaLike" ADD CONSTRAINT "IdeaLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPath" ADD CONSTRAINT "LearningPath_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPathNode" ADD CONSTRAINT "LearningPathNode_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mind" ADD CONSTRAINT "Mind_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MindLike" ADD CONSTRAINT "MindLike_mindId_fkey" FOREIGN KEY ("mindId") REFERENCES "Mind"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MindLike" ADD CONSTRAINT "MindLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeProgress" ADD CONSTRAINT "NodeProgress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "PathEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeProgress" ADD CONSTRAINT "NodeProgress_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "LearningPathNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PathEnrollment" ADD CONSTRAINT "PathEnrollment_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PathEnrollment" ADD CONSTRAINT "PathEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PathRecommendation" ADD CONSTRAINT "PathRecommendation_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PathRecommendation" ADD CONSTRAINT "PathRecommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostChapterSection" ADD CONSTRAINT "PostChapterSection_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostImageSection" ADD CONSTRAINT "PostImageSection_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationInteraction" ADD CONSTRAINT "RecommendationInteraction_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "PathRecommendation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMediaAccount" ADD CONSTRAINT "SocialMediaAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMetric" ADD CONSTRAINT "SocialMetric_socialMediaAccountId_fkey" FOREIGN KEY ("socialMediaAccountId") REFERENCES "SocialMediaAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_socialMediaAccountId_fkey" FOREIGN KEY ("socialMediaAccountId") REFERENCES "SocialMediaAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionTransaction" ADD CONSTRAINT "SubscriptionTransaction_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "UserSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TOTPSecret" ADD CONSTRAINT "TOTPSecret_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAIPreferences" ADD CONSTRAINT "UserAIPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnalytics" ADD CONSTRAINT "UserAnalytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "UserExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ExamQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCalendarSettings" ADD CONSTRAINT "UserCalendarSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserExamAttempt" ADD CONSTRAINT "UserExamAttempt_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserExamAttempt" ADD CONSTRAINT "UserExamAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "SubscriptionService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intervention_actions" ADD CONSTRAINT "intervention_actions_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "progress_alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_metrics" ADD CONSTRAINT "learning_metrics_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_metrics" ADD CONSTRAINT "learning_metrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_metrics" ADD CONSTRAINT "performance_metrics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_alerts" ADD CONSTRAINT "progress_alerts_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_alerts" ADD CONSTRAINT "progress_alerts_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_alerts" ADD CONSTRAINT "progress_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "realtime_activities" ADD CONSTRAINT "realtime_activities_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "realtime_activities" ADD CONSTRAINT "realtime_activities_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "realtime_activities" ADD CONSTRAINT "realtime_activities_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "realtime_activities" ADD CONSTRAINT "realtime_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_streaks" ADD CONSTRAINT "study_streaks_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_streaks" ADD CONSTRAINT "study_streaks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_users" ADD CONSTRAINT "organization_users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_users" ADD CONSTRAINT "organization_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enterprise_analytics" ADD CONSTRAINT "enterprise_analytics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_events" ADD CONSTRAINT "compliance_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaboration_sessions" ADD CONSTRAINT "collaboration_sessions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_model_performance" ADD CONSTRAINT "ai_model_performance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sam_conversations" ADD CONSTRAINT "sam_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sam_conversations" ADD CONSTRAINT "sam_conversations_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sam_conversations" ADD CONSTRAINT "sam_conversations_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sam_conversations" ADD CONSTRAINT "sam_conversations_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sam_messages" ADD CONSTRAINT "sam_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "sam_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sam_interactions" ADD CONSTRAINT "sam_interactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sam_interactions" ADD CONSTRAINT "sam_interactions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sam_interactions" ADD CONSTRAINT "sam_interactions_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sam_interactions" ADD CONSTRAINT "sam_interactions_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sam_points" ADD CONSTRAINT "sam_points_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sam_points" ADD CONSTRAINT "sam_points_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sam_points" ADD CONSTRAINT "sam_points_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sam_points" ADD CONSTRAINT "sam_points_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sam_badges" ADD CONSTRAINT "sam_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sam_badges" ADD CONSTRAINT "sam_badges_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sam_streaks" ADD CONSTRAINT "sam_streaks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sam_learning_profiles" ADD CONSTRAINT "sam_learning_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sam_analytics" ADD CONSTRAINT "sam_analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sam_analytics" ADD CONSTRAINT "sam_analytics_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostToTag" ADD CONSTRAINT "_PostToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostToTag" ADD CONSTRAINT "_PostToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IdeaCollaborators" ADD CONSTRAINT "_IdeaCollaborators_A_fkey" FOREIGN KEY ("A") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_IdeaCollaborators" ADD CONSTRAINT "_IdeaCollaborators_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MindCollaborators" ADD CONSTRAINT "_MindCollaborators_A_fkey" FOREIGN KEY ("A") REFERENCES "Mind"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MindCollaborators" ADD CONSTRAINT "_MindCollaborators_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
