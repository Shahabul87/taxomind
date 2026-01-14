import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
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

interface RouteContext {
  params: Promise<{ planId: string }>;
}

// ============================================================================
// POST - Resume a paused plan
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

    if (plan.status !== 'paused') {
      return NextResponse.json(
        { error: 'Only paused plans can be resumed' },
        { status: 400 }
      );
    }

    // Get the state machine
    const stateMachine = getStateMachine();

    // Load the saved plan state for resumability
    const savedState = await stateMachine.loadState(planId);

    // Resume the state machine with saved state
    if (savedState) {
      // Resume from saved state
      await stateMachine.resume(savedState);
    } else {
      // No saved state - start fresh and then resume
      await stateMachine.start(plan);
    }

    // Get the updated plan state
    const planState = stateMachine.getPlanState();

    // Fetch updated plan with related data
    const updatedPlan = await planStore.get(planId);

    // Fetch the associated goal from the goal store
    const goal = plan.goalId ? await goalStore.get(plan.goalId) : null;

    logger.info(
      `Resumed execution plan ${planId} using AgentStateMachine (state: ${stateMachine.getState()})`
    );

    // Record telemetry event for plan lifecycle
    try {
      const telemetry = getSAMTelemetryService();
      await telemetry.recordPlanEvent({
        planId,
        userId: session.user.id,
        eventType: 'RESUMED',
        previousState: 'paused',
        newState: 'active',
        metadata: {
          goalId: plan.goalId,
          hadSavedState: !!savedState,
          machineState: stateMachine.getState(),
        },
      });
    } catch (telemetryError) {
      logger.warn('[Telemetry] Failed to record plan resume event:', telemetryError);
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
    logger.error('Error resuming execution plan:', error);
    return NextResponse.json(
      { error: 'Failed to resume execution plan' },
      { status: 500 }
    );
  }
}
