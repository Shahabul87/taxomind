/**
 * Agentic Depth Analysis - Goal/Plan Lifecycle Controller
 *
 * Manages SAM Goal + ExecutionPlan lifecycle for depth analysis.
 * All functions are NON-BLOCKING — they catch errors and log warnings.
 * Goal tracking must NEVER crash the main analysis pipeline.
 *
 * Follows the exact pattern from course-creation-controller.ts.
 */

import { logger } from '@/lib/logger';
import { getGoalStores } from '@/lib/sam/taxomind-context';
import type { AnalysisStats, AnalysisReflection, AgenticDecision } from './types';

// =============================================================================
// INITIALIZE
// =============================================================================

export async function initializeAnalysisGoal(
  userId: string,
  courseTitle: string,
  courseId: string,
  analysisId: string
): Promise<{ goalId: string; planId: string; stepIds: string[] }> {
  try {
    const { goal: goalStore, plan: planStore } = getGoalStores();

    const samGoal = await goalStore.create({
      userId,
      title: `Analyze course: ${courseTitle}`,
      description: `Multi-framework depth analysis of "${courseTitle}"`,
      status: 'active',
      priority: 'high',
      context: { courseId, analysisId, type: 'depth-analysis' },
      tags: ['depth-analysis', 'quality'],
    });

    const steps = [
      { title: 'Initialize & Plan Strategy', order: 0, status: 'pending' as const, estimatedDuration: '30s' },
      { title: 'Structural Analysis', order: 1, status: 'pending' as const, estimatedDuration: '1m' },
      { title: 'Per-Chapter Deep Analysis', order: 2, status: 'pending' as const, estimatedDuration: '5m' },
      { title: 'Cross-Chapter Analysis', order: 3, status: 'pending' as const, estimatedDuration: '1m' },
      { title: 'Post-Processing & Finalization', order: 4, status: 'pending' as const, estimatedDuration: '30s' },
    ];

    const samPlan = await planStore.create({
      goalId: samGoal.id,
      userId,
      title: `Depth Analysis Plan: ${courseTitle}`,
      status: 'active',
      overallProgress: 0,
      steps,
      checkpointData: {
        courseId,
        analysisId,
        seedCheckpoint: true,
        createdAt: new Date().toISOString(),
      },
    });

    const stepIds = samPlan.steps?.map((s: { id: string }) => s.id) ?? [];

    logger.info('[AnalysisController] Goal + Plan initialized', {
      goalId: samGoal.id,
      planId: samPlan.id,
      stepCount: stepIds.length,
    });

    return { goalId: samGoal.id, planId: samPlan.id, stepIds };
  } catch (error) {
    logger.warn('[AnalysisController] Failed to initialize goal/plan', { error });
    // Return empty IDs — analysis continues without goal tracking
    return { goalId: '', planId: '', stepIds: [] };
  }
}

// =============================================================================
// STAGE ADVANCEMENT
// =============================================================================

export async function advanceAnalysisStage(
  planId: string,
  stepIds: string[],
  stageNumber: number
): Promise<void> {
  if (!planId || stepIds.length === 0) return;

  try {
    const { plan: planStore } = getGoalStores();
    const stepId = stepIds[stageNumber];
    if (!stepId) return;

    await planStore.updateStep(planId, stepId, {
      status: 'in_progress',
      startedAt: new Date().toISOString(),
    });

    const progressMap: Record<number, number> = {
      0: 5,   // Initialize
      1: 10,  // Structural
      2: 60,  // Per-Chapter (main work)
      3: 80,  // Cross-Chapter
      4: 90,  // Post-Processing
    };

    await planStore.update(planId, {
      overallProgress: progressMap[stageNumber] ?? 0,
    });

    logger.info('[AnalysisController] Stage advanced', { planId, stageNumber });
  } catch (error) {
    logger.warn('[AnalysisController] Failed to advance stage', { planId, stageNumber, error });
  }
}

export async function completeAnalysisStage(
  planId: string,
  stepIds: string[],
  stageNumber: number,
  outputs: string[]
): Promise<void> {
  if (!planId || stepIds.length === 0) return;

  try {
    const { plan: planStore } = getGoalStores();
    const stepId = stepIds[stageNumber];
    if (!stepId) return;

    await planStore.updateStep(planId, stepId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      outputs,
    });

    logger.info('[AnalysisController] Stage completed', { planId, stageNumber });
  } catch (error) {
    logger.warn('[AnalysisController] Failed to complete stage', { planId, stageNumber, error });
  }
}

// =============================================================================
// SUBGOALS (per chapter)
// =============================================================================

export async function initializeChapterSubGoal(
  goalId: string,
  chapterNumber: number,
  chapterTitle: string
): Promise<string> {
  if (!goalId) return '';

  try {
    const { subGoal: subGoalStore } = getGoalStores();

    const subGoal = await subGoalStore.create({
      goalId,
      title: `Analyze Chapter ${chapterNumber}: ${chapterTitle}`,
      type: 'evaluate',
      order: chapterNumber - 1,
      status: 'active',
    });

    return subGoal.id;
  } catch (error) {
    logger.warn('[AnalysisController] Failed to create chapter subgoal', {
      goalId, chapterNumber, error,
    });
    return '';
  }
}

export async function completeChapterSubGoal(subGoalId: string): Promise<void> {
  if (!subGoalId) return;

  try {
    const { subGoal: subGoalStore } = getGoalStores();
    await subGoalStore.markComplete(subGoalId);
  } catch (error) {
    logger.warn('[AnalysisController] Failed to complete chapter subgoal', { subGoalId, error });
  }
}

// =============================================================================
// COMPLETION / FAILURE
// =============================================================================

export async function completeAnalysis(
  goalId: string,
  planId: string,
  stats: AnalysisStats
): Promise<void> {
  if (!goalId || !planId) return;

  try {
    const { goal: goalStore, plan: planStore } = getGoalStores();

    await planStore.update(planId, {
      status: 'completed',
      overallProgress: 100,
      metadata: {
        stats: {
          totalChapters: stats.totalChapters,
          totalIssues: stats.totalIssues,
          overallScore: stats.overallScore,
          analysisTimeMs: stats.analysisTimeMs,
          tokensUsed: stats.tokensUsed,
        },
      },
    });

    await goalStore.complete(goalId);

    logger.info('[AnalysisController] Analysis completed', {
      goalId,
      planId,
      overallScore: stats.overallScore,
      totalIssues: stats.totalIssues,
    });
  } catch (error) {
    logger.warn('[AnalysisController] Failed to complete analysis goal', { goalId, planId, error });
  }
}

export async function failAnalysis(
  goalId: string,
  planId: string,
  errorMessage: string
): Promise<void> {
  if (!goalId || !planId) return;

  try {
    const { goal: goalStore, plan: planStore } = getGoalStores();

    await planStore.update(planId, {
      status: 'paused',
      metadata: { failureReason: errorMessage, failedAt: new Date().toISOString() },
    });

    await goalStore.update(goalId, { status: 'paused' });

    logger.info('[AnalysisController] Analysis failed/paused', { goalId, planId, errorMessage });
  } catch (error) {
    logger.warn('[AnalysisController] Failed to mark analysis as failed', { goalId, planId, error });
  }
}

export async function reactivateAnalysis(
  goalId: string,
  planId: string
): Promise<void> {
  if (!goalId || !planId) return;

  try {
    const { goal: goalStore, plan: planStore } = getGoalStores();

    await goalStore.update(goalId, { status: 'active' });
    await planStore.update(planId, { status: 'active' });

    logger.info('[AnalysisController] Analysis reactivated for resume', { goalId, planId });
  } catch (error) {
    logger.warn('[AnalysisController] Failed to reactivate analysis', { goalId, planId, error });
  }
}

// =============================================================================
// METADATA
// =============================================================================

export async function storeDecisionInPlan(
  planId: string,
  decision: AgenticDecision
): Promise<void> {
  if (!planId) return;

  try {
    const { plan: planStore } = getGoalStores();
    const plan = await planStore.get(planId);
    if (!plan) return;

    const checkpoint = (plan.checkpointData as Record<string, unknown>) ?? {};
    const existingDecisions = (checkpoint.agenticDecisions as AgenticDecision[]) ?? [];

    await planStore.update(planId, {
      checkpointData: {
        ...checkpoint,
        agenticDecisions: [...existingDecisions, decision],
      },
    });
  } catch (error) {
    logger.warn('[AnalysisController] Failed to store decision', { planId, error });
  }
}

export async function storeReflectionInGoal(
  goalId: string,
  reflection: AnalysisReflection
): Promise<void> {
  if (!goalId) return;

  try {
    const { goal: goalStore } = getGoalStores();
    const goal = await goalStore.get(goalId);
    if (!goal) return;

    const existingMetadata = (goal.metadata as Record<string, unknown>) ?? {};

    await goalStore.update(goalId, {
      metadata: {
        ...existingMetadata,
        analysisReflection: reflection,
      },
    });

    logger.info('[AnalysisController] Reflection stored in goal', {
      goalId,
      confidenceLevel: reflection.confidenceLevel,
    });
  } catch (error) {
    logger.warn('[AnalysisController] Failed to store reflection', { goalId, error });
  }
}
