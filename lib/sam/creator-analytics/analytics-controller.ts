/**
 * Creator Analytics Controller
 *
 * Bridges creator analytics with SAM&apos;s goal/plan tracking.
 * Creates a SAM Goal + 6-step ExecutionPlan when analysis starts.
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

const NUM_STAGES = 6;

/**
 * Create a SAM Goal + 6-step ExecutionPlan for a creator analytics session.
 */
export async function initializeCreatorAnalyticsGoal(
  userId: string,
  courseName: string,
  focusArea: string
): Promise<GoalPlanIds> {
  const { goal: goalStore, plan: planStore } = getGoalStores();

  try {
    const samGoal = await goalStore.create({
      userId,
      title: `PRISM Creator Analytics: ${courseName}`,
      description: `Course-level PRISM analytics with ${focusArea} focus. Cohort cognitive analysis, content quality, root causes, prescriptions.`,
      priority: 'medium',
      context: {
        courseId: courseName,
      },
      tags: ['creator-analytics'],
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
          title: 'Data Collection & Aggregation',
          description: 'Collect enrollment, cognitive, assessment, and engagement data across cohort',
          type: 'create_summary',
          order: 0,
          status: 'pending',
          estimatedMinutes: 2,
          retryCount: 0,
          maxRetries: 2,
          inputs: [],
          outputs: [],
          executionContext: {},
          metadata: { courseName, stage: 1 },
        },
        {
          id: '',
          planId: '',
          title: 'Cohort Cognitive Analysis',
          description: 'Compute Bloom&apos;s distribution, bimodal detection, fragile knowledge alarm, dropout risk',
          type: 'create_summary',
          order: 1,
          status: 'pending',
          estimatedMinutes: 1,
          retryCount: 0,
          maxRetries: 2,
          inputs: [],
          outputs: [],
          executionContext: {},
          metadata: { stage: 2 },
        },
        {
          id: '',
          planId: '',
          title: 'Content & Assessment Quality',
          description: 'AI analysis of module effectiveness, discrimination indices, Bloom&apos;s alignment',
          type: 'create_summary',
          order: 2,
          status: 'pending',
          estimatedMinutes: 3,
          retryCount: 0,
          maxRetries: 2,
          inputs: [],
          outputs: [],
          executionContext: {},
          metadata: { stage: 3 },
        },
        {
          id: '',
          planId: '',
          title: 'Root Cause Analysis',
          description: 'Identify root causes (CONTENT/PEDAGOGY/ASSESSMENT/STUDENT/SYSTEM) and predict risks',
          type: 'create_summary',
          order: 3,
          status: 'pending',
          estimatedMinutes: 3,
          retryCount: 0,
          maxRetries: 2,
          inputs: [],
          outputs: [],
          executionContext: {},
          metadata: { stage: 4 },
        },
        {
          id: '',
          planId: '',
          title: 'Prescription Engine',
          description: 'Generate ROI-scored prescriptions and assessment redesign suggestions',
          type: 'create_summary',
          order: 4,
          status: 'pending',
          estimatedMinutes: 2,
          retryCount: 0,
          maxRetries: 2,
          inputs: [],
          outputs: [],
          executionContext: {},
          metadata: { stage: 5 },
        },
        {
          id: '',
          planId: '',
          title: 'Report Generation',
          description: 'Generate creator-friendly PRISM report with key metrics and next steps',
          type: 'create_summary',
          order: 5,
          status: 'pending',
          estimatedMinutes: 2,
          retryCount: 0,
          maxRetries: 2,
          inputs: [],
          outputs: [],
          executionContext: {},
          metadata: { stage: 6 },
        },
      ],
      checkpoints: [],
      checkpointData: {},
      schedule: undefined,
      fallbackStrategies: [],
    });

    const stepIds = samPlan.steps.map((s) => s.id);

    logger.info('[CreatorAnalyticsController] Goal and plan created', {
      goalId: samGoal.id,
      planId: samPlan.id,
      stepCount: stepIds.length,
    });

    return { goalId: samGoal.id, planId: samPlan.id, stepIds };
  } catch (error) {
    logger.error('[CreatorAnalyticsController] Failed to create goal/plan', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
    return { goalId: '', planId: '', stepIds: [] };
  }
}

/**
 * Mark a stage step as in_progress.
 */
export async function advanceCreatorAnalyticsStage(
  planId: string,
  stepIds: string[],
  stageNumber: 1 | 2 | 3 | 4 | 5 | 6
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
  } catch (error) {
    logger.warn('[CreatorAnalyticsController] Failed to advance stage', {
      error: error instanceof Error ? error.message : String(error),
      planId,
      stageNumber,
    });
  }
}

/**
 * Mark a stage step as completed.
 */
export async function completeCreatorAnalyticsStep(
  planId: string,
  stepIds: string[],
  stageNumber: 1 | 2 | 3 | 4 | 5 | 6,
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
    logger.warn('[CreatorAnalyticsController] Failed to complete step', {
      error: error instanceof Error ? error.message : String(error),
      planId,
      stageNumber,
    });
  }
}

/**
 * Mark the entire analytics session as completed.
 */
export async function completeCreatorAnalytics(
  goalId: string,
  planId: string,
  stats: {
    totalEnrolled: number;
    cohortHealthScore: number;
    prescriptionCount: number;
  }
): Promise<void> {
  if (!goalId || !planId) return;

  const { goal: goalStore, plan: planStore } = getGoalStores();

  try {
    await planStore.update(planId, {
      overallProgress: 100,
      status: PlanStatus.COMPLETED,
      completedAt: new Date(),
      checkpointData: { completionStats: stats },
    });

    await goalStore.complete(goalId);

    logger.info('[CreatorAnalyticsController] Analytics completed', {
      goalId,
      planId,
      stats,
    });
  } catch (error) {
    logger.warn('[CreatorAnalyticsController] Failed to mark complete', {
      error: error instanceof Error ? error.message : String(error),
      goalId,
      planId,
    });
  }
}

/**
 * Mark the analytics session as failed.
 */
export async function failCreatorAnalytics(
  goalId: string,
  planId: string,
  errorMessage: string
): Promise<void> {
  if (!goalId || !planId) return;

  const { goal: goalStore, plan: planStore } = getGoalStores();

  try {
    await planStore.update(planId, {
      status: PlanStatus.FAILED,
      checkpointData: {
        failureReason: errorMessage,
        failedAt: new Date().toISOString(),
      },
    });

    await goalStore.pause(goalId);
  } catch (error) {
    logger.warn('[CreatorAnalyticsController] Failed to mark failed', {
      error: error instanceof Error ? error.message : String(error),
      goalId,
      planId,
    });
  }
}
