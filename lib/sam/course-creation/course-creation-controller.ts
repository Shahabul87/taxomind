/**
 * Course Creation Controller
 *
 * Lightweight controller that bridges course creation with SAM's goal/plan tracking.
 * Creates a SAM Goal + 3-step ExecutionPlan when a course creation starts, then
 * advances steps as each stage completes.
 *
 * Uses: getGoalStores() from TaxomindContext for store access.
 */

import 'server-only';

import { logger } from '@/lib/logger';
import { getGoalStores } from '@/lib/sam/taxomind-context';
import { GoalStatus, PlanStatus } from '@sam-ai/agentic';

interface GoalPlanIds {
  goalId: string;
  planId: string;
  stepIds: string[];
}

/**
 * Create a SAM Goal + 3-step ExecutionPlan for a course creation session.
 * Returns the goal and plan IDs for subsequent stage tracking.
 */
export async function initializeCourseCreationGoal(
  userId: string,
  courseTitle: string,
  courseId: string
): Promise<GoalPlanIds> {
  const { goal: goalStore, plan: planStore } = getGoalStores();

  try {
    // Create SAM Goal
    const samGoal = await goalStore.create({
      userId,
      title: `Create course: ${courseTitle}`,
      description: `AI-powered creation of course "${courseTitle}" with chapters, sections, and learning objectives.`,
      priority: 'high',
      status: GoalStatus.ACTIVE,
      context: {
        courseId,
        type: 'course-creation',
      },
    });

    // Create 3-step ExecutionPlan
    const samPlan = await planStore.create({
      goalId: samGoal.id,
      userId,
      startDate: new Date(),
      status: PlanStatus.ACTIVE,
      overallProgress: 0,
      steps: [
        {
          title: 'Generate Chapters',
          description: 'Generate all course chapters with learning objectives and Bloom\'s taxonomy alignment',
          type: 'create_summary',
          order: 0,
          status: 'pending',
          estimatedMinutes: 5,
          retryCount: 0,
          maxRetries: 2,
          inputs: [],
          outputs: [],
          executionContext: { stage: 1 },
          metadata: { courseId },
        },
        {
          title: 'Generate Sections',
          description: 'Generate sections for each chapter with content types and topic focus',
          type: 'create_summary',
          order: 1,
          status: 'pending',
          estimatedMinutes: 10,
          retryCount: 0,
          maxRetries: 2,
          inputs: [],
          outputs: [],
          executionContext: { stage: 2 },
          metadata: { courseId },
        },
        {
          title: 'Enrich Section Details',
          description: 'Generate descriptions, learning objectives, activities, and resources for each section',
          type: 'create_summary',
          order: 2,
          status: 'pending',
          estimatedMinutes: 15,
          retryCount: 0,
          maxRetries: 2,
          inputs: [],
          outputs: [],
          executionContext: { stage: 3 },
          metadata: { courseId },
        },
      ],
      checkpoints: [],
      checkpointData: {},
      schedule: {},
      fallbackStrategies: [],
    });

    const stepIds = samPlan.steps.map(s => s.id);

    logger.info('[CourseCreationController] Goal and plan created', {
      goalId: samGoal.id,
      planId: samPlan.id,
      stepCount: stepIds.length,
      courseId,
    });

    return { goalId: samGoal.id, planId: samPlan.id, stepIds };
  } catch (error) {
    logger.error('[CourseCreationController] Failed to create goal/plan', {
      error: error instanceof Error ? error.message : String(error),
      userId,
      courseId,
    });
    // Return empty IDs — goal tracking is non-blocking
    return { goalId: '', planId: '', stepIds: [] };
  }
}

/**
 * Mark a stage step as in_progress and update overall plan progress.
 */
export async function advanceCourseStage(
  planId: string,
  stepIds: string[],
  stageNumber: number
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

    // Update overall progress: each stage is ~33%
    const progress = Math.round(((stageNumber - 1) / 3) * 100);
    await planStore.update(planId, {
      overallProgress: progress,
      currentStepId: stepId,
    });

    logger.debug('[CourseCreationController] Stage advanced', { planId, stageNumber, progress });
  } catch (error) {
    logger.warn('[CourseCreationController] Failed to advance stage', {
      error: error instanceof Error ? error.message : String(error),
      planId,
      stageNumber,
    });
  }
}

/**
 * Mark a stage step as completed after generation succeeds.
 */
export async function completeStageStep(
  planId: string,
  stepIds: string[],
  stageNumber: number,
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
      outputs: outputs ?? [],
    });
  } catch (error) {
    logger.warn('[CourseCreationController] Failed to complete stage step', {
      error: error instanceof Error ? error.message : String(error),
      planId,
      stageNumber,
    });
  }
}

/**
 * Mark the entire course creation as completed — goal complete, plan 100%.
 */
export async function completeCourseCreation(
  goalId: string,
  planId: string,
  stats: { totalChapters: number; totalSections: number; totalTime: number; averageQualityScore: number }
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

    logger.info('[CourseCreationController] Course creation completed', {
      goalId,
      planId,
      stats,
    });
  } catch (error) {
    logger.warn('[CourseCreationController] Failed to mark creation complete', {
      error: error instanceof Error ? error.message : String(error),
      goalId,
      planId,
    });
  }
}

/**
 * Reactivate a paused/failed course creation goal and plan.
 * Used when resuming from a checkpoint.
 */
export async function reactivateCourseCreation(
  goalId: string,
  planId: string
): Promise<void> {
  if (!goalId || !planId) return;

  const { goal: goalStore, plan: planStore } = getGoalStores();

  try {
    await goalStore.update(goalId, { status: GoalStatus.ACTIVE });
    await planStore.update(planId, { status: PlanStatus.ACTIVE });

    logger.info('[CourseCreationController] Course creation reactivated', {
      goalId,
      planId,
    });
  } catch (error) {
    logger.warn('[CourseCreationController] Failed to reactivate creation', {
      error: error instanceof Error ? error.message : String(error),
      goalId,
      planId,
    });
  }
}

/**
 * Mark the course creation as failed — goal paused, plan failed.
 */
export async function failCourseCreation(
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

    logger.info('[CourseCreationController] Course creation failed', {
      goalId,
      planId,
      errorMessage,
    });
  } catch (error) {
    logger.warn('[CourseCreationController] Failed to mark creation failed', {
      error: error instanceof Error ? error.message : String(error),
      goalId,
      planId,
    });
  }
}
