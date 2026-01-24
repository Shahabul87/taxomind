import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getGoalStores } from '@/lib/sam/taxomind-context';
import type { StepStatus } from '@sam-ai/agentic';

// Get the stores from TaxomindContext singleton
const { goal: goalStore, subGoal: subGoalStore } = getGoalStores();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const StepStatusEnum = z.enum(['pending', 'in_progress', 'completed', 'failed', 'skipped', 'blocked']);

const UpdateSubGoalSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional(),
  status: StepStatusEnum.optional(),
  completedAt: z.string().datetime().optional().nullable(),
  estimatedMinutes: z.number().min(0).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  order: z.number().min(0).optional(),
  metadata: z.record(z.unknown()).optional(),
});

interface RouteContext {
  params: Promise<{ goalId: string; subGoalId: string }>;
}

// ============================================================================
// GET - Get a specific subgoal
// ============================================================================

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { goalId, subGoalId } = await context.params;

    // Verify goal ownership first
    const goal = await goalStore.get(goalId);

    if (!goal || goal.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: { message: 'Goal not found' } }, { status: 404 });
    }

    // Fetch the subgoal
    const subGoal = await subGoalStore.get(subGoalId);

    if (!subGoal || subGoal.goalId !== goalId) {
      return NextResponse.json({ success: false, error: { message: 'Sub-goal not found' } }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: subGoal,
    });
  } catch (error) {
    logger.error('Error fetching subgoal:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch sub-goal' } },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update a subgoal
// ============================================================================

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { goalId, subGoalId } = await context.params;
    const body = await req.json();
    const validated = UpdateSubGoalSchema.parse(body);

    // Verify goal ownership first
    const goal = await goalStore.get(goalId);

    if (!goal || goal.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: { message: 'Goal not found' } }, { status: 404 });
    }

    // Verify subgoal belongs to this goal
    const existingSubGoal = await subGoalStore.get(subGoalId);

    if (!existingSubGoal || existingSubGoal.goalId !== goalId) {
      return NextResponse.json({ success: false, error: { message: 'Sub-goal not found' } }, { status: 404 });
    }

    // Update the subgoal
    const updatedSubGoal = await subGoalStore.update(subGoalId, {
      title: validated.title,
      description: validated.description,
      status: validated.status as StepStatus | undefined,
      completedAt: validated.completedAt
        ? new Date(validated.completedAt)
        : validated.completedAt === null
          ? undefined
          : undefined,
      estimatedMinutes: validated.estimatedMinutes,
      difficulty: validated.difficulty,
      order: validated.order,
      metadata: validated.metadata,
    });

    logger.info(`Updated subgoal: ${subGoalId} (status: ${validated.status})`);

    return NextResponse.json({
      success: true,
      data: updatedSubGoal,
    });
  } catch (error) {
    logger.error('Error updating subgoal:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid input', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { message: 'Failed to update sub-goal' } },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete a subgoal
// ============================================================================

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: { message: 'Unauthorized' } }, { status: 401 });
    }

    const { goalId, subGoalId } = await context.params;

    // Verify goal ownership first
    const goal = await goalStore.get(goalId);

    if (!goal || goal.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: { message: 'Goal not found' } }, { status: 404 });
    }

    // Verify subgoal belongs to this goal
    const existingSubGoal = await subGoalStore.get(subGoalId);

    if (!existingSubGoal || existingSubGoal.goalId !== goalId) {
      return NextResponse.json({ success: false, error: { message: 'Sub-goal not found' } }, { status: 404 });
    }

    // Delete the subgoal
    await subGoalStore.delete(subGoalId);

    logger.info(`Deleted subgoal: ${subGoalId}`);

    return NextResponse.json({
      success: true,
      message: 'Sub-goal deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting subgoal:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to delete sub-goal' } },
      { status: 500 }
    );
  }
}
