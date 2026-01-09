/**
 * SAM Agentic Behavior Tracking API
 * Tracks user behavior events for proactive intervention analysis
 *
 * Events are processed by the BehaviorMonitor to:
 * - Detect anomalies (sudden disengagement, repeated failures)
 * - Predict churn risk
 * - Identify struggle areas
 * - Suggest interventions
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { SAM_FEATURES } from '@/lib/sam/feature-flags';
import {
  initializeProactiveInterventions,
  createIntervention,
} from '@/lib/sam/proactive-intervention-integration';
import { InterventionType } from '@sam-ai/agentic';

// Event types supported by the behavior monitor
const BehaviorEventTypeSchema = z.enum([
  'SESSION_START',
  'SESSION_END',
  'CONTENT_INTERACTION',
  'QUIZ_ATTEMPT',
  'QUIZ_COMPLETE',
  'ASSESSMENT_START',
  'ASSESSMENT_COMPLETE',
  'HINT_REQUEST',
  'HELP_REQUEST',
  'GOAL_CREATED',
  'GOAL_ABANDONED',
  'PLAN_STARTED',
  'PLAN_PAUSED',
  'PLAN_COMPLETED',
  'FRUSTRATION_SIGNAL',
  'LONG_PAUSE',
  'PAGE_EXIT',
  'NAVIGATION',
]);

const TrackEventSchema = z.object({
  eventType: BehaviorEventTypeSchema,
  metadata: z.record(z.unknown()).optional(),
  courseId: z.string().optional(),
  chapterId: z.string().optional(),
  sectionId: z.string().optional(),
  planId: z.string().optional(),
  goalId: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

const BatchTrackSchema = z.object({
  events: z.array(TrackEventSchema).min(1).max(50),
});

export async function POST(req: NextRequest) {
  try {
    // Check feature flag
    if (!SAM_FEATURES.INTERVENTIONS_ENABLED) {
      return NextResponse.json({
        success: true,
        message: 'Behavior tracking disabled (feature flag off)',
        tracked: false,
      });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Support both single event and batch events
    let events: z.infer<typeof TrackEventSchema>[];

    if (body.events) {
      // Batch mode
      const parsed = BatchTrackSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: parsed.error.issues },
          { status: 400 }
        );
      }
      events = parsed.data.events;
    } else {
      // Single event mode
      const parsed = TrackEventSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: parsed.error.issues },
          { status: 400 }
        );
      }
      events = [parsed.data];
    }

    // Initialize proactive intervention subsystem
    const subsystems = initializeProactiveInterventions();
    const { behaviorMonitor } = subsystems;

    const results: Array<{
      eventType: string;
      tracked: boolean;
      anomalies?: number;
      interventionCreated?: boolean;
    }> = [];

    // Process each event
    for (const event of events) {
      try {
        // Track the event
        await behaviorMonitor.trackEvent({
          userId: session.user.id,
          sessionId: `session-${session.user.id}`,
          type: event.eventType as Parameters<typeof behaviorMonitor.trackEvent>[0]['type'],
          timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
          pageContext: {
            url: '/api/behavior/track',
            courseId: event.courseId,
            chapterId: event.chapterId,
            sectionId: event.sectionId,
          },
          data: {
            ...event.metadata,
            planId: event.planId,
            goalId: event.goalId,
          },
        });

        // Check for anomalies after tracking
        const anomalies = await behaviorMonitor.detectAnomalies(session.user.id);
        let interventionCreated = false;

        // Create interventions for detected anomalies
        if (anomalies.length > 0) {
          for (const anomaly of anomalies) {
            // Map anomaly to intervention
            const interventionResult = await createIntervention(session.user.id, {
              type: mapAnomalyToInterventionType(anomaly.type),
              priority: anomaly.severity === 'high' ? 'high' : anomaly.severity === 'medium' ? 'medium' : 'low',
              message: anomaly.suggestedAction ?? anomaly.description,
              suggestedActions: [{
                title: 'Take Action',
                description: anomaly.suggestedAction ?? 'Address this concern',
                type: 'review_content',
                priority: anomaly.severity === 'high' ? 'high' : 'medium',
              }],
            });

            if (interventionResult) {
              interventionCreated = true;
              logger.info('[BEHAVIOR_TRACK] Created intervention from anomaly:', {
                userId: session.user.id,
                anomalyType: anomaly.type,
                interventionId: interventionResult.id,
              });
            }
          }
        }

        results.push({
          eventType: event.eventType,
          tracked: true,
          anomalies: anomalies.length,
          interventionCreated,
        });

        logger.debug('[BEHAVIOR_TRACK] Event tracked:', {
          userId: session.user.id,
          eventType: event.eventType,
          anomalies: anomalies.length,
        });
      } catch (eventError) {
        logger.warn('[BEHAVIOR_TRACK] Failed to track event:', {
          eventType: event.eventType,
          error: eventError,
        });
        results.push({
          eventType: event.eventType,
          tracked: false,
        });
      }
    }

    // Also check for churn prediction periodically (not on every event)
    let churnRisk: { churnProbability: number; riskLevel: string; factors: Array<{ name: string; contribution: number }> } | null = null;
    if (events.some(e => e.eventType === 'SESSION_END')) {
      try {
        const prediction = await behaviorMonitor.predictChurn(session.user.id);
        churnRisk = {
          churnProbability: prediction.churnProbability,
          riskLevel: prediction.riskLevel,
          factors: prediction.factors.map(f => ({ name: f.name, contribution: f.contribution })),
        };
        if (churnRisk.churnProbability > 0.7) {
          logger.warn('[BEHAVIOR_TRACK] High churn risk detected:', {
            userId: session.user.id,
            riskScore: churnRisk.churnProbability,
            riskLevel: churnRisk.riskLevel,
          });
        }
      } catch (churnError) {
        logger.warn('[BEHAVIOR_TRACK] Failed to predict churn:', churnError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        results,
        totalTracked: results.filter(r => r.tracked).length,
        totalAnomalies: results.reduce((sum, r) => sum + (r.anomalies ?? 0), 0),
        interventionsCreated: results.filter(r => r.interventionCreated).length,
        churnRisk: churnRisk ? {
          score: churnRisk.churnProbability,
          riskLevel: churnRisk.riskLevel,
          highRisk: churnRisk.churnProbability > 0.7,
        } : null,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[BEHAVIOR_TRACK] Error tracking behavior:', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: 'Failed to track behavior',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Get behavior summary for current user
 */
export async function GET() {
  try {
    if (!SAM_FEATURES.INTERVENTIONS_ENABLED) {
      return NextResponse.json({
        success: true,
        message: 'Behavior tracking disabled (feature flag off)',
        enabled: false,
      });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subsystems = initializeProactiveInterventions();
    const { behaviorMonitor } = subsystems;

    // Get behavior patterns and predictions
    const [patterns, churnPrediction, strugglePrediction] = await Promise.all([
      behaviorMonitor.detectPatterns(session.user.id),
      behaviorMonitor.predictChurn(session.user.id),
      behaviorMonitor.predictStruggle(session.user.id),
    ]);

    return NextResponse.json({
      success: true,
      enabled: true,
      data: {
        patterns: patterns.map(p => ({
          type: p.type,
          confidence: p.confidence,
          description: p.description,
        })),
        churnRisk: {
          score: churnPrediction.churnProbability,
          riskLevel: churnPrediction.riskLevel,
          factors: churnPrediction.factors.map(f => ({
            name: f.name,
            contribution: f.contribution,
            trend: f.trend,
          })),
          highRisk: churnPrediction.churnProbability > 0.7,
        },
        struggleAreas: strugglePrediction.areas.map(s => ({
          topic: s.topic,
          severity: s.severity,
          indicators: s.indicators,
          suggestedRemediation: s.suggestedRemediation,
        })),
      },
    });
  } catch (error) {
    logger.error('[BEHAVIOR_TRACK] Error getting behavior summary:', error);
    return NextResponse.json(
      { error: 'Failed to get behavior summary' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to map anomaly types to intervention types
 */
function mapAnomalyToInterventionType(anomalyType: string): string {
  const mapping: Record<string, string> = {
    'sudden_disengagement': InterventionType.STREAK_REMINDER,
    'repeated_failures': InterventionType.CONTENT_RECOMMENDATION,
    'performance_drop': InterventionType.DIFFICULTY_ADJUSTMENT,
    'unusual_timing': InterventionType.ENCOURAGEMENT,
    'extended_session': InterventionType.BREAK_SUGGESTION,
    'rapid_navigation': InterventionType.CONTENT_RECOMMENDATION,
    'help_overuse': InterventionType.MENTOR_ESCALATION,
  };

  return mapping[anomalyType] ?? InterventionType.ENCOURAGEMENT;
}
