/**
 * Student Analytics Controller
 *
 * Bridges student analytics with SAM&apos;s goal/plan tracking.
 * Creates a SAM Goal + 5-step ExecutionPlan when analysis starts,
 * then advances steps as each stage completes.
 *
 * Uses: getGoalStores() from TaxomindContext for store access.
 */

import 'server-only';

import { randomUUID } from 'crypto';
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
 * Create a SAM Goal + 5-step ExecutionPlan for a student analytics session.
 */
export async function initializeAnalyticsGoal(
  userId: string,
  analysisDepth: string,
  courseScope: string
): Promise<GoalPlanIds> {
  const { goal: goalStore, plan: planStore } = getGoalStores();

  try {
    const samGoal = await goalStore.create({
      userId,
      title: `PRISM Student Analytics: ${analysisDepth}`,
      description: `Student-level PRISM analytics with ${courseScope} scope. Profile, Reveal, Identify, Suggest, Monitor.`,
      priority: 'medium',
      context: {
        topicIds: [analysisDepth, courseScope],
      },
      tags: ['student-analytics'],
    });

    const planId = randomUUID();
    const samPlan = await planStore.create({
      goalId: samGoal.id,
      userId,
      startDate: new Date(),
      status: PlanStatus.ACTIVE,
      overallProgress: 0,
      steps: [
        {
          id: randomUUID(),
          planId,
          title: 'Data Collection',
          description: 'Collect cognitive, assessment, and engagement data from database',
          type: 'create_summary',
          order: 0,
          status: 'pending',
          estimatedMinutes: 1,
          retryCount: 0,
          maxRetries: 2,
          inputs: [],
          outputs: [],
          executionContext: { previousResults: { stage: 1 } },
          metadata: { analysisDepth },
        },
        {
          id: randomUUID(),
          planId,
          title: 'Cognitive Mapping',
          description: 'Compute Bloom&apos;s cognitive map, ceiling, growth edge, velocity, and fragile knowledge',
          type: 'create_summary',
          order: 1,
          status: 'pending',
          estimatedMinutes: 1,
          retryCount: 0,
          maxRetries: 2,
          inputs: [],
          outputs: [],
          executionContext: { previousResults: { stage: 2 } },
          metadata: {},
        },
        {
          id: randomUUID(),
          planId,
          title: 'Interpretive Analysis',
          description: 'AI-powered interpretation of cognitive patterns and cluster classification',
          type: 'create_summary',
          order: 2,
          status: 'pending',
          estimatedMinutes: 2,
          retryCount: 0,
          maxRetries: 2,
          inputs: [],
          outputs: [],
          executionContext: { previousResults: { stage: 3 } },
          metadata: {},
        },
        {
          id: randomUUID(),
          planId,
          title: 'Prescriptions & Alerts',
          description: 'Generate actionable prescriptions and priority alerts',
          type: 'create_summary',
          order: 3,
          status: 'pending',
          estimatedMinutes: 2,
          retryCount: 0,
          maxRetries: 2,
          inputs: [],
          outputs: [],
          executionContext: { previousResults: { stage: 4 } },
          metadata: {},
        },
        {
          id: randomUUID(),
          planId,
          title: 'Report Generation',
          description: 'Generate student-friendly PRISM report with verification questions',
          type: 'create_summary',
          order: 4,
          status: 'pending',
          estimatedMinutes: 1,
          retryCount: 0,
          maxRetries: 2,
          inputs: [],
          outputs: [],
          executionContext: { previousResults: { stage: 5 } },
          metadata: {},
        },
      ],
      checkpoints: [],
      checkpointData: {},
      schedule: { dailyMinutes: 0, sessions: [] },
      fallbackStrategies: [],
    });

    const stepIds = samPlan.steps.map((s) => s.id);

    logger.info('[StudentAnalyticsController] Goal and plan created', {
      goalId: samGoal.id,
      planId: samPlan.id,
      stepCount: stepIds.length,
    });

    return { goalId: samGoal.id, planId: samPlan.id, stepIds };
  } catch (error) {
    logger.error('[StudentAnalyticsController] Failed to create goal/plan', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
    return { goalId: '', planId: '', stepIds: [] };
  }
}

/**
 * Mark a stage step as in_progress and update overall plan progress.
 */
export async function advanceAnalyticsStage(
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
  } catch (error) {
    logger.warn('[StudentAnalyticsController] Failed to advance stage', {
      error: error instanceof Error ? error.message : String(error),
      planId,
      stageNumber,
    });
  }
}

/**
 * Mark a stage step as completed.
 */
export async function completeAnalyticsStep(
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
      outputs: (outputs ?? []).map((o) => ({
        name: o,
        type: 'result' as const,
        value: o,
        timestamp: new Date(),
      })),
    });
  } catch (error) {
    logger.warn('[StudentAnalyticsController] Failed to complete step', {
      error: error instanceof Error ? error.message : String(error),
      planId,
      stageNumber,
    });
  }
}

/**
 * Mark the entire analytics session as completed.
 */
export async function completeAnalytics(
  goalId: string,
  planId: string,
  stats: {
    totalSkills: number;
    cognitiveHealthScore: number;
    cognitiveCluster: string;
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

    logger.info('[StudentAnalyticsController] Analytics completed', {
      goalId,
      planId,
      stats,
    });
  } catch (error) {
    logger.warn('[StudentAnalyticsController] Failed to mark complete', {
      error: error instanceof Error ? error.message : String(error),
      goalId,
      planId,
    });
  }
}

/**
 * Mark the analytics session as failed.
 */
export async function failAnalytics(
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

    logger.info('[StudentAnalyticsController] Analytics failed (preserved)', {
      goalId,
      planId,
      errorMessage,
    });
  } catch (error) {
    logger.warn('[StudentAnalyticsController] Failed to mark failed', {
      error: error instanceof Error ? error.message : String(error),
      goalId,
      planId,
    });
  }
}
