/**
 * SAM Course Recommendations API
 * Returns personalized course recommendations based on user's learning journey
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetRecommendationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(8),
  type: z.enum(['personalized', 'similar', 'trending', 'next-step', 'all']).default('all'),
  excludeEnrolled: z.coerce.boolean().default(true),
  categoryId: z.string().optional(),
});

// ============================================================================
// TYPES
// ============================================================================

interface CourseRecommendation {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  enrolledCount: number;
  duration: number;
  difficulty: string;
  category: {
    id: string;
    name: string;
  };
  instructor: {
    id: string;
    name: string;
    avatar?: string;
  };
  matchScore: number;
  reason: string;
  recommendationType: 'personalized' | 'similar' | 'trending' | 'next-step';
  tags: string[];
}

interface RecommendationSection {
  type: 'personalized' | 'similar' | 'trending' | 'next-step';
  title: string;
  description: string;
  courses: CourseRecommendation[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate match score based on various factors
 */
function calculateMatchScore(
  course: {
    categoryId: string | null;
    difficulty: string | null;
    _count: { Enrollment: number; reviews: number };
    reviews: { rating: number }[];
  },
  userContext: {
    enrolledCategories: Set<string>;
    enrolledCourseDifficulties: string[];
    preferredCategories: string[];
  }
): number {
  let score = 50; // Base score

  // Category match (+20)
  if (course.categoryId && userContext.enrolledCategories.has(course.categoryId)) {
    score += 20;
  }

  // Preferred category (+15)
  if (course.categoryId && userContext.preferredCategories.includes(course.categoryId)) {
    score += 15;
  }

  // Appropriate difficulty progression (+10) - based on enrolled course difficulties
  const currentMaxDifficulty = userContext.enrolledCourseDifficulties.includes('Advanced')
    ? 'Expert'
    : userContext.enrolledCourseDifficulties.includes('Intermediate')
      ? 'Advanced'
      : userContext.enrolledCourseDifficulties.includes('Beginner')
        ? 'Intermediate'
        : 'Beginner';

  if (course.difficulty === currentMaxDifficulty) {
    score += 10;
  }

  // High rating boost (+5)
  const avgRating =
    course.reviews.length > 0
      ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
      : 0;
  if (avgRating >= 4.5) {
    score += 5;
  }

  // Popular course boost (+5)
  if (course._count.Enrollment > 100) {
    score += 5;
  }

  return Math.min(score, 100);
}

/**
 * Generate recommendation reason based on context
 */
function generateReason(
  type: 'personalized' | 'similar' | 'trending' | 'next-step',
  course: {
    categoryId: string | null;
    difficulty: string | null;
    category: { name: string } | null;
  },
  userContext: {
    enrolledCategories: Set<string>;
    recentCourseCategory?: string;
  }
): string {
  switch (type) {
    case 'personalized':
      if (course.categoryId && userContext.enrolledCategories.has(course.categoryId)) {
        return `Based on your interest in ${course.category?.name || 'similar topics'}`;
      }
      return 'Recommended based on your learning patterns';
    case 'similar':
      return `Similar to courses you&apos;ve enjoyed in ${course.category?.name || 'this area'}`;
    case 'trending':
      return 'Trending among learners this week';
    case 'next-step':
      return `${course.difficulty} level - perfect for your next challenge`;
    default:
      return 'Recommended for you';
  }
}

// ============================================================================
// GET - Get personalized course recommendations
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const query = GetRecommendationsQuerySchema.parse({
      limit: searchParams.get('limit') ?? 8,
      type: searchParams.get('type') ?? 'all',
      excludeEnrolled: searchParams.get('excludeEnrolled') ?? true,
      categoryId: searchParams.get('categoryId') ?? undefined,
    });

    // Get user's learning context
    // Note: Prisma relation names are case-sensitive and match the model name (Course, not course)
    const userEnrollments = await db.enrollment.findMany({
      where: { userId },
      include: {
        Course: {
          select: {
            id: true,
            categoryId: true,
            difficulty: true,
          },
        },
      },
    });

    // Filter out enrollments where Course might be null (deleted courses)
    const validEnrollments = userEnrollments.filter((e) => e.Course);

    const enrolledCourseIds = new Set(validEnrollments.map((e) => e.Course!.id));
    const enrolledCategories = new Set(
      validEnrollments.map((e) => e.Course!.categoryId).filter(Boolean) as string[]
    );
    // Note: Enrollment doesn't track completion - use all enrolled course difficulties
    // A more sophisticated approach would check UserProgress or completion records
    const enrolledCourseDifficulties = validEnrollments
      .map((e) => e.Course!.difficulty)
      .filter(Boolean) as string[];

    // Determine preferred categories from enrollment activity (most recent enrollments first)
    // Sort by createdAt descending and count category frequency
    const sortedEnrollments = [...validEnrollments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const categoryEnrollmentCount = new Map<string, number>();
    sortedEnrollments.forEach((enrollment) => {
      if (enrollment.Course?.categoryId) {
        categoryEnrollmentCount.set(
          enrollment.Course.categoryId,
          (categoryEnrollmentCount.get(enrollment.Course.categoryId) || 0) + 1
        );
      }
    });

    const preferredCategories = Array.from(categoryEnrollmentCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([catId]) => catId);

    const userContext = {
      enrolledCategories,
      enrolledCourseDifficulties,
      preferredCategories,
    };

    // Base where clause for courses
    const baseWhere = {
      isPublished: true,
      ...(query.excludeEnrolled && enrolledCourseIds.size > 0
        ? { id: { notIn: Array.from(enrolledCourseIds) } }
        : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
    };

    const sections: RecommendationSection[] = [];

    // Personalized recommendations (based on enrolled categories)
    if (query.type === 'all' || query.type === 'personalized') {
      const personalizedCourses = await db.course.findMany({
        where: {
          ...baseWhere,
          ...(enrolledCategories.size > 0
            ? { categoryId: { in: Array.from(enrolledCategories) } }
            : {}),
        },
        include: {
          category: true,
          user: { select: { id: true, name: true, image: true } },
          reviews: { select: { rating: true } },
          chapters: { where: { isPublished: true }, select: { id: true } },
          _count: { select: { Enrollment: true, reviews: true } },
        },
        orderBy: [{ createdAt: 'desc' }],
        take: query.limit,
      });

      const personalizedRecs: CourseRecommendation[] = personalizedCourses.map((course) => {
        const avgRating =
          course.reviews.length > 0
            ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
            : 0;

        return {
          id: course.id,
          title: course.title,
          description: course.description || '',
          imageUrl: course.imageUrl || '/placeholder.svg',
          price: course.price || 0,
          rating: avgRating,
          reviewsCount: course._count.reviews,
          enrolledCount: course._count.Enrollment,
          duration: 0, // Would calculate from sections
          difficulty: course.difficulty || 'Beginner',
          category: {
            id: course.category?.id || '',
            name: course.category?.name || 'Uncategorized',
          },
          instructor: {
            id: course.user?.id || '',
            name: course.user?.name || 'Unknown',
            avatar: course.user?.image || undefined,
          },
          matchScore: calculateMatchScore(course, userContext),
          reason: generateReason('personalized', course, userContext),
          recommendationType: 'personalized',
          tags: avgRating >= 4.5 ? ['Top Rated'] : [],
        };
      });

      if (personalizedRecs.length > 0) {
        sections.push({
          type: 'personalized',
          title: 'SAM AI Personalized',
          description: 'Based on your learning patterns and interests',
          courses: personalizedRecs.sort((a, b) => b.matchScore - a.matchScore),
        });
      }
    }

    // Next-step recommendations (progressive difficulty)
    if (query.type === 'all' || query.type === 'next-step') {
      const nextDifficulty = enrolledCourseDifficulties.includes('Advanced')
        ? 'Expert'
        : enrolledCourseDifficulties.includes('Intermediate')
          ? 'Advanced'
          : enrolledCourseDifficulties.includes('Beginner')
            ? 'Intermediate'
            : 'Beginner';

      const nextStepCourses = await db.course.findMany({
        where: {
          ...baseWhere,
          difficulty: nextDifficulty,
        },
        include: {
          category: true,
          user: { select: { id: true, name: true, image: true } },
          reviews: { select: { rating: true } },
          _count: { select: { Enrollment: true, reviews: true } },
        },
        orderBy: [{ createdAt: 'desc' }],
        take: Math.ceil(query.limit / 2),
      });

      const nextStepRecs: CourseRecommendation[] = nextStepCourses.map((course) => {
        const avgRating =
          course.reviews.length > 0
            ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
            : 0;

        return {
          id: course.id,
          title: course.title,
          description: course.description || '',
          imageUrl: course.imageUrl || '/placeholder.svg',
          price: course.price || 0,
          rating: avgRating,
          reviewsCount: course._count.reviews,
          enrolledCount: course._count.Enrollment,
          duration: 0,
          difficulty: course.difficulty || 'Beginner',
          category: {
            id: course.category?.id || '',
            name: course.category?.name || 'Uncategorized',
          },
          instructor: {
            id: course.user?.id || '',
            name: course.user?.name || 'Unknown',
            avatar: course.user?.image || undefined,
          },
          matchScore: calculateMatchScore(course, userContext),
          reason: generateReason('next-step', course, userContext),
          recommendationType: 'next-step',
          tags: ['Level Up'],
        };
      });

      if (nextStepRecs.length > 0) {
        sections.push({
          type: 'next-step',
          title: 'Next Steps in Your Journey',
          description: 'Continue building on what you&apos;ve learned',
          courses: nextStepRecs,
        });
      }
    }

    // Trending recommendations (high enrollment in last 30 days)
    if (query.type === 'all' || query.type === 'trending') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const trendingCourses = await db.course.findMany({
        where: baseWhere,
        include: {
          category: true,
          user: { select: { id: true, name: true, image: true } },
          reviews: { select: { rating: true } },
          _count: { select: { Enrollment: true, reviews: true } },
          Enrollment: {
            where: { createdAt: { gte: thirtyDaysAgo } },
            select: { id: true },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
        take: 50, // Fetch more to sort by recent enrollments
      });

      // Sort by recent enrollments
      const sortedTrending = trendingCourses
        .map((course) => ({
          ...course,
          recentEnrollments: course.Enrollment.length,
        }))
        .sort((a, b) => b.recentEnrollments - a.recentEnrollments)
        .slice(0, query.limit);

      const trendingRecs: CourseRecommendation[] = sortedTrending.map((course) => {
        const avgRating =
          course.reviews.length > 0
            ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
            : 0;

        return {
          id: course.id,
          title: course.title,
          description: course.description || '',
          imageUrl: course.imageUrl || '/placeholder.svg',
          price: course.price || 0,
          rating: avgRating,
          reviewsCount: course._count.reviews,
          enrolledCount: course._count.Enrollment,
          duration: 0,
          difficulty: course.difficulty || 'Beginner',
          category: {
            id: course.category?.id || '',
            name: course.category?.name || 'Uncategorized',
          },
          instructor: {
            id: course.user?.id || '',
            name: course.user?.name || 'Unknown',
            avatar: course.user?.image || undefined,
          },
          matchScore: 70 + Math.min(course.recentEnrollments, 30), // Base + trending bonus
          reason: generateReason('trending', course, userContext),
          recommendationType: 'trending',
          tags: course.recentEnrollments > 50 ? ['Hot', 'Trending'] : ['Trending'],
        };
      });

      if (trendingRecs.length > 0) {
        sections.push({
          type: 'trending',
          title: 'Trending Now',
          description: 'Popular courses other learners are taking',
          courses: trendingRecs,
        });
      }
    }

    logger.info(
      `Generated ${sections.reduce((sum, s) => sum + s.courses.length, 0)} course recommendations for user ${userId}`
    );

    return NextResponse.json({
      success: true,
      data: {
        sections,
        generatedAt: new Date().toISOString(),
        userId,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('Error generating course recommendations:', {
      message: errorMessage,
      stack: errorStack,
      error,
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    // In development, return more detailed error info
    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        error: 'Failed to generate recommendations',
        ...(isDev && { message: errorMessage, stack: errorStack }),
      },
      { status: 500 }
    );
  }
}
