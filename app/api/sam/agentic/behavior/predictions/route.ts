/**
 * SAM Behavior Predictions API
 * Predicts churn risk and struggle areas for users
 *
 * Returns default predictions when no behavioral data is available
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getProactiveStores } from '@/lib/sam/taxomind-context';
import { createBehaviorMonitor } from '@sam-ai/agentic';

// Lazy initialize behavior monitor using TaxomindContext stores
let behaviorMonitorInstance: ReturnType<typeof createBehaviorMonitor> | null = null;

function getBehaviorMonitor() {
  if (!behaviorMonitorInstance) {
    const { behaviorEvent, pattern, intervention } = getProactiveStores();
    behaviorMonitorInstance = createBehaviorMonitor({
      eventStore: behaviorEvent,
      patternStore: pattern,
      interventionStore: intervention,
      logger: console,
    });
  }
  return behaviorMonitorInstance;
}

// Default predictions when no behavioral data is available
const DEFAULT_CHURN_PREDICTION = {
  probability: 0,
  riskLevel: 'low' as const,
  factors: [],
  timeToChurn: null,
  recommendedInterventions: [],
  hasData: false,
};

const DEFAULT_STRUGGLE_PREDICTION = {
  probability: 0,
  areas: [],
  recommendedSupport: [],
  hasData: false,
};

const DEFAULT_ANOMALIES = {
  detected: [],
  hasData: false,
};

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

    let behaviorMonitor: ReturnType<typeof createBehaviorMonitor> | null = null;

    // Try to initialize behavior monitor, gracefully handle errors
    try {
      behaviorMonitor = getBehaviorMonitor();
    } catch (initError) {
      logger.warn('[BEHAVIOR_PREDICTIONS] Failed to initialize behavior monitor:', initError);
      // Return default predictions if monitor fails to initialize
      return NextResponse.json({
        success: true,
        data: {
          userId: session.user.id,
          predictedAt: new Date(),
          predictions: {
            churn: DEFAULT_CHURN_PREDICTION,
            struggle: DEFAULT_STRUGGLE_PREDICTION,
            anomalies: DEFAULT_ANOMALIES,
          },
          message: 'No behavioral data available yet',
        },
      });
    }

    const results: Record<string, unknown> = {};

    // Get churn prediction with error handling
    if (query.type === 'churn' || query.type === 'all') {
      try {
        const churnPrediction = await behaviorMonitor.predictChurn(session.user.id);
        results.churn = {
          probability: churnPrediction.churnProbability ?? 0,
          riskLevel: churnPrediction.riskLevel ?? 'low',
          factors: churnPrediction.factors ?? [],
          timeToChurn: churnPrediction.timeToChurn ?? null,
          recommendedInterventions: churnPrediction.recommendedInterventions ?? [],
          hasData: true,
        };
      } catch (churnError) {
        logger.warn('[BEHAVIOR_PREDICTIONS] Churn prediction failed:', churnError);
        results.churn = DEFAULT_CHURN_PREDICTION;
      }
    }

    // Get struggle prediction with error handling
    if (query.type === 'struggle' || query.type === 'all') {
      try {
        const strugglePrediction = await behaviorMonitor.predictStruggle(session.user.id);
        results.struggle = {
          probability: strugglePrediction.struggleProbability ?? 0,
          areas: strugglePrediction.areas ?? [],
          recommendedSupport: strugglePrediction.recommendedSupport ?? [],
          hasData: true,
        };
      } catch (struggleError) {
        logger.warn('[BEHAVIOR_PREDICTIONS] Struggle prediction failed:', struggleError);
        results.struggle = DEFAULT_STRUGGLE_PREDICTION;
      }
    }

    // Detect anomalies with error handling
    if (query.type === 'all') {
      try {
        const anomalies = await behaviorMonitor.detectAnomalies(session.user.id);
        results.anomalies = {
          ...anomalies,
          hasData: true,
        };
      } catch (anomalyError) {
        logger.warn('[BEHAVIOR_PREDICTIONS] Anomaly detection failed:', anomalyError);
        results.anomalies = DEFAULT_ANOMALIES;
      }
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
    logger.error('[BEHAVIOR_PREDICTIONS] Error getting predictions:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    // Return default predictions instead of 500 error for resilience
    return NextResponse.json({
      success: true,
      data: {
        userId: null,
        predictedAt: new Date(),
        predictions: {
          churn: DEFAULT_CHURN_PREDICTION,
          struggle: DEFAULT_STRUGGLE_PREDICTION,
          anomalies: DEFAULT_ANOMALIES,
        },
        message: 'Unable to generate predictions at this time',
      },
    });
  }
}
