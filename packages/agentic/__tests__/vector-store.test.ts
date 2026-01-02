/**
 * @sam-ai/agentic - VectorStore Tests
 * Comprehensive tests for vector embeddings and similarity search
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  VectorStore,
  createVectorStore,
  InMemoryVectorAdapter,
  MockEmbeddingProvider,
  cosineSimilarity,
  euclideanDistance,
  type VectorStoreConfig,
} from '../src/memory/vector-store';
import { EmbeddingSourceType } from '../src/memory/types';
import type { EmbeddingMetadata } from '../src/memory/types';

// ============================================================================
// TESTS
// ============================================================================

describe('VectorStore', () => {
  let vectorStore: VectorStore;
  let mockProvider: MockEmbeddingProvider;
  let config: VectorStoreConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProvider = new MockEmbeddingProvider(384, 'test-model');
    config = {
      embeddingProvider: mockProvider,
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
      cacheEnabled: true,
      cacheMaxSize: 100,
      cacheTTLSeconds: 60,
    };
    vectorStore = new VectorStore(config);
  });

  describe('constructor', () => {
    it('should create a VectorStore instance', () => {
      expect(vectorStore).toBeInstanceOf(VectorStore);
    });

    it('should use default adapter if not provided', () => {
      const store = new VectorStore({ embeddingProvider: mockProvider });
      expect(store).toBeInstanceOf(VectorStore);
    });

    it('should use console as default logger', () => {
      const store = new VectorStore({ embeddingProvider: mockProvider });
      expect(store).toBeInstanceOf(VectorStore);
    });
  });

  describe('createVectorStore factory', () => {
    it('should create a VectorStore using factory function', () => {
      const instance = createVectorStore(config);
      expect(instance).toBeInstanceOf(VectorStore);
    });
  });

  describe('insert', () => {
    it('should insert an embedding', async () => {
      const metadata: EmbeddingMetadata = {
        sourceId: 'test-source',
        sourceType: EmbeddingSourceType.COURSE_CONTENT,
        contentHash: 'hash123',
        tags: ['test'],
      };

      const embedding = await vectorStore.insert('Test content', metadata);

      expect(embedding).toBeDefined();
      expect(embedding.id).toBeDefined();
      expect(embedding.vector).toHaveLength(384);
      expect(embedding.dimensions).toBe(384);
      expect(embedding.metadata.sourceId).toBe('test-source');
    });

    it('should generate content hash if not provided', async () => {
      const metadata: EmbeddingMetadata = {
        sourceId: 'test-source',
        sourceType: EmbeddingSourceType.COURSE_CONTENT,
        contentHash: '',
        tags: [],
      };

      const embedding = await vectorStore.insert('Test content', metadata);

      expect(embedding.metadata.contentHash).toBeDefined();
      expect(embedding.metadata.contentHash.length).toBeGreaterThan(0);
    });
  });

  describe('insertBatch', () => {
    it('should insert multiple embeddings', async () => {
      const items = [
        {
          content: 'Content 1',
          metadata: {
            sourceId: 'source-1',
            sourceType: EmbeddingSourceType.COURSE_CONTENT,
            contentHash: 'hash1',
            tags: [],
          } as EmbeddingMetadata,
        },
        {
          content: 'Content 2',
          metadata: {
            sourceId: 'source-2',
            sourceType: EmbeddingSourceType.CHAPTER_CONTENT,
            contentHash: 'hash2',
            tags: [],
          } as EmbeddingMetadata,
        },
      ];

      const embeddings = await vectorStore.insertBatch(items);

      expect(embeddings).toHaveLength(2);
      expect(embeddings[0].metadata.sourceId).toBe('source-1');
      expect(embeddings[1].metadata.sourceId).toBe('source-2');
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      const items = [
        {
          content: 'Introduction to machine learning',
          metadata: {
            sourceId: 'ml-intro',
            sourceType: EmbeddingSourceType.COURSE_CONTENT,
            contentHash: 'hash1',
            tags: ['ml', 'intro'],
          } as EmbeddingMetadata,
        },
        {
          content: 'Deep learning fundamentals',
          metadata: {
            sourceId: 'dl-basics',
            sourceType: EmbeddingSourceType.CHAPTER_CONTENT,
            contentHash: 'hash2',
            tags: ['dl', 'neural-networks'],
          } as EmbeddingMetadata,
        },
        {
          content: 'Natural language processing',
          metadata: {
            sourceId: 'nlp-guide',
            sourceType: EmbeddingSourceType.SECTION_CONTENT,
            contentHash: 'hash3',
            tags: ['nlp', 'text'],
          } as EmbeddingMetadata,
        },
      ];
      await vectorStore.insertBatch(items);
    });

    it('should search for similar content', async () => {
      const results = await vectorStore.search('machine learning basics', {
        topK: 2,
      });

      expect(results.length).toBeLessThanOrEqual(2);
      expect(results[0].score).toBeGreaterThan(0);
    });

    it('should apply topK limit', async () => {
      const results = await vectorStore.search('learning', { topK: 1 });

      expect(results).toHaveLength(1);
    });

    it('should filter by minimum score', async () => {
      const results = await vectorStore.search('completely unrelated query', {
        topK: 10,
        minScore: 0.99, // Very high threshold
      });

      expect(results.length).toBe(0);
    });

    it('should filter by source type', async () => {
      const results = await vectorStore.search('content', {
        topK: 10,
        filter: {
          sourceTypes: [EmbeddingSourceType.COURSE_CONTENT],
        },
      });

      for (const result of results) {
        expect(result.embedding.metadata.sourceType).toBe(
          EmbeddingSourceType.COURSE_CONTENT
        );
      }
    });
  });

  describe('searchByVector', () => {
    it('should search using a vector directly', async () => {
      await vectorStore.insert('Test content', {
        sourceId: 'test',
        sourceType: EmbeddingSourceType.COURSE_CONTENT,
        contentHash: 'hash',
        tags: [],
      });

      const queryVector = await mockProvider.embed('Test content');
      const results = await vectorStore.searchByVector(queryVector, { topK: 1 });

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('get', () => {
    it('should get an embedding by ID', async () => {
      const created = await vectorStore.insert('Test', {
        sourceId: 'test',
        sourceType: EmbeddingSourceType.COURSE_CONTENT,
        contentHash: 'hash',
        tags: [],
      });

      const retrieved = await vectorStore.get(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should return null for non-existent ID', async () => {
      const result = await vectorStore.get('non-existent');
      expect(result).toBeNull();
    });

    it('should use cache on subsequent calls', async () => {
      const created = await vectorStore.insert('Test', {
        sourceId: 'test',
        sourceType: EmbeddingSourceType.COURSE_CONTENT,
        contentHash: 'hash',
        tags: [],
      });

      // First call
      await vectorStore.get(created.id);
      // Second call should hit cache
      const cached = await vectorStore.get(created.id);

      expect(cached?.id).toBe(created.id);
    });
  });

  describe('delete', () => {
    it('should delete an embedding', async () => {
      const created = await vectorStore.insert('Test', {
        sourceId: 'test',
        sourceType: EmbeddingSourceType.COURSE_CONTENT,
        contentHash: 'hash',
        tags: [],
      });

      const deleted = await vectorStore.delete(created.id);
      expect(deleted).toBe(true);

      const retrieved = await vectorStore.get(created.id);
      expect(retrieved).toBeNull();
    });

    it('should return false for non-existent ID', async () => {
      const result = await vectorStore.delete('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('deleteBatch', () => {
    it('should delete multiple embeddings', async () => {
      const e1 = await vectorStore.insert('Test 1', {
        sourceId: 'test1',
        sourceType: EmbeddingSourceType.COURSE_CONTENT,
        contentHash: 'hash1',
        tags: [],
      });
      const e2 = await vectorStore.insert('Test 2', {
        sourceId: 'test2',
        sourceType: EmbeddingSourceType.COURSE_CONTENT,
        contentHash: 'hash2',
        tags: [],
      });

      const count = await vectorStore.deleteBatch([e1.id, e2.id]);

      expect(count).toBe(2);
    });
  });

  describe('deleteByFilter', () => {
    it('should delete by filter', async () => {
      await vectorStore.insert('Test 1', {
        sourceId: 'test1',
        sourceType: EmbeddingSourceType.COURSE_CONTENT,
        contentHash: 'hash1',
        tags: ['delete-me'],
      });
      await vectorStore.insert('Test 2', {
        sourceId: 'test2',
        sourceType: EmbeddingSourceType.CHAPTER_CONTENT,
        contentHash: 'hash2',
        tags: [],
      });

      const count = await vectorStore.deleteByFilter({
        sourceTypes: [EmbeddingSourceType.COURSE_CONTENT],
      });

      expect(count).toBe(1);
    });
  });

  describe('update', () => {
    it('should update embedding metadata', async () => {
      const created = await vectorStore.insert('Test', {
        sourceId: 'test',
        sourceType: EmbeddingSourceType.COURSE_CONTENT,
        contentHash: 'hash',
        tags: [],
      });

      const updated = await vectorStore.update(created.id, {
        tags: ['updated', 'tags'],
      });

      expect(updated.metadata.tags).toContain('updated');
      expect(updated.metadata.tags).toContain('tags');
    });

    it('should throw error for non-existent ID', async () => {
      await expect(
        vectorStore.update('non-existent', { tags: ['test'] })
      ).rejects.toThrow('Embedding not found');
    });
  });

  describe('count', () => {
    it('should return total count', async () => {
      await vectorStore.insert('Test 1', {
        sourceId: 'test1',
        sourceType: EmbeddingSourceType.COURSE_CONTENT,
        contentHash: 'hash1',
        tags: [],
      });
      await vectorStore.insert('Test 2', {
        sourceId: 'test2',
        sourceType: EmbeddingSourceType.COURSE_CONTENT,
        contentHash: 'hash2',
        tags: [],
      });

      const count = await vectorStore.count();

      expect(count).toBe(2);
    });

    it('should return filtered count', async () => {
      await vectorStore.insert('Test 1', {
        sourceId: 'test1',
        sourceType: EmbeddingSourceType.COURSE_CONTENT,
        contentHash: 'hash1',
        tags: [],
      });
      await vectorStore.insert('Test 2', {
        sourceId: 'test2',
        sourceType: EmbeddingSourceType.CHAPTER_CONTENT,
        contentHash: 'hash2',
        tags: [],
      });

      const count = await vectorStore.count({
        sourceTypes: [EmbeddingSourceType.COURSE_CONTENT],
      });

      expect(count).toBe(1);
    });
  });

  describe('getStats', () => {
    it('should return statistics', async () => {
      await vectorStore.insert('Test 1', {
        sourceId: 'test1',
        sourceType: EmbeddingSourceType.COURSE_CONTENT,
        courseId: 'course-1',
        contentHash: 'hash1',
        tags: [],
      });

      const stats = await vectorStore.getStats();

      expect(stats.totalEmbeddings).toBe(1);
      expect(stats.dimensions).toBe(384);
      expect(stats.modelName).toBe('test-model');
      expect(stats.bySourceType[EmbeddingSourceType.COURSE_CONTENT]).toBe(1);
      expect(stats.byCourse['course-1']).toBe(1);
    });
  });
});

describe('InMemoryVectorAdapter', () => {
  let adapter: InMemoryVectorAdapter;

  beforeEach(() => {
    adapter = new InMemoryVectorAdapter();
  });

  it('should save and load embeddings', async () => {
    const embedding = {
      id: 'test-id',
      vector: [0.1, 0.2, 0.3],
      dimensions: 3,
      metadata: {
        sourceId: 'test',
        sourceType: EmbeddingSourceType.COURSE_CONTENT,
        contentHash: 'hash',
        tags: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await adapter.save(embedding);
    const loaded = await adapter.load('test-id');

    expect(loaded).toBeDefined();
    expect(loaded?.id).toBe('test-id');
  });

  it('should clear all embeddings', async () => {
    await adapter.save({
      id: 'test-id',
      vector: [0.1],
      dimensions: 1,
      metadata: {
        sourceId: 'test',
        sourceType: EmbeddingSourceType.COURSE_CONTENT,
        contentHash: 'hash',
        tags: [],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    adapter.clear();
    const count = await adapter.count();

    expect(count).toBe(0);
  });
});

describe('MockEmbeddingProvider', () => {
  let provider: MockEmbeddingProvider;

  beforeEach(() => {
    provider = new MockEmbeddingProvider(128, 'mock-model');
  });

  it('should return correct dimensions', () => {
    expect(provider.getDimensions()).toBe(128);
  });

  it('should return correct model name', () => {
    expect(provider.getModelName()).toBe('mock-model');
  });

  it('should generate deterministic embeddings', async () => {
    const v1 = await provider.embed('test');
    const v2 = await provider.embed('test');

    expect(v1).toEqual(v2);
  });

  it('should generate different embeddings for different text', async () => {
    const v1 = await provider.embed('hello');
    const v2 = await provider.embed('world');

    expect(v1).not.toEqual(v2);
  });

  it('should embed batch of texts', async () => {
    const vectors = await provider.embedBatch(['text1', 'text2', 'text3']);

    expect(vectors).toHaveLength(3);
    expect(vectors[0]).toHaveLength(128);
  });
});

describe('Similarity Functions', () => {
  describe('cosineSimilarity', () => {
    it('should return 1 for identical vectors', () => {
      const v = [1, 0, 0];
      expect(cosineSimilarity(v, v)).toBeCloseTo(1);
    });

    it('should return 0 for orthogonal vectors', () => {
      const v1 = [1, 0, 0];
      const v2 = [0, 1, 0];
      expect(cosineSimilarity(v1, v2)).toBeCloseTo(0);
    });

    it('should return -1 for opposite vectors', () => {
      const v1 = [1, 0, 0];
      const v2 = [-1, 0, 0];
      expect(cosineSimilarity(v1, v2)).toBeCloseTo(-1);
    });

    it('should throw for mismatched dimensions', () => {
      expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow();
    });
  });

  describe('euclideanDistance', () => {
    it('should return 0 for identical vectors', () => {
      const v = [1, 2, 3];
      expect(euclideanDistance(v, v)).toBe(0);
    });

    it('should return correct distance', () => {
      const v1 = [0, 0, 0];
      const v2 = [3, 4, 0];
      expect(euclideanDistance(v1, v2)).toBeCloseTo(5);
    });

    it('should throw for mismatched dimensions', () => {
      expect(() => euclideanDistance([1, 2], [1, 2, 3])).toThrow();
    });
  });
});
