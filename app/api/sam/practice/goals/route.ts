import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getPracticeStores } from '@/lib/sam/taxomind-context';
import type { GoalType } from '@/lib/sam/stores';

// Get practice goal store from TaxomindContext singleton
const { practiceGoal: practiceGoalStore } = getPracticeStores();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GoalTypeEnum = z.enum([
  'HOURS',
  'QUALITY_HOURS',
  'SESSIONS',
  'STREAK',
  'WEEKLY_HOURS',
]);

const GetGoalsQuerySchema = z.object({
  status: z.enum(['active', 'completed', 'all']).optional().default('all'),
  skillId: z.string().optional(),
  goalType: GoalTypeEnum.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

const CreateGoalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  goalType: GoalTypeEnum,
  targetValue: z.number().positive(),
  skillId: z.string().optional(),
  skillName: z.string().optional(),
  deadline: z.string().datetime().optional(),
  reminderEnabled: z.boolean().optional(),
  reminderFrequency: z.enum(['DAILY', 'WEEKLY', 'NONE']).optional(),
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
// GET - List user goals
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = GetGoalsQuerySchema.parse({
      status: searchParams.get('status') ?? undefined,
      skillId: searchParams.get('skillId') ?? undefined,
      goalType: searchParams.get('goalType') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
    });

    // Use store to get goals with filters
    const allFilteredGoals = await practiceGoalStore.getUserGoals(session.user.id, {
      status: query.status,
      skillId: query.skillId,
      goalType: query.goalType as GoalType | undefined,
    });

    // Apply pagination
    const total = allFilteredGoals.length;
    const goals = allFilteredGoals.slice(query.offset, query.offset + query.limit);

    // Enrich goals with computed fields
    const enrichedGoals = goals.map(enrichGoal);

    // Get statistics using store method
    const stats = await practiceGoalStore.getGoalStats(session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        goals: enrichedGoals,
        stats: {
          totalGoals: stats.totalGoals,
          activeGoals: stats.activeGoals,
          completedGoals: stats.completedGoals,
          completionRate: stats.completionRate,
          byType: stats.byType,
        },
        pagination: {
          total,
          limit: query.limit,
          offset: query.offset,
          hasMore: query.offset + query.limit < total,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching practice goals:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

// ============================================================================
// POST - Create a new goal
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = CreateGoalSchema.parse(body);

    // Validate deadline is in the future
    if (data.deadline) {
      const deadlineDate = new Date(data.deadline);
      if (deadlineDate <= new Date()) {
        return NextResponse.json(
          { error: 'Deadline must be in the future' },
          { status: 400 }
        );
      }
    }

    // Create the goal using store
    const goal = await practiceGoalStore.create({
      userId: session.user.id,
      title: data.title,
      description: data.description,
      goalType: data.goalType as GoalType,
      targetValue: data.targetValue,
      skillId: data.skillId,
      skillName: data.skillName,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      reminderEnabled: data.reminderEnabled,
      reminderFrequency: data.reminderFrequency,
    });

    logger.info(`Created practice goal: ${goal.id} for user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      data: enrichGoal(goal),
    });
  } catch (error) {
    logger.error('Error creating practice goal:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}
