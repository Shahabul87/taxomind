/**
 * Exam Creation Controller
 *
 * Lightweight controller that bridges exam creation with SAM&apos;s goal/plan tracking.
 * Creates a SAM Goal + 5-step ExecutionPlan when an exam creation starts, then
 * advances steps as each stage completes.
 *
 * Uses: getGoalStores() from TaxomindContext for store access.
 */

import 'server-only';

import { logger } from '@/lib/logger';
import { getGoalStores } from '@/lib/sam/taxomind-context';
import { PlanStatus } from '@sam-ai/agentic';

interface GoalPlanIds {
  goalId: string;
  planId: string;
  stepIds: string[];
}

const NUM_STAGES = 5;

/**
 * Create a SAM Goal + 5-step ExecutionPlan for an exam creation session.
 * Returns the goal and plan IDs for subsequent stage tracking.
 */
export async function initializeExamCreationGoal(
  userId: string,
  examTitle: string,
  examId: string
): Promise<GoalPlanIds> {
  const { goal: goalStore, plan: planStore } = getGoalStores();

  try {
    const samGoal = await goalStore.create({
      userId,
      title: `Create exam: ${examTitle}`,
      description: `AI-powered Bloom&apos;s Taxonomy exam generation for "${examTitle}" with 5-stage pipeline.`,
      priority: 'high',
      context: {},
      tags: ['exam-creation', `exam:${examId}`],
    });

    const samPlan = await planStore.create({
      goalId: samGoal.id,
      userId,
      startDate: new Date(),
      status: PlanStatus.ACTIVE,
      overallProgress: 0,
      steps: [
        {
          id: '',
          planId: '',
          title: 'Topic Decomposition',
          description:
            'Break the exam topic into 5-15 concepts with prerequisites and common misconceptions',
          type: 'create_summary',
          order: 0,
          status: 'pending',
          estimatedMinutes: 2,
          retryCount: 0,
          maxRetries: 2,
          inputs: [],
          outputs: [],
          executionContext: {},
          metadata: { examId, stage: 1 },
        },
        {
          id: '',
          planId: '',
          title: 'Bloom&apos;s Distribution Planning',
          description:
            'Calculate questions per Bloom&apos;s level per concept based on exam purpose',
          type: 'create_summary',
          order: 1,
          status: 'pending',
          estimatedMinutes: 2,
          retryCount: 0,
          maxRetries: 2,
          inputs: [],
          outputs: [],
          executionContext: {},
          metadata: { examId, stage: 2 },
        },
        {
          id: '',
          planId: '',
          title: 'Question Generation',
          description:
            'Generate questions per concept x Bloom&apos;s level with quality scoring and retry',
          type: 'create_summary',
          order: 2,
          status: 'pending',
          estimatedMinutes: 10,
          retryCount: 0,
          maxRetries: 2,
          inputs: [],
          outputs: [],
          executionContext: {},
          metadata: { examId, stage: 3 },
        },
        {
          id: '',
          planId: '',
          title: 'Exam Assembly & Balancing',
          description:
            'Validate coverage, difficulty curve, independence, and cognitive load balance',
          type: 'create_summary',
          order: 3,
          status: 'pending',
          estimatedMinutes: 2,
          retryCount: 0,
          maxRetries: 2,
          inputs: [],
          outputs: [],
          executionContext: {},
          metadata: { examId, stage: 4 },
        },
        {
          id: '',
          planId: '',
          title: 'Rubric & Cognitive Profile',
          description:
            'Generate rubric, answer key, diagnostic mapping, and cognitive profile template',
          type: 'create_summary',
          order: 4,
          status: 'pending',
          estimatedMinutes: 2,
          retryCount: 0,
          maxRetries: 2,
          inputs: [],
          outputs: [],
          executionContext: {},
          metadata: { examId, stage: 5 },
        },
      ],
      checkpoints: [],
      checkpointData: {},
      schedule: undefined,
      fallbackStrategies: [],
    });

    const stepIds = samPlan.steps.map((s) => s.id);

    logger.info('[ExamCreationController] Goal and plan created', {
      goalId: samGoal.id,
      planId: samPlan.id,
      stepCount: stepIds.length,
      examId,
    });

    return { goalId: samGoal.id, planId: samPlan.id, stepIds };
  } catch (error) {
    logger.error('[ExamCreationController] Failed to create goal/plan', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      examId,
    });
    return { goalId: '', planId: '', stepIds: [] };
  }
}

/**
 * Mark a stage step as in_progress and update overall plan progress.
 */
export async function advanceExamStage(
  planId: string,
  stepIds: string[],
  stageNumber: 1 | 2 | 3 | 4 | 5
): Promise<void> {
  if (!planId || stepIds.length === 0) return;

  const { plan: planStore } = getGoalStores();
  const stepIndex = stageNumber - 1;
  const stepId = stepIds[stepIndex];

  if (!stepId) return;

  try {
    await planStore.updateStep(planId, stepId, {
      status: 'in_progress',
      startedAt: new Date(),
    });

    const progress = Math.round(((stageNumber - 1) / NUM_STAGES) * 100);
    await planStore.update(planId, {
      overallProgress: progress,
      currentStepId: stepId,
    });

    logger.debug('[ExamCreationController] Stage advanced', {
      planId,
      stageNumber,
      progress,
    });
  } catch (error) {
    logger.warn('[ExamCreationController] Failed to advance stage', {
      error: error instanceof Error ? error.message : String(error),
      planId,
      stageNumber,
    });
  }
}

/**
 * Mark a stage step as completed after generation succeeds.
 */
export async function completeExamStep(
  planId: string,
  stepIds: string[],
  stageNumber: 1 | 2 | 3 | 4 | 5,
  outputs?: string[]
): Promise<void> {
  if (!planId || stepIds.length === 0) return;

  const { plan: planStore } = getGoalStores();
  const stepIndex = stageNumber - 1;
  const stepId = stepIds[stepIndex];

  if (!stepId) return;

  try {
    await planStore.updateStep(planId, stepId, {
      status: 'completed',
      completedAt: new Date(),
      outputs: (outputs ?? []).map((value) => ({
        name: 'stage-output',
        type: 'result' as const,
        value,
        timestamp: new Date(),
      })),
    });
  } catch (error) {
    logger.warn('[ExamCreationController] Failed to complete stage step', {
      error: error instanceof Error ? error.message : String(error),
      planId,
      stageNumber,
    });
  }
}

/**
 * Mark the entire exam creation as completed.
 */
export async function completeExamCreation(
  goalId: string,
  planId: string,
  stats: {
    totalQuestions: number;
    totalPoints: number;
    estimatedDuration: number;
    averageQualityScore: number;
  }
): Promise<void> {
  if (!goalId || !planId) return;

  const { goal: goalStore, plan: planStore } = getGoalStores();

  try {
    await planStore.update(planId, {
      overallProgress: 100,
      status: PlanStatus.COMPLETED,
      completedAt: new Date(),
      checkpointData: {
        completionStats: stats,
      },
    });

    await goalStore.complete(goalId);

    logger.info('[ExamCreationController] Exam creation completed', {
      goalId,
      planId,
      stats,
    });
  } catch (error) {
    logger.warn('[ExamCreationController] Failed to mark creation complete', {
      error: error instanceof Error ? error.message : String(error),
      goalId,
      planId,
    });
  }
}

/**
 * Mark the exam creation as failed, preserving checkpoint data.
 */
export async function failExamCreation(
  goalId: string,
  planId: string,
  errorMessage: string
): Promise<void> {
  if (!goalId || !planId) return;

  const { goal: goalStore, plan: planStore } = getGoalStores();

  try {
    const existingPlan = await planStore.get(planId);
    const existingCheckpoint = (existingPlan?.checkpointData ?? {}) as Record<
      string,
      unknown
    >;

    await planStore.update(planId, {
      status: PlanStatus.FAILED,
      checkpointData: {
        ...existingCheckpoint,
        failureReason: errorMessage,
        failedAt: new Date().toISOString(),
        status: 'error',
        errorMessage,
      },
    });

    await goalStore.pause(goalId);

    logger.info(
      '[ExamCreationController] Exam creation failed (checkpoint preserved)',
      {
        goalId,
        planId,
        errorMessage,
        hadCheckpoint: Object.keys(existingCheckpoint).length > 0,
      }
    );
  } catch (error) {
    logger.warn('[ExamCreationController] Failed to mark creation failed', {
      error: error instanceof Error ? error.message : String(error),
      goalId,
      planId,
    });
  }
}
