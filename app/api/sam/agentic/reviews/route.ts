/**
 * SAM Agentic Reviews API
 *
 * Handles spaced repetition review schedules and updates using the SM-2 algorithm.
 *
 * Endpoints:
 * - GET: Fetch review schedule for the authenticated user
 * - POST: Submit a review and update the schedule
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

interface ReviewEntry {
  id: string;
  conceptId: string;
  conceptName?: string;
  courseTitle?: string;
  nextReviewDate: Date;
  easeFactor: number;
  interval: number;
  repetitions: number;
  lastScore: number | null;
  retentionEstimate: number;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  isOverdue: boolean;
  daysUntilReview: number;
}

interface ReviewStats {
  totalPending: number;
  overdueCount: number;
  dueTodayCount: number;
  dueThisWeekCount: number;
  averageRetention: number;
  streakDays: number;
  topicsByPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetReviewsQuerySchema = z.object({
  status: z.enum(['all', 'pending', 'overdue', 'today', 'week']).optional().default('pending'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  courseId: z.string().optional(),
});

const SubmitReviewSchema = z.object({
  conceptId: z.string().min(1),
  score: z.number().min(0).max(5), // SM-2 uses 0-5 scale
  responseTime: z.number().optional(), // seconds
  sessionId: z.string().optional(),
});

// ============================================================================
// SM-2 ALGORITHM HELPERS
// ============================================================================

/**
 * Calculate new interval and ease factor using SM-2 algorithm
 * Score: 0-5 (0-2 = fail, 3-5 = pass)
 */
function calculateSM2(
  score: number,
  previousEaseFactor: number,
  previousInterval: number,
  previousRepetitions: number
): { interval: number; easeFactor: number; repetitions: number } {
  // If score is less than 3, reset
  if (score < 3) {
    return {
      interval: 1,
      easeFactor: Math.max(1.3, previousEaseFactor - 0.2),
      repetitions: 0,
    };
  }

  // Calculate new ease factor (EF)
  const newEaseFactor = Math.max(
    1.3,
    previousEaseFactor + (0.1 - (5 - score) * (0.08 + (5 - score) * 0.02))
  );

  // Calculate new interval
  let newInterval: number;
  if (previousRepetitions === 0) {
    newInterval = 1;
  } else if (previousRepetitions === 1) {
    newInterval = 6;
  } else {
    newInterval = Math.round(previousInterval * newEaseFactor);
  }

  return {
    interval: newInterval,
    easeFactor: newEaseFactor,
    repetitions: previousRepetitions + 1,
  };
}

/**
 * Calculate priority based on overdue status and retention
 */
function calculatePriority(
  nextReviewDate: Date,
  retentionEstimate: number
): 'urgent' | 'high' | 'medium' | 'low' {
  const now = new Date();
  const daysUntilReview = Math.floor(
    (nextReviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilReview < -7 || retentionEstimate < 30) return 'urgent';
  if (daysUntilReview < 0 || retentionEstimate < 50) return 'high';
  if (daysUntilReview <= 1 || retentionEstimate < 70) return 'medium';
  return 'low';
}

/**
 * Estimate retention based on time since last review (forgetting curve)
 */
function estimateRetention(
  lastReviewDate: Date,
  interval: number,
  easeFactor: number
): number {
  const daysSinceReview = Math.floor(
    (Date.now() - lastReviewDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Simplified forgetting curve: R = e^(-t/S) where S is stability
  const stability = interval * easeFactor;
  const retention = Math.exp(-daysSinceReview / stability) * 100;

  return Math.max(0, Math.min(100, retention));
}

// ============================================================================
// GET - Fetch review schedule
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = GetReviewsQuerySchema.parse({
      status: searchParams.get('status') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
      courseId: searchParams.get('courseId') ?? undefined,
    });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfWeek = new Date(startOfToday);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    // Build where clause based on status
    type WhereClause = {
      userId: string;
      nextReviewDate?: { lte: Date } | { gte: Date; lte: Date };
    };

    const whereClause: WhereClause = { userId: session.user.id };

    switch (query.status) {
      case 'overdue':
        whereClause.nextReviewDate = { lte: startOfToday };
        break;
      case 'today':
        whereClause.nextReviewDate = { lte: new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000) };
        break;
      case 'week':
        whereClause.nextReviewDate = { lte: endOfWeek };
        break;
      case 'pending':
        whereClause.nextReviewDate = { lte: endOfWeek };
        break;
      // 'all' has no date filter
    }

    // Fetch reviews
    const reviews = await db.spacedRepetitionSchedule.findMany({
      where: whereClause,
      orderBy: { nextReviewDate: 'asc' },
      skip: query.offset,
      take: query.limit,
    });

    // Fetch section details for display (conceptId refers to section)
    const conceptIds = reviews.map((r) => r.conceptId);
    const sections = await db.section.findMany({
      where: { id: { in: conceptIds } },
      select: {
        id: true,
        title: true,
        chapter: {
          select: {
            course: {
              select: { id: true, title: true },
            },
          },
        },
      },
      take: 200,
    });

    const conceptsMap = new Map(sections.map((s) => [s.id, s]));

    // Transform to ReviewEntry format
    const entries: ReviewEntry[] = reviews.map((review) => {
      const concept = conceptsMap.get(review.conceptId);
      const daysUntilReview = Math.floor(
        (review.nextReviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        id: review.id,
        conceptId: review.conceptId,
        conceptName: concept?.title ?? 'Unknown Concept',
        courseTitle: concept?.chapter?.course?.title,
        nextReviewDate: review.nextReviewDate,
        easeFactor: review.easeFactor,
        interval: review.interval,
        repetitions: review.repetitions,
        lastScore: review.lastScore,
        retentionEstimate: review.retentionEstimate,
        priority: calculatePriority(review.nextReviewDate, review.retentionEstimate),
        isOverdue: daysUntilReview < 0,
        daysUntilReview,
      };
    });

    // Calculate stats
    const allPendingReviews = await db.spacedRepetitionSchedule.findMany({
      where: { userId: session.user.id, nextReviewDate: { lte: endOfWeek } },
      select: { nextReviewDate: true, retentionEstimate: true },
      take: 500,
    });

    const stats: ReviewStats = {
      totalPending: allPendingReviews.length,
      overdueCount: allPendingReviews.filter((r) => r.nextReviewDate < startOfToday).length,
      dueTodayCount: allPendingReviews.filter(
        (r) =>
          r.nextReviewDate >= startOfToday &&
          r.nextReviewDate < new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)
      ).length,
      dueThisWeekCount: allPendingReviews.length,
      averageRetention:
        allPendingReviews.length > 0
          ? allPendingReviews.reduce((sum, r) => sum + r.retentionEstimate, 0) /
            allPendingReviews.length
          : 100,
      streakDays: 0, // Would need to track separately
      topicsByPriority: {
        urgent: entries.filter((e) => e.priority === 'urgent').length,
        high: entries.filter((e) => e.priority === 'high').length,
        medium: entries.filter((e) => e.priority === 'medium').length,
        low: entries.filter((e) => e.priority === 'low').length,
      },
    };

    // Get calendar data (next 30 days)
    const calendarData: Array<{ date: string; count: number; priority: string }> = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(startOfToday);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const dayReviews = entries.filter((e) => {
        const reviewDate = new Date(e.nextReviewDate).toISOString().split('T')[0];
        return reviewDate === dateStr;
      });

      if (dayReviews.length > 0 || i < 7) {
        const highestPriority = dayReviews.reduce<string>((highest, review) => {
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[review.priority as keyof typeof priorityOrder] >
            priorityOrder[highest as keyof typeof priorityOrder]
            ? review.priority
            : highest;
        }, 'low');

        calendarData.push({
          date: dateStr,
          count: dayReviews.length,
          priority: highestPriority,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        reviews: entries,
        stats,
        calendar: calendarData,
        pagination: {
          total: allPendingReviews.length,
          limit: query.limit,
          offset: query.offset,
          hasMore: query.offset + entries.length < allPendingReviews.length,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching review schedule:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to fetch review schedule' }, { status: 500 });
  }
}

// ============================================================================
// POST - Submit a review
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = SubmitReviewSchema.parse(body);

    // Find existing schedule or create new one
    let schedule = await db.spacedRepetitionSchedule.findUnique({
      where: {
        userId_conceptId: {
          userId: session.user.id,
          conceptId: validated.conceptId,
        },
      },
    });

    const now = new Date();

    if (!schedule) {
      // Create new schedule entry
      const { interval, easeFactor, repetitions } = calculateSM2(validated.score, 2.5, 1, 0);

      schedule = await db.spacedRepetitionSchedule.create({
        data: {
          userId: session.user.id,
          conceptId: validated.conceptId,
          nextReviewDate: new Date(now.getTime() + interval * 24 * 60 * 60 * 1000),
          easeFactor,
          interval,
          repetitions,
          lastScore: validated.score,
          retentionEstimate: validated.score >= 3 ? 95 : 50,
        },
      });
    } else {
      // Update existing schedule using SM-2
      const { interval, easeFactor, repetitions } = calculateSM2(
        validated.score,
        schedule.easeFactor,
        schedule.interval,
        schedule.repetitions
      );

      const newRetention = estimateRetention(schedule.updatedAt, interval, easeFactor);

      schedule = await db.spacedRepetitionSchedule.update({
        where: { id: schedule.id },
        data: {
          nextReviewDate: new Date(now.getTime() + interval * 24 * 60 * 60 * 1000),
          easeFactor,
          interval,
          repetitions,
          lastScore: validated.score,
          retentionEstimate: validated.score >= 3 ? Math.max(newRetention, 70) : newRetention,
        },
      });
    }

    // Get section details for response (conceptId refers to section)
    const concept = await db.section.findUnique({
      where: { id: validated.conceptId },
      select: { id: true, title: true },
    });

    logger.info(
      `Review submitted for concept ${validated.conceptId} by user ${session.user.id}, score: ${validated.score}`
    );

    return NextResponse.json({
      success: true,
      data: {
        id: schedule.id,
        conceptId: schedule.conceptId,
        conceptName: concept?.title ?? 'Unknown Concept',
        nextReviewDate: schedule.nextReviewDate,
        interval: schedule.interval,
        easeFactor: schedule.easeFactor,
        repetitions: schedule.repetitions,
        message:
          validated.score >= 3
            ? `Great job! Next review in ${schedule.interval} day${schedule.interval !== 1 ? 's' : ''}`
            : 'Keep practicing! This will show up again soon.',
      },
    });
  } catch (error) {
    logger.error('Error submitting review:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
