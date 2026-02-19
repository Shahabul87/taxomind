/**
 * SAM Sequential Course Creation Orchestrator
 *
 * Thin coordinator that delegates to extracted modules:
 *   - course-initializer.ts  -- Course record + goal creation
 *   - pipeline-runner.ts     -- Dual execution paths (agentic / legacy)
 *   - post-processor.ts      -- Reflection + healing loop
 *   - completion-handler.ts  -- Stage events, experiments, final SSE
 *
 * This file handles:
 *   1. Setup: experiment resolution, context building, category enhancers,
 *      memory recall, blueprint planning, budget tracking, progress callbacks
 *   2. Resume detection: reuse existing course/goal vs create new
 *   3. Delegation: pipeline -> post-processing -> completion
 *   4. Error handling: fail course creation, emit error SSE
 */

import { logger } from '@/lib/logger';
import {
  getTemplateForDifficulty,
  getMinimumSectionsForDifficulty,
} from './chapter-templates';
import {
  getActiveExperiments,
  joinVariants,
} from './experiments';
import {
  getCategoryEnhancers,
  blendEnhancers,
  composeCategoryPrompt,
} from './category-prompts';
import {
  advanceCourseStage,
  failCourseCreation,
  reactivateCourseCreation,
} from './course-creation-controller';
import { recallCourseCreationMemory } from './memory-recall';
import type { RecalledMemory } from './memory-recall';
import { planCourseBlueprint } from './course-planner';
import { PROMPT_VERSION } from './prompts';
import { AdaptiveStrategyMonitor } from './adaptive-strategy';
import type { AdaptiveStrategyState } from './adaptive-strategy';
import { PipelineBudgetTracker } from './pipeline-budget';
import { FallbackTracker } from './response-parsers';
import {
  CourseCreationSLOTracker,
  recordCourseCreationSLOSnapshot,
} from './slo-telemetry';
import { initializeCourseRecord } from './course-initializer';
import { runPipeline } from './pipeline-runner';
import { runPostProcessing } from './post-processor';
import { finalizeAndEmit } from './completion-handler';
import {
  PipelineErrorCode,
} from './types';
import type {
  SequentialCreationConfig,
  SequentialCreationResult,
  CreationProgress,
  CourseContext,
  GeneratedChapter,
  CompletedChapter,
  BloomsLevel,
  QualityScore,
  ConceptTracker,
  CourseBlueprintPlan,
  AgenticDecision,
  ResumeState,
} from './types';

// =============================================================================
// ORCHESTRATOR
// =============================================================================

export interface OrchestrateOptions {
  userId: string;
  config: SequentialCreationConfig;
  onProgress?: (progress: CreationProgress) => void;
  onSSEEvent?: (event: { type: string; data: Record<string, unknown> }) => void;
  /** AbortSignal for cancellation -- checked before each chapter generation */
  abortSignal?: AbortSignal;
  /** Enable streaming thinking extraction (Phase 6). Default: false. */
  enableStreamingThinking?: boolean;
  /** Resume state -- when provided, skips course/goal creation and resumes from checkpoint */
  resumeState?: ResumeState;
  /**
   * @deprecated Always true. The legacy for-loop path has been removed.
   * Kept for API compatibility — callers may still pass it.
   */
  useAgenticStateMachine?: boolean;
  /** Correlation ID for end-to-end tracing across the SSE session */
  runId?: string;
  /** Client-generated idempotency key to prevent duplicate course creation */
  requestId?: string;
  /** Server-generated deterministic fingerprint of the creation payload */
  requestFingerprint?: string;
}

export async function orchestrateCourseCreation(
  options: OrchestrateOptions
): Promise<SequentialCreationResult> {
  const { userId, config, onProgress, onSSEEvent, abortSignal, enableStreamingThinking, resumeState, useAgenticStateMachine, runId, requestId, requestFingerprint } = options;
  const startTime = Date.now();
  const isResume = !!resumeState;

  // Resolve A/B experiments (all active -- supports concurrent experiments)
  const experimentAssignments = await getActiveExperiments(userId);
  const experimentVariant = joinVariants(experimentAssignments);
  const minimumSectionsPerChapter = getMinimumSectionsForDifficulty(config.difficulty);
  const effectiveSectionsPerChapter = Math.max(config.sectionsPerChapter, minimumSectionsPerChapter);

  // When resuming, seed state from checkpoint; otherwise start fresh
  const qualityScores: QualityScore[] = resumeState?.qualityScores.slice() ?? [];
  const allSectionTitles: string[] = resumeState?.allSectionTitles.slice() ?? [];
  let chaptersCreated = resumeState?.completedChapterCount ?? 0;
  let sectionsCreated = resumeState?.completedChapters.reduce((sum, ch) => sum + ch.sections.length, 0) ?? 0;
  let goalId = resumeState?.goalId ?? '';
  let planId = resumeState?.planId ?? '';
  let stepIds: string[] = resumeState?.stepIds.slice() ?? [];
  let createdCourseId = resumeState?.courseId ?? '';

  // Track actual section counts per chapter (for accurate resume completedItems)
  const chapterSectionCounts: number[] = resumeState?.chapterSectionCounts.slice() ?? [];

  // Initialize concept tracker and Bloom's progression from resume or empty
  const conceptTracker: ConceptTracker = resumeState?.conceptTracker ?? {
    concepts: new Map(),
    vocabulary: [],
    skillsBuilt: [],
  };
  const bloomsProgression: Array<{ chapter: number; level: BloomsLevel; topics: string[] }> =
    resumeState?.bloomsProgression.slice() ?? [];

  // Build CourseContext from config
  const courseContext: CourseContext = {
    courseTitle: config.courseTitle,
    courseDescription: config.courseDescription,
    courseCategory: config.category ?? 'General',
    courseSubcategory: config.subcategory,
    targetAudience: config.targetAudience,
    difficulty: config.difficulty,
    courseLearningObjectives: config.courseGoals,
    totalChapters: config.totalChapters,
    sectionsPerChapter: effectiveSectionsPerChapter,
    bloomsFocus: config.bloomsFocus as BloomsLevel[],
    learningObjectivesPerChapter: config.learningObjectivesPerChapter,
    learningObjectivesPerSection: config.learningObjectivesPerSection,
    preferredContentTypes: (config.preferredContentTypes ?? []) as CourseContext['preferredContentTypes'],
    courseIntent: config.courseIntent,
    includeAssessments: config.includeAssessments,
    duration: config.duration,
  };

  // Resolve domain-specific category prompt enhancer (with optional multi-domain blending)
  const matchedEnhancers = getCategoryEnhancers(
    courseContext.courseCategory,
    courseContext.courseSubcategory,
  );
  const categoryEnhancer = matchedEnhancers.length >= 2
    ? blendEnhancers(matchedEnhancers[0], matchedEnhancers[1])
    : matchedEnhancers[0];
  const composedCategoryPrompt = composeCategoryPrompt(categoryEnhancer);
  logger.info('[ORCHESTRATOR] Category enhancer resolved', {
    categoryId: categoryEnhancer.categoryId,
    displayName: categoryEnhancer.displayName,
    courseCategory: courseContext.courseCategory,
    tokenEstimate: composedCategoryPrompt.tokenEstimate.total,
    blended: matchedEnhancers.length >= 2,
  });

  // Resolve chapter template from difficulty level (used for prompt guidance, not counts)
  const chapterTemplate = getTemplateForDifficulty(config.difficulty);
  logger.info('[ORCHESTRATOR] Chapter DNA template resolved', {
    difficulty: config.difficulty,
    template: chapterTemplate.displayName,
    templateSections: chapterTemplate.totalSections,
    minimumSections: minimumSectionsPerChapter,
    userRequestedSections: config.sectionsPerChapter,
    effectiveSectionsPerChapter,
  });

  // Phase 2: Recall memory from prior course creations (3s timeout, safe fallback)
  let recalledMemory: RecalledMemory | null = null;
  try {
    recalledMemory = await recallCourseCreationMemory(
      userId,
      courseContext.courseCategory,
      courseContext.courseTitle,
    );
    if (recalledMemory.priorConcepts.length > 0 || recalledMemory.qualityPatterns) {
      logger.info('[ORCHESTRATOR] Memory recalled from prior courses', {
        priorConceptCount: recalledMemory.priorConcepts.length,
        hasQualityPatterns: !!recalledMemory.qualityPatterns,
      });
    }
  } catch {
    // Memory recall failure is non-blocking
    recalledMemory = null;
  }

  // Phase 5: Initialize adaptive strategy monitor (seed from checkpoint on resume)
  // Prefer full AdaptiveStrategyState (preserves temperature/token adjustments),
  // fall back to history-only seeding for backward compatibility with older checkpoints.
  const savedStrategyState = resumeState?.strategyState as AdaptiveStrategyState | undefined;
  const strategyMonitor = savedStrategyState
    ? AdaptiveStrategyMonitor.fromPersistedState(savedStrategyState)
    : new AdaptiveStrategyMonitor(
        resumeState ? resumeState.strategyHistory ?? [] : undefined
      );

  // Phase 7: Pre-generation course blueprint planning (new courses only)
  let blueprintPlan: CourseBlueprintPlan | null = null;
  let lastAgenticDecision: AgenticDecision | null = null;

  if (!isResume) {
    try {
      onSSEEvent?.({
        type: 'planning_start',
        data: { message: 'Planning course blueprint...', promptVersion: PROMPT_VERSION },
      });

      blueprintPlan = await planCourseBlueprint(
        userId,
        courseContext,
        recalledMemory ?? undefined,
        runId,
      );

      onSSEEvent?.({
        type: 'planning_complete',
        data: {
          message: 'Course blueprint ready',
          chapterCount: blueprintPlan.chapterPlan.length,
          confidence: blueprintPlan.planConfidence,
          riskAreas: blueprintPlan.riskAreas.length,
        },
      });

      logger.info('[ORCHESTRATOR] Course blueprint planned', {
        chapters: blueprintPlan.chapterPlan.length,
        confidence: blueprintPlan.planConfidence,
      });

      if (
        typeof blueprintPlan.recommendedChapterCount === 'number'
        && blueprintPlan.recommendedChapterCount !== config.totalChapters
      ) {
        onSSEEvent?.({
          type: 'chapter_count_adjusted',
          data: {
            requested: config.totalChapters,
            recommended: blueprintPlan.recommendedChapterCount,
            resolved: config.totalChapters,
            policy: 'user_authoritative',
            message: `Blueprint suggested ${blueprintPlan.recommendedChapterCount} chapters; keeping requested ${config.totalChapters}.`,
          },
        });
      }
    } catch {
      // Blueprint planning is non-blocking
      blueprintPlan = null;
      logger.debug('[ORCHESTRATOR] Blueprint planning skipped');
    }
  }

  // Initialize fallback tracker for monitoring AI response parse failures
  const fallbackThreshold = config.fallbackPolicy?.haltRateThreshold ?? 0.3;
  const fallbackTracker = new FallbackTracker(fallbackThreshold);
  const sloTracker = new CourseCreationSLOTracker(runId);

  // Initialize pipeline budget tracker (3x the estimated token spend)
  // Optimized call count per chapter (critics + self-critique + AI decisions removed):
  //   Stage 1: 1 gen + 1 critic (chapter-level, kept) = 2 calls
  //   Stage 2: sectionsPerChapter × 1 gen = spc × 1
  //   Stage 3: sectionsPerChapter × 1 gen = spc × 1
  //   Between-chapter: 1 rule-based decision (no AI call)
  //   Retries: +1 max per stage (rare, budgeted as ~1 extra call)
  // Total per chapter: 3 + sectionsPerChapter × 2 (+ ~spc retries budgeted)
  const estimatedCallsPerChapter = 3 + effectiveSectionsPerChapter * 3;
  const estimatedTotalCalls = config.totalChapters * estimatedCallsPerChapter + 2; // +2 for overhead
  const estimatedTokensPerCall = 6000;
  const estimatedTotalTokens = estimatedTotalCalls * estimatedTokensPerCall;
  const estimatedCostUSD = estimatedTotalTokens * 0.000003;
  const budgetTracker = new PipelineBudgetTracker(estimatedTotalTokens, estimatedCostUSD);

  // Strict mode: always use user's requested chapter count
  const totalChapters = config.totalChapters;

  // Calculate total items for percentage tracking
  const totalSections = totalChapters * effectiveSectionsPerChapter;
  const totalItems = totalChapters + totalSections + totalSections;
  let completedItems = 0;

  // Sync accurate total items to frontend
  onSSEEvent?.({
    type: 'total_items',
    data: { totalItems, totalChapters, sectionsPerChapter: effectiveSectionsPerChapter },
  });

  // Wrap onSSEEvent to auto-increment completedItems on core item_complete events.
  // This fixes the bug where completedItems was never incremented during active runs,
  // causing emitProgress() to always calculate 0% progress.
  logger.info('[ORCHESTRATOR] Total items calculated', {
    totalItems,
    totalChapters,
    sectionsPerChapter: effectiveSectionsPerChapter,
    formula: `${totalChapters} + ${totalSections} + ${totalSections} = ${totalItems}`,
  });

  const trackingOnSSEEvent = (event: { type: string; data: Record<string, unknown> }) => {
    sloTracker.observeEvent(event);

    if (event.type === 'item_complete') {
      const stage = event.data.stage as number;
      if (stage === 1 || stage === 2 || stage === 3) {
        const isHealing = event.data.isHealing as boolean | undefined;
        const isResumeReplay = event.data.isResumeReplay as boolean | undefined;
        if (!isHealing && !isResumeReplay) {
          completedItems++;
          logger.debug('[ORCHESTRATOR] Item completed', {
            stage,
            completedItems,
            totalItems,
            percentage: Math.round((completedItems / totalItems) * 100),
            chapter: event.data.chapter,
            section: event.data.section,
          });
        }
      }

      if (onSSEEvent) {
        onSSEEvent({
          type: event.type,
          data: { ...event.data, completedItems, totalItems },
        });
      }
      return;
    }

    onSSEEvent?.(event);
  };

  const progress: CreationProgress = {
    state: {
      stage: 1,
      phase: 'creating_course',
      currentChapter: 0,
      totalChapters,
      currentSection: 0,
      totalSections: effectiveSectionsPerChapter,
    },
    percentage: 0,
    message: 'Creating course...',
    completedItems: { chapters: [], sections: [] },
  };

  function emitProgress(message: string, thinking?: string) {
    progress.percentage = Math.min(100, Math.round((completedItems / totalItems) * 100));
    progress.message = message;
    if (thinking) progress.thinking = thinking;
    onProgress?.(progress);
    trackingOnSSEEvent?.({
      type: 'progress',
      data: {
        percentage: progress.percentage,
        message,
        stage: progress.state.stage,
        phase: progress.state.phase,
        completedItems,
        totalItems,
      },
    });
  }

  try {
    // =========================================================================
    // RESUME vs NEW: Set up course record and goal tracking
    // =========================================================================
    let courseId: string;

    if (isResume && resumeState) {
      // --- RESUME PATH: reuse existing course and goal ---
      courseId = resumeState.courseId;
      createdCourseId = courseId;
      progress.goalId = goalId;

      logger.info('[ORCHESTRATOR] Resuming course creation', {
        courseId,
        completedChapters: resumeState.completedChapterCount,
        totalChapters,
        goalId,
      });

      emitProgress(`Resuming from chapter ${resumeState.completedChapterCount + 1}...`);
      trackingOnSSEEvent?.({
        type: 'progress',
        data: {
          percentage: Math.round((resumeState.completedChapterCount / totalChapters) * 100),
          message: `Resuming from chapter ${resumeState.completedChapterCount + 1}...`,
          stage: 1,
          phase: 'resuming',
        },
      });

      // Emit a single batch resume_hydrate event so the client can hydrate
      // its completedItems list without showing individual events
      trackingOnSSEEvent?.({
        type: 'resume_hydrate',
        data: {
          courseId,
          completedChapters: resumeState.completedChapters.map(ch => ({
            position: ch.position,
            title: ch.title,
            id: ch.id,
          })),
          completedSections: resumeState.completedChapters.flatMap(ch =>
            ch.sections.map(sec => ({
              chapterPosition: ch.position,
              position: sec.position,
              title: sec.title,
              id: sec.id,
            }))
          ),
          completedChapterCount: resumeState.completedChapterCount,
        },
      });

      // Reactivate goal/plan
      await reactivateCourseCreation(goalId, planId);
    } else {
      // --- NEW PATH: delegate to course-initializer ---
      emitProgress('Creating course record...');

      const initResult = await initializeCourseRecord(userId, config, blueprintPlan, requestId, requestFingerprint);
      courseId = initResult.courseId;
      createdCourseId = initResult.courseId;
      goalId = initResult.goalId;
      planId = initResult.planId;
      stepIds = initResult.stepIds;
      progress.goalId = goalId;

      logger.info('[ORCHESTRATOR] Course created', { courseId, title: config.courseTitle });
      trackingOnSSEEvent?.({
        type: 'item_complete',
        data: { stage: 0, message: 'Course record created', courseId },
      });
    }

    // =========================================================================
    // DEPTH-FIRST PIPELINE SETUP
    // =========================================================================

    await advanceCourseStage(planId, stepIds, 1);
    if (!isResume) {
      // Include courseId so the client's lastCourseIdRef is populated early.
      // This ensures the Resume button can appear even if the pipeline fails
      // before any item_complete event is sent.
      trackingOnSSEEvent?.({ type: 'stage_start', data: { stage: 1, message: 'Generating course content...', courseId } });
    }

    // Seed completedChapters/generatedChapters from resume state
    const completedChapters: CompletedChapter[] = resumeState?.completedChapters.slice() ?? [];
    const generatedChapters: (GeneratedChapter & { id: string })[] = completedChapters.map(ch => ({
      position: ch.position,
      title: ch.title,
      description: '',
      bloomsLevel: ch.bloomsLevel,
      learningObjectives: ch.learningObjectives,
      keyTopics: ch.keyTopics ?? [],
      prerequisites: ch.prerequisites ?? '',
      estimatedTime: ch.estimatedTime ?? '1-2 hours',
      topicsToExpand: ch.topicsToExpand ?? [],
      conceptsIntroduced: ch.conceptsIntroduced ?? [],
      id: ch.id,
    }));

    // On resume, adjust completedItems counter to reflect already-done work
    if (isResume) {
      if (chapterSectionCounts.length > 0) {
        completedItems = chapterSectionCounts.reduce(
          (sum, secCount) => sum + 1 + 2 * secCount,
          0,
        );
      } else {
        completedItems = chaptersCreated * (1 + 2 * effectiveSectionsPerChapter);
      }
    }

    const startChapter = isResume ? resumeState!.completedChapterCount + 1 : 1;
    // Legacy for-loop path removed — always use agentic state machine
    const useStateMachine = true;

    if (useAgenticStateMachine === false) {
      logger.warn('[ORCHESTRATOR] useAgenticStateMachine=false was passed but legacy path has been removed. Using agentic path.', {
        courseId, userId: userId,
      });
    }

    logger.info('[ORCHESTRATOR] Execution path: agentic state machine', {
      isResume,
      startChapter,
    });

    // =========================================================================
    // PIPELINE EXECUTION: Delegate to pipeline-runner
    // =========================================================================

    const pipelineResult = await runPipeline({
      userId,
      courseId,
      goalId,
      planId,
      config,
      courseContext,
      onSSEEvent: trackingOnSSEEvent,
      abortSignal,
      enableStreamingThinking,
      runId,
      useAgenticStateMachine: useStateMachine,
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
      chapterTemplate,
      categoryPrompt: composedCategoryPrompt,
      categoryEnhancer,
      experimentVariant: experimentVariant ?? '',
      chapterSectionCounts,
      budgetTracker,
      fallbackTracker,
      stepIds,
      startChapter,
      totalChapters,
      effectiveSectionsPerChapter,
      resumeState,
    });
    chaptersCreated = pipelineResult.chaptersCreated;
    sectionsCreated = pipelineResult.sectionsCreated;

    // Handle abort: return early with partial result
    if (abortSignal?.aborted) {
      const totalTime = Date.now() - startTime;
      const averageQualityScore = qualityScores.length > 0
        ? Math.round(qualityScores.reduce((a, b) => a + b.overall, 0) / qualityScores.length)
        : 0;
      trackingOnSSEEvent?.({
        type: 'complete',
        data: {
          courseId,
          chaptersCreated,
          sectionsCreated,
          totalTime,
          averageQualityScore,
          cancelled: true,
        },
      });
      return {
        success: true,
        courseId,
        chaptersCreated,
        sectionsCreated,
        stats: {
          totalChapters: chaptersCreated,
          totalSections: sectionsCreated,
          totalTime,
          averageQualityScore,
        },
        goalId,
        planId,
      };
    }

    // =========================================================================
    // POST-PROCESSING: Delegate to post-processor (reflection + healing)
    // =========================================================================

    const postProcessResult = (await runPostProcessing(
      { userId, courseId, goalId, runId, onSSEEvent: trackingOnSSEEvent },
      completedChapters,
      conceptTracker,
      courseContext,
      qualityScores,
      blueprintPlan,
    )) ?? { courseReflection: null, healingPerformed: false };

    // =========================================================================
    // COMPLETION: Delegate to completion-handler
    // =========================================================================

    progress.state.phase = 'complete';
    progress.percentage = 100;
    progress.message = 'Course creation complete!';
    onProgress?.(progress);

    const totalTime = Date.now() - startTime;

    return await finalizeAndEmit(
      {
        courseId,
        goalId,
        planId,
        stepIds,
        runId,
        userId,
        courseTitle: config.courseTitle,
        onSSEEvent: trackingOnSSEEvent,
      },
      {
        chaptersCreated,
        sectionsCreated,
        totalTime,
        qualityScores,
        experimentAssignments,
        fallbackTracker,
        sloTracker,
        coherenceScore: postProcessResult.courseReflection?.coherenceScore,
      },
      config,
      generatedChapters,
      pipelineResult.allSections,
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[ORCHESTRATOR] Course creation failed', { runId, error: errorMessage });

    // Phase 3: Mark course creation as failed
    await failCourseCreation(goalId, planId, errorMessage);

    progress.state.phase = 'error';
    progress.state.error = errorMessage;
    emitProgress(`Error: ${errorMessage}`);
    config.onError?.(errorMessage, false);

    trackingOnSSEEvent?.({
      type: 'error',
      data: {
        code: PipelineErrorCode.ORCHESTRATOR_ERROR,
        message: errorMessage,
        chaptersCreated,
        sectionsCreated,
        courseId: createdCourseId || undefined,
      },
    });

    if (planId) {
      const totalTime = Date.now() - startTime;
      const averageQualityScore = qualityScores.length > 0
        ? Math.round(qualityScores.reduce((a, b) => a + b.overall, 0) / qualityScores.length)
        : 0;
      const snapshot = sloTracker.buildSnapshot({
        status: abortSignal?.aborted ? 'cancelled' : 'failed',
        totalTimeMs: totalTime,
        chaptersCreated,
        sectionsCreated,
        averageQualityScore,
      });
      recordCourseCreationSLOSnapshot(planId, snapshot).catch(() => { /* non-critical */ });
    }

    return {
      success: false,
      courseId: createdCourseId || undefined,
      chaptersCreated,
      sectionsCreated,
      error: errorMessage,
      goalId: goalId || undefined,
      planId: planId || undefined,
    };
  }
}

// =============================================================================
// RE-EXPORTS from extracted modules
// =============================================================================

// Response parsers (extracted to response-parsers.ts)
export { parseChapterResponse, parseSectionResponse, parseDetailsResponse, FallbackTracker } from './response-parsers';

// Checkpoint/resume (extracted to checkpoint-manager.ts)
export { resumeCourseCreation, saveCheckpoint, saveCheckpointWithRetry } from './checkpoint-manager';
export type { SaveCheckpointInput } from './checkpoint-manager';

// Chapter generator (extracted to chapter-generator.ts)
export { generateSingleChapter } from './chapter-generator';
export type { ChapterGenerationCallbacks } from './chapter-generator';

// Chapter regeneration (extracted to chapter-regenerator.ts)
export { regenerateChapter } from './chapter-regenerator';
export type { RegenerateChapterOptions, RegenerateChapterResult } from './chapter-regenerator';

// Decomposed modules (extracted for modularity)
export { initializeCourseRecord } from './course-initializer';
export type { CourseInitResult } from './course-initializer';
export { runPipeline } from './pipeline-runner';
export type { PipelineRunnerOptions, PipelineRunnerResult } from './pipeline-runner';
export { runPostProcessing } from './post-processor';
export type { PostProcessOptions, PostProcessResult } from './post-processor';
export { finalizeAndEmit } from './completion-handler';
export type { CompletionOptions, CompletionStats } from './completion-handler';

// Helpers re-export for external consumers
export {
  cleanTitle,
  ensureArray,
  ensureOptionalArray,
  normalizeContentType,
  parseDuration,
  cleanAIResponse,
  jaccardSimilarity,
  buildDefaultQualityScore,
  scoreChapter,
  scoreSection,
  scoreDetails,
  validateChapterSectionCoverage,
  buildFallbackChapter,
  buildFallbackSection,
  buildFallbackDetails,
  buildFallbackDescription,
} from './helpers';
