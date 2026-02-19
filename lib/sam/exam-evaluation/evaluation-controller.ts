/**
 * Exam Evaluation Controller
 *
 * Lightweight controller that bridges exam evaluation with SAM&apos;s goal/plan tracking.
 * Creates a SAM Goal + 5-step ExecutionPlan when an evaluation starts, then
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
 * Create a SAM Goal + 5-step ExecutionPlan for an exam evaluation session.
 * Returns the goal and plan IDs for subsequent stage tracking.
 */
export async function initializeEvaluationGoal(
  userId: string,
  examTitle: string,
  attemptId: string
): Promise<GoalPlanIds> {
  const { goal: goalStore, plan: planStore } = getGoalStores();

  try {
    const samGoal = await goalStore.create({
      userId,
      title: `Evaluate exam: ${examTitle}`,
      description: `DIAGNOSE framework evaluation for attempt "${attemptId}" with 7-layer cognitive diagnostic pipeline.`,
      priority: 'high',
      context: {},
      tags: ['exam-evaluation', `attempt:${attemptId}`],
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
          title: 'Load & Prepare',
          description: 'Fetch attempt, questions, answers, and exam metadata',
          type: 'create_summary',
          order: 0,
          status: 'pending',
          estimatedMinutes: 1,
          retryCount: 0,
          maxRetries: 2,
          inputs: [],
          outputs: [],
          executionContext: {},
          metadata: { attemptId, stage: 1 },
        },
        {
          id: '',
          planId: '',
          title: 'DIAGNOSE Evaluation',
          description: 'Run 7-layer DIAGNOSE framework on each answer: Detect, Identify, Assess, Gap-Map, Name, Outline, Score',
          type: 'create_summary',
          order: 1,
          status: 'pending',
          estimatedMinutes: 5,
          retryCount: 0,
          maxRetries: 2,
          inputs: [],
          outputs: [],
          executionContext: {},
          metadata: { attemptId, stage: 2 },
        },
        {
          id: '',
          planId: '',
          title: 'Echo-Back Teaching',
          description: 'Generate echo-back teaching for top 3 most impactful answers',
          type: 'create_summary',
          order: 2,
          status: 'pending',
          estimatedMinutes: 2,
          retryCount: 0,
          maxRetries: 2,
          inputs: [],
          outputs: [],
          executionContext: {},
          metadata: { attemptId, stage: 3 },
        },
        {
          id: '',
          planId: '',
          title: 'Cognitive Profile',
          description: 'Generate aggregate cognitive profile: Bloom&apos;s map, ceiling, growth edge, patterns',
          type: 'create_summary',
          order: 3,
          status: 'pending',
          estimatedMinutes: 2,
          retryCount: 0,
          maxRetries: 2,
          inputs: [],
          outputs: [],
          executionContext: {},
          metadata: { attemptId, stage: 4 },
        },
        {
          id: '',
          planId: '',
          title: 'Improvement Roadmap',
          description: 'Generate priority-ordered interventions with ARROW phase prescriptions',
          type: 'create_summary',
          order: 4,
          status: 'pending',
          estimatedMinutes: 1,
          retryCount: 0,
          maxRetries: 2,
          inputs: [],
          outputs: [],
          executionContext: {},
          metadata: { attemptId, stage: 5 },
        },
      ],
      checkpoints: [],
      checkpointData: {},
      schedule: undefined,
      fallbackStrategies: [],
    });

    const stepIds = samPlan.steps.map((s) => s.id);

    logger.info('[EvalController] Goal and plan created', {
      goalId: samGoal.id,
      planId: samPlan.id,
      stepCount: stepIds.length,
      attemptId,
    });

    return { goalId: samGoal.id, planId: samPlan.id, stepIds };
  } catch (error) {
    logger.error('[EvalController] Failed to create goal/plan', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      attemptId,
    });
    return { goalId: '', planId: '', stepIds: [] };
  }
}

/**
 * Mark a stage step as in_progress and update overall plan progress.
 */
export async function advanceEvaluationStage(
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

    logger.debug('[EvalController] Stage advanced', {
      planId,
      stageNumber,
      progress,
    });
  } catch (error) {
    logger.warn('[EvalController] Failed to advance stage', {
      error: error instanceof Error ? error.message : String(error),
      planId,
      stageNumber,
    });
  }
}

/**
 * Mark a stage step as completed after evaluation succeeds.
 */
export async function completeEvaluationStep(
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
    logger.warn('[EvalController] Failed to complete stage step', {
      error: error instanceof Error ? error.message : String(error),
      planId,
      stageNumber,
    });
  }
}

/**
 * Mark the entire evaluation as completed.
 */
export async function completeEvaluation(
  goalId: string,
  planId: string,
  stats: {
    totalAnswers: number;
    averageComposite: number;
    bloomsGapAverage: number;
    misconceptionsFound: number;
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

    logger.info('[EvalController] Evaluation completed', {
      goalId,
      planId,
      stats,
    });
  } catch (error) {
    logger.warn('[EvalController] Failed to mark evaluation complete', {
      error: error instanceof Error ? error.message : String(error),
      goalId,
      planId,
    });
  }
}

/**
 * Mark the evaluation as failed, preserving checkpoint data.
 */
export async function failEvaluation(
  goalId: string,
  planId: string,
  errorMessage: string
): Promise<void> {
  if (!goalId || !planId) return;

  const { goal: goalStore, plan: planStore } = getGoalStores();

  try {
    const existingPlan = await planStore.get(planId);
    const existingCheckpoint = (existingPlan?.checkpointData ?? {}) as Record<string, unknown>;

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

    logger.info('[EvalController] Evaluation failed (checkpoint preserved)', {
      goalId,
      planId,
      errorMessage,
      hadCheckpoint: Object.keys(existingCheckpoint).length > 0,
    });
  } catch (error) {
    logger.warn('[EvalController] Failed to mark evaluation failed', {
      error: error instanceof Error ? error.message : String(error),
      goalId,
      planId,
    });
  }
}
