/**
 * SAM Cognitive Load Detection API
 *
 * Provides real-time cognitive load assessment for learners.
 * Analyzes learning behavior patterns, content complexity, and interaction metrics
 * to estimate current cognitive load and suggest appropriate interventions.
 *
 * Endpoints:
 * - POST: Analyze cognitive load based on session data
 * - GET: Get user's cognitive load history and patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withSubscriptionGate } from '@/lib/sam/ai-provider';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

// ============================================================================
// TYPES
// ============================================================================

interface CognitiveLoadFactors {
  intrinsicLoad: number; // Content complexity (0-100)
  extraneousLoad: number; // Interface/distraction load (0-100)
  germaneLoad: number; // Learning effort load (0-100)
}

interface CognitiveLoadResult {
  id: string;
  userId: string;
  sessionId: string;
  instantaneousLoad: number;
  factors: CognitiveLoadFactors;
  trend: 'increasing' | 'stable' | 'decreasing';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  interventionSuggested: boolean;
  analyzedAt: string;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const SessionDataSchema = z.object({
  sessionId: z.string().min(1),
  // Content context
  courseId: z.string().optional(),
  sectionId: z.string().optional(),
  topicComplexity: z.number().min(0).max(100).optional(),
  contentDensity: z.number().min(0).max(100).optional(),

  // Time metrics
  timeOnTask: z.number().min(0).optional(), // seconds
  idleTime: z.number().min(0).optional(), // seconds
  lastActivityAt: z.string().datetime().optional(),

  // Interaction metrics
  clickCount: z.number().int().min(0).optional(),
  scrollCount: z.number().int().min(0).optional(),
  hintRequests: z.number().int().min(0).optional(),
  errorCount: z.number().int().min(0).optional(),

  // Performance indicators
  correctAnswers: z.number().int().min(0).optional(),
  totalQuestions: z.number().int().min(0).optional(),
  averageResponseTime: z.number().min(0).optional(), // ms

  // Emotional/behavioral signals (optional from behavior tracking)
  frustrationIndicators: z.number().min(0).max(100).optional(),
  engagementLevel: z.number().min(0).max(100).optional(),

  // Previous load for trend analysis
  previousLoad: z.number().min(0).max(100).optional(),
});

const GetHistorySchema = z.object({
  sessionId: z.string().optional(),
  courseId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
});

// ============================================================================
// COGNITIVE LOAD CALCULATION ENGINE
// ============================================================================

function calculateCognitiveLoad(data: z.infer<typeof SessionDataSchema>): {
  instantaneousLoad: number;
  factors: CognitiveLoadFactors;
  trend: 'increasing' | 'stable' | 'decreasing';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  interventionSuggested: boolean;
} {
  // Calculate Intrinsic Load (content complexity)
  let intrinsicLoad = data.topicComplexity ?? 50;
  intrinsicLoad += (data.contentDensity ?? 50) * 0.3;
  intrinsicLoad = Math.min(100, Math.max(0, intrinsicLoad));

  // Calculate Extraneous Load (interface/distraction factors)
  let extraneousLoad = 0;

  // High click count without progress suggests poor UX or confusion
  if (data.clickCount && data.clickCount > 50) {
    extraneousLoad += Math.min(30, (data.clickCount - 50) * 0.5);
  }

  // Frequent hint requests suggest content presentation issues
  if (data.hintRequests && data.hintRequests > 3) {
    extraneousLoad += Math.min(25, (data.hintRequests - 3) * 5);
  }

  // High idle time suggests distraction
  if (data.idleTime && data.timeOnTask) {
    const idleRatio = data.idleTime / data.timeOnTask;
    if (idleRatio > 0.3) {
      extraneousLoad += Math.min(30, idleRatio * 50);
    }
  }

  // Frustration indicators contribute to extraneous load
  if (data.frustrationIndicators) {
    extraneousLoad += data.frustrationIndicators * 0.4;
  }

  extraneousLoad = Math.min(100, Math.max(0, extraneousLoad));

  // Calculate Germane Load (productive learning effort)
  let germaneLoad = 50; // Base effort

  // Performance affects germane load perception
  if (data.correctAnswers !== undefined && data.totalQuestions && data.totalQuestions > 0) {
    const accuracy = data.correctAnswers / data.totalQuestions;
    // Sweet spot is around 60-80% - too easy or too hard reduces germane effort
    if (accuracy >= 0.6 && accuracy <= 0.8) {
      germaneLoad = 70 + (accuracy - 0.5) * 60;
    } else if (accuracy < 0.6) {
      germaneLoad = 50 + accuracy * 50;
    } else {
      germaneLoad = 40 + (1 - accuracy) * 100;
    }
  }

  // Engagement level positively affects germane load
  if (data.engagementLevel) {
    germaneLoad = germaneLoad * 0.6 + data.engagementLevel * 0.4;
  }

  germaneLoad = Math.min(100, Math.max(0, germaneLoad));

  // Calculate total instantaneous load (weighted combination)
  // Intrinsic: 40%, Extraneous: 35%, Germane: 25%
  const instantaneousLoad = Math.min(
    100,
    intrinsicLoad * 0.4 + extraneousLoad * 0.35 + germaneLoad * 0.25
  );

  // Determine trend
  let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
  if (data.previousLoad !== undefined) {
    const diff = instantaneousLoad - data.previousLoad;
    if (diff > 10) trend = 'increasing';
    else if (diff < -10) trend = 'decreasing';
  }

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (instantaneousLoad >= 90) riskLevel = 'critical';
  else if (instantaneousLoad >= 75) riskLevel = 'high';
  else if (instantaneousLoad >= 55) riskLevel = 'medium';

  // Generate recommendations
  const recommendations: string[] = [];

  if (intrinsicLoad > 70) {
    recommendations.push('Consider breaking content into smaller chunks');
    recommendations.push('Add more scaffolding or prerequisite review');
  }

  if (extraneousLoad > 50) {
    recommendations.push('Reduce distractions and simplify the interface');
    if (data.hintRequests && data.hintRequests > 5) {
      recommendations.push('Consider providing more in-context guidance');
    }
  }

  if (germaneLoad < 40 && data.totalQuestions && data.totalQuestions > 3) {
    recommendations.push('Content may be too easy - consider increasing difficulty');
  }

  if (trend === 'increasing' && riskLevel !== 'low') {
    recommendations.push('Take a short break to reduce cognitive fatigue');
  }

  if (data.averageResponseTime && data.averageResponseTime > 30000) {
    recommendations.push('Learner may be struggling - consider offering help');
  }

  const interventionSuggested = riskLevel === 'critical' ||
    (riskLevel === 'high' && trend === 'increasing');

  return {
    instantaneousLoad: Math.round(instantaneousLoad * 10) / 10,
    factors: {
      intrinsicLoad: Math.round(intrinsicLoad * 10) / 10,
      extraneousLoad: Math.round(extraneousLoad * 10) / 10,
      germaneLoad: Math.round(germaneLoad * 10) / 10,
    },
    trend,
    riskLevel,
    recommendations: recommendations.slice(0, 5), // Max 5 recommendations
    interventionSuggested,
  };
}

// ============================================================================
// POST - Analyze Cognitive Load
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(req, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gateResult = await withSubscriptionGate(session.user.id, { category: 'analysis' });
    if (!gateResult.allowed && gateResult.response) return gateResult.response;

    const body = await req.json();
    const validated = SessionDataSchema.parse(body);

    // Calculate cognitive load
    const result = calculateCognitiveLoad(validated);

    // Store the result in the database
    const record = await db.sAMMetacognitionSession.create({
      data: {
        userId: session.user.id,
        sessionId: validated.sessionId,
        reflectionType: 'DURING_LEARNING',
        cognitiveLoad: result.instantaneousLoad,
        responses: {
          factors: result.factors,
          trend: result.trend,
          riskLevel: result.riskLevel,
        },
        analysis: {
          recommendations: result.recommendations,
          interventionSuggested: result.interventionSuggested,
          analyzedAt: new Date().toISOString(),
        },
      },
    });

    logger.info('[COGNITIVE_LOAD] Analysis completed', {
      userId: session.user.id,
      sessionId: validated.sessionId,
      load: result.instantaneousLoad,
      riskLevel: result.riskLevel,
      interventionSuggested: result.interventionSuggested,
    });

    const response: CognitiveLoadResult = {
      id: record.id,
      userId: session.user.id,
      sessionId: validated.sessionId,
      instantaneousLoad: result.instantaneousLoad,
      factors: result.factors,
      trend: result.trend,
      riskLevel: result.riskLevel,
      recommendations: result.recommendations,
      interventionSuggested: result.interventionSuggested,
      analyzedAt: record.createdAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('[COGNITIVE_LOAD] Error analyzing cognitive load:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to analyze cognitive load' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Get Cognitive Load History
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(req, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = GetHistorySchema.parse({
      sessionId: searchParams.get('sessionId') ?? undefined,
      courseId: searchParams.get('courseId') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
    });

    // Build where clause
    const whereClause: {
      userId: string;
      sessionId?: string;
      createdAt?: { gte?: Date; lte?: Date };
      cognitiveLoad?: { not: null };
    } = {
      userId: session.user.id,
      cognitiveLoad: { not: null },
    };

    if (query.sessionId) {
      whereClause.sessionId = query.sessionId;
    }

    if (query.fromDate || query.toDate) {
      whereClause.createdAt = {};
      if (query.fromDate) {
        whereClause.createdAt.gte = new Date(query.fromDate);
      }
      if (query.toDate) {
        whereClause.createdAt.lte = new Date(query.toDate);
      }
    }

    const records = await db.sAMMetacognitionSession.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      select: {
        id: true,
        sessionId: true,
        cognitiveLoad: true,
        responses: true,
        analysis: true,
        createdAt: true,
      },
    });

    // Calculate aggregate statistics
    const loads = records
      .map((r) => r.cognitiveLoad)
      .filter((l): l is number => l !== null);

    const stats = loads.length > 0
      ? {
          average: Math.round((loads.reduce((a, b) => a + b, 0) / loads.length) * 10) / 10,
          min: Math.min(...loads),
          max: Math.max(...loads),
          count: loads.length,
        }
      : null;

    // Transform records
    const history = records.map((r) => {
      const responses = r.responses as { factors?: CognitiveLoadFactors; trend?: string; riskLevel?: string } | null;
      const analysis = r.analysis as { recommendations?: string[]; interventionSuggested?: boolean } | null;

      return {
        id: r.id,
        sessionId: r.sessionId,
        cognitiveLoad: r.cognitiveLoad,
        factors: responses?.factors ?? null,
        trend: responses?.trend ?? null,
        riskLevel: responses?.riskLevel ?? null,
        recommendations: analysis?.recommendations ?? [],
        analyzedAt: r.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        history,
        statistics: stats,
        pagination: {
          limit: query.limit,
          returned: history.length,
        },
      },
    });
  } catch (error) {
    logger.error('[COGNITIVE_LOAD] Error fetching history:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch cognitive load history' },
      { status: 500 }
    );
  }
}
