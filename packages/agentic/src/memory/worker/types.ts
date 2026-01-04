/**
 * @sam-ai/agentic - Background Worker Types
 * Type definitions for background job processing
 */

import { z } from 'zod';

// ============================================================================
// JOB TYPES
// ============================================================================

/**
 * Base job interface
 */
export interface BaseJob {
  id: string;
  type: JobType;
  status: JobStatus;
  priority: number;
  data: unknown;
  result?: unknown;
  error?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  updatedAt: Date;
  scheduledFor: Date;
  startedAt?: Date;
  completedAt?: Date;
  progress?: number;
}

/**
 * Job types
 */
export const JobType = {
  REINDEX: 'reindex',
  KG_REFRESH: 'kg_refresh',
  EMBEDDING_GENERATION: 'embedding_generation',
  CONTENT_ANALYSIS: 'content_analysis',
  MEMORY_CLEANUP: 'memory_cleanup',
  NOTIFICATION: 'notification',
  SCHEDULED_TASK: 'scheduled_task',
  CUSTOM: 'custom',
} as const;

export type JobType = (typeof JobType)[keyof typeof JobType];

/**
 * Job status
 */
export const JobStatus = {
  PENDING: 'pending',
  QUEUED: 'queued',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  DELAYED: 'delayed',
  PAUSED: 'paused',
} as const;

export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

// ============================================================================
// QUEUE TYPES
// ============================================================================

/**
 * Job queue configuration
 */
export interface JobQueueConfig {
  /** Queue name */
  name: string;
  /** Maximum concurrent jobs */
  concurrency: number;
  /** Default job priority */
  defaultPriority: number;
  /** Default retry attempts */
  defaultMaxAttempts: number;
  /** Retry delay in ms */
  retryDelayMs: number;
  /** Retry backoff multiplier */
  retryBackoffMultiplier: number;
  /** Job timeout in ms */
  jobTimeoutMs: number;
  /** Clean up completed jobs after (ms) */
  cleanupAfterMs: number;
  /** Enable job persistence */
  persistJobs: boolean;
}

/**
 * Default queue configuration
 */
export const DEFAULT_QUEUE_CONFIG: JobQueueConfig = {
  name: 'default',
  concurrency: 5,
  defaultPriority: 5,
  defaultMaxAttempts: 3,
  retryDelayMs: 1000,
  retryBackoffMultiplier: 2,
  jobTimeoutMs: 300000, // 5 minutes
  cleanupAfterMs: 86400000, // 24 hours
  persistJobs: false,
};

/**
 * Job queue statistics
 */
export interface QueueStats {
  name: string;
  pending: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
  totalProcessed: number;
  avgProcessingTime: number;
  lastProcessedAt?: Date;
}

// ============================================================================
// WORKER TYPES
// ============================================================================

/**
 * Worker configuration
 */
export interface WorkerConfig {
  /** Worker ID */
  id: string;
  /** Queues to process */
  queues: string[];
  /** Processing concurrency per queue */
  concurrency: number;
  /** Poll interval when idle (ms) */
  pollIntervalMs: number;
  /** Maximum jobs to process before pause */
  maxJobsPerCycle: number;
  /** Enable graceful shutdown */
  gracefulShutdown: boolean;
  /** Shutdown timeout (ms) */
  shutdownTimeoutMs: number;
}

/**
 * Default worker configuration
 */
export const DEFAULT_WORKER_CONFIG: WorkerConfig = {
  id: 'worker-default',
  queues: ['default'],
  concurrency: 5,
  pollIntervalMs: 1000,
  maxJobsPerCycle: 100,
  gracefulShutdown: true,
  shutdownTimeoutMs: 30000,
};

/**
 * Worker status
 */
export const WorkerStatus = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  STOPPING: 'stopping',
  STOPPED: 'stopped',
} as const;

export type WorkerStatus = (typeof WorkerStatus)[keyof typeof WorkerStatus];

/**
 * Worker statistics
 */
export interface WorkerStats {
  id: string;
  status: WorkerStatus;
  startedAt?: Date;
  activeJobs: number;
  processedJobs: number;
  failedJobs: number;
  avgProcessingTime: number;
  lastActivityAt?: Date;
  uptime: number;
}

// ============================================================================
// JOB HANDLER TYPES
// ============================================================================

/**
 * Job handler function
 */
export type JobHandler<TData = unknown, TResult = unknown> = (
  job: BaseJob & { data: TData }
) => Promise<TResult>;

/**
 * Job handler registration
 */
export interface JobHandlerRegistration {
  type: JobType;
  handler: JobHandler;
  config?: Partial<JobQueueConfig>;
}

/**
 * Job progress update
 */
export interface JobProgress {
  jobId: string;
  progress: number;
  message?: string;
}

/**
 * Job event types
 */
export const JobEvent = {
  CREATED: 'created',
  STARTED: 'started',
  PROGRESS: 'progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  RETRYING: 'retrying',
  CANCELLED: 'cancelled',
} as const;

export type JobEvent = (typeof JobEvent)[keyof typeof JobEvent];

/**
 * Job event listener
 */
export type JobEventListener = (event: JobEvent, job: BaseJob) => void;

// ============================================================================
// QUEUE INTERFACE
// ============================================================================

/**
 * Job queue interface
 */
export interface JobQueueInterface {
  /** Add a job to the queue */
  add<TData>(type: JobType, data: TData, options?: Partial<BaseJob>): Promise<BaseJob>;

  /** Get a job by ID */
  get(jobId: string): Promise<BaseJob | null>;

  /** Update job */
  update(jobId: string, updates: Partial<BaseJob>): Promise<BaseJob | null>;

  /** Remove a job */
  remove(jobId: string): Promise<boolean>;

  /** Get next pending job */
  getNextPending(): Promise<BaseJob | null>;

  /** Get jobs by status */
  getByStatus(status: JobStatus, limit?: number): Promise<BaseJob[]>;

  /** Get queue statistics */
  getStats(): Promise<QueueStats>;

  /** Pause the queue */
  pause(): Promise<void>;

  /** Resume the queue */
  resume(): Promise<void>;

  /** Clean up old jobs */
  cleanup(olderThan: Date): Promise<number>;

  /** Register job event listener */
  on(event: JobEvent, listener: JobEventListener): void;

  /** Remove job event listener */
  off(event: JobEvent, listener: JobEventListener): void;
}

// ============================================================================
// WORKER INTERFACE
// ============================================================================

/**
 * Background worker interface
 */
export interface BackgroundWorkerInterface {
  /** Start the worker */
  start(): Promise<void>;

  /** Stop the worker */
  stop(): Promise<void>;

  /** Pause processing */
  pause(): Promise<void>;

  /** Resume processing */
  resume(): Promise<void>;

  /** Get worker status */
  getStatus(): WorkerStatus;

  /** Get worker statistics */
  getStats(): WorkerStats;

  /** Register job handler */
  registerHandler<TData, TResult>(
    type: JobType,
    handler: JobHandler<TData, TResult>,
    config?: Partial<JobQueueConfig>
  ): void;

  /** Unregister job handler */
  unregisterHandler(type: JobType): void;

  /** Process a specific job (for testing) */
  processJob(jobId: string): Promise<void>;
}

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const BaseJobSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    'reindex',
    'kg_refresh',
    'embedding_generation',
    'content_analysis',
    'memory_cleanup',
    'notification',
    'scheduled_task',
    'custom',
  ]),
  status: z.enum([
    'pending',
    'queued',
    'active',
    'completed',
    'failed',
    'cancelled',
    'delayed',
    'paused',
  ]),
  priority: z.number().min(0).max(100),
  data: z.unknown(),
  result: z.unknown().optional(),
  error: z.string().optional(),
  attempts: z.number().min(0),
  maxAttempts: z.number().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
  scheduledFor: z.date(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  progress: z.number().min(0).max(100).optional(),
});

export const JobQueueConfigSchema = z.object({
  name: z.string().min(1),
  concurrency: z.number().min(1).max(100),
  defaultPriority: z.number().min(0).max(100),
  defaultMaxAttempts: z.number().min(1).max(10),
  retryDelayMs: z.number().min(100).max(3600000),
  retryBackoffMultiplier: z.number().min(1).max(10),
  jobTimeoutMs: z.number().min(1000).max(3600000),
  cleanupAfterMs: z.number().min(60000),
  persistJobs: z.boolean(),
});

export const WorkerConfigSchema = z.object({
  id: z.string().min(1),
  queues: z.array(z.string().min(1)),
  concurrency: z.number().min(1).max(50),
  pollIntervalMs: z.number().min(100).max(60000),
  maxJobsPerCycle: z.number().min(1).max(1000),
  gracefulShutdown: z.boolean(),
  shutdownTimeoutMs: z.number().min(1000).max(300000),
});
