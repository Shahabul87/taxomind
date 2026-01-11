/**
 * SAM Meta-Learning Insights API
 *
 * Provides meta-level learning analytics, pattern recognition, and system optimization.
 * Uses the @sam-ai/agentic meta-learning analyzer.
 *
 * Endpoints:
 * - GET: Get active insights and analytics
 * - POST: Record learning events and trigger analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import {
  createMetaLearningAnalyzer,
  PatternCategory,
  InsightType,
  InsightPriority,
  AnalyticsPeriod,
  LearningEventType,
  type LearningEvent,
  type MetaLearningAnalytics,
  type MetaLearningInsight,
} from '@sam-ai/agentic';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const LearningEventSchema = z.object({
  sessionId: z.string().min(1),
  eventType: z.enum([
    'question_asked',
    'explanation_provided',
    'hint_given',
    'feedback_delivered',
    'assessment_completed',
    'concept_introduced',
    'practice_session',
    'review_session',
    'error_correction',
    'strategy_applied',
  ]),
  courseId: z.string().optional(),
  sectionId: z.string().optional(),
  topic: z.string().optional(),
  duration: z.number().int().min(0).optional(),
  outcome: z.enum(['success', 'partial', 'failure']).optional(),
  confidence: z.number().min(0).max(1).optional(),
  strategyId: z.string().optional(),
  strategyApplied: z.string().optional(),
  responseQuality: z.number().min(0).max(100).optional(),
  studentSatisfaction: z.number().min(1).max(5).optional(),
  metadata: z.record(z.unknown()).optional().default({}),
});

const RecordEventsSchema = z.object({
  events: z.array(LearningEventSchema).min(1).max(100),
  triggerAnalysis: z.boolean().optional().default(false),
});

const GetInsightsQuerySchema = z.object({
  type: z.enum([
    'optimization',
    'warning',
    'recommendation',
    'trend',
    'anomaly',
    'correlation',
    'prediction',
  ]).optional(),
  priority: z.enum(['critical', 'high', 'medium', 'low', 'info']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  includeAnalytics: z.coerce.boolean().optional().default(true),
  period: z.enum(['hour', 'day', 'week', 'month', 'quarter', 'all_time']).optional().default('week'),
});

// ============================================================================
// Singleton analyzer instance
// ============================================================================

let analyzerInstance: ReturnType<typeof createMetaLearningAnalyzer> | null = null;

function getAnalyzer() {
  if (!analyzerInstance) {
    analyzerInstance = createMetaLearningAnalyzer({
      minEventsForPattern: 10,
      patternConfidenceThreshold: 0.6,
      minSampleSize: 5,
    });
  }
  return analyzerInstance;
}

// ============================================================================
// GET - Get Insights and Analytics
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const params = GetInsightsQuerySchema.parse({
      type: searchParams.get('type') ?? undefined,
      priority: searchParams.get('priority') ?? undefined,
      limit: searchParams.get('limit') ?? 20,
      includeAnalytics: searchParams.get('includeAnalytics') ?? true,
      period: searchParams.get('period') ?? 'week',
    });

    const analyzer = getAnalyzer();
    const startTime = Date.now();

    // Get active insights
    const insights = await analyzer.getActiveInsights(
      params.type as InsightType | undefined,
      params.priority as InsightPriority | undefined,
      params.limit
    );

    // Get analytics if requested
    let analytics: MetaLearningAnalytics | null = null;
    if (params.includeAnalytics) {
      analytics = await analyzer.getAnalytics(
        session.user.id,
        params.period as AnalyticsPeriod
      );
    }

    const processingTime = Date.now() - startTime;

    logger.info('[META_LEARNING] Insights retrieved', {
      userId: session.user.id,
      insightCount: insights.length,
      includeAnalytics: params.includeAnalytics,
      processingTimeMs: processingTime,
    });

    return NextResponse.json({
      success: true,
      data: {
        insights: insights.map(transformInsight),
        analytics: analytics ? transformAnalytics(analytics) : null,
        metadata: {
          insightCount: insights.length,
          period: params.period,
          processingTimeMs: processingTime,
        },
      },
    });
  } catch (error) {
    logger.error('[META_LEARNING] Error getting insights:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get meta-learning insights' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Record Events and Trigger Analysis
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = RecordEventsSchema.parse(body);

    const analyzer = getAnalyzer();
    const startTime = Date.now();

    // Record all events
    const recordedEvents: LearningEvent[] = [];
    for (const event of validated.events) {
      const recorded = await analyzer.recordEvent({
        userId: session.user.id,
        sessionId: event.sessionId,
        eventType: event.eventType as LearningEventType,
        timestamp: new Date(),
        courseId: event.courseId,
        sectionId: event.sectionId,
        topic: event.topic,
        duration: event.duration,
        outcome: event.outcome,
        confidence: event.confidence,
        strategyId: event.strategyId,
        strategyApplied: event.strategyApplied,
        responseQuality: event.responseQuality,
        studentSatisfaction: event.studentSatisfaction,
        metadata: event.metadata ?? {},
      });
      recordedEvents.push(recorded);
    }

    // Trigger analysis if requested
    let patterns = null;
    let newInsights = null;
    if (validated.triggerAnalysis) {
      patterns = await analyzer.detectPatterns(session.user.id);
      newInsights = await analyzer.generateInsights(session.user.id);
    }

    const processingTime = Date.now() - startTime;

    logger.info('[META_LEARNING] Events recorded', {
      userId: session.user.id,
      eventCount: recordedEvents.length,
      triggeredAnalysis: validated.triggerAnalysis,
      patternsDetected: patterns?.length ?? 0,
      insightsGenerated: newInsights?.length ?? 0,
      processingTimeMs: processingTime,
    });

    return NextResponse.json({
      success: true,
      data: {
        eventsRecorded: recordedEvents.length,
        eventIds: recordedEvents.map((e) => e.id),
        analysis: validated.triggerAnalysis
          ? {
              patternsDetected: patterns?.length ?? 0,
              patterns: patterns?.map((p) => ({
                id: p.id,
                category: p.category,
                name: p.name,
                confidence: p.confidence,
                successRate: p.successRate,
              })),
              insightsGenerated: newInsights?.length ?? 0,
              insights: newInsights?.map(transformInsight),
            }
          : null,
        processingTimeMs: processingTime,
      },
    });
  } catch (error) {
    logger.error('[META_LEARNING] Error recording events:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to record learning events' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function transformInsight(insight: MetaLearningInsight) {
  return {
    id: insight.id,
    type: insight.type,
    priority: insight.priority,
    title: insight.title,
    description: insight.description,
    evidence: insight.evidence,
    recommendations: insight.recommendations.map((r) => ({
      action: r.action,
      rationale: r.rationale,
      priority: r.priority,
      effort: r.effort,
      expectedOutcome: r.expectedOutcome,
    })),
    confidence: insight.confidence,
    expectedImpact: insight.expectedImpact,
    affectedAreas: insight.affectedAreas,
    timeframe: insight.timeframe,
    generatedAt: insight.generatedAt.toISOString(),
    validUntil: insight.validUntil?.toISOString(),
  };
}

function transformAnalytics(analytics: MetaLearningAnalytics) {
  return {
    id: analytics.id,
    period: analytics.period,
    periodStart: analytics.periodStart.toISOString(),
    periodEnd: analytics.periodEnd.toISOString(),
    patterns: {
      total: analytics.patternsIdentified,
      highConfidence: analytics.highConfidencePatterns,
      new: analytics.newPatterns,
      byCategory: analytics.patternsByCategory,
    },
    strategies: {
      evaluated: analytics.strategiesEvaluated,
      top: analytics.topStrategies,
      underperforming: analytics.underperformingStrategies,
    },
    performance: {
      effectiveness: analytics.overallEffectiveness,
      improvementFromBaseline: analytics.improvementFromBaseline,
      calibrationAccuracy: analytics.calibrationAccuracy,
    },
    insights: {
      total: analytics.insightsGenerated,
      critical: analytics.criticalInsights,
      actionable: analytics.actionableRecommendations,
    },
    trends: {
      effectiveness: {
        direction: analytics.effectivenessTrend.direction,
        changeRate: analytics.effectivenessTrend.changeRate,
        confidence: analytics.effectivenessTrend.confidence,
      },
      engagement: {
        direction: analytics.engagementTrend.direction,
        changeRate: analytics.engagementTrend.changeRate,
        confidence: analytics.engagementTrend.confidence,
      },
      errorRate: {
        direction: analytics.errorRateTrend.direction,
        changeRate: analytics.errorRateTrend.changeRate,
        confidence: analytics.errorRateTrend.confidence,
      },
    },
    generatedAt: analytics.generatedAt.toISOString(),
  };
}
