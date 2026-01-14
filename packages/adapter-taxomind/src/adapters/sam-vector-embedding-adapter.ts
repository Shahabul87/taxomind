/**
 * @sam-ai/adapter-taxomind - SAM Vector Embedding Adapter
 * Implements VectorAdapter using the SAMVectorEmbedding Prisma model.
 */

import type { PrismaClient, Prisma } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import type {
  VectorAdapter,
  EmbeddingAdapter,
  VectorDocument,
  VectorSearchResult,
  VectorSearchOptions,
  VectorSearchFilter,
  VectorUpsertInput,
  VectorMetadata,
  BatchUpsertResult,
} from '@sam-ai/integration';
import { OpenAIEmbeddingAdapter, createEmbeddingAdapter, TaxomindVectorService } from './pgvector-adapter';

// ============================================================================
// HELPERS
// ============================================================================

const DEFAULT_DIMENSIONS = 1536;

function hashContent(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return Number.POSITIVE_INFINITY;

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

function mapRecordToDocument(
  record: {
    id: string;
    contentText: string | null;
    embedding: unknown;
    dimensions: number;
    sourceId: string;
    sourceType: string;
    userId: string | null;
    courseId: string | null;
    chapterId: string | null;
    sectionId: string | null;
    contentHash: string;
    tags: string[];
    language: string | null;
    customMetadata: unknown;
    createdAt: Date;
    updatedAt: Date;
  },
  includeVector: boolean
): VectorDocument {
  const vector = Array.isArray(record.embedding) ? (record.embedding as number[]) : [];

  return {
    id: record.id,
    content: record.contentText ?? '',
    vector: includeVector ? vector : [],
    metadata: {
      sourceId: record.sourceId,
      sourceType: record.sourceType,
      userId: record.userId ?? undefined,
      courseId: record.courseId ?? undefined,
      chapterId: record.chapterId ?? undefined,
      sectionId: record.sectionId ?? undefined,
      tags: record.tags ?? [],
      language: record.language ?? undefined,
      contentHash: record.contentHash,
      custom: (record.customMetadata as Record<string, unknown> | null) ?? undefined,
    },
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function splitCustomFilter(
  filter?: VectorSearchFilter
): { entityId?: string; entityType?: string; custom: Record<string, unknown> } {
  const custom = (filter?.custom as Record<string, unknown> | undefined) ?? {};
  const entityId = typeof custom.entityId === 'string' ? custom.entityId : undefined;
  const entityType = typeof custom.entityType === 'string' ? custom.entityType : undefined;
  const stripped: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(custom)) {
    if (key === 'entityId' || key === 'entityType') continue;
    stripped[key] = value;
  }

  return { entityId, entityType, custom: stripped };
}

function matchesCustomMetadata(
  recordCustom: unknown,
  customFilter: Record<string, unknown>
): boolean {
  if (!customFilter || Object.keys(customFilter).length === 0) return true;

  const record = (recordCustom as Record<string, unknown> | null) ?? {};
  return Object.entries(customFilter).every(([key, value]) => record[key] === value);
}

// ============================================================================
// ADAPTER
// ============================================================================

export class SAMVectorEmbeddingAdapter implements VectorAdapter {
  private connected = true;
  private dimensions: number;
  private embeddingProvider?: EmbeddingAdapter;

  constructor(
    private prisma: PrismaClient,
    options?: {
      dimensions?: number;
      embeddingProvider?: EmbeddingAdapter;
    }
  ) {
    this.embeddingProvider = options?.embeddingProvider;
    this.dimensions =
      options?.dimensions ?? this.embeddingProvider?.getDimensions() ?? DEFAULT_DIMENSIONS;
  }

  getName(): string {
    return 'sam_vector_embedding';
  }

  getDimensions(): number {
    return this.dimensions;
  }

  async isConnected(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (error) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // -------------------------------------------------------------------------
  // CRUD Operations
  // -------------------------------------------------------------------------

  private async getOrCreateVector(content: string, existingVector?: number[]): Promise<number[]> {
    if (existingVector) {
      return existingVector;
    }
    if (this.embeddingProvider) {
      return this.embeddingProvider.embed(content);
    }
    throw new Error('No vector provided and no embedding provider configured');
  }

  private buildWhere(filter?: VectorSearchFilter): Record<string, unknown> {
    if (!filter) return {};

    const { entityId, entityType } = splitCustomFilter(filter);

    const where: Record<string, unknown> = {};

    if (filter.sourceTypes?.length) {
      where.sourceType = { in: filter.sourceTypes };
    }
    if (entityType) {
      where.sourceType = entityType;
    }
    if (entityId) {
      where.sourceId = entityId;
    }
    if (filter.userIds?.length) {
      where.userId = { in: filter.userIds };
    }
    if (filter.courseIds?.length) {
      where.courseId = { in: filter.courseIds };
    }
    if (filter.chapterIds?.length) {
      where.chapterId = { in: filter.chapterIds };
    }
    if (filter.sectionIds?.length) {
      where.sectionId = { in: filter.sectionIds };
    }
    if (filter.tags?.length) {
      where.tags = { hasSome: filter.tags };
    }
    if (filter.dateRange?.start || filter.dateRange?.end) {
      where.createdAt = {};
      if (filter.dateRange.start) {
        (where.createdAt as Record<string, unknown>).gte = filter.dateRange.start;
      }
      if (filter.dateRange.end) {
        (where.createdAt as Record<string, unknown>).lte = filter.dateRange.end;
      }
    }

    return where;
  }

  private buildMetadata(
    metadata: Omit<VectorMetadata, 'contentHash'>,
    contentHash: string
  ): VectorMetadata {
    return {
      ...metadata,
      contentHash,
      tags: metadata.tags ?? [],
    };
  }

  async insert(input: VectorUpsertInput): Promise<VectorDocument> {
    const id = input.id ?? randomUUID();
    const vector = await this.getOrCreateVector(input.content, input.vector);
    const contentHash = hashContent(input.content);
    const metadata = this.buildMetadata(input.metadata, contentHash);

    const record = await this.prisma.sAMVectorEmbedding.create({
      data: {
        id,
        sourceId: metadata.sourceId,
        sourceType: metadata.sourceType,
        userId: metadata.userId,
        courseId: metadata.courseId,
        chapterId: metadata.chapterId,
        sectionId: metadata.sectionId,
        contentHash,
        contentText: input.content,
        tags: metadata.tags ?? [],
        language: metadata.language,
        customMetadata: metadata.custom as Prisma.InputJsonValue | undefined,
        embedding: vector,
        dimensions: vector.length || this.dimensions,
      },
    });

    return mapRecordToDocument(record, true);
  }

  async insertBatch(inputs: VectorUpsertInput[]): Promise<BatchUpsertResult> {
    const successful: string[] = [];
    const failed: Array<{ id?: string; error: string }> = [];

    for (const input of inputs) {
      try {
        const doc = await this.insert(input);
        successful.push(doc.id);
      } catch (error) {
        failed.push({
          id: input.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { successful, failed, totalProcessed: inputs.length };
  }

  async upsert(input: VectorUpsertInput & { id: string }): Promise<VectorDocument> {
    const vector = await this.getOrCreateVector(input.content, input.vector);
    const contentHash = hashContent(input.content);
    const metadata = this.buildMetadata(input.metadata, contentHash);

    const record = await this.prisma.sAMVectorEmbedding.upsert({
      where: { id: input.id },
      create: {
        id: input.id,
        sourceId: metadata.sourceId,
        sourceType: metadata.sourceType,
        userId: metadata.userId,
        courseId: metadata.courseId,
        chapterId: metadata.chapterId,
        sectionId: metadata.sectionId,
        contentHash,
        contentText: input.content,
        tags: metadata.tags ?? [],
        language: metadata.language,
        customMetadata: metadata.custom as Prisma.InputJsonValue | undefined,
        embedding: vector,
        dimensions: vector.length || this.dimensions,
      },
      update: {
        sourceId: metadata.sourceId,
        sourceType: metadata.sourceType,
        userId: metadata.userId,
        courseId: metadata.courseId,
        chapterId: metadata.chapterId,
        sectionId: metadata.sectionId,
        contentHash,
        contentText: input.content,
        tags: metadata.tags ?? [],
        language: metadata.language,
        customMetadata: metadata.custom as Prisma.InputJsonValue | undefined,
        embedding: vector,
        dimensions: vector.length || this.dimensions,
      },
    });

    return mapRecordToDocument(record, true);
  }

  async upsertBatch(
    inputs: Array<VectorUpsertInput & { id: string }>
  ): Promise<BatchUpsertResult> {
    const successful: string[] = [];
    const failed: Array<{ id?: string; error: string }> = [];

    for (const input of inputs) {
      try {
        await this.upsert(input);
        successful.push(input.id);
      } catch (error) {
        failed.push({
          id: input.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { successful, failed, totalProcessed: inputs.length };
  }

  async get(id: string): Promise<VectorDocument | null> {
    const record = await this.prisma.sAMVectorEmbedding.findUnique({ where: { id } });
    if (!record) return null;
    return mapRecordToDocument(record, true);
  }

  async getMany(ids: string[]): Promise<VectorDocument[]> {
    if (ids.length === 0) return [];
    const records = await this.prisma.sAMVectorEmbedding.findMany({
      where: { id: { in: ids } },
    });
    return records.map((record) => mapRecordToDocument(record, true));
  }

  async updateMetadata(id: string, metadata: Partial<VectorMetadata>): Promise<VectorDocument> {
    const existing = await this.get(id);
    if (!existing) {
      throw new Error(`Document not found: ${id}`);
    }

    const mergedMetadata: VectorMetadata = {
      ...existing.metadata,
      ...metadata,
      tags: metadata.tags ?? existing.metadata.tags,
      custom: metadata.custom ?? existing.metadata.custom,
      contentHash: metadata.contentHash ?? existing.metadata.contentHash,
    };

    const record = await this.prisma.sAMVectorEmbedding.update({
      where: { id },
      data: {
        sourceId: mergedMetadata.sourceId,
        sourceType: mergedMetadata.sourceType,
        userId: mergedMetadata.userId,
        courseId: mergedMetadata.courseId,
        chapterId: mergedMetadata.chapterId,
        sectionId: mergedMetadata.sectionId,
        contentHash: mergedMetadata.contentHash,
        tags: mergedMetadata.tags ?? [],
        language: mergedMetadata.language,
        customMetadata: mergedMetadata.custom as Prisma.InputJsonValue | undefined,
      },
    });

    return mapRecordToDocument(record, true);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.sAMVectorEmbedding.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async deleteBatch(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const result = await this.prisma.sAMVectorEmbedding.deleteMany({
      where: { id: { in: ids } },
    });
    return result.count;
  }

  async deleteByFilter(filter: VectorSearchFilter): Promise<number> {
    const { custom } = splitCustomFilter(filter);
    const where = this.buildWhere(filter);

    if (!custom || Object.keys(custom).length === 0) {
      const result = await this.prisma.sAMVectorEmbedding.deleteMany({ where });
      return result.count;
    }

    const candidates = await this.prisma.sAMVectorEmbedding.findMany({
      where,
      select: { id: true, customMetadata: true },
    });

    const ids = candidates
      .filter((record) => matchesCustomMetadata(record.customMetadata, custom))
      .map((record) => record.id);

    if (ids.length === 0) return 0;

    const result = await this.prisma.sAMVectorEmbedding.deleteMany({
      where: { id: { in: ids } },
    });

    return result.count;
  }

  // -------------------------------------------------------------------------
  // Search Operations
  // -------------------------------------------------------------------------

  async search(query: string, options: VectorSearchOptions): Promise<VectorSearchResult[]> {
    if (!this.embeddingProvider) {
      throw new Error('No embedding provider configured for text search');
    }
    const vector = await this.embeddingProvider.embed(query);
    return this.searchByVector(vector, options);
  }

  async searchByVector(
    vector: number[],
    options: VectorSearchOptions
  ): Promise<VectorSearchResult[]> {
    const where = this.buildWhere(options.filter);
    const { custom } = splitCustomFilter(options.filter);

    const records = await this.prisma.sAMVectorEmbedding.findMany({ where });
    const includeVectors = options.includeVectors ?? false;

    const results: VectorSearchResult[] = records
      .filter((record) => matchesCustomMetadata(record.customMetadata, custom))
      .map((record) => {
        const embedding = Array.isArray(record.embedding) ? (record.embedding as number[]) : [];
        const score = cosineSimilarity(vector, embedding);
        const distance = euclideanDistance(vector, embedding);

        return {
          document: mapRecordToDocument(record, includeVectors),
          score,
          distance,
        };
      })
      .filter((result) => {
        if (options.minScore !== undefined && result.score < options.minScore) return false;
        if (options.maxDistance !== undefined && result.distance > options.maxDistance) return false;
        return true;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, options.topK);

    return results;
  }

  // -------------------------------------------------------------------------
  // Utility Operations
  // -------------------------------------------------------------------------

  async count(filter?: VectorSearchFilter): Promise<number> {
    const { custom } = splitCustomFilter(filter);
    const where = this.buildWhere(filter);

    if (!custom || Object.keys(custom).length === 0) {
      return this.prisma.sAMVectorEmbedding.count({ where });
    }

    const candidates = await this.prisma.sAMVectorEmbedding.findMany({
      where,
      select: { id: true, customMetadata: true },
    });

    return candidates.filter((record) => matchesCustomMetadata(record.customMetadata, custom)).length;
  }

  async listIds(options?: {
    limit?: number;
    offset?: number;
    filter?: VectorSearchFilter;
  }): Promise<string[]> {
    const { custom } = splitCustomFilter(options?.filter);
    const where = this.buildWhere(options?.filter);
    const limit = options?.limit ?? 100;
    const offset = options?.offset ?? 0;

    if (!custom || Object.keys(custom).length === 0) {
      const records = await this.prisma.sAMVectorEmbedding.findMany({
        where,
        select: { id: true },
        skip: offset,
        take: limit,
      });
      return records.map((r) => r.id);
    }

    const candidates = await this.prisma.sAMVectorEmbedding.findMany({
      where,
      select: { id: true, customMetadata: true },
    });

    return candidates
      .filter((record) => matchesCustomMetadata(record.customMetadata, custom))
      .slice(offset, offset + limit)
      .map((r) => r.id);
  }

  async getStats(): Promise<{
    totalDocuments: number;
    dimensions: number;
    indexSize?: number;
    lastUpdated?: Date;
    isReady: boolean;
  }> {
    const totalDocuments = await this.prisma.sAMVectorEmbedding.count();
    const lastRecord = await this.prisma.sAMVectorEmbedding.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });

    return {
      totalDocuments,
      dimensions: this.dimensions,
      lastUpdated: lastRecord?.updatedAt ?? undefined,
      isReady: this.connected,
    };
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createSAMVectorEmbeddingAdapter(
  prisma: PrismaClient,
  options?: {
    dimensions?: number;
    embeddingProvider?: EmbeddingAdapter;
  }
): SAMVectorEmbeddingAdapter {
  return new SAMVectorEmbeddingAdapter(prisma, options);
}

export function createTaxomindSAMVectorService(
  prisma: PrismaClient,
  options?: {
    openaiApiKey?: string;
    embeddingModel?: string;
    dimensions?: number;
    preferredProvider?: 'openai' | 'deepseek';
  }
): TaxomindVectorService {
  // Use the factory to create the best available embedding adapter
  // Falls back to hash-based embeddings if no API is configured
  const embeddingAdapter = options?.openaiApiKey
    ? new OpenAIEmbeddingAdapter({
        apiKey: options.openaiApiKey,
        model: options?.embeddingModel,
        dimensions: options?.dimensions,
      })
    : createEmbeddingAdapter({
        preferredProvider: options?.preferredProvider,
        dimensions: options?.dimensions,
      });

  const vectorAdapter = new SAMVectorEmbeddingAdapter(prisma, {
    embeddingProvider: embeddingAdapter,
    dimensions: options?.dimensions ?? embeddingAdapter.getDimensions(),
  });

  return new TaxomindVectorService(embeddingAdapter, vectorAdapter);
}
