/**
 * @sam-ai/agentic - Memory Lifecycle Manager
 * Manages memory reindexing and lifecycle operations
 */
import type { MemoryLifecycleManagerInterface, MemoryLifecycleConfig, ContentChangeEvent, ReindexJob, ReindexJobStatus, ReindexResult, ReindexJobStore, LifecycleStats, ContentEntityType } from './types';
import type { VectorAdapter } from '@sam-ai/integration';
import type { MemoryLogger } from '../types';
export declare class InMemoryReindexJobStore implements ReindexJobStore {
    private jobs;
    create(job: Omit<ReindexJob, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReindexJob>;
    get(id: string): Promise<ReindexJob | null>;
    update(id: string, updates: Partial<ReindexJob>): Promise<ReindexJob | null>;
    delete(id: string): Promise<boolean>;
    findPending(limit: number): Promise<ReindexJob[]>;
    findByEntity(entityType: ContentEntityType, entityId: string): Promise<ReindexJob[]>;
    findByStatus(status: ReindexJobStatus, limit?: number): Promise<ReindexJob[]>;
    countByStatus(): Promise<Record<ReindexJobStatus, number>>;
    cleanupCompleted(olderThan: Date): Promise<number>;
    clear(): void;
}
export declare class MemoryLifecycleManager implements MemoryLifecycleManagerInterface {
    private readonly config;
    private readonly store;
    private readonly vectorAdapter;
    private readonly logger;
    private readonly debouncer;
    private isRunning;
    private processingInterval?;
    private activeJobs;
    constructor(options: {
        config?: Partial<MemoryLifecycleConfig>;
        store?: ReindexJobStore;
        vectorAdapter: VectorAdapter;
        logger?: MemoryLogger;
    });
    handleContentChange(event: ContentChangeEvent): Promise<void>;
    private processDebouncedEvents;
    private calculatePriority;
    queueReindexJob(job: Omit<ReindexJob, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReindexJob>;
    getPendingJobs(limit?: number): Promise<ReindexJob[]>;
    processJobs(): Promise<ReindexResult[]>;
    private processJob;
    cancelJob(jobId: string): Promise<boolean>;
    getJobStatus(jobId: string): Promise<ReindexJob | null>;
    getStats(): Promise<LifecycleStats>;
    triggerFullReindex(entityType: ContentEntityType): Promise<ReindexJob>;
    start(): Promise<void>;
    stop(): Promise<void>;
}
export declare function createMemoryLifecycleManager(options: {
    config?: Partial<MemoryLifecycleConfig>;
    store?: ReindexJobStore;
    vectorAdapter: VectorAdapter;
    logger?: MemoryLogger;
}): MemoryLifecycleManager;
//# sourceMappingURL=memory-lifecycle-manager.d.ts.map