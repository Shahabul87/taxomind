-- Add critical performance indexes for Taxomind LMS
-- These indexes address the most common query patterns and N+1 issues

-- Course-related indexes
CREATE INDEX IF NOT EXISTS "idx_Course_published_category" ON "Course"("isPublished", "categoryId");
CREATE INDEX IF NOT EXISTS "idx_Course_user_published" ON "Course"("userId", "isPublished");
CREATE INDEX IF NOT EXISTS "idx_Course_created_at" ON "Course"("createdAt" DESC);

-- Chapter-related indexes
CREATE INDEX IF NOT EXISTS "idx_Chapter_course_published" ON "Chapter"("courseId", "isPublished");
CREATE INDEX IF NOT EXISTS "idx_Chapter_course_position" ON "Chapter"("courseId", "position");

-- Section-related indexes
CREATE INDEX IF NOT EXISTS "idx_Section_chapter_position" ON "Section"("chapterId", "position");
CREATE INDEX IF NOT EXISTS "idx_Section_chapter_free" ON "Section"("chapterId", "isFree");

-- Enrollment and Purchase indexes
CREATE INDEX IF NOT EXISTS "idx_Enrollment_user_course" ON "Enrollment"("userId", "courseId");
CREATE INDEX IF NOT EXISTS "idx_Purchase_user_course" ON "Purchase"("userId", "courseId");
CREATE INDEX IF NOT EXISTS "idx_Purchase_created_at" ON "Purchase"("createdAt" DESC);

-- User Progress indexes
CREATE INDEX IF NOT EXISTS "idx_UserProgress_user_course" ON "UserProgress"("userId", "courseId");
CREATE INDEX IF NOT EXISTS "idx_UserProgress_user_section" ON "UserProgress"("userId", "sectionId");
CREATE INDEX IF NOT EXISTS "idx_UserProgress_completed" ON "UserProgress"("isCompleted", "userId");

-- Analytics and Metrics indexes
CREATE INDEX IF NOT EXISTS "idx_LearningMetrics_user_date" ON "LearningMetrics"("userId", "lastActivityDate" DESC);
CREATE INDEX IF NOT EXISTS "idx_LearningMetrics_course_date" ON "LearningMetrics"("courseId", "lastActivityDate" DESC);
CREATE INDEX IF NOT EXISTS "idx_RealtimeActivity_timestamp" ON "RealtimeActivity"("timestamp" DESC);
CREATE INDEX IF NOT EXISTS "idx_RealtimeActivity_user" ON "RealtimeActivity"("userId", "timestamp" DESC);

-- Course Review indexes
CREATE INDEX IF NOT EXISTS "idx_CourseReview_course" ON "CourseReview"("courseId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_CourseReview_user" ON "CourseReview"("userId");

-- Quiz and Assessment indexes
CREATE INDEX IF NOT EXISTS "idx_QuizAttempt_user_quiz" ON "QuizAttempt"("userId", "quizId");
CREATE INDEX IF NOT EXISTS "idx_QuizAttempt_completed" ON "QuizAttempt"("completedAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_ExamAttempt_user_exam" ON "ExamAttempt"("userId", "examId");

-- Attachment and Resource indexes
CREATE INDEX IF NOT EXISTS "idx_Attachment_course" ON "Attachment"("courseId");
CREATE INDEX IF NOT EXISTS "idx_Resource_section" ON "Resource"("sectionId");

-- Category index
CREATE INDEX IF NOT EXISTS "idx_Category_name" ON "Category"("name");

-- User-related indexes for common queries
CREATE INDEX IF NOT EXISTS "idx_User_email" ON "User"("email");
CREATE INDEX IF NOT EXISTS "idx_User_role" ON "User"("role");

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS "idx_Course_full_query" ON "Course"("isPublished", "categoryId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_Enrollment_active" ON "Enrollment"("userId", "courseId", "enrolledAt" DESC);