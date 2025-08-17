-- Performance Optimization Indexes
-- These indexes improve query performance for common access patterns

-- Course-related indexes
CREATE INDEX IF NOT EXISTS idx_course_published_created ON "Course" ("isPublished", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_course_user_published ON "Course" ("userId", "isPublished");
CREATE INDEX IF NOT EXISTS idx_course_category_published ON "Course" ("categoryId", "isPublished");

-- Chapter indexes
CREATE INDEX IF NOT EXISTS idx_chapter_course_published ON "Chapter" ("courseId", "isPublished");
CREATE INDEX IF NOT EXISTS idx_chapter_course_position ON "Chapter" ("courseId", "position");

-- Section indexes
CREATE INDEX IF NOT EXISTS idx_section_chapter_position ON "Section" ("chapterId", "position");
CREATE INDEX IF NOT EXISTS idx_section_chapter_published ON "Section" ("chapterId", "isPublished");

-- Enrollment indexes (if not already present)
CREATE INDEX IF NOT EXISTS idx_enrollment_user_course ON "Enrollment" ("userId", "courseId");
CREATE INDEX IF NOT EXISTS idx_enrollment_created ON "Enrollment" ("createdAt" DESC);

-- Purchase indexes
CREATE INDEX IF NOT EXISTS idx_purchase_user ON "Purchase" ("userId");
CREATE INDEX IF NOT EXISTS idx_purchase_course ON "Purchase" ("courseId");
CREATE INDEX IF NOT EXISTS idx_purchase_user_course ON "Purchase" ("userId", "courseId");
CREATE INDEX IF NOT EXISTS idx_purchase_created ON "Purchase" ("createdAt" DESC);

-- UserProgress indexes
CREATE INDEX IF NOT EXISTS idx_user_progress_user_course ON "UserProgress" ("userId", "courseId");
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON "UserProgress" ("isCompleted");

-- Post-related indexes
CREATE INDEX IF NOT EXISTS idx_post_published_created ON "Post" ("isPublished", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_post_user_published ON "Post" ("userId", "isPublished");

-- Comment indexes
CREATE INDEX IF NOT EXISTS idx_comment_post_created ON "Comment" ("postId", "createdAt" DESC);

-- CourseReview indexes
CREATE INDEX IF NOT EXISTS idx_course_review_course ON "CourseReview" ("courseId");
CREATE INDEX IF NOT EXISTS idx_course_review_rating ON "CourseReview" ("rating");
CREATE INDEX IF NOT EXISTS idx_course_review_course_rating ON "CourseReview" ("courseId", "rating");

-- User activity indexes
CREATE INDEX IF NOT EXISTS idx_user_last_login ON "User" ("lastLoginAt" DESC);
CREATE INDEX IF NOT EXISTS idx_user_role ON "User" ("role");
CREATE INDEX IF NOT EXISTS idx_user_created ON "User" ("createdAt" DESC);

-- Composite indexes for common JOIN patterns
CREATE INDEX IF NOT EXISTS idx_enrollment_course_user_created ON "Enrollment" ("courseId", "userId", "createdAt");
CREATE INDEX IF NOT EXISTS idx_chapter_course_published_position ON "Chapter" ("courseId", "isPublished", "position");
CREATE INDEX IF NOT EXISTS idx_section_chapter_published_position ON "Section" ("chapterId", "isPublished", "position");

-- Text search indexes (if using full-text search)
CREATE INDEX IF NOT EXISTS idx_course_title_gin ON "Course" USING GIN (to_tsvector('english', "title"));
CREATE INDEX IF NOT EXISTS idx_course_description_gin ON "Course" USING GIN (to_tsvector('english', "description"));
CREATE INDEX IF NOT EXISTS idx_post_title_gin ON "Post" USING GIN (to_tsvector('english', "title"));

-- Partial indexes for common WHERE conditions
CREATE INDEX IF NOT EXISTS idx_course_published_true ON "Course" ("createdAt" DESC) WHERE "isPublished" = true;
CREATE INDEX IF NOT EXISTS idx_chapter_published_true ON "Chapter" ("courseId", "position") WHERE "isPublished" = true;
CREATE INDEX IF NOT EXISTS idx_user_active ON "User" ("email") WHERE "isAccountLocked" = false;

-- Analytics and reporting indexes
CREATE INDEX IF NOT EXISTS idx_purchase_created_month ON "Purchase" (DATE_TRUNC('month', "createdAt"));
CREATE INDEX IF NOT EXISTS idx_enrollment_created_month ON "Enrollment" (DATE_TRUNC('month', "createdAt"));

-- Performance monitoring indexes
CREATE INDEX IF NOT EXISTS idx_activity_user_timestamp ON "Activity" ("userId", "timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_activity_type_timestamp ON "Activity" ("activityType", "timestamp" DESC);

-- Add statistics for better query planning
ANALYZE "Course";
ANALYZE "Chapter";
ANALYZE "Section";
ANALYZE "Enrollment";
ANALYZE "Purchase";
ANALYZE "UserProgress";
ANALYZE "User";
ANALYZE "Post";
ANALYZE "Comment";