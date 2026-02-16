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
import type { CreationProgress, SequentialCreationConfig, SequentialCreationResult } from '@/lib/sam/course-creation/types';

import type {
  DbProgress,
  UseSequentialCreationReturn,
  SSECallbacks,
  SSEHandlerContext,
} from './types';
import {
  PARTIAL_COURSE_KEY,
  MAX_RECONNECTIONS,
  RECONNECT_DELAY_MS,
  INITIAL_PROGRESS,
  getPartialCourseId,
  setPartialCourseId,
  clearPartialCourseId,
} from './types';
import { readSSEStream } from './sse-stream-reader';

// Re-export types for consumers
export type { DbProgress, UseSequentialCreationReturn };

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
    const stored = getPartialCourseId();
    if (stored) {
      setResumableCourseId(stored);
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
            setPartialCourseId(prog.courseId);
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
  // Build SSE Handler Context
  // ========================================

  function buildHandlerContext(callbacks: SSECallbacks): SSEHandlerContext {
    return {
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
  }

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
    // Initial estimate — will be corrected by server's total_items event
    totalItemsRef.current = Math.max(1, totalChapters + totalSections + totalSections);

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

    const ctx = buildHandlerContext(callbacks);

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

      // Only auto-reconnect on network errors (TypeError: Failed to fetch, etc.)
      // NOT on API errors (400 validation, 401 auth, 500 server error) which would just loop.
      const isNetworkError = err instanceof TypeError ||
        (err instanceof Error && /fetch|network|connection|timeout/i.test(err.message));

      if (isNetworkError && lastCourseIdRef.current && reconnectCountRef.current < MAX_RECONNECTIONS) {
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
    // Initial estimate — will be corrected by server's total_items event
    totalItemsRef.current = Math.max(1, totalChapters + totalSections + totalSections);

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

    const ctx = buildHandlerContext(callbacks);

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
          courseIntent: courseData.courseIntent,
          includeAssessments: courseData.includeAssessments,
          duration: courseData.duration,
          useBreadthFirst: courseData.useBreadthFirst ?? true,
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

  /**
   * Dismiss the resume banner permanently by:
   * 1. Marking the DB plan as CANCELLED (so it won't be found on next mount)
   * 2. Clearing localStorage
   * 3. Resetting React state
   */
  const dismissCreation = useCallback(async () => {
    try {
      await fetch('/api/sam/course-creation/dismiss', { method: 'POST' });
    } catch {
      logger.debug('[SEQUENTIAL_SSE] Failed to dismiss creation in DB (non-critical)');
    }
    clearPartialCourseId();
    setResumableCourseId(null);
    setDbProgress(null);
    setProgress(INITIAL_PROGRESS);
    setError(null);
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
    dismissCreation,
  };
}

export default useSequentialCreation;
