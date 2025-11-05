/**
 * Server-Side Data Fetchers
 *
 * Uses React 19 cache() for automatic request deduplication.
 * All functions are Server Component safe.
 *
 * Benefits:
 * - Single source of truth for course data
 * - Automatic caching per request
 * - Type-safe data fetching
 * - Easy to test and maintain
 */

import { cache } from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { BaseCourse, CourseReview } from '../_types/course.types';

/**
 * Fetch complete course data with all relations
 *
 * Uses React cache() to ensure this query only runs once per request,
 * even if called multiple times.
 *
 * @param courseId - Course ID to fetch
 * @returns Course data with all relations
 * @throws notFound() if course doesn't exist
 */
export const getCourseData = cache(async (courseId: string): Promise<BaseCourse> => {
  try {
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        subtitle: true,
        difficulty: true,
        price: true,
        isPublished: true,
        categoryId: true,
        createdAt: true,
        updatedAt: true,
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
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
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // Initial load - more can be fetched via pagination
        },
        chapters: {
          where: {
            isPublished: true,
          },
          orderBy: {
            position: 'asc',
          },
          include: {
            sections: {
              where: {
                isPublished: true,
              },
              orderBy: {
                position: 'asc',
              },
            },
          },
        },
        _count: {
          select: {
            Enrollment: true,
          },
        },
      },
    });

    if (!course) {
      logger.warn(`Course not found: ${courseId}`);
      notFound();
    }

    return course as BaseCourse;
  } catch (error) {
    logger.error('Error fetching course data:', error);
    throw error;
  }
});

/**
 * Check if a user is enrolled in a course
 *
 * @param userId - User ID (optional, returns null if not provided)
 * @param courseId - Course ID to check
 * @returns Enrollment data or null if not enrolled
 */
export const getEnrollmentStatus = cache(async (
  userId: string | undefined,
  courseId: string
) => {
  if (!userId) return null;

  try {
    return await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      select: {
        userId: true,
        courseId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch (error) {
    logger.error('Error checking enrollment status:', error);
    return null;
  }
});

/**
 * Fetch similar courses for recommendations
 *
 * @param courseId - Current course ID (to exclude)
 * @param categoryId - Category ID to match
 * @param limit - Maximum number of courses to return (default: 4)
 * @returns Array of similar courses
 */
export const getSimilarCourses = cache(async (
  courseId: string,
  categoryId: string | null,
  limit: number = 4
) => {
  if (!categoryId) return [];

  try {
    return await db.course.findMany({
      where: {
        categoryId,
        id: { not: courseId },
        isPublished: true,
      },
      take: limit,
      orderBy: {
        createdAt: 'desc', // Newest first
      },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        price: true,
        difficulty: true,
        category: {
          select: {
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
            Enrollment: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching similar courses:', error);
    return [];
  }
});

/**
 * Fetch course reviews with pagination
 *
 * @param courseId - Course ID
 * @param skip - Number of reviews to skip (for pagination)
 * @param take - Number of reviews to fetch (default: 10)
 * @returns Array of course reviews
 */
export const getCourseReviews = cache(async (
  courseId: string,
  skip: number = 0,
  take: number = 10
): Promise<CourseReview[]> => {
  try {
    return await db.courseReview.findMany({
      where: {
        courseId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });
  } catch (error) {
    logger.error('Error fetching course reviews:', error);
    return [];
  }
});

/**
 * Get course statistics
 *
 * @param courseId - Course ID
 * @returns Course statistics (enrollment count, avg rating, etc.)
 */
export const getCourseStats = cache(async (courseId: string) => {
  try {
    const [enrollmentCount, reviews] = await Promise.all([
      db.enrollment.count({
        where: { courseId },
      }),
      db.courseReview.findMany({
        where: { courseId },
        select: { rating: true },
      }),
    ]);

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return {
      enrollmentCount,
      reviewCount: reviews.length,
      avgRating: Number(avgRating.toFixed(1)),
    };
  } catch (error) {
    logger.error('Error fetching course stats:', error);
    return {
      enrollmentCount: 0,
      reviewCount: 0,
      avgRating: 0,
    };
  }
});

/**
 * Check if course is published
 * Lightweight query for quick checks
 *
 * @param courseId - Course ID
 * @returns true if published, false otherwise
 */
export const isCoursePublished = cache(async (courseId: string): Promise<boolean> => {
  try {
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { isPublished: true },
    });

    return course?.isPublished ?? false;
  } catch (error) {
    logger.error('Error checking if course is published:', error);
    return false;
  }
});
