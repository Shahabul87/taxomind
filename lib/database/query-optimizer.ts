/**
 * Database Query Optimizer
 * Provides optimized query patterns and utilities to prevent N+1 queries
 */

import { db } from "../db";
import { Prisma } from "@prisma/client";
import { logger } from '../logger';

// Type definitions for optimized queries
export type OptimizedCourseQuery = Prisma.CourseGetPayload<{
  include: {
    category: true;
    user: true;
    chapters: {
      include: {
        sections: {
          include: {
            videos: true;
            blogs: true;
            articles: true;
            notes: true;
            exams: {
              include: {
                ExamQuestion: true;
              };
            };
          };
        };
      };
    };
    Enrollment: true;
    reviews: true;
  };
}>;

export type OptimizedUserProgressQuery = Prisma.user_progressGetPayload<{
  select: {
    id: true;
    userId: true;
    courseId: true;
    chapterId: true;
    sectionId: true;
    isCompleted: true;
    progressPercent: true;
    timeSpent: true;
    lastAccessedAt: true;
  };
}>;

/**
 * Optimized Course Queries
 */
export class CourseQueryOptimizer {
  /**
   * Get course with all related data - optimized to prevent N+1 queries
   */
  static async getCourseWithFullDetails(courseId: string, userId?: string) {
    const baseQuery = {
      where: { id: courseId },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        chapters: {
          orderBy: { position: "asc" as const },
          include: {
            sections: {
              orderBy: { position: "asc" as const },
              include: {
                videos: {
                  orderBy: { position: "asc" as const },
                },
                blogs: {
                  orderBy: { position: "asc" as const },
                },
                articles: {
                  orderBy: { createdAt: "desc" as const },
                },
                notes: {
                  orderBy: { position: "asc" as const },
                },
                exams: {
                  where: { isPublished: true },
                  orderBy: { createdAt: "desc" as const },
                  include: {
                    ExamQuestion: {
                      orderBy: { order: "asc" as const },
                      select: {
                        id: true,
                        question: true,
                        questionType: true,
                        options: true,
                        points: true,
                        order: true,
                        bloomsLevel: true,
                        // Don't include correct answers for security
                      },
                    },
                    UserExamAttempt: userId ? {
                      where: { userId },
                      select: {
                        id: true,
                        attemptNumber: true,
                        score: true,
                        passed: true,
                        startedAt: true,
                        completedAt: true,
                      },
                    } : false,
                  },
                },
                userSectionCompletions: userId ? {
                  where: { userId },
                  select: {
                    progress: true,
                    completedAt: true,
                    startedAt: true,
                  },
                } : false,
              },
            },
            userChapterCompletions: userId ? {
              where: { userId },
              select: {
                progress: true,
                completedAt: true,
                startedAt: true,
              },
            } : false,
          },
        },
        userCourseEnrollments: userId ? {
          where: { userId },
          select: {
            enrolledAt: true,
            completedAt: true,
            lastAccessedAt: true,
            progress: true,
          },
        } : false,
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" as const },
          take: 10,
        },
        _count: {
          select: {
            Enrollment: true,
            reviews: true,
            chapters: true,
          },
        },
      },
    };

    return await db.course.findUnique(baseQuery);
  }

  /**
   * Get courses with pagination and filtering - optimized
   */
  static async getCoursesWithFilters({
    userId,
    categoryId,
    isPublished = true,
    isFeatured,
    search,
    skip = 0,
    take = 10,
    orderBy = "createdAt",
    orderDirection = "desc",
  }: {
    userId?: string;
    categoryId?: string;
    isPublished?: boolean;
    isFeatured?: boolean;
    search?: string;
    skip?: number;
    take?: number;
    orderBy?: "createdAt" | "updatedAt" | "title";
    orderDirection?: "asc" | "desc";
  }) {
    const where: Prisma.CourseWhereInput = {
      isPublished,
      ...(categoryId && { categoryId }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [courses, total] = await Promise.all([
      db.course.findMany({
        where,
        skip,
        take,
        orderBy: { [orderBy]: orderDirection },
        include: {
          category: true,
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          Purchase: userId ? {
            where: { userId },
            select: {
              createdAt: true,
            },
          } : false,
          _count: {
            select: {
              Purchase: true,
              reviews: true,
              chapters: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      }),
      db.course.count({ where }),
    ]);

    return { courses, total };
  }

  /**
   * Get teacher's courses with analytics - optimized
   */
  static async getTeacherCoursesWithAnalytics(userId: string) {
    return await db.course.findMany({
      where: { userId },
      include: {
        category: true,
        _count: {
          select: {
            Enrollment: true,
            reviews: true,
            chapters: true,
          },
        },
        Enrollment: {
          select: {
            createdAt: true,
            User: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        reviews: {
          select: {
            rating: true,
            createdAt: true,
          },
        },
        samInteractions: {
          select: {
            interactionType: true,
            createdAt: true,
            context: true,
          },
          orderBy: { createdAt: "desc" },
          take: 100,
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

/**
 * Optimized User Progress Queries
 */
export class ProgressQueryOptimizer {
  /**
   * Get user progress for a course - optimized
   */
  static async getUserCourseProgress(userId: string, courseId: string) {
    const [courseProgress, chapterProgress, sectionProgress] = await Promise.all([
      db.userCourseEnrollment.findUnique({
        where: {
          userId_courseId: { userId, courseId },
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              _count: {
                select: {
                  chapters: true,
                },
              },
            },
          },
        },
      }),
      db.userChapterCompletion.findMany({
        where: {
          userId,
          chapter: { courseId },
        },
        include: {
          chapter: {
            select: {
              id: true,
              title: true,
              position: true,
            },
          },
        },
      }),
      db.userSectionCompletion.findMany({
        where: {
          userId,
          section: {
            chapter: { courseId },
          },
        },
        include: {
          section: {
            select: {
              id: true,
              title: true,
              position: true,
              chapterId: true,
            },
          },
        },
      }),
    ]);

    return {
      courseProgress,
      chapterProgress,
      sectionProgress,
    };
  }

  /**
   * Get user progress across all courses - optimized
   */
  static async getUserAllCoursesProgress(userId: string) {
    return await db.userCourseEnrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            category: {
              select: {
                id: true,
                name: true,
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
      orderBy: { lastAccessedAt: "desc" },
    });
  }

  /**
   * Get detailed analytics for a specific course - optimized
   */
  static async getCourseAnalytics(courseId: string, userId?: string) {
    const where = userId ? { courseId, studentId: userId } : { courseId };

    const [
      enrollmentStats,
      progressStats,
      interactionStats,
      examStats,
    ] = await Promise.all([
      db.userCourseEnrollment.aggregate({
        where: { courseId },
        _count: true,
        _avg: {
          progress: true,
        },
      }),
      db.userSectionCompletion.aggregate({
        where: {
          section: { chapter: { courseId } },
          ...(userId && { userId }),
        },
        _count: true,
        _avg: {
          timeSpent: true,
        },
      }),
      db.sAMInteraction.aggregate({
        where,
        _count: true,
        _avg: {
          // Note: would need to parse metadata for numeric values
        },
      }),
      db.userExamAttempt.aggregate({
        where: {
          Exam: { section: { chapter: { courseId } } },
          ...(userId && { userId }),
        },
        _count: true,
        _avg: {
          scorePercentage: true,
        },
      }),
    ]);

    return {
      enrollmentStats,
      progressStats,
      interactionStats,
      examStats,
    };
  }
}

/**
 * Optimized Exam Queries
 */
export class ExamQueryOptimizer {
  /**
   * Get exam with questions and user attempts - optimized
   */
  static async getExamWithDetails(examId: string, userId?: string) {
    return await db.exam.findUnique({
      where: { id: examId },
      include: {
        section: {
          select: {
            id: true,
            title: true,
            chapter: {
              select: {
                id: true,
                title: true,
                course: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
        ExamQuestion: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            question: true,
            questionType: true,
            options: true,
            points: true,
            order: true,
            bloomsLevel: true,
            // Don't include correct answers for security
          },
        },
        UserExamAttempt: userId ? {
          where: { userId },
          orderBy: { attemptNumber: "desc" },
          include: {
            UserAnswer: {
              include: {
                ExamQuestion: {
                  select: {
                    id: true,
                    question: true,
                    questionType: true,
                    correctAnswer: true,
                    explanation: true,
                  },
                },
              },
            },
          },
        } : false,
        _count: {
          select: {
            ExamQuestion: true,
            UserExamAttempt: true,
          },
        },
      },
    });
  }

  /**
   * Get exam analytics - optimized
   */
  static async getExamAnalytics(examId: string) {
    const [
      examStats,
      questionStats,
      attemptStats,
    ] = await Promise.all([
      db.exam.findUnique({
        where: { id: examId },
        select: {
          id: true,
          title: true,
          passingScore: true,
          _count: {
            select: {
              ExamQuestion: true,
              UserExamAttempt: true,
            },
          },
        },
      }),
      db.examQuestion.findMany({
        where: { examId },
        select: {
          id: true,
          question: true,
          questionType: true,
          points: true,
          bloomsLevel: true,
          _count: {
            select: {
              UserAnswer: true,
            },
          },
          UserAnswer: {
            select: {
              isCorrect: true,
              pointsEarned: true,
            },
          },
        },
      }),
      db.userExamAttempt.aggregate({
        where: { examId },
        _count: true,
        _avg: {
          scorePercentage: true,
          timeSpent: true,
        },
        _max: {
          scorePercentage: true,
        },
        _min: {
          scorePercentage: true,
        },
      }),
    ]);

    return {
      examStats,
      questionStats,
      attemptStats,
    };
  }
}

/**
 * Batch Query Utilities
 */
export class BatchQueryOptimizer {
  /**
   * Batch load user progress for multiple courses
   */
  static async batchLoadUserProgress(userId: string, courseIds: string[]) {
    const progressMap = new Map();

    const [courseProgress, chapterProgress, sectionProgress] = await Promise.all([
      db.userCourseEnrollment.findMany({
        where: {
          userId,
          courseId: { in: courseIds },
        },
      }),
      db.userChapterCompletion.findMany({
        where: {
          userId,
          chapter: { courseId: { in: courseIds } },
        },
        include: {
          chapter: {
            select: {
              courseId: true,
            },
          },
        },
      }),
      db.userSectionCompletion.findMany({
        where: {
          userId,
          section: {
            chapter: { courseId: { in: courseIds } },
          },
        },
        include: {
          section: {
            select: {
              chapterId: true,
              chapter: {
                select: {
                  courseId: true,
                },
              },
            },
          },
        },
      }),
    ]);

    courseIds.forEach(courseId => {
      progressMap.set(courseId, {
        courseProgress: courseProgress.find(p => p.courseId === courseId),
        chapterProgress: chapterProgress.filter(p => p.chapter.courseId === courseId),
        sectionProgress: sectionProgress.filter(p => p.section.chapter.courseId === courseId),
      });
    });

    return progressMap;
  }

  /**
   * Batch load analytics for multiple courses
   */
  static async batchLoadCourseAnalytics(courseIds: string[]) {
    const analyticsMap = new Map();

    const [enrollments, interactions, examAttempts] = await Promise.all([
      db.userCourseEnrollment.groupBy({
        by: ["courseId"],
        where: { courseId: { in: courseIds } },
        _count: true,
        _avg: {
          progress: true,
        },
      }),
      db.sAMInteraction.groupBy({
        by: ["courseId"],
        where: { courseId: { in: courseIds } },
        _count: true,
      }),
      db.userExamAttempt.groupBy({
        by: ["examId"],
        where: {
          Exam: {
            section: {
              chapter: { courseId: { in: courseIds } },
            },
          },
        },
        _count: true,
        _avg: {
          scorePercentage: true,
        },
      }),
    ]);

    courseIds.forEach((courseId: string) => {
      analyticsMap.set(courseId, {
        Enrollment: enrollments.find((e: any) => e.courseId === courseId),
        interactions: interactions.find((i: any) => i.courseId === courseId),
        examAttempts: examAttempts.filter((a: any) => 
          // Note: would need to resolve exam to course relationship
          a.examId // simplified filter
        ),
      });
    });

    return analyticsMap;
  }
}

/**
 * Database Connection Pool Manager
 */
export class ConnectionPoolManager {
  private static instance: ConnectionPoolManager;
  private poolSize: number = 10;
  private connectionTimeout: number = 30000;

  static getInstance(): ConnectionPoolManager {
    if (!ConnectionPoolManager.instance) {
      ConnectionPoolManager.instance = new ConnectionPoolManager();
    }
    return ConnectionPoolManager.instance;
  }

  /**
   * Configure connection pool settings
   */
  configurePool(poolSize: number, connectionTimeout: number) {
    this.poolSize = poolSize;
    this.connectionTimeout = connectionTimeout;
  }

  /**
   * Get pool statistics
   */
  async getPoolStats() {
    // This would integrate with Prisma's connection pool
    return {
      poolSize: this.poolSize,
      connectionTimeout: this.connectionTimeout,
      activeConnections: 0, // Would need to implement
      waitingConnections: 0, // Would need to implement
    };
  }
}

/**
 * Query Performance Monitor
 */
export class QueryPerformanceMonitor {
  private static queryTimes: Map<string, number[]> = new Map();

  static startQuery(queryName: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (!this.queryTimes.has(queryName)) {
        this.queryTimes.set(queryName, []);
      }
      
      this.queryTimes.get(queryName)!.push(duration);
      
      // Keep only last 100 measurements
      if (this.queryTimes.get(queryName)!.length > 100) {
        this.queryTimes.get(queryName)!.shift();
      }
      
      // Log slow queries
      if (duration > 1000) {
        logger.warn(`Slow query detected: ${queryName} took ${duration}ms`);
      }
    };
  }

  static getQueryStats(queryName: string) {
    const times = this.queryTimes.get(queryName) || [];
    if (times.length === 0) return null;

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const max = Math.max(...times);
    const min = Math.min(...times);

    return {
      queryName,
      count: times.length,
      averageTime: avg,
      maxTime: max,
      minTime: min,
    };
  }

  static getAllQueryStats() {
    return Array.from(this.queryTimes.keys()).map(queryName => 
      this.getQueryStats(queryName)
    );
  }
}

// Export utility functions
export const queryOptimizer = {
  course: CourseQueryOptimizer,
  progress: ProgressQueryOptimizer,
  exam: ExamQueryOptimizer,
  batch: BatchQueryOptimizer,
  pool: ConnectionPoolManager,
  monitor: QueryPerformanceMonitor,
};