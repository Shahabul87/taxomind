/**
 * Course Creation Controller
 *
 * Lightweight controller that bridges course creation with SAM's goal/plan tracking.
 * Creates a SAM Goal + 3-step ExecutionPlan when a course creation starts, then
 * advances steps as each stage completes.
 *
 * Phase 3: SubGoal decomposition — one SubGoal per chapter for granular tracking.
 *
 * Uses: getGoalStores() from TaxomindContext for store access.
 */

import 'server-only';

import { logger } from '@/lib/logger';
import { getGoalStores } from '@/lib/sam/taxomind-context';
import { GoalStatus, PlanStatus, SubGoalType, type UpdateGoalInput } from '@sam-ai/agentic';

/**
 * Extended goal update input that includes metadata.
 * The underlying Prisma model supports metadata, but UpdateGoalInput
 * from @sam-ai/agentic does not expose it yet.
 */
type GoalUpdateWithMetadata = UpdateGoalInput & {
  metadata?: Record<string, unknown>;
};

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
      context: {
        courseId,
      },
      tags: ['course-creation'],
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
          id: '',
          planId: '',
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
          executionContext: {},
          metadata: { courseId, stage: 1 },
        },
        {
          id: '',
          planId: '',
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
          executionContext: {},
          metadata: { courseId, stage: 2 },
        },
        {
          id: '',
          planId: '',
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
          executionContext: {},
          metadata: { courseId, stage: 3 },
        },
      ],
      checkpoints: [],
      checkpointData: {},
      schedule: undefined,
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
      outputs: (outputs ?? []).map((value) => ({
        name: 'stage-output',
        type: 'result' as const,
        value,
        timestamp: new Date(),
      })),
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

// =============================================================================
// SUBGOAL DECOMPOSITION (Phase 3)
// =============================================================================

/**
 * Create a SubGoal for a specific chapter.
 * Called at the start of each chapter's depth-first loop.
 * Returns the subGoalId for later completion.
 */
export async function initializeChapterSubGoal(
  goalId: string,
  chapterNumber: number,
  chapterTitle: string,
  totalChapters: number,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
): Promise<string> {
  if (!goalId) return '';

  const { subGoal: subGoalStore } = getGoalStores();

  try {
    const subGoal = await subGoalStore.create({
      goalId,
      title: `Chapter ${chapterNumber}: ${chapterTitle}`,
      description: `Generate chapter ${chapterNumber}/${totalChapters} with sections and details`,
      type: SubGoalType.CREATE,
      order: chapterNumber - 1,
      estimatedMinutes: 5,
      difficulty,
      prerequisites: chapterNumber > 1
        ? [] // Could track previous subGoalIds for sequential deps
        : [],
      successCriteria: [
        'Chapter generated with learning objectives',
        'All sections generated with content types',
        'Section details enriched with activities',
      ],
      metadata: {
        chapterNumber,
        totalChapters,
        stage: 'chapter',
      },
    });

    logger.debug('[CourseCreationController] Chapter SubGoal created', {
      subGoalId: subGoal.id,
      goalId,
      chapterNumber,
    });

    return subGoal.id;
  } catch (error) {
    logger.warn('[CourseCreationController] Failed to create chapter SubGoal', {
      error: error instanceof Error ? error.message : String(error),
      goalId,
      chapterNumber,
    });
    return '';
  }
}

/**
 * Mark a chapter SubGoal as completed after all 3 stages finish for that chapter.
 */
export async function completeChapterSubGoal(
  subGoalId: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  if (!subGoalId) return;

  const { subGoal: subGoalStore } = getGoalStores();

  try {
    await subGoalStore.markComplete(subGoalId);

    if (metadata) {
      await subGoalStore.update(subGoalId, { metadata });
    }

    logger.debug('[CourseCreationController] Chapter SubGoal completed', { subGoalId });
  } catch (error) {
    logger.warn('[CourseCreationController] Failed to complete chapter SubGoal', {
      error: error instanceof Error ? error.message : String(error),
      subGoalId,
    });
  }
}

// =============================================================================
// AGENTIC STORAGE (Blueprint, Decisions, Reflection)
// =============================================================================

/**
 * Store the pre-generation blueprint in the Goal's metadata field.
 * Allows later comparison between plan and reality.
 */
export async function storeBlueprintInGoal(
  goalId: string,
  blueprint: Record<string, unknown>,
): Promise<void> {
  if (!goalId) return;

  const { goal: goalStore } = getGoalStores();

  try {
    const existing = await goalStore.get(goalId);
    const existingMetadata = (existing?.metadata ?? {}) as Record<string, unknown>;

    await goalStore.update(goalId, {
      metadata: {
        ...existingMetadata,
        blueprint,
        blueprintStoredAt: new Date().toISOString(),
      },
    } as GoalUpdateWithMetadata);

    logger.debug('[CourseCreationController] Blueprint stored in goal', { goalId });
  } catch (error) {
    logger.warn('[CourseCreationController] Failed to store blueprint', {
      error: error instanceof Error ? error.message : String(error),
      goalId,
    });
  }
}

/**
 * Record an agentic decision in the plan's checkpoint data.
 * Creates audit trail of autonomous decisions.
 */
export async function storeDecisionInPlan(
  planId: string,
  chapterNumber: number,
  decision: Record<string, unknown>,
): Promise<void> {
  if (!planId) return;

  const { plan: planStore } = getGoalStores();

  try {
    const existing = await planStore.get(planId);
    const existingCheckpoint = (existing?.checkpointData ?? {}) as Record<string, unknown>;
    const existingDecisions = (existingCheckpoint.agenticDecisions ?? []) as Array<Record<string, unknown>>;

    await planStore.update(planId, {
      checkpointData: {
        ...existingCheckpoint,
        agenticDecisions: [
          ...existingDecisions,
          {
            chapterNumber,
            decision,
            timestamp: new Date().toISOString(),
          },
        ],
      },
    });

    logger.debug('[CourseCreationController] Decision stored in plan', { planId, chapterNumber });
  } catch (error) {
    logger.warn('[CourseCreationController] Failed to store decision', {
      error: error instanceof Error ? error.message : String(error),
      planId,
      chapterNumber,
    });
  }
}

/**
 * Store the post-generation reflection in the Goal's metadata.
 * Makes it available for future course creations.
 */
export async function storeReflectionInGoal(
  goalId: string,
  reflection: Record<string, unknown>,
): Promise<void> {
  if (!goalId) return;

  const { goal: goalStore } = getGoalStores();

  try {
    const existing = await goalStore.get(goalId);
    const existingMetadata = (existing?.metadata ?? {}) as Record<string, unknown>;

    await goalStore.update(goalId, {
      metadata: {
        ...existingMetadata,
        courseReflection: reflection,
        reflectionStoredAt: new Date().toISOString(),
      },
    } as GoalUpdateWithMetadata);

    logger.info('[CourseCreationController] Reflection stored in goal', {
      goalId,
      coherenceScore: reflection.coherenceScore,
    });
  } catch (error) {
    logger.warn('[CourseCreationController] Failed to store reflection', {
      error: error instanceof Error ? error.message : String(error),
      goalId,
    });
  }
}

/**
 * Mark the course creation as failed — goal paused, plan failed.
 * IMPORTANT: Merges failure info into existing checkpoint data instead of
 * overwriting it, so resume can reconstruct state from the preserved checkpoint.
 */
export async function failCourseCreation(
  goalId: string,
  planId: string,
  errorMessage: string
): Promise<void> {
  if (!goalId || !planId) return;

  const { goal: goalStore, plan: planStore } = getGoalStores();

  try {
    // Load existing checkpoint to preserve it
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

    logger.info('[CourseCreationController] Course creation failed (checkpoint preserved)', {
      goalId,
      planId,
      errorMessage,
      hadCheckpoint: Object.keys(existingCheckpoint).length > 0,
    });
  } catch (error) {
    logger.warn('[CourseCreationController] Failed to mark creation failed', {
      error: error instanceof Error ? error.message : String(error),
      goalId,
      planId,
    });
  }
}
