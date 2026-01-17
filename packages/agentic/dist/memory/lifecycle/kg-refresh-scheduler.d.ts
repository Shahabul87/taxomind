/**
 * @sam-ai/agentic - Knowledge Graph Refresh Scheduler
 * Manages scheduled KG updates and relationship maintenance
 */
import type { MemoryLogger } from '../types';
import type { KnowledgeGraphStore, EntityType, RelationshipType } from '../types';
/**
 * KG Refresh job types
 */
export declare const KGRefreshJobType: {
    readonly FULL_REBUILD: "full_rebuild";
    readonly INCREMENTAL: "incremental";
    readonly RELATIONSHIP_CHECK: "relationship_check";
    readonly STALE_PRUNING: "stale_pruning";
    readonly CONSISTENCY_CHECK: "consistency_check";
};
export type KGRefreshJobType = (typeof KGRefreshJobType)[keyof typeof KGRefreshJobType];
/**
 * KG Refresh job status
 */
export declare const KGRefreshJobStatus: {
    readonly PENDING: "pending";
    readonly RUNNING: "running";
    readonly COMPLETED: "completed";
    readonly FAILED: "failed";
    readonly CANCELLED: "cancelled";
};
export type KGRefreshJobStatus = (typeof KGRefreshJobStatus)[keyof typeof KGRefreshJobStatus];
/**
 * KG Refresh job definition
 */
export interface KGRefreshJob {
    id: string;
    type: KGRefreshJobType;
    status: KGRefreshJobStatus;
    entityTypes?: EntityType[];
    relationshipTypes?: RelationshipType[];
    scheduledFor: Date;
    startedAt?: Date;
    completedAt?: Date;
    result?: KGRefreshResult;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Result of a KG refresh operation
 */
export interface KGRefreshResult {
    entitiesProcessed: number;
    entitiesAdded: number;
    entitiesUpdated: number;
    entitiesDeleted: number;
    relationshipsProcessed: number;
    relationshipsAdded: number;
    relationshipsUpdated: number;
    relationshipsDeleted: number;
    staleRelationshipsPruned: number;
    inconsistenciesFound: number;
    inconsistenciesFixed: number;
    duration: number;
}
/**
 * KG Refresh scheduler configuration
 */
export interface KGRefreshSchedulerConfig {
    /** Enable scheduled refresh */
    enabled: boolean;
    /** Cron expression or interval in ms for periodic refresh */
    scheduleIntervalMs: number;
    /** Maximum age for relationships before considered stale (ms) */
    staleRelationshipAgeMs: number;
    /** Entity types to refresh */
    entityTypes: EntityType[];
    /** Run incremental updates instead of full rebuild */
    incrementalMode: boolean;
    /** Maximum entities to process per job */
    batchSize: number;
    /** Minimum confidence for relationships */
    minRelationshipConfidence: number;
}
/**
 * KG Refresh scheduler interface
 */
export interface KGRefreshSchedulerInterface {
    /** Schedule a refresh job */
    scheduleRefresh(type: KGRefreshJobType, options?: Partial<KGRefreshJob>): Promise<KGRefreshJob>;
    /** Execute pending jobs */
    executePendingJobs(): Promise<KGRefreshResult[]>;
    /** Get job status */
    getJobStatus(jobId: string): Promise<KGRefreshJob | null>;
    /** Cancel a job */
    cancelJob(jobId: string): Promise<boolean>;
    /** Get scheduler statistics */
    getStats(): Promise<KGRefreshStats>;
    /** Start the scheduler */
    start(): Promise<void>;
    /** Stop the scheduler */
    stop(): Promise<void>;
}
/**
 * KG Refresh statistics
 */
export interface KGRefreshStats {
    lastRefreshAt?: Date;
    lastRefreshDuration?: number;
    totalEntities: number;
    totalRelationships: number;
    staleRelationships: number;
    pendingJobs: number;
    completedJobs24h: number;
}
export declare class KGRefreshScheduler implements KGRefreshSchedulerInterface {
    private readonly config;
    private readonly kgStore;
    private readonly logger;
    private jobs;
    private isRunning;
    private schedulerInterval?;
    constructor(options: {
        config?: Partial<KGRefreshSchedulerConfig>;
        kgStore: KnowledgeGraphStore;
        logger?: MemoryLogger;
    });
    scheduleRefresh(type: KGRefreshJobType, options?: Partial<KGRefreshJob>): Promise<KGRefreshJob>;
    executePendingJobs(): Promise<KGRefreshResult[]>;
    private executeJob;
    private executeFullRebuild;
    private executeIncrementalRefresh;
    private executeRelationshipCheck;
    private executeStalePruning;
    private executeConsistencyCheck;
    private validateRelationship;
    getJobStatus(jobId: string): Promise<KGRefreshJob | null>;
    cancelJob(jobId: string): Promise<boolean>;
    getStats(): Promise<KGRefreshStats>;
    start(): Promise<void>;
    stop(): Promise<void>;
}
export declare function createKGRefreshScheduler(options: {
    config?: Partial<KGRefreshSchedulerConfig>;
    kgStore: KnowledgeGraphStore;
    logger?: MemoryLogger;
}): KGRefreshScheduler;
//# sourceMappingURL=kg-refresh-scheduler.d.ts.map