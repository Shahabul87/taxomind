/**
 * @sam-ai/agentic - Memory Lifecycle Manager
 * Manages memory reindexing and lifecycle operations
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  MemoryLifecycleManagerInterface,
  MemoryLifecycleConfig,
  ContentChangeEvent,
  ReindexJob,
  ReindexJobStatus,
  ReindexPriority,
  ReindexResult,
  ReindexJobStore,
  LifecycleStats,
  ContentEntityType,
} from './types';
import type { VectorAdapter } from '@sam-ai/integration';
import type { MemoryLogger } from '../types';

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: MemoryLifecycleConfig = {
  autoReindexEnabled: true,
  debounceMs: 5000,
  maxBatchSize: 100,
  maxConcurrentJobs: 5,
  retry: {
    maxAttempts: 3,
    backoffMs: 1000,
    backoffMultiplier: 2,
  },
  priorityRules: [],
  entityConfigs: {} as Record<ContentEntityType, never>,
};

// ============================================================================
// IN-MEMORY JOB STORE
// ============================================================================

export class InMemoryReindexJobStore implements ReindexJobStore {
  private jobs: Map<string, ReindexJob> = new Map();

  async create(
    job: Omit<ReindexJob, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ReindexJob> {
    const now = new Date();
    const newJob: ReindexJob = {
      ...job,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    this.jobs.set(newJob.id, newJob);
    return newJob;
  }

  async get(id: string): Promise<ReindexJob | null> {
    return this.jobs.get(id) ?? null;
  }

  async update(id: string, updates: Partial<ReindexJob>): Promise<ReindexJob | null> {
    const job = this.jobs.get(id);
    if (!job) return null;

    const updated: ReindexJob = {
      ...job,
      ...updates,
      id: job.id,
      createdAt: job.createdAt,
      updatedAt: new Date(),
    };
    this.jobs.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    return this.jobs.delete(id);
  }

  async findPending(limit: number): Promise<ReindexJob[]> {
    const pending = Array.from(this.jobs.values())
      .filter(
        (j) =>
          j.status === 'pending' || j.status === 'queued' || j.status === 'retrying'
      )
      .filter((j) => j.scheduledFor <= new Date())
      .sort((a, b) => b.priority - a.priority || a.createdAt.getTime() - b.createdAt.getTime());
    return pending.slice(0, limit);
  }

  async findByEntity(
    entityType: ContentEntityType,
    entityId: string
  ): Promise<ReindexJob[]> {
    return Array.from(this.jobs.values()).filter(
      (j) => j.entityType === entityType && j.entityId === entityId
    );
  }

  async findByStatus(status: ReindexJobStatus, limit?: number): Promise<ReindexJob[]> {
    const jobs = Array.from(this.jobs.values()).filter((j) => j.status === status);
    return limit ? jobs.slice(0, limit) : jobs;
  }

  async countByStatus(): Promise<Record<ReindexJobStatus, number>> {
    const counts: Record<string, number> = {
      pending: 0,
      queued: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      retrying: 0,
    };

    for (const job of this.jobs.values()) {
      counts[job.status]++;
    }

    return counts as Record<ReindexJobStatus, number>;
  }

  async cleanupCompleted(olderThan: Date): Promise<number> {
    let count = 0;
    for (const [id, job] of this.jobs) {
      if (job.status === 'completed' && job.completedAt && job.completedAt < olderThan) {
        this.jobs.delete(id);
        count++;
      }
    }
    return count;
  }

  clear(): void {
    this.jobs.clear();
  }
}

// ============================================================================
// DEBOUNCER
// ============================================================================

interface DebouncedChange {
  events: ContentChangeEvent[];
  timer: ReturnType<typeof setTimeout>;
  createdAt: Date;
}

class ChangeDebouncer {
  private pending: Map<string, DebouncedChange> = new Map();

  constructor(
    private debounceMs: number,
    private onFlush: (events: ContentChangeEvent[]) => void
  ) {}

  add(event: ContentChangeEvent): void {
    const key = `${event.entityType}:${event.entityId}`;
    const existing = this.pending.get(key);

    if (existing) {
      clearTimeout(existing.timer);
      existing.events.push(event);
    } else {
      this.pending.set(key, {
        events: [event],
        timer: setTimeout(() => this.flush(key), this.debounceMs),
        createdAt: new Date(),
      });
      return;
    }

    // Reset timer
    const updated = this.pending.get(key)!;
    updated.timer = setTimeout(() => this.flush(key), this.debounceMs);
  }

  private flush(key: string): void {
    const debounced = this.pending.get(key);
    if (!debounced) return;

    this.pending.delete(key);
    this.onFlush(debounced.events);
  }

  flushAll(): void {
    for (const key of this.pending.keys()) {
      this.flush(key);
    }
  }

  clear(): void {
    for (const debounced of this.pending.values()) {
      clearTimeout(debounced.timer);
    }
    this.pending.clear();
  }
}

// ============================================================================
// MEMORY LIFECYCLE MANAGER
// ============================================================================

export class MemoryLifecycleManager implements MemoryLifecycleManagerInterface {
  private readonly config: MemoryLifecycleConfig;
  private readonly store: ReindexJobStore;
  private readonly vectorAdapter: VectorAdapter;
  private readonly logger: MemoryLogger;
  private readonly debouncer: ChangeDebouncer;

  private isRunning = false;
  private processingInterval?: ReturnType<typeof setInterval>;
  private activeJobs = 0;

  constructor(options: {
    config?: Partial<MemoryLifecycleConfig>;
    store?: ReindexJobStore;
    vectorAdapter: VectorAdapter;
    logger?: MemoryLogger;
  }) {
    this.config = { ...DEFAULT_CONFIG, ...options.config };
    this.store = options.store ?? new InMemoryReindexJobStore();
    this.vectorAdapter = options.vectorAdapter;
    this.logger = options.logger ?? console;

    this.debouncer = new ChangeDebouncer(
      this.config.debounceMs,
      (events) => this.processDebouncedEvents(events)
    );
  }

  // -------------------------------------------------------------------------
  // Event Handling
  // -------------------------------------------------------------------------

  async handleContentChange(event: ContentChangeEvent): Promise<void> {
    if (!this.config.autoReindexEnabled) {
      this.logger.debug('Auto-reindex disabled, ignoring event', {
        entityType: event.entityType,
        entityId: event.entityId,
      });
      return;
    }

    this.logger.info('Content change detected', {
      entityType: event.entityType,
      entityId: event.entityId,
      changeType: event.changeType,
    });

    // Add to debouncer for batching rapid changes
    this.debouncer.add(event);
  }

  private async processDebouncedEvents(events: ContentChangeEvent[]): Promise<void> {
    if (events.length === 0) return;

    // Merge events into a single reindex job
    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];

    // Determine the effective change type
    let effectiveChangeType = firstEvent.changeType;
    if (events.some((e) => e.changeType === 'delete')) {
      effectiveChangeType = 'delete';
    } else if (events.length > 1) {
      effectiveChangeType = 'bulk_update';
    }

    // Calculate priority
    const priority = this.calculatePriority(firstEvent);

    try {
      await this.queueReindexJob({
        type: events.length > 1 ? 'batch' : 'single',
        status: 'pending',
        priority,
        entityType: firstEvent.entityType,
        entityId: firstEvent.entityId,
        changeType: effectiveChangeType,
        metadata: {
          courseId: firstEvent.metadata.courseId,
          source: 'content_change',
          triggeredBy: 'lifecycle_manager',
          custom: {
            eventCount: events.length,
            firstEventId: firstEvent.id,
            lastEventId: lastEvent.id,
          },
        },
        attempts: 0,
        maxAttempts: this.config.retry.maxAttempts,
        scheduledFor: new Date(),
      });
    } catch (error) {
      this.logger.error('Failed to queue reindex job', {
        entityType: firstEvent.entityType,
        entityId: firstEvent.entityId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private calculatePriority(event: ContentChangeEvent): ReindexPriority {
    // Check priority rules
    for (const rule of this.config.priorityRules) {
      if (rule.condition.entityTypes?.includes(event.entityType)) {
        if (!rule.condition.changeTypes || rule.condition.changeTypes.includes(event.changeType)) {
          if (!rule.condition.custom || rule.condition.custom(event)) {
            return rule.priority;
          }
        }
      }
    }

    // Default priorities based on entity type
    switch (event.entityType) {
      case 'course':
        return 10; // HIGH
      case 'chapter':
        return 5; // NORMAL
      case 'section':
        return 5; // NORMAL
      default:
        return 1; // LOW
    }
  }

  // -------------------------------------------------------------------------
  // Job Management
  // -------------------------------------------------------------------------

  async queueReindexJob(
    job: Omit<ReindexJob, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ReindexJob> {
    // Check for existing pending job for the same entity
    const existingJobs = await this.store.findByEntity(job.entityType, job.entityId);
    const pendingJob = existingJobs.find(
      (j) => j.status === 'pending' || j.status === 'queued'
    );

    if (pendingJob) {
      // Update existing job with higher priority if needed
      if (job.priority > pendingJob.priority) {
        const updated = await this.store.update(pendingJob.id, {
          priority: job.priority,
          changeType: job.changeType,
        });
        this.logger.debug('Updated existing job priority', {
          jobId: pendingJob.id,
          newPriority: job.priority,
        });
        return updated!;
      }
      return pendingJob;
    }

    const newJob = await this.store.create(job);
    this.logger.info('Reindex job queued', {
      jobId: newJob.id,
      entityType: newJob.entityType,
      entityId: newJob.entityId,
      priority: newJob.priority,
    });

    return newJob;
  }

  async getPendingJobs(limit = 100): Promise<ReindexJob[]> {
    return this.store.findPending(limit);
  }

  async processJobs(): Promise<ReindexResult[]> {
    const availableSlots = this.config.maxConcurrentJobs - this.activeJobs;
    if (availableSlots <= 0) {
      return [];
    }

    const jobs = await this.store.findPending(availableSlots);
    if (jobs.length === 0) {
      return [];
    }

    const results: ReindexResult[] = [];

    for (const job of jobs) {
      try {
        this.activeJobs++;
        await this.store.update(job.id, {
          status: 'processing',
          startedAt: new Date(),
        });

        const result = await this.processJob(job);
        results.push(result);

        await this.store.update(job.id, {
          status: result.success ? 'completed' : 'failed',
          completedAt: new Date(),
          lastError: result.errors.length > 0 ? result.errors[0].message : undefined,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error('Job processing failed', {
          jobId: job.id,
          error: errorMessage,
        });

        // Handle retry
        if (job.attempts + 1 < job.maxAttempts) {
          const backoffMs =
            this.config.retry.backoffMs *
            Math.pow(this.config.retry.backoffMultiplier, job.attempts);
          await this.store.update(job.id, {
            status: 'retrying',
            attempts: job.attempts + 1,
            lastAttemptAt: new Date(),
            lastError: errorMessage,
            scheduledFor: new Date(Date.now() + backoffMs),
          });
        } else {
          await this.store.update(job.id, {
            status: 'failed',
            attempts: job.attempts + 1,
            lastAttemptAt: new Date(),
            lastError: errorMessage,
          });
        }

        results.push({
          jobId: job.id,
          success: false,
          documentsProcessed: 0,
          documentsAdded: 0,
          documentsUpdated: 0,
          documentsDeleted: 0,
          errors: [{ message: errorMessage, code: 'PROCESSING_ERROR', recoverable: true }],
          duration: 0,
          timestamp: new Date(),
        });
      } finally {
        this.activeJobs--;
      }
    }

    return results;
  }

  private async processJob(job: ReindexJob): Promise<ReindexResult> {
    const startTime = Date.now();
    let documentsProcessed = 0;
    let documentsAdded = 0;
    let documentsUpdated = 0;
    let documentsDeleted = 0;
    const errors: ReindexResult['errors'] = [];

    this.logger.info('Processing reindex job', {
      jobId: job.id,
      entityType: job.entityType,
      entityId: job.entityId,
      changeType: job.changeType,
    });

    try {
      // Get entity config
      const entityConfig = this.config.entityConfigs[job.entityType];
      if (!entityConfig?.enabled) {
        this.logger.warn('Entity type not configured for reindexing', {
          entityType: job.entityType,
        });
        return {
          jobId: job.id,
          success: true,
          documentsProcessed: 0,
          documentsAdded: 0,
          documentsUpdated: 0,
          documentsDeleted: 0,
          errors: [],
          duration: Date.now() - startTime,
          timestamp: new Date(),
        };
      }

      if (job.changeType === 'delete') {
        // Delete vectors for this entity
        const deletedCount = await this.vectorAdapter.deleteByFilter({
          sourceTypes: [job.entityType],
          custom: { entityId: job.entityId },
        });
        documentsDeleted = deletedCount;
        documentsProcessed = deletedCount;
      } else {
        // Extract content and create/update embeddings
        const content = await entityConfig.extractContent(job.entityId);
        if (!content) {
          this.logger.warn('No content extracted for entity', {
            entityType: job.entityType,
            entityId: job.entityId,
          });
        } else {
          // Handle chunked content
          const chunks = content.chunks ?? [{ id: content.id, content: content.content, index: 0, metadata: {} }];

          for (const chunk of chunks) {
            try {
              const vectorId = `${job.entityType}:${job.entityId}:${chunk.index}`;
              const existing = await this.vectorAdapter.get(vectorId);

              if (existing) {
                await this.vectorAdapter.upsert({
                  id: vectorId,
                  content: chunk.content,
                  metadata: {
                    sourceType: job.entityType,
                    sourceId: job.entityId,
                    courseId: job.metadata.courseId,
                    tags: [],
                    ...chunk.metadata,
                  },
                });
                documentsUpdated++;
              } else {
                await this.vectorAdapter.insert({
                  id: vectorId,
                  content: chunk.content,
                  metadata: {
                    sourceType: job.entityType,
                    sourceId: job.entityId,
                    courseId: job.metadata.courseId,
                    tags: [],
                    ...chunk.metadata,
                  },
                });
                documentsAdded++;
              }
              documentsProcessed++;
            } catch (chunkError) {
              errors.push({
                documentId: `${job.entityType}:${job.entityId}:${chunk.index}`,
                entityId: job.entityId,
                message: chunkError instanceof Error ? chunkError.message : 'Unknown error',
                code: 'CHUNK_PROCESSING_ERROR',
                recoverable: true,
              });
            }
          }
        }
      }
    } catch (error) {
      errors.push({
        entityId: job.entityId,
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'JOB_PROCESSING_ERROR',
        recoverable: false,
      });
    }

    const result: ReindexResult = {
      jobId: job.id,
      success: errors.filter((e) => !e.recoverable).length === 0,
      documentsProcessed,
      documentsAdded,
      documentsUpdated,
      documentsDeleted,
      errors,
      duration: Date.now() - startTime,
      timestamp: new Date(),
    };

    this.logger.info('Reindex job completed', {
      jobId: job.id,
      success: result.success,
      documentsProcessed: result.documentsProcessed,
      duration: result.duration,
    });

    return result;
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = await this.store.get(jobId);
    if (!job) return false;

    if (job.status === 'processing') {
      this.logger.warn('Cannot cancel job in processing state', { jobId });
      return false;
    }

    await this.store.update(jobId, { status: 'cancelled' });
    this.logger.info('Job cancelled', { jobId });
    return true;
  }

  async getJobStatus(jobId: string): Promise<ReindexJob | null> {
    return this.store.get(jobId);
  }

  async getStats(): Promise<LifecycleStats> {
    const counts = await this.store.countByStatus();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      pendingJobs: counts.pending + counts.queued + counts.retrying,
      processingJobs: counts.processing,
      completedToday: counts.completed,
      failedToday: counts.failed,
      averageProcessingTime: 0, // Would need to track this
      queueDepthByPriority: {},
    };
  }

  async triggerFullReindex(entityType: ContentEntityType): Promise<ReindexJob> {
    return this.queueReindexJob({
      type: 'full',
      status: 'pending',
      priority: 1, // LOW - full reindex runs in background
      entityType,
      entityId: '*',
      changeType: 'bulk_update',
      metadata: {
        source: 'manual_trigger',
        triggeredBy: 'lifecycle_manager',
      },
      attempts: 0,
      maxAttempts: this.config.retry.maxAttempts,
      scheduledFor: new Date(),
    });
  }

  // -------------------------------------------------------------------------
  // Lifecycle Control
  // -------------------------------------------------------------------------

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Lifecycle manager already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('Memory lifecycle manager started');

    // Start processing interval
    this.processingInterval = setInterval(
      () => this.processJobs().catch((e) => this.logger.error('Job processing error', { error: e })),
      5000 // Process every 5 seconds
    );
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.debouncer.flushAll();

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }

    this.logger.info('Memory lifecycle manager stopped');
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createMemoryLifecycleManager(options: {
  config?: Partial<MemoryLifecycleConfig>;
  store?: ReindexJobStore;
  vectorAdapter: VectorAdapter;
  logger?: MemoryLogger;
}): MemoryLifecycleManager {
  return new MemoryLifecycleManager(options);
}
