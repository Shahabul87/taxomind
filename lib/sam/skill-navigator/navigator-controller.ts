/**
 * NAVIGATOR Controller
 *
 * Manages SAM Goal + 6-step ExecutionPlan lifecycle for the
 * skill navigator pipeline. Fire-and-forget pattern.
 */

import { randomUUID } from 'crypto';
import { logger } from '@/lib/logger';
import { getGoalStores } from '@/lib/sam/taxomind-context';
import { NAVIGATOR_STAGES } from './agentic-types';

// =============================================================================
// GOAL LIFECYCLE
// =============================================================================

export async function initializeNavigatorGoal(
  userId: string,
  skillName: string,
  goalOutcome: string,
): Promise<{ goalId: string; planId: string } | null> {
  try {
    const { goal, plan } = getGoalStores();

    // Create learning goal
    const newGoal = await goal.create({
      userId,
      title: `Skill Navigator: ${skillName}`,
      description: goalOutcome,
      priority: 'high',
      tags: ['skill-navigator', skillName.toLowerCase()],
    });

    // Create execution plan with 6 steps (one per NAVIGATOR stage)
    const planId = randomUUID();
    const newPlan = await plan.create({
      goalId: newGoal.id,
      userId,
      status: 'active',
      overallProgress: 0,
      steps: NAVIGATOR_STAGES.map((s, idx) => ({
        id: randomUUID(),
        planId,
        title: s.name,
        description: `Stage ${s.number}: ${s.name}`,
        type: 'create_summary' as const,
        order: idx,
        status: 'pending' as const,
        estimatedMinutes: 5,
        retryCount: 0,
        maxRetries: 2,
        inputs: [],
        outputs: [],
        executionContext: {},
        metadata: { hasAI: s.hasAI },
      })),
      schedule: {
        dailyMinutes: 30,
        sessions: NAVIGATOR_STAGES.map((s) => ({
          date: new Date(),
          steps: [String(s.number)],
          estimatedMinutes: 5,
          completed: false,
        })),
      },
      checkpoints: [],
      fallbackStrategies: [],
      checkpointData: {},
    });

    logger.info('[NavigatorController] Goal + plan initialized', {
      goalId: newGoal.id,
      planId: newPlan.id,
      userId,
      skillName,
    });

    return { goalId: newGoal.id, planId: newPlan.id };
  } catch (error) {
    logger.error('[NavigatorController] Failed to initialize goal', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      skillName,
    });
    return null;
  }
}

export async function advanceStage(
  planId: string,
  stageNumber: number,
  stageName: string,
): Promise<void> {
  try {
    const { plan } = getGoalStores();
    await plan.update(planId, {
      currentStepId: `stage_${stageNumber}`,
      overallProgress: (stageNumber / NAVIGATOR_STAGES.length) * 100,
      checkpointData: {
        lastCompletedStage: stageNumber,
        lastStageName: stageName,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.warn('[NavigatorController] Failed to advance stage', {
      planId,
      stageNumber,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function completeNavigation(
  goalId: string,
  planId: string,
  roadmapId: string,
): Promise<void> {
  try {
    const { goal, plan } = getGoalStores();

    await Promise.all([
      plan.update(planId, {
        status: 'completed',
        overallProgress: 100,
        completedAt: new Date(),
        checkpointData: {
          roadmapId,
          completedAt: new Date().toISOString(),
        },
      }),
      goal.update(goalId, {
        status: 'completed',
        tags: [`roadmap:${roadmapId}`, 'navigator-pipeline-completed'],
      }),
    ]);

    logger.info('[NavigatorController] Navigation complete', {
      goalId,
      planId,
      roadmapId,
    });
  } catch (error) {
    logger.warn('[NavigatorController] Failed to complete navigation', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export async function failNavigation(
  goalId: string,
  planId: string,
  errorMessage: string,
): Promise<void> {
  try {
    const { goal, plan } = getGoalStores();

    await Promise.all([
      plan.update(planId, {
        status: 'failed',
        checkpointData: {
          error: errorMessage,
          failedAt: new Date().toISOString(),
        },
      }),
      goal.update(goalId, {
        status: 'abandoned',
        tags: ['navigator-pipeline-failed'],
      }),
    ]);
  } catch (error) {
    logger.warn('[NavigatorController] Failed to record failure', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
