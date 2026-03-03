import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z, ZodError } from "zod";

import { currentUser } from "@/lib/auth";
import { redisCache, CACHE_PREFIXES, CACHE_TTL } from '@/lib/cache/redis-cache';
import { db } from "@/lib/db";
import {
  cacheInvalidation
} from '@/lib/db/query-optimizer';
import { logger } from '@/lib/logger';
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit';
import {
  ApiError,
  createSuccessResponse as createApiSuccess,
  createErrorResponse as createApiError,
} from '@/lib/api/api-responses';
import { logCourseCreation } from '@/lib/audit/course-audit';
import { getAchievementEngine } from '@/lib/adapters/achievement-adapter';

// Force Node.js runtime
export const runtime = 'nodejs';

// =============================================================================
// Course Creation Schema - Flexible for initial creation
// =============================================================================
const CreateCourseRequestSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters')
    .transform(val => val.trim()),
  description: z
    .string()
    .max(5000, 'Description must not exceed 5000 characters')
    .optional()
    .nullable(),
  learningObjectives: z
    .array(z.string().max(500))
    .max(20, 'Maximum 20 learning objectives allowed')
    .optional(),
  categoryId: z.string().uuid('Invalid category ID').optional(),
});

type CreateCourseRequest = z.infer<typeof CreateCourseRequestSchema>;

// =============================================================================
// Rate Limit Configuration
// =============================================================================
const COURSE_CREATION_RATE_LIMIT = {
  limit: 10,           // 10 courses
  windowMs: 3600000,   // per hour
};

// =============================================================================
// POST - Create Course (Enterprise-Grade)
// =============================================================================
export async function POST(req: Request): Promise<Response> {
  const startTime = Date.now();

  try {
    // 1. Authentication Check
    const user = await currentUser();

    if (!user?.id) {
      logger.warn("[COURSES] Unauthorized course creation attempt");
      return createApiError(ApiError.unauthorized('Authentication required'));
    }

    // 2. Rate Limiting
    const clientId = getClientIdentifier(req, user.id);
    const rateLimitResult = await rateLimit(
      `course-creation:${clientId}`,
      COURSE_CREATION_RATE_LIMIT.limit,
      COURSE_CREATION_RATE_LIMIT.windowMs
    );

    if (!rateLimitResult.success) {
      logger.warn("[COURSES] Rate limit exceeded for user", { userId: user.id });
      return createApiError(
        ApiError.tooManyRequests(
          `Course creation limit reached. Try again in ${rateLimitResult.retryAfter} seconds.`
        ),
        {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          'Retry-After': rateLimitResult.retryAfter?.toString() || '3600',
        }
      );
    }

    // 3. Verify user exists in database
    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, isTeacher: true }
    });

    if (!dbUser) {
      logger.error("[COURSES] User not found in database", { userId: user.id });
      return createApiError(ApiError.notFound('User account not found'));
    }

    // 4. Parse and validate request body with Zod
    let validatedData: CreateCourseRequest;
    try {
      const body = await req.json();
      validatedData = CreateCourseRequestSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        logger.warn("[COURSES] Validation failed", { errors: validationErrors });
        return createApiError(
          ApiError.validation('Invalid course data', { errors: validationErrors })
        );
      }
      throw error;
    }

    // 5. Prepare learning objectives data
    let courseGoalsString: string | null = null;
    let whatYouWillLearnArray: string[] = [];

    if (validatedData.learningObjectives && validatedData.learningObjectives.length > 0) {
      whatYouWillLearnArray = validatedData.learningObjectives;
      courseGoalsString = `This course includes ${validatedData.learningObjectives.length} learning objectives covering the key concepts and practical skills needed.`;
    }

    // 6. Create course using transaction for atomicity
    const course = await db.$transaction(async (tx) => {
      const newCourse = await tx.course.create({
        data: {
          userId: user.id,
          title: validatedData.title,
          description: validatedData.description || null,
          categoryId: validatedData.categoryId || null,
          courseGoals: courseGoalsString,
          whatYouWillLearn: whatYouWillLearnArray,
          isPublished: false,
        },
        select: {
          id: true,
          title: true,
          description: true,
          categoryId: true,
          isPublished: true,
          createdAt: true,
          userId: true,
        }
      });

      return newCourse;
    });

    // 7. Audit logging - track course creation for compliance
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                      req.headers.get('x-real-ip') ||
                      'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    await logCourseCreation(course.id, {
      userId: user.id,
      ipAddress,
      userAgent,
    }, {
      title: validatedData.title,
      hasDescription: !!validatedData.description,
      hasLearningObjectives: whatYouWillLearnArray.length > 0,
      objectivesCount: whatYouWillLearnArray.length,
      categoryId: validatedData.categoryId || null,
    }).catch(err => {
      // Don't fail the request if audit logging fails
      logger.warn("[COURSES] Audit logging failed", { error: err });
    });

    // 8. Invalidate relevant caches after successful creation
    await Promise.all([
      cacheInvalidation.invalidateUser(user.id),
      cacheInvalidation.invalidateSearch(),
      redisCache.invalidatePattern(`${CACHE_PREFIXES.COURSE}*`),
    ]).catch(err => {
      // Don't fail the request if cache invalidation fails
      logger.warn("[COURSES] Cache invalidation failed", { error: err });
    });

    // 9. Log success (without sensitive data)
    const responseTime = Date.now() - startTime;
    logger.info("[COURSES] Course created successfully", {
      courseId: course.id,
      userId: user.id,
      responseTime,
    });

    // 9.1 Track achievement progress asynchronously
    getAchievementEngine()
      .then((engine) => engine.trackProgress(user.id, 'content_created', { courseId: course.id }, { courseId: course.id }))
      .catch((err) => {
        logger.warn('[COURSES] Achievement tracking failed', { error: err });
      });

    // 10. Return standardized success response
    return createApiSuccess(course, 201, undefined, {
      'X-RateLimit-Limit': rateLimitResult.limit.toString(),
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error("[COURSES] Error creating course", {
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime,
    });

    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return createApiError(
          ApiError.conflict('A course with this title already exists')
        );
      }
      if (error.code === 'P2003') {
        return createApiError(
          ApiError.badRequest('Invalid category reference')
        );
      }
    }

    // Generic error - don't leak internal details
    return createApiError(
      ApiError.internal('Unable to create course. Please try again.')
    );
  }
}

// Robust GET endpoint for courses listing - based on working homepage pattern
export const GET = async (req: Request): Promise<NextResponse> => {
  try {
    const user = await currentUser();
    const { searchParams } = new URL(req.url);
    
    const categoryId = searchParams.get("categoryId") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20), 100);
    const isFeatured = searchParams.get("featured") === "true" ? true : undefined;

    // Generate cache key for this specific query
    const cacheKey = `courses:list:${JSON.stringify({
      categoryId,
      search,
      page,
      limit,
      isFeatured,
      userId: user?.id || 'anonymous'
    })}`;

    // Try to get from cache first
    const cached = await redisCache.get(cacheKey, {
      prefix: CACHE_PREFIXES.COURSE,
    });

    if (cached.hit && cached.value) {
      logger.info('[COURSES_API] Cache hit for courses list');
      return NextResponse.json(cached.value);
    }

    // Build where clause using proper Prisma types
    const whereClause: Prisma.CourseWhereInput = {
      isPublished: true,
    };
    
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }
    
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { cleanDescription: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ];
    }
    
    if (isFeatured !== undefined) {
      whereClause.isFeatured = isFeatured;
    }
    
    // Use direct Prisma queries following CLAUDE.md guidelines
    const [coursesWithRelations, total] = await Promise.all([
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
    
    // Type assertion for courses with includes
    const courses = coursesWithRelations as Array<{
      id: string;
      title: string;
      subtitle: string | null;
      description: string | null;
      cleanDescription: string | null;
      imageUrl: string | null;
      price: number | null;
      isPublished: boolean;
      isFeatured: boolean;
      createdAt: Date;
      updatedAt: Date;
      categoryId: string | null;
      userId: string;
      category: { id: string; name: string; } | null;
      user: { id: string; name: string | null; image: string | null; };
      Enrollment: Array<{ createdAt: Date }> | false;
      _count: { Enrollment: number; reviews: number; chapters: number; };
      reviews: Array<{ rating: number }>;
    }>;
    
    // Process courses to add computed fields
    const processedCourses = courses.map(course => {
      // Calculate average rating
      const ratings = course.reviews.map((r: { rating: number }) => r.rating);
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length 
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
        isEnrolled: user?.id && course.Enrollment !== false ? course.Enrollment.length > 0 : false,
      };
    });

    // Cache the processed courses
    await redisCache.set(cacheKey, processedCourses, {
      prefix: CACHE_PREFIXES.COURSE,
      ttl: search ? CACHE_TTL.SHORT : CACHE_TTL.MEDIUM, // Shorter TTL for search results
      tags: ['courses', 'list'],
    });

    logger.info('[COURSES_API] Cached courses list');

    return NextResponse.json(processedCourses, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    logger.error("[COURSES_API]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
};
