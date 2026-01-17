/**
 * Memory Lifecycle Service
 *
 * Provides a singleton MemoryLifecycleManager for managing memory reindexing
 * and background jobs. Integrates with:
 * - VectorStore for content embeddings
 * - BackgroundWorker for job processing
 * - MemoryNormalizer for LLM context preparation
 * - KGRefreshScheduler for knowledge graph maintenance
 *
 * Phase 3: Infrastructure - Wire to integration vector adapter when available
 */

import {
  MemoryLifecycleManager,
  createMemoryLifecycleManager,
  type MemoryLifecycleConfig,
  type ContentChangeEvent,
  // Background Worker
  BackgroundWorker,
  createBackgroundWorker,
  createJobQueue,
  JobType,
  type WorkerConfig,
  type WorkerStats,
  type QueueStats,
  type BaseJob,
  // Memory Normalizer
  MemoryNormalizer,
  createMemoryNormalizer,
  type MemoryNormalizerConfig,
  type NormalizedMemoryContext,
  type RawMemoryInput,
  // KG Refresh Scheduler
  KGRefreshScheduler,
  createKGRefreshScheduler,
  type KGRefreshSchedulerConfig,
  type KGRefreshJobType,
  type KGRefreshResult,
  type KGRefreshStats,
} from '@sam-ai/agentic';
import type { VectorAdapter } from '@sam-ai/integration';
import { getAdapterFactory, getMemoryStores, getReindexJobStore } from '@/lib/sam/taxomind-context';
import { logger } from '@/lib/logger';
import { SAM_FEATURES } from '@/lib/sam/feature-flags';

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

let lifecycleManager: MemoryLifecycleManager | null = null;
let backgroundWorker: BackgroundWorker | null = null;
let memoryNormalizer: MemoryNormalizer | null = null;
let kgRefreshScheduler: KGRefreshScheduler | null = null;
let isInitialized = false;
let currentVectorAdapter: VectorAdapter | null = null;

// ============================================================================
// STUB VECTOR ADAPTER (for development/testing)
// ============================================================================

/**
 * A minimal stub VectorAdapter for when no real vector store is configured.
 * All operations are no-ops that log warnings.
 */
function createStubVectorAdapter(): VectorAdapter {
  return {
    getName: () => 'stub',
    getDimensions: () => 1536,
    isConnected: async () => true,
    connect: async () => {
      logger.debug('[MemoryLifecycle] Stub vector adapter connected');
    },
    disconnect: async () => {
      logger.debug('[MemoryLifecycle] Stub vector adapter disconnected');
    },
    healthCheck: async () => ({
      healthy: true,
      latencyMs: 0,
    }),
    insert: async () => {
      logger.warn('[MemoryLifecycle] Stub vector adapter: insert is a no-op');
      return { id: '', content: '', vector: [], metadata: { sourceId: '', sourceType: 'course_content' as const, courseId: '', tags: [], timestamp: new Date() }, createdAt: new Date(), updatedAt: new Date() };
    },
    insertBatch: async () => {
      logger.warn('[MemoryLifecycle] Stub vector adapter: insertBatch is a no-op');
      return { successful: [], failed: [], totalProcessed: 0 };
    },
    upsert: async () => {
      logger.warn('[MemoryLifecycle] Stub vector adapter: upsert is a no-op');
      return { id: '', content: '', vector: [], metadata: { sourceId: '', sourceType: 'course_content' as const, courseId: '', tags: [], timestamp: new Date() }, createdAt: new Date(), updatedAt: new Date() };
    },
    upsertBatch: async () => {
      logger.warn('[MemoryLifecycle] Stub vector adapter: upsertBatch is a no-op');
      return { successful: [], failed: [], totalProcessed: 0 };
    },
    get: async () => null,
    getMany: async () => [],
    updateMetadata: async () => {
      logger.warn('[MemoryLifecycle] Stub vector adapter: updateMetadata is a no-op');
      return { id: '', content: '', vector: [], metadata: { sourceId: '', sourceType: 'course_content' as const, courseId: '', tags: [], timestamp: new Date() }, createdAt: new Date(), updatedAt: new Date() };
    },
    delete: async () => {
      logger.warn('[MemoryLifecycle] Stub vector adapter: delete is a no-op');
      return false;
    },
    deleteBatch: async () => 0,
    deleteByFilter: async () => 0,
    search: async () => [],
    searchByVector: async () => [],
    searchWithScore: async () => [],
    hybridSearch: async () => [],
    count: async () => 0,
    listIds: async () => [],
    getStats: async () => ({
      totalDocuments: 0,
      totalSize: 0,
      dimensions: 1536,
      isReady: true,
      lastUpdated: new Date(),
    }),
  } as VectorAdapter;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

export interface MemoryLifecycleServiceConfig {
  /** Custom vector adapter to use (overrides auto-detection) */
  vectorAdapter?: VectorAdapter;
  /** Deprecated: integration adapters are required (kept for compatibility) */
  usePgVector?: boolean;
  /** Deprecated: integration adapters are required (kept for compatibility) */
  openaiApiKey?: string;
  /** Deprecated: integration adapters are required (kept for compatibility) */
  embeddingModel?: string;
  /** Deprecated: integration adapters are required (kept for compatibility) */
  tableName?: string;
  /** Lifecycle configuration overrides */
  lifecycleConfig?: Partial<MemoryLifecycleConfig>;
  /** Background worker configuration */
  workerConfig?: Partial<WorkerConfig>;
  /** Memory normalizer configuration */
  normalizerConfig?: Partial<MemoryNormalizerConfig>;
  /** KG refresh scheduler configuration */
  kgRefreshConfig?: Partial<KGRefreshSchedulerConfig>;
  /** Enable background worker (default: true) */
  enableWorker?: boolean;
  /** Enable KG refresh scheduler (default: true) */
  enableKGRefresh?: boolean;
}

/**
 * Initialize the Memory Lifecycle Service
 * Should be called during application startup
 *
 * By default, attempts to use PgVector adapter if OPENAI_API_KEY is available
 */
export async function initializeMemoryLifecycle(
  config?: MemoryLifecycleServiceConfig
): Promise<MemoryLifecycleManager> {
  if (lifecycleManager && isInitialized) {
    logger.debug('[MemoryLifecycle] Already initialized');
    return lifecycleManager;
  }

  // Determine which vector adapter to use
  let vectorAdapter: VectorAdapter | null = null;

  if (config?.vectorAdapter) {
    // Use explicitly provided adapter
    vectorAdapter = config.vectorAdapter;
    logger.info('[MemoryLifecycle] Using provided vector adapter');
  } else {
    try {
      const factory = getAdapterFactory();
      if (factory.hasVectorAdapter()) {
        vectorAdapter = await factory.getVectorAdapter();
        logger.info('[MemoryLifecycle] Using integration vector adapter');
      }
    } catch (error) {
      logger.warn('[MemoryLifecycle] Failed to load integration vector adapter', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }

  if (!vectorAdapter) {
    vectorAdapter = createStubVectorAdapter();
    logger.warn('[MemoryLifecycle] Vector adapter unavailable, using stub adapter');
  }

  // Store the vector adapter for later access
  currentVectorAdapter = vectorAdapter;

  // Create lifecycle manager logger
  const lifecycleLogger = {
    debug: (msg: string, data?: Record<string, unknown>) => logger.debug(`[MemoryLifecycle] ${msg}`, data),
    info: (msg: string, data?: Record<string, unknown>) => logger.info(`[MemoryLifecycle] ${msg}`, data),
    warn: (msg: string, data?: Record<string, unknown>) => logger.warn(`[MemoryLifecycle] ${msg}`, data),
    error: (msg: string, data?: Record<string, unknown>) => logger.error(`[MemoryLifecycle] ${msg}`, data),
  };

  lifecycleManager = createMemoryLifecycleManager({
    vectorAdapter,
    store: getReindexJobStore(),
    config: {
      autoReindexEnabled: true,
      debounceMs: 5000,
      maxBatchSize: 100,
      maxConcurrentJobs: 3,
      retry: {
        maxAttempts: 3,
        backoffMs: 1000,
        backoffMultiplier: 2,
      },
      ...config?.lifecycleConfig,
    },
    logger: lifecycleLogger,
  });

  // Initialize Memory Normalizer (always enabled)
  memoryNormalizer = createMemoryNormalizer({
    config: {
      maxItems: 50,
      maxItemsPerSegment: 10,
      maxContentLength: 2000,
      minRelevanceScore: 0.3,
      includeSummaries: true,
      maxSummaryLength: 200,
      tokenBudget: 4000,
      charsPerToken: 4,
      ...config?.normalizerConfig,
    },
    logger: lifecycleLogger,
  });
  logger.info('[MemoryLifecycle] Memory normalizer initialized');

  // Initialize Background Worker (if enabled)
  const enableWorker = config?.enableWorker ?? true;
  if (enableWorker) {
    const memoryQueue = createJobQueue({
      config: { name: 'memory' },
      logger: lifecycleLogger,
    });
    const kgQueue = createJobQueue({
      config: { name: 'kg' },
      logger: lifecycleLogger,
    });

    const queues = new Map();
    queues.set('memory', memoryQueue);
    queues.set('kg', kgQueue);

    backgroundWorker = createBackgroundWorker({
      config: {
        id: 'memory-lifecycle-worker',
        queues: ['memory', 'kg'],
        concurrency: 3,
        pollIntervalMs: 1000,
        maxJobsPerCycle: 50,
        gracefulShutdown: true,
        shutdownTimeoutMs: 30000,
        ...config?.workerConfig,
      },
      queues,
      logger: lifecycleLogger,
    });

    // Register job handlers
    registerDefaultJobHandlers();
    logger.info('[MemoryLifecycle] Background worker initialized');
  }

  // Initialize KG Refresh Scheduler (if enabled)
  const enableKGRefresh = config?.enableKGRefresh ?? true;
  if (enableKGRefresh) {
    try {
      const { knowledgeGraph } = getMemoryStores();
      kgRefreshScheduler = createKGRefreshScheduler({
        config: {
          enabled: true,
          scheduleIntervalMs: 6 * 60 * 60 * 1000, // 6 hours
          staleRelationshipAgeMs: 7 * 24 * 60 * 60 * 1000, // 7 days
          incrementalMode: true,
          batchSize: 100,
          minRelationshipConfidence: 0.5,
          ...config?.kgRefreshConfig,
        },
        kgStore: knowledgeGraph,
        logger: lifecycleLogger,
      });
      logger.info('[MemoryLifecycle] KG refresh scheduler initialized');
    } catch (error) {
      logger.warn('[MemoryLifecycle] Failed to initialize KG refresh scheduler', {
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }
  }

  isInitialized = true;
  logger.info('[MemoryLifecycle] All components initialized', {
    hasWorker: !!backgroundWorker,
    hasNormalizer: !!memoryNormalizer,
    hasKGRefresh: !!kgRefreshScheduler,
  });

  return lifecycleManager;
}

// ============================================================================
// JOB HANDLERS
// ============================================================================

/**
 * Register default job handlers for the background worker
 */
function registerDefaultJobHandlers(): void {
  if (!backgroundWorker) return;

  // Reindex handler
  backgroundWorker.registerHandler(JobType.REINDEX, async (job) => {
    const { entityType, entityId, courseId } = job.data as {
      entityType: string;
      entityId: string;
      courseId?: string;
    };

    logger.info('[MemoryLifecycle] Processing reindex job', {
      jobId: job.id,
      entityType,
      entityId,
    });

    // Use the lifecycle manager to handle reindexing
    if (lifecycleManager) {
      await lifecycleManager.handleContentChange({
        id: job.id,
        entityType: entityType as 'course' | 'chapter' | 'section',
        entityId,
        changeType: 'update',
        timestamp: new Date(),
        metadata: { courseId },
      });
    }

    return { success: true, entityId };
  });

  // KG Refresh handler
  backgroundWorker.registerHandler(JobType.KG_REFRESH, async (job) => {
    const { refreshType } = job.data as { refreshType?: KGRefreshJobType };

    logger.info('[MemoryLifecycle] Processing KG refresh job', {
      jobId: job.id,
      refreshType,
    });

    if (kgRefreshScheduler) {
      const results = await kgRefreshScheduler.executePendingJobs();
      return { success: true, results };
    }

    return { success: false, error: 'KG refresh scheduler not available' };
  });

  // Memory cleanup handler
  backgroundWorker.registerHandler(JobType.MEMORY_CLEANUP, async (job) => {
    const { olderThanDays } = job.data as { olderThanDays?: number };
    const days = olderThanDays ?? 30;

    logger.info('[MemoryLifecycle] Processing memory cleanup job', {
      jobId: job.id,
      olderThanDays: days,
    });

    // Queue-level cleanup for completed/failed jobs
    const queue = backgroundWorker?.getQueue('memory');
    if (queue) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const cleaned = await queue.cleanup(cutoffDate);
      return { success: true, cleanedCount: cleaned };
    }

    return { success: false, error: 'Queue not available' };
  });

  // Embedding generation handler
  backgroundWorker.registerHandler(JobType.EMBEDDING_GENERATION, async (job) => {
    const { content, sourceId, sourceType, courseId } = job.data as {
      content: string;
      sourceId: string;
      sourceType: string;
      courseId?: string;
    };

    logger.info('[MemoryLifecycle] Processing embedding generation job', {
      jobId: job.id,
      sourceId,
      sourceType,
    });

    // Get the lifecycle manager's vector adapter
    if (!lifecycleManager || !currentVectorAdapter) {
      return { success: false, error: 'Lifecycle manager or vector adapter not initialized' };
    }

    try {
      // Store the content as a vector embedding using upsert
      const result = await currentVectorAdapter.upsert({
        id: sourceId,
        content,
        metadata: {
          sourceId,
          sourceType: sourceType as 'course_content' | 'user_note' | 'conversation' | 'learning_path' | 'skill_assessment',
          courseId: courseId ?? '',
          tags: [],
        },
      });

      logger.info('[MemoryLifecycle] Embedding generated successfully', {
        sourceId,
        resultId: result?.id,
      });

      return { success: true, sourceId, embeddingId: result?.id };
    } catch (error) {
      logger.error('[MemoryLifecycle] Failed to generate embedding', {
        sourceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return {
        success: false,
        sourceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  logger.debug('[MemoryLifecycle] Default job handlers registered');
}

/**
 * Get the singleton MemoryLifecycleManager
 * Initializes with defaults if not already initialized
 */
export async function getMemoryLifecycleManager(): Promise<MemoryLifecycleManager> {
  if (!lifecycleManager) {
    return initializeMemoryLifecycle();
  }
  return lifecycleManager;
}

// ============================================================================
// COMPONENT GETTERS
// ============================================================================

/**
 * Get the singleton BackgroundWorker
 * Returns null if worker is not enabled
 */
export async function getBackgroundWorker(): Promise<BackgroundWorker | null> {
  if (!isInitialized) {
    await initializeMemoryLifecycle();
  }
  return backgroundWorker;
}

/**
 * Get the singleton MemoryNormalizer
 */
export async function getMemoryNormalizer(): Promise<MemoryNormalizer> {
  if (!isInitialized) {
    await initializeMemoryLifecycle();
  }
  if (!memoryNormalizer) {
    throw new Error('MemoryNormalizer not initialized');
  }
  return memoryNormalizer;
}

/**
 * Get the singleton KGRefreshScheduler
 * Returns null if KG refresh is not enabled
 */
export async function getKGRefreshScheduler(): Promise<KGRefreshScheduler | null> {
  if (!isInitialized) {
    await initializeMemoryLifecycle();
  }
  return kgRefreshScheduler;
}

// ============================================================================
// LIFECYCLE CONTROL
// ============================================================================

/**
 * Start the memory lifecycle scheduler
 * Begins processing reindex jobs in the background
 */
export async function startMemoryLifecycle(): Promise<void> {
  const manager = await getMemoryLifecycleManager();
  await manager.start();
  logger.info('[MemoryLifecycle] Lifecycle manager started');

  // Start background worker if available
  if (backgroundWorker) {
    await backgroundWorker.start();
    logger.info('[MemoryLifecycle] Background worker started');
  }

  // Start KG refresh scheduler if available
  if (kgRefreshScheduler) {
    await kgRefreshScheduler.start();
    logger.info('[MemoryLifecycle] KG refresh scheduler started');
  }

  logger.info('[MemoryLifecycle] All components started');
}

/**
 * Stop the memory lifecycle scheduler
 * Gracefully stops processing and flushes pending jobs
 */
export async function stopMemoryLifecycle(): Promise<void> {
  // Stop KG refresh scheduler first
  if (kgRefreshScheduler) {
    await kgRefreshScheduler.stop();
    logger.info('[MemoryLifecycle] KG refresh scheduler stopped');
  }

  // Stop background worker
  if (backgroundWorker) {
    await backgroundWorker.stop();
    logger.info('[MemoryLifecycle] Background worker stopped');
  }

  // Stop lifecycle manager
  if (lifecycleManager) {
    await lifecycleManager.stop();
    logger.info('[MemoryLifecycle] Lifecycle manager stopped');
  } else {
    logger.debug('[MemoryLifecycle] No manager to stop');
  }

  logger.info('[MemoryLifecycle] All components stopped');
}

// ============================================================================
// EVENT HANDLING
// ============================================================================

/**
 * Notify the lifecycle manager of a content change
 * This will queue a reindex job if auto-reindex is enabled
 */
export async function notifyContentChange(
  event: ContentChangeEvent
): Promise<void> {
  const manager = await getMemoryLifecycleManager();
  await manager.handleContentChange(event);
}

/**
 * Queue a reindex job for course content
 * Only queues if MEMORY_LIFECYCLE_ENABLED feature flag is true
 */
export async function queueCourseReindex(
  courseId: string,
  changeType: 'create' | 'update' | 'delete' = 'update'
): Promise<void> {
  if (!SAM_FEATURES.MEMORY_LIFECYCLE_ENABLED) {
    logger.debug(`[MemoryLifecycle] Skipping course reindex (feature disabled): ${courseId}`);
    return;
  }
  await notifyContentChange({
    id: `course-change-${Date.now()}`,
    entityType: 'course',
    entityId: courseId,
    changeType,
    timestamp: new Date(),
    metadata: {
      courseId,
    },
  });
  logger.info(`[MemoryLifecycle] Queued reindex for course: ${courseId}`);
}

/**
 * Queue a reindex job for chapter content
 * Only queues if MEMORY_LIFECYCLE_ENABLED feature flag is true
 */
export async function queueChapterReindex(
  chapterId: string,
  courseId: string,
  changeType: 'create' | 'update' | 'delete' = 'update'
): Promise<void> {
  if (!SAM_FEATURES.MEMORY_LIFECYCLE_ENABLED) {
    logger.debug(`[MemoryLifecycle] Skipping chapter reindex (feature disabled): ${chapterId}`);
    return;
  }
  await notifyContentChange({
    id: `chapter-change-${Date.now()}`,
    entityType: 'chapter',
    entityId: chapterId,
    changeType,
    timestamp: new Date(),
    metadata: {
      courseId,
      chapterId,
    },
  });
  logger.info(`[MemoryLifecycle] Queued reindex for chapter: ${chapterId}`);
}

/**
 * Queue a reindex job for section content
 * Only queues if MEMORY_LIFECYCLE_ENABLED feature flag is true
 */
export async function queueSectionReindex(
  sectionId: string,
  courseId: string,
  changeType: 'create' | 'update' | 'delete' = 'update'
): Promise<void> {
  if (!SAM_FEATURES.MEMORY_LIFECYCLE_ENABLED) {
    logger.debug(`[MemoryLifecycle] Skipping section reindex (feature disabled): ${sectionId}`);
    return;
  }
  await notifyContentChange({
    id: `section-change-${Date.now()}`,
    entityType: 'section',
    entityId: sectionId,
    changeType,
    timestamp: new Date(),
    metadata: {
      courseId,
    },
  });
  logger.info(`[MemoryLifecycle] Queued reindex for section: ${sectionId}`);
}

// ============================================================================
// JOB QUEUING
// ============================================================================

/**
 * Queue a background job for processing
 */
export async function queueBackgroundJob<TData>(
  type: typeof JobType[keyof typeof JobType],
  data: TData,
  options?: { queue?: string; priority?: number; scheduledFor?: Date }
): Promise<BaseJob | null> {
  const worker = await getBackgroundWorker();
  if (!worker) {
    logger.warn('[MemoryLifecycle] Background worker not available');
    return null;
  }

  return worker.addJob(type, data, {
    queue: options?.queue ?? 'memory',
    priority: options?.priority ?? 5,
    scheduledFor: options?.scheduledFor ?? new Date(),
  });
}

/**
 * Queue a KG refresh job
 */
export async function queueKGRefresh(
  refreshType: KGRefreshJobType = 'incremental'
): Promise<BaseJob | null> {
  return queueBackgroundJob(JobType.KG_REFRESH, { refreshType }, { queue: 'kg', priority: 3 });
}

/**
 * Queue a memory cleanup job
 */
export async function queueMemoryCleanup(
  olderThanDays: number = 30
): Promise<BaseJob | null> {
  return queueBackgroundJob(JobType.MEMORY_CLEANUP, { olderThanDays }, { priority: 2 });
}

/**
 * Queue an embedding generation job
 */
export async function queueEmbeddingGeneration(
  content: string,
  sourceId: string,
  sourceType: string,
  courseId?: string
): Promise<BaseJob | null> {
  return queueBackgroundJob(
    JobType.EMBEDDING_GENERATION,
    { content, sourceId, sourceType, courseId },
    { priority: 7 }
  );
}

// ============================================================================
// MEMORY NORMALIZATION
// ============================================================================

/**
 * Normalize raw memory results into a standardized context for LLM injection
 */
export async function normalizeMemory(
  input: RawMemoryInput
): Promise<NormalizedMemoryContext> {
  const normalizer = await getMemoryNormalizer();
  return normalizer.normalize(input);
}

/**
 * Format normalized memory context for prompt injection
 */
export async function formatMemoryForPrompt(context: NormalizedMemoryContext): Promise<string> {
  const normalizer = await getMemoryNormalizer();
  return normalizer.formatForPrompt(context);
}

/**
 * Format normalized memory context as structured data for APIs
 */
export async function formatMemoryAsStructuredData(
  context: NormalizedMemoryContext
): Promise<ReturnType<MemoryNormalizer['formatAsStructuredData']>> {
  const normalizer = await getMemoryNormalizer();
  return normalizer.formatAsStructuredData(context);
}

// ============================================================================
// KG REFRESH OPERATIONS
// ============================================================================

/**
 * Schedule a KG refresh job directly
 */
export async function scheduleKGRefresh(
  type: KGRefreshJobType,
  options?: { scheduledFor?: Date }
): Promise<{ id: string; type: KGRefreshJobType; scheduledFor: Date } | null> {
  const scheduler = await getKGRefreshScheduler();
  if (!scheduler) {
    logger.warn('[MemoryLifecycle] KG refresh scheduler not available');
    return null;
  }

  const job = await scheduler.scheduleRefresh(type, { scheduledFor: options?.scheduledFor });
  return { id: job.id, type: job.type, scheduledFor: job.scheduledFor };
}

/**
 * Execute pending KG refresh jobs immediately
 */
export async function executeKGRefreshJobs(): Promise<KGRefreshResult[]> {
  const scheduler = await getKGRefreshScheduler();
  if (!scheduler) {
    logger.warn('[MemoryLifecycle] KG refresh scheduler not available');
    return [];
  }

  return scheduler.executePendingJobs();
}

/**
 * Get KG refresh scheduler statistics
 */
export async function getKGRefreshStats(): Promise<KGRefreshStats | null> {
  const scheduler = await getKGRefreshScheduler();
  if (!scheduler) {
    return null;
  }
  return scheduler.getStats();
}

// ============================================================================
// STATS AND MONITORING
// ============================================================================

/**
 * Combined stats interface for all components
 */
export interface MemoryLifecycleFullStats {
  isRunning: boolean;
  lifecycle: ReturnType<MemoryLifecycleManager['getStats']> | null;
  worker: WorkerStats | null;
  queues: { memory: QueueStats | null; kg: QueueStats | null };
  kgRefresh: KGRefreshStats | null;
  normalizer: { config: ReturnType<MemoryNormalizer['getConfig']> } | null;
}

/**
 * Get current lifecycle stats
 */
export async function getLifecycleStats(): Promise<{
  isRunning: boolean;
  stats: ReturnType<MemoryLifecycleManager['getStats']> | null;
}> {
  if (!lifecycleManager) {
    return { isRunning: false, stats: null };
  }

  try {
    const stats = lifecycleManager.getStats();
    return {
      isRunning: true,
      stats,
    };
  } catch {
    return { isRunning: false, stats: null };
  }
}

/**
 * Get comprehensive stats for all components
 */
export async function getFullLifecycleStats(): Promise<MemoryLifecycleFullStats> {
  const lifecycleStats = await getLifecycleStats();

  // Worker stats
  let workerStats: WorkerStats | null = null;
  let memoryQueueStats: QueueStats | null = null;
  let kgQueueStats: QueueStats | null = null;

  if (backgroundWorker) {
    workerStats = backgroundWorker.getStats();
    const memoryQueue = backgroundWorker.getQueue('memory');
    const kgQueue = backgroundWorker.getQueue('kg');
    if (memoryQueue) {
      memoryQueueStats = await memoryQueue.getStats();
    }
    if (kgQueue) {
      kgQueueStats = await kgQueue.getStats();
    }
  }

  // KG refresh stats
  const kgRefreshStats = await getKGRefreshStats();

  // Normalizer config
  let normalizerConfig: ReturnType<MemoryNormalizer['getConfig']> | null = null;
  if (memoryNormalizer) {
    normalizerConfig = memoryNormalizer.getConfig();
  }

  return {
    isRunning: lifecycleStats.isRunning,
    lifecycle: lifecycleStats.stats,
    worker: workerStats,
    queues: {
      memory: memoryQueueStats,
      kg: kgQueueStats,
    },
    kgRefresh: kgRefreshStats,
    normalizer: normalizerConfig ? { config: normalizerConfig } : null,
  };
}

/**
 * Get worker stats only
 */
export function getWorkerStats(): WorkerStats | null {
  if (!backgroundWorker) {
    return null;
  }
  return backgroundWorker.getStats();
}

/**
 * Get the current vector adapter
 * Returns null if not initialized
 */
export function getVectorAdapter(): VectorAdapter | null {
  return currentVectorAdapter;
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  ContentChangeEvent,
  MemoryLifecycleConfig,
  // Worker types
  WorkerConfig,
  WorkerStats,
  QueueStats,
  BaseJob,
  // Normalizer types
  MemoryNormalizerConfig,
  NormalizedMemoryContext,
  RawMemoryInput,
  // KG Refresh types
  KGRefreshSchedulerConfig,
  KGRefreshJobType,
  KGRefreshResult,
  KGRefreshStats,
};

// Re-export JobType for consumers
export { JobType };
