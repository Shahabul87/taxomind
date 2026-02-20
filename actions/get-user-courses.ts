"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { logger } from '@/lib/logger';

/**
 * Fetches courses created by the current user
 */
export async function getUserCreatedCourses(userId?: string) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { courses: [], error: "Unauthorized" };
    }

    const courses = await db.course.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        reviews: {
          select: {
            rating: true
          },
          take: 50
        },
        _count: {
          select: {
            chapters: true,
            Enrollment: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 50
    });

    // Calculate stats with safe access
    const coursesWithStats = courses.map(course => {
      try {
        const totalRatings = course.reviews?.length || 0;
        const averageRating = totalRatings > 0
          ? course.reviews.reduce((acc, review) => acc + (review.rating || 0), 0) / totalRatings
          : 0;

        const totalChapters = course._count?.chapters ?? 0;
        const totalEnrolled = course._count?.Enrollment ?? 0;

        return {
          ...course,
          totalRatings,
          averageRating: Math.round(averageRating * 10) / 10,
          totalChapters,
          totalEnrolled
        };
      } catch (error: unknown) {
        logger.warn("Error processing course stats:", error);
        return {
          ...course,
          totalRatings: 0,
          averageRating: 0,
          totalChapters: 0,
          totalEnrolled: 0
        };
      }
    });

    return { 
      courses: coursesWithStats,
      error: null
    };
  } catch (error: any) {
    logger.error("[GET_CREATED_COURSES_ERROR]", error);
    return { 
      courses: [], 
      error: "Failed to fetch created courses" 
    };
  }
}

/**
 * Fetches courses the current user is enrolled in
 */
export async function getUserEnrolledCourses() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { courses: [], error: "Unauthorized" };
    }

    const userId = session.user.id;

    const enrollments = await db.enrollment.findMany({
      where: {
        userId
      },
      include: {
        Course: {
          include: {
            category: {
              select: {
                id: true,
                name: true
              }
            },
            reviews: {
              select: {
                rating: true
              },
              take: 20
            },
            user: {
              select: {
                name: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 100
    });

    // Batch fetch published chapters and user progress (2 queries, not N+1)
    const courseIds = enrollments
      .map(e => e.Course?.id)
      .filter((id): id is string => Boolean(id));

    const [publishedChapters, completedProgress] = await Promise.all([
      db.chapter.findMany({
        where: { courseId: { in: courseIds }, isPublished: true },
        select: { id: true, courseId: true }
      }),
      db.user_progress.findMany({
        where: { userId, chapterId: { not: null }, isCompleted: true },
        select: { chapterId: true }
      })
    ]);

    // Build lookup maps
    const publishedChaptersByCourse = new Map<string, Set<string>>();
    for (const ch of publishedChapters) {
      if (!publishedChaptersByCourse.has(ch.courseId)) {
        publishedChaptersByCourse.set(ch.courseId, new Set());
      }
      publishedChaptersByCourse.get(ch.courseId)!.add(ch.id);
    }

    const completedChapterIds = new Set(
      completedProgress.map(p => p.chapterId).filter((id): id is string => Boolean(id))
    );

    // Process and calculate stats for each enrolled course
    const enrolledCourses = enrollments.map(enrollment => {
      try {
        const course = enrollment.Course;

        if (!course) {
          throw new Error("Course not found");
        }

        const totalRatings = course.reviews?.length || 0;
        const averageRating = totalRatings > 0
          ? course.reviews.reduce((acc, review) => acc + (review.rating || 0), 0) / totalRatings
          : 0;

        // Real chapter count and completion from batch queries
        const courseChapterIds = publishedChaptersByCourse.get(course.id) ?? new Set<string>();
        const totalChapters = courseChapterIds.size;

        let completedChaptersCount = 0;
        for (const chId of courseChapterIds) {
          if (completedChapterIds.has(chId)) {
            completedChaptersCount++;
          }
        }

        const completionPercentage = totalChapters > 0
          ? Math.round((completedChaptersCount / totalChapters) * 100)
          : 0;

        return {
          ...course,
          enrollmentId: enrollment.id,
          enrolledAt: enrollment.createdAt,
          totalRatings,
          averageRating: Math.round(averageRating * 10) / 10,
          totalChapters,
          completedChapters: completedChaptersCount,
          completionPercentage,
          instructor: course.user || { name: "Unknown", image: null }
        };
      } catch (error: unknown) {
        logger.warn("Error processing enrollment:", error);
        return {
          id: enrollment.Course?.id || "unknown",
          title: enrollment.Course?.title || "Unknown Course",
          description: enrollment.Course?.description || "",
          imageUrl: enrollment.Course?.imageUrl || null,
          price: enrollment.Course?.price || 0,
          isPublished: enrollment.Course?.isPublished || false,
          category: enrollment.Course?.category || { id: "unknown", name: "Unknown" },
          enrollmentId: enrollment.id,
          enrolledAt: enrollment.createdAt,
          totalRatings: 0,
          averageRating: 0,
          totalChapters: 0,
          completedChapters: 0,
          completionPercentage: 0,
          instructor: { name: "Unknown", image: null }
        };
      }
    });

    return { 
      courses: enrolledCourses,
      error: null 
    };
  } catch (error: any) {
    logger.error("[GET_ENROLLED_COURSES_ERROR]", error);
    return { 
      courses: [], 
      error: "Failed to fetch enrolled courses" 
    };
  }
}

/**
 * Fetches real learning stats (streak, time, enrollments this month)
 */
export interface LearningStats {
  currentStreak: number;
  longestStreak: number;
  learningTimeDisplay: string;
  enrollmentsThisMonth: number;
}

export async function getUserLearningStats(): Promise<LearningStats> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { currentStreak: 0, longestStreak: 0, learningTimeDisplay: "0h", enrollmentsThisMonth: 0 };
    }

    const userId = session.user.id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Run all queries in parallel with graceful fallbacks
    const [
      learningStreak,
      samStreak,
      gamificationXP,
      learningTimeAgg,
      enrollmentsCount
    ] = await Promise.all([
      db.learningStreak.findUnique({
        where: { userId },
        select: { currentStreak: true, longestStreak: true }
      }).catch(() => null),
      db.sAMStreak.findUnique({
        where: { userId },
        select: { currentStreak: true, longestStreak: true }
      }).catch(() => null),
      db.gamificationUserXP.findUnique({
        where: { userId },
        select: { currentStreak: true, longestStreak: true }
      }).catch(() => null),
      db.learning_sessions.aggregate({
        where: {
          userId,
          startTime: { gte: monthStart }
        },
        _sum: { duration: true }
      }).catch(() => null),
      db.enrollment.count({
        where: {
          userId,
          createdAt: { gte: monthStart }
        }
      }).catch(() => 0)
    ]);

    // Pick best streak from available sources
    const currentStreak = learningStreak?.currentStreak
      ?? samStreak?.currentStreak
      ?? gamificationXP?.currentStreak
      ?? 0;

    const longestStreak = learningStreak?.longestStreak
      ?? samStreak?.longestStreak
      ?? gamificationXP?.longestStreak
      ?? 0;

    // Format learning time (duration is in seconds)
    const totalSeconds = learningTimeAgg?._sum?.duration ?? 0;
    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
    const learningTimeDisplay = totalHours > 0
      ? `${totalHours}h ${totalMinutes}m`
      : totalMinutes > 0
        ? `${totalMinutes}m`
        : "0h";

    return {
      currentStreak,
      longestStreak,
      learningTimeDisplay,
      enrollmentsThisMonth: enrollmentsCount ?? 0
    };
  } catch (error: unknown) {
    logger.error("[GET_LEARNING_STATS_ERROR]", error);
    return { currentStreak: 0, longestStreak: 0, learningTimeDisplay: "0h", enrollmentsThisMonth: 0 };
  }
}

/**
 * Legacy function name for backward compatibility
 */
export const getUserCourses = getUserCreatedCourses;