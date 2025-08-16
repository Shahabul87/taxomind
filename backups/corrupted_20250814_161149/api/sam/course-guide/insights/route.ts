import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId') || user.id;

    // Check if requesting user has permission to view teacher data
    if (teacherId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all courses by teacher
    const courses = await db.course.findMany({
      where: { userId: teacherId },
      include: {
        _count: {
          select: {
            Purchase: true,
            Enrollment: true,
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
    });

    // Calculate aggregate insights
    const insights = {
      totalCourses: courses.length,
      totalStudents: courses.reduce((sum, c) => sum + c._count.Purchase, 0),
      totalEnrollments: courses.reduce((sum, c) => sum + c._count.Enrollment, 0),
      averageRating: calculateAverageRating(courses),
      courseMetrics: courses.map(course => ({
        id: course.id,
        title: course.title,
        students: course._count.Purchase,
        enrollments: course._count.Enrollment,
        chapters: course._count.chapters,
        rating: calculateCourseRating(course.reviews),
        status: course.isPublished ? 'published' : 'draft',
      })),
      performanceTrends: await getPerformanceTrends(teacherId),
      topPerformingCourses: getTopPerformingCourses(courses),
      improvementAreas: getImprovementAreas(courses),
    };

    return NextResponse.json({
      success: true,
      data: insights,
      metadata: {
        teacherId,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    logger.error('Get teacher insights error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve teacher insights' },
      { status: 500 }
    );
  }
}

function calculateAverageRating(courses: any[]): number {
  const allRatings = courses.flatMap(c => c.reviews.map((r: any) => r.rating));
  if (allRatings.length === 0) return 0;
  
  return allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length;
}

function calculateCourseRating(reviews: any[]): number {
  if (reviews.length === 0) return 0;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}

async function getPerformanceTrends(teacherId: string): Promise<any> {
  // Get enrollments over time
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const recentEnrollments = await db.enrollment.count({
    where: {
      Course: {
        userId: teacherId,
      },
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
  });

  const previousEnrollments = await db.enrollment.count({
    where: {
      Course: {
        userId: teacherId,
      },
      createdAt: {
        gte: sixtyDaysAgo,
        lt: thirtyDaysAgo,
      },
    },
  });

  const growthRate = previousEnrollments > 0
    ? ((recentEnrollments - previousEnrollments) / previousEnrollments) * 100
    : recentEnrollments > 0 ? 100 : 0;

  return {
    enrollmentGrowth: growthRate,
    recentEnrollments,
    trend: growthRate > 10 ? 'growing' : growthRate < -10 ? 'declining' : 'stable',
  };
}

function getTopPerformingCourses(courses: any[]): any[] {
  return courses
    .map(course => ({
      id: course.id,
      title: course.title,
      score: calculatePerformanceScore(course),
      students: course._count.Purchase,
      rating: calculateCourseRating(course.reviews),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function calculatePerformanceScore(course: any): number {
  const enrollmentScore = Math.min(course._count.Purchase * 2, 100);
  const ratingScore = calculateCourseRating(course.reviews) * 20;
  const contentScore = Math.min(course._count.chapters * 5, 50);
  
  return (enrollmentScore + ratingScore + contentScore) / 3;
}

function getImprovementAreas(courses: any[]): string[] {
  const areas: string[] = [];
  
  // Check for courses with low ratings
  const lowRatedCourses = courses.filter(c => {
    const rating = calculateCourseRating(c.reviews);
    return rating > 0 && rating < 3.5;
  });
  
  if (lowRatedCourses.length > 0) {
    areas.push('Improve course quality for low-rated courses');
  }
  
  // Check for courses with few chapters
  const thinCourses = courses.filter(c => c._count.chapters < 5);
  if (thinCourses.length > 0) {
    areas.push('Add more content to courses with fewer than 5 chapters');
  }
  
  // Check for unpublished courses
  const draftCourses = courses.filter(c => !c.isPublished);
  if (draftCourses.length > 0) {
    areas.push(`Publish ${draftCourses.length} draft course(s)`);
  }
  
  return areas;
}