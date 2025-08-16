import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';
import { withAuth } from '@/lib/api/with-api-auth';

// Force Node.js runtime
export const runtime = 'nodejs';

export const POST = withAuth(async (request, context) => {
  try {
    // Parse request body
    const body = await request.json();
    const { title, description, learningObjectives } = body;

    if (!title || title.trim().length === 0) {
      return new NextResponse("Title is required", { status: 400 });
    }

    // Also check database for user role and teacher flag directly
    const dbUser = await db.user.findUnique({
      where: { id: context.user.id },
      select: { id: true, email: true, role: true, isTeacher: true }
    });
    
    // Check if user is admin or has teacher flag
    const userRole = dbUser?.role;
    const isTeacher = dbUser?.isTeacher;

    if (!userRole) {
      return new NextResponse("User role not found", { status: 403 });
    }
    
    if (userRole !== 'ADMIN' && !dbUser?.isTeacher) {
      return new NextResponse(`Forbidden - Teachers only. Your role: ${userRole}, isTeacher: ${isTeacher}`, { status: 403 });
    }

    // Handle learning objectives - convert array to string for courseGoals or use whatYouWillLearn array
    let courseGoalsString = null;
    let whatYouWillLearnArray = [];
    
    if (learningObjectives && Array.isArray(learningObjectives)) {
      // Use whatYouWillLearn for the array of objectives
      whatYouWillLearnArray = learningObjectives;
      // Create a summary string for courseGoals
      courseGoalsString = `This course includes ${learningObjectives.length} learning objectives covering the key concepts and practical skills needed.`;
    }
    
    // Create course with AI-generated data
    const course = await db.course.create({
      data: {
        userId: context.user.id,
        title: title.trim(),
        description: description || null,
        courseGoals: courseGoalsString,
        whatYouWillLearn: whatYouWillLearnArray,
        isPublished: false,
      }
    });

    return NextResponse.json(course);
    
  } catch (error: any) {
    logger.error("[COURSES] Error creating course:", error);
    
    if (error instanceof Error) {
      logger.error("[COURSES] Error message:", error.message);
      logger.error("[COURSES] Error stack:", error.stack);
      
      // Check for specific Prisma errors
      if (error.message.includes('Foreign key constraint')) {
        return new NextResponse("Database constraint error", { status: 400 });
      }
      
      if (error.message.includes('Unique constraint')) {
        return new NextResponse("Duplicate course title", { status: 409 });
      }
      
      if (error.message.includes('connect')) {
        return new NextResponse("Database connection error", { status: 503 });
      }
    }
    
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}, {
  rateLimit: { requests: 5, window: 60000 }, // 5 course creations per minute
  auditLog: true
});

// Robust GET endpoint for courses listing - based on working homepage pattern
export const GET = async (req: Request) => {
  try {
    const user = await currentUser();
    const { searchParams } = new URL(req.url);
    
    const categoryId = searchParams.get("categoryId") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const isFeatured = searchParams.get("featured") === "true" ? true : undefined;

    // Build where clause based on working schema
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
        { cleanDescription: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (isFeatured !== undefined) {
      whereClause.isFeatured = isFeatured;
    }
    
    // Use direct Prisma queries following CLAUDE.md guidelines
    const [courses, total] = await Promise.all([
      db.course.findMany({
        where: whereClause,
        include: {
          category: true,
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          Enrollment: user?.id ? {
            where: { userId: user.id },
            select: {
              createdAt: true,
            },
          } : false,
          _count: {
            select: {
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
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      
      db.course.count({
        where: whereClause,
      })
    ]);
    
    // Process courses to add computed fields
    const processedCourses = courses.map(course => {
      // Calculate average rating
      const ratings = course.reviews.map(r => r.rating);
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : 0;
      
      // Extract text from HTML description
      const cleanDescription = course.description 
        ? course.description
            .replace(/<\/?[^>]+(>|$)/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
        : '';
      
      return {
        id: course.id,
        title: course.title,
        subtitle: course.subtitle,
        description: course.description,
        cleanDescription: cleanDescription || course.cleanDescription,
        imageUrl: course.imageUrl,
        price: course.price,
        isPublished: course.isPublished,
        isFeatured: course.isFeatured,
        category: course.category,
        chapters: [],
        chaptersLength: course._count.chapters,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        user: course.user,
        // Computed fields for frontend
        averageRating: Math.round(averageRating * 10) / 10,
        reviewsCount: course.reviews.length,
        enrollmentsCount: course._count.Enrollment,
        isEnrolled: user?.id ? course.Enrollment.length > 0 : false,
      };
    });

    return NextResponse.json(processedCourses);
  } catch (error: any) {
    logger.error("[COURSES_API]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
};