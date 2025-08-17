import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { redisCache, CACHE_PREFIXES, CACHE_TTL, cacheHelpers } from '@/lib/cache/redis-cache';
import { logger } from '@/lib/logger';

// Type assertion for legacy code compatibility
const dbAny = db as any;

/**
 * Query Optimization Utilities
 * Provides optimized database queries with caching, pagination, and performance monitoring
 */

export interface QueryOptions {
  cache?: boolean;
  cacheTTL?: number;
  includeRelations?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: any;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
  maxPageSize?: number;
}

export interface QueryMetrics {
  queryTime: number;
  cacheHit: boolean;
  rowCount: number;
  cached?: boolean;
}

// Performance monitoring for queries
class QueryPerformanceMonitor {
  private metrics: Map<string, QueryMetrics[]> = new Map();

  recordMetric(queryName: string, metric: QueryMetrics) {
    if (!this.metrics.has(queryName)) {
      this.metrics.set(queryName, []);
    }
    const metrics = this.metrics.get(queryName)!;
    metrics.push(metric);
    
    // Keep only last 100 metrics per query
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  getAverageMetrics(queryName: string): {
    avgQueryTime: number;
    cacheHitRate: number;
    avgRowCount: number;
  } | null {
    const metrics = this.metrics.get(queryName);
    if (!metrics || metrics.length === 0) return null;

    const avgQueryTime = metrics.reduce((sum, m) => sum + m.queryTime, 0) / metrics.length;
    const cacheHits = metrics.filter(m => m.cacheHit).length;
    const cacheHitRate = (cacheHits / metrics.length) * 100;
    const avgRowCount = metrics.reduce((sum, m) => sum + m.rowCount, 0) / metrics.length;

    return { avgQueryTime, cacheHitRate, avgRowCount };
  }

  getAllMetrics() {
    const allMetrics: Record<string, any> = {};
    for (const [queryName, metrics] of this.metrics) {
      allMetrics[queryName] = this.getAverageMetrics(queryName);
    }
    return allMetrics;
  }
}

const performanceMonitor = new QueryPerformanceMonitor();

/**
 * Optimized Course Queries
 */
export const optimizedCourseQueries = {
  /**
   * Get course with optimized includes and caching
   */
  async getCourseWithDetails(
    courseId: string,
    userId?: string,
    options: QueryOptions = {}
  ) {
    const startTime = Date.now();
    const cacheKey = `course:${courseId}:${userId || 'public'}`;
    
    // Try cache first
    if (options.cache !== false) {
      const cached = await redisCache.get(cacheKey, {
        prefix: CACHE_PREFIXES.COURSE,
      });
      
      if (cached.hit && cached.value) {
        performanceMonitor.recordMetric('getCourseWithDetails', {
          queryTime: Date.now() - startTime,
          cacheHit: true,
          rowCount: 1,
          cached: true,
        });
        return cached.value;
      }
    }

    // Optimized query with selective includes
    const course = await dbAny.course.findUnique({
      where: { id: courseId },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            instructorRating: true,
          },
        },
        chapters: {
          where: { isPublished: true },
          orderBy: { position: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            position: true,
            isFree: true,
            _count: {
              select: { sections: true },
            },
          },
        },
        _count: {
          select: {
            Purchase: true,
            Enrollment: true,
            reviews: true,
          },
        },
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
        ...(userId && {
          Purchase: {
            where: { userId },
            take: 1,
          },
          Enrollment: {
            where: { userId },
            take: 1,
          },
        }),
      },
    });

    // Cache the result
    if (course && options.cache !== false) {
      await redisCache.set(cacheKey, course, {
        prefix: CACHE_PREFIXES.COURSE,
        ttl: options.cacheTTL || CACHE_TTL.LONG,
        tags: ['courses', `course:${courseId}`],
      });
    }

    performanceMonitor.recordMetric('getCourseWithDetails', {
      queryTime: Date.now() - startTime,
      cacheHit: false,
      rowCount: course ? 1 : 0,
    });

    return course;
  },

  /**
   * Get popular courses with caching
   */
  async getPopularCourses(limit: number = 10) {
    const startTime = Date.now();
    const cacheKey = `popular:${limit}`;

    // Try cache first
    const cached = await redisCache.get(cacheKey, {
      prefix: CACHE_PREFIXES.COURSE,
    });

    if (cached.hit && cached.value) {
      performanceMonitor.recordMetric('getPopularCourses', {
        queryTime: Date.now() - startTime,
        cacheHit: true,
        rowCount: (cached.value as any[]).length,
        cached: true,
      });
      return cached.value;
    }

    // Optimized query using enrollment count index
    const courses = await dbAny.course.findMany({
      where: {
        isPublished: true,
      } as any,
      orderBy: {
        createdAt: 'desc',
      } as any,
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        price: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });

    // Cache the result
    await redisCache.set(cacheKey, courses, {
      prefix: CACHE_PREFIXES.COURSE,
      ttl: CACHE_TTL.MEDIUM,
      tags: ['courses', 'popular'],
    });

    performanceMonitor.recordMetric('getPopularCourses', {
      queryTime: Date.now() - startTime,
      cacheHit: false,
      rowCount: courses.length,
    });

    return courses;
  },

  /**
   * Search courses with full-text search and caching
   */
  async searchCourses(
    query: string,
    filters: {
      categoryId?: string;
      minPrice?: number;
      maxPrice?: number;
      userId?: string;
    } = {},
    pagination: PaginationOptions = { page: 1, pageSize: 20 }
  ) {
    const startTime = Date.now();
    const cacheKey = `search:${JSON.stringify({ query, filters, pagination })}`;

    // Try cache first
    const cached = await redisCache.get(cacheKey, {
      prefix: CACHE_PREFIXES.SEARCH,
    });

    if (cached.hit && cached.value) {
      performanceMonitor.recordMetric('searchCourses', {
        queryTime: Date.now() - startTime,
        cacheHit: true,
        rowCount: (cached.value as any).courses.length,
        cached: true,
      });
      return cached.value;
    }

    // Build where clause
    const where: any = {
      isPublished: true,
      ...(query && {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      }),
      ...(filters.categoryId && { categoryId: filters.categoryId }),
      ...(filters.minPrice !== undefined && {
        price: { gte: filters.minPrice },
      }),
      ...(filters.maxPrice !== undefined && {
        price: { lte: filters.maxPrice },
      }),
      ...(filters.userId && { userId: filters.userId }),
    };

    // Execute count and data queries in parallel
    const [totalCount, courses] = await Promise.all([
      dbAny.course.count({ where }),
      dbAny.course.findMany({
        where,
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        orderBy: [
          { enrollmentCount: 'desc' },
          { createdAt: 'desc' },
        ],
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          price: true,
          enrollmentCount: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          user: {
            select: {
              name: true,
              image: true,
            },
          },
          _count: {
            select: {
              chapters: true,
              reviews: true,
            },
          },
        },
      }),
    ]);

    const result = {
      courses,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages: Math.ceil(totalCount / pagination.pageSize),
        totalCount,
      },
    };

    // Cache the result
    await redisCache.set(cacheKey, result, {
      prefix: CACHE_PREFIXES.SEARCH,
      ttl: CACHE_TTL.SHORT,
      tags: ['search', 'courses'],
    });

    performanceMonitor.recordMetric('searchCourses', {
      queryTime: Date.now() - startTime,
      cacheHit: false,
      rowCount: courses.length,
    });

    return result;
  },
};

/**
 * Optimized User Queries
 */
export const optimizedUserQueries = {
  /**
   * Get user profile with related data
   */
  async getUserProfile(userId: string) {
    const startTime = Date.now();
    const cacheKey = `profile:${userId}`;

    // Try cache first
    const cached = await redisCache.get(cacheKey, {
      prefix: CACHE_PREFIXES.USER,
    });

    if (cached.hit && cached.value) {
      performanceMonitor.recordMetric('getUserProfile', {
        queryTime: Date.now() - startTime,
        cacheHit: true,
        rowCount: 1,
        cached: true,
      });
      return cached.value;
    }

    // Optimized query with selective includes
    const user = await dbAny.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        isTeacher: true,
        instructorRating: true,
        totalCoursesCreated: true,
        totalCoursesSold: true,
        totalRevenue: true,
        samLevel: true,
        samTotalPoints: true,
        _count: {
          select: {
            courses: true,
            Enrollment: true,
            Post: true,
            userBadges: true,
          },
        },
      },
    });

    // Cache the result
    if (user) {
      await redisCache.set(cacheKey, user, {
        prefix: CACHE_PREFIXES.USER,
        ttl: CACHE_TTL.MEDIUM,
        tags: ['users', `user:${userId}`],
      });
    }

    performanceMonitor.recordMetric('getUserProfile', {
      queryTime: Date.now() - startTime,
      cacheHit: false,
      rowCount: user ? 1 : 0,
    });

    return user;
  },

  /**
   * Get user enrollments with progress
   */
  async getUserEnrollments(
    userId: string,
    pagination: PaginationOptions = { page: 1, pageSize: 10 }
  ) {
    const startTime = Date.now();
    const cacheKey = `enrollments:${userId}:${pagination.page}:${pagination.pageSize}`;

    // Try cache first
    const cached = await redisCache.get(cacheKey, {
      prefix: CACHE_PREFIXES.ENROLLMENT,
    });

    if (cached.hit && cached.value) {
      performanceMonitor.recordMetric('getUserEnrollments', {
        queryTime: Date.now() - startTime,
        cacheHit: true,
        rowCount: (cached.value as any).enrollments.length,
        cached: true,
      });
      return cached.value;
    }

    // Execute count and data queries in parallel
    const [totalCount, enrollments] = await Promise.all([
      dbAny.enrollment.count({ where: { userId } }),
      dbAny.enrollment.findMany({
        where: { userId },
        skip: (pagination.page - 1) * pagination.pageSize,
        take: pagination.pageSize,
        orderBy: { enrolledAt: 'desc' },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              imageUrl: true,
              user: {
                select: {
                  name: true,
                  image: true,
                },
              },
              _count: {
                select: {
                  chapters: true,
                },
              },
            },
          },
        },
      }),
    ]);

    // Get progress for each enrollment
    const enrollmentsWithProgress = await Promise.all(
      enrollments.map(async (enrollment: any) => {
        const progress = await dbAny.userCourseEnrollment.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId: enrollment.courseId,
            },
          },
          select: {
            progressPercentage: true,
            completedChapters: true,
            lastAccessedAt: true,
          },
        });

        return {
          ...enrollment,
          progress,
        };
      })
    );

    const result = {
      enrollments: enrollmentsWithProgress,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages: Math.ceil(totalCount / pagination.pageSize),
        totalCount,
      },
    };

    // Cache the result
    await redisCache.set(cacheKey, result, {
      prefix: CACHE_PREFIXES.ENROLLMENT,
      ttl: CACHE_TTL.SHORT,
      tags: ['enrollments', `user:${userId}`],
    });

    performanceMonitor.recordMetric('getUserEnrollments', {
      queryTime: Date.now() - startTime,
      cacheHit: false,
      rowCount: enrollments.length,
    });

    return result;
  },
};

/**
 * Optimized Analytics Queries
 */
export const optimizedAnalyticsQueries = {
  /**
   * Get course analytics with caching
   */
  async getCourseAnalytics(courseId: string, dateRange?: { start: Date; end: Date }) {
    const startTime = Date.now();
    const cacheKey = `analytics:course:${courseId}:${dateRange?.start}:${dateRange?.end}`;

    // Try cache first
    const cached = await redisCache.get(cacheKey, {
      prefix: CACHE_PREFIXES.ANALYTICS,
    });

    if (cached.hit && cached.value) {
      performanceMonitor.recordMetric('getCourseAnalytics', {
        queryTime: Date.now() - startTime,
        cacheHit: true,
        rowCount: 1,
        cached: true,
      });
      return cached.value;
    }

    // Build date filter
    const dateFilter = dateRange
      ? {
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end,
          },
        }
      : {};

    // Execute multiple analytics queries in parallel
    const [
      totalEnrollments,
      totalRevenue,
      completionRate,
      averageRating,
      recentActivity,
    ] = await Promise.all([
      // Total enrollments
      dbAny.enrollment.count({
        where: {
          courseId,
          ...dateFilter,
        },
      }),

      // Total revenue
      dbAny.purchase.aggregate({
        where: {
          courseId,
          ...dateFilter,
        },
        _sum: {
          amount: true,
        },
      }),

      // Completion rate
      dbAny.userCourseEnrollment.aggregate({
        where: {
          courseId,
          progressPercentage: {
            gte: 100,
          },
        },
        _count: true,
      }),

      // Average rating
      dbAny.courseReview.aggregate({
        where: { courseId },
        _avg: {
          rating: true,
        },
        _count: true,
      }),

      // Recent activity
      dbAny.learning_sessions.findMany({
        where: {
          course_id: courseId,
          ...dateFilter,
        },
        orderBy: { started_at: 'desc' },
        take: 10,
        select: {
          user_id: true,
          started_at: true,
          ended_at: true,
          duration_minutes: true,
        },
      }),
    ]);

    const analytics = {
      courseId,
      totalEnrollments,
      totalRevenue: totalRevenue._sum.amount || 0,
      completionRate: totalEnrollments > 0
        ? (completionRate._count / totalEnrollments) * 100
        : 0,
      averageRating: averageRating._avg.rating || 0,
      totalReviews: averageRating._count,
      recentActivity,
      dateRange,
      generatedAt: new Date(),
    };

    // Cache the result
    await redisCache.set(cacheKey, analytics, {
      prefix: CACHE_PREFIXES.ANALYTICS,
      ttl: CACHE_TTL.SHORT,
      tags: ['analytics', `course:${courseId}`],
    });

    performanceMonitor.recordMetric('getCourseAnalytics', {
      queryTime: Date.now() - startTime,
      cacheHit: false,
      rowCount: 1,
    });

    return analytics;
  },

  /**
   * Get platform-wide analytics
   */
  async getPlatformAnalytics() {
    const startTime = Date.now();
    const cacheKey = 'platform:analytics';

    // Try cache first
    const cached = await redisCache.get(cacheKey, {
      prefix: CACHE_PREFIXES.ANALYTICS,
    });

    if (cached.hit && cached.value) {
      performanceMonitor.recordMetric('getPlatformAnalytics', {
        queryTime: Date.now() - startTime,
        cacheHit: true,
        rowCount: 1,
        cached: true,
      });
      return cached.value;
    }

    // Execute multiple analytics queries in parallel
    const [
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalRevenue,
      activeUsers,
      newUsersToday,
      topCourses,
    ] = await Promise.all([
      dbAny.user.count(),
      dbAny.course.count({ where: { isPublished: true } }),
      dbAny.enrollment.count(),
      dbAny.purchase.aggregate({ _sum: { amount: true } }),
      dbAny.learning_sessions.groupBy({
        by: ['user_id'],
        where: {
          started_at: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        _count: true,
      }),
      dbAny.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      dbAny.course.findMany({
        where: { isPublished: true },
        orderBy: { enrollmentCount: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          enrollmentCount: true,
        },
      }),
    ]);

    const analytics = {
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalRevenue: totalRevenue._sum.amount || 0,
      activeUsersLast7Days: activeUsers.length,
      newUsersToday,
      topCourses,
      generatedAt: new Date(),
    };

    // Cache the result
    await redisCache.set(cacheKey, analytics, {
      prefix: CACHE_PREFIXES.ANALYTICS,
      ttl: CACHE_TTL.MEDIUM,
      tags: ['analytics', 'platform'],
    });

    performanceMonitor.recordMetric('getPlatformAnalytics', {
      queryTime: Date.now() - startTime,
      cacheHit: false,
      rowCount: 1,
    });

    return analytics;
  },
};

/**
 * Optimized Progress Tracking Queries
 */
export const optimizedProgressQueries = {
  /**
   * Get user course progress
   */
  async getUserCourseProgress(userId: string, courseId: string) {
    const startTime = Date.now();
    const cacheKey = `progress:${userId}:${courseId}`;

    // Try cache first
    const cached = await redisCache.get(cacheKey, {
      prefix: CACHE_PREFIXES.PROGRESS,
    });

    if (cached.hit && cached.value) {
      performanceMonitor.recordMetric('getUserCourseProgress', {
        queryTime: Date.now() - startTime,
        cacheHit: true,
        rowCount: 1,
        cached: true,
      });
      return cached.value;
    }

    // Get progress data
    const [enrollment, completedChapters, completedSections, totalChapters, totalSections] =
      await Promise.all([
        dbAny.userCourseEnrollment.findUnique({
          where: {
            userId_courseId: { userId, courseId },
          },
        }),
        dbAny.userChapterCompletion.count({
          where: {
            userId,
            chapter: {
              courseId,
            },
          },
        }),
        dbAny.userSectionCompletion.count({
          where: {
            userId,
            section: {
              chapter: {
                courseId,
              },
            },
          },
        }),
        dbAny.chapter.count({
          where: {
            courseId,
            isPublished: true,
          },
        }),
        dbAny.section.count({
          where: {
            chapter: {
              courseId,
            },
            isPublished: true,
          },
        }),
      ]);

    const progress = {
      userId,
      courseId,
      enrollmentStatus: enrollment ? 'enrolled' : 'not-enrolled',
      progressPercentage: totalSections > 0
        ? Math.round((completedSections / totalSections) * 100)
        : 0,
      completedChapters,
      totalChapters,
      completedSections,
      totalSections,
      lastAccessedAt: enrollment?.lastAccessedAt,
    };

    // Cache the result
    await redisCache.set(cacheKey, progress, {
      prefix: CACHE_PREFIXES.PROGRESS,
      ttl: CACHE_TTL.SHORT,
      tags: ['progress', `user:${userId}`, `course:${courseId}`],
    });

    performanceMonitor.recordMetric('getUserCourseProgress', {
      queryTime: Date.now() - startTime,
      cacheHit: false,
      rowCount: 1,
    });

    return progress;
  },
};

/**
 * Cache invalidation helpers
 */
export const cacheInvalidation = {
  // Invalidate course-related caches
  async invalidateCourse(courseId: string) {
    await Promise.all([
      redisCache.invalidatePattern(`${CACHE_PREFIXES.COURSE}*${courseId}*`),
      redisCache.invalidateByTags([`course:${courseId}`]),
    ]);
    logger.info(`Invalidated cache for course: ${courseId}`);
  },

  // Invalidate user-related caches
  async invalidateUser(userId: string) {
    await Promise.all([
      redisCache.invalidatePattern(`${CACHE_PREFIXES.USER}*${userId}*`),
      redisCache.invalidatePattern(`${CACHE_PREFIXES.ENROLLMENT}*${userId}*`),
      redisCache.invalidatePattern(`${CACHE_PREFIXES.PROGRESS}*${userId}*`),
      redisCache.invalidateByTags([`user:${userId}`]),
    ]);
    logger.info(`Invalidated cache for user: ${userId}`);
  },

  // Invalidate analytics caches
  async invalidateAnalytics() {
    await redisCache.invalidatePattern(`${CACHE_PREFIXES.ANALYTICS}*`);
    await redisCache.invalidateByTags(['analytics']);
    logger.info('Invalidated analytics cache');
  },

  // Invalidate search caches
  async invalidateSearch() {
    await redisCache.invalidatePattern(`${CACHE_PREFIXES.SEARCH}*`);
    await redisCache.invalidateByTags(['search']);
    logger.info('Invalidated search cache');
  },
};

/**
 * Export performance metrics
 */
export function getQueryPerformanceMetrics() {
  return performanceMonitor.getAllMetrics();
}

/**
 * Utility to wrap any query with caching
 */
export async function withCache<T>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  options: {
    prefix?: string;
    ttl?: number;
    tags?: string[];
  } = {}
): Promise<T> {
  // Try cache first
  const cached = await redisCache.get<T>(cacheKey, {
    prefix: options.prefix,
  });

  if (cached.hit && cached.value !== null) {
    return cached.value;
  }

  // Execute query
  const result = await queryFn();

  // Cache the result
  if (result !== null && result !== undefined) {
    await redisCache.set(cacheKey, result, {
      prefix: options.prefix,
      ttl: options.ttl || CACHE_TTL.MEDIUM,
      tags: options.tags,
    });
  }

  return result;
}