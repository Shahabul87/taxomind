/**
 * SAM Agentic Recommendations API
 * Generates personalized learning recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getAnalyticsStores } from '@/lib/sam/taxomind-context';
import {
  createProgressAnalyzer,
  createSkillAssessor,
  createRecommendationEngine,
  ContentType,
  type RecommendationBatch as AgenticRecommendationBatch,
} from '@sam-ai/agentic';

// ============================================================================
// VALIDATION
// ============================================================================

const querySchema = z.object({
  time: z.coerce.number().min(5).max(480).optional().default(60),
  limit: z.coerce.number().min(1).max(20).optional().default(5),
  types: z.string().optional(),
});

// ============================================================================
// LAZY SINGLETONS (using TaxomindContext stores)
// ============================================================================

let progressAnalyzerInstance: ReturnType<typeof createProgressAnalyzer> | null = null;
let skillAssessorInstance: ReturnType<typeof createSkillAssessor> | null = null;
let recommendationEngineInstance: ReturnType<typeof createRecommendationEngine> | null = null;

function getProgressAnalyzer() {
  if (!progressAnalyzerInstance) {
    const stores = getAnalyticsStores();
    progressAnalyzerInstance = createProgressAnalyzer({
      logger,
      sessionStore: stores.learningSession,
      progressStore: stores.topicProgress,
      gapStore: stores.learningGap,
    });
  }
  return progressAnalyzerInstance;
}

function getSkillAssessor() {
  if (!skillAssessorInstance) {
    const stores = getAnalyticsStores();
    skillAssessorInstance = createSkillAssessor({
      logger,
      store: stores.skillAssessment,
    });
  }
  return skillAssessorInstance;
}

function getRecommendationEngine() {
  if (!recommendationEngineInstance) {
    const stores = getAnalyticsStores();
    recommendationEngineInstance = createRecommendationEngine({
      logger,
      recommendationStore: stores.recommendation,
      contentStore: stores.content,
    });
  }
  return recommendationEngineInstance;
}

function mapRecommendationType(type: ContentType): 'content' | 'practice' | 'review' | 'assessment' | 'break' | 'goal' {
  if ([ContentType.EXERCISE, ContentType.QUIZ, ContentType.PROJECT].includes(type)) {
    return 'practice';
  }
  return 'content';
}

function mapRecommendationBatch(batch: AgenticRecommendationBatch, availableTime: number, limit: number) {
  return {
    recommendations: batch.recommendations.slice(0, limit).map((rec) => ({
      id: rec.id,
      type: mapRecommendationType(rec.type),
      title: rec.title,
      description: rec.description ?? '',
      reason: rec.reason,
      priority: rec.priority === 'critical' ? 'high' : rec.priority,
      estimatedMinutes: rec.estimatedDuration,
      targetUrl: rec.resourceUrl ?? undefined,
      metadata: {
        resourceId: rec.resourceId,
        difficulty: rec.difficulty,
        confidence: rec.confidence,
      },
    })),
    totalEstimatedTime: batch.totalEstimatedTime,
    generatedAt: batch.generatedAt.toISOString(),
    context: {
      availableTime,
      currentGoals: batch.basedOn.currentGoals,
      recentTopics: batch.basedOn.recentTopics,
    },
  };
}

// ============================================================================
// GET /api/sam/agentic/recommendations
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      time: searchParams.get('time') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      types: searchParams.get('types') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { time, limit } = parsed.data;

    const progressAnalyzer = getProgressAnalyzer();
    const skillAssessor = getSkillAssessor();
    const recommendationEngine = getRecommendationEngine();

    const [learningGaps, topicProgress, skillAssessments] = await Promise.all([
      progressAnalyzer.detectGaps(user.id),
      progressAnalyzer.getAllProgress(user.id),
      skillAssessor.getUserAssessments(user.id),
    ]);

    const batch = await recommendationEngine.generateRecommendations({
      userId: user.id,
      learningGaps,
      topicProgress,
      skillAssessments,
      availableTime: time,
    });

    return NextResponse.json({
      success: true,
      data: mapRecommendationBatch(batch, time, limit),
    });
  } catch (error) {
    logger.error('Error generating recommendations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
