/**
 * @sam-ai/agentic - Background Worker Types
 * Type definitions for background job processing
 */
import { z } from 'zod';
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
};
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
};
/**
 * Default queue configuration
 */
export const DEFAULT_QUEUE_CONFIG = {
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
 * Default worker configuration
 */
export const DEFAULT_WORKER_CONFIG = {
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
};
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
};
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
//# sourceMappingURL=types.js.map