/**
 * SAM Sequential Course Creation Hook (SSE-based)
 *
 * Connects to the /api/sam/course-creation/orchestrate SSE endpoint which
 * runs all 3 stages server-side with quality gates, retries, and progressive
 * DB saves — all in a single HTTP connection.
 *
 * The hook maps SSE events to CreationProgress state consumed by
 * SequentialCreationModal.
 *
 * Supports transparent auto-reconnection: when the SSE stream ends due to
 * a timeout (without a `complete` or `error` event), the hook automatically
 * reconnects as a resume — the modal continues showing progress seamlessly.
 * This enables courses that take 30-60+ minutes to generate across multiple
 * 15-minute SSE segments.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { logger } from '@/lib/logger';
import type {
  CreationProgress,
  CreationState,
  CreationStage,
  SequentialCreationConfig,
  SequentialCreationResult,
} from '@/lib/sam/course-creation/types';

// ============================================================================
// Types
// ============================================================================

/** DB-based progress data for cross-device resume */
export interface DbProgress {
  hasActiveCreation: boolean;
  courseId: string;
  courseTitle: string;
  completedChapters: number;
  totalChapters: number;
  percentage: number;
  lastSaved: string;
  completedItems: {
    chapters: Array<{ position: number; title: string; id: string; qualityScore?: number }>;
    sections: Array<{ chapterPosition: number; position: number; title: string; id: string }>;
  };
}

interface UseSequentialCreationReturn {
  // State
  progress: CreationProgress;
  isCreating: boolean;
  error: string | null;
  /** Course ID from a failed creation that can be resumed */
  resumableCourseId: string | null;
  /** DB-based progress for cross-device resume banner */
  dbProgress: DbProgress | null;
  /** Chapter ID currently being regenerated (null if none) */
  regeneratingChapterId: string | null;

  // Actions
  startCreation: (config: SequentialCreationConfig) => Promise<SequentialCreationResult>;
  resumeCreation: (courseId: string, config: SequentialCreationConfig) => Promise<SequentialCreationResult>;
  regenerateChapter: (courseId: string, chapterId: string, position: number) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

/** Config callbacks extracted from SequentialCreationConfig */
interface SSECallbacks {
  onProgress?: (progress: CreationProgress) => void;
  onThinking?: (thinking: string) => void;
  onStageComplete?: (stage: CreationStage, items: unknown[]) => void;
  onError?: (error: string, canRetry: boolean) => void;
}

/** Context refs passed to the shared SSE event handler */
interface SSEHandlerContext {
  setProgress: React.Dispatch<React.SetStateAction<CreationProgress>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setResumableCourseId: React.Dispatch<React.SetStateAction<string | null>>;
  startTimeRef: React.MutableRefObject<number>;
  itemTimestampsRef: React.MutableRefObject<number[]>;
  totalItemsRef: React.MutableRefObject<number>;
  progressRef: React.MutableRefObject<CreationProgress>;
  lastCourseIdRef: React.MutableRefObject<string | null>;
  callbacks: SSECallbacks;
}

/** Result from processing a single SSE event */
interface SSEEventResult {
  /** If a terminal event was received, the final result */
  result?: SequentialCreationResult;
  /** Whether a 'complete' event was received */
  gotComplete?: boolean;
  /** Whether an 'error' event was received */
  gotError?: boolean;
}

const PARTIAL_COURSE_KEY = 'taxomind_partial_course';

/** Max auto-reconnections before giving up (~150 min at 15 min per segment) */
const MAX_RECONNECTIONS = 10;

/** Delay before auto-reconnecting (ms) — lets server checkpoint save complete */
const RECONNECT_DELAY_MS = 2000;

// ============================================================================
// Initial State
// ============================================================================

const INITIAL_STATE: CreationState = {
  stage: 1,
  phase: 'idle',
  currentChapter: 0,
  totalChapters: 0,
  currentSection: 0,
  totalSections: 0,
};

const INITIAL_PROGRESS: CreationProgress = {
  state: INITIAL_STATE,
  percentage: 0,
  message: '',
  completedItems: {
    chapters: [],
    sections: [],
  },
};

// ============================================================================
// SSE Event Parser
// ============================================================================

interface ParsedSSEEvent {
  event: string;
  data: Record<string, unknown>;
}

/**
 * Parse a raw SSE chunk into structured events.
 * Handles multiple events within a single chunk.
 */
function parseSSEChunk(chunk: string): ParsedSSEEvent[] {
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
// Shared SSE Event Handler
// ============================================================================

/**
 * Process a single SSE event and update React state accordingly.
 * Used by both startCreation and resumeCreation for identical UI behavior.
 *
 * Returns an SSEEventResult if a terminal event (complete/error) was received,
 * or an empty object for non-terminal events.
 */
function handleSSEEvent(
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

    case 'item_complete': {
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

      // Skip timestamp recording for resume-replay items (already completed)
      const isResumeReplay = data.isResumeReplay as boolean | undefined;
      if (!isResumeReplay) {
        // Record timestamp for ETA calculation
        itemTimestampsRef.current.push(Date.now());
      }
      const timestamps = itemTimestampsRef.current;
      const itemsCompleted = timestamps.length;
      const elapsedMs = Date.now() - startTimeRef.current;
      const totalItemCount = totalItemsRef.current;

      // Compute sliding-window average (last 5 items) for ETA
      let averageItemMs: number | null = null;
      let estimatedRemainingMs: number | null = null;
      if (itemsCompleted >= 2) {
        const windowSize = Math.min(5, itemsCompleted);
        const recentTimes: number[] = [];
        for (let i = itemsCompleted - windowSize; i < itemsCompleted; i++) {
          const prev = i === 0 ? startTimeRef.current : timestamps[i - 1];
          recentTimes.push(timestamps[i] - prev);
        }
        averageItemMs = Math.round(recentTimes.reduce((a, b) => a + b, 0) / recentTimes.length);
        const remaining = totalItemCount - itemsCompleted;
        estimatedRemainingMs = remaining > 0 ? averageItemMs * remaining : 0;
      }

      const timing = {
        elapsedMs,
        estimatedRemainingMs,
        averageItemMs,
        itemsCompleted,
        totalItems: totalItemCount,
      };

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

    case 'stage_complete': {
      const stage = data.stage as number;
      if (callbacks.onStageComplete) {
        callbacks.onStageComplete(stage as CreationStage, []);
      }
      return {};
    }

    case 'complete': {
      const courseId = data.courseId as string;
      const chaptersCreated = (data.chaptersCreated as number) ?? 0;
      const sectionsCreated = (data.sectionsCreated as number) ?? 0;
      const totalTime = (data.totalTime as number) ?? (Date.now() - startTimeRef.current);
      const averageQualityScore = (data.averageQualityScore as number) ?? 0;

      // Clear partial course from localStorage on success
      try {
        localStorage.removeItem(PARTIAL_COURSE_KEY);
        setResumableCourseId(null);
      } catch {
        // localStorage not available
      }

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

    case 'error': {
      const errorMessage = (data.message as string) ?? 'Unknown error';
      const chaptersCreated = (data.chaptersCreated as number) ?? 0;
      const sectionsCreated = (data.sectionsCreated as number) ?? 0;
      const errorCourseId = data.courseId as string | undefined;

      // Store partial course ID for resume
      if (errorCourseId && chaptersCreated > 0) {
        try {
          localStorage.setItem(PARTIAL_COURSE_KEY, errorCourseId);
          setResumableCourseId(errorCourseId);
        } catch {
          // localStorage not available
        }
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

    default:
      return {};
  }
}

/**
 * Read an SSE stream and process events through the shared handler.
 * Returns the final result and flags for whether complete/error events were received.
 */
async function readSSEStream(
  response: Response,
  ctx: SSEHandlerContext,
): Promise<{ result: SequentialCreationResult; gotComplete: boolean; gotError: boolean }> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  let finalResult: SequentialCreationResult = {
    success: false,
    error: 'Stream ended without completion event',
  };
  let gotComplete = false;
  let gotError = false;
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete events from the buffer
    const lastDoubleNewline = buffer.lastIndexOf('\n\n');
    if (lastDoubleNewline === -1) continue;

    const completePart = buffer.substring(0, lastDoubleNewline + 2);
    buffer = buffer.substring(lastDoubleNewline + 2);

    const events = parseSSEChunk(completePart);

    for (const sseEvent of events) {
      const eventResult = handleSSEEvent(sseEvent, ctx);
      if (eventResult.result) {
        finalResult = eventResult.result;
      }
      if (eventResult.gotComplete) gotComplete = true;
      if (eventResult.gotError) gotError = true;
    }
  }

  return { result: finalResult, gotComplete, gotError };
}

// ============================================================================
// Main Hook
// ============================================================================

export function useSequentialCreation(): UseSequentialCreationReturn {
  const [progress, setProgress] = useState<CreationProgress>(INITIAL_PROGRESS);
  const [error, setError] = useState<string | null>(null);
  const [resumableCourseId, setResumableCourseId] = useState<string | null>(null);

  const [dbProgress, setDbProgress] = useState<DbProgress | null>(null);
  const [regeneratingChapterId, setRegeneratingChapterId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number>(0);
  const progressRef = useRef<CreationProgress>(INITIAL_PROGRESS);
  const itemTimestampsRef = useRef<number[]>([]);
  const totalItemsRef = useRef<number>(0);
  const resumableCourseIdRef = useRef(resumableCourseId);
  resumableCourseIdRef.current = resumableCourseId;

  // Auto-reconnection tracking
  const reconnectCountRef = useRef<number>(0);
  const lastCourseIdRef = useRef<string | null>(null);

  // Keep ref in sync so SSE handler can read latest progress
  progressRef.current = progress;

  // Hydrate resumable course ID from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PARTIAL_COURSE_KEY);
      if (stored) {
        setResumableCourseId(stored);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  // Check DB for active/resumable creation on mount (cross-device resume)
  useEffect(() => {
    let cancelled = false;

    async function checkDbProgress() {
      try {
        const res = await fetch('/api/sam/course-creation/progress');
        if (!res.ok) return;

        const data = await res.json();
        if (cancelled) return;

        if (data.success && data.hasActiveCreation && data.progress) {
          const prog: DbProgress = {
            hasActiveCreation: true,
            courseId: data.progress.courseId,
            courseTitle: data.progress.courseTitle,
            completedChapters: data.progress.completedChapters,
            totalChapters: data.progress.totalChapters,
            percentage: data.progress.percentage,
            lastSaved: data.progress.lastSaved,
            completedItems: data.progress.completedItems,
          };
          setDbProgress(prog);

          // If localStorage doesn't have a resumable course, set it from DB
          if (!resumableCourseIdRef.current) {
            setResumableCourseId(prog.courseId);
            try {
              localStorage.setItem(PARTIAL_COURSE_KEY, prog.courseId);
            } catch {
              // localStorage not available
            }
          }
        }
      } catch {
        // Non-critical — silently ignore network errors on mount
        logger.debug('[SEQUENTIAL_SSE] Failed to check DB progress');
      }
    }

    checkDbProgress();
    return () => { cancelled = true; };
  }, []); // Run once on mount

  /**
   * Fetch fresh DB progress for a specific course (used before auto-reconnect).
   */
  const fetchDbProgressForCourse = useCallback(async (courseId: string): Promise<DbProgress | null> => {
    try {
      const res = await fetch('/api/sam/course-creation/progress');
      if (!res.ok) return null;

      const data = await res.json();
      if (data.success && data.hasActiveCreation && data.progress?.courseId === courseId) {
        return {
          hasActiveCreation: true,
          courseId: data.progress.courseId,
          courseTitle: data.progress.courseTitle,
          completedChapters: data.progress.completedChapters,
          totalChapters: data.progress.totalChapters,
          percentage: data.progress.percentage,
          lastSaved: data.progress.lastSaved,
          completedItems: data.progress.completedItems,
        };
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // ========================================
  // Resume Creation
  // ========================================

  const resumeCreation = useCallback(async (
    courseId: string,
    config: SequentialCreationConfig
  ): Promise<SequentialCreationResult> => {
    const { onProgress, onThinking, onStageComplete, onError, ...courseData } = config;
    const callbacks: SSECallbacks = { onProgress, onThinking, onStageComplete, onError };

    // Only reset timing on first call (not auto-reconnect)
    if (reconnectCountRef.current === 0) {
      startTimeRef.current = Date.now();
      itemTimestampsRef.current = [];
    }
    setError(null);

    const totalChapters = courseData.totalChapters;
    const sectionsPerChapter = courseData.sectionsPerChapter;
    const totalSections = totalChapters * sectionsPerChapter;
    totalItemsRef.current = totalChapters + totalSections + totalSections;

    // Pre-populate completed items from dbProgress (Fix 2)
    const currentDbProgress = await fetchDbProgressForCourse(courseId);
    const prePopulatedItems = currentDbProgress?.completedItems ?? {
      chapters: [],
      sections: [],
    };
    const initialPercentage = currentDbProgress?.percentage ?? 0;

    // Only set initial state if this is NOT an auto-reconnect
    // (auto-reconnects preserve existing React state)
    if (reconnectCountRef.current === 0) {
      setProgress(prev => ({
        ...prev,
        state: {
          ...prev.state,
          stage: 1,
          phase: 'resuming',
          currentChapter: currentDbProgress?.completedChapters ?? 0,
          totalChapters,
          currentSection: 0,
          totalSections: sectionsPerChapter,
        },
        percentage: initialPercentage,
        message: 'Resuming course creation...',
        completedItems: prePopulatedItems,
      }));
    }

    // Track this course for auto-reconnect
    lastCourseIdRef.current = courseId;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const ctx: SSEHandlerContext = {
      setProgress,
      setError,
      setResumableCourseId,
      startTimeRef,
      itemTimestampsRef,
      totalItemsRef,
      progressRef,
      lastCourseIdRef,
      callbacks,
    };

    try {
      const response = await fetch('/api/sam/course-creation/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...courseData,
          resumeCourseId: courseId,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Read SSE stream using shared handler
      const { result, gotComplete, gotError } = await readSSEStream(response, ctx);

      // Auto-reconnect if stream ended without terminal event (timeout/disconnect)
      if (!gotComplete && !gotError && lastCourseIdRef.current) {
        if (reconnectCountRef.current < MAX_RECONNECTIONS) {
          reconnectCountRef.current++;
          logger.info('[SEQUENTIAL_SSE] Auto-reconnecting after stream timeout', {
            reconnectCount: reconnectCountRef.current,
            courseId: lastCourseIdRef.current,
          });

          // Brief pause to let server-side checkpoint save complete
          await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY_MS));

          // Recursively resume — React state persists across calls
          return resumeCreation(lastCourseIdRef.current, config);
        }

        logger.warn('[SEQUENTIAL_SSE] Max reconnections reached', {
          maxReconnections: MAX_RECONNECTIONS,
          courseId: lastCourseIdRef.current,
        });
      }

      return result;
    } catch (err) {
      // Handle abort (cancellation) — don't auto-reconnect
      if (err instanceof DOMException && err.name === 'AbortError') {
        const cancelMessage = 'Course creation cancelled';
        setError(cancelMessage);
        setProgress(prev => ({
          ...prev,
          state: { ...prev.state, phase: 'error', error: cancelMessage },
          message: cancelMessage,
        }));
        return { success: false, error: cancelMessage };
      }

      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      // Network errors during creation should trigger auto-reconnect
      if (lastCourseIdRef.current && reconnectCountRef.current < MAX_RECONNECTIONS) {
        reconnectCountRef.current++;
        logger.info('[SEQUENTIAL_SSE] Auto-reconnecting after network error', {
          reconnectCount: reconnectCountRef.current,
          courseId: lastCourseIdRef.current,
          error: errorMessage,
        });

        await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY_MS));
        return resumeCreation(lastCourseIdRef.current, config);
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      abortControllerRef.current = null;
    }
  }, [fetchDbProgressForCourse]);

  // ========================================
  // Main Creation Flow (SSE-based)
  // ========================================

  const startCreation = useCallback(async (
    config: SequentialCreationConfig
  ): Promise<SequentialCreationResult> => {
    const { onProgress, onThinking, onStageComplete, onError, ...courseData } = config;
    const callbacks: SSECallbacks = { onProgress, onThinking, onStageComplete, onError };

    startTimeRef.current = Date.now();
    itemTimestampsRef.current = [];
    reconnectCountRef.current = 0;
    lastCourseIdRef.current = null;
    setError(null);

    const totalChapters = courseData.totalChapters;
    const sectionsPerChapter = courseData.sectionsPerChapter;
    const totalSections = totalChapters * sectionsPerChapter;
    // Total items = chapters + sections + section details
    totalItemsRef.current = totalChapters + totalSections + totalSections;

    // Set initial creating state
    setProgress({
      state: {
        stage: 1,
        phase: 'creating_course',
        currentChapter: 0,
        totalChapters,
        currentSection: 0,
        totalSections: sectionsPerChapter,
      },
      percentage: 0,
      message: 'Starting course creation...',
      completedItems: { chapters: [], sections: [] },
    });

    // Create an AbortController for cancellation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const ctx: SSEHandlerContext = {
      setProgress,
      setError,
      setResumableCourseId,
      startTimeRef,
      itemTimestampsRef,
      totalItemsRef,
      progressRef,
      lastCourseIdRef,
      callbacks,
    };

    try {
      // POST to the SSE orchestrate endpoint
      const response = await fetch('/api/sam/course-creation/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseTitle: courseData.courseTitle,
          courseDescription: courseData.courseDescription,
          targetAudience: courseData.targetAudience,
          difficulty: courseData.difficulty,
          totalChapters: courseData.totalChapters,
          sectionsPerChapter: courseData.sectionsPerChapter,
          learningObjectivesPerChapter: courseData.learningObjectivesPerChapter,
          learningObjectivesPerSection: courseData.learningObjectivesPerSection,
          courseGoals: courseData.courseGoals,
          bloomsFocus: courseData.bloomsFocus,
          preferredContentTypes: courseData.preferredContentTypes,
          category: courseData.category,
          subcategory: courseData.subcategory,
        }),
        signal: abortController.signal,
      });

      // Handle non-SSE error responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body (SSE stream not available)');
      }

      // Read SSE stream using shared handler
      const { result, gotComplete, gotError } = await readSSEStream(response, ctx);

      // Auto-reconnect if stream ended without terminal event (timeout/disconnect)
      if (!gotComplete && !gotError && lastCourseIdRef.current) {
        if (reconnectCountRef.current < MAX_RECONNECTIONS) {
          reconnectCountRef.current++;
          logger.info('[SEQUENTIAL_SSE] Auto-reconnecting after initial stream timeout', {
            reconnectCount: reconnectCountRef.current,
            courseId: lastCourseIdRef.current,
          });

          // Brief pause to let server-side checkpoint save complete
          await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY_MS));

          // Switch to resumeCreation for subsequent segments
          return resumeCreation(lastCourseIdRef.current, config);
        }
      }

      return result;
    } catch (err) {
      // Handle abort (cancellation)
      if (err instanceof DOMException && err.name === 'AbortError') {
        const cancelMessage = 'Course creation cancelled';
        setError(cancelMessage);
        setProgress(prev => ({
          ...prev,
          state: { ...prev.state, phase: 'error', error: cancelMessage },
          message: cancelMessage,
        }));

        return {
          success: false,
          error: cancelMessage,
          stats: {
            totalChapters: 0,
            totalSections: 0,
            totalTime: Date.now() - startTimeRef.current,
            averageQualityScore: 0,
          },
        };
      }

      // Handle network errors — try auto-reconnect if we have a course ID
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      if (lastCourseIdRef.current && reconnectCountRef.current < MAX_RECONNECTIONS) {
        reconnectCountRef.current++;
        logger.info('[SEQUENTIAL_SSE] Auto-reconnecting after network error (start)', {
          reconnectCount: reconnectCountRef.current,
          courseId: lastCourseIdRef.current,
          error: errorMessage,
        });

        await new Promise(resolve => setTimeout(resolve, RECONNECT_DELAY_MS));
        return resumeCreation(lastCourseIdRef.current, config);
      }

      logger.error('[SEQUENTIAL_SSE] Creation failed:', err);

      setError(errorMessage);
      setProgress(prev => ({
        ...prev,
        state: { ...prev.state, phase: 'error', error: errorMessage },
        message: errorMessage,
      }));

      if (onError) {
        onError(errorMessage, true);
      }

      return {
        success: false,
        error: errorMessage,
        stats: {
          totalChapters: 0,
          totalSections: 0,
          totalTime: Date.now() - startTimeRef.current,
          averageQualityScore: 0,
        },
      };
    } finally {
      abortControllerRef.current = null;
    }
  }, [resumeCreation]);

  // ========================================
  // Regenerate Chapter (Post-creation)
  // ========================================

  const regenerateChapter = useCallback(async (
    courseId: string,
    chapterId: string,
    position: number
  ): Promise<void> => {
    setRegeneratingChapterId(chapterId);

    try {
      const res = await fetch('/api/sam/course-creation/regenerate-chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, chapterId, chapterPosition: position }),
      });

      const data = await res.json();

      if (data.success) {
        // Update chapter in completedItems with new quality score and title
        setProgress(prev => ({
          ...prev,
          completedItems: {
            ...prev.completedItems,
            chapters: prev.completedItems.chapters.map(ch =>
              ch.id === chapterId
                ? {
                    ...ch,
                    qualityScore: data.qualityScore ?? ch.qualityScore,
                    title: data.chapterTitle ?? ch.title,
                  }
                : ch
            ),
          },
        }));
      } else {
        logger.error('[SEQUENTIAL_SSE] Chapter regeneration failed:', data.error);
      }
    } catch (err) {
      logger.error('[SEQUENTIAL_SSE] Chapter regeneration error:', err);
    } finally {
      setRegeneratingChapterId(null);
    }
  }, []);

  // ========================================
  // Cancel and Reset
  // ========================================

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const reset = useCallback(() => {
    setProgress(INITIAL_PROGRESS);
    setError(null);
    setResumableCourseId(null);
    setDbProgress(null);
    setRegeneratingChapterId(null);
    reconnectCountRef.current = 0;
    lastCourseIdRef.current = null;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // ========================================
  // Return
  // ========================================

  return {
    progress,
    isCreating: progress.state.phase !== 'idle' && progress.state.phase !== 'complete' && progress.state.phase !== 'error',
    error,
    resumableCourseId,
    dbProgress,
    regeneratingChapterId,
    startCreation,
    resumeCreation,
    regenerateChapter,
    cancel,
    reset,
  };
}

export default useSequentialCreation;
