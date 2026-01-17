/**
 * @sam-ai/agentic - VectorStore
 * Vector embeddings storage and similarity search
 */
import { v4 as uuidv4 } from 'uuid';
// ============================================================================
// IN-MEMORY PERSISTENCE ADAPTER
// ============================================================================
export class InMemoryVectorAdapter {
    embeddings = new Map();
    async save(embedding) {
        this.embeddings.set(embedding.id, embedding);
    }
    async saveBatch(embeddings) {
        for (const embedding of embeddings) {
            this.embeddings.set(embedding.id, embedding);
        }
    }
    async load(id) {
        return this.embeddings.get(id) ?? null;
    }
    async loadAll(filter) {
        let results = Array.from(this.embeddings.values());
        if (filter) {
            results = this.applyFilter(results, filter);
        }
        return results;
    }
    async delete(id) {
        return this.embeddings.delete(id);
    }
    async deleteBatch(ids) {
        let count = 0;
        for (const id of ids) {
            if (this.embeddings.delete(id)) {
                count++;
            }
        }
        return count;
    }
    async deleteByFilter(filter) {
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
    async update(id, updates) {
        const existing = this.embeddings.get(id);
        if (!existing)
            return null;
        const updated = {
            ...existing,
            ...updates,
            id: existing.id, // Preserve ID
            updatedAt: new Date(),
        };
        this.embeddings.set(id, updated);
        return updated;
    }
    async count(filter) {
        if (!filter)
            return this.embeddings.size;
        return this.applyFilter(Array.from(this.embeddings.values()), filter).length;
    }
    applyFilter(embeddings, filter) {
        return embeddings.filter((e) => {
            if (filter.sourceTypes?.length) {
                if (!filter.sourceTypes.includes(e.metadata.sourceType))
                    return false;
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
                if (!hasTag)
                    return false;
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
    clear() {
        this.embeddings.clear();
    }
}
class VectorCache {
    cache = new Map();
    maxSize;
    ttlMs;
    constructor(maxSize = 1000, ttlSeconds = 300) {
        this.maxSize = maxSize;
        this.ttlMs = ttlSeconds * 1000;
    }
    set(embedding) {
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
    get(id) {
        const entry = this.cache.get(id);
        if (!entry)
            return null;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(id);
            return null;
        }
        return entry.embedding;
    }
    delete(id) {
        return this.cache.delete(id);
    }
    clear() {
        this.cache.clear();
    }
    evictExpired() {
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
export function cosineSimilarity(a, b) {
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
    if (magnitude === 0)
        return 0;
    return dotProduct / magnitude;
}
/**
 * Calculate Euclidean distance between two vectors
 */
export function euclideanDistance(a, b) {
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
export class VectorStore {
    embeddingProvider;
    adapter;
    logger;
    cache;
    constructor(config) {
        this.embeddingProvider = config.embeddingProvider;
        this.adapter = config.persistenceAdapter ?? new InMemoryVectorAdapter();
        this.logger = config.logger ?? console;
        if (config.cacheEnabled !== false) {
            this.cache = new VectorCache(config.cacheMaxSize ?? 1000, config.cacheTTLSeconds ?? 300);
        }
        else {
            this.cache = null;
        }
    }
    /**
     * Generate content hash for deduplication
     */
    generateContentHash(content) {
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }
    async insert(content, metadata) {
        this.logger.debug('Inserting embedding', { sourceType: metadata.sourceType });
        const vector = await this.embeddingProvider.embed(content);
        const embedding = {
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
    async insertBatch(items) {
        this.logger.debug('Batch inserting embeddings', { count: items.length });
        const contents = items.map((item) => item.content);
        const vectors = await this.embeddingProvider.embedBatch(contents);
        const embeddings = items.map((item, index) => ({
            id: uuidv4(),
            vector: vectors[index],
            dimensions: vectors[index].length,
            metadata: {
                ...item.metadata,
                contentHash: item.metadata.contentHash || this.generateContentHash(item.content),
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
    async search(query, options) {
        this.logger.debug('Searching embeddings', { topK: options.topK });
        const queryVector = await this.embeddingProvider.embed(query);
        return this.searchByVector(queryVector, options);
    }
    async searchByVector(vector, options) {
        if (this.adapter.searchByVector) {
            return this.adapter.searchByVector(vector, options);
        }
        const allEmbeddings = await this.adapter.loadAll(options.filter);
        const results = [];
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
    async get(id) {
        // Check cache first
        const cached = this.cache?.get(id);
        if (cached)
            return cached;
        const embedding = await this.adapter.load(id);
        if (embedding) {
            this.cache?.set(embedding);
        }
        return embedding;
    }
    async delete(id) {
        this.cache?.delete(id);
        return this.adapter.delete(id);
    }
    async deleteBatch(ids) {
        for (const id of ids) {
            this.cache?.delete(id);
        }
        return this.adapter.deleteBatch(ids);
    }
    async deleteByFilter(filter) {
        // Clear cache since we don't know which entries match
        this.cache?.clear();
        return this.adapter.deleteByFilter(filter);
    }
    async update(id, metadata) {
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
    async count(filter) {
        return this.adapter.count(filter);
    }
    /**
     * Get statistics about the vector store
     */
    async getStats() {
        const total = await this.count();
        const allEmbeddings = await this.adapter.loadAll();
        const bySourceType = new Map();
        const byCourse = new Map();
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
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
export function createVectorStore(config) {
    return new VectorStore(config);
}
// ============================================================================
// MOCK EMBEDDING PROVIDER FOR TESTING
// ============================================================================
export class MockEmbeddingProvider {
    dimensions;
    modelName;
    constructor(dimensions = 384, modelName = 'mock-embeddings') {
        this.dimensions = dimensions;
        this.modelName = modelName;
    }
    async embed(text) {
        // Generate deterministic embedding based on text
        const vector = [];
        for (let i = 0; i < this.dimensions; i++) {
            const charCode = text.charCodeAt(i % text.length) || 0;
            vector.push(Math.sin(charCode * (i + 1)) * 0.5 + 0.5);
        }
        return this.normalize(vector);
    }
    async embedBatch(texts) {
        return Promise.all(texts.map((text) => this.embed(text)));
    }
    getDimensions() {
        return this.dimensions;
    }
    getModelName() {
        return this.modelName;
    }
    normalize(vector) {
        const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
        if (magnitude === 0)
            return vector;
        return vector.map((v) => v / magnitude);
    }
}
//# sourceMappingURL=vector-store.js.map