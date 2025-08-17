-- Database Performance Optimization Indexes
-- Phase 3.1: Critical indexes for common query patterns identified in codebase
-- Generated as part of Enterprise Code Quality Plan Phase 3

-- Course table indexes for common filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_course_published_category" 
ON "Course"("isPublished", "categoryId") 
WHERE "isPublished" = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_course_user_published" 
ON "Course"("userId", "isPublished");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_course_title_search" 
ON "Course" USING gin(to_tsvector('english', "title"));

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_course_created_desc" 
ON "Course"("createdAt" DESC);

-- Purchase table indexes for dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_purchase_user_course_composite" 
ON "Purchase"("userId", "courseId", "createdAt");

-- Enrollment table indexes for progress tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_enrollment_user_course_composite" 
ON "Enrollment"("userId", "courseId", "createdAt");

-- Chapter table indexes for course content
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_chapter_course_published" 
ON "Chapter"("courseId", "isPublished") 
WHERE "isPublished" = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_chapter_position_course" 
ON "Chapter"("courseId", "position");

-- User progress tracking indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_course_enrollment_user_course" 
ON "UserCourseEnrollment"("userId", "courseId", "status");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_course_enrollment_progress" 
ON "UserCourseEnrollment"("progress", "status");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_chapter_completion_user_chapter" 
ON "UserChapterCompletion"("userId", "chapterId", "completedAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_section_completion_user_section" 
ON "UserSectionCompletion"("userId", "sectionId", "completedAt");

-- Analytics indexes for performance monitoring
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_analytics_composite" 
ON "UserAnalytics"("userId", "analyticsType", "recordedAt" DESC);

-- Course review indexes for rating calculations
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_course_review_course_rating" 
ON "CourseReview"("courseId", "rating", "createdAt");

-- User permission and role indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_permission_user_granted" 
ON "UserPermission"("userId", "granted") 
WHERE "granted" = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_role" 
ON "User"("role");

-- Audit and security indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_consent_user_type" 
ON "UserConsent"("userId", "consentType", "granted");

-- Performance monitoring indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_course_optimization_suggestion_course_status" 
ON "CourseOptimizationSuggestion"("courseId", "status", "createdAt");

-- Session and auth indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_email_verified" 
ON "User"("email", "emailVerified") 
WHERE "emailVerified" IS NOT NULL;

-- Composite indexes for complex dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_course_analytics_composite" 
ON "Course"("isPublished", "categoryId", "userId", "createdAt" DESC);

-- Indexes for course content hierarchy
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_section_chapter_position" 
ON "Section"("chapterId", "position", "isPublished");

-- Indexes for learning analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_learning_pattern_user_type" 
ON "UserLearningPattern"("userId", "patternType", "lastAnalyzed");

-- Indexes for course completion analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_course_completion_analytics_course" 
ON "CourseCompletionAnalytics"("courseId", "completionRate", "totalEnrollments");

-- Cleanup: Remove any duplicate or unused indexes
-- Note: Run ANALYZE after creating indexes to update statistics