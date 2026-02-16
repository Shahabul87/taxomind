/**
 * Types and constants for the SAM Sequential Course Creation Hook.
 *
 * All interfaces, type aliases, and configuration constants used by the
 * SSE event handler, stream reader, ETA calculator, and main hook live here.
 */

import type {
  CreationProgress,
  CreationState,
  CreationStage,
  SequentialCreationConfig,
  SequentialCreationResult,
} from '@/lib/sam/course-creation/types';

// Re-export upstream types so consumers don't need two import paths
export type {
  CreationProgress,
  CreationState,
  CreationStage,
  SequentialCreationConfig,
  SequentialCreationResult,
};

// ============================================================================
// Hook-Level Types
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

export interface UseSequentialCreationReturn {
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
  /** Dismiss resume banner: cancels the DB plan + clears localStorage + resets state */
  dismissCreation: () => Promise<void>;
}

/** Config callbacks extracted from SequentialCreationConfig */
export interface SSECallbacks {
  onProgress?: (progress: CreationProgress) => void;
  onThinking?: (thinking: string) => void;
  onStageComplete?: (stage: CreationStage, items: unknown[]) => void;
  onError?: (error: string, canRetry: boolean) => void;
}

/** Context refs passed to the shared SSE event handler */
export interface SSEHandlerContext {
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
export interface SSEEventResult {
  /** If a terminal event was received, the final result */
  result?: SequentialCreationResult;
  /** Whether a 'complete' event was received */
  gotComplete?: boolean;
  /** Whether an 'error' event was received */
  gotError?: boolean;
}

/** A parsed SSE event with its type name and JSON data */
export interface ParsedSSEEvent {
  event: string;
  data: Record<string, unknown>;
}

// ============================================================================
// Constants
// ============================================================================

export const PARTIAL_COURSE_KEY = 'taxomind_partial_course';

/** Max auto-reconnections before giving up (~150 min at 15 min per segment) */
export const MAX_RECONNECTIONS = 10;

/** Delay before auto-reconnecting (ms) — lets server checkpoint save complete */
export const RECONNECT_DELAY_MS = 2000;

// ============================================================================
// Initial State
// ============================================================================

export const INITIAL_STATE: CreationState = {
  stage: 1,
  phase: 'idle',
  currentChapter: 0,
  totalChapters: 0,
  currentSection: 0,
  totalSections: 0,
};

export const INITIAL_PROGRESS: CreationProgress = {
  state: INITIAL_STATE,
  percentage: 0,
  message: '',
  completedItems: {
    chapters: [],
    sections: [],
  },
};
