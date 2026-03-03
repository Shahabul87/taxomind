import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

// Force Node.js runtime
export const runtime = 'nodejs';

// Public GET endpoint - no authentication required
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    const categoryId = searchParams.get("categoryId") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20), 100);
    const isFeatured = searchParams.get("featured") === "true" ? true : undefined;

    // Build where clause
    const whereClause: any = {
      isPublished: true,
    };
    
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }
    
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (isFeatured !== undefined) {
      whereClause.isFeatured = isFeatured;
    }

    // Calculate offset for pagination
    const skip = (page - 1) * limit;

    // Fetch courses with related data
    const courses = await db.course.findMany({
      where: whereClause,
      skip,
      take: limit,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        chapters: {
          where: { isPublished: true },
          select: {
            id: true,
            title: true,
            position: true,
            isPublished: true,
            isFree: true,
          },
          take: 50,
        },
        reviews: {
          select: {
            rating: true,
          },
          take: 100,
        },
        _count: {
          select: {
            Purchase: true,
            Enrollment: true,
            reviews: true,
            chapters: true,
          },
        },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Transform courses to include calculated fields
    const transformedCourses = courses.map(course => {
      const averageRating = course.reviews.length > 0
        ? course.reviews.reduce((acc, review) => acc + review.rating, 0) / course.reviews.length
        : 0;

      return {
        id: course.id,
        title: course.title,
        subtitle: course.subtitle,
        description: course.description,
        cleanDescription: course.description?.substring(0, 150) + '...',
        imageUrl: course.imageUrl,
        price: course.price,
        isPublished: course.isPublished,
        isFeatured: course.isFeatured,
        category: course.category,
        chapters: course.chapters,
        chaptersLength: course._count.chapters,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        user: course.user,
        averageRating,
        reviewsCount: course._count.reviews,
        enrollmentsCount: course._count.Enrollment + course._count.Purchase,
        isEnrolled: false, // Public endpoint, so no enrollment info
        level: 'Intermediate' as 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert', // Default level
        duration: '30 hours', // Default duration
        skills: course.whatYouWillLearn || [],
        certificateOffered: true, // Default to true
        difficulty: 3, // Default difficulty
        popularity: course._count.Enrollment + course._count.Purchase,
        trending: (course._count.Enrollment + course._count.Purchase) > 50,
      };
    });

    // Get total count for pagination
    const totalCount = await db.course.count({ where: whereClause });

    return NextResponse.json({
      success: true,
      courses: transformedCourses,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });

  } catch (error) {
    logger.error('[PUBLIC_COURSES] Error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch courses',
        courses: []
      },
      { status: 500 }
    );
  }
}