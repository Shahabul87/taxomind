import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getGoalStores } from '@/lib/sam/taxomind-context';
import {
  createAgentStateMachine,
  type AgentStateMachine,
} from '@sam-ai/agentic';
import { getSAMTelemetryService } from '@/lib/sam/telemetry';

// Get goal and plan stores from TaxomindContext
const { goal: goalStore, plan: planStore } = getGoalStores();

// Create a lazy-initialized state machine using TaxomindContext stores
let stateMachineInstance: AgentStateMachine | null = null;

function getStateMachine() {
  if (!stateMachineInstance) {
    stateMachineInstance = createAgentStateMachine({
      planStore,
      logger: console,
    });
  }
  return stateMachineInstance;
}

const PauseSchema = z.object({
  reason: z.string().optional(),
});

interface RouteContext {
  params: Promise<{ planId: string }>;
}

// ============================================================================
// POST - Pause an active plan
// ============================================================================

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await context.params;
    const body = await req.json().catch(() => ({}));
    const { reason } = PauseSchema.parse(body);

    // Use the PlanStore to fetch the plan
    const plan = await planStore.get(planId);

    if (!plan || plan.userId !== session.user.id) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    if (plan.status !== 'active') {
      return NextResponse.json(
        { error: 'Only active plans can be paused' },
        { status: 400 }
      );
    }

    // Get the state machine
    const stateMachine = getStateMachine();

    // Load the current plan state if available and start the machine
    const currentState = await stateMachine.loadState(planId);
    if (currentState) {
      // Resume state machine with saved state to restore context
      // This puts the machine in a state where it can be paused
      await stateMachine.resume(currentState);
    } else {
      // Start fresh with the current plan
      await stateMachine.start(plan);
    }

    // Pause the state machine
    const planState = await stateMachine.pause(reason);

    // Fetch updated plan with related data
    const updatedPlan = await planStore.get(planId);

    // Fetch the associated goal from the goal store
    const goal = plan.goalId ? await goalStore.get(plan.goalId) : null;

    logger.info(
      `Paused execution plan ${planId} using AgentStateMachine, reason: ${reason ?? 'none'}`
    );

    // Record telemetry event for plan lifecycle
    try {
      const telemetry = getSAMTelemetryService();
      await telemetry.recordPlanEvent({
        planId,
        userId: session.user.id,
        eventType: 'PAUSED',
        previousState: 'active',
        newState: 'paused',
        metadata: {
          goalId: plan.goalId,
          reason: reason ?? null,
          machineState: stateMachine.getState(),
        },
      });
    } catch (telemetryError) {
      logger.warn('[Telemetry] Failed to record plan pause event:', telemetryError);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updatedPlan,
        goal,
        machineState: stateMachine.getState(),
        planState,
      },
    });
  } catch (error) {
    logger.error('Error pausing execution plan:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to pause execution plan' },
      { status: 500 }
    );
  }
}
