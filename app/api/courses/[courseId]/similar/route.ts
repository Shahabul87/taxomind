import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { safeErrorResponse } from '@/lib/api/safe-error';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ courseId: string }> }
): Promise<NextResponse> {
  try {
    const { courseId } = await context.params;
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const limit = parseInt(searchParams.get('limit') || '6', 10);

    // Get the current course to access its details
    const currentCourse = await db.course.findUnique({
      where: { id: courseId },
      select: {
        categoryId: true,
        difficulty: true,
        price: true,
      },
    });

    if (!currentCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Build the where clause for similar courses
    const whereClause: any = {
      id: { not: courseId }, // Exclude current course
      isPublished: true,
    };

    // Prioritize same category
    if (categoryId || currentCourse.categoryId) {
      whereClause.categoryId = categoryId || currentCourse.categoryId;
    }

    // Fetch similar courses
    const similarCourses = await db.course.findMany({
      where: whereClause,
      take: limit,
      orderBy: [
        { isFeatured: 'desc' },
        { averageRating: 'desc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        price: true,
        averageRating: true,
        difficulty: true,
        totalDuration: true,
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

    // If we don't have enough courses in the same category, fetch from other categories
    if (similarCourses.length < limit) {
      const additionalCourses = await db.course.findMany({
        where: {
          id: {
            not: courseId,
            notIn: similarCourses.map((c) => c.id),
          },
          isPublished: true,
          categoryId: { not: currentCourse.categoryId },
        },
        take: limit - similarCourses.length,
        orderBy: [
          { isFeatured: 'desc' },
          { averageRating: 'desc' },
          { createdAt: 'desc' },
        ],
        select: {
          id: true,
          title: true,
          description: true,
          imageUrl: true,
          price: true,
          averageRating: true,
          difficulty: true,
          totalDuration: true,
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

      similarCourses.push(...additionalCourses);
    }

    return NextResponse.json(
      {
        success: true,
        courses: similarCourses,
        count: similarCourses.length,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error fetching similar courses:', error);
    return safeErrorResponse(error, 500, 'SIMILAR_COURSES');
  }
}
