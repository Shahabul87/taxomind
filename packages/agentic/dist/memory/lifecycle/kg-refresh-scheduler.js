/**
 * @sam-ai/agentic - Knowledge Graph Refresh Scheduler
 * Manages scheduled KG updates and relationship maintenance
 */
import { v4 as uuidv4 } from 'uuid';
// ============================================================================
// TYPES
// ============================================================================
/**
 * KG Refresh job types
 */
export const KGRefreshJobType = {
    FULL_REBUILD: 'full_rebuild',
    INCREMENTAL: 'incremental',
    RELATIONSHIP_CHECK: 'relationship_check',
    STALE_PRUNING: 'stale_pruning',
    CONSISTENCY_CHECK: 'consistency_check',
};
/**
 * KG Refresh job status
 */
export const KGRefreshJobStatus = {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
};
// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================
const DEFAULT_CONFIG = {
    enabled: true,
    scheduleIntervalMs: 6 * 60 * 60 * 1000, // 6 hours
    staleRelationshipAgeMs: 7 * 24 * 60 * 60 * 1000, // 7 days
    entityTypes: ['concept', 'topic', 'skill', 'course', 'chapter', 'section'],
    incrementalMode: true,
    batchSize: 100,
    minRelationshipConfidence: 0.5,
};
// ============================================================================
// KG REFRESH SCHEDULER IMPLEMENTATION
// ============================================================================
export class KGRefreshScheduler {
    config;
    kgStore;
    logger;
    jobs = new Map();
    isRunning = false;
    schedulerInterval;
    constructor(options) {
        this.config = { ...DEFAULT_CONFIG, ...options.config };
        this.kgStore = options.kgStore;
        this.logger = options.logger ?? console;
    }
    // -------------------------------------------------------------------------
    // Job Management
    // -------------------------------------------------------------------------
    async scheduleRefresh(type, options) {
        const now = new Date();
        const job = {
            id: uuidv4(),
            type,
            status: 'pending',
            entityTypes: options?.entityTypes ?? this.config.entityTypes,
            relationshipTypes: options?.relationshipTypes,
            scheduledFor: options?.scheduledFor ?? now,
            createdAt: now,
            updatedAt: now,
        };
        this.jobs.set(job.id, job);
        this.logger.info('KG refresh job scheduled', {
            jobId: job.id,
            type: job.type,
            scheduledFor: job.scheduledFor,
        });
        return job;
    }
    async executePendingJobs() {
        const now = new Date();
        const pendingJobs = Array.from(this.jobs.values())
            .filter((j) => j.status === 'pending' && j.scheduledFor <= now)
            .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
        const results = [];
        for (const job of pendingJobs) {
            try {
                job.status = 'running';
                job.startedAt = new Date();
                job.updatedAt = new Date();
                this.jobs.set(job.id, job);
                const result = await this.executeJob(job);
                results.push(result);
                job.status = 'completed';
                job.completedAt = new Date();
                job.result = result;
                job.updatedAt = new Date();
                this.jobs.set(job.id, job);
                this.logger.info('KG refresh job completed', {
                    jobId: job.id,
                    type: job.type,
                    duration: result.duration,
                    entitiesProcessed: result.entitiesProcessed,
                    relationshipsProcessed: result.relationshipsProcessed,
                });
            }
            catch (error) {
                job.status = 'failed';
                job.error = error instanceof Error ? error.message : 'Unknown error';
                job.updatedAt = new Date();
                this.jobs.set(job.id, job);
                this.logger.error('KG refresh job failed', {
                    jobId: job.id,
                    error: job.error,
                });
            }
        }
        return results;
    }
    async executeJob(job) {
        const startTime = Date.now();
        const result = {
            entitiesProcessed: 0,
            entitiesAdded: 0,
            entitiesUpdated: 0,
            entitiesDeleted: 0,
            relationshipsProcessed: 0,
            relationshipsAdded: 0,
            relationshipsUpdated: 0,
            relationshipsDeleted: 0,
            staleRelationshipsPruned: 0,
            inconsistenciesFound: 0,
            inconsistenciesFixed: 0,
            duration: 0,
        };
        switch (job.type) {
            case 'full_rebuild':
                await this.executeFullRebuild(job, result);
                break;
            case 'incremental':
                await this.executeIncrementalRefresh(job, result);
                break;
            case 'relationship_check':
                await this.executeRelationshipCheck(job, result);
                break;
            case 'stale_pruning':
                await this.executeStalePruning(job, result);
                break;
            case 'consistency_check':
                await this.executeConsistencyCheck(job, result);
                break;
        }
        result.duration = Date.now() - startTime;
        return result;
    }
    async executeFullRebuild(job, result) {
        this.logger.info('Executing full KG rebuild', { jobId: job.id });
        for (const entityType of job.entityTypes ?? this.config.entityTypes) {
            const entities = await this.kgStore.findEntities(entityType, undefined, this.config.batchSize);
            for (const entity of entities) {
                result.entitiesProcessed++;
                // Refresh relationships for this entity
                const relationships = await this.kgStore.getRelationships(entity.id);
                result.relationshipsProcessed += relationships.length;
                // Validate and update relationships
                for (const rel of relationships) {
                    const isValid = await this.validateRelationship(rel);
                    if (!isValid) {
                        await this.kgStore.deleteRelationship(rel.id);
                        result.relationshipsDeleted++;
                    }
                }
            }
        }
    }
    async executeIncrementalRefresh(job, result) {
        this.logger.info('Executing incremental KG refresh', { jobId: job.id });
        // Get recently updated entities
        const cutoff = new Date(Date.now() - this.config.scheduleIntervalMs);
        for (const entityType of job.entityTypes ?? this.config.entityTypes) {
            const entities = await this.kgStore.findEntities(entityType, undefined, this.config.batchSize);
            // Filter to recently updated
            const recentEntities = entities.filter((e) => e.updatedAt >= cutoff);
            for (const entity of recentEntities) {
                result.entitiesProcessed++;
                // Check and update relationships
                const relationships = await this.kgStore.getRelationships(entity.id);
                result.relationshipsProcessed += relationships.length;
            }
        }
    }
    async executeRelationshipCheck(job, result) {
        this.logger.info('Executing relationship check', { jobId: job.id });
        for (const entityType of job.entityTypes ?? this.config.entityTypes) {
            const entities = await this.kgStore.findEntities(entityType, undefined, this.config.batchSize);
            for (const entity of entities) {
                const relationships = await this.kgStore.getRelationships(entity.id);
                for (const rel of relationships) {
                    result.relationshipsProcessed++;
                    // Check if target entity still exists
                    const target = await this.kgStore.getEntity(rel.targetId);
                    if (!target) {
                        await this.kgStore.deleteRelationship(rel.id);
                        result.relationshipsDeleted++;
                        result.inconsistenciesFound++;
                        result.inconsistenciesFixed++;
                    }
                }
            }
        }
    }
    async executeStalePruning(job, result) {
        this.logger.info('Executing stale relationship pruning', { jobId: job.id });
        const staleThreshold = new Date(Date.now() - this.config.staleRelationshipAgeMs);
        for (const entityType of job.entityTypes ?? this.config.entityTypes) {
            const entities = await this.kgStore.findEntities(entityType, undefined, this.config.batchSize);
            for (const entity of entities) {
                const relationships = await this.kgStore.getRelationships(entity.id);
                for (const rel of relationships) {
                    result.relationshipsProcessed++;
                    // Check if relationship is stale
                    if (rel.createdAt < staleThreshold && rel.weight < this.config.minRelationshipConfidence) {
                        await this.kgStore.deleteRelationship(rel.id);
                        result.staleRelationshipsPruned++;
                    }
                }
            }
        }
    }
    async executeConsistencyCheck(job, result) {
        this.logger.info('Executing consistency check', { jobId: job.id });
        for (const entityType of job.entityTypes ?? this.config.entityTypes) {
            const entities = await this.kgStore.findEntities(entityType, undefined, this.config.batchSize);
            for (const entity of entities) {
                result.entitiesProcessed++;
                // Check for orphaned entities
                const relationships = await this.kgStore.getRelationships(entity.id);
                if (relationships.length === 0) {
                    // Entity has no relationships - flag for review
                    result.inconsistenciesFound++;
                }
                // Check for duplicate relationships
                const relMap = new Map();
                for (const rel of relationships) {
                    result.relationshipsProcessed++;
                    const key = `${rel.type}:${rel.sourceId}:${rel.targetId}`;
                    if (relMap.has(key)) {
                        // Duplicate found - delete the older one
                        const existing = relMap.get(key);
                        const toDelete = rel.createdAt < existing.createdAt ? rel : existing;
                        await this.kgStore.deleteRelationship(toDelete.id);
                        result.inconsistenciesFound++;
                        result.inconsistenciesFixed++;
                    }
                    else {
                        relMap.set(key, rel);
                    }
                }
            }
        }
    }
    async validateRelationship(rel) {
        // Check if both source and target entities exist
        const source = await this.kgStore.getEntity(rel.sourceId);
        const target = await this.kgStore.getEntity(rel.targetId);
        return source !== null && target !== null;
    }
    // -------------------------------------------------------------------------
    // Status and Control
    // -------------------------------------------------------------------------
    async getJobStatus(jobId) {
        return this.jobs.get(jobId) ?? null;
    }
    async cancelJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job)
            return false;
        if (job.status === 'running') {
            this.logger.warn('Cannot cancel running job', { jobId });
            return false;
        }
        job.status = 'cancelled';
        job.updatedAt = new Date();
        this.jobs.set(jobId, job);
        return true;
    }
    async getStats() {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const completedJobs = Array.from(this.jobs.values()).filter((j) => j.status === 'completed' && j.completedAt && j.completedAt >= oneDayAgo);
        const lastCompleted = completedJobs.sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0))[0];
        return {
            lastRefreshAt: lastCompleted?.completedAt,
            lastRefreshDuration: lastCompleted?.result?.duration,
            totalEntities: 0, // Would need to query KG store
            totalRelationships: 0,
            staleRelationships: 0,
            pendingJobs: Array.from(this.jobs.values()).filter((j) => j.status === 'pending').length,
            completedJobs24h: completedJobs.length,
        };
    }
    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------
    async start() {
        if (this.isRunning) {
            this.logger.warn('KG refresh scheduler already running');
            return;
        }
        this.isRunning = true;
        this.logger.info('KG refresh scheduler started', {
            intervalMs: this.config.scheduleIntervalMs,
            incrementalMode: this.config.incrementalMode,
        });
        // Schedule initial job
        await this.scheduleRefresh(this.config.incrementalMode ? 'incremental' : 'full_rebuild');
        // Start periodic scheduling
        this.schedulerInterval = setInterval(async () => {
            try {
                // Execute pending jobs
                await this.executePendingJobs();
                // Schedule next refresh
                const nextRun = new Date(Date.now() + this.config.scheduleIntervalMs);
                await this.scheduleRefresh(this.config.incrementalMode ? 'incremental' : 'full_rebuild', { scheduledFor: nextRun });
            }
            catch (error) {
                this.logger.error('KG refresh scheduler error', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }, this.config.scheduleIntervalMs);
    }
    async stop() {
        if (!this.isRunning)
            return;
        this.isRunning = false;
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.schedulerInterval = undefined;
        }
        this.logger.info('KG refresh scheduler stopped');
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
export function createKGRefreshScheduler(options) {
    return new KGRefreshScheduler(options);
}
//# sourceMappingURL=kg-refresh-scheduler.js.map