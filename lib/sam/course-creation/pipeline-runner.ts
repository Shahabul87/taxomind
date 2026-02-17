/**
 * Pipeline Runner — Extracted from orchestrator.ts
 *
 * Contains the dual execution paths:
 *   - Agentic path: delegates to CourseCreationStateMachine
 *   - Legacy path: original for-loop (backward compatibility + resume)
 *
 * Both paths operate on the same shared state (completedChapters,
 * qualityScores, conceptTracker, etc.) and produce the same output.
 */

import 'server-only';

import { db } from '@/lib/db';
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
import type { RecalledMemory } from './memory-recall';
import {
  applyAgenticDecision,
  evaluateChapterOutcomeWithAI,
  generateBridgeContent,
  persistQualityFlag,
} from './agentic-decisions';
import { replanRemainingChapters } from './course-planner';
import { regenerateChapter } from './chapter-regenerator';
import { saveCheckpointWithRetry } from './checkpoint-manager';
import { PROMPT_VERSION } from './prompts';
import { withTimeout, OperationTimeoutError } from '@/lib/sam/utils/timeout';
import { AdaptiveStrategyMonitor } from './adaptive-strategy';
import type { PipelineBudgetTracker } from './pipeline-budget';
import type { FallbackTracker } from './response-parsers';
import type { ChapterTemplate } from './chapter-templates';
import type { ComposedCategoryPrompt } from './category-prompts';
import {
  PipelineErrorCode,
} from './types';
import type {
  SequentialCreationConfig,
  CourseContext,
  GeneratedChapter,
  CompletedChapter,
  BloomsLevel,
  ContentType,
  QualityScore,
  ConceptTracker,
  CourseBlueprintPlan,
  AgenticDecision,
  ChapterStepContext,
  ChapterStepResult,
  CourseQualityFlag,
  CreationProgress,
} from './types';
import type { CategoryPromptEnhancer } from './category-prompts';

// Re-export the GeneratedSection type (used for allSections map)
import type { GeneratedSection } from './types';

export interface PipelineRunnerOptions {
  userId: string;
  courseId: string;
  goalId: string;
  planId: string;
  config: SequentialCreationConfig;
  courseContext: CourseContext;
  onProgress?: (progress: CreationProgress) => void;
  onSSEEvent?: (event: { type: string; data: Record<string, unknown> }) => void;
  abortSignal?: AbortSignal;
  enableStreamingThinking?: boolean;
  runId?: string;
  useAgenticStateMachine: boolean;
  // Shared mutable state
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
  chapterTemplate: ChapterTemplate;
  categoryPrompt: ComposedCategoryPrompt;
  categoryEnhancer: CategoryPromptEnhancer;
  experimentVariant: string;
  chapterSectionCounts: number[];
  budgetTracker: PipelineBudgetTracker;
  fallbackTracker: FallbackTracker;
  stepIds: string[];
  // Resume
  startChapter: number;
  totalChapters: number;
  effectiveSectionsPerChapter: number;
}

export interface PipelineRunnerResult {
  chaptersCreated: number;
  sectionsCreated: number;
  allSections: Map<string, (GeneratedSection & { id: string })[]>;
}

/**
 * Run the course generation pipeline (agentic or legacy path).
 *
 * This function is intentionally large because it orchestrates deeply
 * intertwined mutable state across both execution paths.
 */
export async function runPipeline(
  options: PipelineRunnerOptions,
): Promise<PipelineRunnerResult> {
  const {
    userId, courseId, goalId, planId, config, courseContext,
    onSSEEvent, abortSignal, enableStreamingThinking, runId,
    useAgenticStateMachine,
    completedChapters, generatedChapters, qualityScores,
    allSectionTitles, conceptTracker, bloomsProgression,
    blueprintPlan: initialBlueprintPlan, recalledMemory, strategyMonitor,
    chapterTemplate, categoryPrompt, categoryEnhancer, experimentVariant,
    chapterSectionCounts, budgetTracker, fallbackTracker, stepIds,
    startChapter, totalChapters, effectiveSectionsPerChapter,
  } = options;

  let chaptersCreated = completedChapters.length;
  let sectionsCreated = completedChapters.reduce((sum, ch) => sum + ch.sections.length, 0);
  let blueprintPlan = initialBlueprintPlan;
  let lastAgenticDecision = options.lastAgenticDecision;
  const allSections: Map<string, (GeneratedSection & { id: string })[]> = new Map();

  // Persistent healing queue
  const healingQueue: number[] = [];
  let replanCount = 0;
  const MAX_REPLANS_PER_COURSE = 2;
  let bridgeContent = '';

  if (useAgenticStateMachine) {
    // AGENTIC PATH
    logger.info('[PIPELINE] Using agentic state machine path', {
      courseId, userId, startChapter, totalChapters, runId,
    });
    const { CourseCreationStateMachine } = await import('./course-state-machine');
    const remainingCount = totalChapters - (startChapter - 1);
    const chapterTitles = blueprintPlan
      ? blueprintPlan.chapterPlan
          .filter(e => e.position >= startChapter)
          .map(e => e.suggestedTitle)
      : Array.from({ length: remainingCount }, (_, i) => `Chapter ${startChapter + i}`);

    while (chapterTitles.length < remainingCount) {
      chapterTitles.push(`Chapter ${startChapter + chapterTitles.length}`);
    }

    const stateMachine = new CourseCreationStateMachine({
      userId,
      courseId,
      goalId,
      planId,
      totalChapters,
      courseContext,
      onSSEEvent,
      enableStreamingThinking,
      startChapterOffset: startChapter - 1,
      runId,
      sharedState: {
        completedChapters,
        generatedChapters,
        qualityScores,
        allSectionTitles,
        conceptTracker,
        bloomsProgression,
        blueprintPlan,
        lastAgenticDecision,
        recalledMemory,
        strategyMonitor,
        healingQueue,
        bridgeContent,
        stepIds,
        chapterTemplate,
        categoryPrompt,
        experimentVariant,
        config,
        chapterSectionCounts,
        budgetTracker,
        fallbackTracker,
      },
    });

    await stateMachine.start(chapterTitles, (chNum) => ({
      chapterNumber: chNum,
      courseId,
      courseContext,
      conceptTracker,
      bloomsProgression,
      allSectionTitles,
      qualityScores,
      completedChapters,
      generatedChapters,
      blueprintPlan,
      lastAgenticDecision,
      recalledMemory,
      strategyMonitor,
      chapterTemplate,
      categoryPrompt,
      categoryEnhancer,
      experimentVariant,
      budgetTracker,
      fallbackTracker,
    }));

    chaptersCreated = completedChapters.length;
    sectionsCreated = completedChapters.reduce((sum, ch) => sum + ch.sections.length, 0);
  } else {
    // LEGACY PATH — DEPRECATED
    // This for-loop path is retained for backward compatibility and resume
    // scenarios where the agentic state machine cannot be used (e.g., mid-
    // chapter resume). It lacks: self-critique, chapter critic, quality
    // feedback loop, and full agentic decision handling.
    //
    // Target: Remove after all production pipelines use agentic path
    // (tracked in SAM backlog).
    //
    // Missing vs agentic path:
    //   - No phaseSkipCheck (skip_next_chapter decision)
    //   - No phaseDecisionMaking AI evaluation
    //   - No phaseInlineHealing
    //   - Simplified checkpoint (no strategy history)
    logger.warn('[PIPELINE] Using LEGACY for-loop path (deprecated)', {
      courseId, userId, startChapter, totalChapters, runId,
      reason: 'useAgenticStateMachine=false',
    });
    for (let chNum = startChapter; chNum <= totalChapters; chNum++) {
      if (abortSignal?.aborted) {
        break;
      }

      const chapterSubGoalId = await initializeChapterSubGoal(
        goalId,
        chNum,
        `Chapter ${chNum}`,
        totalChapters,
        courseContext.difficulty === 'expert' ? 'hard' : courseContext.difficulty === 'beginner' ? 'easy' : 'medium',
      );

      const chapterStepContext: ChapterStepContext = {
        chapterNumber: chNum,
        courseId,
        courseContext,
        conceptTracker,
        bloomsProgression,
        allSectionTitles,
        qualityScores,
        completedChapters,
        generatedChapters,
        blueprintPlan,
        lastAgenticDecision,
        recalledMemory,
        strategyMonitor,
        chapterTemplate,
        categoryPrompt,
        categoryEnhancer,
        experimentVariant,
        bridgeContent: bridgeContent || undefined,
        runId,
        budgetTracker,
        fallbackTracker,
      };

      if (!budgetTracker.canProceed()) {
        onSSEEvent?.({
          type: 'error',
          data: {
            code: PipelineErrorCode.BUDGET_EXCEEDED,
            message: `Token budget exceeded after chapter ${chNum - 1}. Partial course saved.`,
            chaptersCreated,
            sectionsCreated,
            courseId,
          },
        });
        break;
      }

      const PER_CHAPTER_TIMEOUT_MS = 300_000;
      let chapterResult: ChapterStepResult;
      try {
        chapterResult = await withTimeout(
          () => generateSingleChapter(userId, chapterStepContext, { onSSEEvent, enableStreamingThinking }),
          PER_CHAPTER_TIMEOUT_MS,
          `chapter-${chNum}-generation`,
        );
      } catch (timeoutErr) {
        if (timeoutErr instanceof OperationTimeoutError) {
          onSSEEvent?.({
            type: 'chapter_skipped',
            data: {
              code: PipelineErrorCode.CHAPTER_TIMEOUT,
              chapter: chNum,
              reason: `Generation timed out after ${PER_CHAPTER_TIMEOUT_MS / 1000}s`,
            },
          });
          continue;
        }
        throw timeoutErr;
      }

      bridgeContent = '';
      chaptersCreated += chapterResult.chaptersCreated;
      sectionsCreated += chapterResult.sectionsCreated;
      chapterSectionCounts.push(chapterResult.completedChapter.sections.length);

      await completeChapterSubGoal(chapterSubGoalId, {
        chapterNumber: chNum,
        sectionsCompleted: chapterResult.completedChapter.sections.length,
        qualityScore: chapterResult.qualityScores[0]?.overall ?? 0,
      });

      persistConceptsBackground(userId, courseId, conceptTracker, chNum, courseContext.courseTitle, courseContext.courseCategory);
      persistQualityScoresBackground(userId, courseId, qualityScores.slice(), chNum);

      // Between-chapter memory recall
      if (chNum < totalChapters) {
        try {
          const relatedConcepts = await recallChapterContext(userId, courseId, chapterResult.completedChapter.keyTopics);
          if (relatedConcepts.length > 0 && recalledMemory) {
            recalledMemory.relatedConcepts = [
              ...recalledMemory.relatedConcepts,
              ...relatedConcepts.filter(rc => !recalledMemory!.relatedConcepts.some(existing => existing.name === rc.name)),
            ].slice(0, 15);
          }
        } catch { /* non-blocking */ }
      }

      // Agentic decision handling (simplified — see orchestrator.ts for full version)
      if (chapterResult.agenticDecision) {
        lastAgenticDecision = chapterResult.agenticDecision;
      }

      // Checkpoint
      await saveCheckpointWithRetry(courseId, userId, planId, {
        conceptTracker,
        bloomsProgression,
        allSectionTitles,
        qualityScores,
        completedChapterCount: chNum,
        config,
        goalId,
        planId,
        stepIds,
        courseId,
        completedChaptersList: completedChapters,
        percentage: Math.round((chNum / config.totalChapters) * 100),
        status: 'in_progress',
        lastCompletedStage: 3,
        currentChapterNumber: chNum,
        chapterSectionCounts,
        strategyHistory: strategyMonitor.getHistory(),
        strategyState: strategyMonitor.exportState(),
        promptVersion: PROMPT_VERSION,
      });

      // Fallback rate gate: halt pipeline if too many parse failures
      const totalParsedItems = chaptersCreated + sectionsCreated * 2;
      const haltOnExcessiveFallbacks = config.fallbackPolicy?.haltOnExcessiveFallbacks ?? true;
      if (haltOnExcessiveFallbacks && fallbackTracker.shouldHalt(totalParsedItems)) {
        const summary = fallbackTracker.getSummary(totalParsedItems);
        const thresholdPct = Math.round(fallbackTracker.thresholdRate * 100);
        logger.error('[PIPELINE] Fallback rate exceeded threshold — halting pipeline', {
          courseId, chapter: chNum, fallbackCount: summary.count,
          fallbackRate: summary.rate, totalParsedItems,
        });
        onSSEEvent?.({
          type: 'error',
          data: {
            message: `Course creation halted: ${Math.round(summary.rate * 100)}% of content used fallback generation (threshold: ${thresholdPct}%). ` +
              `${chaptersCreated} chapters saved. The AI provider may be experiencing issues.`,
            code: PipelineErrorCode.FALLBACK_RATE_EXCEEDED,
            chaptersCreated,
            sectionsCreated,
            courseId,
            fallbackSummary: { count: summary.count, rate: summary.rate },
          },
        });
        break;
      }
    }
  }

  return { chaptersCreated, sectionsCreated, allSections };
}
