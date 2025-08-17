-- Database Performance Views
-- Phase 3.1: Materialized views for complex aggregated queries
-- Generated as part of Enterprise Code Quality Plan Phase 3

-- Course Statistics View - Most frequently accessed aggregated data
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_course_statistics AS
SELECT 
  c.id,
  c.title,
  c.isPublished,
  c.categoryId,
  c.userId as authorId,
  c.price,
  c.createdAt,
  -- Enrollment metrics
  COUNT(DISTINCT e."userId") as enrollment_count,
  COUNT(DISTINCT p."userId") as purchase_count,
  -- Review metrics
  COUNT(DISTINCT r.id) as review_count,
  COALESCE(AVG(r.rating), 0) as average_rating,
  -- Chapter metrics
  COUNT(DISTINCT ch.id) as total_chapters,
  COUNT(DISTINCT CASE WHEN ch."isPublished" = true THEN ch.id END) as published_chapters,
  -- Completion metrics
  COUNT(DISTINCT uce.id) as total_enrollments,
  COUNT(DISTINCT CASE WHEN uce.progress = 100 THEN uce.id END) as total_completions,
  CASE 
    WHEN COUNT(DISTINCT uce.id) > 0 
    THEN (COUNT(DISTINCT CASE WHEN uce.progress = 100 THEN uce.id END) * 100.0 / COUNT(DISTINCT uce.id))
    ELSE 0 
  END as completion_rate,
  -- Average progress
  COALESCE(AVG(uce.progress), 0) as average_progress
FROM "Course" c
LEFT JOIN "Enrollment" e ON c.id = e."courseId"
LEFT JOIN "Purchase" p ON c.id = p."courseId"
LEFT JOIN "CourseReview" r ON c.id = r."courseId"
LEFT JOIN "Chapter" ch ON c.id = ch."courseId"
LEFT JOIN "UserCourseEnrollment" uce ON c.id = uce."courseId"
GROUP BY c.id, c.title, c.isPublished, c.categoryId, c.userId, c.price, c.createdAt;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_course_statistics_id ON mv_course_statistics(id);
CREATE INDEX IF NOT EXISTS idx_mv_course_statistics_published ON mv_course_statistics(isPublished, enrollment_count DESC);
CREATE INDEX IF NOT EXISTS idx_mv_course_statistics_category ON mv_course_statistics(categoryId, average_rating DESC);

-- User Progress Summary View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_progress_summary AS
SELECT 
  u.id as user_id,
  u.email,
  u.role,
  -- Course metrics
  COUNT(DISTINCT uce."courseId") as enrolled_courses,
  COUNT(DISTINCT CASE WHEN uce.progress = 100 THEN uce."courseId" END) as completed_courses,
  COUNT(DISTINCT p."courseId") as purchased_courses,
  -- Progress metrics
  COALESCE(AVG(uce.progress), 0) as average_progress,
  COALESCE(SUM(ucc."timeSpent"), 0) as total_time_spent,
  -- Activity metrics
  COUNT(DISTINCT ucc."chapterId") as chapters_started,
  COUNT(DISTINCT CASE WHEN ucc."completedAt" IS NOT NULL THEN ucc."chapterId" END) as chapters_completed,
  COUNT(DISTINCT usc."sectionId") as sections_started,
  COUNT(DISTINCT CASE WHEN usc."completedAt" IS NOT NULL THEN usc."sectionId" END) as sections_completed,
  -- Latest activity
  MAX(uce."lastAccessedAt") as last_course_access,
  MAX(ucc."startedAt") as last_chapter_activity,
  MAX(usc."startedAt") as last_section_activity
FROM "User" u
LEFT JOIN "UserCourseEnrollment" uce ON u.id = uce."userId"
LEFT JOIN "Purchase" p ON u.id = p."userId"
LEFT JOIN "UserChapterCompletion" ucc ON u.id = ucc."userId"
LEFT JOIN "UserSectionCompletion" usc ON u.id = usc."userId"
GROUP BY u.id, u.email, u.role;

-- Create index on user progress view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_user_progress_summary_id ON mv_user_progress_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_mv_user_progress_summary_progress ON mv_user_progress_summary(average_progress DESC);
CREATE INDEX IF NOT EXISTS idx_mv_user_progress_summary_activity ON mv_user_progress_summary(last_course_access DESC);

-- Category Performance View
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_category_performance AS
SELECT 
  cat.id,
  cat.name,
  -- Course metrics
  COUNT(DISTINCT c.id) as total_courses,
  COUNT(DISTINCT CASE WHEN c."isPublished" = true THEN c.id END) as published_courses,
  -- Enrollment metrics
  COUNT(DISTINCT e."userId") as total_enrollments,
  COUNT(DISTINCT p."userId") as total_purchases,
  -- Financial metrics
  COALESCE(SUM(c.price), 0) as total_course_value,
  COALESCE(AVG(c.price), 0) as average_course_price,
  -- Quality metrics
  COALESCE(AVG(r.rating), 0) as average_rating,
  COUNT(DISTINCT r.id) as total_reviews,
  -- Activity metrics
  MAX(c."createdAt") as latest_course_created,
  MAX(e."createdAt") as latest_enrollment
FROM "Category" cat
LEFT JOIN "Course" c ON cat.id = c."categoryId"
LEFT JOIN "Enrollment" e ON c.id = e."courseId"
LEFT JOIN "Purchase" p ON c.id = p."courseId"
LEFT JOIN "CourseReview" r ON c.id = r."courseId"
GROUP BY cat.id, cat.name;

-- Create index on category performance view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_category_performance_id ON mv_category_performance(id);
CREATE INDEX IF NOT EXISTS idx_mv_category_performance_enrollments ON mv_category_performance(total_enrollments DESC);

-- Daily Analytics View for Dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_analytics AS
SELECT 
  DATE("createdAt") as activity_date,
  -- User metrics
  COUNT(DISTINCT CASE WHEN "createdAt"::date = CURRENT_DATE THEN id END) as new_users_today,
  COUNT(DISTINCT id) as total_users,
  -- Course metrics
  COUNT(DISTINCT c.id) as total_courses,
  COUNT(DISTINCT CASE WHEN c."createdAt"::date = CURRENT_DATE THEN c.id END) as new_courses_today,
  -- Enrollment metrics
  COUNT(DISTINCT e.id) as total_enrollments,
  COUNT(DISTINCT CASE WHEN e."createdAt"::date = CURRENT_DATE THEN e.id END) as new_enrollments_today,
  -- Purchase metrics
  COUNT(DISTINCT p.id) as total_purchases,
  COUNT(DISTINCT CASE WHEN p."createdAt"::date = CURRENT_DATE THEN p.id END) as new_purchases_today,
  COALESCE(SUM(c.price), 0) as total_revenue
FROM "User" u
FULL OUTER JOIN "Course" c ON DATE(u."createdAt") = DATE(c."createdAt")
FULL OUTER JOIN "Enrollment" e ON DATE(u."createdAt") = DATE(e."createdAt")
FULL OUTER JOIN "Purchase" p ON DATE(u."createdAt") = DATE(p."createdAt")
WHERE u."createdAt" >= CURRENT_DATE - INTERVAL '30 days'
   OR c."createdAt" >= CURRENT_DATE - INTERVAL '30 days'
   OR e."createdAt" >= CURRENT_DATE - INTERVAL '30 days'
   OR p."createdAt" >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(COALESCE(u."createdAt", c."createdAt", e."createdAt", p."createdAt"))
ORDER BY activity_date DESC;

-- Create index on daily analytics view
CREATE INDEX IF NOT EXISTS idx_mv_daily_analytics_date ON mv_daily_analytics(activity_date DESC);

-- Refresh function to update all materialized views
CREATE OR REPLACE FUNCTION refresh_performance_views() 
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_course_statistics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_progress_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_category_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_analytics;
END;
$$ LANGUAGE plpgsql;

-- Function to get view refresh status
CREATE OR REPLACE FUNCTION get_view_refresh_stats()
RETURNS TABLE(view_name text, last_refresh timestamp, rows_count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'mv_course_statistics'::text,
    pg_stat_get_last_analyze_time('mv_course_statistics'::regclass),
    (SELECT count(*) FROM mv_course_statistics)
  UNION ALL
  SELECT 
    'mv_user_progress_summary'::text,
    pg_stat_get_last_analyze_time('mv_user_progress_summary'::regclass),
    (SELECT count(*) FROM mv_user_progress_summary)
  UNION ALL
  SELECT 
    'mv_category_performance'::text,
    pg_stat_get_last_analyze_time('mv_category_performance'::regclass),
    (SELECT count(*) FROM mv_category_performance)
  UNION ALL
  SELECT 
    'mv_daily_analytics'::text,
    pg_stat_get_last_analyze_time('mv_daily_analytics'::regclass),
    (SELECT count(*) FROM mv_daily_analytics);
END;
$$ LANGUAGE plpgsql;

-- Schedule: These views should be refreshed hourly in production
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_course_statistics;
-- Can be automated with pg_cron or application-level scheduling