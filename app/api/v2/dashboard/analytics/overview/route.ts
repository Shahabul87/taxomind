import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import {
  subDays,
  eachDayOfInterval,
  format,
} from 'date-fns';

/**
 * Unified Analytics Overview API v2
 *
 * Consolidates analytics data from multiple sources:
 * - Learning activity metrics
 * - Course progress tracking
 * - Study time heatmap data
 * - SAM AI insights summary
 * - Performance metrics
 */

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetAnalyticsQuerySchema = z.object({
  timeRange: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
  courseId: z.string().optional(),
});

// ============================================================================
// GET - Analytics Overview
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = GetAnalyticsQuerySchema.parse({
      timeRange: searchParams.get('timeRange') ?? undefined,
      courseId: searchParams.get('courseId') ?? undefined,
    });

    // Calculate date range
    const daysMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
    const startDate = subDays(new Date(), daysMap[query.timeRange]);

    // Fetch all analytics data in parallel
    const [
      studyTimeData,
      courseProgress,
      activityHeatmap,
      performanceMetrics,
      samInsightsSummary,
    ] = await Promise.all([
      fetchStudyTimeData(userId, startDate, query.courseId),
      fetchCourseProgress(userId, query.courseId),
      fetchActivityHeatmap(userId, startDate),
      fetchPerformanceMetrics(userId, startDate, query.courseId),
      fetchSAMInsightsSummary(userId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        timeRange: query.timeRange,
        studyTime: studyTimeData,
        courseProgress,
        heatmap: activityHeatmap,
        performance: performanceMetrics,
        samInsights: samInsightsSummary,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[ANALYTICS_OVERVIEW_V2]', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics overview' },
      { status: 500 }
    );
  }
}

/**
 * Fetch study time data with daily breakdown
 */
async function fetchStudyTimeData(
  userId: string,
  startDate: Date,
  courseId?: string
) {
  try {
    const where: Prisma.LearningActivityWhereInput = {
      userId,
      createdAt: { gte: startDate },
      ...(courseId ? { courseId } : {}),
    };

    // Get total study time (use actualDuration if available, otherwise estimatedDuration)
    const totalMinutes = await db.learningActivity.aggregate({
      where,
      _sum: { actualDuration: true, estimatedDuration: true },
    });

    // Get daily breakdown
    const activities = await db.learningActivity.findMany({
      where,
      select: {
        createdAt: true,
        actualDuration: true,
        estimatedDuration: true,
      },
      take: 1000,
    });

    // Group by day
    const dailyStudyTime = new Map<string, number>();
    const days = eachDayOfInterval({ start: startDate, end: new Date() });

    for (const day of days) {
      dailyStudyTime.set(format(day, 'yyyy-MM-dd'), 0);
    }

    for (const activity of activities) {
      const dayKey = format(activity.createdAt, 'yyyy-MM-dd');
      const current = dailyStudyTime.get(dayKey) ?? 0;
      // Use actualDuration if available, otherwise fall back to estimatedDuration
      const duration = activity.actualDuration ?? activity.estimatedDuration ?? 0;
      dailyStudyTime.set(dayKey, current + duration);
    }

    // Calculate total from actual or estimated duration
    const totalDurationMinutes = (totalMinutes._sum.actualDuration ?? 0) || (totalMinutes._sum.estimatedDuration ?? 0);

    // Calculate average
    const totalDays = days.length;
    const avgMinutesPerDay = totalDays > 0 ? totalDurationMinutes / totalDays : 0;

    return {
      totalMinutes: totalDurationMinutes,
      totalHours: Math.round((totalDurationMinutes / 60) * 10) / 10,
      avgMinutesPerDay: Math.round(avgMinutesPerDay),
      dailyBreakdown: Array.from(dailyStudyTime.entries()).map(([date, minutes]) => ({
        date,
        minutes,
        hours: Math.round((minutes / 60) * 10) / 10,
      })),
    };
  } catch (error) {
    console.error('[STUDY_TIME_DATA]', error);
    return {
      totalMinutes: 0,
      totalHours: 0,
      avgMinutesPerDay: 0,
      dailyBreakdown: [],
    };
  }
}

/**
 * Fetch course progress for all enrolled courses
 */
async function fetchCourseProgress(userId: string, courseId?: string) {
  try {
    const where: Prisma.EnrollmentWhereInput = {
      userId,
      ...(courseId ? { courseId } : {}),
    };

    const enrollments = await db.enrollment.findMany({
      where,
      include: {
        Course: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            chapters: {
              select: {
                id: true,
                sections: {
                  select: { id: true },
                },
              },
            },
          },
        },
      },
      take: 1000,
    });

    // Fetch completed sections for this user separately
    const userCompletedSections = await db.user_progress.findMany({
      where: {
        userId,
        isCompleted: true,
        sectionId: { not: null },
      },
      select: {
        sectionId: true,
        courseId: true,
      },
      take: 1000,
    });

    return enrollments.map((enrollment) => {
      const totalSections = enrollment.Course.chapters.reduce(
        (sum: number, chapter) => sum + chapter.sections.length,
        0
      );
      const completedSections = userCompletedSections.filter(
        (p) => p.courseId === enrollment.Course.id
      ).length;
      const progress = totalSections > 0 ? (completedSections / totalSections) * 100 : 0;

      return {
        courseId: enrollment.Course.id,
        courseTitle: enrollment.Course.title,
        courseImage: enrollment.Course.imageUrl,
        totalSections,
        completedSections,
        progress: Math.round(progress),
        enrolledAt: enrollment.createdAt,
        lastAccessedAt: enrollment.updatedAt,
      };
    });
  } catch (error: unknown) {
    console.error('[COURSE_PROGRESS]', error);
    return [];
  }
}

/**
 * Fetch activity heatmap data (GitHub-style contribution graph)
 */
async function fetchActivityHeatmap(userId: string, startDate: Date) {
  try {
    const activities = await db.learningActivity.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        type: true,
      },
      take: 1000,
    });

    // Group by day and calculate intensity
    const heatmapData = new Map<string, { count: number; types: Set<string> }>();

    for (const activity of activities) {
      const dayKey = format(activity.createdAt, 'yyyy-MM-dd');
      const existing = heatmapData.get(dayKey) ?? { count: 0, types: new Set() };
      existing.count++;
      existing.types.add(activity.type);
      heatmapData.set(dayKey, existing);
    }

    // Convert to array with intensity levels (0-4)
    const maxCount = Math.max(...Array.from(heatmapData.values()).map((d) => d.count), 1);

    return Array.from(heatmapData.entries()).map(([date, data]) => ({
      date,
      count: data.count,
      intensity: Math.min(4, Math.ceil((data.count / maxCount) * 4)),
      activityTypes: Array.from(data.types),
    }));
  } catch (error) {
    console.error('[ACTIVITY_HEATMAP]', error);
    return [];
  }
}

/**
 * Fetch performance metrics
 */
async function fetchPerformanceMetrics(
  userId: string,
  startDate: Date,
  courseId?: string
) {
  try {
    // Get exam attempts and scores
    const examAttempts = await db.selfAssessmentAttempt.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
        status: 'GRADED',
        ...(courseId ? { exam: { courseId } } : {}),
      },
      select: {
        scorePercentage: true,
        totalQuestions: true,
        correctAnswers: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    // Calculate metrics
    const avgScore =
      examAttempts.length > 0
        ? examAttempts.reduce((sum: number, a) => sum + (a.scorePercentage ?? 0), 0) / examAttempts.length
        : 0;

    const totalQuestions = examAttempts.reduce((sum, a) => sum + (a.totalQuestions ?? 0), 0);
    const totalCorrect = examAttempts.reduce((sum, a) => sum + (a.correctAnswers ?? 0), 0);
    const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    // Get streak data (use learningStreak model)
    const streak = await db.learningStreak.findUnique({
      where: { userId },
      select: {
        currentStreak: true,
        longestStreak: true,
      },
    });

    return {
      examAttempts: examAttempts.length,
      avgScore: Math.round(avgScore),
      accuracy: Math.round(accuracy),
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
      recentScores: examAttempts.slice(0, 10).map((a) => ({
        score: a.scorePercentage,
        date: a.createdAt,
      })),
    };
  } catch (error) {
    console.error('[PERFORMANCE_METRICS]', error);
    return {
      examAttempts: 0,
      avgScore: 0,
      accuracy: 0,
      currentStreak: 0,
      longestStreak: 0,
      recentScores: [],
    };
  }
}

/**
 * Fetch SAM AI insights summary
 */
async function fetchSAMInsightsSummary(userId: string) {
  try {
    // Get recent SAM interactions count
    const recentInteractions = await db.sAMInteraction.count({
      where: {
        userId,
        createdAt: { gte: subDays(new Date(), 30) },
      },
    });

    // Get learning recommendations count
    const recommendations = await db.sAMRecommendation.count({
      where: {
        userId,
        createdAt: { gte: subDays(new Date(), 30) },
      },
    });

    // Get active goals count
    const activeGoals = await db.sAMLearningGoal.count({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });

    return {
      recentInteractions,
      pendingRecommendations: recommendations,
      activeGoals,
      lastInteractionAt: null, // Can be fetched if needed
    };
  } catch (error) {
    console.error('[SAM_INSIGHTS_SUMMARY]', error);
    return {
      recentInteractions: 0,
      pendingRecommendations: 0,
      activeGoals: 0,
      lastInteractionAt: null,
    };
  }
}
