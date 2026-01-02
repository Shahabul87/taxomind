/**
 * SAM Interventions API
 * Manages AI-suggested interventions based on behavior patterns
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
import { createBehaviorMonitor, InterventionType, ActionType } from '@sam-ai/agentic';
import { v4 as uuidv4 } from 'uuid';

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

const GetInterventionsQuerySchema = z.object({
  pending: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const CreateInterventionSchema = z.object({
  type: z.enum([
    'encouragement',
    'difficulty_adjustment',
    'content_recommendation',
    'break_suggestion',
    'goal_revision',
    'peer_connection',
    'mentor_escalation',
    'progress_celebration',
    'streak_reminder',
  ]),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  message: z.string().min(1).max(500),
  suggestedActions: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        type: z.enum([
          'start_activity',
          'review_content',
          'take_break',
          'adjust_goal',
          'contact_mentor',
          'view_progress',
          'complete_review',
        ]),
        priority: z.enum(['high', 'medium', 'low']),
        targetUrl: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  timing: z
    .object({
      type: z.enum(['immediate', 'scheduled', 'on_next_session']),
      scheduledFor: z.string().datetime().optional(),
      expiresAt: z.string().datetime().optional(),
    })
    .optional()
    .default({ type: 'immediate' }),
});

const InterventionResultSchema = z.object({
  success: z.boolean(),
  userResponse: z.enum(['accepted', 'dismissed', 'deferred']).optional(),
  feedback: z.string().max(500).optional(),
});

// ============================================================================
// GET - Get interventions for the user
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = GetInterventionsQuerySchema.parse({
      pending: searchParams.get('pending') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    const behaviorMonitor = getBehaviorMonitor();

    let interventions;
    if (query.pending !== undefined) {
      interventions = await behaviorMonitor.getPendingInterventions(session.user.id);
    } else {
      interventions = await interventionStore.getByUser(session.user.id);
    }

    // Apply limit
    interventions = interventions.slice(0, query.limit);

    return NextResponse.json({
      success: true,
      data: {
        interventions,
        count: interventions.length,
      },
    });
  } catch (error) {
    logger.error('Error fetching interventions:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch interventions' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create a new intervention
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = CreateInterventionSchema.parse(body);

    const behaviorMonitor = getBehaviorMonitor();

    const intervention = await behaviorMonitor.createIntervention(session.user.id, {
      type: validated.type as InterventionType,
      priority: validated.priority,
      message: validated.message,
      suggestedActions: validated.suggestedActions.map((action) => ({
        id: uuidv4(),
        title: action.title,
        description: action.description,
        type: action.type as ActionType,
        priority: action.priority,
        targetUrl: action.targetUrl,
      })),
      timing: {
        type: validated.timing.type,
        scheduledFor: validated.timing.scheduledFor
          ? new Date(validated.timing.scheduledFor)
          : undefined,
        expiresAt: validated.timing.expiresAt
          ? new Date(validated.timing.expiresAt)
          : undefined,
      },
    });

    logger.info(
      `Created intervention ${intervention.id} for user ${session.user.id}`
    );

    return NextResponse.json({
      success: true,
      data: { intervention },
    });
  } catch (error) {
    logger.error('Error creating intervention:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid intervention data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create intervention' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Execute or record result for an intervention
// ============================================================================

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const interventionId = searchParams.get('id');
    const action = searchParams.get('action'); // 'execute' or 'result'

    if (!interventionId) {
      return NextResponse.json(
        { error: 'Intervention ID is required' },
        { status: 400 }
      );
    }

    const behaviorMonitor = getBehaviorMonitor();

    if (action === 'execute') {
      const intervention = await behaviorMonitor.executeIntervention(interventionId);

      logger.info(`Executed intervention ${interventionId}`);

      return NextResponse.json({
        success: true,
        data: { intervention },
      });
    } else if (action === 'result') {
      const body = await req.json();
      const result = InterventionResultSchema.parse(body);

      await behaviorMonitor.recordInterventionResult(interventionId, {
        success: result.success,
        userResponse: result.userResponse,
        feedback: result.feedback,
      });

      logger.info(`Recorded result for intervention ${interventionId}`);

      return NextResponse.json({
        success: true,
        data: { recorded: true },
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "execute" or "result"' },
        { status: 400 }
      );
    }
  } catch (error) {
    logger.error('Error updating intervention:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update intervention' },
      { status: 500 }
    );
  }
}
