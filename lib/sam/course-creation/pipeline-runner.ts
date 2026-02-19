/**
 * Pipeline Runner — Extracted from orchestrator.ts
 *
 * Delegates chapter generation to CourseCreationStateMachine (agentic path).
 * The legacy for-loop path was removed in prompt version 2.1.0 because it
 * lacked quality gates (self-critique, chapter critic, inline healing) that
 * the agentic state machine provides.
 */

import 'server-only';

import { logger } from '@/lib/logger';
import type { RecalledMemory } from './memory-recall';
import { AdaptiveStrategyMonitor } from './adaptive-strategy';
import type { PipelineBudgetTracker } from './pipeline-budget';
import type { FallbackTracker } from './response-parsers';
import type { ChapterTemplate } from './chapter-templates';
import type { ComposedCategoryPrompt } from './category-prompts';
import type {
  SequentialCreationConfig,
  CourseContext,
  GeneratedChapter,
  CompletedChapter,
  BloomsLevel,
  QualityScore,
  ConceptTracker,
  CourseBlueprintPlan,
  AgenticDecision,
  CreationProgress,
  ResumeState,
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
  /**
   * @deprecated Always true. The legacy for-loop path has been removed.
   * Kept temporarily for API compatibility — callers may still pass it.
   */
  useAgenticStateMachine?: boolean;
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
  resumeState?: ResumeState;
}

export interface PipelineRunnerResult {
  chaptersCreated: number;
  sectionsCreated: number;
  allSections: Map<string, (GeneratedSection & { id: string })[]>;
}

/**
 * Run the course generation pipeline via the agentic state machine.
 */
export async function runPipeline(
  options: PipelineRunnerOptions,
): Promise<PipelineRunnerResult> {
  const {
    userId, courseId, goalId, planId, config, courseContext,
    onSSEEvent, enableStreamingThinking, runId, abortSignal,
    completedChapters, generatedChapters, qualityScores,
    allSectionTitles, conceptTracker, bloomsProgression,
    blueprintPlan: initialBlueprintPlan, recalledMemory, strategyMonitor,
    chapterTemplate, categoryPrompt, categoryEnhancer, experimentVariant,
    chapterSectionCounts, budgetTracker, fallbackTracker, stepIds,
    startChapter, totalChapters, resumeState,
  } = options;

  let chaptersCreated = completedChapters.length;
  let sectionsCreated = completedChapters.reduce((sum, ch) => sum + ch.sections.length, 0);
  const blueprintPlan = initialBlueprintPlan;
  const lastAgenticDecision = options.lastAgenticDecision;
  const allSections: Map<string, (GeneratedSection & { id: string })[]> = new Map();

  // Persistent healing queue
  const healingQueue: number[] = [];
  const bridgeContent = '';

  // ── Agentic State Machine Path (sole execution path) ──
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
    abortSignal,
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

  try {
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
      ...(resumeState && chNum === resumeState.completedChapterCount + 1
        ? {
            partialChapterDbId: resumeState.partialChapterDbId,
            partialChapterSectionIds: resumeState.partialChapterSectionIds,
            sectionsWithDetails: resumeState.sectionsWithDetails,
          }
        : {}),
    }));
  } catch (error) {
    const isAbort = abortSignal?.aborted || (error instanceof Error && error.name === 'AbortError');
    if (!isAbort) throw error;
    logger.info('[PIPELINE] Aborted during state machine execution', {
      courseId,
      chaptersCreated: completedChapters.length,
    });
  }

  chaptersCreated = completedChapters.length;
  sectionsCreated = completedChapters.reduce((sum, ch) => sum + ch.sections.length, 0);

  return { chaptersCreated, sectionsCreated, allSections };
}
