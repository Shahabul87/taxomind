import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getSAMAdapter, handleAIAccessError } from '@/lib/sam/ai-provider';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { withRetryableTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { getGoalStores } from '@/lib/sam/taxomind-context';
import {
  createGoalDecomposer,
  type GoalDecomposition,
  type CreateSubGoalInput,
} from '@sam-ai/agentic';

// Get the stores from TaxomindContext singleton
const { goal: goalStore, subGoal: subGoalStore } = getGoalStores();

// ============================================================================
// PER-REQUEST ENGINE FACTORY
// ============================================================================

async function createGoalDecomposerForUser(userId: string) {
  const aiAdapter = await getSAMAdapter({ userId, capability: 'chat' });

  return createGoalDecomposer({
    aiAdapter,
    logger: console,
  });
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const DecomposeOptionsSchema = z.object({
  maxSubGoals: z.number().int().min(1).max(20).optional().default(10),
  minSubGoals: z.number().int().min(1).max(10).optional().default(2),
  includeAssessments: z.boolean().optional().default(true),
  includeReviews: z.boolean().optional().default(true),
  preferredLearningStyle: z.string().optional(),
  availableTimePerDay: z.number().int().min(5).max(480).optional(),
});

interface RouteContext {
  params: Promise<{ goalId: string }>;
}

// ============================================================================
// POST - Decompose a goal into sub-goals
// ============================================================================

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    // Rate limiting
    const rateLimitResponse = await withRateLimit(req, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goalId } = await context.params;

    // Parse request body with error handling
    let body: Record<string, unknown>;
    try {
      const text = await req.text();
      logger.info(`[Decompose] Request body text: ${text || '(empty)'}`);
      body = text ? JSON.parse(text) : {};
    } catch (parseError) {
      logger.error(`[Decompose] Failed to parse request body:`, parseError);
      body = {};
    }

    const options = DecomposeOptionsSchema.parse(body);

    // Use the GoalStore from @sam-ai/agentic package to fetch the goal
    const goal = await goalStore.get(goalId);

    if (!goal || goal.userId !== session.user.id) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Use the GoalDecomposer from @sam-ai/agentic package
    logger.info(`[Decompose] Starting decomposition for goal: ${goal.title}`);
    const decomposer = await createGoalDecomposerForUser(session.user.id);

    let decomposition: GoalDecomposition;
    try {
      decomposition = await withRetryableTimeout(
        () => decomposer.decompose(goal, {
          maxSubGoals: options.maxSubGoals,
          minSubGoals: options.minSubGoals,
          includeAssessments: options.includeAssessments,
          includeReviews: options.includeReviews,
          preferredLearningStyle: options.preferredLearningStyle,
          availableTimePerDay: options.availableTimePerDay,
        }),
        TIMEOUT_DEFAULTS.AI_GENERATION,
        'agentic-decomposeGoal'
      );
      logger.info(`[Decompose] Successfully decomposed goal into ${decomposition.subGoals.length} sub-goals`);
    } catch (decomposeError) {
      logger.error(`[Decompose] Decomposition failed:`, decomposeError);
      throw decomposeError;
    }

    // Delete existing sub-goals for this goal (if re-decomposing)
    await subGoalStore.deleteByGoal(goalId);

    // Persist sub-goals to database
    const subGoalInputs: CreateSubGoalInput[] = decomposition.subGoals.map(
      (sg, index) => ({
        goalId,
        title: sg.title,
        description: sg.description,
        type: sg.type,
        order: sg.order ?? index,
        estimatedMinutes: sg.estimatedMinutes,
        difficulty: sg.difficulty,
        prerequisites: sg.prerequisites ?? [],
        successCriteria: sg.successCriteria ?? [],
      })
    );

    const persistedSubGoals = await subGoalStore.createMany(subGoalInputs);

    logger.info(
      `Decomposed goal ${goalId} into ${persistedSubGoals.length} sub-goals and persisted to database`
    );

    return NextResponse.json({
      success: true,
      data: {
        goal,
        subGoals: persistedSubGoals.map((sg) => ({
          id: sg.id,
          goalId: sg.goalId,
          title: sg.title,
          description: sg.description ?? null,
          type: sg.type.toUpperCase(),
          order: sg.order,
          estimatedMinutes: sg.estimatedMinutes,
          difficulty: sg.difficulty,
          prerequisites: sg.prerequisites ?? [],
          successCriteria: sg.successCriteria ?? [],
          status: sg.status.toUpperCase(),
        })),
        decomposition: {
          subGoalCount: persistedSubGoals.length,
          estimatedDuration: decomposition.estimatedDuration,
          difficulty: decomposition.difficulty,
          confidence: decomposition.confidence,
          dependencies: decomposition.dependencies,
        },
      },
    });
  } catch (error) {
    if (error instanceof OperationTimeoutError) {
      logger.error('[Decompose] Timed out:', { operation: error.operationName, timeoutMs: error.timeoutMs });
      return NextResponse.json(
        { error: 'Goal decomposition timed out. Please try again.' },
        { status: 504 }
      );
    }

    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;

    logger.error('Error decomposing goal:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid options', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to decompose goal' },
      { status: 500 }
    );
  }
}
