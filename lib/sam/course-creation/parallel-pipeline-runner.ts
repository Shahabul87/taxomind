/**
 * Parallel Pipeline Runner — Generates chapters in batches for safe concurrency.
 *
 * When a teacher-approved blueprint exists and `isBlueprintDriven` mode activates,
 * ALL inter-chapter dependencies are disabled:
 *   - No concept tracker prompts (blueprint provides key topics)
 *   - No semantic duplicate detection (blueprint defines distinct sections)
 *   - No Bloom's progression tracking (blueprint sets each chapter's level)
 *   - No critics, no self-critique, no SAM validation, maxRetries: 0
 *
 * This means chapters can generate independently via Promise.allSettled.
 *
 * BATCHED EXECUTION: Instead of launching all chapters at once (which overwhelms
 * AI provider rate limits at 7-10+ chapters), chapters are processed in batches
 * of `BATCH_SIZE` (default: 3). Each batch runs via Promise.allSettled, and failed
 * chapters within a batch get one retry before moving on.
 *
 * Why batching beats an all-at-once semaphore approach:
 *   1. Naturally limits concurrent AI calls (3 chapters x ~3 stages = ~9 max)
 *   2. Provides checkpoint boundaries between batches for progress tracking
 *   3. Controls memory pressure (only 3 chapter generators alive at once)
 *   4. Stays well within provider rate limits (DeepSeek ~60, Anthropic ~50 RPM)
 *   5. SSE connection stays healthy (no 15-min Railway timeout risk)
 *
 * Performance:
 *   5-chapter course:  ~15-25min sequential -> ~5-8min batched (~3x speedup)
 *   10-chapter course: ~30-50min sequential -> ~12-18min batched (~3x speedup)
 */

import 'server-only';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { resolveAIModelInfo } from '@/lib/sam/ai-provider';
import { withTimeout, OperationTimeoutError, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { generateSingleChapter } from './chapter-generator';
import { saveCheckpointWithRetry } from './checkpoint-manager';
import {
  buildFallbackChapter,
  buildFallbackSection,
  buildFallbackDetails,
  parseDuration,
  sanitizeHtmlOutput,
  buildDefaultQualityScore,
} from './helpers';
import { PROMPT_VERSION } from './prompts';
import type { ChapterGenerationCallbacks } from './chapter-generator';
import type { PipelineRunnerOptions, PipelineRunnerResult } from './pipeline-runner';
import type {
  ChapterStepContext,
  ChapterStepResult,
  CompletedChapter,
  CompletedSection,
  QualityScore,
  ConceptTracker,
  BloomsLevel,
  GeneratedSection,
} from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default batch size: 3 chapters at a time. Keeps ~9 concurrent AI calls max. */
const DEFAULT_BATCH_SIZE = 3;

// ============================================================================
// TYPES
// ============================================================================

export interface ParallelPipelineOptions extends PipelineRunnerOptions {
  /** Number of chapters to generate in each batch (default: 3) */
  batchSize?: number;
}

interface ChapterOutcome {
  position: number;
  status: 'fulfilled' | 'rejected';
  result?: ChapterStepResult;
  error?: Error;
}

// ============================================================================
// HELPERS
// ============================================================================

/** Split an array into chunks of `size`. */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// Stop words for coherence checking (common words to exclude)
const COHERENCE_STOP_WORDS = new Set([
  'the', 'and', 'for', 'that', 'this', 'with', 'from', 'are', 'was', 'were',
  'will', 'have', 'has', 'had', 'been', 'being', 'what', 'when', 'where',
  'which', 'their', 'there', 'your', 'about', 'into', 'more', 'some', 'than',
  'then', 'them', 'also', 'each', 'does', 'how', 'its', 'may', 'can', 'would',
  'could', 'should', 'chapter', 'section', 'learn', 'learning', 'course',
  'understand', 'introduction', 'overview', 'summary', 'objectives',
]);

/**
 * Extract keywords from section titles for coherence comparison.
 * Returns lowercase words >3 chars excluding stop words.
 */
function extractKeywords(titles: string[]): Set<string> {
  const keywords = new Set<string>();
  for (const title of titles) {
    const words = title.toLowerCase().split(/\W+/).filter(
      (w) => w.length > 3 && !COHERENCE_STOP_WORDS.has(w)
    );
    for (const word of words) {
      keywords.add(word);
    }
  }
  return keywords;
}

/**
 * Jaccard similarity between two sets: |A ∩ B| / |A ∪ B|
 */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection++;
  }
  const union = new Set([...a, ...b]).size;
  return union > 0 ? intersection / union : 0;
}

/**
 * Check inter-batch coherence: detect >80% keyword overlap between
 * completed chapter section titles. ~50ms, rule-based, no AI cost.
 */
function checkInterBatchCoherence(
  chapters: CompletedChapter[],
): Array<{ chapterA: number; chapterB: number; titleA: string; titleB: string; similarity: number }> {
  const warnings: Array<{ chapterA: number; chapterB: number; titleA: string; titleB: string; similarity: number }> = [];
  if (chapters.length < 2) return warnings;

  // Build keyword sets per chapter from section titles
  const chapterKeywords: Array<{ position: number; title: string; keywords: Set<string> }> = [];
  for (const ch of chapters) {
    const sectionTitles = ch.sections.map((s) => s.title);
    chapterKeywords.push({
      position: ch.position,
      title: ch.title,
      keywords: extractKeywords(sectionTitles),
    });
  }

  // Compare all pairs
  for (let i = 0; i < chapterKeywords.length; i++) {
    for (let j = i + 1; j < chapterKeywords.length; j++) {
      const sim = jaccardSimilarity(chapterKeywords[i].keywords, chapterKeywords[j].keywords);
      if (sim > 0.8) {
        warnings.push({
          chapterA: chapterKeywords[i].position,
          chapterB: chapterKeywords[j].position,
          titleA: chapterKeywords[i].title,
          titleB: chapterKeywords[j].title,
          similarity: Math.round(sim * 100),
        });
      }
    }
  }

  return warnings;
}

// ============================================================================
// PARALLEL PIPELINE RUNNER (BATCHED)
// ============================================================================

export async function runParallelPipeline(
  options: ParallelPipelineOptions,
): Promise<PipelineRunnerResult> {
  const {
    userId, courseId, courseContext,
    onSSEEvent, enableStreamingThinking, runId, abortSignal,
    completedChapters, qualityScores,
    allSectionTitles, bloomsProgression,
    blueprintPlan, strategyMonitor,
    chapterTemplate, categoryPrompt, categoryEnhancer, experimentVariant,
    budgetTracker, fallbackTracker,
    startChapter, totalChapters,
    goalId, planId, stepIds, config,
    batchSize = DEFAULT_BATCH_SIZE,
  } = options;

  const allSections: Map<string, (GeneratedSection & { id: string })[]> = new Map();

  // Pre-resolve model info to detect reasoning models (scales batch size + adapter timeout)
  const modelInfo = await resolveAIModelInfo({ userId, capability: 'course' });
  let effectiveBatchSize = batchSize;

  if (modelInfo.isReasoningModel) {
    // Reasoning models (deepseek-reasoner, o1) take 30-60s+ per call with long thinking phases.
    // Reduce concurrency to avoid rate-limit pressure and cumulative timeout issues.
    effectiveBatchSize = Math.min(batchSize, 2);
  }

  logger.info('[PARALLEL_PIPELINE] Resolved model info', {
    courseId,
    provider: modelInfo.provider,
    model: modelInfo.model,
    isReasoningModel: modelInfo.isReasoningModel,
    requestedBatchSize: batchSize,
    effectiveBatchSize,
    runId,
  });

  // Emit model info so the client can display provider/timeout context
  onSSEEvent?.({
    type: 'parallel_model_info',
    data: {
      provider: modelInfo.provider,
      model: modelInfo.model,
      isReasoningModel: modelInfo.isReasoningModel,
      batchSize: effectiveBatchSize,
    },
  });

  // Determine which chapters to generate
  const chapterPositions: number[] = [];
  for (let i = startChapter; i <= totalChapters; i++) {
    chapterPositions.push(i);
  }

  // Use dynamic batching: start with effectiveBatchSize, adapt per iteration
  let currentBatchSize = effectiveBatchSize;
  const remainingPositions = [...chapterPositions];
  const estimatedTotalBatches = Math.ceil(chapterPositions.length / effectiveBatchSize);

  logger.info('[PARALLEL_PIPELINE] Starting batched parallel generation', {
    courseId,
    totalChapters,
    startChapter,
    chaptersToGenerate: chapterPositions.length,
    batchSize: effectiveBatchSize,
    estimatedTotalBatches,
    runId,
  });

  // Emit parallel generation start event
  onSSEEvent?.({
    type: 'parallel_generation_start',
    data: {
      courseId,
      totalChapters,
      chapterPositions,
      batchSize: effectiveBatchSize,
      totalBatches: estimatedTotalBatches,
    },
  });

  // ── Build isolated context for each chapter ──
  // Each chapter gets its own mutable state to avoid cross-chapter mutation.
  // In blueprint-driven mode, these shared-state arrays are not used in prompts,
  // so giving each chapter an empty copy is safe.
  const buildIsolatedContext = (chapterNumber: number): ChapterStepContext => {
    const isolatedCompletedChapters: CompletedChapter[] = [];
    const isolatedQualityScores: QualityScore[] = [];
    const isolatedSectionTitles: string[] = [];
    const isolatedBloomsProgression: Array<{ chapter: number; level: BloomsLevel; topics: string[] }> = [];
    const isolatedConceptTracker: ConceptTracker = {
      concepts: new Map(),
      vocabulary: [],
      skillsBuilt: [],
    };

    return {
      chapterNumber,
      courseId,
      courseContext,
      conceptTracker: isolatedConceptTracker,
      bloomsProgression: isolatedBloomsProgression,
      allSectionTitles: isolatedSectionTitles,
      qualityScores: isolatedQualityScores,
      completedChapters: isolatedCompletedChapters,
      generatedChapters: [],
      blueprintPlan,
      teacherBlueprintChapters: options.teacherBlueprintChapters,
      northStarProject: options.northStarProject,
      lastAgenticDecision: null,
      recalledMemory: null,
      strategyMonitor,
      chapterTemplate,
      categoryPrompt,
      categoryEnhancer,
      experimentVariant,
      isReasoningModel: modelInfo.isReasoningModel,
      runId,
      budgetTracker,
      fallbackTracker,
    };
  };

  // ── Compute per-chapter timeout based on model type and section count ──
  // Fix 3: Reasoning models get 15 min base (3 stages × AI_GENERATION_REASONING),
  // standard models get 6 min base (2 × AI_GENERATION). Scale by section count.
  const sectionsPerChapter = courseContext.sectionsPerChapter;
  const perChapterTimeoutMs = modelInfo.isReasoningModel
    ? TIMEOUT_DEFAULTS.AI_GENERATION_REASONING * 3 * (1 + sectionsPerChapter / 10)
    : TIMEOUT_DEFAULTS.AI_GENERATION * 2 * (1 + sectionsPerChapter / 10);

  /** Generate a single chapter with SSE callbacks tagged to its position. */
  const generateChapter = async (position: number, isRetry = false): Promise<ChapterOutcome> => {
    const context = buildIsolatedContext(position);
    // Track stage transitions to emit parallel_chapter_stage_change events
    let lastEmittedStage = 0;

    const chapterCallbacks: ChapterGenerationCallbacks = {
      onSSEEvent: (event) => {
        // Intercept item_generating to detect stage transitions
        if (event.type === 'item_generating' && event.data?.stage != null) {
          const stage = event.data.stage as number;
          if (stage !== lastEmittedStage) {
            lastEmittedStage = stage;
            const stageNames: Record<number, string> = { 1: 'Structure', 2: 'Sections', 3: 'Details' };
            onSSEEvent?.({
              type: 'parallel_chapter_stage_change',
              data: {
                courseId,
                chapter: position,
                stage,
                stageName: stageNames[stage] ?? `Stage ${stage}`,
                totalSections: courseContext.sectionsPerChapter,
              },
            });
          }
        }

        onSSEEvent?.({
          type: event.type,
          data: { ...event.data, chapter: position, ...(isRetry ? { isRetry: true } : {}) },
        });
      },
      enableStreamingThinking,
      abortSignal,
    };

    try {
      // Fix 2: abortSignal check moved inside try/catch so abort is returned
      // as { status: 'rejected' } instead of causing a raw Promise rejection
      if (abortSignal?.aborted) {
        throw new Error('Aborted');
      }

      // Fix 3: Wrap with per-chapter timeout to prevent a single slow chapter
      // from blocking the entire pipeline. OperationTimeoutError is caught below,
      // returned as status: 'rejected', retried once, then falls to fallback.
      const result = await withTimeout(
        () => generateSingleChapter(userId, context, chapterCallbacks),
        perChapterTimeoutMs,
        `parallel_chapter_${position}`,
      );

      onSSEEvent?.({
        type: 'parallel_chapter_complete',
        data: {
          courseId,
          chapter: position,
          title: result.completedChapter.title,
          id: result.completedChapter.id,
          qualityScore: result.qualityScores.length > 0
            ? Math.round(result.qualityScores.reduce((a, b) => a + b.overall, 0) / result.qualityScores.length)
            : undefined,
          chaptersCreated: result.chaptersCreated,
          sectionsCreated: result.sectionsCreated,
          isRetry,
          // Enriched fields for chapter detail modal
          bloomsLevel: result.completedChapter.bloomsLevel,
          keyTopics: result.completedChapter.keyTopics,
          sectionCount: result.completedChapter.sections.length,
        },
      });

      return { position, status: 'fulfilled', result };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('[PARALLEL_PIPELINE] Chapter generation failed', {
        courseId, chapter: position, error: err.message, isRetry, runId,
      });

      // Classify error type for UI display
      const errorType = err instanceof OperationTimeoutError ? 'timeout'
        : err.name === 'AbortError' ? 'abort'
        : 'generation';

      onSSEEvent?.({
        type: 'parallel_chapter_failed',
        data: {
          courseId,
          chapter: position,
          error: err.message,
          isRetry,
          errorType,
          retryCount: isRetry ? 1 : 0,
        },
      });

      return { position, status: 'rejected', error: err };
    }
  };

  /** Merge a successful chapter outcome into the shared accumulators. */
  const mergeChapterResult = (outcome: ChapterOutcome): void => {
    if (outcome.status !== 'fulfilled' || !outcome.result) return;

    const chResult = outcome.result;
    completedChapters.push(chResult.completedChapter);
    qualityScores.push(...chResult.qualityScores);

    for (const sec of chResult.completedChapter.sections) {
      allSectionTitles.push(sec.title);
    }

    bloomsProgression.push({
      chapter: outcome.position,
      level: chResult.completedChapter.bloomsLevel as BloomsLevel,
      topics: chResult.completedChapter.keyTopics,
    });

    // Fix 4: Per-chapter checkpoint save — fire-and-forget so each completed
    // chapter is immediately checkpointed. On crash, resume picks up from the
    // last saved chapter rather than restarting the entire batch.
    if (planId) {
      const chapterCount = completedChapters.length;
      saveCheckpointWithRetry(courseId, userId, planId, {
        conceptTracker: { concepts: new Map(), vocabulary: [], skillsBuilt: [] },
        bloomsProgression,
        allSectionTitles,
        qualityScores,
        completedChapterCount: chapterCount,
        config,
        goalId,
        planId,
        stepIds,
        courseId,
        completedChaptersList: completedChapters,
        percentage: Math.round((chapterCount / totalChapters) * 100),
        status: 'in_progress',
        lastCompletedStage: 3,
        currentChapterNumber: chapterCount,
        promptVersion: PROMPT_VERSION,
      }).catch((err) => {
        // Non-blocking: batch-level checkpoint is the safety net
        logger.warn('[PARALLEL_PIPELINE] Per-chapter checkpoint save failed (non-blocking)', {
          courseId, chapter: outcome.position, error: err instanceof Error ? err.message : String(err),
        });
      });
    }
  };

  // ── Process batches sequentially, chapters within each batch in parallel ──
  let chaptersCreated = completedChapters.length;
  let sectionsCreated = completedChapters.reduce((sum, ch) => sum + ch.sections.length, 0);
  const allFailedPositions: number[] = [];
  let batchIndex = 0;

  while (remainingPositions.length > 0) {
    if (abortSignal?.aborted) break;

    // Dynamic slice: take currentBatchSize chapters from remaining
    const batch = remainingPositions.splice(0, currentBatchSize);
    const batchNumber = batchIndex + 1;
    const totalBatches = batchNumber + Math.ceil(remainingPositions.length / currentBatchSize);

    logger.info('[PARALLEL_PIPELINE] Starting batch', {
      courseId, batchNumber, totalBatches, chapters: batch, currentBatchSize, runId,
    });

    onSSEEvent?.({
      type: 'parallel_batch_start',
      data: {
        courseId,
        batchNumber,
        totalBatches,
        chapters: batch,
      },
    });

    // Track batch start time for adaptive sizing
    const batchStartTime = Date.now();

    // ── Run batch in parallel with batch-level timeout ──
    // Fix 5: Batch-level timeout as defense-in-depth above per-chapter timeouts.
    const batchTimeoutMs = perChapterTimeoutMs * batch.length * 1.2;
    let outcomes: PromiseSettledResult<ChapterOutcome>[];

    try {
      outcomes = await withTimeout(
        () => Promise.allSettled(batch.map((position) => generateChapter(position))),
        batchTimeoutMs,
        `parallel_batch_${batchNumber}`,
      );
    } catch (batchError) {
      if (batchError instanceof OperationTimeoutError) {
        logger.error('[PARALLEL_PIPELINE] Batch timed out — all chapters in batch become fallback', {
          courseId, batchNumber, chapters: batch, timeoutMs: batchTimeoutMs, runId,
        });
        allFailedPositions.push(...batch);
        continue; // Skip to next batch
      }
      throw batchError; // Re-throw unexpected errors
    }

    // ── Collect batch results ──
    // Fix 2: Handle rejected promises properly instead of silently skipping them.
    // generateChapter() has its own try/catch and returns ChapterOutcome with
    // status='rejected', but the abort check (now inside try/catch) or unexpected
    // errors could still cause a raw Promise rejection via Promise.allSettled.
    const batchFailed: number[] = [];

    for (let i = 0; i < outcomes.length; i++) {
      const outcome = outcomes[i];

      if (outcome.status === 'rejected') {
        // Raw Promise rejection — track by batch index position
        logger.error('[PARALLEL_PIPELINE] Raw promise rejection for chapter', {
          courseId, chapter: batch[i], error: outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason), runId,
        });
        batchFailed.push(batch[i]);
        continue;
      }

      // outcome.status === 'fulfilled' — our ChapterOutcome
      const result = outcome.value;
      if (result.status === 'fulfilled' && result.result) {
        mergeChapterResult(result);
        chaptersCreated += result.result.chaptersCreated;
        sectionsCreated += result.result.sectionsCreated;
      } else {
        batchFailed.push(result.position);
      }
    }

    // ── Retry failed chapters in this batch once ──
    if (batchFailed.length > 0 && !abortSignal?.aborted) {
      logger.info('[PARALLEL_PIPELINE] Retrying failed chapters in batch', {
        courseId, batchNumber, failedChapters: batchFailed, runId,
      });

      onSSEEvent?.({
        type: 'parallel_retry_start',
        data: { courseId, chapters: batchFailed },
      });

      const retryOutcomes = await Promise.allSettled(
        batchFailed.map((position) => generateChapter(position, true)),
      );

      // Fix 2: Same robust handling for retry outcomes
      for (let i = 0; i < retryOutcomes.length; i++) {
        const outcome = retryOutcomes[i];

        if (outcome.status === 'rejected') {
          logger.error('[PARALLEL_PIPELINE] Raw promise rejection on retry', {
            courseId, chapter: batchFailed[i], error: outcome.reason instanceof Error ? outcome.reason.message : String(outcome.reason), runId,
          });
          allFailedPositions.push(batchFailed[i]);
          continue;
        }

        const result = outcome.value;
        if (result.status === 'fulfilled' && result.result) {
          mergeChapterResult(result);
          chaptersCreated += result.result.chaptersCreated;
          sectionsCreated += result.result.sectionsCreated;
        } else {
          allFailedPositions.push(result.position);
        }
      }
    }

    // ── Emit batch completion ──
    const batchCompletedCount = completedChapters.length;
    const batchElapsedMs = Date.now() - batchStartTime;
    const successfulInBatch = batch.length - batchFailed.length;

    onSSEEvent?.({
      type: 'parallel_batch_complete',
      data: {
        courseId,
        batchNumber,
        totalBatches,
        completedChapters: batchCompletedCount,
        totalChapters,
        failedInBatch: batchFailed.length,
      },
    });

    logger.info('[PARALLEL_PIPELINE] Batch complete', {
      courseId, batchNumber, totalBatches,
      completedSoFar: batchCompletedCount,
      totalChapters,
      batchElapsedMs,
      runId,
    });

    // ── Adaptive batch sizing based on observed timing ──
    if (successfulInBatch > 0 && remainingPositions.length > 0) {
      const avgPerChapterMs = batchElapsedMs / successfulInBatch;
      const previousSize = currentBatchSize;

      if (avgPerChapterMs > 60_000 && currentBatchSize > 1) {
        // Chapters taking >60s avg → decrease batch size
        currentBatchSize = Math.max(1, currentBatchSize - 1);
      } else if (avgPerChapterMs < 20_000 && currentBatchSize < 5) {
        // Chapters taking <20s avg → increase batch size
        currentBatchSize = Math.min(5, currentBatchSize + 1);
      }

      if (currentBatchSize !== previousSize) {
        const reason = avgPerChapterMs > 60_000
          ? `Avg ${Math.round(avgPerChapterMs / 1000)}s/chapter exceeds 60s threshold`
          : `Avg ${Math.round(avgPerChapterMs / 1000)}s/chapter below 20s threshold`;

        onSSEEvent?.({
          type: 'adaptive_batch_size',
          data: {
            courseId,
            previousSize,
            newSize: currentBatchSize,
            avgTimeMs: Math.round(avgPerChapterMs),
            reason,
          },
        });

        logger.info('[PARALLEL_PIPELINE] Adaptive batch size adjusted', {
          courseId, previousSize, newSize: currentBatchSize,
          avgPerChapterMs: Math.round(avgPerChapterMs), reason, runId,
        });
      }
    }

    // ── Inter-batch coherence check (rule-based, ~50ms) ──
    if (completedChapters.length >= 2) {
      const coherenceWarnings = checkInterBatchCoherence(completedChapters);
      for (const warning of coherenceWarnings) {
        onSSEEvent?.({
          type: 'coherence_warning',
          data: {
            courseId,
            chapterA: warning.chapterA,
            chapterB: warning.chapterB,
            titleA: warning.titleA,
            titleB: warning.titleB,
            similarity: warning.similarity,
            message: `Chapters ${warning.chapterA} ("${warning.titleA}") and ${warning.chapterB} ("${warning.titleB}") have ${warning.similarity}% section title keyword overlap`,
          },
        });
      }
    }

    // ── Save checkpoint after each batch so auto-reconnect can resume ──
    if (planId && batchCompletedCount > 0) {
      await saveCheckpointWithRetry(courseId, userId, planId, {
        conceptTracker: { concepts: new Map(), vocabulary: [], skillsBuilt: [] },
        bloomsProgression,
        allSectionTitles,
        qualityScores,
        completedChapterCount: batchCompletedCount,
        config,
        goalId,
        planId,
        stepIds,
        courseId,
        completedChaptersList: completedChapters,
        percentage: Math.round((batchCompletedCount / totalChapters) * 100),
        status: 'in_progress',
        lastCompletedStage: 3,
        currentChapterNumber: batchCompletedCount,
        promptVersion: PROMPT_VERSION,
      });

      logger.info('[PARALLEL_PIPELINE] Checkpoint saved after batch', {
        courseId, batchNumber, completedChapters: batchCompletedCount, runId,
      });
    }

    batchIndex++;
  }

  // ── Handle permanently failed chapters with fallbacks ──
  // Fix 1: Persist fallback chapters to DB so the course is always structurally complete.
  // Previously, buildFallbackChapter() was called but the result was discarded — no DB
  // write, no addition to completedChapters, leaving gaps in the course structure.
  if (allFailedPositions.length > 0) {
    logger.warn('[PARALLEL_PIPELINE] Chapters failed after retry — persisting fallbacks to DB', {
      courseId, failedPositions: allFailedPositions, runId,
    });

    for (const position of allFailedPositions) {
      try {
        const fallback = buildFallbackChapter(position, courseContext);

        // Persist chapter to DB
        const dbChapter = await db.chapter.create({
          data: {
            title: fallback.title,
            description: sanitizeHtmlOutput(fallback.description),
            courseGoals: fallback.learningObjectives.join('\n'),
            learningOutcomes: fallback.learningObjectives.join('\n'),
            position: fallback.position,
            courseId,
            estimatedTime: fallback.estimatedTime,
            prerequisites: fallback.prerequisites,
            targetBloomsLevel: fallback.bloomsLevel,
            sectionCount: courseContext.sectionsPerChapter,
            isPublished: false,
          },
        });

        // Build and persist fallback sections
        const fallbackSections: CompletedSection[] = [];
        for (let secNum = 1; secNum <= courseContext.sectionsPerChapter; secNum++) {
          const fbSection = buildFallbackSection(secNum, fallback, allSectionTitles);
          const fbDetails = buildFallbackDetails(fallback, fbSection, courseContext);

          const durationMinutes = parseDuration(fbSection.estimatedDuration);
          const dbSection = await db.section.create({
            data: {
              title: fbSection.title,
              position: fbSection.position,
              chapterId: dbChapter.id,
              type: fbSection.contentType,
              duration: durationMinutes,
              description: sanitizeHtmlOutput(fbDetails.description),
              learningObjectives: fbDetails.learningObjectives.join('\n'),
              creatorGuidelines: sanitizeHtmlOutput(fbDetails.creatorGuidelines) || null,
              practicalActivity: sanitizeHtmlOutput(fbDetails.practicalActivity) || null,
              keyConceptsCovered: fbDetails.keyConceptsCovered.join('\n') || null,
              isPublished: false,
            },
          });

          allSectionTitles.push(fbSection.title);
          fallbackSections.push({
            ...fbSection,
            id: dbSection.id,
            details: fbDetails,
          });
        }

        // Construct proper CompletedChapter and merge into accumulators
        const completedFallback: CompletedChapter = {
          ...fallback,
          id: dbChapter.id,
          sections: fallbackSections,
        };
        completedChapters.push(completedFallback);
        qualityScores.push(buildDefaultQualityScore(30, position, 1));
        bloomsProgression.push({
          chapter: position,
          level: fallback.bloomsLevel as BloomsLevel,
          topics: fallback.keyTopics,
        });
        chaptersCreated++;
        sectionsCreated += fallbackSections.length;

        onSSEEvent?.({
          type: 'parallel_chapter_fallback',
          data: {
            courseId,
            chapter: position,
            title: fallback.title,
            id: dbChapter.id,
            isFallback: true,
            qualityScore: 30,
            sectionCount: fallbackSections.length,
            reason: 'Generation failed after retry — using template fallback',
          },
        });

        logger.info('[PARALLEL_PIPELINE] Fallback chapter persisted to DB', {
          courseId, chapter: position, chapterId: dbChapter.id, sections: fallbackSections.length, runId,
        });
      } catch (fbError) {
        // Log but don't crash the pipeline if a single fallback fails to persist
        logger.error('[PARALLEL_PIPELINE] Failed to persist fallback chapter', {
          courseId, chapter: position, error: fbError instanceof Error ? fbError.message : String(fbError), runId,
        });
      }
    }
  }

  // Sort completedChapters by position (parallel execution may complete out of order)
  completedChapters.sort((a, b) => a.position - b.position);

  // Emit parallel generation complete
  onSSEEvent?.({
    type: 'parallel_generation_complete',
    data: {
      courseId,
      chaptersCreated,
      sectionsCreated,
      failedChapters: allFailedPositions.length,
      totalChapters,
      totalBatches,
    },
  });

  logger.info('[PARALLEL_PIPELINE] Parallel generation complete', {
    courseId,
    chaptersCreated,
    sectionsCreated,
    failedChapters: allFailedPositions.length,
    totalBatches,
    runId,
  });

  return { chaptersCreated, sectionsCreated, allSections };
}
