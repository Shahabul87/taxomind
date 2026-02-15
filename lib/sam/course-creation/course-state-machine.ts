/**
 * CourseCreationStateMachine — AgentStateMachine wrapper for course creation
 *
 * Wraps the @sam-ai/agentic AgentStateMachine to drive course creation
 * as a series of step executions (one per chapter). Provides:
 *
 * - Full agentic loop body per step (generate → decide → bridge → heal)
 * - SSE event mapping (state machine events → course creation SSE events)
 * - Auto-checkpoint via AgentStateMachine's built-in persistence
 * - Pause/resume/abort lifecycle management
 * - AI-driven between-chapter decisions with rule-based guardrails
 *
 * This is the "agentic orchestration" layer that sits above the
 * per-chapter generation logic and below the API route handler.
 */

import {
  AgentStateMachine,
  type AgentStateMachineConfig,
  type StateMachineListener,
  type ExecutionPlan,
  type PlanStep,
  type PlanState,
  type StepResult,
  type ExecutionContext,
} from '@sam-ai/agentic';
import { getGoalStores } from '@/lib/sam/taxomind-context';
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
import { evaluateChapterOutcomeWithAI, applyAgenticDecision, generateBridgeContent } from './agentic-decisions';
import { replanRemainingChapters } from './course-planner';
import { regenerateChapter, regenerateSectionsOnly, regenerateDetailsOnly } from './chapter-regenerator';
import { diagnoseChapterIssues } from './healing-loop';
import { saveCheckpointWithRetry } from './checkpoint-manager';
import { withTimeout, OperationTimeoutError } from '@/lib/sam/utils/timeout';
import type {
  ChapterStepContext,
  ChapterStepResult,
  CourseContext,
  CompletedChapter,
  GeneratedChapter,
  QualityScore,
  ConceptTracker,
  CourseBlueprintPlan,
  AgenticDecision,
  BloomsLevel,
  SequentialCreationConfig,
} from './types';
import type { RecalledMemory } from './memory-recall';
import type { AdaptiveStrategyMonitor } from './adaptive-strategy';
import type { ChapterTemplate } from './chapter-templates';
import type { ComposedCategoryPrompt } from './category-prompts';

// ============================================================================
// Types
// ============================================================================

export interface CourseStateMachineConfig {
  userId: string;
  courseId: string;
  goalId: string;
  planId: string;
  totalChapters: number;
  courseContext: CourseContext;
  onSSEEvent?: (event: { type: string; data: Record<string, unknown> }) => void;
  enableStreamingThinking?: boolean;
  /** Shared mutable state between orchestrator and state machine */
  sharedState: SharedPipelineState;
  /** Offset for resume: number of already-completed chapters to skip. Default: 0 */
  startChapterOffset?: number;
}

/** Mutable pipeline state shared by reference between orchestrator and state machine */
export interface SharedPipelineState {
  completedChapters: CompletedChapter[];
  generatedChapters: (GeneratedChapter & { id: string })[];
  qualityScores: QualityScore[];
  allSectionTitles: string[];
  conceptTracker: ConceptTracker;
  bloomsProgression: Array<{ chapter: number; level: BloomsLevel; topics: string[] }>;
  blueprintPlan: CourseBlueprintPlan | null;
  lastAgenticDecision: AgenticDecision | null;
  recalledMemory: RecalledMemory | null;
  strategyMonitor: AdaptiveStrategyMonitor;
  healingQueue: number[];
  bridgeContent: string;
  stepIds: string[];
  chapterTemplate: ChapterTemplate;
  categoryPrompt: ComposedCategoryPrompt;
  experimentVariant?: string;
  config: SequentialCreationConfig;
  /** Whether a chapter has been skipped (max 1 per course) */
  hasSkipped?: boolean;
  /** Flag: skip the next chapter (set by skip_next_chapter decision) */
  skipNextChapter?: boolean;
  /** Counter: number of re-plans executed (max 2 per course) */
  replanCount?: number;
  /** Per-chapter section counts for accurate resume completedItems calculation */
  chapterSectionCounts: number[];
}

// ============================================================================
// Public Class
// ============================================================================

export class CourseCreationStateMachine {
  private machine: AgentStateMachine;
  private config: CourseStateMachineConfig;

  constructor(config: CourseStateMachineConfig) {
    const { plan: planStore } = getGoalStores();

    const machineConfig: AgentStateMachineConfig = {
      planStore,
      autoSaveInterval: 15000,
      maxStepRetries: 2,
    };

    this.machine = new AgentStateMachine(machineConfig);
    this.config = config;
    this.setupListeners();
  }

  // ==========================================================================
  // Lifecycle
  // ==========================================================================

  /**
   * Build an execution plan and start the state machine.
   *
   * Creates one PlanStep per chapter, then starts execution.
   * The step executor runs the full agentic loop body per chapter.
   */
  async start(
    chapterTitles: string[],
    buildContext: (chapterNumber: number) => ChapterStepContext,
  ): Promise<void> {
    const plan = this.buildExecutionPlan(chapterTitles);
    const state = this.config.sharedState;

    // Set the step executor: full agentic loop for each chapter
    const chapterOffset = this.config.startChapterOffset ?? 0;
    this.machine.setStepExecutor(async (_step: PlanStep, _context: ExecutionContext) => {
      const chapterNumber = _step.order + 1 + chapterOffset;

      // 0. Check if this chapter should be skipped (from previous chapter's decision)
      if (state.skipNextChapter) {
        state.skipNextChapter = false;
        state.hasSkipped = true;
        this.config.onSSEEvent?.({
          type: 'chapter_skipped',
          data: { chapter: chapterNumber, reason: 'AI determined content would be redundant' },
        });
        logger.info('[CourseStateMachine] Skipping chapter (AI decision)', { chapter: chapterNumber });
        return { success: true, output: { skipped: true } } as StepResult;
      }

      // 1. Create SubGoal
      const chapterSubGoalId = await initializeChapterSubGoal(
        this.config.goalId,
        chapterNumber,
        _step.title,
        this.config.totalChapters,
        this.config.courseContext.difficulty === 'expert' ? 'hard' : this.config.courseContext.difficulty === 'beginner' ? 'easy' : 'medium',
      );

      // 2. Build context with bridge content
      const chapterContext = buildContext(chapterNumber);
      if (state.bridgeContent) {
        chapterContext.bridgeContent = state.bridgeContent;
      }

      // 3. Generate chapter (all 3 stages) with per-chapter timeout
      const PER_CHAPTER_TIMEOUT_MS = 300_000; // 5 minutes
      let chapterResult: ChapterStepResult;
      try {
        chapterResult = await withTimeout(
          () => generateSingleChapter(
            this.config.userId,
            chapterContext,
            {
              onSSEEvent: this.config.onSSEEvent,
              enableStreamingThinking: this.config.enableStreamingThinking,
            },
          ),
          PER_CHAPTER_TIMEOUT_MS,
          `chapter-${chapterNumber}-generation`,
        );
      } catch (timeoutErr) {
        if (timeoutErr instanceof OperationTimeoutError) {
          logger.warn('[CourseStateMachine] Chapter generation timed out', {
            chapter: chapterNumber, timeoutMs: PER_CHAPTER_TIMEOUT_MS,
          });
          this.config.onSSEEvent?.({
            type: 'chapter_skipped',
            data: { chapter: chapterNumber, reason: `Generation timed out after ${PER_CHAPTER_TIMEOUT_MS / 1000}s` },
          });
          return {
            stepId: _step.id,
            success: false,
            completedAt: new Date(),
            duration: PER_CHAPTER_TIMEOUT_MS,
            outputs: [],
            error: `Chapter ${chapterNumber} generation timed out`,
          } as StepResult;
        }
        throw timeoutErr;
      }

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

      // 6. Persist memory (background)
      persistConceptsBackground(
        this.config.userId, this.config.courseId,
        state.conceptTracker, chapterNumber,
        this.config.courseContext.courseTitle,
        this.config.courseContext.courseCategory,
      );
      persistQualityScoresBackground(
        this.config.userId, this.config.courseId,
        state.qualityScores.slice(), chapterNumber,
      );

      // 7. Between-chapter memory recall
      if (chapterNumber < this.config.totalChapters) {
        try {
          const relatedConcepts = await recallChapterContext(
            this.config.userId,
            this.config.courseId,
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

      // 8. AI-driven agentic decision
      if (chapterResult.agenticDecision && chapterNumber < this.config.totalChapters && state.blueprintPlan) {
        try {
          state.lastAgenticDecision = await evaluateChapterOutcomeWithAI(
            this.config.userId,
            chapterResult.completedChapter,
            state.completedChapters,
            state.qualityScores,
            state.blueprintPlan,
            state.conceptTracker,
            this.config.courseContext,
          );

          this.config.onSSEEvent?.({
            type: 'agentic_decision',
            data: {
              chapter: chapterNumber,
              action: state.lastAgenticDecision.action,
              reasoning: state.lastAgenticDecision.reasoning,
              decisionType: 'ai_decision',
            },
          });
        } catch {
          state.lastAgenticDecision = chapterResult.agenticDecision;
        }

        // 9. Apply decision
        applyAgenticDecision(state.lastAgenticDecision, state.strategyMonitor, state.healingQueue);

        // Store decision in plan (background)
        storeDecisionInPlan(
          this.config.planId,
          chapterNumber,
          state.lastAgenticDecision as unknown as Record<string, unknown>,
        ).catch(() => { /* non-blocking */ });

        // 10. Handle inject_bridge_content
        if (state.lastAgenticDecision.action === 'inject_bridge_content') {
          try {
            const nextBlueprintEntry = state.blueprintPlan?.chapterPlan.find(e => e.position === chapterNumber + 1);
            const conceptGaps = state.lastAgenticDecision.actionPayload?.conceptGaps ?? [];
            state.bridgeContent = await generateBridgeContent(
              this.config.userId,
              chapterResult.completedChapter,
              nextBlueprintEntry,
              conceptGaps,
              this.config.courseContext,
            );
            this.config.onSSEEvent?.({
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
            this.config.onSSEEvent?.({ type: 'replan_start', data: { reason: state.lastAgenticDecision.reasoning } });
            try {
              state.blueprintPlan = await replanRemainingChapters(
                this.config.userId,
                this.config.courseContext,
                state.completedChapters,
                state.conceptTracker,
                state.blueprintPlan,
              );
              this.config.onSSEEvent?.({
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
          const remaining = this.config.totalChapters - chapterNumber;
          if (remaining >= 3 && chapterNumber > 2 && !state.hasSkipped) {
            state.skipNextChapter = true;
            this.config.onSSEEvent?.({
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

      // 12. Inline healing — process up to 2 chapters from healing queue per step
      if (state.healingQueue.length > 0) {
        const MAX_INLINE_HEALS_PER_STEP = 2;
        const chaptersToHeal = state.healingQueue.splice(0, MAX_INLINE_HEALS_PER_STEP);
        for (const healChapterNum of chaptersToHeal) {
          const healTarget = state.completedChapters.find(ch => ch.position === healChapterNum);
          if (!healTarget) continue;

          this.config.onSSEEvent?.({ type: 'inline_healing', data: { chapter: healChapterNum } });
          try {
            // AI diagnosis before regeneration
            const strategy = await diagnoseChapterIssues(
              this.config.userId,
              healTarget,
              'Flagged by agentic decision for inline healing',
              'medium',
              this.config.courseContext,
            );

            this.config.onSSEEvent?.({
              type: 'healing_diagnosis',
              data: { position: healChapterNum, strategy: strategy.type, reasoning: strategy.reasoning },
            });

            if (strategy.type === 'skip_healing') {
              logger.info('[CourseStateMachine] AI recommends skipping inline healing', { chapter: healChapterNum });
              continue;
            }

            const regenOptions = {
              userId: this.config.userId,
              courseId: this.config.courseId,
              chapterId: healTarget.id,
              chapterPosition: healChapterNum,
              onSSEEvent: this.config.onSSEEvent,
            };

            let healResult;
            switch (strategy.type) {
              case 'sections_only':
                healResult = await regenerateSectionsOnly(regenOptions);
                break;
              case 'details_only':
                healResult = await regenerateDetailsOnly(regenOptions);
                break;
              case 'targeted_sections':
                healResult = await regenerateSectionsOnly(regenOptions);
                break;
              case 'full_regeneration':
              default:
                healResult = await regenerateChapter(regenOptions);
                break;
            }

            this.config.onSSEEvent?.({
              type: 'inline_healing_complete',
              data: {
                chapter: healChapterNum,
                success: healResult.success,
                qualityScore: healResult.qualityScore,
                strategy: strategy.type,
              },
            });
          } catch {
            logger.warn('[CourseStateMachine] Inline healing failed', { chapter: healChapterNum });
          }
        }
      }

      // 13. Checkpoint
      await saveCheckpointWithRetry(this.config.courseId, this.config.userId, this.config.planId, {
        conceptTracker: state.conceptTracker,
        bloomsProgression: state.bloomsProgression,
        allSectionTitles: state.allSectionTitles,
        qualityScores: state.qualityScores,
        completedChapterCount: chapterNumber,
        config: state.config,
        goalId: this.config.goalId,
        planId: this.config.planId,
        stepIds: state.stepIds,
        courseId: this.config.courseId,
        completedChaptersList: state.completedChapters,
        percentage: Math.round((chapterNumber / this.config.totalChapters) * 100),
        status: 'in_progress',
        lastCompletedStage: 3,
        currentChapterNumber: chapterNumber,
        chapterSectionCounts: state.chapterSectionCounts,
      });

      // 14. Return StepResult
      return this.toStepResult(_step, chapterResult);
    });

    await this.machine.start(plan);
  }

  /** Pause execution, returning serializable state for later resume. */
  async pause(reason?: string): Promise<PlanState> {
    return this.machine.pause(reason);
  }

  /** Resume from a previously saved state. */
  async resume(savedState?: PlanState): Promise<void> {
    await this.machine.resume(savedState);
  }

  /** Abort execution with a reason. */
  async abort(reason: string): Promise<void> {
    await this.machine.abort(reason);
  }

  /** Get current machine state for status queries. */
  getState(): string {
    return this.machine.getState();
  }

  /** Get plan state for persistence. */
  getPlanState(): PlanState | null {
    return this.machine.getPlanState();
  }

  // ==========================================================================
  // Internal Setup
  // ==========================================================================

  private setupListeners(): void {
    const offset = this.config.startChapterOffset ?? 0;
    const listener: StateMachineListener = {
      onStateChange: (from, to) => {
        this.config.onSSEEvent?.({
          type: 'state_change',
          data: { from, to },
        });
        logger.info('[CourseStateMachine] State change', { from, to });
      },

      onStepStart: (step) => {
        const chapterNumber = step.order + 1 + offset;
        this.config.onSSEEvent?.({
          type: 'item_generating',
          data: {
            stage: 1,
            chapter: chapterNumber,
            message: `Generating ${step.title}...`,
          },
        });
      },

      onStepComplete: (step, result) => {
        const chapterNumber = step.order + 1 + offset;
        this.config.onSSEEvent?.({
          type: 'item_complete',
          data: {
            stage: 1,
            chapter: chapterNumber,
            title: step.title,
            success: result.success,
          },
        });
      },

      onStepFailed: (step, error) => {
        const chapterNumber = step.order + 1 + offset;
        logger.error('[CourseStateMachine] Step failed', {
          chapter: chapterNumber,
          error: error.message,
        });
        this.config.onSSEEvent?.({
          type: 'error',
          data: {
            message: `Chapter ${chapterNumber} generation failed: ${error.message}`,
            chapter: chapterNumber,
          },
        });
      },

      onPlanComplete: () => {
        this.config.onSSEEvent?.({
          type: 'complete',
          data: {
            courseId: this.config.courseId,
            message: 'All chapters generated via state machine',
          },
        });
        logger.info('[CourseStateMachine] Plan complete', {
          courseId: this.config.courseId,
        });
      },

      onPlanFailed: (_plan, error) => {
        this.config.onSSEEvent?.({
          type: 'error',
          data: {
            message: `Course creation failed: ${error.message}`,
            courseId: this.config.courseId,
          },
        });
        logger.error('[CourseStateMachine] Plan failed', {
          courseId: this.config.courseId,
          error: error.message,
        });
      },

      onCheckpoint: (state) => {
        logger.debug('[CourseStateMachine] Checkpoint saved', {
          planId: state.planId,
          completedSteps: state.completedSteps.length,
        });
      },
    };

    this.machine.addListener(listener);
  }

  // ==========================================================================
  // Plan Building
  // ==========================================================================

  private buildExecutionPlan(chapterTitles: string[]): ExecutionPlan {
    const offset = this.config.startChapterOffset ?? 0;
    const steps: PlanStep[] = chapterTitles.map((title, index) => ({
      id: `chapter-${index + 1 + offset}`,
      planId: '', // Filled by state machine on start
      type: 'content' as const,
      title: title || `Chapter ${index + 1 + offset}`,
      description: `Generate chapter ${index + 1 + offset} with all sections and details`,
      order: index,
      status: 'pending' as const,
      estimatedMinutes: 3,
      retryCount: 0,
      maxRetries: 2,
      metadata: { chapterNumber: index + 1 + offset },
    }));

    return {
      id: '', // Filled by state machine
      goalId: this.config.goalId,
      userId: this.config.userId,
      steps,
      checkpoints: [],
      fallbackStrategies: [
        {
          trigger: { type: 'step_failed', threshold: 2 },
          action: { type: 'retry' },
          priority: 1,
        },
        {
          trigger: { type: 'step_failed', threshold: 3 },
          action: { type: 'skip', parameters: { reason: 'Max retries exhausted' } },
          priority: 2,
        },
      ],
      overallProgress: 0,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // ==========================================================================
  // Result Mapping
  // ==========================================================================

  private toStepResult(step: PlanStep, chapterResult: ChapterStepResult): StepResult {
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
}
