/**
 * @sam-ai/adapter-taxomind - SAM Vector Embedding Adapter
 * Implements VectorAdapter using the SAMVectorEmbedding Prisma model.
 */
import type { PrismaClient } from '@prisma/client';
import type { VectorAdapter, EmbeddingAdapter, VectorDocument, VectorSearchResult, VectorSearchOptions, VectorSearchFilter, VectorUpsertInput, VectorMetadata, BatchUpsertResult } from '@sam-ai/integration';
import { TaxomindVectorService } from './pgvector-adapter';
export declare class SAMVectorEmbeddingAdapter implements VectorAdapter {
    private prisma;
    private connected;
    private dimensions;
    private embeddingProvider?;
    constructor(prisma: PrismaClient, options?: {
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
    private buildWhere;
    private buildMetadata;
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
    getStats(): Promise<{
        totalDocuments: number;
        dimensions: number;
        indexSize?: number;
        lastUpdated?: Date;
        isReady: boolean;
    }>;
}
export declare function createSAMVectorEmbeddingAdapter(prisma: PrismaClient, options?: {
    dimensions?: number;
    embeddingProvider?: EmbeddingAdapter;
}): SAMVectorEmbeddingAdapter;
export declare function createTaxomindSAMVectorService(prisma: PrismaClient, options?: {
    openaiApiKey?: string;
    embeddingModel?: string;
    dimensions?: number;
    preferredProvider?: 'openai' | 'deepseek';
}): TaxomindVectorService;
//# sourceMappingURL=sam-vector-embedding-adapter.d.ts.map