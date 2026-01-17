/**
 * @sam-ai/agentic - Memory Lifecycle Types
 * Type definitions for memory lifecycle management
 */
import { z } from 'zod';
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
export declare const ContentEntityType: {
    readonly COURSE: "course";
    readonly CHAPTER: "chapter";
    readonly SECTION: "section";
    readonly LESSON: "lesson";
    readonly QUIZ: "quiz";
    readonly RESOURCE: "resource";
    readonly USER_NOTE: "user_note";
    readonly CONVERSATION: "conversation";
};
export type ContentEntityType = (typeof ContentEntityType)[keyof typeof ContentEntityType];
/**
 * Types of changes that can occur
 */
export declare const ChangeType: {
    readonly CREATE: "create";
    readonly UPDATE: "update";
    readonly DELETE: "delete";
    readonly BULK_UPDATE: "bulk_update";
};
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
export declare const ReindexJobType: {
    readonly SINGLE: "single";
    readonly BATCH: "batch";
    readonly FULL: "full";
    readonly INCREMENTAL: "incremental";
};
export type ReindexJobType = (typeof ReindexJobType)[keyof typeof ReindexJobType];
/**
 * Reindex job status
 */
export declare const ReindexJobStatus: {
    readonly PENDING: "pending";
    readonly QUEUED: "queued";
    readonly PROCESSING: "processing";
    readonly COMPLETED: "completed";
    readonly FAILED: "failed";
    readonly CANCELLED: "cancelled";
    readonly RETRYING: "retrying";
};
export type ReindexJobStatus = (typeof ReindexJobStatus)[keyof typeof ReindexJobStatus];
/**
 * Priority levels for reindex jobs
 */
export declare const ReindexPriority: {
    readonly LOW: 1;
    readonly NORMAL: 5;
    readonly HIGH: 10;
    readonly CRITICAL: 100;
};
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
export declare const ContentChangeEventSchema: z.ZodObject<{
    id: z.ZodString;
    entityType: z.ZodEnum<["course", "chapter", "section", "lesson", "quiz", "resource", "user_note", "conversation"]>;
    entityId: z.ZodString;
    changeType: z.ZodEnum<["create", "update", "delete", "bulk_update"]>;
    timestamp: z.ZodDate;
    metadata: z.ZodObject<{
        courseId: z.ZodOptional<z.ZodString>;
        chapterId: z.ZodOptional<z.ZodString>;
        sectionId: z.ZodOptional<z.ZodString>;
        userId: z.ZodOptional<z.ZodString>;
        previousHash: z.ZodOptional<z.ZodString>;
        newHash: z.ZodOptional<z.ZodString>;
        fieldsChanged: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        batchId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        userId?: string | undefined;
        previousHash?: string | undefined;
        newHash?: string | undefined;
        fieldsChanged?: string[] | undefined;
        batchId?: string | undefined;
    }, {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        userId?: string | undefined;
        previousHash?: string | undefined;
        newHash?: string | undefined;
        fieldsChanged?: string[] | undefined;
        batchId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    metadata: {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        userId?: string | undefined;
        previousHash?: string | undefined;
        newHash?: string | undefined;
        fieldsChanged?: string[] | undefined;
        batchId?: string | undefined;
    };
    timestamp: Date;
    entityId: string;
    entityType: "resource" | "quiz" | "chapter" | "section" | "user_note" | "conversation" | "course" | "lesson";
    changeType: "create" | "update" | "delete" | "bulk_update";
}, {
    id: string;
    metadata: {
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        userId?: string | undefined;
        previousHash?: string | undefined;
        newHash?: string | undefined;
        fieldsChanged?: string[] | undefined;
        batchId?: string | undefined;
    };
    timestamp: Date;
    entityId: string;
    entityType: "resource" | "quiz" | "chapter" | "section" | "user_note" | "conversation" | "course" | "lesson";
    changeType: "create" | "update" | "delete" | "bulk_update";
}>;
export declare const MemoryLifecycleConfigSchema: z.ZodObject<{
    autoReindexEnabled: z.ZodDefault<z.ZodBoolean>;
    debounceMs: z.ZodDefault<z.ZodNumber>;
    maxBatchSize: z.ZodDefault<z.ZodNumber>;
    maxConcurrentJobs: z.ZodDefault<z.ZodNumber>;
    retry: z.ZodObject<{
        maxAttempts: z.ZodDefault<z.ZodNumber>;
        backoffMs: z.ZodDefault<z.ZodNumber>;
        backoffMultiplier: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        maxAttempts: number;
        backoffMs: number;
        backoffMultiplier: number;
    }, {
        maxAttempts?: number | undefined;
        backoffMs?: number | undefined;
        backoffMultiplier?: number | undefined;
    }>;
    priorityRules: z.ZodDefault<z.ZodArray<z.ZodAny, "many">>;
    entityConfigs: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    retry: {
        maxAttempts: number;
        backoffMs: number;
        backoffMultiplier: number;
    };
    autoReindexEnabled: boolean;
    debounceMs: number;
    maxBatchSize: number;
    maxConcurrentJobs: number;
    priorityRules: any[];
    entityConfigs: Record<string, any>;
}, {
    retry: {
        maxAttempts?: number | undefined;
        backoffMs?: number | undefined;
        backoffMultiplier?: number | undefined;
    };
    autoReindexEnabled?: boolean | undefined;
    debounceMs?: number | undefined;
    maxBatchSize?: number | undefined;
    maxConcurrentJobs?: number | undefined;
    priorityRules?: any[] | undefined;
    entityConfigs?: Record<string, any> | undefined;
}>;
//# sourceMappingURL=types.d.ts.map