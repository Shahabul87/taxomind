/**
 * SAM Recommendation Tracking API
 *
 * Tracks recommendation outcomes, measures effectiveness, and provides insights
 * on how well recommendations are serving users.
 *
 * Features:
 * - Track when users follow recommendations
 * - Measure outcomes after following recommendations
 * - Calculate recommendation effectiveness scores
 * - Provide insights on what types of recommendations work best
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { SAMRecommendationAction } from '@prisma/client';
import { z } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

interface RecommendationOutcome {
  recommendationId: string;
  recommendationType: string;
  wasFollowed: boolean;
  outcomeScore?: number; // 0-100 measuring how well the outcome was
  timeToAction?: number; // milliseconds from recommendation to action
  context?: Record<string, unknown>;
}

interface RecommendationInsight {
  type: string;
  totalRecommendations: number;
  followedCount: number;
  followRate: number;
  avgOutcomeScore: number;
  effectiveness: number;
  trend: 'improving' | 'stable' | 'declining';
}

interface RecommendationAnalytics {
  userId: string;
  generatedAt: Date;
  totalRecommendations: number;
  totalFollowed: number;
  overallFollowRate: number;
  overallEffectiveness: number;
  byType: RecommendationInsight[];
  recentOutcomes: RecommendationOutcome[];
  topPerformingTypes: string[];
  improvementAreas: string[];
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const TrackRecommendationSchema = z.object({
  recommendationId: z.string().min(1),
  recommendationType: z.enum([
    'content',
    'practice',
    'review',
    'course',
    'skill',
    'study_time',
    'learning_path',
    'intervention',
    'social',
    'other',
  ]),
  action: z.enum(['viewed', 'followed', 'dismissed', 'deferred']),
  outcomeScore: z.number().min(0).max(100).optional(),
  context: z.record(z.unknown()).optional(),
});

const GetAnalyticsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  type: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
});

// ============================================================================
// GET - Get recommendation analytics
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100);

    // Build date filter
    const dateFilter: Record<string, unknown> = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Fetch recommendation tracking data
    const trackingData = await db.sAMRecommendationTracking.findMany({
      where: {
        userId: user.id,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
        ...(type && { recommendationType: type }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Calculate analytics
    const analytics = calculateAnalytics(user.id, trackingData);

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error('Error fetching recommendation analytics', { error });
    return NextResponse.json(
      { error: 'Failed to fetch recommendation analytics' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Track a recommendation action
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = TrackRecommendationSchema.parse(body);

    // Create tracking record
    const tracking = await db.sAMRecommendationTracking.create({
      data: {
        userId: user.id,
        recommendationId: validatedData.recommendationId,
        recommendationType: validatedData.recommendationType,
        action: validatedData.action.toUpperCase() as SAMRecommendationAction,
        outcomeScore: validatedData.outcomeScore,
        context: validatedData.context ?? {},
        wasFollowed: validatedData.action === 'followed',
        actionTimestamp: new Date(),
      },
    });

    // Update aggregated stats
    await updateAggregatedStats(user.id, validatedData.recommendationType);

    return NextResponse.json({
      success: true,
      data: {
        trackingId: tracking.id,
        message: 'Recommendation tracked successfully',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Error tracking recommendation', { error });
    return NextResponse.json(
      { error: 'Failed to track recommendation' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update recommendation outcome
// ============================================================================

export async function PATCH(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { trackingId, outcomeScore, outcomeContext } = body;

    if (!trackingId) {
      return NextResponse.json({ error: 'Tracking ID required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await db.sAMRecommendationTracking.findFirst({
      where: {
        id: trackingId,
        userId: user.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Tracking record not found' }, { status: 404 });
    }

    // Update with outcome
    const updated = await db.sAMRecommendationTracking.update({
      where: { id: trackingId },
      data: {
        outcomeScore: outcomeScore ?? existing.outcomeScore,
        outcomeRecordedAt: new Date(),
        context: {
          ...(existing.context as Record<string, unknown>),
          outcome: outcomeContext,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        trackingId: updated.id,
        message: 'Outcome recorded successfully',
      },
    });
  } catch (error) {
    logger.error('Error updating recommendation outcome', { error });
    return NextResponse.json(
      { error: 'Failed to update outcome' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

interface TrackingRecord {
  id: string;
  recommendationType: string;
  wasFollowed: boolean;
  outcomeScore: number | null;
  createdAt: Date;
  context: unknown;
}

function calculateAnalytics(userId: string, trackingData: TrackingRecord[]): RecommendationAnalytics {
  const totalRecommendations = trackingData.length;
  const totalFollowed = trackingData.filter((t) => t.wasFollowed).length;
  const overallFollowRate = totalRecommendations > 0 ? (totalFollowed / totalRecommendations) * 100 : 0;

  // Calculate outcomes for followed recommendations
  const followedWithOutcome = trackingData.filter(
    (t) => t.wasFollowed && t.outcomeScore != null
  );
  const overallEffectiveness =
    followedWithOutcome.length > 0
      ? followedWithOutcome.reduce((sum, t) => sum + (t.outcomeScore ?? 0), 0) / followedWithOutcome.length
      : 0;

  // Group by type
  const byTypeMap = new Map<string, TrackingRecord[]>();
  trackingData.forEach((t) => {
    const existing = byTypeMap.get(t.recommendationType) ?? [];
    byTypeMap.set(t.recommendationType, [...existing, t]);
  });

  const byType: RecommendationInsight[] = Array.from(byTypeMap.entries()).map(([type, records]) => {
    const followed = records.filter((r) => r.wasFollowed);
    const withOutcome = followed.filter((r) => r.outcomeScore != null);
    const avgOutcome =
      withOutcome.length > 0
        ? withOutcome.reduce((sum, r) => sum + (r.outcomeScore ?? 0), 0) / withOutcome.length
        : 0;

    // Calculate trend based on recent vs older data
    const midpoint = Math.floor(records.length / 2);
    const recent = records.slice(0, midpoint);
    const older = records.slice(midpoint);
    const recentFollowRate = recent.length > 0 ? recent.filter((r) => r.wasFollowed).length / recent.length : 0;
    const olderFollowRate = older.length > 0 ? older.filter((r) => r.wasFollowed).length / older.length : 0;

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentFollowRate > olderFollowRate + 0.1) trend = 'improving';
    else if (recentFollowRate < olderFollowRate - 0.1) trend = 'declining';

    return {
      type,
      totalRecommendations: records.length,
      followedCount: followed.length,
      followRate: records.length > 0 ? (followed.length / records.length) * 100 : 0,
      avgOutcomeScore: avgOutcome,
      effectiveness: avgOutcome * (followed.length / Math.max(records.length, 1)),
      trend,
    };
  });

  // Sort by effectiveness
  byType.sort((a, b) => b.effectiveness - a.effectiveness);

  // Recent outcomes
  const recentOutcomes = trackingData.slice(0, 10).map((t) => ({
    recommendationId: t.id,
    recommendationType: t.recommendationType,
    wasFollowed: t.wasFollowed,
    outcomeScore: t.outcomeScore ?? undefined,
    context: t.context as Record<string, unknown> | undefined,
  }));

  // Top performing types
  const topPerformingTypes = byType
    .filter((t) => t.effectiveness > 50)
    .slice(0, 3)
    .map((t) => t.type);

  // Areas for improvement
  const improvementAreas = byType
    .filter((t) => t.followRate < 30 || t.avgOutcomeScore < 50)
    .map((t) => t.type);

  return {
    userId,
    generatedAt: new Date(),
    totalRecommendations,
    totalFollowed,
    overallFollowRate,
    overallEffectiveness,
    byType,
    recentOutcomes,
    topPerformingTypes,
    improvementAreas,
  };
}

async function updateAggregatedStats(userId: string, recommendationType: string) {
  try {
    // Get recent data for this type
    const recentData = await db.sAMRecommendationTracking.findMany({
      where: {
        userId,
        recommendationType,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      take: 500,
    });

    const followed = recentData.filter((d) => d.wasFollowed).length;
    const followRate = recentData.length > 0 ? followed / recentData.length : 0;

    // Upsert aggregated stats
    await db.sAMRecommendationStats.upsert({
      where: {
        userId_recommendationType: {
          userId,
          recommendationType,
        },
      },
      update: {
        totalRecommendations: { increment: 1 },
        totalFollowed: { increment: followed > 0 ? 1 : 0 },
        followRate30d: followRate,
        updatedAt: new Date(),
      },
      create: {
        userId,
        recommendationType,
        totalRecommendations: 1,
        totalFollowed: followed > 0 ? 1 : 0,
        followRate30d: followRate,
      },
    });
  } catch (error) {
    // Non-critical, log and continue
    logger.warn('Failed to update aggregated stats', { error, userId, recommendationType });
  }
}
