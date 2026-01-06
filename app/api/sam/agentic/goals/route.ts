import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createPrismaGoalStore } from '@/lib/sam/stores';
import {
  type GoalPriority,
  type GoalStatus,
} from '@sam-ai/agentic';

// Initialize the Goal Store
const goalStore = createPrismaGoalStore();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

// Use agentic package enum values (lowercase)
const PriorityEnum = z.enum(['low', 'medium', 'high', 'critical']);
const StatusEnum = z.enum(['draft', 'active', 'paused', 'completed', 'abandoned']);
const MasteryEnum = z.enum(['novice', 'beginner', 'intermediate', 'advanced', 'expert']);

const CreateGoalSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  targetDate: z.string().datetime().optional(),
  priority: PriorityEnum.optional().default('medium'),
  courseId: z.string().optional(),
  chapterId: z.string().optional(),
  sectionId: z.string().optional(),
  topicIds: z.array(z.string()).optional().default([]),
  skillIds: z.array(z.string()).optional().default([]),
  currentMastery: MasteryEnum.optional(),
  targetMastery: MasteryEnum.optional(),
  tags: z.array(z.string()).optional().default([]),
});

const GetGoalsQuerySchema = z.object({
  status: StatusEnum.optional(),
  priority: PriorityEnum.optional(),
  courseId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

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
      priority: searchParams.get('priority') ?? undefined,
      courseId: searchParams.get('courseId') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
    });

    // Use the GoalStore from @sam-ai/agentic package for querying
    const goals = await goalStore.getByUser(session.user.id, {
      status: query.status ? [query.status as GoalStatus] : undefined,
      priority: query.priority ? [query.priority as GoalPriority] : undefined,
      courseId: query.courseId,
      limit: query.limit,
      offset: query.offset,
      orderBy: 'createdAt',
      orderDir: 'desc',
    });

    // Fetch related course data for each goal
    const courses = await db.course.findMany({
      where: {
        id: {
          in: goals
            .filter((g) => g.context.courseId)
            .map((g) => g.context.courseId as string),
        },
      },
      select: { id: true, title: true },
    });

    // Build a map for quick lookups
    const coursesById = new Map(courses.map((c) => [c.id, c]));

    // Fetch subGoals and plans for all goals
    const goalIds = goals.map((g) => g.id);

    const [subGoalsData, plansData] = await Promise.all([
      db.sAMSubGoal.findMany({
        where: { goalId: { in: goalIds } },
        select: {
          id: true,
          goalId: true,
          title: true,
          order: true,
          status: true,
          type: true,
          estimatedMinutes: true,
          difficulty: true,
        },
        orderBy: { order: 'asc' },
      }),
      db.sAMExecutionPlan.findMany({
        where: { goalId: { in: goalIds } },
        select: {
          id: true,
          goalId: true,
          status: true,
          overallProgress: true,
          currentStepId: true,
          startDate: true,
          targetDate: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Build maps for quick lookups
    const subGoalsByGoalId = new Map<string, typeof subGoalsData>();
    for (const sg of subGoalsData) {
      const existing = subGoalsByGoalId.get(sg.goalId) ?? [];
      existing.push(sg);
      subGoalsByGoalId.set(sg.goalId, existing);
    }

    const plansByGoalId = new Map<string, typeof plansData>();
    for (const plan of plansData) {
      const existing = plansByGoalId.get(plan.goalId) ?? [];
      existing.push(plan);
      plansByGoalId.set(plan.goalId, existing);
    }

    // Merge goal data with related data
    const enrichedGoals = goals.map((goal) => ({
      ...goal,
      // Flatten context for backward compatibility
      courseId: goal.context.courseId,
      chapterId: goal.context.chapterId,
      sectionId: goal.context.sectionId,
      topicIds: goal.context.topicIds,
      skillIds: goal.context.skillIds,
      // Add related data
      course: goal.context.courseId
        ? coursesById.get(goal.context.courseId) ?? null
        : null,
      // Sub-goals and plans from database
      subGoals: subGoalsByGoalId.get(goal.id) ?? [],
      plans: plansByGoalId.get(goal.id) ?? [],
    }));

    // Get total count for pagination
    const totalGoals = await goalStore.getByUser(session.user.id, {
      status: query.status ? [query.status as GoalStatus] : undefined,
      priority: query.priority ? [query.priority as GoalPriority] : undefined,
      courseId: query.courseId,
    });

    return NextResponse.json({
      success: true,
      data: {
        goals: enrichedGoals,
        pagination: {
          total: totalGoals.length,
          limit: query.limit,
          offset: query.offset,
          hasMore: query.offset + goals.length < totalGoals.length,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching learning goals:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch learning goals' },
      { status: 500 }
    );
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
    const validated = CreateGoalSchema.parse(body);

    // Use the GoalStore from @sam-ai/agentic package
    const goal = await goalStore.create({
      userId: session.user.id,
      title: validated.title,
      description: validated.description,
      targetDate: validated.targetDate ? new Date(validated.targetDate) : undefined,
      priority: validated.priority as GoalPriority,
      context: {
        courseId: validated.courseId,
        chapterId: validated.chapterId,
        sectionId: validated.sectionId,
        topicIds: validated.topicIds,
        skillIds: validated.skillIds,
      },
      // MasteryLevel type is: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert'
      currentMastery: validated.currentMastery as 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert' | undefined,
      targetMastery: validated.targetMastery as 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert' | undefined,
      tags: validated.tags,
    });

    // Fetch course details if courseId is provided
    let courseData = null;
    if (validated.courseId) {
      const course = await db.course.findUnique({
        where: { id: validated.courseId },
        select: { id: true, title: true },
      });
      courseData = course;
    }

    logger.info(`Created learning goal: ${goal.id} for user: ${session.user.id}`);

    return NextResponse.json({
      success: true,
      data: {
        ...goal,
        course: courseData,
      },
    });
  } catch (error) {
    logger.error('Error creating learning goal:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create learning goal' },
      { status: 500 }
    );
  }
}
