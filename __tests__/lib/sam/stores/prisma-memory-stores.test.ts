/**
 * Prisma Memory Stores Unit Tests
 *
 * Tests three store adapters from prisma-memory-stores.ts:
 * 1. PrismaVectorAdapter (VectorPersistenceAdapter)
 * 2. PrismaKnowledgeGraphStore (KnowledgeGraphStore)
 * 3. PrismaSessionContextStore (SessionContextStore)
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

// Mock pgvector-adapter to avoid actual DB calls
jest.mock('@/lib/sam/stores/pgvector-adapter', () => ({
  isPgvectorAvailable: jest.fn().mockResolvedValue(false),
  pgvectorSearch: jest.fn(),
  writeEmbeddingVector: jest.fn().mockResolvedValue(undefined),
}));

const mockVectorCreate = jest.fn();
const mockVectorCreateMany = jest.fn();
const mockVectorFindUnique = jest.fn();
const mockVectorFindMany = jest.fn();
const mockVectorUpdate = jest.fn();
const mockVectorDelete = jest.fn();
const mockVectorDeleteMany = jest.fn();
const mockVectorCount = jest.fn();

const mockNodeCreate = jest.fn();
const mockNodeFindUnique = jest.fn();
const mockNodeFindMany = jest.fn();
const mockNodeUpdate = jest.fn();
const mockNodeDelete = jest.fn();

const mockEdgeCreate = jest.fn();
const mockEdgeFindUnique = jest.fn();
const mockEdgeFindMany = jest.fn();
const mockEdgeDelete = jest.fn();

const mockCtxCreate = jest.fn();
const mockCtxFindFirst = jest.fn();
const mockCtxFindUnique = jest.fn();
const mockCtxUpdate = jest.fn();
const mockCtxDelete = jest.fn();

const mockDb = {
  sAMVectorEmbedding: {
    create: mockVectorCreate,
    createMany: mockVectorCreateMany,
    findUnique: mockVectorFindUnique,
    findMany: mockVectorFindMany,
    update: mockVectorUpdate,
    delete: mockVectorDelete,
    deleteMany: mockVectorDeleteMany,
    count: mockVectorCount,
  },
  sAMKnowledgeNode: {
    create: mockNodeCreate,
    findUnique: mockNodeFindUnique,
    findMany: mockNodeFindMany,
    update: mockNodeUpdate,
    delete: mockNodeDelete,
  },
  sAMKnowledgeEdge: {
    create: mockEdgeCreate,
    findUnique: mockEdgeFindUnique,
    findMany: mockEdgeFindMany,
    delete: mockEdgeDelete,
  },
  sAMSessionContext: {
    create: mockCtxCreate,
    findFirst: mockCtxFindFirst,
    findUnique: mockCtxFindUnique,
    update: mockCtxUpdate,
    delete: mockCtxDelete,
  },
};

jest.mock('@/lib/sam/stores/db-provider', () => ({
  getDb: () => mockDb,
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import {
  PrismaVectorAdapter,
  PrismaKnowledgeGraphStore,
  PrismaSessionContextStore,
  createPrismaVectorAdapter,
  createPrismaKnowledgeGraphStore,
  createPrismaSessionContextStore,
} from '@/lib/sam/stores/prisma-memory-stores';

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------

const NOW = new Date('2026-02-20T08:00:00Z');

// =========================================================================
// PrismaVectorAdapter Tests
// =========================================================================

describe('PrismaVectorAdapter', () => {
  let adapter: PrismaVectorAdapter;

  const makeVectorRecord = (overrides: Record<string, unknown> = {}) => ({
    id: 'vec-1',
    embedding: [0.1, 0.2, 0.3],
    dimensions: 3,
    sourceId: 'src-1',
    sourceType: 'section',
    userId: 'user-1',
    courseId: 'course-1',
    chapterId: null,
    sectionId: null,
    contentHash: 'abc123',
    tags: ['math'],
    language: 'en',
    customMetadata: {},
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = createPrismaVectorAdapter();
  });

  describe('save', () => {
    it('creates a vector embedding record', async () => {
      mockVectorCreate.mockResolvedValue(makeVectorRecord());

      await adapter.save({
        id: 'vec-1',
        vector: [0.1, 0.2, 0.3],
        dimensions: 3,
        metadata: {
          sourceId: 'src-1',
          sourceType: 'section' as never,
          userId: 'user-1',
          courseId: 'course-1',
          contentHash: 'abc123',
          tags: ['math'],
          language: 'en',
        },
        createdAt: NOW,
        updatedAt: NOW,
      });

      expect(mockVectorCreate).toHaveBeenCalledTimes(1);
    });
  });

  describe('load', () => {
    it('returns a vector embedding when found', async () => {
      mockVectorFindUnique.mockResolvedValue(makeVectorRecord());

      const result = await adapter.load('vec-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('vec-1');
      expect(result?.vector).toEqual([0.1, 0.2, 0.3]);
    });

    it('returns null when not found', async () => {
      mockVectorFindUnique.mockResolvedValue(null);

      const result = await adapter.load('bad-id');

      expect(result).toBeNull();
    });
  });

  describe('loadAll', () => {
    it('returns all embeddings with optional filter', async () => {
      mockVectorFindMany.mockResolvedValue([makeVectorRecord()]);

      const results = await adapter.loadAll();

      expect(results).toHaveLength(1);
    });
  });

  describe('delete', () => {
    it('returns true when deletion succeeds', async () => {
      mockVectorDelete.mockResolvedValue({ id: 'vec-1' });

      const result = await adapter.delete('vec-1');

      expect(result).toBe(true);
    });

    it('returns false when deletion fails', async () => {
      mockVectorDelete.mockRejectedValue(new Error('Not found'));

      const result = await adapter.delete('bad-id');

      expect(result).toBe(false);
    });
  });

  describe('deleteBatch', () => {
    it('returns count of deleted embeddings', async () => {
      mockVectorDeleteMany.mockResolvedValue({ count: 3 });

      const result = await adapter.deleteBatch(['v1', 'v2', 'v3']);

      expect(result).toBe(3);
    });
  });

  describe('count', () => {
    it('returns total count', async () => {
      mockVectorCount.mockResolvedValue(42);

      const result = await adapter.count();

      expect(result).toBe(42);
    });
  });
});

// =========================================================================
// PrismaKnowledgeGraphStore Tests
// =========================================================================

describe('PrismaKnowledgeGraphStore', () => {
  let store: PrismaKnowledgeGraphStore;

  const makeNode = (overrides: Record<string, unknown> = {}) => ({
    id: 'node-1',
    type: 'concept',
    name: 'Closures',
    description: 'JavaScript closures',
    properties: { difficulty: 'intermediate' },
    embeddings: [],
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  });

  const makeEdge = (overrides: Record<string, unknown> = {}) => ({
    id: 'edge-1',
    type: 'prerequisite',
    sourceId: 'node-1',
    targetId: 'node-2',
    weight: 0.8,
    properties: {},
    createdAt: NOW,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    store = createPrismaKnowledgeGraphStore();
  });

  describe('createEntity', () => {
    it('creates a knowledge graph entity', async () => {
      mockNodeCreate.mockResolvedValue(makeNode());

      const result = await store.createEntity({
        type: 'concept' as never,
        name: 'Closures',
        description: 'JavaScript closures',
        properties: { difficulty: 'intermediate' },
        embeddings: [],
      });

      expect(result.id).toBe('node-1');
      expect(result.name).toBe('Closures');
    });
  });

  describe('getEntity', () => {
    it('returns entity when found', async () => {
      mockNodeFindUnique.mockResolvedValue(makeNode());

      const result = await store.getEntity('node-1');

      expect(result?.name).toBe('Closures');
    });

    it('returns null when not found', async () => {
      mockNodeFindUnique.mockResolvedValue(null);

      const result = await store.getEntity('bad-id');

      expect(result).toBeNull();
    });
  });

  describe('deleteEntity', () => {
    it('returns true on successful deletion', async () => {
      mockNodeDelete.mockResolvedValue({ id: 'node-1' });

      const result = await store.deleteEntity('node-1');

      expect(result).toBe(true);
    });

    it('returns false on failure', async () => {
      mockNodeDelete.mockRejectedValue(new Error('Not found'));

      const result = await store.deleteEntity('bad-id');

      expect(result).toBe(false);
    });
  });

  describe('createRelationship', () => {
    it('creates a relationship edge', async () => {
      mockEdgeCreate.mockResolvedValue(makeEdge());

      const result = await store.createRelationship({
        type: 'prerequisite' as never,
        sourceId: 'node-1',
        targetId: 'node-2',
        weight: 0.8,
        properties: {},
      });

      expect(result.id).toBe('edge-1');
      expect(result.weight).toBe(0.8);
    });
  });

  describe('getRelationships', () => {
    it('gets outgoing relationships', async () => {
      mockEdgeFindMany.mockResolvedValue([makeEdge()]);

      const results = await store.getRelationships('node-1', { direction: 'outgoing' });

      expect(results).toHaveLength(1);
      const call = mockEdgeFindMany.mock.calls[0][0];
      expect(call.where.sourceId).toBe('node-1');
    });

    it('gets incoming relationships', async () => {
      mockEdgeFindMany.mockResolvedValue([]);

      await store.getRelationships('node-1', { direction: 'incoming' });

      const call = mockEdgeFindMany.mock.calls[0][0];
      expect(call.where.targetId).toBe('node-1');
    });

    it('gets both directions by default', async () => {
      mockEdgeFindMany.mockResolvedValue([]);

      await store.getRelationships('node-1');

      const call = mockEdgeFindMany.mock.calls[0][0];
      expect(call.where.OR).toBeDefined();
    });
  });

  describe('traverse', () => {
    it('returns empty result when start entity is not found', async () => {
      mockNodeFindUnique.mockResolvedValue(null);

      const result = await store.traverse('bad-id', {});

      expect(result.entities).toEqual([]);
      expect(result.relationships).toEqual([]);
    });
  });
});

// =========================================================================
// PrismaSessionContextStore Tests
// =========================================================================

describe('PrismaSessionContextStore', () => {
  let store: PrismaSessionContextStore;

  const makeCtxRecord = (overrides: Record<string, unknown> = {}) => ({
    id: 'ctx-1',
    userId: 'user-1',
    courseId: 'course-1',
    lastActiveAt: NOW,
    currentState: { mood: 'focused' },
    history: [],
    preferences: { theme: 'dark' },
    insights: { streakDays: 5 },
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    store = createPrismaSessionContextStore();
  });

  describe('get', () => {
    it('returns session context for user and course', async () => {
      mockCtxFindFirst.mockResolvedValue(makeCtxRecord());

      const result = await store.get('user-1', 'course-1');

      expect(result).not.toBeNull();
      expect(result?.userId).toBe('user-1');
    });

    it('returns null when not found', async () => {
      mockCtxFindFirst.mockResolvedValue(null);

      const result = await store.get('user-1');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates a session context', async () => {
      mockCtxCreate.mockResolvedValue(makeCtxRecord());

      const result = await store.create({
        userId: 'user-1',
        courseId: 'course-1',
        lastActiveAt: NOW,
        currentState: { mood: 'focused' } as never,
        history: [],
        preferences: { theme: 'dark' } as never,
        insights: { streakDays: 5 } as never,
      });

      expect(result.id).toBe('ctx-1');
    });
  });

  describe('update', () => {
    it('updates session context fields', async () => {
      mockCtxUpdate.mockResolvedValue(
        makeCtxRecord({ currentState: { mood: 'tired' } })
      );

      const result = await store.update('ctx-1', {
        currentState: { mood: 'tired' } as never,
      });

      expect(result.currentState).toEqual({ mood: 'tired' });
    });
  });

  describe('delete', () => {
    it('returns true on successful deletion', async () => {
      mockCtxDelete.mockResolvedValue({ id: 'ctx-1' });

      const result = await store.delete('ctx-1');

      expect(result).toBe(true);
    });

    it('returns false on failure', async () => {
      mockCtxDelete.mockRejectedValue(new Error('Not found'));

      const result = await store.delete('bad-id');

      expect(result).toBe(false);
    });
  });

  describe('addHistoryEntry', () => {
    it('appends a history entry and updates lastActiveAt', async () => {
      mockCtxFindUnique.mockResolvedValue(makeCtxRecord({ history: [] }));
      mockCtxUpdate.mockResolvedValue(makeCtxRecord());

      await store.addHistoryEntry('ctx-1', {
        type: 'page_view' as never,
        data: { url: '/course/1' },
      });

      expect(mockCtxUpdate).toHaveBeenCalledTimes(1);
      const updateCall = mockCtxUpdate.mock.calls[0][0];
      expect(updateCall.data.history).toHaveLength(1);
      expect(updateCall.data.lastActiveAt).toBeInstanceOf(Date);
    });

    it('throws when session context not found', async () => {
      mockCtxFindUnique.mockResolvedValue(null);

      await expect(
        store.addHistoryEntry('bad-id', { type: 'x' as never, data: {} })
      ).rejects.toThrow('Session context not found');
    });
  });

  describe('getRecentHistory', () => {
    it('returns last N history entries in reverse order', async () => {
      const history = [
        { type: 'a', data: {}, timestamp: new Date('2026-01-01') },
        { type: 'b', data: {}, timestamp: new Date('2026-01-02') },
        { type: 'c', data: {}, timestamp: new Date('2026-01-03') },
      ];
      mockCtxFindUnique.mockResolvedValue(makeCtxRecord({ history }));

      const result = await store.getRecentHistory('ctx-1', 2);

      expect(result).toHaveLength(2);
      // slice(-2) => [b, c], reverse => [c, b]
      expect(result[0].type).toBe('c');
      expect(result[1].type).toBe('b');
    });

    it('returns empty array when session context not found', async () => {
      mockCtxFindUnique.mockResolvedValue(null);

      const result = await store.getRecentHistory('bad-id', 5);

      expect(result).toEqual([]);
    });
  });
});
