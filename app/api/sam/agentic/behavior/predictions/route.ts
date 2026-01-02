/**
 * SAM Behavior Predictions API
 * Predicts churn risk and struggle areas for users
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import {
  createPrismaBehaviorEventStore,
  createPrismaPatternStore,
  createPrismaInterventionStore,
} from '@/lib/sam/stores';
import { createBehaviorMonitor } from '@sam-ai/agentic';

// Initialize stores
const behaviorEventStore = createPrismaBehaviorEventStore();
const patternStore = createPrismaPatternStore();
const interventionStore = createPrismaInterventionStore();

// Lazy initialize behavior monitor
let behaviorMonitorInstance: ReturnType<typeof createBehaviorMonitor> | null = null;

function getBehaviorMonitor() {
  if (!behaviorMonitorInstance) {
    behaviorMonitorInstance = createBehaviorMonitor({
      eventStore: behaviorEventStore,
      patternStore: patternStore,
      interventionStore: interventionStore,
      logger: console,
    });
  }
  return behaviorMonitorInstance;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const PredictionTypeSchema = z.enum(['churn', 'struggle', 'all']);

const GetPredictionQuerySchema = z.object({
  type: PredictionTypeSchema.optional().default('all'),
});

// ============================================================================
// GET - Get predictions for the user
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = GetPredictionQuerySchema.parse({
      type: searchParams.get('type') ?? undefined,
    });

    const behaviorMonitor = getBehaviorMonitor();
    const results: Record<string, unknown> = {};

    if (query.type === 'churn' || query.type === 'all') {
      const churnPrediction = await behaviorMonitor.predictChurn(session.user.id);
      results.churn = {
        probability: churnPrediction.churnProbability,
        riskLevel: churnPrediction.riskLevel,
        factors: churnPrediction.factors,
        timeToChurn: churnPrediction.timeToChurn,
        recommendedInterventions: churnPrediction.recommendedInterventions,
      };
    }

    if (query.type === 'struggle' || query.type === 'all') {
      const strugglePrediction = await behaviorMonitor.predictStruggle(session.user.id);
      results.struggle = {
        probability: strugglePrediction.struggleProbability,
        areas: strugglePrediction.areas,
        recommendedSupport: strugglePrediction.recommendedSupport,
      };
    }

    // Also detect anomalies
    if (query.type === 'all') {
      const anomalies = await behaviorMonitor.detectAnomalies(session.user.id);
      results.anomalies = anomalies;
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: session.user.id,
        predictedAt: new Date(),
        predictions: results,
      },
    });
  } catch (error) {
    logger.error('Error getting predictions:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get predictions' },
      { status: 500 }
    );
  }
}
