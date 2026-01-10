/**
 * Memory Lifecycle Service
 *
 * Provides a singleton MemoryLifecycleManager for managing memory reindexing
 * and background jobs. Integrates with the VectorStore for content embeddings.
 *
 * Phase 3: Infrastructure - Wire to real PgVector adapter from @sam-ai/adapter-taxomind
 */

import {
  MemoryLifecycleManager,
  createMemoryLifecycleManager,
  InMemoryReindexJobStore,
  type MemoryLifecycleConfig,
  type ContentChangeEvent,
} from '@sam-ai/agentic';
import type { VectorAdapter } from '@sam-ai/integration';
import {
  createPgVectorAdapter,
  createOpenAIEmbeddingAdapter,
} from '@sam-ai/adapter-taxomind';
import { db } from '@/lib/db';
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
  /** Custom vector adapter to use (overrides auto-detection) */
  vectorAdapter?: VectorAdapter;
  /** Use PgVector adapter with Prisma (requires OPENAI_API_KEY) */
  usePgVector?: boolean;
  /** OpenAI API key for embeddings (defaults to OPENAI_API_KEY env var) */
  openaiApiKey?: string;
  /** OpenAI embedding model (defaults to text-embedding-3-small) */
  embeddingModel?: string;
  /** SAMMemory table name for vector storage */
  tableName?: string;
  /** Lifecycle configuration overrides */
  lifecycleConfig?: Partial<MemoryLifecycleConfig>;
}

/**
 * Initialize the Memory Lifecycle Service
 * Should be called during application startup
 *
 * By default, attempts to use PgVector adapter if OPENAI_API_KEY is available
 */
export function initializeMemoryLifecycle(
  config?: MemoryLifecycleServiceConfig
): MemoryLifecycleManager {
  if (lifecycleManager && isInitialized) {
    logger.debug('[MemoryLifecycle] Already initialized');
    return lifecycleManager;
  }

  // Determine which vector adapter to use
  let vectorAdapter: VectorAdapter;

  if (config?.vectorAdapter) {
    // Use explicitly provided adapter
    vectorAdapter = config.vectorAdapter;
    logger.info('[MemoryLifecycle] Using provided vector adapter');
  } else {
    // Check if we should use PgVector (default: true if OPENAI_API_KEY is available)
    const usePgVector = config?.usePgVector ?? Boolean(process.env.OPENAI_API_KEY);
    const openaiApiKey = config?.openaiApiKey ?? process.env.OPENAI_API_KEY;

    if (usePgVector && openaiApiKey) {
      try {
        // Create embedding adapter for vector generation
        const embeddingAdapter = createOpenAIEmbeddingAdapter({
          apiKey: openaiApiKey,
          model: config?.embeddingModel ?? 'text-embedding-3-small',
        });

        // Create PgVector adapter with Prisma and embedding support
        // Note: Type cast through unknown due to Prisma client extensions
        vectorAdapter = createPgVectorAdapter(
          db as unknown as Parameters<typeof createPgVectorAdapter>[0],
          {
            tableName: config?.tableName ?? 'SAMMemory',
            embeddingColumn: 'embedding',
            contentColumn: 'content',
          }
        );

        // Set the embedding provider on the adapter if supported
        if ('embeddingProvider' in vectorAdapter) {
          (vectorAdapter as { embeddingProvider?: unknown }).embeddingProvider = embeddingAdapter;
        }

        logger.info('[MemoryLifecycle] Using PgVector adapter with OpenAI embeddings');
      } catch (error) {
        logger.warn('[MemoryLifecycle] Failed to initialize PgVector adapter, falling back to stub', {
          error: error instanceof Error ? error.message : 'Unknown',
        });
        vectorAdapter = createStubVectorAdapter();
      }
    } else {
      // Fall back to stub adapter
      vectorAdapter = createStubVectorAdapter();
      if (usePgVector && !openaiApiKey) {
        logger.warn('[MemoryLifecycle] PgVector requested but OPENAI_API_KEY not set, using stub adapter');
      } else {
        logger.debug('[MemoryLifecycle] Using stub vector adapter');
      }
    }
  }

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
