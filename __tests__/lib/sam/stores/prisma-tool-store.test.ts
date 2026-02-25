/**
 * PrismaToolStore Unit Tests
 *
 * Tests the ToolStore adapter that bridges @sam-ai/agentic ToolStore interface
 * to Prisma AgentTool model with an in-memory registry cache.
 * Covers register, get, list (with filters), update, delete, enable/disable.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUpsert = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();

const mockDb = {
  agentTool: {
    upsert: mockUpsert,
    update: mockUpdate,
    delete: mockDelete,
  },
};

jest.mock('@/lib/sam/stores/db-provider', () => ({
  getDb: () => mockDb,
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import {
  PrismaToolStore,
  createPrismaToolStore,
  getToolRegistryCache,
} from '@/lib/sam/stores/prisma-tool-store';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const makeToolDef = (overrides: Record<string, unknown> = {}) => ({
  id: 'tool-search',
  name: 'Search',
  description: 'Search the knowledge base',
  category: 'knowledge' as const,
  version: '1.0.0',
  inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
  outputSchema: { type: 'object', properties: { results: { type: 'array' } } },
  handler: jest.fn(),
  requiredPermissions: ['read'],
  confirmationType: 'none' as const,
  timeoutMs: 5000,
  maxRetries: 2,
  tags: ['search', 'knowledge'],
  enabled: true,
  deprecated: false,
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PrismaToolStore', () => {
  let store: PrismaToolStore;

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the in-memory tool registry between tests
    getToolRegistryCache().clear();
    store = createPrismaToolStore();
  });

  // -----------------------------------------------------------------------
  // register
  // -----------------------------------------------------------------------
  describe('register', () => {
    it('registers a tool in memory and persists to DB via upsert', async () => {
      mockUpsert.mockResolvedValue({ id: 'tool-search' });
      const tool = makeToolDef();

      await store.register(tool);

      expect(mockUpsert).toHaveBeenCalledTimes(1);
      const cached = await store.get('tool-search');
      expect(cached).not.toBeNull();
      expect(cached?.name).toBe('Search');
    });

    it('overwrites existing tool on re-register', async () => {
      mockUpsert.mockResolvedValue({ id: 'tool-search' });

      await store.register(makeToolDef());
      await store.register(makeToolDef({ description: 'Updated search' }));

      const cached = await store.get('tool-search');
      expect(cached?.description).toBe('Updated search');
      expect(mockUpsert).toHaveBeenCalledTimes(2);
    });
  });

  // -----------------------------------------------------------------------
  // get
  // -----------------------------------------------------------------------
  describe('get', () => {
    it('returns tool from in-memory registry', async () => {
      mockUpsert.mockResolvedValue({});
      await store.register(makeToolDef());

      const result = await store.get('tool-search');

      expect(result?.id).toBe('tool-search');
    });

    it('returns null for unregistered tool', async () => {
      const result = await store.get('nonexistent');

      expect(result).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // list (with filters)
  // -----------------------------------------------------------------------
  describe('list', () => {
    beforeEach(async () => {
      mockUpsert.mockResolvedValue({});
      await store.register(makeToolDef({ id: 'tool-1', name: 'Search', category: 'knowledge', tags: ['search'], enabled: true }));
      await store.register(makeToolDef({ id: 'tool-2', name: 'Calculator', category: 'math', tags: ['calc'], enabled: false }));
      await store.register(makeToolDef({ id: 'tool-3', name: 'Search Pro', category: 'knowledge', tags: ['search', 'pro'], enabled: true, deprecated: true }));
    });

    it('returns all tools when no options provided', async () => {
      const results = await store.list();
      expect(results).toHaveLength(3);
    });

    it('filters by category', async () => {
      const results = await store.list({ category: 'knowledge' });
      expect(results).toHaveLength(2);
    });

    it('filters by tags', async () => {
      const results = await store.list({ tags: ['pro'] });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('tool-3');
    });

    it('filters by enabled', async () => {
      const results = await store.list({ enabled: true });
      expect(results).toHaveLength(2);
    });

    it('filters by deprecated', async () => {
      const results = await store.list({ deprecated: true });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('tool-3');
    });

    it('filters by search text', async () => {
      const results = await store.list({ search: 'calculator' });
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('tool-2');
    });

    it('applies offset and limit', async () => {
      const results = await store.list({ offset: 1, limit: 1 });
      expect(results).toHaveLength(1);
    });
  });

  // -----------------------------------------------------------------------
  // update
  // -----------------------------------------------------------------------
  describe('update', () => {
    it('updates tool in memory and persists to DB', async () => {
      mockUpsert.mockResolvedValue({});
      mockUpdate.mockResolvedValue({ id: 'tool-search' });
      await store.register(makeToolDef());

      const result = await store.update('tool-search', {
        description: 'Enhanced search',
        version: '2.0.0',
      });

      expect(result.description).toBe('Enhanced search');
      expect(result.version).toBe('2.0.0');
      expect(result.id).toBe('tool-search'); // ID cannot change
      expect(mockUpdate).toHaveBeenCalledTimes(1);
    });

    it('throws when tool is not found', async () => {
      await expect(
        store.update('nonexistent', { description: 'x' })
      ).rejects.toThrow('Tool not found: nonexistent');
    });
  });

  // -----------------------------------------------------------------------
  // delete
  // -----------------------------------------------------------------------
  describe('delete', () => {
    it('removes tool from memory and DB', async () => {
      mockUpsert.mockResolvedValue({});
      mockDelete.mockResolvedValue({ id: 'tool-search' });
      await store.register(makeToolDef());

      await store.delete('tool-search');

      const cached = await store.get('tool-search');
      expect(cached).toBeNull();
      expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'tool-search' } });
    });
  });

  // -----------------------------------------------------------------------
  // enable / disable
  // -----------------------------------------------------------------------
  describe('enable / disable', () => {
    beforeEach(async () => {
      mockUpsert.mockResolvedValue({});
      mockUpdate.mockResolvedValue({});
    });

    it('enable sets tool.enabled to true in memory and DB', async () => {
      await store.register(makeToolDef({ enabled: false }));

      await store.enable('tool-search');

      const tool = await store.get('tool-search');
      expect(tool?.enabled).toBe(true);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'tool-search' },
        data: { enabled: true },
      });
    });

    it('disable sets tool.enabled to false in memory and DB', async () => {
      await store.register(makeToolDef({ enabled: true }));

      await store.disable('tool-search');

      const tool = await store.get('tool-search');
      expect(tool?.enabled).toBe(false);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'tool-search' },
        data: { enabled: false },
      });
    });

    it('enable works even when tool is not in memory registry', async () => {
      // Tool only in DB, not in memory
      await store.enable('tool-db-only');

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'tool-db-only' },
        data: { enabled: true },
      });
    });
  });

  // -----------------------------------------------------------------------
  // Error handling
  // -----------------------------------------------------------------------
  describe('error handling', () => {
    it('propagates DB error on register', async () => {
      mockUpsert.mockRejectedValue(new Error('Unique constraint'));

      await expect(store.register(makeToolDef())).rejects.toThrow('Unique constraint');
    });

    it('propagates DB error on delete', async () => {
      mockUpsert.mockResolvedValue({});
      await store.register(makeToolDef());
      mockDelete.mockRejectedValue(new Error('FK constraint'));

      await expect(store.delete('tool-search')).rejects.toThrow('FK constraint');
    });
  });
});
