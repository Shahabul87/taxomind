"use client";

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
  EscalationDecision,
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
  getReconnectDelay,
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

  // Check DB for active/resumable creation on mount (cross-device resume).
  // Also validates localStorage-based resumableCourseId: if the DB has no
  // active creation with checkpoint data, clear the stale localStorage entry
  // to prevent showing a resume banner that leads to "No checkpoint found".
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
        } else {
          // DB has no active creation with checkpoint data. If localStorage
          // has a stale courseId (e.g. from a creation that failed before any
          // checkpoint was saved), clear it to prevent a resume banner that
          // would fail with "No checkpoint found".
          const staleId = getPartialCourseId();
          if (staleId) {
            logger.debug('[SEQUENTIAL_SSE] Clearing stale localStorage courseId — no DB checkpoint', {
              courseId: staleId,
            });
            clearPartialCourseId();
            setResumableCourseId(null);
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

    // Reset reconnect counter for user-initiated resume (error/idle/paused state).
    // Auto-reconnects increment the counter BEFORE calling resumeCreation recursively,
    // so the counter may be >0 from a prior attempt if the user clicks "Resume" manually.
    const currentPhase = progressRef.current.state.phase;
    const isUserInitiated = currentPhase === 'error' || currentPhase === 'idle' || currentPhase === 'paused';

    // Guard against concurrent calls (double-click on Resume button).
    // Only block user-initiated calls — auto-reconnects (reconnectCount > 0) are
    // allowed through because the prior abort controller is nulled in `finally`.
    if (isUserInitiated && abortControllerRef.current) {
      return {
        success: false,
        error: 'Course creation already in progress',
      };
    }

    if (isUserInitiated) {
      reconnectCountRef.current = 0;
    }

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

      // Handle non-SSE JSON responses (e.g. ALREADY_COMPLETE on resume)
      const resumeContentType = response.headers.get('Content-Type') ?? '';
      if (!resumeContentType.includes('text/event-stream')) {
        const jsonData = await response.json().catch(() => ({}));
        if (jsonData.code === 'ALREADY_COMPLETE' && jsonData.courseId) {
          logger.info('[SEQUENTIAL_SSE] Course already complete on resume', {
            courseId: jsonData.courseId,
          });
          clearPartialCourseId();
          setResumableCourseId(null);
          setProgress(prev => ({
            ...prev,
            state: { ...prev.state, phase: 'complete' },
            percentage: 100,
            message: 'Course already created!',
          }));
          return {
            success: true,
            courseId: jsonData.courseId,
            chaptersCreated: jsonData.chaptersCreated ?? 0,
            sectionsCreated: jsonData.sectionsCreated ?? 0,
            stats: {
              totalChapters: jsonData.chaptersCreated ?? 0,
              totalSections: jsonData.sectionsCreated ?? 0,
              totalTime: Date.now() - startTimeRef.current,
              averageQualityScore: 0,
            },
          };
        }
        throw new Error(jsonData.error || 'Unexpected non-SSE response from server');
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
          await new Promise(resolve => setTimeout(resolve, getReconnectDelay(reconnectCountRef.current)));

          // Recursively resume — React state persists across calls
          return resumeCreation(lastCourseIdRef.current, config);
        }

        // Max reconnections exhausted — set error state so Resume button appears
        const exhaustedMsg = 'Connection lost after multiple retries. You can resume where you left off.';
        logger.warn('[SEQUENTIAL_SSE] Max reconnections reached', {
          maxReconnections: MAX_RECONNECTIONS,
          courseId: lastCourseIdRef.current,
        });

        setPartialCourseId(lastCourseIdRef.current);
        setResumableCourseId(lastCourseIdRef.current);
        setError(exhaustedMsg);
        setProgress(prev => ({
          ...prev,
          state: { ...prev.state, phase: 'error', error: exhaustedMsg },
          message: exhaustedMsg,
        }));

        return {
          success: false,
          courseId: lastCourseIdRef.current,
          error: exhaustedMsg,
          stats: {
            totalChapters: 0,
            totalSections: 0,
            totalTime: Date.now() - startTimeRef.current,
            averageQualityScore: 0,
          },
        };
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

        await new Promise(resolve => setTimeout(resolve, getReconnectDelay(reconnectCountRef.current)));
        return resumeCreation(lastCourseIdRef.current, config);
      }

      // Persist courseId for resume
      const resumeCourseId = lastCourseIdRef.current ?? courseId;
      if (resumeCourseId) {
        setPartialCourseId(resumeCourseId);
        setResumableCourseId(resumeCourseId);
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
        success: false,
        courseId: resumeCourseId ?? undefined,
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
  }, [fetchDbProgressForCourse]);

  // ========================================
  // Approve + Resume (Escalation Gate)
  // ========================================

  const approveAndResumeCreation = useCallback(async (
    courseId: string,
    decision: Exclude<EscalationDecision, 'reject_abort'>,
    config: SequentialCreationConfig,
  ): Promise<SequentialCreationResult> => {
    // Guard against concurrent calls
    if (abortControllerRef.current) {
      return {
        success: false,
        error: 'Course creation already in progress',
      };
    }

    const { onProgress, onThinking, onStageComplete, onError, ...courseData } = config;
    const callbacks: SSECallbacks = { onProgress, onThinking, onStageComplete, onError };

    const currentPhase = progressRef.current.state.phase;
    if (currentPhase === 'error' || currentPhase === 'idle' || currentPhase === 'paused') {
      reconnectCountRef.current = 0;
    }

    if (reconnectCountRef.current === 0) {
      startTimeRef.current = Date.now();
      itemTimestampsRef.current = [];
    }
    setError(null);

    const totalChapters = courseData.totalChapters;
    const sectionsPerChapter = courseData.sectionsPerChapter;
    const totalSections = totalChapters * sectionsPerChapter;
    totalItemsRef.current = Math.max(1, totalChapters + totalSections + totalSections);

    const currentDbProgress = await fetchDbProgressForCourse(courseId);
    const prePopulatedItems = currentDbProgress?.completedItems ?? {
      chapters: [],
      sections: [],
    };
    const initialPercentage = currentDbProgress?.percentage ?? 0;

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
        message: 'Approval recorded. Resuming course creation...',
        completedItems: prePopulatedItems,
      }));
    }

    lastCourseIdRef.current = courseId;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const ctx = buildHandlerContext(callbacks);

    try {
      const response = await fetch('/api/sam/course-creation/approve-and-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, decision }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Handle non-SSE JSON responses (e.g. ALREADY_COMPLETE on approve/resume)
      const approveContentType = response.headers.get('Content-Type') ?? '';
      if (!approveContentType.includes('text/event-stream')) {
        const jsonData = await response.json().catch(() => ({}));
        if (jsonData.code === 'ALREADY_COMPLETE' && jsonData.courseId) {
          logger.info('[SEQUENTIAL_SSE] Course already complete on approve/resume', {
            courseId: jsonData.courseId,
          });
          clearPartialCourseId();
          setResumableCourseId(null);
          setProgress(prev => ({
            ...prev,
            state: { ...prev.state, phase: 'complete' },
            percentage: 100,
            message: 'Course already created!',
          }));
          return {
            success: true,
            courseId: jsonData.courseId,
            chaptersCreated: jsonData.chaptersCreated ?? 0,
            sectionsCreated: jsonData.sectionsCreated ?? 0,
            stats: {
              totalChapters: jsonData.chaptersCreated ?? 0,
              totalSections: jsonData.sectionsCreated ?? 0,
              totalTime: Date.now() - startTimeRef.current,
              averageQualityScore: 0,
            },
          };
        }
        throw new Error(jsonData.error || 'Unexpected non-SSE response from server');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const { result, gotComplete, gotError } = await readSSEStream(response, ctx);

      if (!gotComplete && !gotError && lastCourseIdRef.current) {
        if (reconnectCountRef.current < MAX_RECONNECTIONS) {
          reconnectCountRef.current++;
          logger.info('[SEQUENTIAL_SSE] Auto-reconnecting after approve/resume timeout', {
            reconnectCount: reconnectCountRef.current,
            courseId: lastCourseIdRef.current,
          });
          await new Promise(resolve => setTimeout(resolve, getReconnectDelay(reconnectCountRef.current)));
          return resumeCreation(lastCourseIdRef.current, config);
        }

        const exhaustedMsg = 'Connection lost after multiple retries. You can resume where you left off.';
        logger.warn('[SEQUENTIAL_SSE] Max reconnections reached after approve/resume', {
          maxReconnections: MAX_RECONNECTIONS,
          courseId: lastCourseIdRef.current,
        });

        setPartialCourseId(lastCourseIdRef.current);
        setResumableCourseId(lastCourseIdRef.current);
        setError(exhaustedMsg);
        setProgress(prev => ({
          ...prev,
          state: { ...prev.state, phase: 'error', error: exhaustedMsg },
          message: exhaustedMsg,
        }));

        return {
          success: false,
          courseId: lastCourseIdRef.current,
          error: exhaustedMsg,
          stats: {
            totalChapters: 0,
            totalSections: 0,
            totalTime: Date.now() - startTimeRef.current,
            averageQualityScore: 0,
          },
        };
      }

      return result;
    } catch (err) {
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
      const isNetworkError = err instanceof TypeError ||
        (err instanceof Error && /fetch|network|connection|timeout/i.test(err.message));

      if (isNetworkError && lastCourseIdRef.current && reconnectCountRef.current < MAX_RECONNECTIONS) {
        reconnectCountRef.current++;
        logger.info('[SEQUENTIAL_SSE] Auto-reconnecting after approve/resume network error', {
          reconnectCount: reconnectCountRef.current,
          courseId: lastCourseIdRef.current,
          error: errorMessage,
        });

        await new Promise(resolve => setTimeout(resolve, getReconnectDelay(reconnectCountRef.current)));
        return resumeCreation(lastCourseIdRef.current, config);
      }

      if (lastCourseIdRef.current) {
        setPartialCourseId(lastCourseIdRef.current);
        setResumableCourseId(lastCourseIdRef.current);
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
        success: false,
        courseId: lastCourseIdRef.current ?? courseId,
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
  }, [fetchDbProgressForCourse, resumeCreation]);

  // ========================================
  // Main Creation Flow (SSE-based)
  // ========================================

  const startCreation = useCallback(async (
    config: SequentialCreationConfig
  ): Promise<SequentialCreationResult> => {
    if (abortControllerRef.current) {
      return {
        success: false,
        error: 'Course creation already in progress',
      };
    }

    // Dismiss any stale ACTIVE/DRAFT plans from previous failed attempts.
    // This prevents 409 ALREADY_RUNNING when the user starts a new creation
    // after a previous one crashed or timed out without proper cleanup.
    try {
      await fetch('/api/sam/course-creation/dismiss', { method: 'POST' });
    } catch {
      // Best-effort — if dismiss fails, the orchestrate endpoint will check anyway
    }

    const { onProgress, onThinking, onStageComplete, onError, ...courseData } = config;
    const callbacks: SSECallbacks = { onProgress, onThinking, onStageComplete, onError };

    // Generate idempotency key to prevent duplicate course creation on double-click
    const requestId = crypto.randomUUID();

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
          requestId,
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
          enableEscalationGate: courseData.enableEscalationGate,
          fallbackPolicy: courseData.fallbackPolicy,
          teacherBlueprint: courseData.teacherBlueprint,
        }),
        signal: abortController.signal,
      });

      // Handle non-SSE error responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));

        // 409 ALREADY_RUNNING: extract courseId so Resume button can appear
        if (response.status === 409 && errorData.code === 'ALREADY_RUNNING' && errorData.courseId) {
          setPartialCourseId(errorData.courseId);
          setResumableCourseId(errorData.courseId);
        }

        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Handle non-SSE JSON responses (e.g. ALREADY_COMPLETE).
      // The server may return a 200 JSON response instead of an SSE stream
      // when the course was already created by a prior request with the same
      // idempotency key. Without this guard, the JSON body would be fed into
      // the SSE stream reader, which fails silently and reports a false error.
      const contentType = response.headers.get('Content-Type') ?? '';
      if (!contentType.includes('text/event-stream')) {
        const jsonData = await response.json().catch(() => ({}));
        if (jsonData.code === 'ALREADY_COMPLETE' && jsonData.courseId) {
          logger.info('[SEQUENTIAL_SSE] Course already complete (idempotent)', {
            courseId: jsonData.courseId,
          });
          clearPartialCourseId();
          setResumableCourseId(null);
          setProgress(prev => ({
            ...prev,
            state: { ...prev.state, phase: 'complete' },
            percentage: 100,
            message: 'Course already created!',
          }));
          return {
            success: true,
            courseId: jsonData.courseId,
            chaptersCreated: jsonData.chaptersCreated ?? 0,
            sectionsCreated: jsonData.sectionsCreated ?? 0,
            stats: {
              totalChapters: jsonData.chaptersCreated ?? 0,
              totalSections: jsonData.sectionsCreated ?? 0,
              totalTime: Date.now() - startTimeRef.current,
              averageQualityScore: 0,
            },
          };
        }
        throw new Error(jsonData.error || 'Unexpected non-SSE response from server');
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
          await new Promise(resolve => setTimeout(resolve, getReconnectDelay(reconnectCountRef.current)));

          // Switch to resumeCreation for subsequent segments
          return resumeCreation(lastCourseIdRef.current, config);
        }

        // Max reconnections exhausted — set error state so Resume button appears
        const exhaustedMsg = 'Connection lost after multiple retries. You can resume where you left off.';
        logger.warn('[SEQUENTIAL_SSE] Max reconnections reached', {
          maxReconnections: MAX_RECONNECTIONS,
          courseId: lastCourseIdRef.current,
        });

        setPartialCourseId(lastCourseIdRef.current);
        setResumableCourseId(lastCourseIdRef.current);
        setError(exhaustedMsg);
        setProgress(prev => ({
          ...prev,
          state: { ...prev.state, phase: 'error', error: exhaustedMsg },
          message: exhaustedMsg,
        }));

        return {
          success: false,
          courseId: lastCourseIdRef.current,
          error: exhaustedMsg,
          stats: {
            totalChapters: 0,
            totalSections: 0,
            totalTime: Date.now() - startTimeRef.current,
            averageQualityScore: 0,
          },
        };
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

        await new Promise(resolve => setTimeout(resolve, getReconnectDelay(reconnectCountRef.current)));
        return resumeCreation(lastCourseIdRef.current, config);
      }

      logger.error('[SEQUENTIAL_SSE] Creation failed:', err);

      // Persist courseId for resume if the course was created before the error
      if (lastCourseIdRef.current) {
        setPartialCourseId(lastCourseIdRef.current);
        setResumableCourseId(lastCourseIdRef.current);
      }

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
    isCreating: progress.state.phase !== 'idle'
      && progress.state.phase !== 'complete'
      && progress.state.phase !== 'error'
      && progress.state.phase !== 'paused',
    error,
    resumableCourseId,
    dbProgress,
    regeneratingChapterId,
    startCreation,
    resumeCreation,
    approveAndResumeCreation,
    regenerateChapter,
    cancel,
    reset,
    dismissCreation,
  };
}

export default useSequentialCreation;
