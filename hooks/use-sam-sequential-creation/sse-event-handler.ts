/**
 * SSE Event Handler — Stateless event processing for course creation SSE streams.
 *
 * Contains two pure-ish functions:
 *  - `parseSSEChunk()` — converts raw SSE text into typed event objects
 *  - `handleSSEEvent()` — maps a single parsed event to React state updates
 *
 * Both functions are framework-agnostic: they accept context (state setters,
 * refs, callbacks) as parameters so the main React hook can inject them.
 */

import { logger } from '@/lib/logger';
import type { CreationProgress, CreationStage, ChapterDetailState } from '@/lib/sam/course-creation/types';
import type { ParsedSSEEvent, SSEHandlerContext, SSEEventResult } from './types';
import { clearPartialCourseId, setPartialCourseId } from './types';
import { calculateETA } from './eta-calculator';

// ============================================================================
// SSE Chunk Parser
// ============================================================================

/**
 * Parse a raw SSE chunk into structured events.
 * Handles multiple events within a single chunk (separated by double newlines).
 */
export function parseSSEChunk(chunk: string): ParsedSSEEvent[] {
  const events: ParsedSSEEvent[] = [];
  const blocks = chunk.split('\n\n').filter(Boolean);

  for (const block of blocks) {
    let eventName = 'message';
    let dataStr = '';

    for (const line of block.split('\n')) {
      if (line.startsWith('event: ')) {
        eventName = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        dataStr = line.slice(6);
      }
    }

    if (dataStr) {
      try {
        events.push({ event: eventName, data: JSON.parse(dataStr) });
      } catch {
        logger.warn('[SEQUENTIAL_SSE] Failed to parse SSE data:', dataStr);
      }
    }
  }

  return events;
}

// ============================================================================
// SSE Event Handler
// ============================================================================

/**
 * Process a single SSE event and update React state accordingly.
 * Used by both startCreation and resumeCreation for identical UI behavior.
 *
 * Returns an SSEEventResult if a terminal event (complete/error) was received,
 * or an empty object for non-terminal events.
 */
export function handleSSEEvent(
  sseEvent: ParsedSSEEvent,
  ctx: SSEHandlerContext,
): SSEEventResult {
  const { event, data } = sseEvent;
  const {
    setProgress, setError, setResumableCourseId,
    startTimeRef, itemTimestampsRef, totalItemsRef,
    progressRef, lastCourseIdRef, callbacks,
  } = ctx;

  switch (event) {
    case 'progress': {
      const stage = (data.stage as number) ?? 1;
      const phase = (data.phase as string) ?? 'generating_chapter';
      const percentage = (data.percentage as number) ?? 0;
      const message = (data.message as string) ?? '';
      const serverCompleted = data.completedItems as number | undefined;
      const serverTotal = data.totalItems as number | undefined;

      // Update totalItemsRef if server provides authoritative count
      if (serverTotal && serverTotal > 0) {
        totalItemsRef.current = serverTotal;
      }

      setProgress(prev => ({
        ...prev,
        state: {
          ...prev.state,
          stage: (Math.max(1, Math.min(3, stage)) as CreationStage),
          phase: phase as CreationProgress['state']['phase'],
        },
        percentage: Math.min(100, percentage),
        message,
        // Store server-side item counters for UI display
        ...(serverCompleted != null ? { serverCompletedItems: serverCompleted } : {}),
        ...(serverTotal != null ? { serverTotalItems: serverTotal } : {}),
      }));

      if (callbacks.onProgress) {
        callbacks.onProgress(progressRef.current);
      }
      return {};
    }

    case 'stage_start': {
      const rawStage = data.stage;
      const message = data.message as string;
      // Track courseId if present for auto-reconnect
      if (data.courseId) {
        lastCourseIdRef.current = data.courseId as string;
      }

      const stageNum = Number(rawStage);
      const numericStage = (Math.max(1, Math.min(3, isNaN(stageNum) ? 1 : stageNum)) as CreationStage);
      const phase = stageNum === 1 ? 'generating_chapter' : stageNum === 2 ? 'generating_section' : 'generating_details';

      setProgress(prev => ({
        ...prev,
        state: {
          ...prev.state,
          stage: numericStage,
          phase,
          ...(data.courseId ? { courseId: data.courseId as string } : {}),
        },
        message: message || `Starting stage ${rawStage}...`,
      }));
      return {};
    }

    case 'item_generating': {
      const stage = data.stage as number;
      const chapter = data.chapter as number | undefined;
      const section = data.section as number | undefined;
      const title = data.title as string | undefined;
      const message = data.message as string;

      // Determine phase based on stage and whether section is present:
      // - Stage 1 or (Stage 2 without section) = generating_chapter
      // - Stage 2 with section = generating_section
      // - Stage 3 = generating_details
      let phase: CreationProgress['state']['phase'];
      if (stage === 3) {
        phase = 'generating_details';
      } else if (stage === 2 && !section) {
        phase = 'generating_chapter';
      } else if (stage === 2 && section) {
        phase = 'generating_section';
      } else {
        phase = 'generating_chapter';
      }

      setProgress(prev => ({
        ...prev,
        state: {
          ...prev.state,
          stage: (Math.max(1, Math.min(3, stage)) as CreationStage),
          phase,
          currentChapter: chapter ?? prev.state.currentChapter,
          currentSection: section ?? prev.state.currentSection,
        },
        currentItem: title
          ? (stage === 3 && chapter ? `Section ${section ?? ''} of Chapter ${chapter}: ${title}` : `${title}`)
          : message,
      }));
      return {};
    }

    case 'thinking': {
      const thinking = data.thinking as string;
      if (thinking) {
        setProgress(prev => ({ ...prev, thinking }));
        if (callbacks.onThinking) callbacks.onThinking(thinking);
      }
      return {};
    }

    case 'thinking_chunk': {
      const chunk = data.chunk as string;
      if (chunk) {
        setProgress(prev => ({ ...prev, thinking: (prev.thinking ?? '') + chunk }));
      }
      return {};
    }

    case 'total_items': {
      // Server sends authoritative total items count (using template-based section counts)
      const serverTotalItems = data.totalItems as number;
      if (serverTotalItems > 0) {
        totalItemsRef.current = serverTotalItems;
      }
      const serverTotalChapters = data.totalChapters as number | undefined;
      setProgress(prev => ({
        ...prev,
        state: {
          ...prev.state,
          ...(serverTotalChapters ? { totalChapters: serverTotalChapters } : {}),
        },
      }));
      return {};
    }

    case 'chapter_count_adjusted': {
      // Blueprint AI adjusted chapter count — update frontend state
      const resolved = data.resolved as number;
      setProgress(prev => ({
        ...prev,
        state: {
          ...prev.state,
          totalChapters: resolved,
        },
      }));
      return {};
    }

    case 'resume_hydrate': {
      return handleResumeHydrate(data, ctx);
    }

    case 'item_complete': {
      return handleItemComplete(data, ctx);
    }

    case 'stage_complete': {
      const stage = data.stage as number;
      if (callbacks.onStageComplete) {
        callbacks.onStageComplete(stage as CreationStage, []);
      }
      return {};
    }

    case 'complete': {
      // Deduplicate: ignore duplicate complete events from multiple layers
      if (ctx.progressRef.current.state.phase === 'complete') {
        logger.debug('[SEQUENTIAL_SSE] Ignoring duplicate complete event');
        return {};
      }
      return handleComplete(data, ctx);
    }

    case 'error': {
      return handleError(data, ctx);
    }

    case 'pipeline_paused': {
      const pauseMessage = (data.message as string) ?? 'Pipeline paused for human review.';
      const pausedCourseId = data.courseId as string | undefined;
      if (pausedCourseId) {
        lastCourseIdRef.current = pausedCourseId;
        setPartialCourseId(pausedCourseId);
        setResumableCourseId(pausedCourseId);
      }

      setError(pauseMessage);
      setProgress(prev => ({
        ...prev,
        state: { ...prev.state, phase: 'paused', error: pauseMessage },
        message: pauseMessage,
      }));

      if (callbacks.onError) {
        callbacks.onError(pauseMessage, true);
      }

      const chaptersCreated = progressRef.current.completedItems.chapters.length;
      const sectionsCreated = progressRef.current.completedItems.sections.length;
      return {
        gotError: true,
        result: {
          success: false,
          courseId: pausedCourseId,
          chaptersCreated,
          sectionsCreated,
          stats: {
            totalChapters: chaptersCreated,
            totalSections: sectionsCreated,
            totalTime: Date.now() - startTimeRef.current,
            averageQualityScore: 0,
          },
          error: pauseMessage,
        },
      };
    }

    // --- Informational events: update message so UI doesn't appear stuck ---

    case 'planning_start': {
      setProgress(prev => ({
        ...prev,
        message: (data.message as string) ?? 'Planning course blueprint...',
      }));
      return {};
    }

    case 'planning_complete': {
      setProgress(prev => ({
        ...prev,
        message: (data.message as string) ?? 'Course blueprint ready',
      }));
      return {};
    }

    case 'quality_retry': {
      const stage = data.stage as number;
      const attempt = data.attempt as number;
      setProgress(prev => ({
        ...prev,
        message: `Improving quality (attempt ${attempt}, stage ${stage})...`,
      }));
      return {};
    }

    case 'critic_review': {
      const verdict = data.verdict as string;
      setProgress(prev => ({
        ...prev,
        message: verdict === 'revise'
          ? 'Reviewer requested improvements, refining...'
          : 'Quality review passed',
      }));
      return {};
    }

    case 'replan_start': {
      setProgress(prev => ({
        ...prev,
        message: 'Re-planning remaining chapters...',
      }));
      return {};
    }

    case 'replan_complete': {
      setProgress(prev => ({
        ...prev,
        message: 'Re-planning complete, continuing...',
      }));
      return {};
    }

    case 'inline_healing': {
      const healChapter = data.chapter as number;
      setProgress(prev => ({
        ...prev,
        message: `Improving chapter ${healChapter} quality...`,
      }));
      return {};
    }

    case 'inline_healing_complete': {
      setProgress(prev => ({
        ...prev,
        message: 'Quality improvement complete, continuing...',
      }));
      return {};
    }

    case 'course_reflection':
    case 'ai_reflection': {
      setProgress(prev => ({
        ...prev,
        message: 'Analyzing course coherence...',
      }));
      return {};
    }

    case 'healing_start': {
      setProgress(prev => ({
        ...prev,
        message: 'Running autonomous quality improvement...',
      }));
      return {};
    }

    case 'healing_complete': {
      setProgress(prev => ({
        ...prev,
        message: 'Quality improvement complete',
      }));
      return {};
    }

    case 'quality_flag': {
      const flagData = {
        chapterPosition: data.chapterPosition as number,
        chapterTitle: (data.chapterTitle as string) ?? '',
        reason: (data.reason as string) ?? '',
        severity: (data.severity as 'low' | 'medium' | 'high') ?? 'medium',
        action: (data.action as 'auto_healed' | 'pending_review') ?? 'pending_review',
        timestamp: new Date().toISOString(),
      };
      setProgress(prev => ({
        ...prev,
        qualityFlags: [...(prev.qualityFlags ?? []), flagData],
      }));
      return {};
    }

    // ── Parallel Generation Events ──

    case 'parallel_generation_start': {
      const chapterPositions = (data.chapterPositions ?? []) as number[];
      const batchSizeVal = (data.batchSize as number) ?? 3;
      const totalBatchesVal = (data.totalBatches as number) ?? Math.ceil(chapterPositions.length / batchSizeVal);

      // Initialize chapterDetails for all chapters
      const chapterDetails: Record<number, ChapterDetailState> = {};
      for (const pos of chapterPositions) {
        chapterDetails[pos] = {
          position: pos,
          title: `Chapter ${pos}`,
          status: 'pending',
          currentStage: 0,
          stageName: 'Waiting',
          stagesCompleted: [],
          totalSections: 0,
          completedSections: 0,
          retryCount: 0,
          isFallback: false,
          events: [],
        };
      }

      setProgress(prev => ({
        ...prev,
        state: { ...prev.state, phase: 'generating_chapter' },
        message: `Starting parallel generation of ${chapterPositions.length} chapters (${totalBatchesVal} batches of ${batchSizeVal})...`,
        parallelBatch: {
          currentBatch: 0,
          totalBatches: totalBatchesVal,
          batchSize: batchSizeVal,
          activeChapters: [],
        },
        chapterDetails,
      }));
      return {};
    }

    case 'parallel_batch_start': {
      const batchNumber = (data.batchNumber as number) ?? 1;
      const batchTotalBatches = (data.totalBatches as number) ?? 1;
      const batchChapters = (data.chapters ?? []) as number[];
      setProgress(prev => ({
        ...prev,
        message: `Batch ${batchNumber}/${batchTotalBatches}: generating chapters ${batchChapters.join(', ')}...`,
        parallelBatch: {
          ...prev.parallelBatch,
          currentBatch: batchNumber,
          totalBatches: batchTotalBatches,
          activeChapters: batchChapters,
        },
      }));
      return {};
    }

    case 'parallel_batch_complete': {
      const completedBatch = (data.batchNumber as number) ?? 1;
      const batchTotal = (data.totalBatches as number) ?? 1;
      const completedSoFar = (data.completedChapters as number) ?? 0;
      const totalCh = (data.totalChapters as number) ?? totalItemsRef.current;
      setProgress(prev => ({
        ...prev,
        message: completedBatch < batchTotal
          ? `Batch ${completedBatch}/${batchTotal} complete (${completedSoFar}/${totalCh} chapters). Starting next batch...`
          : `All ${batchTotal} batches complete (${completedSoFar}/${totalCh} chapters).`,
        parallelBatch: {
          ...prev.parallelBatch,
          currentBatch: completedBatch,
          activeChapters: [],
        },
      }));
      return {};
    }

    case 'parallel_chapter_stage_change': {
      const stagePos = data.chapter as number;
      const stage = data.stage as number;
      const stageName = data.stageName as string;
      const totalSectionsFromEvent = data.totalSections as number | undefined;

      setProgress(prev => {
        const details = { ...(prev.chapterDetails ?? {}) };
        const ch = details[stagePos];
        if (!ch) return prev;

        details[stagePos] = {
          ...ch,
          status: 'generating',
          currentStage: stage,
          stageName,
          ...(totalSectionsFromEvent != null ? { totalSections: totalSectionsFromEvent } : {}),
          events: [...ch.events, {
            timestamp: Date.now(),
            type: 'stage_start',
            message: `Starting ${stageName} (Stage ${stage})`,
            data: { stage, stageName },
          }],
        };
        return { ...prev, chapterDetails: details };
      });
      return {};
    }

    case 'parallel_chapter_complete': {
      const chapterPos = data.chapter as number;
      const title = (data.title as string) ?? `Chapter ${chapterPos}`;
      const qualityScore = data.qualityScore as number | undefined;
      const courseId = data.courseId as string | undefined;
      const chapterId = (data.id as string) ?? '';
      if (courseId) lastCourseIdRef.current = courseId;

      // Record timestamp for ETA (must happen before calculateETA)
      itemTimestampsRef.current.push(Date.now());

      setProgress(prev => {
        const existingChapters = prev.completedItems?.chapters ?? [];
        const existingSections = prev.completedItems?.sections ?? [];

        // Robust dedup: filter out any existing entry with the same position,
        // then add/replace with the latest data. This prevents the 180% bug
        // where findIndex dedup could fail and produce duplicate entries.
        const withoutCurrent = existingChapters.filter(ch => ch.position !== chapterPos);
        const existing = existingChapters.find(ch => ch.position === chapterPos);
        const updatedChapters = [
          ...withoutCurrent,
          {
            position: chapterPos,
            title: title || existing?.title || `Chapter ${chapterPos}`,
            id: chapterId || existing?.id,
            ...(qualityScore != null ? { qualityScore } : existing?.qualityScore != null ? { qualityScore: existing.qualityScore } : {}),
          },
        ].sort((a, b) => a.position - b.position);

        const completedCount = updatedChapters.length;
        // In parallel mode, totalItemsRef holds the sequential formula (chapters + 2*sections),
        // which is wrong for per-chapter percentage. Use state.totalChapters instead.
        const actualTotalChapters = prev.state.totalChapters || totalItemsRef.current || 1;
        const percentage = Math.min(95, Math.round((completedCount / actualTotalChapters) * 95));

        // Update chapterDetails with completion info
        const details = { ...(prev.chapterDetails ?? {}) };
        const existingDetail = details[chapterPos];
        const sectionCount = data.sectionCount as number | undefined;
        details[chapterPos] = {
          ...(existingDetail ?? {
            position: chapterPos,
            events: [],
            retryCount: 0,
            isFallback: false,
            stagesCompleted: [],
            totalSections: 0,
            completedSections: 0,
          }),
          title,
          status: 'complete',
          currentStage: 3,
          stageName: 'Complete',
          stagesCompleted: [1, 2, 3],
          qualityScore,
          id: chapterId || undefined,
          bloomsLevel: data.bloomsLevel as string | undefined,
          keyTopics: data.keyTopics as string[] | undefined,
          completedSections: sectionCount ?? existingDetail?.totalSections ?? 0,
          ...(sectionCount != null ? { totalSections: sectionCount } : {}),
          events: [...(existingDetail?.events ?? []), {
            timestamp: Date.now(),
            type: 'complete' as const,
            message: `Chapter completed${qualityScore != null ? ` with ${qualityScore}% quality` : ''}`,
            data: { qualityScore, bloomsLevel: data.bloomsLevel },
          }],
        };

        return {
          ...prev,
          percentage,
          message: `Chapter ${chapterPos} complete: ${title}`,
          state: {
            ...prev.state,
            currentChapter: chapterPos,
            phase: 'generating_chapter',
            ...(courseId ? { courseId } : {}),
          },
          completedItems: {
            chapters: updatedChapters,
            sections: existingSections,
          },
          chapterDetails: details,
          timing: {
            ...prev.timing,
            eta: calculateETA({
              timestamps: itemTimestampsRef.current,
              startTime: startTimeRef.current,
              totalItems: actualTotalChapters,
            }),
          },
        };
      });
      return {};
    }

    case 'parallel_chapter_failed': {
      const failedChapter = data.chapter as number;
      const errorMsg = (data.error as string) ?? 'Unknown error';
      const errorType = (data.errorType as string) ?? 'unknown';
      const isRetryEvent = data.isRetry as boolean ?? false;

      logger.warn('[SSE] Parallel chapter failed', { chapter: failedChapter, error: errorMsg });

      // Update chapterDetails with failure info
      setProgress(prev => {
        const details = { ...(prev.chapterDetails ?? {}) };
        const existing = details[failedChapter];
        details[failedChapter] = {
          ...(existing ?? {
            position: failedChapter,
            events: [],
            isFallback: false,
            stagesCompleted: [],
            totalSections: 0,
            completedSections: 0,
          }),
          title: existing?.title ?? `Chapter ${failedChapter}`,
          status: 'failed',
          currentStage: existing?.currentStage ?? 0,
          stageName: 'Failed',
          error: errorMsg,
          errorType,
          retryCount: (existing?.retryCount ?? 0) + (isRetryEvent ? 1 : 0),
          events: [...(existing?.events ?? []), {
            timestamp: Date.now(),
            type: 'error' as const,
            message: `Generation failed: ${errorMsg}`,
            data: { error: errorMsg, errorType, isRetry: isRetryEvent },
          }],
        };
        return { ...prev, chapterDetails: details };
      });
      // Don't set terminal error — other chapters may still complete
      return {};
    }

    case 'parallel_chapter_fallback': {
      const fbPos = data.chapter as number;
      const fbTitle = (data.title as string) ?? `Chapter ${fbPos}`;
      const fbId = data.id as string | undefined;
      const fbReason = (data.reason as string) ?? 'Generation failed';
      const fbSectionCount = data.sectionCount as number | undefined;

      logger.info('[SSE] Parallel chapter using fallback', { chapter: fbPos });

      setProgress(prev => {
        const details = { ...(prev.chapterDetails ?? {}) };
        const existing = details[fbPos];
        details[fbPos] = {
          ...(existing ?? {
            position: fbPos,
            events: [],
            retryCount: 0,
            stagesCompleted: [],
            totalSections: 0,
            completedSections: 0,
            currentStage: 0,
          }),
          title: fbTitle,
          status: 'fallback',
          id: fbId,
          isFallback: true,
          fallbackReason: fbReason,
          qualityScore: 30,
          stageName: 'Fallback',
          ...(fbSectionCount != null ? { totalSections: fbSectionCount, completedSections: fbSectionCount } : {}),
          events: [...(existing?.events ?? []), {
            timestamp: Date.now(),
            type: 'fallback' as const,
            message: `Using fallback content: ${fbReason}`,
            data: { reason: fbReason },
          }],
        };

        // Also add to completedItems.chapters (with dedup)
        const existingChapters = prev.completedItems?.chapters ?? [];
        const withoutCurrent = existingChapters.filter(ch => ch.position !== fbPos);
        const updatedChapters = [
          ...withoutCurrent,
          { position: fbPos, title: fbTitle, id: fbId, qualityScore: 30 },
        ].sort((a, b) => a.position - b.position);

        return {
          ...prev,
          chapterDetails: details,
          completedItems: {
            ...prev.completedItems,
            chapters: updatedChapters,
            sections: prev.completedItems?.sections ?? [],
          },
        };
      });
      return {};
    }

    case 'parallel_retry_start': {
      const retryChapters = (data.chapters ?? []) as number[];

      setProgress(prev => {
        const details = { ...(prev.chapterDetails ?? {}) };
        for (const pos of retryChapters) {
          const existing = details[pos];
          if (existing) {
            details[pos] = {
              ...existing,
              status: 'generating',
              stageName: 'Retrying',
              retryCount: existing.retryCount + 1,
              error: undefined,
              errorType: undefined,
              events: [...existing.events, {
                timestamp: Date.now(),
                type: 'retry' as const,
                message: `Retrying chapter (attempt ${existing.retryCount + 1})`,
              }],
            };
          }
        }
        return {
          ...prev,
          chapterDetails: details,
          message: `Retrying ${retryChapters.length} failed chapter(s)...`,
        };
      });
      return {};
    }

    case 'parallel_generation_complete': {
      // Fix 7a: Update progress to show near-completion so the UI doesn't appear
      // stuck if the stream ends between this event and the terminal 'complete'.
      const pgcChaptersCreated = (data.chaptersCreated as number) ?? 0;
      const pgcFailed = (data.failedChapters as number) ?? 0;
      const pgcCourseId = data.courseId as string | undefined;
      if (pgcCourseId) lastCourseIdRef.current = pgcCourseId;

      setProgress(prev => ({
        ...prev,
        percentage: 97,
        message: pgcFailed > 0
          ? `All chapters generated (${pgcFailed} used fallback). Finalizing course...`
          : `All ${pgcChaptersCreated} chapters generated. Finalizing course...`,
        state: {
          ...prev.state,
          phase: 'generating_chapter',
          ...(pgcCourseId ? { courseId: pgcCourseId } : {}),
        },
        parallelBatch: prev.parallelBatch ? {
          ...prev.parallelBatch,
          activeChapters: [],
        } : undefined,
      }));
      return {};
    }

    case 'parallel_model_info': {
      const model = data.model as string;
      const provider = data.provider as string;
      const isReasoning = data.isReasoningModel as boolean;
      const modelBatchSize = data.batchSize as number;
      logger.info('[SSE] Parallel model info', { model, provider, isReasoningModel: isReasoning });

      setProgress(prev => ({
        ...prev,
        modelInfo: { provider, model, isReasoningModel: isReasoning, batchSize: modelBatchSize },
      }));
      return {};
    }

    case 'agentic_decision':
    case 'bridge_content':
    case 'chapter_skipped':
    case 'critic_revision_accepted':
    case 'self_critique':
    case 'healing_chapter':
    case 'healing_diagnosis':
    case 'state_change': {
      // Acknowledged but no UI state change needed
      return {};
    }

    default:
      return {};
  }
}

// ============================================================================
// Complex Event Handlers (extracted for readability)
// ============================================================================

/**
 * Handle the `resume_hydrate` batch event: set all previously-completed items
 * in a single state update — no per-chapter event flooding that makes the UI
 * look like it's "starting from the beginning."
 */
function handleResumeHydrate(
  data: Record<string, unknown>,
  ctx: SSEHandlerContext,
): SSEEventResult {
  const { setProgress, lastCourseIdRef } = ctx;

  const courseId = data.courseId as string | undefined;
  const chapters = (data.completedChapters ?? []) as Array<{ position: number; title: string; id?: string }>;
  const sections = (data.completedSections ?? []) as Array<{ chapterPosition: number; position: number; title: string; id?: string }>;
  const completedChapterCount = (data.completedChapterCount as number) ?? chapters.length;

  if (courseId) {
    lastCourseIdRef.current = courseId;
  }

  setProgress(prev => ({
    ...prev,
    state: {
      ...prev.state,
      currentChapter: completedChapterCount,
      phase: 'resuming',
    },
    completedItems: {
      chapters: chapters.map(ch => ({
        position: ch.position,
        title: ch.title,
        id: ch.id,
      })),
      sections: sections.map(sec => ({
        chapterPosition: sec.chapterPosition,
        position: sec.position,
        title: sec.title,
        id: sec.id,
      })),
    },
  }));

  return {};
}

/**
 * Handle the `item_complete` event: track timing, update completed items,
 * and calculate ETA using sliding-window average.
 */
function handleItemComplete(
  data: Record<string, unknown>,
  ctx: SSEHandlerContext,
): SSEEventResult {
  const {
    setProgress, startTimeRef, itemTimestampsRef, totalItemsRef, lastCourseIdRef,
  } = ctx;

  const stage = data.stage as number;
  const title = data.title as string;
  const id = data.id as string | undefined;
  const qualityScore = data.qualityScore as number | undefined;
  const chapter = data.chapter as number | undefined;
  const section = data.section as number | undefined;

  // Server now sends accurate completedItems/totalItems with every item_complete event
  const serverCompletedItems = data.completedItems as number | undefined;
  const serverTotalItems = data.totalItems as number | undefined;
  if (serverTotalItems && serverTotalItems > 0) {
    totalItemsRef.current = serverTotalItems;
  }

  // Track courseId for auto-reconnect (stage 0 events include courseId)
  if (data.courseId) {
    lastCourseIdRef.current = data.courseId as string;
  }

  // Skip timestamp recording for resume-replay and healing items
  // (healing re-generates existing items, shouldn't inflate itemsCompleted)
  const isResumeReplay = data.isResumeReplay as boolean | undefined;
  const isHealing = data.isHealing as boolean | undefined;
  if (!isResumeReplay && !isHealing) {
    itemTimestampsRef.current.push(Date.now());
  }

  const timing = calculateETA({
    timestamps: itemTimestampsRef.current,
    startTime: startTimeRef.current,
    totalItems: totalItemsRef.current,
  });

  // Compute accurate percentage from server-side counters
  const accuratePercentage = (serverCompletedItems != null && serverTotalItems)
    ? Math.min(100, Math.round((serverCompletedItems / serverTotalItems) * 100))
    : undefined;

  // Determine item type:
  // - Chapter completion: stage === 1 && chapter && !section
  // - Section completion: (stage === 2 || stage === 3) && chapter && section
  const isChapter = stage === 1 && chapter && !section && title;
  const isSection = (stage === 2 || stage === 3) && chapter && section && title;

  if (isChapter) {
    setProgress(prev => {
      const base = {
        ...prev,
        timing,
        // Use server-side percentage when available (fixes 0% bug)
        ...(accuratePercentage != null ? { percentage: accuratePercentage } : {}),
      };

      // Robust dedup: filter out any existing entry with the same position,
      // then add/replace. Prevents duplicate chapter entries (180% bug).
      const existing = prev.completedItems.chapters.find(ch => ch.position === chapter);
      const withoutCurrent = prev.completedItems.chapters.filter(ch => ch.position !== chapter);
      const chapters = [
        ...withoutCurrent,
        {
          position: chapter,
          title: title || existing?.title || `Chapter ${chapter}`,
          id: id || existing?.id,
          ...(qualityScore != null ? { qualityScore } : existing?.qualityScore != null ? { qualityScore: existing.qualityScore } : {}),
        },
      ];

      return { ...base, completedItems: { ...prev.completedItems, chapters } };
    });
  } else if (isSection) {
    setProgress(prev => {
      const base = {
        ...prev,
        timing,
        // Use server-side percentage when available (fixes 0% bug)
        ...(accuratePercentage != null ? { percentage: accuratePercentage } : {}),
      };

      // Robust dedup: filter out any existing entry with the same chapter+section position,
      // then add/replace. Prevents duplicate section entries.
      const existing = prev.completedItems.sections.find(s =>
        s.chapterPosition === chapter && s.position === section
      );
      const withoutCurrent = prev.completedItems.sections.filter(s =>
        !(s.chapterPosition === chapter && s.position === section)
      );
      const sections = [
        ...withoutCurrent,
        {
          chapterPosition: chapter,
          position: section,
          title: title || existing?.title || `Section ${section}`,
          id: id || existing?.id,
          ...(qualityScore != null ? { qualityScore } : existing?.qualityScore != null ? { qualityScore: existing.qualityScore } : {}),
        },
      ];

      // Track section completion in chapterDetails (stage 2 = section structure complete)
      const details = { ...(prev.chapterDetails ?? {}) };
      const chDetail = details[chapter];
      if (chDetail && stage === 2) {
        details[chapter] = {
          ...chDetail,
          completedSections: (chDetail.completedSections ?? 0) + 1,
          events: [...chDetail.events, {
            timestamp: Date.now(),
            type: 'section_complete' as const,
            message: `Section "${title}" completed`,
            data: { section, title },
          }],
        };
      }

      return { ...base, completedItems: { ...prev.completedItems, sections }, chapterDetails: details };
    });
  }
  return {};
}

/**
 * Handle the `complete` terminal event: clear localStorage, set final state.
 */
function handleComplete(
  data: Record<string, unknown>,
  ctx: SSEHandlerContext,
): SSEEventResult {
  const { setProgress, setResumableCourseId, startTimeRef } = ctx;

  const courseId = data.courseId as string;
  const chaptersCreated = (data.chaptersCreated as number) ?? 0;
  const sectionsCreated = (data.sectionsCreated as number) ?? 0;
  const totalTime = (data.totalTime as number) ?? (Date.now() - startTimeRef.current);
  const averageQualityScore = (data.averageQualityScore as number) ?? 0;
  const fallbackSummary = data.fallbackSummary as { count: number; rate: number } | undefined;

  // Clear partial course from localStorage on success
  clearPartialCourseId();
  setResumableCourseId(null);

  setProgress(prev => ({
    ...prev,
    state: { ...prev.state, phase: 'complete', courseId },
    percentage: 100,
    message: fallbackSummary && fallbackSummary.count > 0
      ? `Course creation complete (with ${fallbackSummary.count} fallback items).`
      : 'Course creation complete!',
  }));

  return {
    gotComplete: true,
    result: {
      success: true,
      courseId,
      chaptersCreated,
      sectionsCreated,
      fallbackSummary,
      stats: {
        totalChapters: chaptersCreated,
        totalSections: sectionsCreated,
        totalTime,
        averageQualityScore,
      },
    },
  };
}

/**
 * Handle the `error` terminal event: store partial course ID, set error state.
 *
 * Falls back to lastCourseIdRef.current when the server error event doesn't
 * include courseId (e.g. route-level catch, uncaught exception). The ref is
 * populated from earlier stage_start / item_complete events, so if the course
 * was created before the failure, we can still offer Resume.
 */
function handleError(
  data: Record<string, unknown>,
  ctx: SSEHandlerContext,
): SSEEventResult {
  const { setProgress, setError, setResumableCourseId, startTimeRef, lastCourseIdRef, callbacks } = ctx;

  const errorMessage = (data.message as string) ?? 'Unknown error';
  const chaptersCreated = (data.chaptersCreated as number) ?? 0;
  const sectionsCreated = (data.sectionsCreated as number) ?? 0;
  // Prefer courseId from error event data, fall back to the last courseId
  // captured from earlier SSE events (stage_start, item_complete).
  const errorCourseId = (data.courseId as string | undefined) ?? lastCourseIdRef.current ?? undefined;

  // Store partial course ID for resume — seed checkpoint ensures the backend
  // can resume even with 0 completed chapters, so always offer Resume.
  if (errorCourseId) {
    setPartialCourseId(errorCourseId);
    setResumableCourseId(errorCourseId);
  }

  setError(errorMessage);
  setProgress(prev => ({
    ...prev,
    state: { ...prev.state, phase: 'error', error: errorMessage },
    message: errorMessage,
  }));

  if (callbacks.onError) {
    callbacks.onError(errorMessage, true);
  }

  return {
    gotError: true,
    result: {
      success: false,
      courseId: errorCourseId,
      chaptersCreated,
      sectionsCreated,
      stats: {
        totalChapters: chaptersCreated,
        totalSections: sectionsCreated,
        totalTime: Date.now() - startTimeRef.current,
        averageQualityScore: 0,
      },
      error: errorMessage,
    },
  };
}
