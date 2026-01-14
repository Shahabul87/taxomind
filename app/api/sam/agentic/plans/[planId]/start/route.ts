import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { getGoalStores } from '@/lib/sam/taxomind-context';
import {
  createAgentStateMachine,
  type AgentStateMachine,
} from '@sam-ai/agentic';
import { recordPlanStarted } from '@/lib/sam/journey-timeline-service';
import { getSAMTelemetryService } from '@/lib/sam/telemetry';

// Get the Goal and Plan Stores from TaxomindContext singleton
const { goal: goalStore, plan: planStore } = getGoalStores();

// Create a lazy-initialized state machine
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

interface RouteContext {
  params: Promise<{ planId: string }>;
}

// ============================================================================
// POST - Start executing a plan
// ============================================================================

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await context.params;

    // Use the PlanStore to fetch the plan
    const plan = await planStore.get(planId);

    if (!plan || plan.userId !== session.user.id) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    if (plan.status !== 'draft') {
      return NextResponse.json(
        { error: 'Plan can only be started from draft status' },
        { status: 400 }
      );
    }

    // Get the state machine
    const stateMachine = getStateMachine();

    // Start the plan using the state machine
    await stateMachine.start(plan);

    // Get the updated plan state
    const planState = stateMachine.getPlanState();

    // Fetch updated plan with related data
    const updatedPlan = await planStore.get(planId);

    // Fetch the associated goal from the goal store
    const goal = plan.goalId ? await goalStore.get(plan.goalId) : null;

    // Record journey timeline event for plan start
    try {
      await recordPlanStarted(
        session.user.id,
        planId,
        plan.goalId,
        goal?.context?.courseId ?? undefined
      );
      logger.info(`[JourneyTimeline] Recorded plan start: ${planId}`);
    } catch (timelineError) {
      logger.warn('[JourneyTimeline] Failed to record plan start:', timelineError);
    }

    // Record telemetry event for plan lifecycle
    try {
      const telemetry = getSAMTelemetryService();
      await telemetry.recordPlanEvent({
        planId,
        userId: session.user.id,
        eventType: 'ACTIVATED',
        previousState: 'draft',
        newState: 'active',
        metadata: {
          goalId: plan.goalId,
          machineState: stateMachine.getState(),
        },
      });
    } catch (telemetryError) {
      logger.warn('[Telemetry] Failed to record plan start event:', telemetryError);
    }

    logger.info(
      `Started execution plan ${planId} using AgentStateMachine (state: ${stateMachine.getState()})`
    );

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
    logger.error('Error starting execution plan:', error);
    return NextResponse.json(
      { error: 'Failed to start execution plan' },
      { status: 500 }
    );
  }
}
