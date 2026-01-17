/**
 * SAM AI - Retention Analysis API
 *
 * Provides forgetting curve data and retention metrics using SM-2 spaced repetition.
 * Helps identify skills at risk of decay and optimal review schedules.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { getStore } from '@/lib/sam/taxomind-context';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetRetentionAnalysisSchema = z.object({
  skillId: z.string().uuid().optional(),
  includeOverdue: z.coerce.boolean().optional().default(true),
  includeFuture: z.coerce.boolean().optional().default(true),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
});

// ============================================================================
// TYPES
// ============================================================================

interface RetentionDataPoint {
  daysFromNow: number;
  estimatedRetention: number;
}

interface SkillRetentionData {
  conceptId: string;
  conceptName: string;
  currentRetention: number;
  nextReviewDate: Date;
  isOverdue: boolean;
  daysUntilReview: number;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  easeFactor: number;
  interval: number;
  repetitions: number;
  forgettingCurve: RetentionDataPoint[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate the forgetting curve for the next 30 days
 */
function calculateForgettingCurve(
  currentRetention: number,
  interval: number,
  easeFactor: number
): RetentionDataPoint[] {
  const curve: RetentionDataPoint[] = [];
  const stability = interval * easeFactor;

  for (let day = 0; day <= 30; day += 3) {
    // Exponential decay: R = R0 * e^(-t/S)
    const retention = currentRetention * Math.exp(-day / stability);
    curve.push({
      daysFromNow: day,
      estimatedRetention: Math.max(0, Math.min(100, Math.round(retention))),
    });
  }

  return curve;
}

/**
 * Calculate days until a date from now
 */
function daysUntil(date: Date): number {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * GET - Get retention analysis for user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const validatedParams = GetRetentionAnalysisSchema.parse({
      skillId: searchParams.get('skillId') || undefined,
      includeOverdue: searchParams.get('includeOverdue') || 'true',
      includeFuture: searchParams.get('includeFuture') || 'true',
      limit: searchParams.get('limit') || '50',
    });

    const spacedRepetitionStore = getStore('spacedRepetition');

    // Get review statistics
    const stats = await spacedRepetitionStore.getStats(user.id);

    // Get pending reviews with both overdue and upcoming
    const pendingReviews = await spacedRepetitionStore.getPendingReviews(user.id, {
      limit: validatedParams.limit,
      includeFuture: validatedParams.includeFuture,
    });

    // Build retention data for each concept
    const skillRetention: SkillRetentionData[] = pendingReviews.map((review) => {
      const daysUntilReview = daysUntil(review.nextReviewDate);

      return {
        conceptId: review.conceptId,
        conceptName: review.conceptName || review.conceptId,
        currentRetention: review.retentionEstimate,
        nextReviewDate: review.nextReviewDate,
        isOverdue: review.isOverdue,
        daysUntilReview,
        priority: review.priority,
        easeFactor: review.easeFactor,
        interval: review.interval,
        repetitions: review.repetitions,
        forgettingCurve: calculateForgettingCurve(
          review.retentionEstimate,
          review.interval,
          review.easeFactor
        ),
      };
    });

    // Filter by skill if specified
    const filteredRetention = validatedParams.skillId
      ? skillRetention.filter((s) => s.conceptId === validatedParams.skillId)
      : skillRetention;

    // Calculate aggregate metrics
    const totalConcepts = filteredRetention.length;
    const avgRetention =
      totalConcepts > 0
        ? filteredRetention.reduce((sum, s) => sum + s.currentRetention, 0) / totalConcepts
        : 100;

    const atRiskCount = filteredRetention.filter((s) => s.currentRetention < 70).length;
    const criticalCount = filteredRetention.filter((s) => s.currentRetention < 50).length;

    // Group by priority for quick overview
    const byPriority = {
      urgent: filteredRetention.filter((s) => s.priority === 'urgent').length,
      high: filteredRetention.filter((s) => s.priority === 'high').length,
      medium: filteredRetention.filter((s) => s.priority === 'medium').length,
      low: filteredRetention.filter((s) => s.priority === 'low').length,
    };

    // Generate recommendations based on retention data
    const recommendations: Array<{ type: string; message: string; priority: string }> = [];

    if (stats.overdueCount > 0) {
      recommendations.push({
        type: 'overdue_reviews',
        message: `You have ${stats.overdueCount} overdue reviews. Focus on these first to prevent skill decay.`,
        priority: 'high',
      });
    }

    if (criticalCount > 0) {
      recommendations.push({
        type: 'critical_retention',
        message: `${criticalCount} concepts have critical retention levels (below 50%). Immediate review recommended.`,
        priority: 'urgent',
      });
    }

    if (avgRetention < 80 && avgRetention >= 60) {
      recommendations.push({
        type: 'retention_warning',
        message: 'Your average retention is declining. Consider increasing your review frequency.',
        priority: 'medium',
      });
    }

    if (stats.streakDays === 0 && stats.totalPending > 0) {
      recommendations.push({
        type: 'start_streak',
        message: 'Start a review streak today to build consistent learning habits.',
        priority: 'medium',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalConcepts,
          averageRetention: Math.round(avgRetention),
          atRiskCount,
          criticalCount,
          overdueCount: stats.overdueCount,
          dueTodayCount: stats.dueTodayCount,
          dueThisWeekCount: stats.dueThisWeekCount,
          averageEaseFactor: stats.averageEaseFactor,
          completedToday: stats.completedToday,
          streakDays: stats.streakDays,
        },
        byPriority,
        skills: filteredRetention,
        recommendations,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('[RETENTION ANALYSIS] Get error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid parameters', details: error.errors },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get retention analysis' } },
      { status: 500 }
    );
  }
}
