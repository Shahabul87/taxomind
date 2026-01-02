/**
 * SAM AI Mentor - Mastery Map API
 *
 * Provides visualization of student knowledge mastery across topics.
 * Note: Uses SAMInteraction for data until dedicated models are added.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schemas
const GetMasteryMapSchema = z.object({
  courseId: z.string().uuid().optional(),
  depth: z.enum(['overview', 'detailed']).optional().default('overview'),
});

// Context type for mastery data
interface MasteryDataContext {
  type: 'review_entry' | 'misconception' | 'confidence_log';
  topic?: string;
  topicId?: string;
  masteryLevel?: number;
  confidence?: number;
  isCorrect?: boolean;
}

interface TopicMastery {
  topicId: string;
  topicName: string;
  masteryLevel: number;
  confidence: number;
  reviewCount: number;
  misconceptionCount: number;
  trend: 'improving' | 'stable' | 'declining';
  lastActivity: string | null;
}

/**
 * GET - Get mastery map for user
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
    const validatedParams = GetMasteryMapSchema.parse({
      courseId: searchParams.get('courseId') || undefined,
      depth: searchParams.get('depth') || 'overview',
    });

    // Get all relevant interactions
    const interactions = await db.sAMInteraction.findMany({
      where: {
        userId: user.id,
        interactionType: 'ANALYTICS_VIEW',
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    // Group by topic
    const topicData = new Map<string, {
      reviews: number;
      misconceptions: number;
      masterySum: number;
      confidenceSum: number;
      correctCount: number;
      totalCount: number;
      lastActivity: Date | null;
    }>();

    for (const interaction of interactions) {
      const ctx = interaction.context as unknown as MasteryDataContext | null;
      if (!ctx) continue;

      const topicId = ctx.topic || ctx.topicId;
      if (!topicId) continue;

      if (!topicData.has(topicId)) {
        topicData.set(topicId, {
          reviews: 0,
          misconceptions: 0,
          masterySum: 0,
          confidenceSum: 0,
          correctCount: 0,
          totalCount: 0,
          lastActivity: null,
        });
      }

      const data = topicData.get(topicId)!;

      if (ctx.type === 'review_entry') {
        data.reviews++;
        if (ctx.masteryLevel !== undefined) {
          data.masterySum += ctx.masteryLevel;
        }
      } else if (ctx.type === 'misconception') {
        data.misconceptions++;
      } else if (ctx.type === 'confidence_log') {
        if (ctx.confidence !== undefined) {
          data.confidenceSum += ctx.confidence;
          data.totalCount++;
          if (ctx.isCorrect) data.correctCount++;
        }
      }

      if (!data.lastActivity || interaction.createdAt > data.lastActivity) {
        data.lastActivity = interaction.createdAt;
      }
    }

    // Build mastery map
    const masteryMap: TopicMastery[] = [];

    for (const [topicId, data] of topicData) {
      const avgMastery = data.reviews > 0 ? data.masterySum / data.reviews : 0;
      const avgConfidence = data.totalCount > 0 ? data.confidenceSum / data.totalCount : 0;
      const accuracy = data.totalCount > 0 ? data.correctCount / data.totalCount : 0;

      // Determine trend based on mastery vs confidence gap
      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (accuracy > avgConfidence) {
        trend = 'improving';
      } else if (accuracy < avgConfidence - 0.2) {
        trend = 'declining';
      }

      masteryMap.push({
        topicId,
        topicName: topicId, // In a real implementation, we'd look up the topic name
        masteryLevel: Math.round(Math.max(avgMastery, accuracy) * 100) / 100,
        confidence: Math.round(avgConfidence * 100) / 100,
        reviewCount: data.reviews,
        misconceptionCount: data.misconceptions,
        trend,
        lastActivity: data.lastActivity?.toISOString() || null,
      });
    }

    // Sort by mastery level (lowest first for areas needing attention)
    masteryMap.sort((a, b) => a.masteryLevel - b.masteryLevel);

    // Calculate overall stats
    const totalTopics = masteryMap.length;
    const avgMastery = totalTopics > 0
      ? masteryMap.reduce((sum, t) => sum + t.masteryLevel, 0) / totalTopics
      : 0;
    const topicsNeedingWork = masteryMap.filter(t => t.masteryLevel < 0.6).length;
    const topicsMastered = masteryMap.filter(t => t.masteryLevel >= 0.8).length;

    return NextResponse.json({
      success: true,
      data: {
        topics: validatedParams.depth === 'overview' ? masteryMap.slice(0, 20) : masteryMap,
        stats: {
          totalTopics,
          avgMastery: Math.round(avgMastery * 100),
          topicsNeedingWork,
          topicsMastered,
          topicsInProgress: totalTopics - topicsNeedingWork - topicsMastered,
        },
        recommendations: topicsNeedingWork > 0
          ? masteryMap.slice(0, 3).map(t => ({
              topic: t.topicName,
              suggestion: t.masteryLevel < 0.3
                ? 'Review fundamentals'
                : t.masteryLevel < 0.6
                ? 'Practice with exercises'
                : 'Ready for assessment',
            }))
          : [],
      },
    });

  } catch (error) {
    logger.error('[MASTERY MAP] Get error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid parameters', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get mastery map' } },
      { status: 500 }
    );
  }
}
