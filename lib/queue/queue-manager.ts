/**
 * Queue Manager - Phase 3 Enterprise Implementation
 * Central queue management using BullMQ for async job processing
 * Features: Redis clustering, job prioritization, retry policies, monitoring
 */

import { Queue, Worker, Job, QueueOptions, WorkerOptions, JobsOptions } from 'bullmq';
import { Redis } from '@upstash/redis';
import { QueueConfig, JobType, JobData, WorkerFunction, QueueMetrics } from './job-definitions';
import IORedis from 'ioredis';
import { logger } from '@/lib/logger';

/**
 * Enterprise Queue Manager with advanced features
 */
export class QueueManager {
  private redis: Redis;
  private ioRedis: IORedis;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private queueConfigs: Map<string, QueueConfig> = new Map();
  private jobHandlers: Map<string, WorkerFunction<any>> = new Map();
  private metrics: Map<string, QueueMetrics> = new Map();
  private isShuttingDown = false;
  private healthCheckInterval?: NodeJS.Timeout;
  private metricsCollectionInterval?: NodeJS.Timeout;

  constructor(redis?: Redis) {
    // Initialize Upstash Redis only if credentials are provided
    // This is optional and used for metrics persistence
    if (redis) {
      this.redis = redis;
    } else if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      this.redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    } else {
      // Upstash not configured - metrics will be in-memory only
      logger.info('[QUEUE_MANAGER] Upstash Redis not configured - metrics will be in-memory only');
      this.redis = null as any; // Will be checked before use
    }

    // Create IORedis connection for BullMQ (which requires ioredis)
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379');
    const redisPassword = process.env.REDIS_PASSWORD;
    const redisDb = parseInt(process.env.REDIS_DB || '0');

    this.ioRedis = new IORedis({
      host: redisHost,
      port: redisPort,
      password: redisPassword,
      db: redisDb,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    } as any);

    this.initializeDefaultQueues();
    this.startHealthMonitoring();
    this.startMetricsCollection();
  }

  /**
   * Initialize default queues
   */
  private initializeDefaultQueues(): void {
    const defaultQueues: QueueConfig[] = [
      // Email queue - high priority for user notifications
      {
        name: 'email',
        concurrency: 5,
        rateLimiter: {
          max: 100,
          duration: 60000, // 100 emails per minute
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 50,
          removeOnFail: 20,
        },
        priority: 'high',
      },

      // Analytics queue - medium priority for data processing
      {
        name: 'analytics',
        concurrency: 3,
        rateLimiter: {
          max: 50,
          duration: 60000,
        },
        defaultJobOptions: {
          attempts: 2,
          backoff: {
            type: 'fixed',
            delay: 5000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
        priority: 'medium',
      },

      // AI content generation queue - low concurrency due to resource intensity
      {
        name: 'ai-generation',
        concurrency: 2,
        rateLimiter: {
          max: 20,
          duration: 60000,
        },
        defaultJobOptions: {
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 10000,
          },
          removeOnComplete: 20,
          removeOnFail: 10,
          delay: 1000, // Small delay between jobs to prevent API limits
        },
        priority: 'low',
      },

      // File processing queue - for uploads, conversions, etc.
      {
        name: 'file-processing',
        concurrency: 4,
        rateLimiter: {
          max: 30,
          duration: 60000,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: 30,
          removeOnFail: 15,
        },
        priority: 'medium',
      },

      // Notifications queue - for push notifications, webhooks, etc.
      {
        name: 'notifications',
        concurrency: 10,
        rateLimiter: {
          max: 200,
          duration: 60000,
        },
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
        priority: 'high',
      },

      // Cleanup queue - for maintenance tasks
      {
        name: 'cleanup',
        concurrency: 1,
        rateLimiter: {
          max: 10,
          duration: 60000,
        },
        defaultJobOptions: {
          attempts: 1,
          removeOnComplete: 10,
          removeOnFail: 5,
        },
        priority: 'low',
      },

      // Agentic queue - memory ingestion and rollups
      {
        name: 'agentic',
        concurrency: 2,
        rateLimiter: {
          max: 30,
          duration: 60000,
        },
        defaultJobOptions: {
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
        priority: 'medium',
      },

      // Webhook queue - CRITICAL for payment processing
      {
        name: 'webhook',
        concurrency: 5,
        rateLimiter: {
          max: 100,
          duration: 60000,
        },
        defaultJobOptions: {
          attempts: 5,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 50, // Keep last 50 failed webhooks for debugging
        },
        priority: 'high',
      },

      // Course creation queue — real pipeline worker (gated by ENABLE_QUEUE_PROCESSING)
      {
        name: 'course-creation',
        concurrency: 2,
        rateLimiter: {
          max: 4,
          duration: 60000, // Max 4 course creations per minute
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 30000,
          },
          removeOnComplete: 50,
          removeOnFail: 20,
        },
        priority: 'medium',
        processorTimeout: 1200000, // 20 min hard limit per course
      },

      // Enrollment queue - for course enrollment processing
      {
        name: 'enrollment',
        concurrency: 3,
        rateLimiter: {
          max: 50,
          duration: 60000,
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 3000,
          },
          removeOnComplete: 50,
          removeOnFail: 20,
        },
        priority: 'high',
      },
    ];

    defaultQueues.forEach(config => {
      this.addQueue(config);
    });
  }

  /**
   * Add new queue configuration with enterprise features
   */
  addQueue(config: QueueConfig): void {
    if (this.isShuttingDown) {
      throw new Error('Cannot add queue during shutdown');
    }
    
    this.queueConfigs.set(config.name, config);

    // Create queue with IORedis connection for BullMQ compatibility
    // Type assertion needed due to ioredis version mismatch between dependencies
    const queueOptions: QueueOptions = {
      connection: this.ioRedis as QueueOptions['connection'],
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        ...config.defaultJobOptions,
      },
    };

    const queue = new Queue(config.name, queueOptions);
    this.queues.set(config.name, queue);

    // Initialize comprehensive metrics
    this.metrics.set(config.name, {
      processed: 0,
      failed: 0,
      active: 0,
      waiting: 0,
      completed: 0,
      delayed: 0,
      avgProcessingTime: 0,
      lastJobTime: null,
      throughputPerMinute: 0,
      errorRate: 0,
      peakActiveJobs: 0,
      totalRetries: 0,
    });

    // Set up comprehensive event listeners
    this.setupQueueEventListeners(queue, config.name);
    
    // Set up queue health monitoring
    this.setupQueueHealthCheck(queue, config.name);

  }

  /**
   * Register job handler
   */
  registerHandler<T extends JobData>(queueName: string, handler: WorkerFunction<T>): void {
    this.jobHandlers.set(queueName, handler);

  }

  /**
   * Start worker for queue with enterprise features
   */
  startWorker(queueName: string): void {
    if (this.isShuttingDown) {
      logger.warn(`[QUEUE_MANAGER] Cannot start worker for ${queueName}: system is shutting down`);
      return;
    }
    
    const config = this.queueConfigs.get(queueName);
    const handler = this.jobHandlers.get(queueName);

    if (!config || !handler) {
      logger.error(`[QUEUE_MANAGER] Cannot start worker for ${queueName}: missing config or handler`);
      return;
    }

    // Wrap handler with error handling and metrics
    const wrappedHandler = this.wrapHandlerWithMonitoring(handler, queueName);

    // Type assertion needed due to ioredis version mismatch between dependencies
    const workerOptions: WorkerOptions = {
      connection: this.ioRedis as WorkerOptions['connection'],
      concurrency: config.concurrency,
      ...(config.rateLimiter && { limiter: config.rateLimiter }),
    };

    const worker = new Worker(queueName, wrappedHandler, workerOptions);
    this.workers.set(queueName, worker);

    // Set up comprehensive worker event listeners
    this.setupWorkerEventListeners(worker, queueName);
    
    // Set up worker health monitoring
    this.setupWorkerHealthCheck(worker, queueName);

    logger.info(`[QUEUE_MANAGER] Started enterprise worker for queue: ${queueName} (concurrency: ${config.concurrency})`);
  }

  /**
   * Stop worker for queue
   */
  async stopWorker(queueName: string): Promise<void> {
    const worker = this.workers.get(queueName);
    if (worker) {
      await worker.close();
      this.workers.delete(queueName);

    }
  }

  /**
   * Add job to queue
   */
  async addJob<T extends JobData>(
    queueName: string,
    jobType: JobType,
    data: T,
    options?: JobsOptions
  ): Promise<Job<T>> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const config = this.queueConfigs.get(queueName);
    const jobOptions = { ...config?.defaultJobOptions, ...options };

    // Set priority based on queue config
    if (config?.priority && !jobOptions.priority) {
      const priorityMap = { high: 100, medium: 50, low: 10 };
      jobOptions.priority = priorityMap[config.priority];
    }

    const job = await queue.add(jobType, data, jobOptions);

    return job;
  }

  /**
   * Add multiple jobs to queue (bulk)
   */
  async addJobs<T extends JobData>(
    queueName: string,
    jobs: Array<{ name: JobType; data: T; opts?: JobsOptions }>
  ): Promise<Job<T>[]> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const config = this.queueConfigs.get(queueName);
    const jobsWithDefaults = jobs.map(job => ({
      ...job,
      opts: { ...config?.defaultJobOptions, ...job.opts },
    }));

    const addedJobs = await queue.addBulk(jobsWithDefaults);

    return addedJobs;
  }

  /**
   * Get job by ID
   */
  async getJob(queueName: string, jobId: string): Promise<Job | null> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.getJob(jobId);
    return job ?? null;
  }

  /**
   * Get comprehensive queue statistics
   */
  async getQueueStats(queueName: string): Promise<any> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    try {
      const [waiting, active, completed, failed, delayed, counts] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
        queue.getJobCounts(),
      ]);

      const metrics = this.metrics.get(queueName);
      const config = this.queueConfigs.get(queueName);
      
      // Calculate health score (0-100)
      const totalProcessed = metrics?.processed || 0;
      const totalFailed = metrics?.failed || 0;
      const errorRate = totalProcessed > 0 ? (totalFailed / totalProcessed) * 100 : 0;
      const healthScore = Math.max(0, 100 - errorRate);

      return {
        name: queueName,
        health: {
          score: Math.round(healthScore),
          status: healthScore > 80 ? 'healthy' : healthScore > 50 ? 'warning' : 'critical',
        },
        counts,
        jobs: {
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length,
          delayed: delayed.length,
        },
        metrics,
        config: {
          concurrency: config?.concurrency,
          priority: config?.priority,
          rateLimiter: config?.rateLimiter,
        },
        worker: {
          isRunning: this.workers.get(queueName)?.isRunning() || false,
          isPaused: this.workers.get(queueName)?.isPaused() || false,
        },
        timestamp: new Date(),
      };
    } catch (error: any) {
      logger.error(`[QUEUE_MANAGER] Error getting stats for ${queueName}:`, error);
      return {
        name: queueName,
        health: { score: 0, status: 'error' },
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get all queue statistics
   */
  async getAllQueueStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};

    for (const queueName of this.queues.keys()) {
      stats[queueName] = await this.getQueueStats(queueName);
    }

    return stats;
  }

  /**
   * Retry failed jobs
   */
  async retryFailedJobs(queueName: string, limit?: number): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const failed = await queue.getFailed(0, limit || -1);
    
    for (const job of failed) {
      await job.retry();
    }

  }

  /**
   * Clean old jobs from queue
   */
  async cleanQueue(
    queueName: string,
    grace: number = 24 * 60 * 60 * 1000, // 24 hours
    status: 'completed' | 'failed' = 'completed',
    limit: number = 100
  ): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.clean(grace, limit, status);

  }

  /**
   * Pause queue
   */
  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.pause();

  }

  /**
   * Resume queue
   */
  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.resume();

  }

  /**
   * Setup queue event listeners for metrics
   */
  private setupQueueEventListeners(queue: Queue, queueName: string): void {
    // BullMQ Queue events have changed - using QueueEvents for monitoring
    queue.on('error', (error) => {
      logger.error(`[QUEUE] Queue ${queueName} error:`, error);
    });
  }

  /**
   * Setup worker event listeners
   */
  private setupWorkerEventListeners(worker: Worker, queueName: string): void {
    worker.on('active', () => {
      const metrics = this.metrics.get(queueName)!;
      metrics.active++;
    });

    worker.on('completed', () => {
      const metrics = this.metrics.get(queueName)!;
      metrics.active--;
      metrics.processed++;
      metrics.completed++;
      metrics.lastJobTime = new Date();
    });

    worker.on('failed', (job, err) => {
      const metrics = this.metrics.get(queueName)!;
      metrics.active--;
      metrics.processed++;
      metrics.failed++;
      logger.error(`[WORKER] Job ${job?.id} failed in worker ${queueName}:`, err.message);
    });

    worker.on('error', (err) => {
      logger.error(`[WORKER] Worker error in ${queueName}:`, err);
    });
  }

  /**
   * Get worker health status
   */
  getWorkerHealth(): Record<string, any> {
    const health: Record<string, any> = {};

    for (const [queueName, worker] of this.workers.entries()) {
      health[queueName] = {
        isRunning: worker.isRunning(),
        isPaused: worker.isPaused(),
        concurrency: worker.opts.concurrency,
      };
    }

    return health;
  }

  /**
   * Schedule recurring job
   */
  async scheduleRecurringJob<T extends JobData>(
    queueName: string,
    jobType: JobType,
    data: T,
    cronPattern: string,
    options?: JobsOptions
  ): Promise<Job<T>> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const config = this.queueConfigs.get(queueName);
    const jobOptions = {
      ...config?.defaultJobOptions,
      ...options,
      repeat: { pattern: cronPattern },
      jobId: `${jobType}-recurring`, // Prevent duplicate recurring jobs
    };

    const job = await queue.add(jobType, data, jobOptions);

    return job;
  }

  /**
   * Remove recurring job
   */
  async removeRecurringJob(queueName: string, jobId: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    // Use removeRepeatableByKey for newer BullMQ versions
    // Note: These methods are deprecated but still functional
    const repeatableJobs = await queue.getRepeatableJobs(0, -1);
    const job = repeatableJobs.find(
      (j) => j.id === jobId
    );
    if (job && job.key) {
      await queue.removeRepeatableByKey(job.key);
    }

  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(): Promise<any> {
    try {
      const stats = await this.getAllQueueStats();
      const workerHealth = this.getWorkerHealth();
      const systemHealth = await this.getSystemHealth();

      // Calculate aggregated metrics
      const validStats = Object.values(stats).filter((stat: any) => !stat.error);
      const totalProcessed = validStats.reduce((sum, stat: any) => sum + (stat.metrics?.processed || 0), 0);
      const totalFailed = validStats.reduce((sum, stat: any) => sum + (stat.metrics?.failed || 0), 0);
      const overallErrorRate = totalProcessed > 0 ? (totalFailed / totalProcessed) * 100 : 0;
      
      const summary = {
        totalQueues: this.queues.size,
        totalWorkers: this.workers.size,
        activeJobs: validStats.reduce((sum, stat: any) => sum + (stat.jobs?.active || 0), 0),
        waitingJobs: validStats.reduce((sum, stat: any) => sum + (stat.jobs?.waiting || 0), 0),
        completedJobs: validStats.reduce((sum, stat: any) => sum + (stat.jobs?.completed || 0), 0),
        failedJobs: validStats.reduce((sum, stat: any) => sum + (stat.jobs?.failed || 0), 0),
        delayedJobs: validStats.reduce((sum, stat: any) => sum + (stat.jobs?.delayed || 0), 0),
        totalProcessed,
        totalFailed,
        errorRate: Math.round(overallErrorRate * 100) / 100,
        avgProcessingTime: validStats.reduce((sum, stat: any) => sum + (stat.metrics?.avgProcessingTime || 0), 0) / Math.max(validStats.length, 1),
        healthScore: Math.max(0, 100 - overallErrorRate),
        uptime: process.uptime(),
      };

      // Get top performing and problematic queues
      const rankedQueues = validStats
        .map((stat: any) => ({
          name: stat.name,
          healthScore: stat.health?.score || 0,
          errorRate: stat.metrics ? (stat.metrics.failed / Math.max(stat.metrics.processed, 1)) * 100 : 0,
          throughput: stat.metrics?.throughputPerMinute || 0,
        }))
        .sort((a, b) => b.healthScore - a.healthScore);

      return {
        summary,
        systemHealth,
        queues: stats,
        workers: workerHealth,
        insights: {
          topPerformers: rankedQueues.slice(0, 3),
          needsAttention: rankedQueues.filter(q => q.healthScore < 70).slice(0, 3),
          highThroughput: rankedQueues.sort((a, b) => b.throughput - a.throughput).slice(0, 3),
        },
        timestamp: new Date(),
      };
    } catch (error: any) {
      logger.error('[QUEUE_MANAGER] Error generating dashboard data:', error);
      return {
        error: 'Failed to generate dashboard data',
        summary: {
          totalQueues: this.queues.size,
          totalWorkers: this.workers.size,
          errorRate: 100,
          healthScore: 0,
        },
        timestamp: new Date(),
      };
    }
  }

  /**
   * Graceful shutdown with proper cleanup
   */
  async shutdown(): Promise<void> {

    this.isShuttingDown = true;

    try {
      // Stop monitoring intervals
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }
      if (this.metricsCollectionInterval) {
        clearInterval(this.metricsCollectionInterval);
      }

      // Pause all queues to prevent new jobs
      const pausePromises = Array.from(this.queues.keys()).map(queueName => 
        this.pauseQueue(queueName).catch(err => 
          logger.warn(`[QUEUE_MANAGER] Failed to pause queue ${queueName}:`, err)
        )
      );
      await Promise.all(pausePromises);

      // Wait for active jobs to complete (with timeout)
      await this.waitForActiveJobsToComplete(30000); // 30 second timeout

      // Stop all workers gracefully
      const workerPromises = Array.from(this.workers.keys()).map(queueName => 
        this.stopWorker(queueName).catch(err => 
          logger.warn(`[QUEUE_MANAGER] Failed to stop worker ${queueName}:`, err)
        )
      );
      await Promise.all(workerPromises);

      // Close all queues
      const queuePromises = Array.from(this.queues.values()).map(queue => 
        queue.close().catch(err => 
          logger.warn('[QUEUE_MANAGER] Failed to close queue:', err)
        )
      );
      await Promise.all(queuePromises);

      // Close Redis connections
      await this.ioRedis.quit().catch(err => 
        logger.warn('[QUEUE_MANAGER] Failed to close IORedis connection:', err)
      );

      // Persist final metrics
      await this.persistFinalMetrics();

      // Clear maps
      this.queues.clear();
      this.workers.clear();
      this.queueConfigs.clear();
      this.jobHandlers.clear();
      this.metrics.clear();

    } catch (error: any) {
      logger.error('[QUEUE_MANAGER] Error during shutdown:', error);
      throw error;
    }
  }

  /**
   * Wait for active jobs to complete
   */
  private async waitForActiveJobsToComplete(timeoutMs: number): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const stats = await this.getAllQueueStats();
      const totalActiveJobs = Object.values(stats).reduce(
        (sum, stat: any) => sum + (stat.jobs?.active || 0), 
        0
      );
      
      if (totalActiveJobs === 0) {

        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    logger.warn('[QUEUE_MANAGER] Timeout waiting for active jobs to complete');
  }

  /**
   * Persist final metrics before shutdown
   */
  private async persistFinalMetrics(): Promise<void> {
    try {
      // Only persist to Upstash if configured
      if (!this.redis) {
        logger.info('[QUEUE_MANAGER] Skipping final metrics persistence - Upstash not configured');
        return;
      }

      const dashboardData = await this.getDashboardData();
      await this.redis.setex(
        'queue_manager:final_metrics',
        86400, // 24 hours
        JSON.stringify({
          ...dashboardData,
          shutdownTime: new Date(),
        })
      );
    } catch (error: any) {
      logger.warn('[QUEUE_MANAGER] Failed to persist final metrics:', error);
    }
  }

  /**
   * Wrap handler with monitoring and error handling
   */
  private wrapHandlerWithMonitoring<T extends JobData>(
    handler: WorkerFunction<T>,
    queueName: string
  ): WorkerFunction<T> {
    return async (job: Job<T>) => {
      const startTime = Date.now();
      const metrics = this.metrics.get(queueName);
      
      if (metrics) {
        metrics.active++;
        metrics.peakActiveJobs = Math.max(metrics.peakActiveJobs, metrics.active);
      }
      
      try {

        const result = await handler(job);
        
        // Processing time could be used for detailed metrics in the future
        Date.now() - startTime;

        return result;
      } catch (error: any) {
        const processingTime = Date.now() - startTime;
        logger.error(`[WORKER] Job ${job.id} failed after ${processingTime}ms:`, error);
        
        if (metrics) {
          metrics.totalRetries += (job.attemptsMade || 0) - 1;
        }
        
        throw error;
      } finally {
        if (metrics) {
          metrics.active--;
        }
      }
    };
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error: any) {
        logger.error('[QUEUE_MANAGER] Health check failed:', error);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    this.metricsCollectionInterval = setInterval(async () => {
      try {
        await this.collectAndPersistMetrics();
      } catch (error: any) {
        logger.error('[QUEUE_MANAGER] Metrics collection failed:', error);
      }
    }, 60000); // Every minute
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<void> {
    // Check Redis connection
    try {
      await this.ioRedis.ping();
    } catch (error: any) {
      logger.error('[QUEUE_MANAGER] Redis connection health check failed:', error);
      return;
    }

    // Check each queue health
    for (const [queueName, queue] of this.queues.entries()) {
      try {
        await queue.getJobCounts();
      } catch (error: any) {
        logger.error(`[QUEUE_MANAGER] Health check failed for queue ${queueName}:`, error);
      }
    }

    // Check worker health
    for (const [queueName, worker] of this.workers.entries()) {
      if (!worker.isRunning() && !this.isShuttingDown) {
        logger.warn(`[QUEUE_MANAGER] Worker for queue ${queueName} is not running`);
        // Attempt to restart worker
        try {
          await this.stopWorker(queueName);
          this.startWorker(queueName);

        } catch (error: any) {
          logger.error(`[QUEUE_MANAGER] Failed to restart worker for ${queueName}:`, error);
        }
      }
    }
  }

  /**
   * Setup queue health monitoring
   */
  private setupQueueHealthCheck(queue: Queue, queueName: string): void {
    queue.on('error', (error) => {
      logger.error(`[QUEUE_HEALTH] Queue ${queueName} error:`, error);
    });

    // BullMQ doesn't expose ioredis events directly on Queue
    // Connection monitoring is handled at the Redis client level
  }

  /**
   * Setup worker health monitoring
   */
  private setupWorkerHealthCheck(worker: Worker, queueName: string): void {
    worker.on('error', (error) => {
      logger.error(`[WORKER_HEALTH] Worker ${queueName} error:`, error);
    });

    // BullMQ doesn't expose ioredis events directly on Worker
    // Connection monitoring is handled at the Redis client level
  }

  /**
   * Collect and persist metrics
   */
  private async collectAndPersistMetrics(): Promise<void> {
    try {
      const currentTime = Date.now();
      
      for (const [queueName, metrics] of this.metrics.entries()) {
        // Calculate throughput per minute
        const timeSinceLastCollection = currentTime - (metrics.lastMetricsCollection || currentTime - 60000);
        const jobsProcessedSinceLastCollection = metrics.processed - (metrics.lastProcessedCount || 0);
        
        metrics.throughputPerMinute = timeSinceLastCollection > 0 ? 
          (jobsProcessedSinceLastCollection / timeSinceLastCollection) * 60000 : 0;
        
        // Calculate error rate
        metrics.errorRate = metrics.processed > 0 ? (metrics.failed / metrics.processed) * 100 : 0;
        
        // Update tracking fields
        metrics.lastMetricsCollection = currentTime;
        metrics.lastProcessedCount = metrics.processed;

        // Persist to Redis (only if Upstash is configured)
        if (this.redis) {
          try {
            await this.redis.setex(
              `queue_metrics:${queueName}`,
              300, // 5 minutes TTL
              JSON.stringify({
                ...metrics,
                timestamp: new Date(),
              })
            );
          } catch (redisError: any) {
            // Log but don't fail - metrics are still available in memory
            logger.warn('[QUEUE_MANAGER] Failed to persist metrics to Redis:', redisError.message);
          }
        }
      }
    } catch (error: any) {
      logger.error('[QUEUE_MANAGER] Failed to collect metrics:', error);
    }
  }

  /**
   * Get system health status
   */
  private async getSystemHealth(): Promise<any> {
    try {
      const redisInfo = await this.ioRedis.info();
      const memory = process.memoryUsage();
      
      return {
        redis: {
          connected: this.ioRedis.status === 'ready',
          info: redisInfo.split('\n').slice(0, 10).join('\n'), // First 10 lines
        },
        memory: {
          heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
          rss: Math.round(memory.rss / 1024 / 1024),
          external: Math.round(memory.external / 1024 / 1024),
        },
        uptime: process.uptime(),
        isShuttingDown: this.isShuttingDown,
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        error: 'Failed to get system health',
        isShuttingDown: this.isShuttingDown,
        timestamp: new Date(),
      };
    }
  }
}

// Lazy-initialized singleton — only creates when first accessed
let _queueManager: QueueManager | null = null;

export function getQueueManager(): QueueManager {
  if (!_queueManager) {
    _queueManager = new QueueManager();
  }
  return _queueManager;
}

// Backward-compatible named export using Proxy for lazy instantiation
export const queueManager = new Proxy({} as QueueManager, {
  get(_target, prop) {
    const instance = getQueueManager();
    const value = Reflect.get(instance, prop, instance);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});

export default QueueManager;
