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
import type { CreationProgress, CreationStage } from '@/lib/sam/course-creation/types';
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

      setProgress(prev => ({
        ...prev,
        state: {
          ...prev.state,
          stage: (Math.max(1, Math.min(3, stage)) as CreationStage),
          phase: phase as CreationProgress['state']['phase'],
        },
        percentage: Math.min(100, percentage),
        message,
      }));

      if (callbacks.onProgress) {
        callbacks.onProgress(progressRef.current);
      }
      return {};
    }

    case 'stage_start': {
      const stage = data.stage as number;
      const message = data.message as string;
      // Track courseId if present for auto-reconnect
      if (data.courseId) {
        lastCourseIdRef.current = data.courseId as string;
      }

      setProgress(prev => ({
        ...prev,
        state: {
          ...prev.state,
          stage: (Math.max(1, Math.min(3, stage)) as CreationStage),
          phase: stage === 1 ? 'generating_chapter' : stage === 2 ? 'generating_section' : 'generating_details',
        },
        message: message || `Starting stage ${stage}...`,
      }));
      return {};
    }

    case 'item_generating': {
      const stage = data.stage as number;
      const chapter = data.chapter as number | undefined;
      const section = data.section as number | undefined;
      const message = data.message as string;

      setProgress(prev => ({
        ...prev,
        state: {
          ...prev.state,
          stage: (Math.max(1, Math.min(3, stage)) as CreationStage),
          phase: stage === 1 ? 'generating_chapter' : stage === 2 ? 'generating_section' : 'generating_details',
          currentChapter: chapter ?? prev.state.currentChapter,
          currentSection: section ?? prev.state.currentSection,
        },
        currentItem: message,
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
      if (serverTotalChapters) {
        setProgress(prev => ({
          ...prev,
          state: {
            ...prev.state,
            totalChapters: serverTotalChapters,
          },
        }));
      }
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

  if (stage === 1 && chapter && title) {
    // Deduplicate: skip if chapter with same id already exists
    setProgress(prev => {
      if (id && prev.completedItems.chapters.some(ch => ch.id === id)) {
        return { ...prev, timing };
      }
      return {
        ...prev,
        timing,
        completedItems: {
          ...prev.completedItems,
          chapters: [
            ...prev.completedItems.chapters,
            { position: chapter, title, id, qualityScore },
          ],
        },
      };
    });
  } else if ((stage === 2 || stage === 3) && chapter && section && title) {
    // Deduplicate: skip if section with same id already exists
    setProgress(prev => {
      if (id && prev.completedItems.sections.some(s => s.id === id)) {
        return { ...prev, timing };
      }
      return {
        ...prev,
        timing,
        completedItems: {
          ...prev.completedItems,
          sections: [
            ...prev.completedItems.sections,
            { chapterPosition: chapter, position: section, title, id, qualityScore },
          ],
        },
      };
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

  // Clear partial course from localStorage on success
  clearPartialCourseId();
  setResumableCourseId(null);

  setProgress(prev => ({
    ...prev,
    state: { ...prev.state, phase: 'complete' },
    percentage: 100,
    message: 'Course creation complete!',
  }));

  return {
    gotComplete: true,
    result: {
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
    },
  };
}

/**
 * Handle the `error` terminal event: store partial course ID, set error state.
 */
function handleError(
  data: Record<string, unknown>,
  ctx: SSEHandlerContext,
): SSEEventResult {
  const { setProgress, setError, setResumableCourseId, startTimeRef, callbacks } = ctx;

  const errorMessage = (data.message as string) ?? 'Unknown error';
  const chaptersCreated = (data.chaptersCreated as number) ?? 0;
  const sectionsCreated = (data.sectionsCreated as number) ?? 0;
  const errorCourseId = data.courseId as string | undefined;

  // Store partial course ID for resume
  if (errorCourseId && chaptersCreated > 0) {
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
