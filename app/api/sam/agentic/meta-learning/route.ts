/**
 * SAM Agentic Meta-Learning API
 * Provides meta-level learning analytics, pattern recognition, and system optimization insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { withSubscriptionGate } from '@/lib/sam/ai-provider';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { z } from 'zod';
import { withRetryableTimeout, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { logger } from '@/lib/logger';
import { getTaxomindContext } from '@/lib/sam/taxomind-context';
import {
  createMetaLearningAnalyzer,
  type MetaLearningAnalyzerConfig,
  AnalyticsPeriod,
  InsightType,
  InsightPriority,
  LearningEventSchema,
} from '@sam-ai/agentic';

// ============================================================================
// VALIDATION
// ============================================================================

const getAnalyticsQuerySchema = z.object({
  period: z.enum(['hour', 'day', 'week', 'month', 'quarter', 'all_time']).optional().default('week'),
});

const getInsightsQuerySchema = z.object({
  type: z.enum(['optimization', 'warning', 'recommendation', 'trend', 'anomaly']).optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low', 'info']).optional(),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
});

const recordEventBodySchema = LearningEventSchema;

// ============================================================================
// LAZY SINGLETON
// ============================================================================

let analyzerInstance: ReturnType<typeof createMetaLearningAnalyzer> | null = null;

function getMetaLearningAnalyzer() {
  if (!analyzerInstance) {
    let storeConfig: Pick<
      MetaLearningAnalyzerConfig,
      'patternStore' | 'insightStore' | 'strategyStore' | 'eventStore'
    > = {};

    try {
      const { stores } = getTaxomindContext();
      storeConfig = {
        patternStore: stores.learningPattern,
        insightStore: stores.metaLearningInsight,
        strategyStore: stores.learningStrategy,
        eventStore: stores.learningEvent,
      };
    } catch (error) {
      logger.warn('[MetaLearning] Prisma stores unavailable, using in-memory stores', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const config: MetaLearningAnalyzerConfig = {
      minEventsForPattern: 10,
      patternConfidenceThreshold: 0.6,
      minSampleSize: 5,
      logger: {
        debug: (msg: string, meta?: Record<string, unknown>) => logger.debug(`[MetaLearning] ${msg}`, meta),
        info: (msg: string, meta?: Record<string, unknown>) => logger.info(`[MetaLearning] ${msg}`, meta),
        warn: (msg: string, meta?: Record<string, unknown>) => logger.warn(`[MetaLearning] ${msg}`, meta),
        error: (msg: string, meta?: Record<string, unknown>) => logger.error(`[MetaLearning] ${msg}`, meta),
      },
      ...storeConfig,
    };
    analyzerInstance = createMetaLearningAnalyzer(config);
  }
  return analyzerInstance;
}

// ============================================================================
// GET /api/sam/agentic/meta-learning
// Returns meta-learning analytics and insights
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(req, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') ?? 'analytics';

    const analyzer = getMetaLearningAnalyzer();

    // Route based on action
    switch (action) {
      case 'analytics': {
        const parsed = getAnalyticsQuerySchema.safeParse({
          period: searchParams.get('period'),
        });

        if (!parsed.success) {
          return NextResponse.json(
            { success: false, error: 'Invalid parameters', details: parsed.error.issues },
            { status: 400 }
          );
        }

        const analytics = await withRetryableTimeout(
          () => analyzer.getAnalytics(
            user.id,
            parsed.data.period as AnalyticsPeriod
          ),
          TIMEOUT_DEFAULTS.AI_ANALYSIS,
          'metaLearningGetAnalytics'
        );

        return NextResponse.json({
          success: true,
          data: {
            analytics: {
              id: analytics.id,
              period: analytics.period,
              periodStart: analytics.periodStart.toISOString(),
              periodEnd: analytics.periodEnd.toISOString(),
              patternsIdentified: analytics.patternsIdentified,
              highConfidencePatterns: analytics.highConfidencePatterns,
              newPatterns: analytics.newPatterns,
              patternsByCategory: analytics.patternsByCategory,
              strategiesEvaluated: analytics.strategiesEvaluated,
              topStrategies: analytics.topStrategies,
              underperformingStrategies: analytics.underperformingStrategies,
              overallEffectiveness: analytics.overallEffectiveness,
              improvementFromBaseline: analytics.improvementFromBaseline,
              calibrationAccuracy: analytics.calibrationAccuracy,
              insightsGenerated: analytics.insightsGenerated,
              criticalInsights: analytics.criticalInsights,
              actionableRecommendations: analytics.actionableRecommendations,
              effectivenessTrend: analytics.effectivenessTrend,
              engagementTrend: analytics.engagementTrend,
              errorRateTrend: analytics.errorRateTrend,
              generatedAt: analytics.generatedAt.toISOString(),
            },
          },
        });
      }

      case 'insights': {
        const parsed = getInsightsQuerySchema.safeParse({
          type: searchParams.get('type') ?? undefined,
          priority: searchParams.get('priority') ?? undefined,
          limit: searchParams.get('limit') ?? undefined,
        });

        if (!parsed.success) {
          return NextResponse.json(
            { success: false, error: 'Invalid parameters', details: parsed.error.issues },
            { status: 400 }
          );
        }

        const insights = await withRetryableTimeout(
          () => analyzer.getActiveInsights(
            parsed.data.type as InsightType | undefined,
            parsed.data.priority as InsightPriority | undefined,
            parsed.data.limit
          ),
          TIMEOUT_DEFAULTS.AI_ANALYSIS,
          'metaLearningGetInsights'
        );

        return NextResponse.json({
          success: true,
          data: {
            insights: insights.map((insight) => ({
              id: insight.id,
              type: insight.type,
              priority: insight.priority,
              title: insight.title,
              description: insight.description,
              evidence: insight.evidence,
              recommendations: insight.recommendations,
              confidence: insight.confidence,
              expectedImpact: insight.expectedImpact,
              affectedAreas: insight.affectedAreas,
              timeframe: insight.timeframe,
              generatedAt: insight.generatedAt.toISOString(),
              validUntil: insight.validUntil?.toISOString(),
            })),
            total: insights.length,
          },
        });
      }

      case 'patterns': {
        const patterns = await withRetryableTimeout(
          () => analyzer.detectPatterns(user.id),
          TIMEOUT_DEFAULTS.AI_ANALYSIS,
          'metaLearningDetectPatterns'
        );

        return NextResponse.json({
          success: true,
          data: {
            patterns: patterns.map((pattern) => ({
              id: pattern.id,
              category: pattern.category,
              name: pattern.name,
              description: pattern.description,
              confidence: pattern.confidence,
              confidenceScore: pattern.confidenceScore,
              occurrenceCount: pattern.occurrenceCount,
              sampleSize: pattern.sampleSize,
              significanceLevel: pattern.significanceLevel,
              successRate: pattern.successRate,
              avgImpact: pattern.avgImpact,
              consistency: pattern.consistency,
              trend: pattern.trend,
              firstObserved: pattern.firstObserved.toISOString(),
              lastObserved: pattern.lastObserved.toISOString(),
            })),
            total: patterns.length,
          },
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Error in meta-learning GET:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve meta-learning data' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/sam/agentic/meta-learning
// Record learning events and generate insights
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(req, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const gateResult = await withSubscriptionGate(user.id, { category: 'premium-feature' });
    if (!gateResult.allowed && gateResult.response) return gateResult.response;

    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') ?? 'record-event';

    const analyzer = getMetaLearningAnalyzer();

    switch (action) {
      case 'record-event': {
        const parsed = recordEventBodySchema.safeParse(body);

        if (!parsed.success) {
          return NextResponse.json(
            { success: false, error: 'Invalid event data', details: parsed.error.issues },
            { status: 400 }
          );
        }

        const event = await analyzer.recordEvent({
          ...parsed.data,
          userId: user.id,
          timestamp: new Date(),
        });

        return NextResponse.json({
          success: true,
          data: {
            event: {
              id: event.id,
              eventType: event.eventType,
              userId: event.userId,
              sessionId: event.sessionId,
              timestamp: event.timestamp.toISOString(),
            },
          },
        });
      }

      case 'generate-insights': {
        const insights = await withRetryableTimeout(
          () => analyzer.generateInsights(user.id),
          TIMEOUT_DEFAULTS.AI_ANALYSIS,
          'metaLearningGenerateInsights'
        );

        return NextResponse.json({
          success: true,
          data: {
            insights: insights.map((insight) => ({
              id: insight.id,
              type: insight.type,
              priority: insight.priority,
              title: insight.title,
              description: insight.description,
              recommendations: insight.recommendations,
              confidence: insight.confidence,
              expectedImpact: insight.expectedImpact,
              generatedAt: insight.generatedAt.toISOString(),
            })),
            count: insights.length,
          },
        });
      }

      case 'detect-patterns': {
        const since = body.since ? new Date(body.since) : undefined;
        const patterns = await withRetryableTimeout(
          () => analyzer.detectPatterns(user.id, since),
          TIMEOUT_DEFAULTS.AI_ANALYSIS,
          'metaLearningDetectPatternsPost'
        );

        return NextResponse.json({
          success: true,
          data: {
            patterns: patterns.map((pattern) => ({
              id: pattern.id,
              category: pattern.category,
              name: pattern.name,
              description: pattern.description,
              confidence: pattern.confidence,
              confidenceScore: pattern.confidenceScore,
              successRate: pattern.successRate,
              trend: pattern.trend,
            })),
            count: patterns.length,
          },
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Error in meta-learning POST:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process meta-learning request' },
      { status: 500 }
    );
  }
}
