/**
 * @sam-ai/adapter-taxomind - PgVector Adapter
 * Implements VectorAdapter using PostgreSQL with pgvector extension
 */
import type { PrismaClient } from '@prisma/client';
import type { VectorAdapter, EmbeddingAdapter, VectorService, VectorDocument, VectorSearchResult, VectorSearchOptions, VectorSearchFilter, VectorUpsertInput, VectorMetadata, VectorIndexStats, BatchUpsertResult, HealthStatus } from '@sam-ai/integration';
/**
 * OpenAI embedding adapter
 */
export declare class OpenAIEmbeddingAdapter implements EmbeddingAdapter {
    private client;
    private model;
    private _dimensions;
    private apiKey?;
    constructor(options?: {
        apiKey?: string;
        model?: string;
        dimensions?: number;
    });
    private getClient;
    isConfigured(): boolean;
    getName(): string;
    getModelName(): string;
    getDimensions(): number;
    embed(text: string): Promise<number[]>;
    embedBatch(texts: string[]): Promise<number[][]>;
    healthCheck(): Promise<HealthStatus>;
}
/**
 * DeepSeek/Hash-based embedding adapter
 * Uses hash-based embeddings as a fallback when no embedding API is available.
 * This provides deterministic embeddings that work without any API key.
 */
export declare class DeepSeekEmbeddingAdapter implements EmbeddingAdapter {
    private model;
    private _dimensions;
    constructor(options?: {
        apiKey?: string;
        model?: string;
        dimensions?: number;
    });
    getName(): string;
    getModelName(): string;
    getDimensions(): number;
    embed(text: string): Promise<number[]>;
    embedBatch(texts: string[]): Promise<number[][]>;
    /**
     * Generate a deterministic embedding from text using hash
     * This is a fallback when no embedding API is available
     */
    private generateHashEmbedding;
    healthCheck(): Promise<HealthStatus>;
}
/**
 * Create the best available embedding adapter based on configured API keys
 */
export declare function createEmbeddingAdapter(options?: {
    preferredProvider?: 'openai' | 'deepseek';
    dimensions?: number;
}): EmbeddingAdapter;
/**
 * PgVector-based vector database adapter
 */
export declare class PgVectorAdapter implements VectorAdapter {
    private prisma;
    private tableName;
    private embeddingColumn;
    private contentColumn;
    private connected;
    private dimensions;
    private embeddingProvider?;
    constructor(prisma: PrismaClient, tableName?: string, embeddingColumn?: string, contentColumn?: string, options?: {
        dimensions?: number;
        embeddingProvider?: EmbeddingAdapter;
    });
    getName(): string;
    getDimensions(): number;
    isConnected(): Promise<boolean>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    healthCheck(): Promise<{
        healthy: boolean;
        latencyMs: number;
        error?: string;
    }>;
    private getOrCreateVector;
    private createVectorDocument;
    insert(input: VectorUpsertInput): Promise<VectorDocument>;
    insertBatch(inputs: VectorUpsertInput[]): Promise<BatchUpsertResult>;
    upsert(input: VectorUpsertInput & {
        id: string;
    }): Promise<VectorDocument>;
    upsertBatch(inputs: Array<VectorUpsertInput & {
        id: string;
    }>): Promise<BatchUpsertResult>;
    get(id: string): Promise<VectorDocument | null>;
    getMany(ids: string[]): Promise<VectorDocument[]>;
    updateMetadata(id: string, metadata: Partial<VectorMetadata>): Promise<VectorDocument>;
    delete(id: string): Promise<boolean>;
    deleteBatch(ids: string[]): Promise<number>;
    deleteByFilter(filter: VectorSearchFilter): Promise<number>;
    search(query: string, options: VectorSearchOptions): Promise<VectorSearchResult[]>;
    searchByVector(vector: number[], options: VectorSearchOptions): Promise<VectorSearchResult[]>;
    count(filter?: VectorSearchFilter): Promise<number>;
    listIds(options?: {
        limit?: number;
        offset?: number;
        filter?: VectorSearchFilter;
    }): Promise<string[]>;
    getStats(): Promise<VectorIndexStats>;
    private buildFilterClause;
    private hashContent;
}
/**
 * Combined vector service with embeddings and storage
 */
export declare class TaxomindVectorService implements VectorService {
    private readonly embeddingAdapter;
    private readonly vectorAdapter;
    constructor(embeddingAdapter: EmbeddingAdapter, vectorAdapter: VectorAdapter);
    getAdapter(): VectorAdapter;
    getEmbeddingProvider(): EmbeddingAdapter;
    insertWithEmbedding(content: string, metadata: Omit<VectorMetadata, 'contentHash'>): Promise<VectorDocument>;
    insertBatchWithEmbedding(items: Array<{
        content: string;
        metadata: Omit<VectorMetadata, 'contentHash'>;
    }>): Promise<BatchUpsertResult>;
    semanticSearch(query: string, options: VectorSearchOptions): Promise<VectorSearchResult[]>;
}
/**
 * Create an OpenAI embedding adapter
 */
export declare function createOpenAIEmbeddingAdapter(options?: {
    apiKey?: string;
    model?: string;
    dimensions?: number;
}): OpenAIEmbeddingAdapter;
/**
 * Create a PgVector adapter
 */
export declare function createPgVectorAdapter(prisma: PrismaClient, options?: {
    tableName?: string;
    embeddingColumn?: string;
    contentColumn?: string;
}): PgVectorAdapter;
/**
 * Create a complete vector service
 * Uses factory to select best available embedding provider
 */
export declare function createTaxomindVectorService(prisma: PrismaClient, options?: {
    openaiApiKey?: string;
    embeddingModel?: string;
    tableName?: string;
    preferredProvider?: 'openai' | 'deepseek';
}): TaxomindVectorService;
//# sourceMappingURL=pgvector-adapter.d.ts.map