import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// Schema for search parameters
const SearchParamsSchema = z.object({
  search: z.string().optional(),
  categories: z.string().optional(),
  minPrice: z.string().transform(Number).optional(),
  maxPrice: z.string().transform(Number).optional(),
  difficulties: z.string().optional(),
  minDuration: z.string().transform(Number).optional(),
  maxDuration: z.string().transform(Number).optional(),
  minRating: z.string().transform(Number).optional(),
  features: z.string().optional(),
  sort: z.enum([
    "relevance",
    "popular",
    "rating",
    "newest",
    "price-low",
    "price-high",
    "duration-short",
    "duration-long"
  ]).optional().default("relevance"),
  page: z.string().transform(Number).optional().default("1"),
  limit: z.string().transform(Number).optional().default("12"),
});

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    const searchParams = request.nextUrl.searchParams;

    // Parse and validate parameters
    const params = SearchParamsSchema.parse({
      search: searchParams.get("search") || undefined,
      categories: searchParams.get("categories") || undefined,
      minPrice: searchParams.get("minPrice") || undefined,
      maxPrice: searchParams.get("maxPrice") || undefined,
      difficulties: searchParams.get("difficulties") || undefined,
      minDuration: searchParams.get("minDuration") || undefined,
      maxDuration: searchParams.get("maxDuration") || undefined,
      minRating: searchParams.get("minRating") || undefined,
      features: searchParams.get("features") || undefined,
      sort: searchParams.get("sort") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "12",
    });

    const page = Math.max(1, params.page);
    const limit = Math.min(100, Math.max(1, params.limit));
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.CourseWhereInput = {
      isPublished: true,
    };

    // Search filter
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
    }

    // Category filter
    if (params.categories) {
      const categoryIds = params.categories.split(",");
      where.categoryId = { in: categoryIds };
    }

    // Price filter
    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      where.price = {};
      if (params.minPrice !== undefined) {
        where.price.gte = params.minPrice;
      }
      if (params.maxPrice !== undefined) {
        where.price.lte = params.maxPrice;
      }
    }

    // Difficulty filter
    // Note: Frontend defaults NULL difficulty to "Beginner", so we need to handle that
    if (params.difficulties) {
      const difficulties = params.difficulties.split(",");
      console.log('[API Search] Difficulty filter:', { difficulties, raw: params.difficulties });

      // If "Beginner" is selected, also include courses with NULL difficulty
      // since the frontend displays NULL as "Beginner"
      if (difficulties.includes("Beginner")) {
        // Create a separate OR condition for difficulty
        const difficultyConditions = [
          { difficulty: { in: difficulties as any } },
          { difficulty: null }
        ];

        // If there's already an OR (from search), we need to combine them with AND
        if (where.OR) {
          const existingOr = where.OR;
          delete where.OR;
          where.AND = [
            { OR: existingOr },
            { OR: difficultyConditions }
          ];
        } else {
          where.OR = difficultyConditions;
        }
      } else {
        where.difficulty = { in: difficulties as any };
      }
    }

    // Duration filter
    if (params.minDuration !== undefined || params.maxDuration !== undefined) {
      where.totalDuration = {};
      if (params.minDuration !== undefined) {
        where.totalDuration.gte = params.minDuration;
      }
      if (params.maxDuration !== undefined) {
        where.totalDuration.lte = params.maxDuration;
      }
    }

    // TODO: Rating filter - averageRating needs to be calculated from reviews
    // For now, this filter is disabled as averageRating is not a field in the Course model
    // if (params.minRating !== undefined) {
    //   // Need to add averageRating field to Course model or filter after fetching
    // }

    // Build orderBy clause
    let orderBy: Prisma.CourseOrderByWithRelationInput = {};
    switch (params.sort) {
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "price-low":
        orderBy = { price: "asc" };
        break;
      case "price-high":
        orderBy = { price: "desc" };
        break;
      case "popular":
        orderBy = {
          Enrollment: {
            _count: "desc"
          }
        };
        break;
      case "rating":
        // TODO: Sorting by averageRating requires field in Course model
        // For now, sort by createdAt as fallback
        orderBy = { createdAt: "desc" };
        break;
      case "duration-short":
        orderBy = { totalDuration: "asc" };
        break;
      case "duration-long":
        orderBy = { totalDuration: "desc" };
        break;
      case "relevance":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    // Get total count for pagination
    const totalCount = await db.course.count({ where });
    console.log('[API Search] Query:', JSON.stringify(where, null, 2));
    console.log('[API Search] Total count:', totalCount);

    // Fetch courses with relations
    const courses = await db.course.findMany({
      where,
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        chapters: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
            sections: {
              select: {
                id: true,
                duration: true,
              }
            }
          },
        },
        Enrollment: {
          select: {
            userId: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            Enrollment: true,
            reviews: true,
            chapters: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    // Transform courses to match frontend expectations
    const transformedCourses = courses.map((course) => {
      // Calculate average rating
      const avgRating = course.reviews.length > 0
        ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length
        : 0;

      // Calculate total duration from video sections
      const totalDuration = course.chapters.reduce((sum, chapter) => {
        const chapterDuration = chapter.sections.reduce(
          (sectionSum, section) => sectionSum + (section.duration || 0),
          0
        );
        return sum + chapterDuration;
      }, 0);

      // Determine badges
      const badges: string[] = [];
      const daysSinceCreated = Math.floor(
        (Date.now() - new Date(course.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceCreated <= 30) badges.push("New");
      if (course._count.Enrollment > 100) badges.push("Popular");
      if (avgRating >= 4.5 && course._count.reviews >= 10) badges.push("Top Rated");

      // Check if user is enrolled
      const isEnrolled = user
        ? course.Enrollment.some((e) => e.userId === user.id)
        : false;

      // Calculate lessons count (sections in all chapters)
      const lessonsCount = course.chapters.reduce(
        (sum, chapter) => sum + chapter.sections.length,
        0
      );

      return {
        id: course.id,
        title: course.title,
        subtitle: course.subtitle,
        description: course.description || "",
        imageUrl: course.imageUrl || "/images/course-placeholder.jpg",
        price: course.price || 0,
        originalPrice: course.originalPrice,
        category: {
          id: course.category?.id || "",
          name: course.category?.name || "Uncategorized",
        },
        chaptersCount: course._count.chapters,
        lessonsCount,
        duration: course.totalDuration || Math.round(totalDuration / 60), // Use materialized field or fallback to calculation
        difficulty: course.difficulty || "Beginner",
        instructor: course.user
          ? {
              id: course.user.id,
              name: course.user.name || "Unknown Instructor",
              avatar: course.user.image || undefined,
            }
          : undefined,
        rating: avgRating, // Calculated from reviews (averageRating field not in model)
        reviewsCount: course._count.reviews,
        enrolledCount: course._count.Enrollment,
        completionRate: 0, // Would need to calculate from enrollment progress
        hasCertificate: true, // Default or from course settings
        hasExercises: true, // Default or from course settings
        badges: badges as any,
        isEnrolled,
        isWishlisted: false, // Would need wishlist table
        lastUpdated: course.updatedAt,
      };
    });

    // Get filter options for sidebar
    const categories = await db.category.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            courses: {
              where: { isPublished: true },
            },
          },
        },
      },
    });

    const filterOptions = {
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        count: cat._count.courses,
      })),
      priceRanges: [
        { label: "Free", min: 0, max: 0 },
        { label: "$0 - $50", min: 0, max: 50 },
        { label: "$50 - $100", min: 50, max: 100 },
        { label: "$100 - $200", min: 100, max: 200 },
        { label: "$200+", min: 200, max: 99999 },
      ],
      difficulties: [
        { value: "Beginner", label: "Beginner", count: 0 },
        { value: "Intermediate", label: "Intermediate", count: 0 },
        { value: "Advanced", label: "Advanced", count: 0 },
        { value: "Expert", label: "Expert", count: 0 },
      ],
      durations: [
        { label: "< 2 hours", min: 0, max: 120 },
        { label: "2-5 hours", min: 120, max: 300 },
        { label: "5-10 hours", min: 300, max: 600 },
        { label: "10+ hours", min: 600, max: 99999 },
      ],
      ratings: [
        { value: 4.5, label: "4.5 & up" },
        { value: 4, label: "4.0 & up" },
        { value: 3.5, label: "3.5 & up" },
        { value: 3, label: "3.0 & up" },
      ],
      features: [
        { value: "certificate", label: "Certificate of Completion" },
        { value: "subtitles", label: "Subtitles Available" },
        { value: "exercises", label: "Practice Exercises" },
        { value: "downloadable", label: "Downloadable Resources" },
        { value: "mobile", label: "Mobile Access" },
      ],
    };

    return NextResponse.json({
      success: true,
      data: {
        courses: transformedCourses,
        filterOptions,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        version: "1.0.0",
      },
    });
  } catch (error) {
    console.error("[COURSES_SEARCH_ERROR]", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid search parameters",
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to search courses",
        },
      },
      { status: 500 }
    );
  }
}