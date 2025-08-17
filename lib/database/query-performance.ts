/**
 * Database Query Performance Optimization
 * Centralized query patterns and performance utilities
 */

import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * Optimized query patterns to prevent N+1 problems
 */
export class OptimizedQueries {
  /**
   * Get courses with all related data in a single query
   * Prevents N+1 problem when fetching course progress
   */
  static async getCoursesWithProgress(
    userId: string,
    filters?: {
      categoryId?: string;
      title?: string;
      isPublished?: boolean;
    }
  ) {
    const courses = await db.course.findMany({
      where: {
        isPublished: filters?.isPublished ?? true,
        categoryId: filters?.categoryId,
        title: filters?.title ? {
          contains: filters.title,
          mode: 'insensitive'
        } : undefined,
      },
      include: {
        category: true,
        chapters: {
          where: { isPublished: true },
          select: {
            id: true,
            title: true,
            position: true,
          }
        },
        Enrollment: {
          where: { userId },
          select: {
            id: true,
            userId: true,
            createdAt: true,
          }
        },
        Purchase: {
          where: { userId },
          select: {
            id: true,
            createdAt: true,
          }
        },
        _count: {
          select: {
            chapters: true,
            Enrollment: true,
            Purchase: true,
            reviews: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Batch load progress for enrolled courses
    const enrolledCourseIds = courses
      .filter(c => c.Enrollment.length > 0)
      .map(c => c.id);

    const progressData = await this.batchLoadCourseProgress(userId, enrolledCourseIds);

    return courses.map(course => ({
      ...course,
      progress: progressData.get(course.id) || null,
    }));
  }

  /**
   * Batch load course progress to prevent N+1 queries
   */
  static async batchLoadCourseProgress(
    userId: string,
    courseIds: string[]
  ): Promise<Map<string, number>> {
    if (courseIds.length === 0) {
      return new Map();
    }

    const progressRecords = await db.userCourseEnrollment.findMany({
      where: {
        userId,
        courseId: { in: courseIds },
      },
      select: {
        courseId: true,
        completedChapterIds: true,
      }
    });

    const chapterCounts = await db.chapter.groupBy({
      by: ['courseId'],
      where: {
        courseId: { in: courseIds },
        isPublished: true,
      },
      _count: {
        id: true,
      }
    });

    const progressMap = new Map<string, number>();

    for (const record of progressRecords) {
      const totalChapters = chapterCounts.find(
        c => c.courseId === record.courseId
      )?._count.id || 0;

      if (totalChapters > 0) {
        const progress = (record.completedChapterIds.length / totalChapters) * 100;
        progressMap.set(record.courseId, Math.round(progress));
      }
    }

    return progressMap;
  }

  /**
   * Get dashboard data with optimized queries
   */
  static async getDashboardData(userId: string) {
    // Use a single query with all necessary includes
    const [enrollments, purchases, userProgress] = await Promise.all([
      db.enrollment.findMany({
        where: { userId },
        include: {
          Course: {
            include: {
              category: true,
              chapters: {
                where: { isPublished: true },
                select: {
                  id: true,
                  title: true,
                }
              },
              _count: {
                select: {
                  chapters: true,
                  reviews: true,
                }
              }
            }
          }
        }
      }),
      db.purchase.findMany({
        where: { userId },
        select: {
          courseId: true,
          createdAt: true,
        }
      }),
      db.userCourseEnrollment.findMany({
        where: { userId },
        select: {
          courseId: true,
          completedChapterIds: true,
        }
      })
    ]);

    const progressMap = new Map(
      userProgress.map((p: any) => [p.courseId, p.completedChapterIds])
    );

    const coursesWithProgress = enrollments.map((enrollment: any) => {
      const completedChapterIds = progressMap.get(enrollment.Course.id) || [];
      const totalChapters = enrollment.Course.chapters.length;
      const progress = totalChapters > 0
        ? Math.round(((completedChapterIds as string[]).length / totalChapters) * 100)
        : 0;

      return {
        ...enrollment.Course,
        progress,
        isPurchased: purchases.some((p: any) => p.courseId === enrollment.Course.id),
      };
    });

    return {
      completedCourses: coursesWithProgress.filter((c: any) => c.progress === 100),
      coursesInProgress: coursesWithProgress.filter((c: any) => c.progress < 100),
      totalCourses: coursesWithProgress.length,
      averageProgress: coursesWithProgress.reduce((acc: any, c: any) => acc + c.progress, 0) / 
                       (coursesWithProgress.length || 1),
    };
  }

  /**
   * Get course with all content in optimized query
   */
  static async getCourseWithFullContent(courseId: string) {
    return await db.course.findUnique({
      where: { id: courseId },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          }
        },
        chapters: {
          where: { isPublished: true },
          orderBy: { position: 'asc' },
          include: {
            sections: {
              orderBy: { position: 'asc' },
              include: {
                videos: {
                  select: {
                    id: true,
                    title: true,
                    url: true,
                    duration: true,
                  }
                },
                articles: {
                  select: {
                    id: true,
                    title: true,
                    content: true,
                  }
                },
                _count: {
                  select: {
                    videos: true,
                    articles: true,
                    blogs: true,
                    notes: true,
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            chapters: true,
            Enrollment: true,
            Purchase: true,
            reviews: true,
          }
        }
      }
    });
  }

  /**
   * Batch load user enrollments
   */
  static async batchLoadEnrollments(
    userIds: string[],
    courseIds?: string[]
  ) {
    const where: Prisma.EnrollmentWhereInput = {
      userId: { in: userIds },
      ...(courseIds && { courseId: { in: courseIds } }),
    };

    const enrollments = await db.enrollment.findMany({
      where,
      select: {
        id: true,
        userId: true,
        courseId: true,
        createdAt: true,
      }
    });

    // Create a map for quick lookup
    const enrollmentMap = new Map<string, typeof enrollments>();
    
    for (const enrollment of enrollments) {
      const key = `${enrollment.userId}:${enrollment.courseId}`;
      const userEnrollments = enrollmentMap.get(enrollment.userId) || [];
      userEnrollments.push(enrollment);
      enrollmentMap.set(enrollment.userId, userEnrollments);
    }

    return enrollmentMap;
  }

  /**
   * Get posts with optimized comment loading
   */
  static async getPostsWithComments(
    limit = 10,
    offset = 0,
    userId?: string
  ) {
    const posts = await db.post.findMany({
      take: limit,
      skip: offset,
      where: {
        published: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        comments: {
          take: 3, // Limit initial comments
          orderBy: { createdAt: 'desc' },
          include: {
            User: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          }
        },
        _count: {
          select: {
            comments: true,
            // likes: true, // PostLike model doesn't exist
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // If user is provided, batch load their likes
    if (userId) {
      const postIds = posts.map(p => p.id);
      // const userLikes = await db.postLike.findMany({
      //   where: {
      //     userId,
      //     postId: { in: postIds },
      //   },
      //   select: {
      //     postId: true,
      //   }
      // }); // PostLike model doesn't exist

      const likedPostIds = new Set(userLikes.map((l: any) => l.postId));

      return posts.map(post => ({
        ...post,
        isLikedByUser: likedPostIds.has(post.id),
      }));
    }

    return posts;
  }
}

/**
 * Query performance monitoring
 */
export class QueryPerformanceMonitor {
  private static queryMetrics = new Map<string, {
    count: number;
    totalTime: number;
    avgTime: number;
    maxTime: number;
  }>();

  /**
   * Wrap a query with performance monitoring
   */
  static async monitorQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await queryFn();
      const duration = performance.now() - startTime;
      
      this.recordMetric(queryName, duration);
      
      if (duration > 1000) {
        logger.warn(`Slow query detected: ${queryName} took ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error(`Query failed: ${queryName} after ${duration}ms`, error as Error);
      throw error;
    }
  }

  private static recordMetric(queryName: string, duration: number) {
    const existing = this.queryMetrics.get(queryName) || {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      maxTime: 0,
    };

    existing.count++;
    existing.totalTime += duration;
    existing.avgTime = existing.totalTime / existing.count;
    existing.maxTime = Math.max(existing.maxTime, duration);

    this.queryMetrics.set(queryName, existing);
  }

  /**
   * Get performance report
   */
  static getReport() {
    const report: any[] = [];
    
    for (const [queryName, metrics] of Array.from(this.queryMetrics.entries())) {
      report.push({
        query: queryName,
        ...metrics,
        avgTime: Math.round(metrics.avgTime),
        maxTime: Math.round(metrics.maxTime),
      });
    }

    return report.sort((a, b) => b.avgTime - a.avgTime);
  }

  /**
   * Reset metrics
   */
  static reset() {
    this.queryMetrics.clear();
  }
}

/**
 * Database connection pooling optimization
 */
export class ConnectionPoolOptimizer {
  /**
   * Get optimized connection settings based on environment
   */
  static getOptimalPoolSettings() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    return {
      connection_limit: isProduction ? 20 : 5,
      pool_timeout: 10,
      idle_in_transaction_session_timeout: 10,
      statement_timeout: 30000, // 30 seconds
    };
  }

  /**
   * Monitor connection pool health
   */
  static async checkPoolHealth() {
    try {
      const result = await db.$queryRaw`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections,
          count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
        FROM pg_stat_activity
        WHERE datname = current_database()
      `;

      return result;
    } catch (error) {
      logger.error('Failed to check pool health', error as Error);
      return null;
    }
  }
}

/**
 * Query caching utilities
 */
export class QueryCache {
  private static cache = new Map<string, {
    data: any;
    timestamp: number;
    ttl: number;
  }>();

  /**
   * Get or set cached query result
   */
  static async getOrSet<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttlSeconds = 60
  ): Promise<T> {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl * 1000) {
      return cached.data as T;
    }

    const data = await queryFn();
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds,
    });

    // Clean up old entries
    this.cleanup();

    return data;
  }

  /**
   * Invalidate cache entries
   */
  static invalidate(pattern?: string) {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of Array.from(this.cache.keys())) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  private static cleanup() {
    const now = Date.now();
    
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        this.cache.delete(key);
      }
    }
  }
}