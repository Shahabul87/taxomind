import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createPrismaGoalStore } from '@/lib/sam/stores';
import {
  createGoalDecomposer,
  type GoalDecomposition,
} from '@sam-ai/agentic';
import { AnthropicAdapter } from '@sam-ai/core';

// Initialize stores and decomposer
const goalStore = createPrismaGoalStore();

// Lazy initialize AI-dependent components
let decomposerInstance: ReturnType<typeof createGoalDecomposer> | null = null;

function getGoalDecomposer() {
  if (!decomposerInstance) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    const aiAdapter = new AnthropicAdapter({
      apiKey,
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514',
    });

    decomposerInstance = createGoalDecomposer({
      aiAdapter,
      logger: console,
    });
  }
  return decomposerInstance;
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
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { goalId } = await context.params;
    const body = await req.json();
    const options = DecomposeOptionsSchema.parse(body);

    // Use the GoalStore from @sam-ai/agentic package to fetch the goal
    const goal = await goalStore.get(goalId);

    if (!goal || goal.userId !== session.user.id) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Use the GoalDecomposer from @sam-ai/agentic package
    const decomposer = getGoalDecomposer();
    const decomposition: GoalDecomposition = await decomposer.decompose(goal, {
      maxSubGoals: options.maxSubGoals,
      minSubGoals: options.minSubGoals,
      includeAssessments: options.includeAssessments,
      includeReviews: options.includeReviews,
      preferredLearningStyle: options.preferredLearningStyle,
      availableTimePerDay: options.availableTimePerDay,
    });

    // Note: SAMSubGoal and SAMLearningGoal models don't exist in the schema yet
    // Sub-goals are returned directly from the decomposer without persistence
    // TODO: Add schema models when implementing full goal tracking

    logger.info(
      `Decomposed goal ${goalId} into ${decomposition.subGoals.length} sub-goals using GoalDecomposer`
    );

    return NextResponse.json({
      success: true,
      data: {
        goal,
        subGoals: decomposition.subGoals.map((sg, index) => ({
          id: sg.id,
          goalId,
          title: sg.title,
          description: sg.description ?? null,
          type: sg.type.toUpperCase(),
          order: sg.order ?? index,
          estimatedMinutes: sg.estimatedMinutes,
          difficulty: sg.difficulty,
          prerequisites: sg.prerequisites ?? [],
          successCriteria: sg.successCriteria ?? [],
          status: 'PENDING',
        })),
        decomposition: {
          subGoalCount: decomposition.subGoals.length,
          estimatedDuration: decomposition.estimatedDuration,
          difficulty: decomposition.difficulty,
          confidence: decomposition.confidence,
          dependencies: decomposition.dependencies,
        },
      },
    });
  } catch (error) {
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
