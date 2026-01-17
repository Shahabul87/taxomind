import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getPracticeStores } from '@/lib/sam/taxomind-context';

// Get practice goal store from TaxomindContext singleton
const { practiceGoal: practiceGoalStore } = getPracticeStores();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const IncrementProgressSchema = z.object({
  increment: z.number().positive(),
});

const SetProgressSchema = z.object({
  value: z.number().min(0),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function enrichGoal(goal: {
  id: string;
  targetValue: number;
  currentValue: number;
  deadline?: Date | null;
  isCompleted: boolean;
  [key: string]: unknown;
}) {
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
// POST - Increment progress (add to current value)
// ============================================================================

export async function POST(
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

    if (existing.isCompleted) {
      return NextResponse.json(
        { error: 'Cannot update progress on completed goal' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const data = IncrementProgressSchema.parse(body);

    const previousValue = existing.currentValue;
    const newValue = previousValue + data.increment;
    const wasCompleted = newValue >= existing.targetValue;

    // Update goal using store (handles auto-complete logic)
    const goal = await practiceGoalStore.update(id, {
      currentValue: newValue,
    });

    logger.info(
      `Incremented goal "${goal.title}" progress: ${previousValue.toFixed(2)} -> ${newValue.toFixed(2)} (+${data.increment.toFixed(2)})` +
      (wasCompleted ? ' [COMPLETED!]' : '')
    );

    return NextResponse.json({
      success: true,
      data: {
        goal: enrichGoal(goal),
        previousValue,
        newValue,
        increment: data.increment,
        wasCompleted,
        progressDelta: ((data.increment / existing.targetValue) * 100),
      },
      message: wasCompleted
        ? `Congratulations! You completed your goal "${goal.title}"!`
        : `Progress updated: ${Math.round((newValue / existing.targetValue) * 100)}% complete`,
    });
  } catch (error) {
    logger.error('Error incrementing goal progress:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}

// ============================================================================
// PUT - Set absolute progress value
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
    const data = SetProgressSchema.parse(body);

    const previousValue = existing.currentValue;
    const wasCompleted = data.value >= existing.targetValue && !existing.isCompleted;

    // Update goal using store (handles auto-complete logic)
    const goal = await practiceGoalStore.update(id, {
      currentValue: data.value,
    });

    logger.info(
      `Set goal "${goal.title}" progress: ${previousValue.toFixed(2)} -> ${data.value.toFixed(2)}` +
      (wasCompleted ? ' [COMPLETED!]' : '')
    );

    return NextResponse.json({
      success: true,
      data: {
        goal: enrichGoal(goal),
        previousValue,
        newValue: data.value,
        wasCompleted,
      },
      message: wasCompleted
        ? `Congratulations! You completed your goal "${goal.title}"!`
        : `Progress set to ${Math.round((data.value / existing.targetValue) * 100)}%`,
    });
  } catch (error) {
    logger.error('Error setting goal progress:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to set progress' }, { status: 500 });
  }
}

// ============================================================================
// GET - Get current progress details
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

    // Check ownership using store
    const goal = await practiceGoalStore.getById(id);

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (goal.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const progressPercentage = Math.min(100, (goal.currentValue / goal.targetValue) * 100);
    const remaining = Math.max(0, goal.targetValue - goal.currentValue);

    // Calculate estimated completion based on start date and current progress
    let estimatedDaysToComplete: number | null = null;
    if (goal.currentValue > 0 && !goal.isCompleted) {
      const daysSinceStart = Math.max(
        1,
        (Date.now() - new Date(goal.startDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      const dailyRate = goal.currentValue / daysSinceStart;
      if (dailyRate > 0) {
        estimatedDaysToComplete = Math.ceil(remaining / dailyRate);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        goalId: goal.id,
        title: goal.title,
        goalType: goal.goalType,
        currentValue: goal.currentValue,
        targetValue: goal.targetValue,
        progressPercentage: Math.round(progressPercentage * 100) / 100,
        remaining: Math.round(remaining * 100) / 100,
        isCompleted: goal.isCompleted,
        completedAt: goal.completedAt,
        deadline: goal.deadline,
        daysUntilDeadline: goal.deadline
          ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null,
        isOverdue: goal.deadline && new Date(goal.deadline) < new Date() && !goal.isCompleted,
        estimatedDaysToComplete,
        startDate: goal.startDate,
      },
    });
  } catch (error) {
    logger.error('Error fetching goal progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}
