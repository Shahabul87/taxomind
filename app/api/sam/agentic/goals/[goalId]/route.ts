import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getGoalStores } from '@/lib/sam/taxomind-context';
import {
  type GoalPriority,
  type GoalStatus,
} from '@sam-ai/agentic';
import {
  recordGoalCompleted,
  recordGoalProgressUpdated,
} from '@/lib/sam/journey-timeline-service';

// Get the stores from TaxomindContext singleton
const { goal: goalStore, subGoal: subGoalStore, plan: planStore } = getGoalStores();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

// Use agentic package enum values (lowercase)
const PriorityEnum = z.enum(['low', 'medium', 'high', 'critical']);
const StatusEnum = z.enum(['draft', 'active', 'paused', 'completed', 'abandoned']);
const MasteryEnum = z.enum(['novice', 'beginner', 'intermediate', 'advanced', 'expert']);

const UpdateGoalSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional(),
  targetDate: z.string().datetime().optional().nullable(),
  priority: PriorityEnum.optional(),
  status: StatusEnum.optional(),
  courseId: z.string().optional().nullable(),
  chapterId: z.string().optional().nullable(),
  sectionId: z.string().optional().nullable(),
  topicIds: z.array(z.string()).optional(),
  skillIds: z.array(z.string()).optional(),
  currentMastery: MasteryEnum.optional(),
  targetMastery: MasteryEnum.optional(),
  tags: z.array(z.string()).optional(),
});

interface RouteContext {
  params: Promise<{ goalId: string }>;
}

// ============================================================================
// GET - Get a specific goal
// ============================================================================

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goalId } = await context.params;

    // Use the GoalStore from @sam-ai/agentic package
    const goal = await goalStore.get(goalId);

    if (!goal || goal.userId !== session.user.id) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Fetch related data (course) for UI
    const course = goal.context.courseId
      ? await db.course.findUnique({
          where: { id: goal.context.courseId },
          select: { id: true, title: true, imageUrl: true },
        })
      : null;

    // Fetch sub-goals from the SubGoalStore
    const subGoals = await subGoalStore.getByGoal(goalId);

    // Fetch execution plans from the PlanStore
    const plans = await planStore.getByGoal(goalId);

    // Combine goal data with related data
    const enrichedGoal = {
      ...goal,
      // Flatten context for backward compatibility
      courseId: goal.context.courseId,
      chapterId: goal.context.chapterId,
      sectionId: goal.context.sectionId,
      topicIds: goal.context.topicIds,
      skillIds: goal.context.skillIds,
      // Add related data
      course,
      subGoals,
      plans,
    };

    return NextResponse.json({
      success: true,
      data: enrichedGoal,
    });
  } catch (error) {
    logger.error('Error fetching learning goal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning goal' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update a goal
// ============================================================================

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goalId } = await context.params;
    const body = await req.json();
    const validated = UpdateGoalSchema.parse(body);

    // Use the GoalStore from @sam-ai/agentic package to verify ownership
    const existing = await goalStore.get(goalId);

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Use the GoalStore to update the goal
    const goal = await goalStore.update(goalId, {
      title: validated.title,
      description: validated.description,
      targetDate: validated.targetDate
        ? new Date(validated.targetDate)
        : validated.targetDate === null
          ? undefined
          : undefined,
      priority: validated.priority as GoalPriority | undefined,
      status: validated.status as GoalStatus | undefined,
      // MasteryLevel type is: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert'
      targetMastery: validated.targetMastery as 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert' | undefined,
      tags: validated.tags,
      context: {
        courseId: validated.courseId ?? undefined,
        chapterId: validated.chapterId ?? undefined,
        sectionId: validated.sectionId ?? undefined,
        topicIds: validated.topicIds,
        skillIds: validated.skillIds,
      },
    });

    // Record journey timeline events for status changes
    if (validated.status && validated.status !== existing.status) {
      try {
        if (validated.status === 'completed') {
          // Goal completed - major milestone!
          await recordGoalCompleted(
            session.user.id,
            goalId,
            goal.title,
            goal.context.courseId
          );
          logger.info(`[JourneyTimeline] Recorded goal completion: ${goalId}`);
        }
      } catch (timelineError) {
        // Don't fail the main operation if timeline recording fails
        logger.warn('[JourneyTimeline] Failed to record event:', timelineError);
      }
    }

    // Record progress updates
    if (goal.progress !== existing.progress) {
      try {
        await recordGoalProgressUpdated(
          session.user.id,
          goalId,
          goal.progress,
          goal.context.courseId
        );
      } catch (timelineError) {
        logger.warn('[JourneyTimeline] Failed to record progress:', timelineError);
      }
    }

    // Fetch related data for response
    const course = goal.context.courseId
      ? await db.course.findUnique({
          where: { id: goal.context.courseId },
          select: { id: true, title: true },
        })
      : null;

    // Fetch sub-goals from the SubGoalStore
    const subGoals = await subGoalStore.getByGoal(goalId);

    // Fetch execution plans from the PlanStore
    const plans = await planStore.getByGoal(goalId);

    logger.info(`Updated learning goal: ${goalId}`);

    return NextResponse.json({
      success: true,
      data: {
        ...goal,
        // Flatten context for backward compatibility
        courseId: goal.context.courseId,
        chapterId: goal.context.chapterId,
        sectionId: goal.context.sectionId,
        topicIds: goal.context.topicIds,
        skillIds: goal.context.skillIds,
        course,
        subGoals,
        plans,
      },
    });
  } catch (error) {
    logger.error('Error updating learning goal:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update learning goal' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete a goal
// ============================================================================

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goalId } = await context.params;

    // Use the GoalStore from @sam-ai/agentic package to verify ownership
    const existing = await goalStore.get(goalId);

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Use the GoalStore to delete the goal
    await goalStore.delete(goalId);

    logger.info(`Deleted learning goal: ${goalId}`);

    return NextResponse.json({
      success: true,
      message: 'Goal deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting learning goal:', error);
    return NextResponse.json(
      { error: 'Failed to delete learning goal' },
      { status: 500 }
    );
  }
}
