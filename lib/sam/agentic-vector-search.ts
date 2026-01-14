/**
 * SAM Agentic Vector Search Integration
 * Wires PrismaVectorAdapter with the integration embedding provider for agentic tools
 */

import {
  createVectorStore,
  type VectorStore,
  type VectorSearchOptions,
  type SimilarityResult,
  type VectorEmbedding,
  type EmbeddingMetadata,
  type EmbeddingSourceType,
} from '@sam-ai/agentic';
import { getMemoryStores } from '@/lib/sam/taxomind-context';
import { getEmbeddingProvider } from '@/lib/sam/integration-adapters';
import { logger } from '@/lib/logger';
import { createHash } from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface VectorSearchResult {
  id: string;
  content: string;
  score: number;
  sourceType: EmbeddingSourceType;
  sourceId: string;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  tags: string[];
}

export interface ContentSearchOptions {
  topK?: number;
  minScore?: number;
  courseId?: string;
  sourceTypes?: EmbeddingSourceType[];
  tags?: string[];
}

// ============================================================================
// VECTOR STORE SINGLETON
// ============================================================================

let vectorStoreInstance: Promise<VectorStore> | null = null;

export async function getAgenticVectorStore(): Promise<VectorStore> {
  if (vectorStoreInstance) {
    return vectorStoreInstance;
  }

  vectorStoreInstance = (async () => {
    const embeddingProvider = await getEmbeddingProvider();
    if (!embeddingProvider) {
      throw new Error('Embedding adapter not available for vector search');
    }

    const { vector: vectorAdapter } = getMemoryStores();

    return createVectorStore({
      embeddingProvider,
      persistenceAdapter: vectorAdapter,
      logger,
      cacheEnabled: true,
      cacheMaxSize: 1000,
      cacheTTLSeconds: 300,
    });
  })();

  return vectorStoreInstance;
}

// ============================================================================
// CONTENT SEARCH FUNCTIONS
// ============================================================================

/**
 * Search for similar content using semantic search
 */
export async function searchContent(
  query: string,
  options: ContentSearchOptions = {}
): Promise<VectorSearchResult[]> {
  const vectorStore = await getAgenticVectorStore();

  const searchOptions: VectorSearchOptions = {
    topK: options.topK ?? 10,
    minScore: options.minScore ?? 0.7,
    includeMetadata: true,
    filter: {
      courseIds: options.courseId ? [options.courseId] : undefined,
      sourceTypes: options.sourceTypes,
      tags: options.tags,
    },
  };

  try {
    const results = await vectorStore.search(query, searchOptions);
    return mapSearchResults(results);
  } catch (error) {
    logger.error('[VectorSearch] Search failed', { error, query });
    return [];
  }
}

/**
 * Search for related content to a given source
 */
export async function findRelatedContent(
  sourceId: string,
  options: ContentSearchOptions = {}
): Promise<VectorSearchResult[]> {
  const vectorStore = await getAgenticVectorStore();

  // First, get the source embedding
  const sourceEmbedding = await vectorStore.get(sourceId);
  if (!sourceEmbedding) {
    logger.warn('[VectorSearch] Source embedding not found', { sourceId });
    return [];
  }

  const searchOptions: VectorSearchOptions = {
    topK: (options.topK ?? 10) + 1, // Get one extra to filter out self
    minScore: options.minScore ?? 0.7,
    includeMetadata: true,
    filter: {
      courseIds: options.courseId ? [options.courseId] : undefined,
      sourceTypes: options.sourceTypes,
      tags: options.tags,
    },
  };

  try {
    const results = await vectorStore.searchByVector(sourceEmbedding.vector, searchOptions);
    // Filter out the source itself
    const filtered = results.filter((r) => r.embedding.id !== sourceId);
    return mapSearchResults(filtered.slice(0, options.topK ?? 10));
  } catch (error) {
    logger.error('[VectorSearch] Find related failed', { error, sourceId });
    return [];
  }
}

// ============================================================================
// CONTENT INDEXING FUNCTIONS
// ============================================================================

/**
 * Index content for semantic search
 */
export async function indexContent(
  content: string,
  metadata: {
    sourceId: string;
    sourceType: EmbeddingSourceType;
    userId?: string;
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    tags?: string[];
  }
): Promise<string> {
  const vectorStore = await getAgenticVectorStore();

  const embeddingMetadata: EmbeddingMetadata = {
    sourceId: metadata.sourceId,
    sourceType: metadata.sourceType,
    userId: metadata.userId,
    courseId: metadata.courseId,
    chapterId: metadata.chapterId,
    sectionId: metadata.sectionId,
    contentHash: hashContent(content),
    tags: metadata.tags ?? [],
    customMetadata: { content },
  };

  try {
    const embedding = await vectorStore.insert(content, embeddingMetadata);
    logger.info('[VectorSearch] Content indexed', {
      id: embedding.id,
      sourceId: metadata.sourceId,
      sourceType: metadata.sourceType,
    });
    return embedding.id;
  } catch (error) {
    logger.error('[VectorSearch] Index failed', { error, metadata });
    throw error;
  }
}

/**
 * Batch index multiple content items
 */
export async function indexContentBatch(
  items: Array<{
    content: string;
    metadata: {
      sourceId: string;
      sourceType: EmbeddingSourceType;
      userId?: string;
      courseId?: string;
      chapterId?: string;
      sectionId?: string;
      tags?: string[];
    };
  }>
): Promise<string[]> {
  const vectorStore = await getAgenticVectorStore();

  const batchItems = items.map((item) => ({
    content: item.content,
    metadata: {
      sourceId: item.metadata.sourceId,
      sourceType: item.metadata.sourceType,
      userId: item.metadata.userId,
      courseId: item.metadata.courseId,
      chapterId: item.metadata.chapterId,
      sectionId: item.metadata.sectionId,
      contentHash: hashContent(item.content),
      tags: item.metadata.tags ?? [],
      customMetadata: { content: item.content },
    } as EmbeddingMetadata,
  }));

  try {
    const embeddings = await vectorStore.insertBatch(batchItems);
    logger.info('[VectorSearch] Batch indexed', { count: embeddings.length });
    return embeddings.map((e) => e.id);
  } catch (error) {
    logger.error('[VectorSearch] Batch index failed', { error, count: items.length });
    throw error;
  }
}

/**
 * Remove indexed content
 */
export async function removeIndexedContent(embeddingId: string): Promise<boolean> {
  const vectorStore = await getAgenticVectorStore();

  try {
    const result = await vectorStore.delete(embeddingId);
    logger.debug('[VectorSearch] Content removed', { id: embeddingId, success: result });
    return result;
  } catch (error) {
    logger.error('[VectorSearch] Remove failed', { error, id: embeddingId });
    return false;
  }
}

/**
 * Remove indexed content by source
 */
export async function removeIndexedContentBySource(
  sourceType: EmbeddingSourceType,
  sourceId: string
): Promise<number> {
  const vectorStore = await getAgenticVectorStore();

  try {
    const count = await vectorStore.deleteByFilter({
      sourceTypes: [sourceType],
      customFilters: { sourceId },
    });
    logger.debug('[VectorSearch] Content removed by source', {
      sourceType,
      sourceId,
      count,
    });
    return count;
  } catch (error) {
    logger.error('[VectorSearch] Remove by source failed', { error, sourceType, sourceId });
    return 0;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapSearchResults(results: SimilarityResult[]): VectorSearchResult[] {
  return results.map((r) => ({
    id: r.embedding.id,
    content: (r.embedding.metadata.customMetadata?.content as string | undefined)
      ?? r.embedding.metadata.sourceId,
    score: r.score,
    sourceType: r.embedding.metadata.sourceType,
    sourceId: r.embedding.metadata.sourceId,
    courseId: r.embedding.metadata.courseId,
    chapterId: r.embedding.metadata.chapterId,
    sectionId: r.embedding.metadata.sectionId,
    tags: r.embedding.metadata.tags,
  }));
}

function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  type VectorStore,
  type VectorSearchOptions,
  type SimilarityResult,
  type VectorEmbedding,
  type EmbeddingMetadata,
  type EmbeddingSourceType,
};
