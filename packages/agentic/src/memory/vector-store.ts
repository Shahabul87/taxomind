/**
 * @sam-ai/agentic - VectorStore
 * Vector embeddings storage and similarity search
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  VectorStoreInterface,
  VectorEmbedding,
  EmbeddingMetadata,
  SimilarityResult,
  VectorSearchOptions,
  VectorFilter,
  EmbeddingProvider,
  MemoryLogger,
} from './types';

// Re-export SimilarityResult type for consumers
export type { SimilarityResult } from './types';

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface VectorStoreConfig {
  embeddingProvider: EmbeddingProvider;
  persistenceAdapter?: VectorPersistenceAdapter;
  logger?: MemoryLogger;
  cacheEnabled?: boolean;
  cacheMaxSize?: number;
  cacheTTLSeconds?: number;
}

/**
 * Persistence adapter for vector storage
 */
export interface VectorPersistenceAdapter {
  save(embedding: VectorEmbedding): Promise<void>;
  saveBatch(embeddings: VectorEmbedding[]): Promise<void>;
  load(id: string): Promise<VectorEmbedding | null>;
  loadAll(filter?: VectorFilter): Promise<VectorEmbedding[]>;
  delete(id: string): Promise<boolean>;
  deleteBatch(ids: string[]): Promise<number>;
  deleteByFilter(filter: VectorFilter): Promise<number>;
  update(id: string, updates: Partial<VectorEmbedding>): Promise<VectorEmbedding | null>;
  count(filter?: VectorFilter): Promise<number>;
}

// ============================================================================
// IN-MEMORY PERSISTENCE ADAPTER
// ============================================================================

export class InMemoryVectorAdapter implements VectorPersistenceAdapter {
  private embeddings: Map<string, VectorEmbedding> = new Map();

  async save(embedding: VectorEmbedding): Promise<void> {
    this.embeddings.set(embedding.id, embedding);
  }

  async saveBatch(embeddings: VectorEmbedding[]): Promise<void> {
    for (const embedding of embeddings) {
      this.embeddings.set(embedding.id, embedding);
    }
  }

  async load(id: string): Promise<VectorEmbedding | null> {
    return this.embeddings.get(id) ?? null;
  }

  async loadAll(filter?: VectorFilter): Promise<VectorEmbedding[]> {
    let results = Array.from(this.embeddings.values());

    if (filter) {
      results = this.applyFilter(results, filter);
    }

    return results;
  }

  async delete(id: string): Promise<boolean> {
    return this.embeddings.delete(id);
  }

  async deleteBatch(ids: string[]): Promise<number> {
    let count = 0;
    for (const id of ids) {
      if (this.embeddings.delete(id)) {
        count++;
      }
    }
    return count;
  }

  async deleteByFilter(filter: VectorFilter): Promise<number> {
    const all = Array.from(this.embeddings.values());
    const toDelete = this.applyFilter(all, filter);
    let count = 0;

    for (const embedding of toDelete) {
      if (this.embeddings.delete(embedding.id)) {
        count++;
      }
    }

    return count;
  }

  async update(
    id: string,
    updates: Partial<VectorEmbedding>
  ): Promise<VectorEmbedding | null> {
    const existing = this.embeddings.get(id);
    if (!existing) return null;

    const updated: VectorEmbedding = {
      ...existing,
      ...updates,
      id: existing.id, // Preserve ID
      updatedAt: new Date(),
    };

    this.embeddings.set(id, updated);
    return updated;
  }

  async count(filter?: VectorFilter): Promise<number> {
    if (!filter) return this.embeddings.size;
    return this.applyFilter(Array.from(this.embeddings.values()), filter).length;
  }

  private applyFilter(
    embeddings: VectorEmbedding[],
    filter: VectorFilter
  ): VectorEmbedding[] {
    return embeddings.filter((e) => {
      if (filter.sourceTypes?.length) {
        if (!filter.sourceTypes.includes(e.metadata.sourceType)) return false;
      }

      if (filter.userIds?.length) {
        if (!e.metadata.userId || !filter.userIds.includes(e.metadata.userId))
          return false;
      }

      if (filter.courseIds?.length) {
        if (!e.metadata.courseId || !filter.courseIds.includes(e.metadata.courseId))
          return false;
      }

      if (filter.tags?.length) {
        const hasTag = filter.tags.some((tag) => e.metadata.tags.includes(tag));
        if (!hasTag) return false;
      }

      if (filter.dateRange) {
        if (filter.dateRange.start && e.createdAt < filter.dateRange.start)
          return false;
        if (filter.dateRange.end && e.createdAt > filter.dateRange.end)
          return false;
      }

      return true;
    });
  }

  // Utility method for testing
  clear(): void {
    this.embeddings.clear();
  }
}

// ============================================================================
// VECTOR CACHE
// ============================================================================

interface CacheEntry {
  embedding: VectorEmbedding;
  expiresAt: number;
}

class VectorCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly maxSize: number;
  private readonly ttlMs: number;

  constructor(maxSize: number = 1000, ttlSeconds: number = 300) {
    this.maxSize = maxSize;
    this.ttlMs = ttlSeconds * 1000;
  }

  set(embedding: VectorEmbedding): void {
    // Evict expired entries
    this.evictExpired();

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(embedding.id, {
      embedding,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  get(id: string): VectorEmbedding | null {
    const entry = this.cache.get(id);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(id);
      return null;
    }

    return entry.embedding;
  }

  delete(id: string): boolean {
    return this.cache.delete(id);
  }

  clear(): void {
    this.cache.clear();
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// ============================================================================
// SIMILARITY CALCULATIONS
// ============================================================================

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimensions');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

/**
 * Calculate Euclidean distance between two vectors
 */
export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimensions');
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

// ============================================================================
// VECTOR STORE IMPLEMENTATION
// ============================================================================

export class VectorStore implements VectorStoreInterface {
  private readonly embeddingProvider: EmbeddingProvider;
  private readonly adapter: VectorPersistenceAdapter;
  private readonly logger: MemoryLogger;
  private readonly cache: VectorCache | null;

  constructor(config: VectorStoreConfig) {
    this.embeddingProvider = config.embeddingProvider;
    this.adapter = config.persistenceAdapter ?? new InMemoryVectorAdapter();
    this.logger = config.logger ?? console;

    if (config.cacheEnabled !== false) {
      this.cache = new VectorCache(
        config.cacheMaxSize ?? 1000,
        config.cacheTTLSeconds ?? 300
      );
    } else {
      this.cache = null;
    }
  }

  /**
   * Generate content hash for deduplication
   */
  private generateContentHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  async insert(content: string, metadata: EmbeddingMetadata): Promise<VectorEmbedding> {
    this.logger.debug('Inserting embedding', { sourceType: metadata.sourceType });

    const vector = await this.embeddingProvider.embed(content);

    const embedding: VectorEmbedding = {
      id: uuidv4(),
      vector,
      dimensions: vector.length,
      metadata: {
        ...metadata,
        contentHash: metadata.contentHash || this.generateContentHash(content),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.adapter.save(embedding);
    this.cache?.set(embedding);

    this.logger.info('Embedding inserted', { id: embedding.id });
    return embedding;
  }

  async insertBatch(
    items: Array<{ content: string; metadata: EmbeddingMetadata }>
  ): Promise<VectorEmbedding[]> {
    this.logger.debug('Batch inserting embeddings', { count: items.length });

    const contents = items.map((item) => item.content);
    const vectors = await this.embeddingProvider.embedBatch(contents);

    const embeddings: VectorEmbedding[] = items.map((item, index) => ({
      id: uuidv4(),
      vector: vectors[index],
      dimensions: vectors[index].length,
      metadata: {
        ...item.metadata,
        contentHash:
          item.metadata.contentHash || this.generateContentHash(item.content),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await this.adapter.saveBatch(embeddings);

    for (const embedding of embeddings) {
      this.cache?.set(embedding);
    }

    this.logger.info('Batch embeddings inserted', { count: embeddings.length });
    return embeddings;
  }

  async search(
    query: string,
    options: VectorSearchOptions
  ): Promise<SimilarityResult[]> {
    this.logger.debug('Searching embeddings', { topK: options.topK });

    const queryVector = await this.embeddingProvider.embed(query);
    return this.searchByVector(queryVector, options);
  }

  async searchByVector(
    vector: number[],
    options: VectorSearchOptions
  ): Promise<SimilarityResult[]> {
    const allEmbeddings = await this.adapter.loadAll(options.filter);

    const results: SimilarityResult[] = [];

    for (const embedding of allEmbeddings) {
      if (embedding.vector.length !== vector.length) {
        this.logger.warn('Dimension mismatch', {
          expected: vector.length,
          actual: embedding.vector.length,
        });
        continue;
      }

      const score = cosineSimilarity(vector, embedding.vector);
      const distance = euclideanDistance(vector, embedding.vector);

      // Apply score filter
      if (options.minScore !== undefined && score < options.minScore) {
        continue;
      }

      // Apply distance filter
      if (options.maxDistance !== undefined && distance > options.maxDistance) {
        continue;
      }

      results.push({
        embedding: options.includeMetadata !== false ? embedding : {
          ...embedding,
          vector: [], // Omit vector for performance
        },
        score,
        distance,
      });
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Return top K
    return results.slice(0, options.topK);
  }

  async get(id: string): Promise<VectorEmbedding | null> {
    // Check cache first
    const cached = this.cache?.get(id);
    if (cached) return cached;

    const embedding = await this.adapter.load(id);
    if (embedding) {
      this.cache?.set(embedding);
    }

    return embedding;
  }

  async delete(id: string): Promise<boolean> {
    this.cache?.delete(id);
    return this.adapter.delete(id);
  }

  async deleteBatch(ids: string[]): Promise<number> {
    for (const id of ids) {
      this.cache?.delete(id);
    }
    return this.adapter.deleteBatch(ids);
  }

  async deleteByFilter(filter: VectorFilter): Promise<number> {
    // Clear cache since we don't know which entries match
    this.cache?.clear();
    return this.adapter.deleteByFilter(filter);
  }

  async update(
    id: string,
    metadata: Partial<EmbeddingMetadata>
  ): Promise<VectorEmbedding> {
    const existing = await this.get(id);
    if (!existing) {
      throw new Error(`Embedding not found: ${id}`);
    }

    const updated = await this.adapter.update(id, {
      metadata: { ...existing.metadata, ...metadata },
    });

    if (!updated) {
      throw new Error(`Failed to update embedding: ${id}`);
    }

    this.cache?.set(updated);
    return updated;
  }

  async count(filter?: VectorFilter): Promise<number> {
    return this.adapter.count(filter);
  }

  /**
   * Get statistics about the vector store
   */
  async getStats(): Promise<VectorStoreStats> {
    const total = await this.count();
    const allEmbeddings = await this.adapter.loadAll();

    const bySourceType = new Map<string, number>();
    const byCourse = new Map<string, number>();
    let totalDimensions = 0;

    for (const embedding of allEmbeddings) {
      const sourceType = embedding.metadata.sourceType;
      bySourceType.set(sourceType, (bySourceType.get(sourceType) ?? 0) + 1);

      if (embedding.metadata.courseId) {
        const courseId = embedding.metadata.courseId;
        byCourse.set(courseId, (byCourse.get(courseId) ?? 0) + 1);
      }

      totalDimensions = embedding.dimensions;
    }

    return {
      totalEmbeddings: total,
      dimensions: totalDimensions,
      bySourceType: Object.fromEntries(bySourceType),
      byCourse: Object.fromEntries(byCourse),
      modelName: this.embeddingProvider.getModelName(),
    };
  }
}

export interface VectorStoreStats {
  totalEmbeddings: number;
  dimensions: number;
  bySourceType: Record<string, number>;
  byCourse: Record<string, number>;
  modelName: string;
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createVectorStore(config: VectorStoreConfig): VectorStore {
  return new VectorStore(config);
}

// ============================================================================
// MOCK EMBEDDING PROVIDER FOR TESTING
// ============================================================================

export class MockEmbeddingProvider implements EmbeddingProvider {
  private readonly dimensions: number;
  private readonly modelName: string;

  constructor(dimensions: number = 384, modelName: string = 'mock-embeddings') {
    this.dimensions = dimensions;
    this.modelName = modelName;
  }

  async embed(text: string): Promise<number[]> {
    // Generate deterministic embedding based on text
    const vector: number[] = [];
    for (let i = 0; i < this.dimensions; i++) {
      const charCode = text.charCodeAt(i % text.length) || 0;
      vector.push(Math.sin(charCode * (i + 1)) * 0.5 + 0.5);
    }
    return this.normalize(vector);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((text) => this.embed(text)));
  }

  getDimensions(): number {
    return this.dimensions;
  }

  getModelName(): string {
    return this.modelName;
  }

  private normalize(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (magnitude === 0) return vector;
    return vector.map((v) => v / magnitude);
  }
}
