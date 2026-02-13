/**
 * SAM Sequential Course Creation Hook (SSE-based)
 *
 * Connects to the /api/sam/course-creation/orchestrate SSE endpoint which
 * runs all 3 stages server-side with quality gates, retries, and progressive
 * DB saves — all in a single HTTP connection.
 *
 * The hook maps SSE events to CreationProgress state consumed by
 * SequentialCreationModal.
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

const PARTIAL_COURSE_KEY = 'taxomind_partial_course';

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

  // ========================================
  // Main Creation Flow (SSE-based)
  // ========================================

  const startCreation = useCallback(async (
    config: SequentialCreationConfig
  ): Promise<SequentialCreationResult> => {
    const { onProgress, onThinking, onStageComplete, onError, ...courseData } = config;

    startTimeRef.current = Date.now();
    itemTimestampsRef.current = [];
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

      // Read the SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let result: SequentialCreationResult = {
        success: false,
        error: 'Stream ended without completion event',
      };

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
          const { event, data } = sseEvent;

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

              if (onProgress) {
                onProgress(progressRef.current);
              }
              break;
            }

            case 'stage_start': {
              const stage = data.stage as number;
              const message = data.message as string;

              setProgress(prev => ({
                ...prev,
                state: {
                  ...prev.state,
                  stage: (Math.max(1, Math.min(3, stage)) as CreationStage),
                  phase: stage === 1 ? 'generating_chapter' : stage === 2 ? 'generating_section' : 'generating_details',
                },
                message: message || `Starting stage ${stage}...`,
              }));
              break;
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
              break;
            }

            case 'thinking': {
              const thinking = data.thinking as string;
              if (thinking) {
                setProgress(prev => ({ ...prev, thinking }));
                if (onThinking) onThinking(thinking);
              }
              break;
            }

            case 'thinking_chunk': {
              const chunk = data.chunk as string;
              if (chunk) {
                setProgress(prev => ({ ...prev, thinking: (prev.thinking ?? '') + chunk }));
              }
              break;
            }

            case 'item_complete': {
              const stage = data.stage as number;
              const title = data.title as string;
              const id = data.id as string | undefined;
              const qualityScore = data.qualityScore as number | undefined;
              const chapter = data.chapter as number | undefined;
              const section = data.section as number | undefined;

              // Record timestamp for ETA calculation
              itemTimestampsRef.current.push(Date.now());
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
                setProgress(prev => ({
                  ...prev,
                  timing,
                  completedItems: {
                    ...prev.completedItems,
                    chapters: [
                      ...prev.completedItems.chapters,
                      { position: chapter, title, id, qualityScore },
                    ],
                  },
                }));
              } else if ((stage === 2 || stage === 3) && chapter && section && title) {
                setProgress(prev => ({
                  ...prev,
                  timing,
                  completedItems: {
                    ...prev.completedItems,
                    sections: [
                      ...prev.completedItems.sections,
                      { chapterPosition: chapter, position: section, title, id, qualityScore },
                    ],
                  },
                }));
              }
              break;
            }

            case 'stage_complete': {
              const stage = data.stage as number;
              if (onStageComplete) {
                onStageComplete(stage as CreationStage, []);
              }
              break;
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

              result = {
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
              };
              break;
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

              if (onError) {
                onError(errorMessage, true);
              }

              result = {
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
              };
              break;
            }
          }
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

      // Handle other errors
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
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
  }, []);

  // ========================================
  // Resume Creation
  // ========================================

  const resumeCreation = useCallback(async (
    courseId: string,
    config: SequentialCreationConfig
  ): Promise<SequentialCreationResult> => {
    const { onProgress, onThinking, onStageComplete, onError, ...courseData } = config;

    startTimeRef.current = Date.now();
    itemTimestampsRef.current = [];
    setError(null);

    const totalChapters = courseData.totalChapters;
    const sectionsPerChapter = courseData.sectionsPerChapter;
    const totalSections = totalChapters * sectionsPerChapter;
    totalItemsRef.current = totalChapters + totalSections + totalSections;

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
      message: 'Resuming course creation...',
      completedItems: { chapters: [], sections: [] },
    });

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

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

      // Reuse the same SSE parsing as startCreation
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result: SequentialCreationResult = { success: false, error: 'Stream ended without completion' };
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lastDoubleNewline = buffer.lastIndexOf('\n\n');
        if (lastDoubleNewline === -1) continue;

        const completePart = buffer.substring(0, lastDoubleNewline + 2);
        buffer = buffer.substring(lastDoubleNewline + 2);

        const events = parseSSEChunk(completePart);
        for (const sseEvent of events) {
          if (sseEvent.event === 'complete') {
            try {
              localStorage.removeItem(PARTIAL_COURSE_KEY);
              setResumableCourseId(null);
            } catch { /* */ }

            result = {
              success: true,
              courseId: (sseEvent.data.courseId as string) ?? courseId,
              chaptersCreated: (sseEvent.data.chaptersCreated as number) ?? 0,
              sectionsCreated: (sseEvent.data.sectionsCreated as number) ?? 0,
            };

            setProgress(prev => ({
              ...prev,
              state: { ...prev.state, phase: 'complete' },
              percentage: 100,
              message: 'Course creation complete!',
            }));
          } else if (sseEvent.event === 'error') {
            const errorMsg = (sseEvent.data.message as string) ?? 'Unknown error';
            setError(errorMsg);
            result = { success: false, error: errorMsg };
          } else if (sseEvent.event === 'progress') {
            setProgress(prev => ({
              ...prev,
              percentage: Math.min(100, (sseEvent.data.percentage as number) ?? prev.percentage),
              message: (sseEvent.data.message as string) ?? prev.message,
            }));
          }
        }
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      abortControllerRef.current = null;
    }
  }, []);

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
    setDbProgress(null);
    setRegeneratingChapterId(null);
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
