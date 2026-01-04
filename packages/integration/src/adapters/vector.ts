/**
 * @sam-ai/integration - Vector Store Adapter Interface
 * Abstract vector database operations for portability
 */

import { z } from 'zod';

// ============================================================================
// VECTOR TYPES
// ============================================================================

/**
 * Vector embedding with metadata
 */
export interface VectorDocument {
  id: string;
  content: string;
  vector: number[];
  metadata: VectorMetadata;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Metadata for vector documents
 */
export interface VectorMetadata {
  sourceType: string;
  sourceId: string;
  userId?: string;
  courseId?: string;
  chapterId?: string;
  sectionId?: string;
  tags: string[];
  language?: string;
  contentHash?: string;
  custom?: Record<string, unknown>;
}

/**
 * Search result with similarity score
 */
export interface VectorSearchResult {
  document: VectorDocument;
  score: number;
  distance: number;
}

/**
 * Search filters
 */
export interface VectorSearchFilter {
  sourceTypes?: string[];
  userIds?: string[];
  courseIds?: string[];
  chapterIds?: string[];
  sectionIds?: string[];
  tags?: string[];
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  custom?: Record<string, unknown>;
}

/**
 * Search options
 */
export interface VectorSearchOptions {
  topK: number;
  minScore?: number;
  maxDistance?: number;
  filter?: VectorSearchFilter;
  includeMetadata?: boolean;
  includeVectors?: boolean;
  rerank?: boolean;
}

/**
 * Upsert input
 */
export interface VectorUpsertInput {
  id?: string;
  content: string;
  vector?: number[]; // If not provided, will be generated
  metadata: Omit<VectorMetadata, 'contentHash'>;
}

/**
 * Batch upsert result
 */
export interface BatchUpsertResult {
  successful: string[];
  failed: Array<{ id?: string; error: string }>;
  totalProcessed: number;
}

// ============================================================================
// VECTOR ADAPTER INTERFACE
// ============================================================================

/**
 * Vector store adapter interface
 * Abstracts away the specific vector database implementation
 */
export interface VectorAdapter {
  /**
   * Get adapter name/type
   */
  getName(): string;

  /**
   * Get vector dimensions
   */
  getDimensions(): number;

  /**
   * Check if connected
   */
  isConnected(): Promise<boolean>;

  /**
   * Connect to vector store
   */
  connect(): Promise<void>;

  /**
   * Disconnect from vector store
   */
  disconnect(): Promise<void>;

  /**
   * Health check
   */
  healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }>;

  // -------------------------------------------------------------------------
  // CRUD Operations
  // -------------------------------------------------------------------------

  /**
   * Insert a single document
   */
  insert(input: VectorUpsertInput): Promise<VectorDocument>;

  /**
   * Insert multiple documents
   */
  insertBatch(inputs: VectorUpsertInput[]): Promise<BatchUpsertResult>;

  /**
   * Upsert a single document (insert or update)
   */
  upsert(input: VectorUpsertInput & { id: string }): Promise<VectorDocument>;

  /**
   * Upsert multiple documents
   */
  upsertBatch(inputs: Array<VectorUpsertInput & { id: string }>): Promise<BatchUpsertResult>;

  /**
   * Get document by ID
   */
  get(id: string): Promise<VectorDocument | null>;

  /**
   * Get multiple documents by IDs
   */
  getMany(ids: string[]): Promise<VectorDocument[]>;

  /**
   * Update document metadata
   */
  updateMetadata(id: string, metadata: Partial<VectorMetadata>): Promise<VectorDocument>;

  /**
   * Delete document by ID
   */
  delete(id: string): Promise<boolean>;

  /**
   * Delete multiple documents
   */
  deleteBatch(ids: string[]): Promise<number>;

  /**
   * Delete by filter
   */
  deleteByFilter(filter: VectorSearchFilter): Promise<number>;

  // -------------------------------------------------------------------------
  // Search Operations
  // -------------------------------------------------------------------------

  /**
   * Search by text query (will embed the query)
   */
  search(query: string, options: VectorSearchOptions): Promise<VectorSearchResult[]>;

  /**
   * Search by vector
   */
  searchByVector(vector: number[], options: VectorSearchOptions): Promise<VectorSearchResult[]>;

  /**
   * Hybrid search (combines vector and keyword search)
   */
  hybridSearch?(
    query: string,
    options: VectorSearchOptions & { alpha?: number }
  ): Promise<VectorSearchResult[]>;

  // -------------------------------------------------------------------------
  // Utility Operations
  // -------------------------------------------------------------------------

  /**
   * Count documents matching filter
   */
  count(filter?: VectorSearchFilter): Promise<number>;

  /**
   * List all document IDs (paginated)
   */
  listIds(options?: { limit?: number; offset?: number; filter?: VectorSearchFilter }): Promise<string[]>;

  /**
   * Get statistics about the index
   */
  getStats(): Promise<VectorIndexStats>;

  /**
   * Create index (if applicable)
   */
  createIndex?(options?: VectorIndexOptions): Promise<void>;

  /**
   * Delete index
   */
  deleteIndex?(): Promise<void>;
}

/**
 * Index statistics
 */
export interface VectorIndexStats {
  totalDocuments: number;
  dimensions: number;
  indexSize?: number; // bytes
  lastUpdated?: Date;
  isReady: boolean;
}

/**
 * Index creation options
 */
export interface VectorIndexOptions {
  name?: string;
  dimensions: number;
  metric: 'cosine' | 'euclidean' | 'dotProduct';
  replicas?: number;
  pods?: number;
}

// ============================================================================
// EMBEDDING PROVIDER INTERFACE
// ============================================================================

/**
 * Embedding provider interface
 * Generates vector embeddings from text
 */
export interface EmbeddingAdapter {
  /**
   * Get provider name
   */
  getName(): string;

  /**
   * Get model name
   */
  getModelName(): string;

  /**
   * Get embedding dimensions
   */
  getDimensions(): number;

  /**
   * Generate embedding for single text
   */
  embed(text: string): Promise<number[]>;

  /**
   * Generate embeddings for multiple texts
   */
  embedBatch(texts: string[]): Promise<number[][]>;

  /**
   * Get usage/token count for text
   */
  getTokenCount?(text: string): number;
}

// ============================================================================
// COMBINED VECTOR SERVICE
// ============================================================================

/**
 * Combined vector service that wraps adapter + embedding
 */
export interface VectorService {
  /**
   * Get vector adapter
   */
  getAdapter(): VectorAdapter;

  /**
   * Get embedding provider
   */
  getEmbeddingProvider(): EmbeddingAdapter;

  /**
   * Insert with auto-embedding
   */
  insertWithEmbedding(
    content: string,
    metadata: Omit<VectorMetadata, 'contentHash'>
  ): Promise<VectorDocument>;

  /**
   * Batch insert with auto-embedding
   */
  insertBatchWithEmbedding(
    items: Array<{ content: string; metadata: Omit<VectorMetadata, 'contentHash'> }>
  ): Promise<BatchUpsertResult>;

  /**
   * Search with auto-embedding of query
   */
  semanticSearch(query: string, options: VectorSearchOptions): Promise<VectorSearchResult[]>;
}

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const VectorMetadataSchema = z.object({
  sourceType: z.string().min(1),
  sourceId: z.string().min(1),
  userId: z.string().optional(),
  courseId: z.string().optional(),
  chapterId: z.string().optional(),
  sectionId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  language: z.string().optional(),
  contentHash: z.string().optional(),
  custom: z.record(z.unknown()).optional(),
});

export const VectorSearchFilterSchema = z.object({
  sourceTypes: z.array(z.string()).optional(),
  userIds: z.array(z.string()).optional(),
  courseIds: z.array(z.string()).optional(),
  chapterIds: z.array(z.string()).optional(),
  sectionIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  dateRange: z
    .object({
      start: z.date().optional(),
      end: z.date().optional(),
    })
    .optional(),
  custom: z.record(z.unknown()).optional(),
});

export const VectorSearchOptionsSchema = z.object({
  topK: z.number().min(1).max(100).default(10),
  minScore: z.number().min(0).max(1).optional(),
  maxDistance: z.number().min(0).optional(),
  filter: VectorSearchFilterSchema.optional(),
  includeMetadata: z.boolean().default(true),
  includeVectors: z.boolean().default(false),
  rerank: z.boolean().default(false),
});

export const VectorUpsertInputSchema = z.object({
  id: z.string().optional(),
  content: z.string().min(1),
  vector: z.array(z.number()).optional(),
  metadata: VectorMetadataSchema.omit({ contentHash: true }),
});
