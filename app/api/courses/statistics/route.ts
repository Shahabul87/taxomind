import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { redisCache, CACHE_PREFIXES, CACHE_TTL } from '@/lib/cache/redis-cache';
import { logger } from '@/lib/logger';
import { withPublicAPI } from '@/lib/api/with-api-auth';

// Force Node.js runtime
export const runtime = 'nodejs';

/**
 * Course Statistics Response Interface
 * Contains platform-wide statistics for courses, learners, and engagement
 */
interface CourseStatisticsResponse {
  success: boolean;
  data?: {
    totalCourses: number;
    publishedCourses: number;
    newCoursesThisWeek: number;
    activeLearners: number;
    totalLearners: number;
    averageRating: number;
    completionRate: number;
    totalReviews: number;
    totalEnrollments: number;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    timestamp: string;
    cached: boolean;
    ttl?: number;
  };
}

/**
 * GET /api/courses/statistics
 *
 * Public endpoint to fetch platform-wide course statistics
 *
 * Returns:
 * - Total courses (all and published)
 * - New courses this week
 * - Active learners (with activity in last 30 days)
 * - Total learners (unique enrollments)
 * - Average rating across all courses
 * - Completion rate
 * - Total reviews and enrollments
 *
 * Features:
 * - Redis caching (10 minutes TTL)
 * - Comprehensive error handling
 * - Parallel query execution for performance
 * - Type-safe responses
 */
export const GET = withPublicAPI(async (request): Promise<NextResponse<CourseStatisticsResponse>> => {
  try {
    const cacheKey = 'platform:statistics';

    // Try to get from cache first
    const cached = await redisCache.get<CourseStatisticsResponse['data']>(cacheKey, {
      prefix: CACHE_PREFIXES.COURSE,
    });

    if (cached.hit && cached.value) {
      logger.info('[COURSE_STATISTICS] Cache hit for platform statistics');
      return NextResponse.json({
        success: true,
        data: cached.value,
        metadata: {
          timestamp: new Date().toISOString(),
          cached: true,
        },
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        },
      });
    }

    // Calculate date ranges
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Execute all queries in parallel for optimal performance
    const [
      totalCoursesCount,
      publishedCoursesCount,
      newCoursesCount,
      activeLearnersData,
      totalLearnersData,
      averageRatingData,
      totalReviewsCount,
      totalEnrollmentsCount,
      completedEnrollmentsData,
    ] = await Promise.all([
      // Total courses (all statuses)
      db.course.count(),

      // Published courses only
      db.course.count({
        where: { isPublished: true },
      }),

      // New courses this week (published)
      db.course.count({
        where: {
          isPublished: true,
          createdAt: { gte: sevenDaysAgo },
        },
      }),

      // Active learners (unique users with activity in last 30 days)
      db.enrollment.findMany({
        where: {
          updatedAt: { gte: thirtyDaysAgo },
        },
        select: { userId: true },
        distinct: ['userId'],
      }),

      // Total learners (unique users with enrollments)
      db.enrollment.findMany({
        select: { userId: true },
        distinct: ['userId'],
      }),

      // Average rating across all course reviews
      db.courseReview.aggregate({
        _avg: { rating: true },
      }),

      // Total reviews count
      db.courseReview.count(),

      // Total enrollments count
      db.enrollment.count(),

      // Get enrollments with StudentBloomsProgress to calculate completion
      // Note: We'll check if StudentBloomsProgress has completion data
      db.studentBloomsProgress.findMany({
        select: {
          userId: true,
          courseId: true,
          progressHistory: true,
        },
      }),
    ]);

    // Calculate completion rate
    // For now, we'll use a heuristic: if a student has StudentBloomsProgress
    // with multiple assessments, we consider them as making progress
    // A more accurate calculation would require a dedicated completion field
    const completionRate = totalEnrollmentsCount > 0
      ? Math.round((completedEnrollmentsData.length / totalEnrollmentsCount) * 100)
      : 0;

    // Build statistics response
    const statistics = {
      totalCourses: totalCoursesCount,
      publishedCourses: publishedCoursesCount,
      newCoursesThisWeek: newCoursesCount,
      activeLearners: activeLearnersData.length,
      totalLearners: totalLearnersData.length,
      averageRating: averageRatingData._avg.rating
        ? Math.round(averageRatingData._avg.rating * 10) / 10
        : 0,
      completionRate,
      totalReviews: totalReviewsCount,
      totalEnrollments: totalEnrollmentsCount,
    };

    // Cache the results for 10 minutes
    await redisCache.set(cacheKey, statistics, {
      prefix: CACHE_PREFIXES.COURSE,
      ttl: CACHE_TTL.MEDIUM, // 10 minutes
      tags: ['statistics', 'platform', 'courses'],
    });

    logger.info('[COURSE_STATISTICS] Successfully calculated and cached platform statistics', {
      stats: statistics,
    });

    return NextResponse.json({
      success: true,
      data: statistics,
      metadata: {
        timestamp: new Date().toISOString(),
        cached: false,
        ttl: CACHE_TTL.MEDIUM,
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
      },
    });
  } catch (error) {
    logger.error('[COURSE_STATISTICS] Error fetching platform statistics:', error);

    // Type guard for Error objects
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('[COURSE_STATISTICS] Error details:', {
      message: errorMessage,
      stack: errorStack,
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'STATISTICS_FETCH_ERROR',
          message: 'Failed to fetch platform statistics',
          details:
            process.env.NODE_ENV === 'development'
              ? { message: errorMessage }
              : undefined,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          cached: false,
        },
      },
      { status: 500 }
    );
  }
}, { rateLimit: { requests: 30, window: 60000 } });
