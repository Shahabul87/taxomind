/**
 * SAM Agentic Recommendations API
 * Generates personalized learning recommendations with feedback-aware improvements
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getAnalyticsStores } from '@/lib/sam/taxomind-context';
import { getQuickPreferences } from '@/lib/sam/recommendation-feedback-analyzer';
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

    // Get user feedback preferences to improve recommendations
    const [learningGaps, topicProgress, skillAssessments, feedbackPrefs] = await Promise.all([
      progressAnalyzer.detectGaps(user.id),
      progressAnalyzer.getAllProgress(user.id),
      skillAssessor.getUserAssessments(user.id),
      getQuickPreferences(user.id).catch(() => ({
        preferredTypes: [] as string[],
        avoidedTypes: [] as string[],
        difficultyBias: 0,
        hasEnoughData: false,
      })),
    ]);

    const batch = await recommendationEngine.generateRecommendations({
      userId: user.id,
      learningGaps,
      topicProgress,
      skillAssessments,
      availableTime: time,
    });

    // Apply feedback-based filtering and reordering
    let filteredRecommendations = batch.recommendations;
    if (feedbackPrefs.hasEnoughData) {
      // Filter out types the user consistently dislikes
      if (feedbackPrefs.avoidedTypes.length > 0) {
        filteredRecommendations = filteredRecommendations.filter(
          (rec) => !feedbackPrefs.avoidedTypes.includes(rec.type)
        );
      }

      // Boost preferred types to the top
      if (feedbackPrefs.preferredTypes.length > 0) {
        filteredRecommendations.sort((a, b) => {
          const aPreferred = feedbackPrefs.preferredTypes.includes(a.type) ? 1 : 0;
          const bPreferred = feedbackPrefs.preferredTypes.includes(b.type) ? 1 : 0;
          return bPreferred - aPreferred;
        });
      }
    }

    const adjustedBatch: AgenticRecommendationBatch = {
      ...batch,
      recommendations: filteredRecommendations,
    };

    return NextResponse.json({
      success: true,
      data: {
        ...mapRecommendationBatch(adjustedBatch, time, limit),
        feedbackAdjusted: feedbackPrefs.hasEnoughData,
        preferences: feedbackPrefs.hasEnoughData ? {
          preferredTypes: feedbackPrefs.preferredTypes,
          difficultyBias: feedbackPrefs.difficultyBias,
        } : undefined,
      },
    });
  } catch (error) {
    logger.error('Error generating recommendations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
