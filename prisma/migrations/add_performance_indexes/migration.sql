-- Performance Optimization Indexes for Taxomind LMS
-- This migration adds critical indexes to improve query performance
-- Indexes are designed based on common query patterns and relationships

-- ============================================
-- USER-RELATED INDEXES
-- ============================================

-- User lookup by email (authentication)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_email ON "User"(email) WHERE email IS NOT NULL;

-- User lookup by role (admin panels, role-based queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_role ON "User"(role);

-- User lookup by creation date (analytics, reporting)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_created_at ON "User"(createdAt DESC);

-- User instructor queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_instructor ON "User"(isTeacher) WHERE isTeacher = true;

-- User affiliate queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_affiliate ON "User"(isAffiliate) WHERE isAffiliate = true;

-- Composite index for authentication with MFA
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_auth ON "User"(email, totpEnabled) WHERE email IS NOT NULL;

-- ============================================
-- COURSE-RELATED INDEXES
-- ============================================

-- Course lookup by publication status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_published ON "Course"(isPublished) WHERE isPublished = true;

-- Course lookup by user (instructor courses)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_user ON "Course"(userId);

-- Course lookup by category
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_category ON "Course"(categoryId) WHERE categoryId IS NOT NULL;

-- Course lookup by organization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_organization ON "Course"(organizationId) WHERE organizationId IS NOT NULL;

-- Course pricing queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_price ON "Course"(price) WHERE price IS NOT NULL;

-- Course search and filtering (composite)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_search ON "Course"(isPublished, categoryId, createdAt DESC);

-- Course approval status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_approval ON "Course"(isApproved) WHERE isApproved = true;

-- Popular courses (by enrollment count)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_popularity ON "Course"(enrollmentCount DESC) WHERE isPublished = true;

-- ============================================
-- ENROLLMENT AND PURCHASE INDEXES
-- ============================================

-- Enrollment lookup by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollment_user ON "Enrollment"(userId);

-- Enrollment lookup by course
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollment_course ON "Enrollment"(courseId);

-- Composite index for user course enrollments
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollment_user_course ON "Enrollment"(userId, courseId);

-- Enrollment date queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollment_date ON "Enrollment"(enrolledAt DESC);

-- Purchase lookup by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchase_user ON "Purchase"(userId);

-- Purchase lookup by course
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchase_course ON "Purchase"(courseId);

-- Purchase date queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchase_date ON "Purchase"(createdAt DESC);

-- ============================================
-- CHAPTER AND SECTION INDEXES
-- ============================================

-- Chapter lookup by course
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chapter_course ON "Chapter"(courseId);

-- Chapter position ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chapter_position ON "Chapter"(courseId, position);

-- Published chapters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chapter_published ON "Chapter"(isPublished) WHERE isPublished = true;

-- Section lookup by chapter
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_section_chapter ON "Section"(chapterId);

-- Section position ordering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_section_position ON "Section"(chapterId, position);

-- Published sections
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_section_published ON "Section"(isPublished) WHERE isPublished = true;

-- ============================================
-- USER PROGRESS INDEXES
-- ============================================

-- UserCourseEnrollment lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_course_enrollment_user ON "UserCourseEnrollment"(userId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_course_enrollment_course ON "UserCourseEnrollment"(courseId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_course_enrollment_composite ON "UserCourseEnrollment"(userId, courseId);

-- UserChapterCompletion lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_chapter_completion_user ON "UserChapterCompletion"(userId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_chapter_completion_chapter ON "UserChapterCompletion"(chapterId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_chapter_completion_composite ON "UserChapterCompletion"(userId, chapterId);

-- UserSectionCompletion lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_section_completion_user ON "UserSectionCompletion"(userId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_section_completion_section ON "UserSectionCompletion"(sectionId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_section_completion_composite ON "UserSectionCompletion"(userId, sectionId);

-- Progress tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_user ON "user_progress"(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_course ON "user_progress"(course_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_composite ON "user_progress"(user_id, course_id);

-- ============================================
-- COMMENT AND POST INDEXES
-- ============================================

-- Comment lookup by post
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comment_post ON "Comment"(postId);

-- Comment lookup by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comment_user ON "Comment"(userId);

-- Comment creation date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comment_created ON "Comment"(createdAt DESC);

-- Post lookup by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_user ON "Post"(userId);

-- Post lookup by publication status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_published ON "Post"(isPublished) WHERE isPublished = true;

-- Post creation date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_created ON "Post"(createdAt DESC);

-- Reply lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reply_comment ON "Reply"(commentId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reply_user ON "Reply"(userId);

-- ============================================
-- ANALYTICS AND METRICS INDEXES
-- ============================================

-- Learning metrics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_learning_metrics_user ON "learning_metrics"(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_learning_metrics_course ON "learning_metrics"(course_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_learning_metrics_date ON "learning_metrics"(created_at DESC);

-- Learning sessions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_learning_sessions_user ON "learning_sessions"(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_learning_sessions_course ON "learning_sessions"(course_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_learning_sessions_date ON "learning_sessions"(started_at DESC);

-- Performance metrics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_metrics_user ON "performance_metrics"(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_performance_metrics_date ON "performance_metrics"(created_at DESC);

-- Real-time activities
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_realtime_activities_user ON "realtime_activities"(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_realtime_activities_course ON "realtime_activities"(course_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_realtime_activities_timestamp ON "realtime_activities"(timestamp DESC);

-- ============================================
-- SAM (AI ASSISTANT) INDEXES
-- ============================================

-- SAM interactions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sam_interaction_user ON "SAMInteraction"(userId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sam_interaction_course ON "SAMInteraction"(courseId) WHERE courseId IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sam_interaction_date ON "SAMInteraction"(createdAt DESC);

-- SAM conversations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sam_conversation_user ON "SAMConversation"(userId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sam_conversation_course ON "SAMConversation"(courseId) WHERE courseId IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sam_conversation_active ON "SAMConversation"(isActive) WHERE isActive = true;

-- SAM analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sam_analytics_user ON "SAMAnalytics"(userId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sam_analytics_date ON "SAMAnalytics"(createdAt DESC);

-- ============================================
-- EXAM AND ASSESSMENT INDEXES
-- ============================================

-- Exam lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exam_section ON "Exam"(sectionId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exam_published ON "Exam"(isPublished) WHERE isPublished = true;

-- User exam attempts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_exam_attempt_user ON "UserExamAttempt"(userId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_exam_attempt_exam ON "UserExamAttempt"(examId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_exam_attempt_date ON "UserExamAttempt"(attemptedAt DESC);

-- Question lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_section ON "Question"(sectionId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_exam ON "Question"(examId) WHERE examId IS NOT NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_question_blooms ON "Question"(bloomsLevel) WHERE bloomsLevel IS NOT NULL;

-- ============================================
-- NOTIFICATION AND ACTIVITY INDEXES
-- ============================================

-- Notification lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_user ON "Notification"(userId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_read ON "Notification"(isRead) WHERE isRead = false;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_date ON "Notification"(createdAt DESC);

-- Activity lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_user ON "Activity"(userId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_type ON "Activity"(type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activity_date ON "Activity"(createdAt DESC);

-- ============================================
-- GROUP AND COLLABORATION INDEXES
-- ============================================

-- Group membership
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_member_user ON "GroupMember"(userId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_member_group ON "GroupMember"(groupId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_member_role ON "GroupMember"(role);

-- Group discussions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_discussion_group ON "GroupDiscussion"(groupId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_discussion_user ON "GroupDiscussion"(userId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_discussion_date ON "GroupDiscussion"(createdAt DESC);

-- ============================================
-- COLLABORATIVE EDITING INDEXES
-- ============================================

-- Collaborative sessions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collab_session_creator ON "CollaborativeSession"(creatorId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collab_session_active ON "CollaborativeSession"(isActive) WHERE isActive = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_collab_session_date ON "CollaborativeSession"(createdAt DESC);

-- Session participants
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_session_participant_user ON "SessionParticipant"(userId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_session_participant_session ON "SessionParticipant"(sessionId);

-- ============================================
-- SEARCH AND FULL-TEXT INDEXES
-- ============================================

-- Full-text search on course title and description
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_course_fulltext ON "Course" USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

-- Full-text search on post title and content
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_fulltext ON "Post" USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));

-- Full-text search on user name
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_name_search ON "User" USING gin(to_tsvector('english', coalesce(name, '')));

-- ============================================
-- AUDIT AND SECURITY INDEXES
-- ============================================

-- Audit log lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_user ON "AuditLog"(userId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_action ON "AuditLog"(action);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_entity ON "AuditLog"(entityType, entityId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_date ON "AuditLog"(createdAt DESC);

-- Enhanced audit log
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enhanced_audit_log_user ON "EnhancedAuditLog"(userId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enhanced_audit_log_date ON "EnhancedAuditLog"(timestamp DESC);

-- Auth audit
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_audit_user ON "AuthAudit"(userId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_audit_event ON "AuthAudit"(eventType);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_auth_audit_date ON "AuthAudit"(timestamp DESC);

-- ============================================
-- CONTENT VERSION CONTROL INDEXES
-- ============================================

-- Content versions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_version_entity ON "ContentVersion"(entityType, entityId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_version_author ON "ContentVersion"(authorId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_version_status ON "ContentVersion"(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_content_version_date ON "ContentVersion"(createdAt DESC);

-- ============================================
-- API AND INTEGRATION INDEXES
-- ============================================

-- API keys
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_key_user ON "ApiKey"(userId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_key_active ON "ApiKey"(isActive) WHERE isActive = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_key_expires ON "ApiKey"(expiresAt) WHERE expiresAt IS NOT NULL;

-- ============================================
-- PERFORMANCE TRACKING INDEXES
-- ============================================

-- Study streaks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_study_streak_user ON "study_streaks"(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_study_streak_active ON "study_streaks"(is_active) WHERE is_active = true;

-- User achievements
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_achievement_user ON "user_achievements"(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_achievement_date ON "user_achievements"(earned_at DESC);

-- Progress alerts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_progress_alert_user ON "progress_alerts"(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_progress_alert_course ON "progress_alerts"(course_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_progress_alert_resolved ON "progress_alerts"(is_resolved) WHERE is_resolved = false;

-- ============================================
-- CLEANUP AND OPTIMIZATION
-- ============================================

-- Update table statistics for query planner
ANALYZE "User";
ANALYZE "Course";
ANALYZE "Enrollment";
ANALYZE "Purchase";
ANALYZE "Chapter";
ANALYZE "Section";
ANALYZE "UserCourseEnrollment";
ANALYZE "UserChapterCompletion";
ANALYZE "UserSectionCompletion";
ANALYZE "Comment";
ANALYZE "Post";
ANALYZE "learning_metrics";
ANALYZE "learning_sessions";
ANALYZE "SAMInteraction";
ANALYZE "SAMConversation";