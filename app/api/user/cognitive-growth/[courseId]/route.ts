import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to validate that a Prisma JSON value is a Record<string, number>.
 * Used for levelData, startingDistribution, and currentDistribution fields
 * which are stored as Json in the database.
 */
function isNumberRecord(v: unknown): v is Record<string, number> {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
  return Object.values(v as Record<string, unknown>).every(
    (val) => typeof val === 'number'
  );
}

// ==========================================
// Zod Validation Schemas
// ==========================================

const CourseGrowthResponseSchema = z.object({
  courseId: z.string(),
  courseTitle: z.string(),
  startingLevel: z.number(),
  currentLevel: z.number(),
  levelGrowth: z.number(),
  startingDistribution: z.object({
    remember: z.number(),
    understand: z.number(),
    apply: z.number(),
    analyze: z.number(),
    evaluate: z.number(),
    create: z.number(),
  }).nullable(),
  currentDistribution: z.object({
    remember: z.number(),
    understand: z.number(),
    apply: z.number(),
    analyze: z.number(),
    evaluate: z.number(),
    create: z.number(),
  }).nullable(),
  topImprovements: z.array(z.object({
    level: z.string(),
    growth: z.number(),
    description: z.string(),
  })),
  activitiesCompleted: z.number(),
  assessmentsTaken: z.number(),
  averageScore: z.number().nullable(),
  startedAt: z.string(),
  lastUpdatedAt: z.string(),
  completedAt: z.string().nullable(),
  isCompleted: z.boolean(),
});

// ==========================================
// API Response Interface
// ==========================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>
  };
  metadata?: {
    timestamp: string;
    requestId: string;
  };
}

// ==========================================
// Helper Functions
// ==========================================

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  remember: 'You now recall facts with ease',
  understand: 'You can explain concepts clearly',
  apply: 'You apply patterns to new situations',
  analyze: 'You break down complex problems',
  evaluate: 'You make sound judgments',
  create: 'You design original solutions',
};

function calculateTopImprovements(
  startDist: Record<string, number> | null,
  currentDist: Record<string, number> | null
): Array<{ level: string; growth: number; description: string }> {
  if (!startDist || !currentDist) {
    return [];
  }

  const improvements: Array<{ level: string; growth: number; description: string }> = [];

  for (const level of Object.keys(startDist)) {
    const startValue = startDist[level] || 0;
    const currentValue = currentDist[level] || 0;
    const growth = currentValue - startValue;

    if (growth > 0) {
      improvements.push({
        level,
        growth: Math.round(growth),
        description: LEVEL_DESCRIPTIONS[level] || '',
      });
    }
  }

  // Sort by growth descending and take top 3
  return improvements
    .sort((a, b) => b.growth - a.growth)
    .slice(0, 3);
}

// ==========================================
// GET - Fetch Course-Specific Cognitive Growth
// ==========================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  let session;
  try {
    session = await auth();

    if (!session?.user?.id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      };
      return NextResponse.json(response, { status: 401 });
    }

    const userId = session.user.id;
    const { courseId } = await params;

    if (!courseId) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Course ID is required',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Verify course exists
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
      },
    });

    if (!course) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'COURSE_NOT_FOUND',
          message: 'Course not found',
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Verify user is enrolled
    const enrollment = await db.enrollment.findFirst({
      where: {
        userId,
        courseId,
      },
    });

    if (!enrollment) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'NOT_ENROLLED',
          message: 'You are not enrolled in this course',
        },
      };
      return NextResponse.json(response, { status: 403 });
    }

    // Get or create user cognitive profile
    let profile = await db.userCognitiveProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      profile = await db.userCognitiveProfile.create({
        data: {
          userId,
          overallLevel: 1.0,
          levelName: 'REMEMBERER',
          rememberScore: 100,
        },
      });
    }

    // Get or create course growth record
    let courseGrowth = await db.userCourseGrowth.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!courseGrowth) {
      // Create initial course growth record
      const startingDistribution = {
        remember: profile.rememberScore,
        understand: profile.understandScore,
        apply: profile.applyScore,
        analyze: profile.analyzeScore,
        evaluate: profile.evaluateScore,
        create: profile.createScore,
      };

      courseGrowth = await db.userCourseGrowth.create({
        data: {
          userId,
          courseId,
          profileId: profile.id,
          startingLevel: profile.overallLevel,
          currentLevel: profile.overallLevel,
          levelGrowth: 0,
          startingDistribution,
          currentDistribution: startingDistribution,
          activitiesCompleted: 0,
          assessmentsTaken: 0,
        },
      });
    }

    // Calculate current distribution from course-specific data
    const bloomsProgress = await db.studentBloomsProgress.findFirst({
      where: { userId, courseId },
    });

    let currentDistribution: Record<string, number> | null = isNumberRecord(courseGrowth.currentDistribution)
      ? courseGrowth.currentDistribution
      : null;

    if (bloomsProgress?.levelData && isNumberRecord(bloomsProgress.levelData)) {
      const levelData = bloomsProgress.levelData;
      currentDistribution = {
        remember: levelData.REMEMBER || levelData.remember || 0,
        understand: levelData.UNDERSTAND || levelData.understand || 0,
        apply: levelData.APPLY || levelData.apply || 0,
        analyze: levelData.ANALYZE || levelData.analyze || 0,
        evaluate: levelData.EVALUATE || levelData.evaluate || 0,
        create: levelData.CREATE || levelData.create || 0,
      };
    }

    // Count activities and assessments
    const examAttempts = await db.userExamAttempt.count({
      where: {
        userId,
        exam: {
          courseId,
        },
        status: 'COMPLETED',
      },
    });

    // Calculate average score
    const examScores = await db.userExamAttempt.findMany({
      where: {
        userId,
        exam: {
          courseId,
        },
        status: 'COMPLETED',
      },
      select: {
        score: true,
        maxScore: true,
      },
    });

    let averageScore: number | null = null;
    if (examScores.length > 0) {
      const totalPercentage = examScores.reduce((sum, exam) => {
        const maxScore = exam.maxScore ?? 100;
        const score = exam.score ?? 0;
        return sum + (maxScore > 0 ? (score / maxScore) * 100 : 0);
      }, 0);
      averageScore = totalPercentage / examScores.length;
    }

    // Calculate level growth
    const startDist: Record<string, number> | null = isNumberRecord(courseGrowth.startingDistribution)
      ? courseGrowth.startingDistribution
      : null;
    const levelGrowth = currentDistribution && startDist
      ? Object.keys(currentDistribution).reduce((sum, key) => {
          return sum + ((currentDistribution?.[key] || 0) - (startDist[key] || 0));
        }, 0) / 6
      : 0;

    // Get chapter completion count as activities
    const chapterCompletions = await db.user_progress.count({
      where: {
        userId,
        courseId,
        isCompleted: true,
        chapterId: { not: null },
      },
    });

    // Check if course is completed
    const courseProgress = await db.user_progress.findFirst({
      where: {
        userId,
        courseId,
        chapterId: null,
        isCompleted: true,
      },
    });

    const isCompleted = !!courseProgress;

    const topImprovements = calculateTopImprovements(startDist, currentDistribution);

    const responseData = {
      courseId,
      courseTitle: course.title,
      startingLevel: courseGrowth.startingLevel,
      currentLevel: courseGrowth.currentLevel + levelGrowth,
      levelGrowth,
      startingDistribution: startDist,
      currentDistribution,
      topImprovements,
      activitiesCompleted: chapterCompletions,
      assessmentsTaken: examAttempts,
      averageScore,
      startedAt: courseGrowth.startedAt.toISOString(),
      lastUpdatedAt: courseGrowth.lastUpdatedAt.toISOString(),
      completedAt: courseGrowth.completedAt?.toISOString() ?? null,
      isCompleted,
    };

    const validatedData = CourseGrowthResponseSchema.parse(responseData);

    const response: ApiResponse<typeof validatedData> = {
      success: true,
      data: validatedData,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: request.headers.get('x-request-id') || 'unknown',
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('[COGNITIVE_GROWTH_GET] Validation error:', { error: error.errors });
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid data structure',
          details: { errors: error.errors },
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    logger.error('[COGNITIVE_GROWTH_GET] Unexpected error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: session?.user?.id,
    });

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Unable to load course growth data',
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
