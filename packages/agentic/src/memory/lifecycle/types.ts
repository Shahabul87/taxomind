/**
 * @sam-ai/agentic - Memory Lifecycle Types
 * Type definitions for memory lifecycle management
 */

import { z } from 'zod';

// ============================================================================
// REINDEX JOB TYPES
// ============================================================================

/**
 * Content change event that triggers reindexing
 */
export interface ContentChangeEvent {
  id: string;
  entityType: ContentEntityType;
  entityId: string;
  changeType: ChangeType;
  timestamp: Date;
  metadata: ContentChangeMetadata;
}

/**
 * Types of content entities that can be indexed
 */
export const ContentEntityType = {
  COURSE: 'course',
  CHAPTER: 'chapter',
  SECTION: 'section',
  LESSON: 'lesson',
  QUIZ: 'quiz',
  RESOURCE: 'resource',
  USER_NOTE: 'user_note',
  CONVERSATION: 'conversation',
} as const;

export type ContentEntityType = (typeof ContentEntityType)[keyof typeof ContentEntityType];

/**
 * Types of changes that can occur
 */
export const ChangeType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  BULK_UPDATE: 'bulk_update',
} as const;

export type ChangeType = (typeof ChangeType)[keyof typeof ChangeType];

/**
 * Metadata about the content change
 */
export interface ContentChangeMetadata {
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  userId?: string;
  previousHash?: string;
  newHash?: string;
  fieldsChanged?: string[];
  batchId?: string;
}

// ============================================================================
// REINDEX JOB TYPES
// ============================================================================

/**
 * Reindex job definition
 */
export interface ReindexJob {
  id: string;
  type: ReindexJobType;
  status: ReindexJobStatus;
  priority: ReindexPriority;
  entityType: ContentEntityType;
  entityId: string;
  changeType: ChangeType;
  metadata: ReindexJobMetadata;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: Date;
  lastError?: string;
  scheduledFor: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Types of reindex jobs
 */
export const ReindexJobType = {
  SINGLE: 'single',
  BATCH: 'batch',
  FULL: 'full',
  INCREMENTAL: 'incremental',
} as const;

export type ReindexJobType = (typeof ReindexJobType)[keyof typeof ReindexJobType];

/**
 * Reindex job status
 */
export const ReindexJobStatus = {
  PENDING: 'pending',
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  RETRYING: 'retrying',
} as const;

export type ReindexJobStatus = (typeof ReindexJobStatus)[keyof typeof ReindexJobStatus];

/**
 * Priority levels for reindex jobs
 */
export const ReindexPriority = {
  LOW: 1,
  NORMAL: 5,
  HIGH: 10,
  CRITICAL: 100,
} as const;

export type ReindexPriority = (typeof ReindexPriority)[keyof typeof ReindexPriority];

/**
 * Metadata for reindex jobs
 */
export interface ReindexJobMetadata {
  courseId?: string;
  affectedDocuments?: string[];
  batchSize?: number;
  contentHash?: string;
  source?: string;
  triggeredBy?: string;
  custom?: Record<string, unknown>;
}

// ============================================================================
// REINDEX RESULT TYPES
// ============================================================================

/**
 * Result of a reindex operation
 */
export interface ReindexResult {
  jobId: string;
  success: boolean;
  documentsProcessed: number;
  documentsAdded: number;
  documentsUpdated: number;
  documentsDeleted: number;
  errors: ReindexError[];
  duration: number;
  timestamp: Date;
}

/**
 * Error during reindexing
 */
export interface ReindexError {
  documentId?: string;
  entityId?: string;
  message: string;
  code: string;
  recoverable: boolean;
}

// ============================================================================
// LIFECYCLE MANAGER TYPES
// ============================================================================

/**
 * Memory lifecycle manager configuration
 */
export interface MemoryLifecycleConfig {
  /** Enable automatic reindexing */
  autoReindexEnabled: boolean;
  /** Debounce time for rapid updates (ms) */
  debounceMs: number;
  /** Maximum batch size for bulk operations */
  maxBatchSize: number;
  /** Maximum concurrent reindex jobs */
  maxConcurrentJobs: number;
  /** Job retry configuration */
  retry: {
    maxAttempts: number;
    backoffMs: number;
    backoffMultiplier: number;
  };
  /** Priority rules */
  priorityRules: PriorityRule[];
  /** Entity-specific configurations */
  entityConfigs: Record<ContentEntityType, EntityReindexConfig>;
}

/**
 * Priority rule for determining job priority
 */
export interface PriorityRule {
  condition: {
    entityTypes?: ContentEntityType[];
    changeTypes?: ChangeType[];
    custom?: (event: ContentChangeEvent) => boolean;
  };
  priority: ReindexPriority;
}

/**
 * Entity-specific reindex configuration
 */
export interface EntityReindexConfig {
  enabled: boolean;
  debounceMs?: number;
  batchSize?: number;
  extractContent: (entityId: string) => Promise<ExtractedContent | null>;
}

/**
 * Extracted content ready for embedding
 */
export interface ExtractedContent {
  id: string;
  content: string;
  title?: string;
  metadata: Record<string, unknown>;
  chunks?: ContentChunk[];
}

/**
 * Content chunk for large documents
 */
export interface ContentChunk {
  id: string;
  content: string;
  index: number;
  metadata: Record<string, unknown>;
}

// ============================================================================
// LIFECYCLE MANAGER INTERFACE
// ============================================================================

/**
 * Memory lifecycle manager interface
 */
export interface MemoryLifecycleManagerInterface {
  /** Handle content change event */
  handleContentChange(event: ContentChangeEvent): Promise<void>;

  /** Queue a reindex job */
  queueReindexJob(job: Omit<ReindexJob, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReindexJob>;

  /** Get pending jobs */
  getPendingJobs(limit?: number): Promise<ReindexJob[]>;

  /** Process next batch of jobs */
  processJobs(): Promise<ReindexResult[]>;

  /** Cancel a job */
  cancelJob(jobId: string): Promise<boolean>;

  /** Get job status */
  getJobStatus(jobId: string): Promise<ReindexJob | null>;

  /** Get lifecycle statistics */
  getStats(): Promise<LifecycleStats>;

  /** Trigger full reindex for an entity type */
  triggerFullReindex(entityType: ContentEntityType): Promise<ReindexJob>;

  /** Start the lifecycle manager */
  start(): Promise<void>;

  /** Stop the lifecycle manager */
  stop(): Promise<void>;
}

/**
 * Lifecycle statistics
 */
export interface LifecycleStats {
  pendingJobs: number;
  processingJobs: number;
  completedToday: number;
  failedToday: number;
  averageProcessingTime: number;
  lastProcessedAt?: Date;
  queueDepthByPriority: Record<number, number>;
}

// ============================================================================
// JOB STORE INTERFACE
// ============================================================================

/**
 * Storage interface for reindex jobs
 */
export interface ReindexJobStore {
  create(job: Omit<ReindexJob, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReindexJob>;
  get(id: string): Promise<ReindexJob | null>;
  update(id: string, updates: Partial<ReindexJob>): Promise<ReindexJob | null>;
  delete(id: string): Promise<boolean>;
  findPending(limit: number): Promise<ReindexJob[]>;
  findByEntity(entityType: ContentEntityType, entityId: string): Promise<ReindexJob[]>;
  findByStatus(status: ReindexJobStatus, limit?: number): Promise<ReindexJob[]>;
  countByStatus(): Promise<Record<ReindexJobStatus, number>>;
  cleanupCompleted(olderThan: Date): Promise<number>;
}

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const ContentChangeEventSchema = z.object({
  id: z.string().min(1),
  entityType: z.enum([
    'course',
    'chapter',
    'section',
    'lesson',
    'quiz',
    'resource',
    'user_note',
    'conversation',
  ]),
  entityId: z.string().min(1),
  changeType: z.enum(['create', 'update', 'delete', 'bulk_update']),
  timestamp: z.date(),
  metadata: z.object({
    courseId: z.string().optional(),
    chapterId: z.string().optional(),
    sectionId: z.string().optional(),
    userId: z.string().optional(),
    previousHash: z.string().optional(),
    newHash: z.string().optional(),
    fieldsChanged: z.array(z.string()).optional(),
    batchId: z.string().optional(),
  }),
});

export const MemoryLifecycleConfigSchema = z.object({
  autoReindexEnabled: z.boolean().default(true),
  debounceMs: z.number().min(0).default(5000),
  maxBatchSize: z.number().min(1).max(1000).default(100),
  maxConcurrentJobs: z.number().min(1).max(50).default(5),
  retry: z.object({
    maxAttempts: z.number().min(1).max(10).default(3),
    backoffMs: z.number().min(100).max(60000).default(1000),
    backoffMultiplier: z.number().min(1).max(10).default(2),
  }),
  priorityRules: z.array(z.any()).default([]),
  entityConfigs: z.record(z.any()).default({}),
});
