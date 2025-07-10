-- Performance Database Indexes for Alam LMS
-- Run these after schema deployment to improve query performance

-- User-related indexes
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_role ON "User"(role);

-- Course-related indexes  
CREATE INDEX IF NOT EXISTS idx_course_published ON "Course"("isPublished");
CREATE INDEX IF NOT EXISTS idx_course_category ON "Course"("categoryId");
CREATE INDEX IF NOT EXISTS idx_course_user ON "Course"("userId");
CREATE INDEX IF NOT EXISTS idx_course_featured ON "Course"("isFeatured");
CREATE INDEX IF NOT EXISTS idx_course_title ON "Course"("title");
CREATE INDEX IF NOT EXISTS idx_course_created_at ON "Course"("createdAt");

-- Chapter-related indexes
CREATE INDEX IF NOT EXISTS idx_chapter_course ON "Chapter"("courseId");
CREATE INDEX IF NOT EXISTS idx_chapter_published ON "Chapter"("isPublished");
CREATE INDEX IF NOT EXISTS idx_chapter_position ON "Chapter"("position");
CREATE INDEX IF NOT EXISTS idx_chapter_course_position ON "Chapter"("courseId", "position");

-- Section-related indexes
CREATE INDEX IF NOT EXISTS idx_section_chapter ON "Section"("chapterId");
CREATE INDEX IF NOT EXISTS idx_section_published ON "Section"("isPublished");
CREATE INDEX IF NOT EXISTS idx_section_position ON "Section"("position");
CREATE INDEX IF NOT EXISTS idx_section_chapter_position ON "Section"("chapterId", "position");

-- User Progress indexes (Critical for performance)
CREATE INDEX IF NOT EXISTS idx_user_progress_user_chapter ON "UserProgress"("userId", "chapterId");
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON "UserProgress"("isCompleted");
CREATE INDEX IF NOT EXISTS idx_user_chapter_completion_user ON "UserChapterCompletion"("userId");
CREATE INDEX IF NOT EXISTS idx_user_section_completion_user ON "UserSectionCompletion"("userId");

-- User Course Enrollment indexes
CREATE INDEX IF NOT EXISTS idx_enrollment_user ON "UserCourseEnrollment"("userId");
CREATE INDEX IF NOT EXISTS idx_enrollment_course ON "UserCourseEnrollment"("courseId");
CREATE INDEX IF NOT EXISTS idx_enrollment_user_course ON "UserCourseEnrollment"("userId", "courseId");
CREATE INDEX IF NOT EXISTS idx_enrollment_completed ON "UserCourseEnrollment"("completedAt");
CREATE INDEX IF NOT EXISTS idx_enrollment_accessed ON "UserCourseEnrollment"("lastAccessedAt");

-- Video Progress indexes
CREATE INDEX IF NOT EXISTS idx_video_progress_user ON "UserVideoProgress"("userId");
CREATE INDEX IF NOT EXISTS idx_video_progress_section ON "UserVideoProgress"("sectionId");
CREATE INDEX IF NOT EXISTS idx_video_progress_user_section ON "UserVideoProgress"("userId", "sectionId");
CREATE INDEX IF NOT EXISTS idx_video_progress_completed ON "UserVideoProgress"("isCompleted");

-- Exam and Assessment indexes
CREATE INDEX IF NOT EXISTS idx_exam_section ON "Exam"("sectionId");
CREATE INDEX IF NOT EXISTS idx_exam_published ON "Exam"("isPublished");
CREATE INDEX IF NOT EXISTS idx_exam_attempt_user ON "ExamAttempt"("userId");
CREATE INDEX IF NOT EXISTS idx_exam_attempt_exam ON "ExamAttempt"("examId");
CREATE INDEX IF NOT EXISTS idx_exam_attempt_user_exam ON "ExamAttempt"("userId", "examId");
CREATE INDEX IF NOT EXISTS idx_exam_attempt_passed ON "ExamAttempt"("passed");
CREATE INDEX IF NOT EXISTS idx_exam_attempt_score ON "ExamAttempt"("score");

-- Question indexes
CREATE INDEX IF NOT EXISTS idx_question_exam ON "Question"("examId");
CREATE INDEX IF NOT EXISTS idx_question_position ON "Question"("position");
CREATE INDEX IF NOT EXISTS idx_question_exam_position ON "Question"("examId", "position");

-- Question Attempt indexes
CREATE INDEX IF NOT EXISTS idx_question_attempt_user ON "QuestionAttempt"("userId");
CREATE INDEX IF NOT EXISTS idx_question_attempt_question ON "QuestionAttempt"("questionId");
CREATE INDEX IF NOT EXISTS idx_question_attempt_correct ON "QuestionAttempt"("isCorrect");

-- Purchase/Enrollment indexes
CREATE INDEX IF NOT EXISTS idx_purchase_user ON "Purchase"("userId");
CREATE INDEX IF NOT EXISTS idx_purchase_course ON "Purchase"("courseId");
CREATE INDEX IF NOT EXISTS idx_purchase_user_course ON "Purchase"("userId", "courseId");

-- Certificate and Badge indexes
CREATE INDEX IF NOT EXISTS idx_certification_user ON "Certification"("userId");
CREATE INDEX IF NOT EXISTS idx_certification_course ON "Certification"("courseId");
CREATE INDEX IF NOT EXISTS idx_certification_verification ON "Certification"("verificationCode");
CREATE INDEX IF NOT EXISTS idx_certification_revoked ON "Certification"("isRevoked");

CREATE INDEX IF NOT EXISTS idx_user_badge_user ON "UserBadge"("userId");
CREATE INDEX IF NOT EXISTS idx_user_badge_badge ON "UserBadge"("badgeId");
CREATE INDEX IF NOT EXISTS idx_user_badge_earned ON "UserBadge"("earnedAt");

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_student_interaction_user ON "StudentInteraction"("studentId");
CREATE INDEX IF NOT EXISTS idx_student_interaction_course ON "StudentInteraction"("courseId");
CREATE INDEX IF NOT EXISTS idx_student_interaction_timestamp ON "StudentInteraction"("timestamp");
CREATE INDEX IF NOT EXISTS idx_student_interaction_type ON "StudentInteraction"("interactionType");

CREATE INDEX IF NOT EXISTS idx_recent_activity_user ON "RecentActivity"("userId");
CREATE INDEX IF NOT EXISTS idx_recent_activity_timestamp ON "RecentActivity"("timestamp");
CREATE INDEX IF NOT EXISTS idx_recent_activity_type ON "RecentActivity"("activityType");

-- Streak and Engagement indexes
CREATE INDEX IF NOT EXISTS idx_streak_info_user ON "StreakInfo"("userId");
CREATE INDEX IF NOT EXISTS idx_streak_info_current ON "StreakInfo"("currentStreak");
CREATE INDEX IF NOT EXISTS idx_streak_info_longest ON "StreakInfo"("longestStreak");

-- Post and Social indexes
CREATE INDEX IF NOT EXISTS idx_post_user ON "Post"("userId");
CREATE INDEX IF NOT EXISTS idx_post_published ON "Post"("isPublished");
CREATE INDEX IF NOT EXISTS idx_post_created ON "Post"("createdAt");
CREATE INDEX IF NOT EXISTS idx_post_title ON "Post"("title");

CREATE INDEX IF NOT EXISTS idx_comment_post ON "Comment"("postId");
CREATE INDEX IF NOT EXISTS idx_comment_user ON "Comment"("userId");
CREATE INDEX IF NOT EXISTS idx_comment_created ON "Comment"("createdAt");

-- Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_course_category_published ON "Course"("categoryId", "isPublished");
CREATE INDEX IF NOT EXISTS idx_course_user_published ON "Course"("userId", "isPublished");
CREATE INDEX IF NOT EXISTS idx_chapter_course_published_position ON "Chapter"("courseId", "isPublished", "position");
CREATE INDEX IF NOT EXISTS idx_section_chapter_published_position ON "Section"("chapterId", "isPublished", "position");

-- Full-text search indexes (if using PostgreSQL)
CREATE INDEX IF NOT EXISTS idx_course_title_search ON "Course" USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_course_description_search ON "Course" USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_post_title_search ON "Post" USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_post_content_search ON "Post" USING gin(to_tsvector('english', content));

-- Partial indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_course_published_featured ON "Course"("isPublished", "isFeatured") WHERE "isPublished" = true;
CREATE INDEX IF NOT EXISTS idx_chapter_published_course ON "Chapter"("courseId") WHERE "isPublished" = true;
CREATE INDEX IF NOT EXISTS idx_section_published_chapter ON "Section"("chapterId") WHERE "isPublished" = true;
CREATE INDEX IF NOT EXISTS idx_exam_published_section ON "Exam"("sectionId") WHERE "isPublished" = true;