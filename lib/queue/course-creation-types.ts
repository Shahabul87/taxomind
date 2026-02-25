/**
 * Course Creation Queue Types
 *
 * Job data and progress types for queue-based course creation.
 * Used by the course-creation worker and the async SSE relay route.
 */

import type { JobData } from './job-definitions';

// ============================================================================
// Job Data — Sent when enqueuing a course creation job
// ============================================================================

export interface CourseCreationJobData extends JobData {
  /** User who initiated creation */
  userId: string;
  /** Client-generated idempotency key */
  requestId: string;
  /** Correlation ID for tracing */
  runId: string;
  /** Course creation config (validated OrchestrateRequestSchema) */
  config: CourseCreationConfig;
}

/**
 * Mirrors the validated OrchestrateRequestSchema fields.
 * Avoids importing from the route to keep the worker decoupled.
 */
export interface CourseCreationConfig {
  courseTitle: string;
  courseDescription: string;
  targetAudience: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  totalChapters: number;
  sectionsPerChapter: number;
  learningObjectivesPerChapter: number;
  learningObjectivesPerSection: number;
  courseGoals: string[];
  bloomsFocus: string[];
  preferredContentTypes: string[];
  category?: string;
  subcategory?: string;
  courseIntent?: string;
  includeAssessments?: boolean;
  duration?: string;
  enableEscalationGate?: boolean;
  fallbackPolicy?: {
    haltRateThreshold?: number;
    haltOnExcessiveFallbacks?: boolean;
  };
  teacherBlueprint?: unknown;
  parallelMode?: boolean;
}

// ============================================================================
// Progress — Stored in Redis for the SSE relay to read
// ============================================================================

export interface CourseCreationProgress {
  /** Current job status */
  status: 'queued' | 'running' | 'completed' | 'failed';
  /** Course ID (set after the course record is created) */
  courseId?: string;
  /** Current chapter being generated */
  currentChapter: number;
  /** Total chapters to generate */
  totalChapters: number;
  /** Completion percentage (0-100) */
  percentage: number;
  /** Error message if failed */
  error?: string;
  /** Whether the error is transient and retryable */
  canRetry?: boolean;
  /** Chapters successfully created */
  chaptersCreated: number;
  /** Sections successfully created */
  sectionsCreated: number;
  /** Pipeline completion stats */
  stats?: {
    totalTime: number;
    averageQualityScore: number;
  };
  /** Timestamp of last update */
  updatedAt: string;
}

// ============================================================================
// SSE Event — Stored in Redis list for relay to client
// ============================================================================

export interface QueuedSSEEvent {
  /** SSE event type (same as inline SSE: progress, item_generating, item_complete, etc.) */
  type: string;
  /** Event payload */
  data: Record<string, unknown>;
  /** Monotonic sequence number for ordering */
  seq: number;
  /** ISO timestamp */
  timestamp: string;
}

// ============================================================================
// Redis Key Helpers
// ============================================================================

/** Redis key for the progress summary (SET with TTL) */
export function progressKey(runId: string): string {
  return `course-progress:${runId}`;
}

/** Redis key for the SSE event stream (LIST, RPUSH + BLPOP) */
export function eventStreamKey(runId: string): string {
  return `course-events:${runId}`;
}

/** Redis key for the completion signal (SET with short TTL) */
export function completionKey(runId: string): string {
  return `course-complete:${runId}`;
}

/** TTL for progress/event data in Redis (2 hours) */
export const REDIS_TTL_SECONDS = 2 * 60 * 60;
