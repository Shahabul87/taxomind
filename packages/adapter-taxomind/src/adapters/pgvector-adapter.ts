/**
 * @sam-ai/adapter-taxomind - PgVector Adapter
 * Implements VectorAdapter using PostgreSQL with pgvector extension
 */

import type { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import type {
  VectorAdapter,
  EmbeddingAdapter,
  VectorService,
  VectorDocument,
  VectorSearchResult,
  VectorSearchOptions,
  VectorSearchFilter,
  VectorUpsertInput,
  VectorMetadata,
  VectorIndexStats,
  BatchUpsertResult,
  HealthStatus,
} from '@sam-ai/integration';

// ============================================================================
// OPENAI EMBEDDING ADAPTER
// ============================================================================

/**
 * OpenAI embedding adapter
 */
export class OpenAIEmbeddingAdapter implements EmbeddingAdapter {
  private client: OpenAI | null = null;
  private model: string;
  private _dimensions: number;
  private apiKey?: string;

  constructor(options?: {
    apiKey?: string;
    model?: string;
    dimensions?: number;
  }) {
    this.apiKey = options?.apiKey ?? process.env.OPENAI_API_KEY;
    // Only create client if we have an API key - defer error to usage time
    if (this.apiKey) {
      this.client = new OpenAI({
        apiKey: this.apiKey,
      });
    }
    this.model = options?.model ?? 'text-embedding-3-small';
    this._dimensions = options?.dimensions ?? 1536;
  }

  private getClient(): OpenAI {
    if (!this.client) {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
    }
    return this.client;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  getName(): string {
    return 'openai';
  }

  getModelName(): string {
    return this.model;
  }

  getDimensions(): number {
    return this._dimensions;
  }

  async embed(text: string): Promise<number[]> {
    const client = this.getClient();
    const response = await client.embeddings.create({
      model: this.model,
      input: text,
    });
    return response.data[0].embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const client = this.getClient();
    // OpenAI supports up to 2048 inputs per request
    const batchSize = 100;
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const response = await client.embeddings.create({
        model: this.model,
        input: batch,
      });
      results.push(...response.data.map((d) => d.embedding));
    }

    return results;
  }

  async healthCheck(): Promise<HealthStatus> {
    const startTime = Date.now();

    // If not configured, return unhealthy but don't fail
    if (!this.isConfigured()) {
      return {
        healthy: false,
        latencyMs: Date.now() - startTime,
        message: 'OpenAI Embeddings API not configured (no API key)',
      };
    }

    try {
      await this.embed('health check');
      return {
        healthy: true,
        latencyMs: Date.now() - startTime,
        message: 'OpenAI Embeddings API is healthy',
      };
    } catch (error) {
      return {
        healthy: false,
        latencyMs: Date.now() - startTime,
        message: `OpenAI Embeddings API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}

// ============================================================================
// DEEPSEEK EMBEDDING ADAPTER
// ============================================================================

/**
 * DeepSeek/Hash-based embedding adapter
 * Uses hash-based embeddings as a fallback when no embedding API is available.
 * This provides deterministic embeddings that work without any API key.
 */
export class DeepSeekEmbeddingAdapter implements EmbeddingAdapter {
  private model: string;
  private _dimensions: number;

  constructor(options?: {
    apiKey?: string;
    model?: string;
    dimensions?: number;
  }) {
    // Note: We don't create an OpenAI client since we use hash-based embeddings
    // This allows the adapter to work without any API key
    this.model = options?.model ?? 'hash-based-fallback';
    this._dimensions = options?.dimensions ?? 1536;
  }

  getName(): string {
    return 'deepseek';
  }

  getModelName(): string {
    return this.model;
  }

  getDimensions(): number {
    return this._dimensions;
  }

  async embed(text: string): Promise<number[]> {
    // DeepSeek doesn't have a dedicated embedding endpoint like OpenAI
    // Use a hash-based fallback that generates consistent embeddings
    return this.generateHashEmbedding(text);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return texts.map((text) => this.generateHashEmbedding(text));
  }

  /**
   * Generate a deterministic embedding from text using hash
   * This is a fallback when no embedding API is available
   */
  private generateHashEmbedding(text: string): number[] {
    const embedding = new Array(this._dimensions).fill(0);

    // Use a simple hash-based approach for consistent embeddings
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const index = (charCode * (i + 1)) % this._dimensions;
      embedding[index] += Math.sin(charCode * 0.01) * 0.1;
    }

    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }

    return embedding;
  }

  async healthCheck(): Promise<HealthStatus> {
    const startTime = Date.now();
    try {
      // Just verify we can generate embeddings
      await this.embed('health check');
      return {
        healthy: true,
        latencyMs: Date.now() - startTime,
        message: 'DeepSeek Embeddings adapter is healthy (using hash-based fallback)',
      };
    } catch (error) {
      return {
        healthy: false,
        latencyMs: Date.now() - startTime,
        message: `DeepSeek Embeddings error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}

// ============================================================================
// EMBEDDING ADAPTER FACTORY
// ============================================================================

/**
 * Create the best available embedding adapter based on configured API keys
 */
export function createEmbeddingAdapter(options?: {
  preferredProvider?: 'openai' | 'deepseek';
  dimensions?: number;
}): EmbeddingAdapter {
  const preferredProvider = options?.preferredProvider;
  const dimensions = options?.dimensions ?? 1536;

  // If a specific provider is preferred and available, use it
  if (preferredProvider === 'openai' && process.env.OPENAI_API_KEY) {
    return new OpenAIEmbeddingAdapter({ dimensions });
  }
  if (preferredProvider === 'deepseek' && process.env.DEEPSEEK_API_KEY) {
    return new DeepSeekEmbeddingAdapter({ dimensions });
  }

  // Otherwise, try providers in order of preference
  if (process.env.OPENAI_API_KEY) {
    return new OpenAIEmbeddingAdapter({ dimensions });
  }
  if (process.env.DEEPSEEK_API_KEY) {
    return new DeepSeekEmbeddingAdapter({ dimensions });
  }

  // Fallback: Return DeepSeek adapter which uses hash-based embeddings
  // This allows the system to work without any embedding API configured
  console.warn('[EmbeddingAdapter] No embedding API configured, using hash-based fallback');
  return new DeepSeekEmbeddingAdapter({ dimensions });
}

// ============================================================================
// PGVECTOR ADAPTER
// ============================================================================

// Allowed table and column names to prevent SQL injection via raw queries
const ALLOWED_TABLES = new Set([
  'SAMMemory',
  'SAMMemoryEntry',
  'knowledge_graph_nodes',
  'knowledge_graph_edges',
]);

const ALLOWED_COLUMNS = new Set([
  'embedding',
  'content',
  'text',
  'body',
  'description',
  'vector',
]);

/**
 * PgVector-based vector database adapter
 */
export class PgVectorAdapter implements VectorAdapter {
  private connected = true; // Prisma handles connections
  private dimensions: number;
  private embeddingProvider?: EmbeddingAdapter;

  constructor(
    private prisma: PrismaClient,
    private tableName: string = 'SAMMemory',
    private embeddingColumn: string = 'embedding',
    private contentColumn: string = 'content',
    options?: {
      dimensions?: number;
      embeddingProvider?: EmbeddingAdapter;
    }
  ) {
    // Validate table and column names to prevent SQL injection
    if (!ALLOWED_TABLES.has(this.tableName)) {
      throw new Error(
        `Invalid table name: "${this.tableName}". Allowed tables: ${[...ALLOWED_TABLES].join(', ')}`
      );
    }
    if (!ALLOWED_COLUMNS.has(this.embeddingColumn)) {
      throw new Error(
        `Invalid embedding column: "${this.embeddingColumn}". Allowed columns: ${[...ALLOWED_COLUMNS].join(', ')}`
      );
    }
    if (!ALLOWED_COLUMNS.has(this.contentColumn)) {
      throw new Error(
        `Invalid content column: "${this.contentColumn}". Allowed columns: ${[...ALLOWED_COLUMNS].join(', ')}`
      );
    }

    this.dimensions = options?.dimensions ?? 1536;
    this.embeddingProvider = options?.embeddingProvider;
  }

  // -------------------------------------------------------------------------
  // Adapter Info
  // -------------------------------------------------------------------------

  getName(): string {
    return 'pgvector';
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
    // Prisma handles connections
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    // Prisma handles disconnections
    this.connected = false;
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    const startTime = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1 FROM pg_extension WHERE extname = 'vector'`;
      return {
        healthy: true,
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        healthy: false,
        latencyMs: Date.now() - startTime,
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

  private createVectorDocument(
    id: string,
    content: string,
    vector: number[],
    metadata: VectorMetadata
  ): VectorDocument {
    const now = new Date();
    return {
      id,
      content,
      vector,
      metadata,
      createdAt: now,
      updatedAt: now,
    };
  }

  async insert(input: VectorUpsertInput): Promise<VectorDocument> {
    const id = input.id ?? crypto.randomUUID();
    const vector = await this.getOrCreateVector(input.content, input.vector);
    const vectorString = `[${vector.join(',')}]`;
    const metadata: VectorMetadata = {
      ...input.metadata,
      contentHash: this.hashContent(input.content),
    };

    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO "${this.tableName}" (id, "${this.contentColumn}", "${this.embeddingColumn}", metadata, "createdAt", "updatedAt")
      VALUES ($1, $2, $3::vector, $4, NOW(), NOW())
      `,
      id,
      input.content,
      vectorString,
      JSON.stringify(metadata)
    );

    return this.createVectorDocument(id, input.content, vector, metadata);
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

    return {
      successful,
      failed,
      totalProcessed: inputs.length,
    };
  }

  async upsert(input: VectorUpsertInput & { id: string }): Promise<VectorDocument> {
    const vector = await this.getOrCreateVector(input.content, input.vector);
    const vectorString = `[${vector.join(',')}]`;
    const metadata: VectorMetadata = {
      ...input.metadata,
      contentHash: this.hashContent(input.content),
    };

    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO "${this.tableName}" (id, "${this.contentColumn}", "${this.embeddingColumn}", metadata, "createdAt", "updatedAt")
      VALUES ($1, $2, $3::vector, $4, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        "${this.contentColumn}" = $2,
        "${this.embeddingColumn}" = $3::vector,
        metadata = $4,
        "updatedAt" = NOW()
      `,
      input.id,
      input.content,
      vectorString,
      JSON.stringify(metadata)
    );

    return this.createVectorDocument(input.id, input.content, vector, metadata);
  }

  async upsertBatch(inputs: Array<VectorUpsertInput & { id: string }>): Promise<BatchUpsertResult> {
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

    return {
      successful,
      failed,
      totalProcessed: inputs.length,
    };
  }

  async get(id: string): Promise<VectorDocument | null> {
    const results = await this.prisma.$queryRawUnsafe<
      Array<{
        id: string;
        content: string;
        embedding: number[];
        metadata: string;
        createdAt: Date;
        updatedAt: Date;
      }>
    >(
      `
      SELECT
        id,
        "${this.contentColumn}" as content,
        "${this.embeddingColumn}"::float[] as embedding,
        metadata::text,
        "createdAt",
        "updatedAt"
      FROM "${this.tableName}"
      WHERE id = $1
      `,
      id
    );

    if (results.length === 0) {
      return null;
    }

    const r = results[0];
    return {
      id: r.id,
      content: r.content,
      vector: r.embedding,
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  async getMany(ids: string[]): Promise<VectorDocument[]> {
    if (ids.length === 0) return [];

    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const results = await this.prisma.$queryRawUnsafe<
      Array<{
        id: string;
        content: string;
        embedding: number[];
        metadata: string;
        createdAt: Date;
        updatedAt: Date;
      }>
    >(
      `
      SELECT
        id,
        "${this.contentColumn}" as content,
        "${this.embeddingColumn}"::float[] as embedding,
        metadata::text,
        "createdAt",
        "updatedAt"
      FROM "${this.tableName}"
      WHERE id IN (${placeholders})
      `,
      ...ids
    );

    return results.map((r) => ({
      id: r.id,
      content: r.content,
      vector: r.embedding,
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  async updateMetadata(id: string, metadata: Partial<VectorMetadata>): Promise<VectorDocument> {
    const existing = await this.get(id);
    if (!existing) {
      throw new Error(`Document not found: ${id}`);
    }

    const updatedMetadata = { ...existing.metadata, ...metadata };

    await this.prisma.$executeRawUnsafe(
      `
      UPDATE "${this.tableName}"
      SET metadata = $2, "updatedAt" = NOW()
      WHERE id = $1
      `,
      id,
      JSON.stringify(updatedMetadata)
    );

    return {
      ...existing,
      metadata: updatedMetadata,
      updatedAt: new Date(),
    };
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.prisma.$executeRawUnsafe(
      `DELETE FROM "${this.tableName}" WHERE id = $1`,
      id
    );
    return (result as number) > 0;
  }

  async deleteBatch(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;

    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const result = await this.prisma.$executeRawUnsafe(
      `DELETE FROM "${this.tableName}" WHERE id IN (${placeholders})`,
      ...ids
    );
    return result as number;
  }

  async deleteByFilter(filter: VectorSearchFilter): Promise<number> {
    const { whereClause, params } = this.buildFilterClause(filter);
    if (!whereClause) {
      return 0;
    }

    const result = await this.prisma.$executeRawUnsafe(
      `DELETE FROM "${this.tableName}" ${whereClause}`,
      ...params
    );
    return result as number;
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

  async searchByVector(vector: number[], options: VectorSearchOptions): Promise<VectorSearchResult[]> {
    const topK = options.topK;
    const vectorString = `[${vector.join(',')}]`;

    const { whereClause, params } = this.buildFilterClause(options.filter);
    const paramOffset = params.length + 2; // After vector and topK

    const results = await this.prisma.$queryRawUnsafe<
      Array<{
        id: string;
        content: string;
        embedding: number[];
        metadata: string;
        createdAt: Date;
        updatedAt: Date;
        distance: number;
      }>
    >(
      `
      SELECT
        id,
        "${this.contentColumn}" as content,
        ${options.includeVectors ? `"${this.embeddingColumn}"::float[] as embedding,` : ''}
        metadata::text,
        "createdAt",
        "updatedAt",
        "${this.embeddingColumn}" <=> $1::vector as distance
      FROM "${this.tableName}"
      ${whereClause}
      ORDER BY "${this.embeddingColumn}" <=> $1::vector
      LIMIT $2
      `,
      vectorString,
      topK,
      ...params
    );

    return results
      .filter((r) => {
        const score = 1 - r.distance;
        if (options.minScore && score < options.minScore) return false;
        if (options.maxDistance && r.distance > options.maxDistance) return false;
        return true;
      })
      .map((r) => ({
        document: {
          id: r.id,
          content: r.content,
          vector: r.embedding ?? [],
          metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        },
        score: 1 - r.distance,
        distance: r.distance,
      }));
  }

  // -------------------------------------------------------------------------
  // Utility Operations
  // -------------------------------------------------------------------------

  async count(filter?: VectorSearchFilter): Promise<number> {
    const { whereClause, params } = this.buildFilterClause(filter);

    const result = await this.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM "${this.tableName}" ${whereClause}`,
      ...params
    );

    return Number(result[0].count);
  }

  async listIds(options?: { limit?: number; offset?: number; filter?: VectorSearchFilter }): Promise<string[]> {
    const limit = options?.limit ?? 100;
    const offset = options?.offset ?? 0;
    const { whereClause, params } = this.buildFilterClause(options?.filter);

    const results = await this.prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM "${this.tableName}" ${whereClause} ORDER BY "createdAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      ...params,
      limit,
      offset
    );

    return results.map((r) => r.id);
  }

  async getStats(): Promise<VectorIndexStats> {
    const countResult = await this.prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM "${this.tableName}"`
    );

    return {
      totalDocuments: Number(countResult[0].count),
      dimensions: this.dimensions,
      isReady: this.connected,
    };
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private buildFilterClause(filter?: VectorSearchFilter): { whereClause: string; params: unknown[] } {
    if (!filter) {
      return { whereClause: '', params: [] };
    }

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filter.sourceTypes?.length) {
      conditions.push(`metadata->>'sourceType' = ANY($${paramIndex})`);
      params.push(filter.sourceTypes);
      paramIndex++;
    }

    if (filter.userIds?.length) {
      conditions.push(`metadata->>'userId' = ANY($${paramIndex})`);
      params.push(filter.userIds);
      paramIndex++;
    }

    if (filter.courseIds?.length) {
      conditions.push(`metadata->>'courseId' = ANY($${paramIndex})`);
      params.push(filter.courseIds);
      paramIndex++;
    }

    if (filter.tags?.length) {
      conditions.push(`metadata->'tags' ?| $${paramIndex}`);
      params.push(filter.tags);
      paramIndex++;
    }

    if (filter.dateRange?.start) {
      conditions.push(`"createdAt" >= $${paramIndex}`);
      params.push(filter.dateRange.start);
      paramIndex++;
    }

    if (filter.dateRange?.end) {
      conditions.push(`"createdAt" <= $${paramIndex}`);
      params.push(filter.dateRange.end);
      paramIndex++;
    }

    if (conditions.length === 0) {
      return { whereClause: '', params: [] };
    }

    return {
      whereClause: `WHERE ${conditions.join(' AND ')}`,
      params,
    };
  }

  private hashContent(content: string): string {
    // Simple hash for content deduplication
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }
}

// ============================================================================
// VECTOR SERVICE
// ============================================================================

/**
 * Combined vector service with embeddings and storage
 */
export class TaxomindVectorService implements VectorService {
  constructor(
    private readonly embeddingAdapter: EmbeddingAdapter,
    private readonly vectorAdapter: VectorAdapter
  ) {}

  getAdapter(): VectorAdapter {
    return this.vectorAdapter;
  }

  getEmbeddingProvider(): EmbeddingAdapter {
    return this.embeddingAdapter;
  }

  async insertWithEmbedding(
    content: string,
    metadata: Omit<VectorMetadata, 'contentHash'>
  ): Promise<VectorDocument> {
    const vector = await this.embeddingAdapter.embed(content);
    return this.vectorAdapter.insert({
      content,
      vector,
      metadata,
    });
  }

  async insertBatchWithEmbedding(
    items: Array<{ content: string; metadata: Omit<VectorMetadata, 'contentHash'> }>
  ): Promise<BatchUpsertResult> {
    const texts = items.map((item) => item.content);
    const embeddings = await this.embeddingAdapter.embedBatch(texts);

    const inputs: VectorUpsertInput[] = items.map((item, i) => ({
      content: item.content,
      vector: embeddings[i],
      metadata: item.metadata,
    }));

    return this.vectorAdapter.insertBatch(inputs);
  }

  async semanticSearch(query: string, options: VectorSearchOptions): Promise<VectorSearchResult[]> {
    const queryVector = await this.embeddingAdapter.embed(query);
    return this.vectorAdapter.searchByVector(queryVector, options);
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create an OpenAI embedding adapter
 */
export function createOpenAIEmbeddingAdapter(options?: {
  apiKey?: string;
  model?: string;
  dimensions?: number;
}): OpenAIEmbeddingAdapter {
  return new OpenAIEmbeddingAdapter(options);
}

/**
 * Create a PgVector adapter
 */
export function createPgVectorAdapter(
  prisma: PrismaClient,
  options?: {
    tableName?: string;
    embeddingColumn?: string;
    contentColumn?: string;
  }
): PgVectorAdapter {
  return new PgVectorAdapter(
    prisma,
    options?.tableName,
    options?.embeddingColumn,
    options?.contentColumn
  );
}

/**
 * Create a complete vector service
 * Uses factory to select best available embedding provider
 */
export function createTaxomindVectorService(
  prisma: PrismaClient,
  options?: {
    openaiApiKey?: string;
    embeddingModel?: string;
    tableName?: string;
    preferredProvider?: 'openai' | 'deepseek';
  }
): TaxomindVectorService {
  // Use the factory to create the best available embedding adapter
  // Falls back to hash-based embeddings if no API is configured
  const embeddingAdapter = options?.openaiApiKey
    ? new OpenAIEmbeddingAdapter({
        apiKey: options.openaiApiKey,
        model: options?.embeddingModel,
      })
    : createEmbeddingAdapter({
        preferredProvider: options?.preferredProvider,
      });

  const vectorAdapter = new PgVectorAdapter(prisma, options?.tableName);

  return new TaxomindVectorService(embeddingAdapter, vectorAdapter);
}
