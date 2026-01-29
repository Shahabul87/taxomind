import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { getStore } from '@/lib/sam/taxomind-context';
import {
  type GoalPriority,
  type GoalStatus,
} from '@sam-ai/agentic';

// Get the Goal Store from TaxomindContext singleton
const goalStore = getStore('goal');

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
// GET - List user goals (OPTIMIZED - Single query with includes)
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

    // Build where clause - normalize lowercase input to uppercase Prisma enums
    const whereClause = {
      userId: session.user.id,
      ...(query.status && { status: query.status.toUpperCase() as SAMGoalStatusPrisma }),
      ...(query.priority && { priority: query.priority.toUpperCase() as SAMGoalPriorityPrisma }),
      ...(query.courseId && { courseId: query.courseId }),
    };

    // OPTIMIZED: Single query with includes instead of N+1 queries
    // Previous implementation made 5 separate queries:
    // 1. goalStore.getByUser (goals)
    // 2. db.course.findMany (courses)
    // 3. db.sAMSubGoal.findMany (subGoals)
    // 4. db.sAMExecutionPlan.findMany (plans)
    // 5. goalStore.getByUser again (for count)
    //
    // Now: Single query with includes + count
    const [goalsWithRelations, totalCount] = await Promise.all([
      db.sAMLearningGoal.findMany({
        where: whereClause,
        include: {
          // Include course relation directly
          course: {
            select: { id: true, title: true },
          },
          // Include subGoals relation with ordering
          subGoals: {
            select: {
              id: true,
              goalId: true,
              title: true,
              order: true,
              status: true,
              type: true,
              estimatedMinutes: true,
              difficulty: true,
              completedAt: true,
              metadata: true,
            },
            orderBy: { order: 'asc' },
          },
          // Include plans relation
          plans: {
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
          },
        },
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
      }),
      // Use count instead of fetching all records for pagination
      db.sAMLearningGoal.count({ where: whereClause }),
    ]);

    // Transform to match expected response format
    const enrichedGoals = goalsWithRelations.map((goal) => {
      // Normalize subGoal status to lowercase for frontend compatibility
      const normalizedSubGoals = goal.subGoals.map((sg) => ({
        ...sg,
        // Prisma stores UPPERCASE, but frontend expects lowercase
        status: sg.status?.toLowerCase() ?? 'pending',
        type: sg.type?.toLowerCase() ?? 'learn',
        difficulty: sg.difficulty?.toLowerCase() ?? 'medium',
      }));

      // Calculate progress from subGoals
      const totalSubGoals = normalizedSubGoals.length;
      const completedSubGoals = normalizedSubGoals.filter(
        (sg) => sg.status === 'completed'
      ).length;
      const calculatedProgress =
        totalSubGoals > 0 ? Math.round((completedSubGoals / totalSubGoals) * 100) : 0;

      // Normalize plans status to lowercase
      const normalizedPlans = goal.plans.map((plan) => ({
        ...plan,
        status: plan.status?.toLowerCase() ?? 'draft',
      }));

      return {
        id: goal.id,
        userId: goal.userId,
        title: goal.title,
        description: goal.description,
        targetDate: goal.targetDate,
        // Normalize enums to lowercase for frontend
        priority: goal.priority?.toLowerCase() ?? 'medium',
        status: goal.status?.toLowerCase() ?? 'draft',
        // Progress calculation
        progress: calculatedProgress,
        // Mastery levels normalized
        currentMastery: goal.currentMastery?.toLowerCase() ?? null,
        targetMastery: goal.targetMastery?.toLowerCase() ?? null,
        // Context fields (flattened for backward compatibility)
        context: {
          courseId: goal.courseId,
          chapterId: goal.chapterId,
          sectionId: goal.sectionId,
          topicIds: goal.topicIds,
          skillIds: goal.skillIds,
        },
        courseId: goal.courseId,
        chapterId: goal.chapterId,
        sectionId: goal.sectionId,
        topicIds: goal.topicIds,
        skillIds: goal.skillIds,
        // Metadata
        tags: goal.tags,
        metadata: goal.metadata,
        // Timestamps
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
        completedAt: goal.completedAt,
        // Related data from includes (no extra queries!)
        course: goal.course,
        subGoals: normalizedSubGoals,
        plans: normalizedPlans,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        goals: enrichedGoals,
        pagination: {
          total: totalCount,
          limit: query.limit,
          offset: query.offset,
          hasMore: query.offset + goalsWithRelations.length < totalCount,
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

// Type aliases for Prisma enums (uppercase)
type SAMGoalStatusPrisma = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED';
type SAMGoalPriorityPrisma = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// ============================================================================
// POST - Create a new goal
// ============================================================================

export async function POST(req: NextRequest) {
  // Rate limit goal creation requests
  const rateLimitResponse = await withRateLimit(req, 'standard');
  if (rateLimitResponse) return rateLimitResponse;

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
        subGoals: [], // New goals have no sub-goals yet
        plans: [], // New goals have no plans yet
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
