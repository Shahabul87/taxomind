/**
 * @sam-ai/adapter-taxomind - PgVector Adapter
 * Implements VectorAdapter using PostgreSQL with pgvector extension
 */
import OpenAI from 'openai';
// ============================================================================
// OPENAI EMBEDDING ADAPTER
// ============================================================================
/**
 * OpenAI embedding adapter
 */
export class OpenAIEmbeddingAdapter {
    client = null;
    model;
    _dimensions;
    apiKey;
    constructor(options) {
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
    getClient() {
        if (!this.client) {
            throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
        }
        return this.client;
    }
    isConfigured() {
        return !!this.apiKey;
    }
    getName() {
        return 'openai';
    }
    getModelName() {
        return this.model;
    }
    getDimensions() {
        return this._dimensions;
    }
    async embed(text) {
        const client = this.getClient();
        const response = await client.embeddings.create({
            model: this.model,
            input: text,
        });
        return response.data[0].embedding;
    }
    async embedBatch(texts) {
        if (texts.length === 0) {
            return [];
        }
        const client = this.getClient();
        // OpenAI supports up to 2048 inputs per request
        const batchSize = 100;
        const results = [];
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
    async healthCheck() {
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
        }
        catch (error) {
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
export class DeepSeekEmbeddingAdapter {
    model;
    _dimensions;
    constructor(options) {
        // Note: We don't create an OpenAI client since we use hash-based embeddings
        // This allows the adapter to work without any API key
        this.model = options?.model ?? 'hash-based-fallback';
        this._dimensions = options?.dimensions ?? 1536;
    }
    getName() {
        return 'deepseek';
    }
    getModelName() {
        return this.model;
    }
    getDimensions() {
        return this._dimensions;
    }
    async embed(text) {
        // DeepSeek doesn't have a dedicated embedding endpoint like OpenAI
        // Use a hash-based fallback that generates consistent embeddings
        return this.generateHashEmbedding(text);
    }
    async embedBatch(texts) {
        return texts.map((text) => this.generateHashEmbedding(text));
    }
    /**
     * Generate a deterministic embedding from text using hash
     * This is a fallback when no embedding API is available
     */
    generateHashEmbedding(text) {
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
    async healthCheck() {
        const startTime = Date.now();
        try {
            // Just verify we can generate embeddings
            await this.embed('health check');
            return {
                healthy: true,
                latencyMs: Date.now() - startTime,
                message: 'DeepSeek Embeddings adapter is healthy (using hash-based fallback)',
            };
        }
        catch (error) {
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
export function createEmbeddingAdapter(options) {
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
/**
 * PgVector-based vector database adapter
 */
export class PgVectorAdapter {
    prisma;
    tableName;
    embeddingColumn;
    contentColumn;
    connected = true; // Prisma handles connections
    dimensions;
    embeddingProvider;
    constructor(prisma, tableName = 'SAMMemory', embeddingColumn = 'embedding', contentColumn = 'content', options) {
        this.prisma = prisma;
        this.tableName = tableName;
        this.embeddingColumn = embeddingColumn;
        this.contentColumn = contentColumn;
        this.dimensions = options?.dimensions ?? 1536;
        this.embeddingProvider = options?.embeddingProvider;
    }
    // -------------------------------------------------------------------------
    // Adapter Info
    // -------------------------------------------------------------------------
    getName() {
        return 'pgvector';
    }
    getDimensions() {
        return this.dimensions;
    }
    async isConnected() {
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return true;
        }
        catch {
            return false;
        }
    }
    async connect() {
        // Prisma handles connections
        this.connected = true;
    }
    async disconnect() {
        // Prisma handles disconnections
        this.connected = false;
    }
    async healthCheck() {
        const startTime = Date.now();
        try {
            await this.prisma.$queryRaw `SELECT 1 FROM pg_extension WHERE extname = 'vector'`;
            return {
                healthy: true,
                latencyMs: Date.now() - startTime,
            };
        }
        catch (error) {
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
    async getOrCreateVector(content, existingVector) {
        if (existingVector) {
            return existingVector;
        }
        if (this.embeddingProvider) {
            return this.embeddingProvider.embed(content);
        }
        throw new Error('No vector provided and no embedding provider configured');
    }
    createVectorDocument(id, content, vector, metadata) {
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
    async insert(input) {
        const id = input.id ?? crypto.randomUUID();
        const vector = await this.getOrCreateVector(input.content, input.vector);
        const vectorString = `[${vector.join(',')}]`;
        const metadata = {
            ...input.metadata,
            contentHash: this.hashContent(input.content),
        };
        await this.prisma.$executeRawUnsafe(`
      INSERT INTO "${this.tableName}" (id, "${this.contentColumn}", "${this.embeddingColumn}", metadata, "createdAt", "updatedAt")
      VALUES ($1, $2, $3::vector, $4, NOW(), NOW())
      `, id, input.content, vectorString, JSON.stringify(metadata));
        return this.createVectorDocument(id, input.content, vector, metadata);
    }
    async insertBatch(inputs) {
        const successful = [];
        const failed = [];
        for (const input of inputs) {
            try {
                const doc = await this.insert(input);
                successful.push(doc.id);
            }
            catch (error) {
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
    async upsert(input) {
        const vector = await this.getOrCreateVector(input.content, input.vector);
        const vectorString = `[${vector.join(',')}]`;
        const metadata = {
            ...input.metadata,
            contentHash: this.hashContent(input.content),
        };
        await this.prisma.$executeRawUnsafe(`
      INSERT INTO "${this.tableName}" (id, "${this.contentColumn}", "${this.embeddingColumn}", metadata, "createdAt", "updatedAt")
      VALUES ($1, $2, $3::vector, $4, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        "${this.contentColumn}" = $2,
        "${this.embeddingColumn}" = $3::vector,
        metadata = $4,
        "updatedAt" = NOW()
      `, input.id, input.content, vectorString, JSON.stringify(metadata));
        return this.createVectorDocument(input.id, input.content, vector, metadata);
    }
    async upsertBatch(inputs) {
        const successful = [];
        const failed = [];
        for (const input of inputs) {
            try {
                await this.upsert(input);
                successful.push(input.id);
            }
            catch (error) {
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
    async get(id) {
        const results = await this.prisma.$queryRawUnsafe(`
      SELECT
        id,
        "${this.contentColumn}" as content,
        "${this.embeddingColumn}"::float[] as embedding,
        metadata::text,
        "createdAt",
        "updatedAt"
      FROM "${this.tableName}"
      WHERE id = $1
      `, id);
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
    async getMany(ids) {
        if (ids.length === 0)
            return [];
        const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
        const results = await this.prisma.$queryRawUnsafe(`
      SELECT
        id,
        "${this.contentColumn}" as content,
        "${this.embeddingColumn}"::float[] as embedding,
        metadata::text,
        "createdAt",
        "updatedAt"
      FROM "${this.tableName}"
      WHERE id IN (${placeholders})
      `, ...ids);
        return results.map((r) => ({
            id: r.id,
            content: r.content,
            vector: r.embedding,
            metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
        }));
    }
    async updateMetadata(id, metadata) {
        const existing = await this.get(id);
        if (!existing) {
            throw new Error(`Document not found: ${id}`);
        }
        const updatedMetadata = { ...existing.metadata, ...metadata };
        await this.prisma.$executeRawUnsafe(`
      UPDATE "${this.tableName}"
      SET metadata = $2, "updatedAt" = NOW()
      WHERE id = $1
      `, id, JSON.stringify(updatedMetadata));
        return {
            ...existing,
            metadata: updatedMetadata,
            updatedAt: new Date(),
        };
    }
    async delete(id) {
        const result = await this.prisma.$executeRawUnsafe(`DELETE FROM "${this.tableName}" WHERE id = $1`, id);
        return result > 0;
    }
    async deleteBatch(ids) {
        if (ids.length === 0)
            return 0;
        const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
        const result = await this.prisma.$executeRawUnsafe(`DELETE FROM "${this.tableName}" WHERE id IN (${placeholders})`, ...ids);
        return result;
    }
    async deleteByFilter(filter) {
        const { whereClause, params } = this.buildFilterClause(filter);
        if (!whereClause) {
            return 0;
        }
        const result = await this.prisma.$executeRawUnsafe(`DELETE FROM "${this.tableName}" ${whereClause}`, ...params);
        return result;
    }
    // -------------------------------------------------------------------------
    // Search Operations
    // -------------------------------------------------------------------------
    async search(query, options) {
        if (!this.embeddingProvider) {
            throw new Error('No embedding provider configured for text search');
        }
        const vector = await this.embeddingProvider.embed(query);
        return this.searchByVector(vector, options);
    }
    async searchByVector(vector, options) {
        const topK = options.topK;
        const vectorString = `[${vector.join(',')}]`;
        const { whereClause, params } = this.buildFilterClause(options.filter);
        const paramOffset = params.length + 2; // After vector and topK
        const results = await this.prisma.$queryRawUnsafe(`
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
      `, vectorString, topK, ...params);
        return results
            .filter((r) => {
            const score = 1 - r.distance;
            if (options.minScore && score < options.minScore)
                return false;
            if (options.maxDistance && r.distance > options.maxDistance)
                return false;
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
    async count(filter) {
        const { whereClause, params } = this.buildFilterClause(filter);
        const result = await this.prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${this.tableName}" ${whereClause}`, ...params);
        return Number(result[0].count);
    }
    async listIds(options) {
        const limit = options?.limit ?? 100;
        const offset = options?.offset ?? 0;
        const { whereClause, params } = this.buildFilterClause(options?.filter);
        const results = await this.prisma.$queryRawUnsafe(`SELECT id FROM "${this.tableName}" ${whereClause} ORDER BY "createdAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, ...params, limit, offset);
        return results.map((r) => r.id);
    }
    async getStats() {
        const countResult = await this.prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${this.tableName}"`);
        return {
            totalDocuments: Number(countResult[0].count),
            dimensions: this.dimensions,
            isReady: this.connected,
        };
    }
    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------
    buildFilterClause(filter) {
        if (!filter) {
            return { whereClause: '', params: [] };
        }
        const conditions = [];
        const params = [];
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
    hashContent(content) {
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
export class TaxomindVectorService {
    embeddingAdapter;
    vectorAdapter;
    constructor(embeddingAdapter, vectorAdapter) {
        this.embeddingAdapter = embeddingAdapter;
        this.vectorAdapter = vectorAdapter;
    }
    getAdapter() {
        return this.vectorAdapter;
    }
    getEmbeddingProvider() {
        return this.embeddingAdapter;
    }
    async insertWithEmbedding(content, metadata) {
        const vector = await this.embeddingAdapter.embed(content);
        return this.vectorAdapter.insert({
            content,
            vector,
            metadata,
        });
    }
    async insertBatchWithEmbedding(items) {
        const texts = items.map((item) => item.content);
        const embeddings = await this.embeddingAdapter.embedBatch(texts);
        const inputs = items.map((item, i) => ({
            content: item.content,
            vector: embeddings[i],
            metadata: item.metadata,
        }));
        return this.vectorAdapter.insertBatch(inputs);
    }
    async semanticSearch(query, options) {
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
export function createOpenAIEmbeddingAdapter(options) {
    return new OpenAIEmbeddingAdapter(options);
}
/**
 * Create a PgVector adapter
 */
export function createPgVectorAdapter(prisma, options) {
    return new PgVectorAdapter(prisma, options?.tableName, options?.embeddingColumn, options?.contentColumn);
}
/**
 * Create a complete vector service
 * Uses factory to select best available embedding provider
 */
export function createTaxomindVectorService(prisma, options) {
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
//# sourceMappingURL=pgvector-adapter.js.map