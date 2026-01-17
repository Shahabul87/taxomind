/**
 * @sam-ai/agentic - Memory Lifecycle Types
 * Type definitions for memory lifecycle management
 */
import { z } from 'zod';
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
};
/**
 * Types of changes that can occur
 */
export const ChangeType = {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    BULK_UPDATE: 'bulk_update',
};
/**
 * Types of reindex jobs
 */
export const ReindexJobType = {
    SINGLE: 'single',
    BATCH: 'batch',
    FULL: 'full',
    INCREMENTAL: 'incremental',
};
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
};
/**
 * Priority levels for reindex jobs
 */
export const ReindexPriority = {
    LOW: 1,
    NORMAL: 5,
    HIGH: 10,
    CRITICAL: 100,
};
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
//# sourceMappingURL=types.js.map