import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getPracticeStores } from '@/lib/sam/taxomind-context';
import type { PracticeGoalData } from '@/lib/sam/stores';

// Get practice goal store from TaxomindContext singleton
const { practiceGoal: practiceGoalStore } = getPracticeStores();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const UpdateGoalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  targetValue: z.number().positive().optional(),
  currentValue: z.number().min(0).optional(),
  deadline: z.string().datetime().nullable().optional(),
  reminderEnabled: z.boolean().optional(),
  reminderFrequency: z.enum(['DAILY', 'WEEKLY', 'NONE']).nullable().optional(),
  isCompleted: z.boolean().optional(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function enrichGoal(goal: PracticeGoalData) {
  return {
    ...goal,
    progressPercentage: Math.min(100, (goal.currentValue / goal.targetValue) * 100),
    remaining: Math.max(0, goal.targetValue - goal.currentValue),
    isOverdue: goal.deadline && new Date(goal.deadline) < new Date() && !goal.isCompleted,
    daysUntilDeadline: goal.deadline
      ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null,
  };
}

// ============================================================================
// GET - Get single goal details
// ============================================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Use store to get goal
    const goal = await practiceGoalStore.getById(id);

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (goal.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: enrichGoal(goal),
    });
  } catch (error) {
    logger.error('Error fetching practice goal:', error);
    return NextResponse.json({ error: 'Failed to fetch goal' }, { status: 500 });
  }
}

// ============================================================================
// PUT - Update goal
// ============================================================================

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check ownership using store
    const existing = await practiceGoalStore.getById(id);

    if (!existing) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const data = UpdateGoalSchema.parse(body);

    // Validate deadline if provided
    if (data.deadline) {
      const deadlineDate = new Date(data.deadline);
      if (deadlineDate <= new Date()) {
        return NextResponse.json(
          { error: 'Deadline must be in the future' },
          { status: 400 }
        );
      }
    }

    // Update goal using store (handles auto-complete logic)
    const goal = await practiceGoalStore.update(id, {
      title: data.title,
      description: data.description,
      targetValue: data.targetValue,
      currentValue: data.currentValue,
      deadline: data.deadline ? new Date(data.deadline) : data.deadline === null ? null : undefined,
      reminderEnabled: data.reminderEnabled,
      reminderFrequency: data.reminderFrequency,
      isCompleted: data.isCompleted,
    });

    logger.info(`Updated practice goal: ${id}`);

    return NextResponse.json({
      success: true,
      data: enrichGoal(goal),
    });
  } catch (error) {
    logger.error('Error updating practice goal:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}

// ============================================================================
// PATCH - Partial update (convenient for progress updates)
// ============================================================================

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check ownership using store
    const existing = await practiceGoalStore.getById(id);

    if (!existing) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const data = UpdateGoalSchema.parse(body);

    // Validate deadline if provided
    if (data.deadline) {
      const deadlineDate = new Date(data.deadline);
      if (deadlineDate <= new Date()) {
        return NextResponse.json(
          { error: 'Deadline must be in the future' },
          { status: 400 }
        );
      }
    }

    // Update goal using store (handles auto-complete logic)
    const goal = await practiceGoalStore.update(id, {
      title: data.title,
      description: data.description,
      targetValue: data.targetValue,
      currentValue: data.currentValue,
      deadline: data.deadline ? new Date(data.deadline) : data.deadline === null ? null : undefined,
      reminderEnabled: data.reminderEnabled,
      reminderFrequency: data.reminderFrequency,
      isCompleted: data.isCompleted,
    });

    logger.info(`Patched practice goal: ${id}`);

    return NextResponse.json({
      success: true,
      data: enrichGoal(goal),
    });
  } catch (error) {
    logger.error('Error patching practice goal:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to patch goal' }, { status: 500 });
  }
}

// ============================================================================
// DELETE - Delete goal
// ============================================================================

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check ownership using store
    const existing = await practiceGoalStore.getById(id);

    if (!existing) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await practiceGoalStore.delete(id);

    logger.info(`Deleted practice goal: ${id}`);

    return NextResponse.json({
      success: true,
      message: 'Goal deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting practice goal:', error);
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
  }
}
