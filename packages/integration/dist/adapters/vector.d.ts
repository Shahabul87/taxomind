/**
 * @sam-ai/integration - Vector Store Adapter Interface
 * Abstract vector database operations for portability
 */
import { z } from 'zod';
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
    vector?: number[];
    metadata: Omit<VectorMetadata, 'contentHash'>;
}
/**
 * Batch upsert result
 */
export interface BatchUpsertResult {
    successful: string[];
    failed: Array<{
        id?: string;
        error: string;
    }>;
    totalProcessed: number;
}
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
    healthCheck(): Promise<{
        healthy: boolean;
        latencyMs: number;
        error?: string;
    }>;
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
    upsert(input: VectorUpsertInput & {
        id: string;
    }): Promise<VectorDocument>;
    /**
     * Upsert multiple documents
     */
    upsertBatch(inputs: Array<VectorUpsertInput & {
        id: string;
    }>): Promise<BatchUpsertResult>;
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
    hybridSearch?(query: string, options: VectorSearchOptions & {
        alpha?: number;
    }): Promise<VectorSearchResult[]>;
    /**
     * Count documents matching filter
     */
    count(filter?: VectorSearchFilter): Promise<number>;
    /**
     * List all document IDs (paginated)
     */
    listIds(options?: {
        limit?: number;
        offset?: number;
        filter?: VectorSearchFilter;
    }): Promise<string[]>;
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
    indexSize?: number;
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
    insertWithEmbedding(content: string, metadata: Omit<VectorMetadata, 'contentHash'>): Promise<VectorDocument>;
    /**
     * Batch insert with auto-embedding
     */
    insertBatchWithEmbedding(items: Array<{
        content: string;
        metadata: Omit<VectorMetadata, 'contentHash'>;
    }>): Promise<BatchUpsertResult>;
    /**
     * Search with auto-embedding of query
     */
    semanticSearch(query: string, options: VectorSearchOptions): Promise<VectorSearchResult[]>;
}
export declare const VectorMetadataSchema: z.ZodObject<{
    sourceType: z.ZodString;
    sourceId: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    courseId: z.ZodOptional<z.ZodString>;
    chapterId: z.ZodOptional<z.ZodString>;
    sectionId: z.ZodOptional<z.ZodString>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    language: z.ZodOptional<z.ZodString>;
    contentHash: z.ZodOptional<z.ZodString>;
    custom: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    sourceType: string;
    sourceId: string;
    tags: string[];
    custom?: Record<string, unknown> | undefined;
    userId?: string | undefined;
    contentHash?: string | undefined;
    courseId?: string | undefined;
    chapterId?: string | undefined;
    sectionId?: string | undefined;
    language?: string | undefined;
}, {
    sourceType: string;
    sourceId: string;
    custom?: Record<string, unknown> | undefined;
    userId?: string | undefined;
    contentHash?: string | undefined;
    courseId?: string | undefined;
    chapterId?: string | undefined;
    sectionId?: string | undefined;
    tags?: string[] | undefined;
    language?: string | undefined;
}>;
export declare const VectorSearchFilterSchema: z.ZodObject<{
    sourceTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    userIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    courseIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    chapterIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    sectionIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    dateRange: z.ZodOptional<z.ZodObject<{
        start: z.ZodOptional<z.ZodDate>;
        end: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        start?: Date | undefined;
        end?: Date | undefined;
    }, {
        start?: Date | undefined;
        end?: Date | undefined;
    }>>;
    custom: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    custom?: Record<string, unknown> | undefined;
    tags?: string[] | undefined;
    sourceTypes?: string[] | undefined;
    userIds?: string[] | undefined;
    courseIds?: string[] | undefined;
    chapterIds?: string[] | undefined;
    sectionIds?: string[] | undefined;
    dateRange?: {
        start?: Date | undefined;
        end?: Date | undefined;
    } | undefined;
}, {
    custom?: Record<string, unknown> | undefined;
    tags?: string[] | undefined;
    sourceTypes?: string[] | undefined;
    userIds?: string[] | undefined;
    courseIds?: string[] | undefined;
    chapterIds?: string[] | undefined;
    sectionIds?: string[] | undefined;
    dateRange?: {
        start?: Date | undefined;
        end?: Date | undefined;
    } | undefined;
}>;
export declare const VectorSearchOptionsSchema: z.ZodObject<{
    topK: z.ZodDefault<z.ZodNumber>;
    minScore: z.ZodOptional<z.ZodNumber>;
    maxDistance: z.ZodOptional<z.ZodNumber>;
    filter: z.ZodOptional<z.ZodObject<{
        sourceTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        userIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        courseIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        chapterIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        sectionIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        dateRange: z.ZodOptional<z.ZodObject<{
            start: z.ZodOptional<z.ZodDate>;
            end: z.ZodOptional<z.ZodDate>;
        }, "strip", z.ZodTypeAny, {
            start?: Date | undefined;
            end?: Date | undefined;
        }, {
            start?: Date | undefined;
            end?: Date | undefined;
        }>>;
        custom: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        custom?: Record<string, unknown> | undefined;
        tags?: string[] | undefined;
        sourceTypes?: string[] | undefined;
        userIds?: string[] | undefined;
        courseIds?: string[] | undefined;
        chapterIds?: string[] | undefined;
        sectionIds?: string[] | undefined;
        dateRange?: {
            start?: Date | undefined;
            end?: Date | undefined;
        } | undefined;
    }, {
        custom?: Record<string, unknown> | undefined;
        tags?: string[] | undefined;
        sourceTypes?: string[] | undefined;
        userIds?: string[] | undefined;
        courseIds?: string[] | undefined;
        chapterIds?: string[] | undefined;
        sectionIds?: string[] | undefined;
        dateRange?: {
            start?: Date | undefined;
            end?: Date | undefined;
        } | undefined;
    }>>;
    includeMetadata: z.ZodDefault<z.ZodBoolean>;
    includeVectors: z.ZodDefault<z.ZodBoolean>;
    rerank: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    topK: number;
    includeMetadata: boolean;
    includeVectors: boolean;
    rerank: boolean;
    filter?: {
        custom?: Record<string, unknown> | undefined;
        tags?: string[] | undefined;
        sourceTypes?: string[] | undefined;
        userIds?: string[] | undefined;
        courseIds?: string[] | undefined;
        chapterIds?: string[] | undefined;
        sectionIds?: string[] | undefined;
        dateRange?: {
            start?: Date | undefined;
            end?: Date | undefined;
        } | undefined;
    } | undefined;
    minScore?: number | undefined;
    maxDistance?: number | undefined;
}, {
    filter?: {
        custom?: Record<string, unknown> | undefined;
        tags?: string[] | undefined;
        sourceTypes?: string[] | undefined;
        userIds?: string[] | undefined;
        courseIds?: string[] | undefined;
        chapterIds?: string[] | undefined;
        sectionIds?: string[] | undefined;
        dateRange?: {
            start?: Date | undefined;
            end?: Date | undefined;
        } | undefined;
    } | undefined;
    topK?: number | undefined;
    minScore?: number | undefined;
    maxDistance?: number | undefined;
    includeMetadata?: boolean | undefined;
    includeVectors?: boolean | undefined;
    rerank?: boolean | undefined;
}>;
export declare const VectorUpsertInputSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    content: z.ZodString;
    vector: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    metadata: z.ZodObject<Omit<{
        sourceType: z.ZodString;
        sourceId: z.ZodString;
        userId: z.ZodOptional<z.ZodString>;
        courseId: z.ZodOptional<z.ZodString>;
        chapterId: z.ZodOptional<z.ZodString>;
        sectionId: z.ZodOptional<z.ZodString>;
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        language: z.ZodOptional<z.ZodString>;
        contentHash: z.ZodOptional<z.ZodString>;
        custom: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "contentHash">, "strip", z.ZodTypeAny, {
        sourceType: string;
        sourceId: string;
        tags: string[];
        custom?: Record<string, unknown> | undefined;
        userId?: string | undefined;
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        language?: string | undefined;
    }, {
        sourceType: string;
        sourceId: string;
        custom?: Record<string, unknown> | undefined;
        userId?: string | undefined;
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        tags?: string[] | undefined;
        language?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    metadata: {
        sourceType: string;
        sourceId: string;
        tags: string[];
        custom?: Record<string, unknown> | undefined;
        userId?: string | undefined;
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        language?: string | undefined;
    };
    content: string;
    id?: string | undefined;
    vector?: number[] | undefined;
}, {
    metadata: {
        sourceType: string;
        sourceId: string;
        custom?: Record<string, unknown> | undefined;
        userId?: string | undefined;
        courseId?: string | undefined;
        chapterId?: string | undefined;
        sectionId?: string | undefined;
        tags?: string[] | undefined;
        language?: string | undefined;
    };
    content: string;
    id?: string | undefined;
    vector?: number[] | undefined;
}>;
//# sourceMappingURL=vector.d.ts.map