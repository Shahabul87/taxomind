import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { getGoalStores } from '@/lib/sam/taxomind-context';
import {
  createAgentStateMachine,
  type AgentStateMachine,
} from '@sam-ai/agentic';
import { recordPlanStarted } from '@/lib/sam/journey-timeline-service';

// Get the Plan Store from TaxomindContext singleton
const { plan: planStore } = getGoalStores();

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

    // Note: SAMLearningGoal model doesn't exist in the schema yet
    // Goal status update would be done through the goal store
    const goal = null;

    // Record journey timeline event for plan start
    try {
      // Note: courseId would come from the associated goal's context,
      // but goal lookup is not yet implemented
      await recordPlanStarted(
        session.user.id,
        planId,
        plan.goalId,
        undefined // courseId - to be fetched from goal context when available
      );
      logger.info(`[JourneyTimeline] Recorded plan start: ${planId}`);
    } catch (timelineError) {
      logger.warn('[JourneyTimeline] Failed to record plan start:', timelineError);
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
