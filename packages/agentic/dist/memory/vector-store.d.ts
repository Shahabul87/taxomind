/**
 * @sam-ai/agentic - VectorStore
 * Vector embeddings storage and similarity search
 */
import type { VectorStoreInterface, VectorEmbedding, EmbeddingMetadata, SimilarityResult, VectorSearchOptions, VectorFilter, EmbeddingProvider, MemoryLogger } from './types';
export type { SimilarityResult } from './types';
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
    searchByVector?(vector: number[], options: VectorSearchOptions): Promise<SimilarityResult[]>;
    delete(id: string): Promise<boolean>;
    deleteBatch(ids: string[]): Promise<number>;
    deleteByFilter(filter: VectorFilter): Promise<number>;
    update(id: string, updates: Partial<VectorEmbedding>): Promise<VectorEmbedding | null>;
    count(filter?: VectorFilter): Promise<number>;
}
export declare class InMemoryVectorAdapter implements VectorPersistenceAdapter {
    private embeddings;
    save(embedding: VectorEmbedding): Promise<void>;
    saveBatch(embeddings: VectorEmbedding[]): Promise<void>;
    load(id: string): Promise<VectorEmbedding | null>;
    loadAll(filter?: VectorFilter): Promise<VectorEmbedding[]>;
    delete(id: string): Promise<boolean>;
    deleteBatch(ids: string[]): Promise<number>;
    deleteByFilter(filter: VectorFilter): Promise<number>;
    update(id: string, updates: Partial<VectorEmbedding>): Promise<VectorEmbedding | null>;
    count(filter?: VectorFilter): Promise<number>;
    private applyFilter;
    clear(): void;
}
/**
 * Calculate cosine similarity between two vectors
 */
export declare function cosineSimilarity(a: number[], b: number[]): number;
/**
 * Calculate Euclidean distance between two vectors
 */
export declare function euclideanDistance(a: number[], b: number[]): number;
export declare class VectorStore implements VectorStoreInterface {
    private readonly embeddingProvider;
    private readonly adapter;
    private readonly logger;
    private readonly cache;
    constructor(config: VectorStoreConfig);
    /**
     * Generate content hash for deduplication
     */
    private generateContentHash;
    insert(content: string, metadata: EmbeddingMetadata): Promise<VectorEmbedding>;
    insertBatch(items: Array<{
        content: string;
        metadata: EmbeddingMetadata;
    }>): Promise<VectorEmbedding[]>;
    search(query: string, options: VectorSearchOptions): Promise<SimilarityResult[]>;
    searchByVector(vector: number[], options: VectorSearchOptions): Promise<SimilarityResult[]>;
    get(id: string): Promise<VectorEmbedding | null>;
    delete(id: string): Promise<boolean>;
    deleteBatch(ids: string[]): Promise<number>;
    deleteByFilter(filter: VectorFilter): Promise<number>;
    update(id: string, metadata: Partial<EmbeddingMetadata>): Promise<VectorEmbedding>;
    count(filter?: VectorFilter): Promise<number>;
    /**
     * Get statistics about the vector store
     */
    getStats(): Promise<VectorStoreStats>;
}
export interface VectorStoreStats {
    totalEmbeddings: number;
    dimensions: number;
    bySourceType: Record<string, number>;
    byCourse: Record<string, number>;
    modelName: string;
}
export declare function createVectorStore(config: VectorStoreConfig): VectorStore;
export declare class MockEmbeddingProvider implements EmbeddingProvider {
    private readonly dimensions;
    private readonly modelName;
    constructor(dimensions?: number, modelName?: string);
    embed(text: string): Promise<number[]>;
    embedBatch(texts: string[]): Promise<number[][]>;
    getDimensions(): number;
    getModelName(): string;
    private normalize;
}
//# sourceMappingURL=vector-store.d.ts.map