/**
 * @sam-ai/agentic - Background Worker
 * Manages background job processing for memory operations
 */
import type { BackgroundWorkerInterface, JobQueueInterface, JobQueueConfig, WorkerConfig, WorkerStatus, WorkerStats, BaseJob, JobType, JobStatus, JobHandler, JobEvent, JobEventListener, QueueStats } from './types';
import type { MemoryLogger } from '../types';
export declare class InMemoryJobQueue implements JobQueueInterface {
    private readonly config;
    private readonly logger;
    private jobs;
    private listeners;
    private isPaused;
    private processedCount;
    private totalProcessingTime;
    private lastProcessedAt?;
    constructor(options?: {
        config?: Partial<JobQueueConfig>;
        logger?: MemoryLogger;
    });
    add<TData>(type: JobType, data: TData, options?: Partial<BaseJob>): Promise<BaseJob>;
    get(jobId: string): Promise<BaseJob | null>;
    update(jobId: string, updates: Partial<BaseJob>): Promise<BaseJob | null>;
    remove(jobId: string): Promise<boolean>;
    getNextPending(): Promise<BaseJob | null>;
    getByStatus(status: JobStatus, limit?: number): Promise<BaseJob[]>;
    getStats(): Promise<QueueStats>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    cleanup(olderThan: Date): Promise<number>;
    on(event: JobEvent, listener: JobEventListener): void;
    off(event: JobEvent, listener: JobEventListener): void;
    private emit;
    recordProcessing(durationMs: number): void;
    clear(): void;
}
export declare class BackgroundWorker implements BackgroundWorkerInterface {
    private readonly config;
    private readonly queues;
    private readonly handlers;
    private readonly logger;
    private status;
    private startedAt?;
    private processedJobs;
    private failedJobs;
    private activeJobs;
    private totalProcessingTime;
    private lastActivityAt?;
    private pollInterval?;
    private shutdownPromise?;
    constructor(options: {
        config?: Partial<WorkerConfig>;
        queues?: Map<string, JobQueueInterface>;
        logger?: MemoryLogger;
    });
    start(): Promise<void>;
    stop(): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    registerHandler<TData, TResult>(type: JobType, handler: JobHandler<TData, TResult>): void;
    unregisterHandler(type: JobType): void;
    getStatus(): WorkerStatus;
    getStats(): WorkerStats;
    processJob(jobId: string): Promise<void>;
    private poll;
    private executeJob;
    getQueue(name: string): JobQueueInterface | undefined;
    addJob<TData>(type: JobType, data: TData, options?: Partial<BaseJob> & {
        queue?: string;
    }): Promise<BaseJob>;
}
export declare function createBackgroundWorker(options?: {
    config?: Partial<WorkerConfig>;
    queues?: Map<string, JobQueueInterface>;
    logger?: MemoryLogger;
}): BackgroundWorker;
export declare function createJobQueue(options?: {
    config?: Partial<JobQueueConfig>;
    logger?: MemoryLogger;
}): InMemoryJobQueue;
//# sourceMappingURL=background-worker.d.ts.map