import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

// Force Node.js runtime
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    console.log("[COURSES] Starting course creation request");
    
    // Get current user
    const user = await currentUser();
    console.log("[COURSES] Full user object:", JSON.stringify(user, null, 2));
    
    if (!user?.id) {
      console.log("[COURSES] No user found - unauthorized");
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    // Also check database for user role directly
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, role: true }
    });
    console.log("[COURSES] Database user:", JSON.stringify(dbUser, null, 2));
    
    // Use database role as source of truth
    const userRole = dbUser?.role;
    console.log(`[COURSES] Final role check: session.role=${user.role}, db.role=${dbUser?.role}, using=${userRole}`);
    
    if (!userRole) {
      console.log(`[COURSES] No role found for user`);
      return new NextResponse("User role not found", { status: 403 });
    }
    
    if (userRole !== 'TEACHER' && userRole !== 'ADMIN') {
      console.log(`[COURSES] User role ${userRole} not authorized for course creation`);
      return new NextResponse(`Forbidden - Teachers only. Your role: ${userRole}`, { status: 403 });
    }
    
    console.log(`[COURSES] Role check passed: ${userRole}`);
    
    // Parse request body
    const body = await req.json();
    const { title, description, learningObjectives } = body;
    console.log("[COURSES] Request body:", body);
    
    if (!title || title.trim().length === 0) {
      console.log("[COURSES] Title validation failed");
      return new NextResponse("Title is required", { status: 400 });
    }
    
    console.log(`[COURSES] Creating course for user ${user.id} with title: ${title}`);
    
    // Create course with AI-generated data
    const course = await db.course.create({
      data: {
        userId: user.id,
        title: title.trim(),
        description: description || null,
        courseGoals: learningObjectives || null, // Use courseGoals instead of learningObjectives
        isPublished: false,
      }
    });

    console.log(`[COURSES] Course created successfully: ${course.id}`);
    return NextResponse.json(course);
    
  } catch (error) {
    console.error("[COURSES] Error creating course:", error);
    
    if (error instanceof Error) {
      console.error("[COURSES] Error message:", error.message);
      console.error("[COURSES] Error stack:", error.stack);
      
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
}

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
    
    console.log(`🚀 [COURSES_API] Fetching courses with filters:`, { categoryId, search, page, limit, isFeatured });
    
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
    
    console.log(`✅ [COURSES_API] Successfully fetched ${processedCourses.length} courses`);
    
    return NextResponse.json(processedCourses);
  } catch (error) {
    console.error("[COURSES_API]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
};