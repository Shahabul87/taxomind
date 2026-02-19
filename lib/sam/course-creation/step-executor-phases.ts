/**
 * Step Executor Phases — Decomposed phase functions for the CourseCreationStateMachine
 *
 * The step executor in `course-state-machine.ts` was a single ~360-line function
 * containing 14 numbered steps. This module decomposes it into 7 focused phase
 * functions that each handle a specific responsibility:
 *
 * 1. phaseSkipCheck        — Steps 0: skip check
 * 2. phaseLifecycleSetup   — Steps 1, 2: SubGoal init, context build
 * 3. phaseGenerate         — Step 3: generateSingleChapter (all 3 stages, no timeout)
 * 4. phaseLifecycleComplete — Steps 4, 5: Clear bridge, complete SubGoal
 * 5. phaseMemory           — Steps 6, 7: Persist concepts, between-chapter recall
 * 6. phaseDecisionMaking   — Steps 8-11b: Evaluate, apply, quality flag, bridge, replan, skip
 * 7. phaseInlineHealing    — Step 12: Process up to 2 chapters from healing queue
 * 8. phaseCheckpoint       — Steps 13, 14: Save checkpoint, return StepResult
 *
 * Each phase receives a shared `StepExecutorContext` containing all state and
 * configuration needed. Phases mutate shared state directly (same pattern as
 * the original monolithic function).
 */

import 'server-only';

import type { PlanStep, StepResult } from '@sam-ai/agentic';
import { logger } from '@/lib/logger';
import { generateSingleChapter } from './chapter-generator';
import {
  initializeChapterSubGoal,
  completeChapterSubGoal,
  storeDecisionInPlan,
} from './course-creation-controller';
import {
  persistConceptsBackground,
  persistQualityScoresBackground,
} from './memory-persistence';
import { recallChapterContext } from './memory-recall';
import {
  evaluateChapterOutcome,
  applyAgenticDecision,
  generateBridgeContent,
  persistQualityFlag,
} from './agentic-decisions';
import { replanRemainingChapters } from './course-planner';
import { saveCheckpointWithRetry } from './checkpoint-manager';
import { PROMPT_VERSION } from './prompts';
import { BudgetExceededError } from './pipeline-budget';
import {
  PipelineErrorCode,
} from './types';
import type {
  ChapterStepContext,
  ChapterStepResult,
  CourseQualityFlag,
  PipelinePauseRequest,
} from './types';
import type { CourseStateMachineConfig, SharedPipelineState } from './course-state-machine';

// ============================================================================
// Errors
// ============================================================================

/** Thrown when the pipeline is paused for human escalation review */
export class PipelinePausedError extends Error {
  readonly pauseRequest: PipelinePauseRequest;
  readonly courseId: string;
  readonly planId: string;
  constructor(pauseRequest: PipelinePauseRequest, courseId: string, planId: string) {
    super(
      `[PipelinePaused] Paused for human review: chapter ${pauseRequest.chapterPosition} ` +
      `"${pauseRequest.chapterTitle}" — ${pauseRequest.reason}`,
    );
    this.name = 'PipelinePausedError';
    this.pauseRequest = pauseRequest;
    this.courseId = courseId;
    this.planId = planId;
  }
}

function throwIfAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) return;
  const error = new Error('Pipeline cancelled by user');
  error.name = 'AbortError';
  throw error;
}

// ============================================================================
// Types
// ============================================================================

/** Shared context passed to every phase function */
export interface StepExecutorContext {
  /** Machine-level configuration */
  config: CourseStateMachineConfig;
  /** Mutable shared pipeline state */
  state: SharedPipelineState;
  /** The current PlanStep being executed */
  step: PlanStep;
  /** 1-based chapter number (accounting for offset) */
  chapterNumber: number;
  /** Function to build chapter context from chapter number */
  buildContext: (chapterNumber: number) => ChapterStepContext;
}

/** Result of phaseGenerate — carries the chapter result forward */
export interface GeneratePhaseResult {
  chapterResult: ChapterStepResult;
}

// ============================================================================
// Phase 0: Skip Check
// ============================================================================

/**
 * Check if this chapter should be skipped (from previous chapter's AI decision).
 *
 * @returns StepResult if the chapter is skipped, null otherwise
 */
export function phaseSkipCheck(ctx: StepExecutorContext): StepResult | null {
  const { config, state, chapterNumber } = ctx;

  if (state.skipNextChapter) {
    state.skipNextChapter = false;
    state.hasSkipped = true;
    config.onSSEEvent?.({
      type: 'chapter_skipped',
      data: { chapter: chapterNumber, reason: 'AI determined content would be redundant' },
    });
    logger.info('[CourseStateMachine] Skipping chapter (AI decision)', { chapter: chapterNumber });
    return { success: true, output: { skipped: true } } as unknown as StepResult;
  }

  return null;
}

// ============================================================================
// Phase 1: Lifecycle Setup (Steps 1-2)
// ============================================================================

/**
 * Initialize SubGoal and build the chapter generation context.
 *
 * Steps 1-2: Create SubGoal, build context with bridge content.
 *
 * @returns The SubGoal ID and the built chapter context
 */
export async function phaseLifecycleSetup(ctx: StepExecutorContext): Promise<{
  chapterSubGoalId: string;
  chapterContext: ChapterStepContext;
}> {
  const { config, state, step, chapterNumber } = ctx;

  // 1. Create SubGoal
  const chapterSubGoalId = await initializeChapterSubGoal(
    config.goalId,
    chapterNumber,
    step.title,
    config.totalChapters,
    config.courseContext.difficulty === 'expert' ? 'hard' : config.courseContext.difficulty === 'beginner' ? 'easy' : 'medium',
  );

  // 2. Build context with bridge content
  const chapterContext = ctx.buildContext(chapterNumber);
  if (state.bridgeContent) {
    chapterContext.bridgeContent = state.bridgeContent;
  }

  return { chapterSubGoalId, chapterContext };
}

// ============================================================================
// Phase 2: Generate (Step 3)
// ============================================================================

/**
 * Generate a single chapter (all 3 stages: structure → sections → details).
 *
 * NOTE: The per-chapter timeout was REMOVED because:
 *   1. `withTimeout` uses `Promise.race()` which does NOT cancel the inner promise.
 *      When the timeout fired, `generateSingleChapter()` kept running in the background,
 *      corrupting shared mutable state (completedChapters, conceptTracker, qualityScores)
 *      and writing to the DB from an orphaned context.
 *   2. Stage 1 alone takes 3-6 minutes (retries + self-critique + critic review),
 *      leaving no time for Stage 3 within any reasonable per-chapter timeout.
 *   3. Safety is already provided by:
 *      - PipelineBudgetTracker (prevents infinite token spend)
 *      - AbortSignal (user cancellation)
 *      - Per-AI-call timeouts at the provider/SDK level
 *      - The API route's maxDuration (SSE connection limit)
 *
 * @returns The chapter result (always completes all 3 stages before returning)
 */
export async function phaseGenerate(
  ctx: StepExecutorContext,
  chapterContext: ChapterStepContext,
): Promise<{ chapterResult: ChapterStepResult } | { earlyReturn: StepResult }> {
  const { config, state, chapterNumber } = ctx;
  throwIfAborted(config.abortSignal);

  // Budget guard: stop before starting expensive generation
  if (state.budgetTracker && !state.budgetTracker.canProceed()) {
    const snapshot = state.budgetTracker.getSnapshot();
    logger.warn('[CourseStateMachine] Budget exceeded before chapter generation', {
      chapter: chapterNumber, ...snapshot,
    });
    throw new BudgetExceededError(snapshot);
  }

  const startTime = Date.now();
  const chapterResult = await generateSingleChapter(
    config.userId,
    chapterContext,
    {
      onSSEEvent: config.onSSEEvent,
      enableStreamingThinking: config.enableStreamingThinking,
      abortSignal: config.abortSignal,
    },
  );
  throwIfAborted(config.abortSignal);

  const elapsedMs = Date.now() - startTime;
  logger.info('[CourseStateMachine] Chapter generation complete (all 3 stages)', {
    chapter: chapterNumber,
    elapsedMs,
    elapsedSec: Math.round(elapsedMs / 1000),
    sectionsCreated: chapterResult.sectionsCreated,
  });

  return { chapterResult };
}

// ============================================================================
// Phase 3: Lifecycle Complete (Steps 4-5)
// ============================================================================

/**
 * Clear consumed bridge content and complete the SubGoal.
 *
 * Steps 4-5: Clear bridge, record section count, complete SubGoal.
 */
export async function phaseLifecycleComplete(
  ctx: StepExecutorContext,
  chapterSubGoalId: string,
  chapterResult: ChapterStepResult,
): Promise<void> {
  const { state, chapterNumber } = ctx;

  // 4. Clear consumed bridge content
  state.bridgeContent = '';

  // 5. Complete SubGoal + record section count
  const actualSectionCount = chapterResult.completedChapter.sections.length;
  state.chapterSectionCounts.push(actualSectionCount);

  await completeChapterSubGoal(chapterSubGoalId, {
    chapterNumber,
    sectionsCompleted: actualSectionCount,
    qualityScore: chapterResult.qualityScores[0]?.overall ?? 0,
  });
}

// ============================================================================
// Phase 4: Memory (Steps 6-7)
// ============================================================================

/**
 * Persist concepts and quality scores (background), then recall
 * between-chapter context for enriching the next chapter.
 *
 * Steps 6-7: Memory persistence and recall.
 */
export async function phaseMemory(
  ctx: StepExecutorContext,
  chapterResult: ChapterStepResult,
): Promise<void> {
  const { config, state, chapterNumber } = ctx;

  // 6. Persist memory (background)
  persistConceptsBackground(
    config.userId, config.courseId,
    state.conceptTracker, chapterNumber,
    config.courseContext.courseTitle,
    config.courseContext.courseCategory,
  );
  persistQualityScoresBackground(
    config.userId, config.courseId,
    state.qualityScores.slice(), chapterNumber,
  );

  // 7. Between-chapter memory recall
  if (chapterNumber < config.totalChapters) {
    try {
      const relatedConcepts = await recallChapterContext(
        config.userId,
        config.courseId,
        chapterResult.completedChapter.keyTopics,
      );
      if (relatedConcepts.length > 0 && state.recalledMemory) {
        state.recalledMemory.relatedConcepts = [
          ...state.recalledMemory.relatedConcepts,
          ...relatedConcepts.filter(
            rc => !state.recalledMemory!.relatedConcepts.some(existing => existing.name === rc.name),
          ),
        ].slice(0, 15);
      }
    } catch {
      // Non-blocking
    }
  }
}

// ============================================================================
// Phase 5: Decision Making (Steps 8-11b)
// ============================================================================

/**
 * AI-driven agentic decision engine: evaluate chapter outcome, apply
 * decisions (flag, bridge, replan, skip), and store in plan.
 *
 * Steps 8-11b: Full decision-making pipeline.
 */
export async function phaseDecisionMaking(
  ctx: StepExecutorContext,
  chapterResult: ChapterStepResult,
): Promise<void> {
  const { config, state, chapterNumber } = ctx;

  // 8. Rule-based agentic decision (replaced AI call to reduce overhead)
  if (chapterResult.agenticDecision && chapterNumber < config.totalChapters && state.blueprintPlan) {
    state.lastAgenticDecision = evaluateChapterOutcome(
      chapterResult.completedChapter,
      state.qualityScores,
      state.blueprintPlan,
      state.conceptTracker,
    );

    config.onSSEEvent?.({
      type: 'agentic_decision',
      data: {
        chapter: chapterNumber,
        action: state.lastAgenticDecision.action,
        reasoning: state.lastAgenticDecision.reasoning,
        decisionType: 'rule_based',
      },
    });

    // 9. Apply decision
    applyAgenticDecision(state.lastAgenticDecision, state.strategyMonitor, state.healingQueue);

    // 9a. Emit quality_flag SSE and persist when flag_for_review
    if (state.lastAgenticDecision.action === 'flag_for_review') {
      const flaggedChapter = chapterResult.completedChapter;
      const qualityFlag: CourseQualityFlag = {
        chapterPosition: flaggedChapter.position,
        chapterTitle: flaggedChapter.title,
        reason: state.lastAgenticDecision.reasoning,
        severity: 'high',
        action: 'pending_review',
        timestamp: new Date().toISOString(),
      };

      config.onSSEEvent?.({
        type: 'quality_flag',
        data: {
          chapterPosition: qualityFlag.chapterPosition,
          chapterTitle: qualityFlag.chapterTitle,
          reason: qualityFlag.reason,
          severity: qualityFlag.severity,
          action: qualityFlag.action,
        },
      });

      // Fire-and-forget persistence
      persistQualityFlag(config.courseId, qualityFlag).catch(() => {});

      // Escalation gate: pause pipeline for human approval if enabled
      if (state.config.enableEscalationGate) {
        const pauseRequest: PipelinePauseRequest = {
          courseId: config.courseId,
          chapterPosition: qualityFlag.chapterPosition,
          chapterTitle: qualityFlag.chapterTitle,
          reason: qualityFlag.reason,
          severity: 'high' as const,
          qualityScore: chapterResult.qualityScores[0]?.overall ?? 0,
          timestamp: qualityFlag.timestamp,
        };

        config.onSSEEvent?.({
          type: 'pipeline_paused',
          data: {
            code: PipelineErrorCode.PIPELINE_PAUSED,
            ...pauseRequest,
            planId: config.planId,
            message: 'Pipeline paused for human review. Prefer POST /api/sam/course-creation/approve-and-resume for one-call approval+resume, or use /approve then /orchestrate with { resumeCourseId }.',
            approveUrl: '/api/sam/course-creation/approve',
            approveAndResumeUrl: '/api/sam/course-creation/approve-and-resume',
            resumeUrl: '/api/sam/course-creation/orchestrate',
          },
        });

        logger.info('[CourseStateMachine] Pipeline paused for human escalation', {
          courseId: config.courseId, chapter: chapterNumber, planId: config.planId,
        });

        // Save checkpoint before pausing
        await saveCheckpointWithRetry(config.courseId, config.userId, config.planId, {
          conceptTracker: state.conceptTracker,
          bloomsProgression: state.bloomsProgression,
          allSectionTitles: state.allSectionTitles,
          qualityScores: state.qualityScores,
          completedChapterCount: chapterNumber,
          config: state.config,
          goalId: config.goalId,
          planId: config.planId,
          stepIds: state.stepIds,
          courseId: config.courseId,
          completedChaptersList: state.completedChapters,
          percentage: Math.round((chapterNumber / config.totalChapters) * 100),
          status: 'paused',
          lastCompletedStage: 3,
          currentChapterNumber: chapterNumber,
          chapterSectionCounts: state.chapterSectionCounts,
          strategyHistory: state.strategyMonitor.getHistory(),
          strategyState: state.strategyMonitor.exportState(),
          promptVersion: PROMPT_VERSION,
        });

        throw new PipelinePausedError(pauseRequest, config.courseId, config.planId);
      }
    }

    // Store decision in plan (background)
    storeDecisionInPlan(
      config.planId,
      chapterNumber,
      state.lastAgenticDecision as unknown as Record<string, unknown>,
    ).catch(() => { /* non-blocking */ });

    // 10. Handle inject_bridge_content
    if (state.lastAgenticDecision.action === 'inject_bridge_content') {
      try {
        const nextBlueprintEntry = state.blueprintPlan?.chapterPlan.find(e => e.position === chapterNumber + 1);
        const conceptGaps = state.lastAgenticDecision.actionPayload?.conceptGaps ?? [];
        state.bridgeContent = await generateBridgeContent(
          config.userId,
          chapterResult.completedChapter,
          nextBlueprintEntry,
          conceptGaps,
          config.courseContext,
          config.runId,
        );
        config.onSSEEvent?.({
          type: 'bridge_content',
          data: {
            chapter: chapterNumber,
            bridgeLength: state.bridgeContent.length,
            conceptGaps: conceptGaps.length,
          },
        });
      } catch {
        logger.warn('[CourseStateMachine] Bridge content generation failed');
      }
    }

    // 11. Handle replan_remaining (max 2 per course)
    if (state.lastAgenticDecision.action === 'replan_remaining') {
      const MAX_REPLANS_PER_COURSE = 2;
      const currentReplanCount = state.replanCount ?? 0;
      if (currentReplanCount >= MAX_REPLANS_PER_COURSE) {
        logger.info('[CourseStateMachine] Replan blocked — max replans reached', {
          replanCount: currentReplanCount, chapter: chapterNumber,
        });
      } else {
        state.replanCount = currentReplanCount + 1;
        config.onSSEEvent?.({ type: 'replan_start', data: { reason: state.lastAgenticDecision.reasoning } });
        try {
          state.blueprintPlan = await replanRemainingChapters(
            config.userId,
            config.courseContext,
            state.completedChapters,
            state.conceptTracker,
            state.blueprintPlan,
            config.runId,
          );
          config.onSSEEvent?.({
            type: 'replan_complete',
            data: { remainingChapters: state.blueprintPlan?.chapterPlan.length ?? 0 },
          });
        } catch {
          logger.warn('[CourseStateMachine] Re-planning failed, continuing with existing blueprint');
        }
      }
    }

    // 11b. Handle skip_next_chapter
    if (state.lastAgenticDecision.action === 'skip_next_chapter') {
      const remaining = config.totalChapters - chapterNumber;
      if (remaining >= 3 && chapterNumber > 2 && !state.hasSkipped) {
        state.skipNextChapter = true;
        config.onSSEEvent?.({
          type: 'agentic_decision',
          data: { chapter: chapterNumber, action: 'skip_next_chapter', reasoning: state.lastAgenticDecision.reasoning },
        });
      } else {
        logger.info('[CourseStateMachine] Skip blocked by guardrail', {
          chapter: chapterNumber, remaining, hasSkipped: state.hasSkipped,
        });
      }
    }
  } else if (chapterResult.agenticDecision) {
    state.lastAgenticDecision = chapterResult.agenticDecision;
  }
}

// ============================================================================
// Phase 6: Inline Healing (Step 12)
// ============================================================================

/**
 * Deferred inline healing — logs quality issues for post-processing instead of
 * regenerating during the pipeline. The post-processor already runs reflection +
 * healing after the pipeline completes, so inline healing adds redundant AI calls.
 *
 * Step 12: Mark chapters for deferred healing (no AI calls).
 */
export async function phaseInlineHealing(ctx: StepExecutorContext): Promise<void> {
  const { config, state } = ctx;

  if (state.healingQueue.length === 0) return;

  // Drain the queue and log for post-processing instead of regenerating inline
  const chaptersToHeal = state.healingQueue.splice(0, state.healingQueue.length);
  for (const healChapterNum of chaptersToHeal) {
    const healTarget = state.completedChapters.find(ch => ch.position === healChapterNum);
    if (!healTarget) continue;

    logger.info('[CourseStateMachine] Deferring healing to post-processing', {
      chapter: healChapterNum,
      title: healTarget.title,
    });

    config.onSSEEvent?.({
      type: 'healing_deferred',
      data: {
        chapter: healChapterNum,
        title: healTarget.title,
        reason: 'Deferred to post-processing for efficiency',
      },
    });
  }
}

// ============================================================================
// Phase 7: Checkpoint (Steps 13-14)
// ============================================================================

/**
 * Save a checkpoint with the current pipeline state and return
 * the formatted StepResult.
 *
 * Steps 13-14: Checkpoint save and StepResult construction.
 */
export async function phaseCheckpoint(
  ctx: StepExecutorContext,
  chapterResult: ChapterStepResult,
): Promise<StepResult> {
  const { config, state, step, chapterNumber } = ctx;

  // 13. Checkpoint
  await saveCheckpointWithRetry(config.courseId, config.userId, config.planId, {
    conceptTracker: state.conceptTracker,
    bloomsProgression: state.bloomsProgression,
    allSectionTitles: state.allSectionTitles,
    qualityScores: state.qualityScores,
    completedChapterCount: chapterNumber,
    config: state.config,
    goalId: config.goalId,
    planId: config.planId,
    stepIds: state.stepIds,
    courseId: config.courseId,
    completedChaptersList: state.completedChapters,
    percentage: Math.round((chapterNumber / config.totalChapters) * 100),
    status: 'in_progress',
    lastCompletedStage: 3,
    currentChapterNumber: chapterNumber,
    chapterSectionCounts: state.chapterSectionCounts,
    strategyHistory: state.strategyMonitor.getHistory(),
    strategyState: state.strategyMonitor.exportState(),
    promptVersion: PROMPT_VERSION,
  });

  // 14. Return StepResult
  return toStepResult(step, chapterResult);
}

// ============================================================================
// Helpers
// ============================================================================

function toStepResult(step: PlanStep, chapterResult: ChapterStepResult): StepResult {
  return {
    stepId: step.id,
    success: true,
    completedAt: new Date(),
    duration: 0,
    outputs: [
      {
        name: 'completedChapter',
        type: 'result',
        value: {
          position: chapterResult.completedChapter.position,
          title: chapterResult.completedChapter.title,
          id: chapterResult.completedChapter.id,
          sectionsCount: chapterResult.completedChapter.sections.length,
        },
        timestamp: new Date(),
      },
      {
        name: 'qualityScores',
        type: 'metric',
        value: chapterResult.qualityScores.map(s => s.overall),
        timestamp: new Date(),
      },
    ],
    metrics: {
      engagement: 100,
      comprehension: chapterResult.qualityScores[0]?.overall ?? 70,
      timeEfficiency: 80,
    },
  };
}
