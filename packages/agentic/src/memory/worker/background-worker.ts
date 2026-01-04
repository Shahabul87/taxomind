/**
 * @sam-ai/agentic - Background Worker
 * Manages background job processing for memory operations
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  BackgroundWorkerInterface,
  JobQueueInterface,
  JobQueueConfig,
  WorkerConfig,
  WorkerStatus,
  WorkerStats,
  BaseJob,
  JobType,
  JobStatus,
  JobHandler,
  JobEvent,
  JobEventListener,
  QueueStats,
} from './types';
import { DEFAULT_QUEUE_CONFIG, DEFAULT_WORKER_CONFIG } from './types';
import type { MemoryLogger } from '../types';

// ============================================================================
// IN-MEMORY JOB QUEUE
// ============================================================================

export class InMemoryJobQueue implements JobQueueInterface {
  private readonly config: JobQueueConfig;
  private readonly logger: MemoryLogger;
  private jobs: Map<string, BaseJob> = new Map();
  private listeners: Map<JobEvent, Set<JobEventListener>> = new Map();
  private isPaused = false;
  private processedCount = 0;
  private totalProcessingTime = 0;
  private lastProcessedAt?: Date;

  constructor(options?: {
    config?: Partial<JobQueueConfig>;
    logger?: MemoryLogger;
  }) {
    this.config = { ...DEFAULT_QUEUE_CONFIG, ...options?.config };
    this.logger = options?.logger ?? console;
  }

  async add<TData>(
    type: JobType,
    data: TData,
    options?: Partial<BaseJob>
  ): Promise<BaseJob> {
    const now = new Date();
    const job: BaseJob = {
      id: uuidv4(),
      type,
      status: 'pending',
      priority: options?.priority ?? this.config.defaultPriority,
      data,
      attempts: 0,
      maxAttempts: options?.maxAttempts ?? this.config.defaultMaxAttempts,
      createdAt: now,
      updatedAt: now,
      scheduledFor: options?.scheduledFor ?? now,
      ...options,
    };

    this.jobs.set(job.id, job);
    this.emit('created', job);

    this.logger.debug('Job added to queue', {
      jobId: job.id,
      type: job.type,
      priority: job.priority,
    });

    return job;
  }

  async get(jobId: string): Promise<BaseJob | null> {
    return this.jobs.get(jobId) ?? null;
  }

  async update(jobId: string, updates: Partial<BaseJob>): Promise<BaseJob | null> {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    const updated: BaseJob = {
      ...job,
      ...updates,
      id: job.id,
      createdAt: job.createdAt,
      updatedAt: new Date(),
    };

    this.jobs.set(jobId, updated);
    return updated;
  }

  async remove(jobId: string): Promise<boolean> {
    return this.jobs.delete(jobId);
  }

  async getNextPending(): Promise<BaseJob | null> {
    if (this.isPaused) return null;

    const now = new Date();
    const pendingJobs = Array.from(this.jobs.values())
      .filter(
        (j) =>
          (j.status === 'pending' || j.status === 'queued') &&
          j.scheduledFor <= now
      )
      .sort((a, b) => b.priority - a.priority || a.createdAt.getTime() - b.createdAt.getTime());

    return pendingJobs[0] ?? null;
  }

  async getByStatus(status: JobStatus, limit?: number): Promise<BaseJob[]> {
    const jobs = Array.from(this.jobs.values()).filter((j) => j.status === status);
    return limit ? jobs.slice(0, limit) : jobs;
  }

  async getStats(): Promise<QueueStats> {
    const jobs = Array.from(this.jobs.values());

    return {
      name: this.config.name,
      pending: jobs.filter((j) => j.status === 'pending').length,
      active: jobs.filter((j) => j.status === 'active').length,
      completed: jobs.filter((j) => j.status === 'completed').length,
      failed: jobs.filter((j) => j.status === 'failed').length,
      delayed: jobs.filter((j) => j.status === 'delayed').length,
      paused: jobs.filter((j) => j.status === 'paused').length,
      totalProcessed: this.processedCount,
      avgProcessingTime:
        this.processedCount > 0 ? this.totalProcessingTime / this.processedCount : 0,
      lastProcessedAt: this.lastProcessedAt,
    };
  }

  async pause(): Promise<void> {
    this.isPaused = true;
    this.logger.info('Queue paused', { name: this.config.name });
  }

  async resume(): Promise<void> {
    this.isPaused = false;
    this.logger.info('Queue resumed', { name: this.config.name });
  }

  async cleanup(olderThan: Date): Promise<number> {
    let count = 0;
    for (const [id, job] of this.jobs) {
      if (
        (job.status === 'completed' || job.status === 'failed') &&
        job.completedAt &&
        job.completedAt < olderThan
      ) {
        this.jobs.delete(id);
        count++;
      }
    }
    return count;
  }

  on(event: JobEvent, listener: JobEventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: JobEvent, listener: JobEventListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  private emit(event: JobEvent, job: BaseJob): void {
    this.listeners.get(event)?.forEach((listener) => listener(event, job));
  }

  recordProcessing(durationMs: number): void {
    this.processedCount++;
    this.totalProcessingTime += durationMs;
    this.lastProcessedAt = new Date();
  }

  clear(): void {
    this.jobs.clear();
    this.processedCount = 0;
    this.totalProcessingTime = 0;
    this.lastProcessedAt = undefined;
  }
}

// ============================================================================
// BACKGROUND WORKER
// ============================================================================

export class BackgroundWorker implements BackgroundWorkerInterface {
  private readonly config: WorkerConfig;
  private readonly queues: Map<string, JobQueueInterface>;
  private readonly handlers: Map<JobType, JobHandler>;
  private readonly logger: MemoryLogger;

  private status: WorkerStatus = 'stopped';
  private startedAt?: Date;
  private processedJobs = 0;
  private failedJobs = 0;
  private activeJobs = 0;
  private totalProcessingTime = 0;
  private lastActivityAt?: Date;
  private pollInterval?: ReturnType<typeof setInterval>;
  private shutdownPromise?: Promise<void>;

  constructor(options: {
    config?: Partial<WorkerConfig>;
    queues?: Map<string, JobQueueInterface>;
    logger?: MemoryLogger;
  }) {
    this.config = { ...DEFAULT_WORKER_CONFIG, ...options.config };
    this.queues = options.queues ?? new Map();
    this.handlers = new Map();
    this.logger = options.logger ?? console;

    // Create default queue if none provided
    if (this.queues.size === 0) {
      for (const queueName of this.config.queues) {
        this.queues.set(
          queueName,
          new InMemoryJobQueue({ config: { name: queueName }, logger: this.logger })
        );
      }
    }
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  async start(): Promise<void> {
    if (this.status === 'running') {
      this.logger.warn('Worker already running', { id: this.config.id });
      return;
    }

    this.status = 'running';
    this.startedAt = new Date();
    this.logger.info('Worker started', {
      id: this.config.id,
      queues: this.config.queues,
      concurrency: this.config.concurrency,
    });

    // Start polling for jobs
    this.pollInterval = setInterval(() => this.poll(), this.config.pollIntervalMs);

    // Initial poll
    await this.poll();
  }

  async stop(): Promise<void> {
    if (this.status === 'stopped') return;

    this.status = 'stopping';
    this.logger.info('Worker stopping', { id: this.config.id, activeJobs: this.activeJobs });

    // Clear poll interval
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
    }

    // Wait for active jobs if graceful shutdown enabled
    if (this.config.gracefulShutdown && this.activeJobs > 0) {
      this.shutdownPromise = new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.activeJobs === 0) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);

        // Timeout
        setTimeout(() => {
          clearInterval(checkInterval);
          this.logger.warn('Shutdown timeout, forcing stop', {
            id: this.config.id,
            remainingJobs: this.activeJobs,
          });
          resolve();
        }, this.config.shutdownTimeoutMs);
      });

      await this.shutdownPromise;
    }

    this.status = 'stopped';
    this.logger.info('Worker stopped', { id: this.config.id });
  }

  async pause(): Promise<void> {
    if (this.status !== 'running') return;

    this.status = 'paused';
    for (const queue of this.queues.values()) {
      await queue.pause();
    }
    this.logger.info('Worker paused', { id: this.config.id });
  }

  async resume(): Promise<void> {
    if (this.status !== 'paused') return;

    this.status = 'running';
    for (const queue of this.queues.values()) {
      await queue.resume();
    }
    this.logger.info('Worker resumed', { id: this.config.id });
  }

  // -------------------------------------------------------------------------
  // Handler Management
  // -------------------------------------------------------------------------

  registerHandler<TData, TResult>(
    type: JobType,
    handler: JobHandler<TData, TResult>
  ): void {
    this.handlers.set(type, handler as JobHandler);
    this.logger.debug('Handler registered', { type });
  }

  unregisterHandler(type: JobType): void {
    this.handlers.delete(type);
    this.logger.debug('Handler unregistered', { type });
  }

  // -------------------------------------------------------------------------
  // Status
  // -------------------------------------------------------------------------

  getStatus(): WorkerStatus {
    return this.status;
  }

  getStats(): WorkerStats {
    return {
      id: this.config.id,
      status: this.status,
      startedAt: this.startedAt,
      activeJobs: this.activeJobs,
      processedJobs: this.processedJobs,
      failedJobs: this.failedJobs,
      avgProcessingTime:
        this.processedJobs > 0 ? this.totalProcessingTime / this.processedJobs : 0,
      lastActivityAt: this.lastActivityAt,
      uptime: this.startedAt ? Date.now() - this.startedAt.getTime() : 0,
    };
  }

  // -------------------------------------------------------------------------
  // Processing
  // -------------------------------------------------------------------------

  async processJob(jobId: string): Promise<void> {
    // Find job in queues
    let job: BaseJob | null = null;
    let queue: JobQueueInterface | null = null;

    for (const q of this.queues.values()) {
      const found = await q.get(jobId);
      if (found) {
        job = found;
        queue = q;
        break;
      }
    }

    if (!job || !queue) {
      throw new Error(`Job not found: ${jobId}`);
    }

    await this.executeJob(job, queue);
  }

  private async poll(): Promise<void> {
    if (this.status !== 'running') return;

    const availableSlots = this.config.concurrency - this.activeJobs;
    if (availableSlots <= 0) return;

    let jobsProcessed = 0;

    for (const queue of this.queues.values()) {
      if (jobsProcessed >= this.config.maxJobsPerCycle) break;
      if (this.activeJobs >= this.config.concurrency) break;

      const job = await queue.getNextPending();
      if (job) {
        // Process async, don't wait
        this.executeJob(job, queue).catch((error) => {
          this.logger.error('Job execution error', {
            jobId: job.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        });
        jobsProcessed++;
      }
    }
  }

  private async executeJob(job: BaseJob, queue: JobQueueInterface): Promise<void> {
    const handler = this.handlers.get(job.type);
    if (!handler) {
      this.logger.warn('No handler for job type', { type: job.type, jobId: job.id });
      await queue.update(job.id, {
        status: 'failed',
        error: `No handler registered for job type: ${job.type}`,
      });
      return;
    }

    this.activeJobs++;
    const startTime = Date.now();

    try {
      // Update job status to active
      await queue.update(job.id, {
        status: 'active',
        startedAt: new Date(),
        attempts: job.attempts + 1,
      });

      this.logger.debug('Executing job', {
        jobId: job.id,
        type: job.type,
        attempt: job.attempts + 1,
      });

      // Execute handler with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Job timeout')), DEFAULT_QUEUE_CONFIG.jobTimeoutMs);
      });

      const result = await Promise.race([handler(job), timeoutPromise]);

      // Job completed successfully
      const duration = Date.now() - startTime;
      await queue.update(job.id, {
        status: 'completed',
        result,
        completedAt: new Date(),
      });

      this.processedJobs++;
      this.totalProcessingTime += duration;
      this.lastActivityAt = new Date();

      if (queue instanceof InMemoryJobQueue) {
        queue.recordProcessing(duration);
      }

      this.logger.info('Job completed', {
        jobId: job.id,
        type: job.type,
        durationMs: duration,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Duration captured for potential future metrics
      void (Date.now() - startTime);

      this.logger.error('Job failed', {
        jobId: job.id,
        type: job.type,
        error: errorMessage,
        attempt: job.attempts + 1,
      });

      // Check if should retry
      if (job.attempts + 1 < job.maxAttempts) {
        const retryDelayMs =
          DEFAULT_QUEUE_CONFIG.retryDelayMs *
          Math.pow(DEFAULT_QUEUE_CONFIG.retryBackoffMultiplier, job.attempts);

        await queue.update(job.id, {
          status: 'delayed',
          error: errorMessage,
          scheduledFor: new Date(Date.now() + retryDelayMs),
        });

        this.logger.debug('Job scheduled for retry', {
          jobId: job.id,
          retryIn: retryDelayMs,
          nextAttempt: job.attempts + 2,
        });
      } else {
        await queue.update(job.id, {
          status: 'failed',
          error: errorMessage,
          completedAt: new Date(),
        });

        this.failedJobs++;
      }

      this.lastActivityAt = new Date();
    } finally {
      this.activeJobs--;
    }
  }

  // -------------------------------------------------------------------------
  // Queue Access
  // -------------------------------------------------------------------------

  getQueue(name: string): JobQueueInterface | undefined {
    return this.queues.get(name);
  }

  async addJob<TData>(
    type: JobType,
    data: TData,
    options?: Partial<BaseJob> & { queue?: string }
  ): Promise<BaseJob> {
    const queueName = options?.queue ?? this.config.queues[0];
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue not found: ${queueName}`);
    }
    return queue.add(type, data, options);
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createBackgroundWorker(options?: {
  config?: Partial<WorkerConfig>;
  queues?: Map<string, JobQueueInterface>;
  logger?: MemoryLogger;
}): BackgroundWorker {
  return new BackgroundWorker(options ?? {});
}

export function createJobQueue(options?: {
  config?: Partial<JobQueueConfig>;
  logger?: MemoryLogger;
}): InMemoryJobQueue {
  return new InMemoryJobQueue(options);
}
