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
 *
 * The step executor delegates to composed phase functions in
 * `step-executor-phases.ts` for clarity and testability.
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
import {
  phaseSkipCheck,
  phaseLifecycleSetup,
  phaseGenerate,
  phaseLifecycleComplete,
  phaseMemory,
  phaseDecisionMaking,
  phaseInlineHealing,
  phaseCheckpoint,
} from './step-executor-phases';
import type { StepExecutorContext } from './step-executor-phases';
import type {
  ChapterStepContext,
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
import type { PipelineBudgetTracker } from './pipeline-budget';

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
  /** Correlation ID for end-to-end tracing */
  runId?: string;
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
  /** Optional runtime cost budget tracker */
  budgetTracker?: PipelineBudgetTracker;
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
   * The step executor delegates to composed phase functions for each chapter.
   */
  async start(
    chapterTitles: string[],
    buildContext: (chapterNumber: number) => ChapterStepContext,
  ): Promise<void> {
    const plan = this.buildExecutionPlan(chapterTitles);
    const state = this.config.sharedState;

    // Set the step executor: composed phase functions for each chapter
    const chapterOffset = this.config.startChapterOffset ?? 0;
    this.machine.setStepExecutor(async (_step: PlanStep, _context: ExecutionContext) => {
      const chapterNumber = _step.order + 1 + chapterOffset;

      const ctx: StepExecutorContext = {
        config: this.config,
        state,
        step: _step,
        chapterNumber,
        buildContext,
      };

      // Phase 0: Skip check
      const skipResult = phaseSkipCheck(ctx);
      if (skipResult) return skipResult;

      // Phase 1: Lifecycle setup (SubGoal init, context build)
      const { chapterSubGoalId, chapterContext } = await phaseLifecycleSetup(ctx);

      // Phase 2: Generate chapter (all 3 stages) with timeout
      const generateResult = await phaseGenerate(ctx, chapterContext);
      if ('earlyReturn' in generateResult) return generateResult.earlyReturn;
      const { chapterResult } = generateResult;

      // Phase 3: Lifecycle complete (clear bridge, complete SubGoal)
      await phaseLifecycleComplete(ctx, chapterSubGoalId, chapterResult);

      // Phase 4: Memory (persist concepts, between-chapter recall)
      await phaseMemory(ctx, chapterResult);

      // Phase 5: Decision making (evaluate, apply, quality flag, bridge, replan, skip)
      await phaseDecisionMaking(ctx, chapterResult);

      // Phase 6: Inline healing (process up to 2 chapters from healing queue)
      await phaseInlineHealing(ctx);

      // Phase 7: Checkpoint and return StepResult
      return phaseCheckpoint(ctx, chapterResult);
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
        // NOTE: Do NOT emit 'complete' here — the orchestrator emits the
        // authoritative 'complete' event after post-generation work
        // (reflection, healing, enrichment, checkpointing) finishes.
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
}
