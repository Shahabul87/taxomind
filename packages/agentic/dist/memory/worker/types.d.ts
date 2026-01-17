/**
 * @sam-ai/agentic - Background Worker Types
 * Type definitions for background job processing
 */
import { z } from 'zod';
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
export declare const JobType: {
    readonly REINDEX: "reindex";
    readonly KG_REFRESH: "kg_refresh";
    readonly EMBEDDING_GENERATION: "embedding_generation";
    readonly CONTENT_ANALYSIS: "content_analysis";
    readonly MEMORY_CLEANUP: "memory_cleanup";
    readonly NOTIFICATION: "notification";
    readonly SCHEDULED_TASK: "scheduled_task";
    readonly CUSTOM: "custom";
};
export type JobType = (typeof JobType)[keyof typeof JobType];
/**
 * Job status
 */
export declare const JobStatus: {
    readonly PENDING: "pending";
    readonly QUEUED: "queued";
    readonly ACTIVE: "active";
    readonly COMPLETED: "completed";
    readonly FAILED: "failed";
    readonly CANCELLED: "cancelled";
    readonly DELAYED: "delayed";
    readonly PAUSED: "paused";
};
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];
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
export declare const DEFAULT_QUEUE_CONFIG: JobQueueConfig;
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
export declare const DEFAULT_WORKER_CONFIG: WorkerConfig;
/**
 * Worker status
 */
export declare const WorkerStatus: {
    readonly IDLE: "idle";
    readonly RUNNING: "running";
    readonly PAUSED: "paused";
    readonly STOPPING: "stopping";
    readonly STOPPED: "stopped";
};
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
/**
 * Job handler function
 */
export type JobHandler<TData = unknown, TResult = unknown> = (job: BaseJob & {
    data: TData;
}) => Promise<TResult>;
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
export declare const JobEvent: {
    readonly CREATED: "created";
    readonly STARTED: "started";
    readonly PROGRESS: "progress";
    readonly COMPLETED: "completed";
    readonly FAILED: "failed";
    readonly RETRYING: "retrying";
    readonly CANCELLED: "cancelled";
};
export type JobEvent = (typeof JobEvent)[keyof typeof JobEvent];
/**
 * Job event listener
 */
export type JobEventListener = (event: JobEvent, job: BaseJob) => void;
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
    registerHandler<TData, TResult>(type: JobType, handler: JobHandler<TData, TResult>, config?: Partial<JobQueueConfig>): void;
    /** Unregister job handler */
    unregisterHandler(type: JobType): void;
    /** Process a specific job (for testing) */
    processJob(jobId: string): Promise<void>;
}
export declare const BaseJobSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["reindex", "kg_refresh", "embedding_generation", "content_analysis", "memory_cleanup", "notification", "scheduled_task", "custom"]>;
    status: z.ZodEnum<["pending", "queued", "active", "completed", "failed", "cancelled", "delayed", "paused"]>;
    priority: z.ZodNumber;
    data: z.ZodUnknown;
    result: z.ZodOptional<z.ZodUnknown>;
    error: z.ZodOptional<z.ZodString>;
    attempts: z.ZodNumber;
    maxAttempts: z.ZodNumber;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    scheduledFor: z.ZodDate;
    startedAt: z.ZodOptional<z.ZodDate>;
    completedAt: z.ZodOptional<z.ZodDate>;
    progress: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "custom" | "notification" | "reindex" | "kg_refresh" | "embedding_generation" | "content_analysis" | "memory_cleanup" | "scheduled_task";
    status: "active" | "paused" | "completed" | "failed" | "cancelled" | "pending" | "queued" | "delayed";
    priority: number;
    createdAt: Date;
    id: string;
    updatedAt: Date;
    scheduledFor: Date;
    attempts: number;
    maxAttempts: number;
    result?: unknown;
    progress?: number | undefined;
    completedAt?: Date | undefined;
    error?: string | undefined;
    startedAt?: Date | undefined;
    data?: unknown;
}, {
    type: "custom" | "notification" | "reindex" | "kg_refresh" | "embedding_generation" | "content_analysis" | "memory_cleanup" | "scheduled_task";
    status: "active" | "paused" | "completed" | "failed" | "cancelled" | "pending" | "queued" | "delayed";
    priority: number;
    createdAt: Date;
    id: string;
    updatedAt: Date;
    scheduledFor: Date;
    attempts: number;
    maxAttempts: number;
    result?: unknown;
    progress?: number | undefined;
    completedAt?: Date | undefined;
    error?: string | undefined;
    startedAt?: Date | undefined;
    data?: unknown;
}>;
export declare const JobQueueConfigSchema: z.ZodObject<{
    name: z.ZodString;
    concurrency: z.ZodNumber;
    defaultPriority: z.ZodNumber;
    defaultMaxAttempts: z.ZodNumber;
    retryDelayMs: z.ZodNumber;
    retryBackoffMultiplier: z.ZodNumber;
    jobTimeoutMs: z.ZodNumber;
    cleanupAfterMs: z.ZodNumber;
    persistJobs: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    name: string;
    concurrency: number;
    defaultPriority: number;
    defaultMaxAttempts: number;
    retryDelayMs: number;
    retryBackoffMultiplier: number;
    jobTimeoutMs: number;
    cleanupAfterMs: number;
    persistJobs: boolean;
}, {
    name: string;
    concurrency: number;
    defaultPriority: number;
    defaultMaxAttempts: number;
    retryDelayMs: number;
    retryBackoffMultiplier: number;
    jobTimeoutMs: number;
    cleanupAfterMs: number;
    persistJobs: boolean;
}>;
export declare const WorkerConfigSchema: z.ZodObject<{
    id: z.ZodString;
    queues: z.ZodArray<z.ZodString, "many">;
    concurrency: z.ZodNumber;
    pollIntervalMs: z.ZodNumber;
    maxJobsPerCycle: z.ZodNumber;
    gracefulShutdown: z.ZodBoolean;
    shutdownTimeoutMs: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    concurrency: number;
    queues: string[];
    pollIntervalMs: number;
    maxJobsPerCycle: number;
    gracefulShutdown: boolean;
    shutdownTimeoutMs: number;
}, {
    id: string;
    concurrency: number;
    queues: string[];
    pollIntervalMs: number;
    maxJobsPerCycle: number;
    gracefulShutdown: boolean;
    shutdownTimeoutMs: number;
}>;
//# sourceMappingURL=types.d.ts.map