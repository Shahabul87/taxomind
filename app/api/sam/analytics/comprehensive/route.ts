import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { db } from '@/lib/db';
import { createAnalyticsEngine } from '@sam-ai/educational';
import type { UserSAMStats } from '@sam-ai/educational';
import { getUserScopedSAMConfig } from '@/lib/adapters';
import { logger } from '@/lib/logger';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { handleAIAccessError } from '@/lib/sam/ai-provider';

// Create analytics-specific database adapter that works with actual Prisma schema
function createAnalyticsDatabaseAdapter() {
  return {
    async getInteractions(params: {
      userId: string;
      courseId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }) {
      const interactions = await db.sAMInteraction.findMany({
        where: {
          userId: params.userId,
          courseId: params.courseId,
          createdAt: params.startDate || params.endDate ? {
            ...(params.startDate && { gte: params.startDate }),
            ...(params.endDate && { lte: params.endDate }),
          } : undefined,
        },
        orderBy: { createdAt: 'desc' },
        take: params.limit || 1000,
      });

      return interactions.map(i => ({
        id: i.id,
        userId: i.userId,
        interactionType: i.interactionType,
        courseId: i.courseId ?? undefined,
        chapterId: i.chapterId ?? undefined,
        sectionId: i.sectionId ?? undefined,
        context: i.context as Record<string, unknown> | undefined,
        createdAt: i.createdAt,
      }));
    },

    async getAnalyticsRecords(params: {
      userId: string;
      courseId?: string;
      startDate?: Date;
      endDate?: Date;
    }) {
      // SAMAnalytics has a different schema: metricType, metricValue, period, context, recordedAt
      // We'll extract what we can from it
      const records = await db.sAMAnalytics.findMany({
        where: {
          userId: params.userId,
          courseId: params.courseId,
          recordedAt: params.startDate || params.endDate ? {
            ...(params.startDate && { gte: params.startDate }),
            ...(params.endDate && { lte: params.endDate }),
          } : undefined,
        },
        orderBy: { recordedAt: 'desc' },
        take: 200,
      });

      // Transform to expected format, using context for additional data
      return records.map(r => {
        const context = r.context as Record<string, unknown> | null;
        return {
          id: r.id,
          userId: r.userId,
          interactionCount: (context?.interactionCount as number) ?? 1,
          responseTime: (context?.responseTime as number) ?? r.metricValue,
          satisfactionScore: (context?.satisfactionScore as number) ?? undefined,
          completionRate: (context?.completionRate as number) ?? undefined,
          courseId: r.courseId ?? undefined,
          chapterId: (context?.chapterId as string) ?? undefined,
          sectionId: (context?.sectionId as string) ?? undefined,
          createdAt: r.recordedAt,
        };
      });
    },

    async getUserStats(userId: string, courseId?: string): Promise<UserSAMStats> {
      const [points, badges, streak] = await Promise.all([
        db.sAMPoints.aggregate({
          where: { userId, courseId },
          _sum: { points: true },
        }),
        db.sAMBadge.count({
          where: { userId },
        }),
        db.sAMStreak.findUnique({
          where: { userId },
        }),
      ]);

      // Calculate level from points (using similar formula as the original)
      const totalPoints = points._sum.points ?? 0;
      const level = Math.max(1, Math.floor(Math.sqrt(totalPoints / 100)) + 1);

      return {
        points: totalPoints,
        level,
        badges,
        streak: streak?.currentStreak ?? 0,
        streaks: streak ? [{
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
        }] : [],
        totalPoints,
      };
    },

    async getCourses(params: {
      userId: string;
      courseId?: string;
      isPublished?: boolean;
    }) {
      const courses = await db.course.findMany({
        where: {
          userId: params.userId,
          ...(params.courseId && { id: params.courseId }),
          ...(params.isPublished !== undefined && { isPublished: params.isPublished }),
        },
        select: {
          id: true,
          userId: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
        },
        take: 200,
      });

      return courses.map(c => ({
        id: c.id,
        userId: c.userId,
        isPublished: c.isPublished,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));
    },

    async getPointsHistory(params: {
      userId: string;
      courseId?: string;
      startDate?: Date;
    }) {
      const points = await db.sAMPoints.findMany({
        where: {
          userId: params.userId,
          courseId: params.courseId,
          ...(params.startDate && { awardedAt: { gte: params.startDate } }),
        },
        select: {
          userId: true,
          points: true,
          awardedAt: true,
          courseId: true,
        },
        take: 200,
      });

      return points.map(p => ({
        userId: p.userId,
        points: p.points,
        awardedAt: p.awardedAt,
        courseId: p.courseId ?? undefined,
      }));
    },

    async recordAnalytics(data: {
      userId: string;
      interactionCount: number;
      responseTime: number;
      satisfactionScore?: number;
      completionRate?: number;
      courseId?: string;
      chapterId?: string;
      sectionId?: string;
    }) {
      // Store in SAMAnalytics with actual schema structure
      await db.sAMAnalytics.create({
        data: {
          userId: data.userId,
          metricType: 'INTERACTION_COUNT', // Default metric type
          metricValue: data.responseTime,
          period: 'DAILY',
          courseId: data.courseId,
          context: {
            interactionCount: data.interactionCount,
            responseTime: data.responseTime,
            satisfactionScore: data.satisfactionScore,
            completionRate: data.completionRate,
            chapterId: data.chapterId,
            sectionId: data.sectionId,
          },
        },
      });
    },
  };
}

// Per-request engine factory (user-scoped AI provider)
async function createAnalyticsEngineForUser(userId: string) {
  const samConfig = await getUserScopedSAMConfig(userId, 'analysis');
  return createAnalyticsEngine({
    samConfig,
    // Cast to unknown first to bypass strict type checking since we're providing a custom adapter
    database: createAnalyticsDatabaseAdapter() as unknown as undefined,
  });
}

export async function GET(req: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(req, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId') || undefined;
    const range = searchParams.get('range') || '30d';

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (range) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    const analyticsEngine = await createAnalyticsEngineForUser(session.user.id);
    const analytics = await withRetryableTimeout(
      () => analyticsEngine.getComprehensiveAnalytics(
        session.user.id,
        {
          courseId,
          dateRange: { start: startDate, end: endDate },
        }
      ),
      TIMEOUT_DEFAULTS.AI_ANALYSIS,
      'comprehensive-analytics'
    );

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('Operation timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json({ error: 'Operation timed out. Please try again.' }, { status: 504 });
    }
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    logger.error('Error fetching comprehensive analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
