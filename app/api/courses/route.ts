import { NextResponse } from "next/server";
import { withPermission } from "@/lib/api-protection";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

// Force Node.js runtime
export const runtime = 'nodejs';

export const POST = withPermission("course:create", async (req: Request) => {
  
  try {
    const user = await currentUser();
    const { title } = await req.json();
   
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const userId = user?.id

    // Create course with cognitive analytics enabled by default
    const course = await db.course.create({
      data: {
        userId,
        title,
        // Auto-enable AI-powered features for new courses
        courseGoals: "This course is designed with AI-powered cognitive development tracking using Bloom's taxonomy framework for optimal learning outcomes.",
      }
    });

    // Initialize cognitive analytics settings for the new course
    try {
      // Create initial AI-generated content record to track AI features usage
      await db.aIGeneratedContent.create({
        data: {
          courseId: course.id,
          title: "Cognitive Analytics Setup",
          contentType: "COGNITIVE_ANALYTICS_SETUP",
          prompt: "Auto-enabled cognitive analytics for course creation",
          generatedContent: JSON.stringify({
            bloomsAnalyticsEnabled: true,
            adaptiveAssessmentEnabled: true,
            cognitiveProgressTrackingEnabled: true,
            aiRecommendationsEnabled: true,
            setupDate: new Date().toISOString(),
            features: [
              "Bloom's taxonomy question mapping",
              "Cognitive development tracking", 
              "Adaptive difficulty adjustment",
              "Learning analytics dashboard",
              "AI-powered study recommendations"
            ]
          }),
          model: "cognitive-analytics-system",
          success: true,
          metadata: JSON.stringify({
            autoEnabled: true,
            phase: "PHASE_1_ACTIVATION",
            version: "1.0"
          })
        }
      });

      // Create initial learning metrics record for analytics tracking
      await db.learningMetrics.create({
        data: {
          courseId: course.id,
          userId: userId,
          // Initialize with cognitive analytics baseline
          completionRate: 0,
          averageTimeSpent: 0,
          totalInteractions: 0,
          performanceScore: 0,
          metadata: JSON.stringify({
            cognitiveAnalyticsEnabled: true,
            bloomsLevelsTracked: ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"],
            adaptiveAssessmentActive: true,
            aiRecommendationsActive: true
          })
        }
      });

      console.log(`[COURSES] Cognitive analytics auto-enabled for course: ${course.id}`);
    } catch (analyticsError) {
      // Log error but don't fail course creation
      console.warn("[COURSES] Failed to initialize cognitive analytics:", analyticsError);
    }

    return NextResponse.json(course);
  } catch (error) {
    console.log("[COURSES]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
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
        chapters: course.chapters || [],
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