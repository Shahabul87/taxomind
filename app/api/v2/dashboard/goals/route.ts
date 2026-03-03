import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getStore } from '@/lib/sam/taxomind-context';
import type { GoalPriority, GoalStatus } from '@sam-ai/agentic';

/**
 * Unified Goals API v2
 *
 * This endpoint consolidates goals from:
 * - SAM Agentic Goals (primary, feature-rich)
 * - Dashboard Goals (legacy, for backward compatibility)
 *
 * The SAM agentic system is used as the primary source for:
 * - Rich goal metadata (mastery levels, context)
 * - Sub-goals and execution plans
 * - AI-powered goal decomposition
 */

// Get the Goal Store from TaxomindContext singleton
const goalStore = getStore('goal');

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

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
  // Legacy support fields
  type: z.enum(['LEARNING', 'CAREER', 'SKILL', 'PROJECT', 'HABIT', 'CUSTOM']).optional(),
  milestones: z
    .array(
      z.object({
        title: z.string(),
        targetDate: z.coerce.date(),
      })
    )
    .optional(),
});

const GetGoalsQuerySchema = z.object({
  status: StatusEnum.optional(),
  priority: PriorityEnum.optional(),
  courseId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  // Legacy pagination support
  page: z.coerce.number().int().min(1).optional(),
});

const UpdateGoalSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional(),
  status: StatusEnum.optional(),
  priority: PriorityEnum.optional(),
  targetDate: z.string().datetime().optional(),
  progress: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
});

// ============================================================================
// GET - List user goals (unified)
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const query = GetGoalsQuerySchema.parse({
      status: searchParams.get('status') ?? undefined,
      priority: searchParams.get('priority') ?? undefined,
      courseId: searchParams.get('courseId') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
      page: searchParams.get('page') ?? undefined,
    });

    // Convert page to offset for legacy support
    const offset = query.page ? (query.page - 1) * query.limit : query.offset;

    // Use the GoalStore from @sam-ai/agentic package for querying
    const goals = await goalStore.getByUser(session.user.id, {
      status: query.status ? [query.status as GoalStatus] : undefined,
      priority: query.priority ? [query.priority as GoalPriority] : undefined,
      courseId: query.courseId,
      limit: query.limit,
      offset,
      orderBy: 'createdAt',
      orderDir: 'desc',
    });

    // Fetch related course data for each goal
    const courseIds = goals
      .filter((g) => g.context?.courseId)
      .map((g) => g.context.courseId as string);

    const courses = courseIds.length > 0
      ? await db.course.findMany({
          where: { id: { in: courseIds } },
          select: { id: true, title: true, imageUrl: true },
          take: 200,
        })
      : [];

    const coursesById = new Map(courses.map((c) => [c.id, c]));

    // Fetch subGoals and plans for all goals
    const goalIds = goals.map((g) => g.id);

    const [subGoalsData, plansData] = await Promise.all([
      goalIds.length > 0
        ? db.sAMSubGoal.findMany({
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
            take: 200,
          })
        : [],
      goalIds.length > 0
        ? db.sAMExecutionPlan.findMany({
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
            take: 200,
          })
        : [],
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
      courseId: goal.context?.courseId,
      chapterId: goal.context?.chapterId,
      sectionId: goal.context?.sectionId,
      topicIds: goal.context?.topicIds,
      skillIds: goal.context?.skillIds,
      // Add related data
      course: goal.context?.courseId
        ? coursesById.get(goal.context.courseId) ?? null
        : null,
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
      data: enrichedGoals,
      metadata: {
        pagination: {
          total: totalGoals.length,
          limit: query.limit,
          offset,
          page: query.page ?? Math.floor(offset / query.limit) + 1,
          hasMore: offset + goals.length < totalGoals.length,
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching goals (v2):', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create a new goal (unified)
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
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
      currentMastery: validated.currentMastery as
        | 'novice'
        | 'beginner'
        | 'intermediate'
        | 'advanced'
        | 'expert'
        | undefined,
      targetMastery: validated.targetMastery as
        | 'novice'
        | 'beginner'
        | 'intermediate'
        | 'advanced'
        | 'expert'
        | undefined,
      tags: validated.tags,
    });

    // If legacy milestones are provided, create them as sub-goals
    if (validated.milestones && validated.milestones.length > 0) {
      await db.sAMSubGoal.createMany({
        data: validated.milestones.map((m, idx) => ({
          goalId: goal.id,
          title: m.title,
          order: idx,
          status: 'PENDING' as const,
          type: 'LEARN' as const,
        })),
      });
    }

    // Fetch course details if courseId is provided
    let courseData = null;
    if (validated.courseId) {
      const course = await db.course.findUnique({
        where: { id: validated.courseId },
        select: { id: true, title: true, imageUrl: true },
      });
      courseData = course;
    }

    logger.info(`Created goal (v2): ${goal.id} for user: ${session.user.id}`);

    return NextResponse.json({
      success: true,
      data: {
        ...goal,
        course: courseData,
        subGoals: [],
        plans: [],
      },
    });
  } catch (error) {
    logger.error('Error creating goal (v2):', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}
