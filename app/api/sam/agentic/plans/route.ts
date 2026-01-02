import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createPrismaGoalStore, createPrismaPlanStore } from '@/lib/sam/stores';
import {
  createPlanBuilder,
  type PlanStatus,
  type GoalDecomposition,
  type SubGoal,
} from '@sam-ai/agentic';

// Initialize stores and builders
const goalStore = createPrismaGoalStore();
const planStore = createPrismaPlanStore();

// Lazy initialize plan builder
let planBuilderInstance: ReturnType<typeof createPlanBuilder> | null = null;

function getPlanBuilder() {
  if (!planBuilderInstance) {
    planBuilderInstance = createPlanBuilder({
      logger: console,
    });
  }
  return planBuilderInstance;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

// Use agentic package enum values (lowercase)
const PlanStatusEnum = z.enum([
  'draft',
  'active',
  'paused',
  'completed',
  'failed',
  'cancelled',
]);

const CreatePlanSchema = z.object({
  goalId: z.string().min(1),
  startDate: z.string().datetime().optional(),
  targetDate: z.string().datetime().optional(),
  dailyMinutes: z.number().int().min(5).max(480).optional().default(30),
  generateSchedule: z.boolean().optional().default(true),
});

const GetPlansQuerySchema = z.object({
  status: PlanStatusEnum.optional(),
  goalId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// ============================================================================
// GET - List user plans
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = GetPlansQuerySchema.parse({
      status: searchParams.get('status') ?? undefined,
      goalId: searchParams.get('goalId') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
    });

    // Use the PlanStore from @sam-ai/agentic package
    const plans = await planStore.getByUser(session.user.id, {
      status: query.status ? [query.status as PlanStatus] : undefined,
      goalId: query.goalId,
      limit: query.limit,
      offset: query.offset,
      orderBy: 'createdAt',
      orderDir: 'desc',
    });

    // Fetch goal data from goal store for each unique goalId
    const goalIds = [...new Set(plans.map((p) => p.goalId))];
    const goalsById = new Map<string, { id: string; title: string; status: string }>();

    for (const goalId of goalIds) {
      const goal = await goalStore.get(goalId);
      if (goal) {
        goalsById.set(goalId, { id: goal.id, title: goal.title, status: goal.status });
      }
    }

    // Enrich plans with goal data
    const enrichedPlans = plans.map((plan) => ({
      ...plan,
      goal: goalsById.get(plan.goalId) ?? null,
    }));

    // Get total count for pagination
    const allPlans = await planStore.getByUser(session.user.id, {
      status: query.status ? [query.status as PlanStatus] : undefined,
      goalId: query.goalId,
    });

    return NextResponse.json({
      success: true,
      data: {
        plans: enrichedPlans,
        pagination: {
          total: allPlans.length,
          limit: query.limit,
          offset: query.offset,
          hasMore: query.offset + plans.length < allPlans.length,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching execution plans:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch execution plans' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create a new execution plan from goal
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = CreatePlanSchema.parse(body);

    // Use the GoalStore to fetch the goal
    const goal = await goalStore.get(validated.goalId);

    if (!goal || goal.userId !== session.user.id) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Note: SAMSubGoal model doesn't exist in the schema yet
    // For now, we create a simple decomposition from the goal itself
    // TODO: Implement sub-goals when the model is added

    // Create a simple single-step decomposition from the goal
    // SubGoalType values are: 'learn', 'practice', 'assess', 'review', 'reflect', 'create'
    const subGoal: SubGoal = {
      id: `subgoal-${goal.id}-1`,
      goalId: goal.id,
      title: goal.title,
      description: goal.description ?? undefined,
      type: 'learn',
      order: 0,
      status: 'pending',
      estimatedMinutes: 60,
      difficulty: 'medium',
      prerequisites: [],
      successCriteria: [`Complete: ${goal.title}`],
    };

    // Create a decomposition structure for the PlanBuilder
    const decomposition: GoalDecomposition = {
      goalId: goal.id,
      subGoals: [subGoal],
      dependencies: { nodes: [subGoal.id], edges: [] },
      estimatedDuration: subGoal.estimatedMinutes,
      difficulty: 'medium',
      confidence: 0.8,
    };

    // Use the PlanBuilder to create the plan
    const planBuilder = getPlanBuilder();
    const executionPlan = await planBuilder.createPlan(goal, decomposition, {
      dailyMinutes: validated.dailyMinutes,
      generateSchedule: validated.generateSchedule,
    });

    // Override dates if provided
    if (validated.startDate) {
      executionPlan.startDate = new Date(validated.startDate);
    }
    if (validated.targetDate) {
      executionPlan.targetDate = new Date(validated.targetDate);
    }

    // Save the plan using PlanStore
    const savedPlan = await planStore.create({
      goalId: goal.id,
      userId: session.user.id,
      status: 'draft',
      startDate: executionPlan.startDate,
      targetDate: executionPlan.targetDate,
      overallProgress: 0,
      schedule: executionPlan.schedule,
      fallbackStrategies: executionPlan.fallbackStrategies,
      checkpointData: {},
      steps: executionPlan.steps,
      checkpoints: executionPlan.checkpoints,
    });

    logger.info(
      `Created execution plan ${savedPlan.id} for goal ${goal.id} using PlanBuilder`
    );

    return NextResponse.json({
      success: true,
      data: {
        ...savedPlan,
        goal: { id: goal.id, title: goal.title },
      },
    });
  } catch (error) {
    logger.error('Error creating execution plan:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create execution plan' },
      { status: 500 }
    );
  }
}
