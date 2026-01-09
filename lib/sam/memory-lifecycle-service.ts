/**
 * Memory Lifecycle Service
 *
 * Provides a singleton MemoryLifecycleManager for managing memory reindexing
 * and background jobs. Integrates with the VectorStore for content embeddings.
 */

import {
  MemoryLifecycleManager,
  createMemoryLifecycleManager,
  InMemoryReindexJobStore,
  type MemoryLifecycleConfig,
  type ContentChangeEvent,
} from '@sam-ai/agentic';
import type { VectorAdapter } from '@sam-ai/integration';
import { logger } from '@/lib/logger';

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let lifecycleManager: MemoryLifecycleManager | null = null;
let isInitialized = false;

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
  vectorAdapter?: VectorAdapter;
  lifecycleConfig?: Partial<MemoryLifecycleConfig>;
}

/**
 * Initialize the Memory Lifecycle Service
 * Should be called during application startup
 */
export function initializeMemoryLifecycle(
  config?: MemoryLifecycleServiceConfig
): MemoryLifecycleManager {
  if (lifecycleManager && isInitialized) {
    logger.debug('[MemoryLifecycle] Already initialized');
    return lifecycleManager;
  }

  // Use provided adapter or fall back to stub
  const vectorAdapter = config?.vectorAdapter ?? createStubVectorAdapter();

  lifecycleManager = createMemoryLifecycleManager({
    vectorAdapter,
    store: new InMemoryReindexJobStore(),
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
    logger: {
      debug: (msg, data) => logger.debug(`[MemoryLifecycle] ${msg}`, data),
      info: (msg, data) => logger.info(`[MemoryLifecycle] ${msg}`, data),
      warn: (msg, data) => logger.warn(`[MemoryLifecycle] ${msg}`, data),
      error: (msg, data) => logger.error(`[MemoryLifecycle] ${msg}`, data),
    },
  });

  isInitialized = true;
  logger.info('[MemoryLifecycle] Manager initialized');

  return lifecycleManager;
}

/**
 * Get the singleton MemoryLifecycleManager
 * Initializes with defaults if not already initialized
 */
export function getMemoryLifecycleManager(): MemoryLifecycleManager {
  if (!lifecycleManager) {
    return initializeMemoryLifecycle();
  }
  return lifecycleManager;
}

// ============================================================================
// LIFECYCLE CONTROL
// ============================================================================

/**
 * Start the memory lifecycle scheduler
 * Begins processing reindex jobs in the background
 */
export async function startMemoryLifecycle(): Promise<void> {
  const manager = getMemoryLifecycleManager();
  await manager.start();
  logger.info('[MemoryLifecycle] Scheduler started');
}

/**
 * Stop the memory lifecycle scheduler
 * Gracefully stops processing and flushes pending jobs
 */
export async function stopMemoryLifecycle(): Promise<void> {
  if (!lifecycleManager) {
    logger.debug('[MemoryLifecycle] No manager to stop');
    return;
  }
  await lifecycleManager.stop();
  logger.info('[MemoryLifecycle] Scheduler stopped');
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
  const manager = getMemoryLifecycleManager();
  await manager.handleContentChange(event);
}

/**
 * Queue a reindex job for course content
 */
export async function queueCourseReindex(
  courseId: string,
  changeType: 'create' | 'update' | 'delete' = 'update'
): Promise<void> {
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
 */
export async function queueChapterReindex(
  chapterId: string,
  courseId: string,
  changeType: 'create' | 'update' | 'delete' = 'update'
): Promise<void> {
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
 */
export async function queueSectionReindex(
  sectionId: string,
  courseId: string,
  changeType: 'create' | 'update' | 'delete' = 'update'
): Promise<void> {
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
// STATS AND MONITORING
// ============================================================================

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

// ============================================================================
// EXPORTS
// ============================================================================

export type { ContentChangeEvent, MemoryLifecycleConfig };
