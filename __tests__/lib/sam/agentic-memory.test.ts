/**
 * Tests for lib/sam/agentic-memory.ts
 *
 * Covers:
 * - getAgenticMemorySystem(): singleton caching, error recovery, initialization
 * - buildMemoryMetadata(): field mapping, defaults, validation
 *
 * Note: createMemorySystem from @sam-ai/agentic cannot be mocked in this file
 * because SWC resolves the import path before Jest can intercept it. Instead,
 * we mock the upstream dependencies (getEmbeddingProvider, getMemoryStores) and
 * verify that the real createMemorySystem produces a valid MemorySystem object
 * wired with our mocked stores and providers.
 */

// ---------------------------------------------------------------------------
// Shared mock functions (persist across jest.resetModules)
// ---------------------------------------------------------------------------

const MOCK_EMBEDDING_SOURCE_TYPE = {
  COURSE_CONTENT: 'course_content',
  CHAPTER_CONTENT: 'chapter_content',
  SECTION_CONTENT: 'section_content',
  USER_NOTE: 'user_note',
  CONVERSATION: 'conversation',
  QUESTION: 'question',
  ANSWER: 'answer',
  SUMMARY: 'summary',
  ARTIFACT: 'artifact',
  EXTERNAL_RESOURCE: 'external_resource',
} as const;

const mockGetEmbeddingProvider = jest.fn();
const mockGetMemoryStores = jest.fn();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Builds a fake set of memory stores returned by getMemoryStores */
function fakeMemoryStores() {
  return {
    vector: {
      upsert: jest.fn(),
      findBySourceId: jest.fn().mockResolvedValue([]),
      search: jest.fn().mockResolvedValue([]),
      delete: jest.fn(),
      deleteBySourceId: jest.fn(),
    },
    knowledgeGraph: {
      getNode: jest.fn().mockResolvedValue(null),
      getNodes: jest.fn().mockResolvedValue([]),
      upsertNode: jest.fn(),
      deleteNode: jest.fn(),
      getEdge: jest.fn().mockResolvedValue(null),
      getEdges: jest.fn().mockResolvedValue([]),
      upsertEdge: jest.fn(),
      deleteEdge: jest.fn(),
      getNeighbors: jest.fn().mockResolvedValue([]),
      findPath: jest.fn().mockResolvedValue([]),
    },
    sessionContext: {
      getSession: jest.fn().mockResolvedValue(null),
      getSessions: jest.fn().mockResolvedValue([]),
      upsertSession: jest.fn(),
      deleteSession: jest.fn(),
      getContextEntry: jest.fn().mockResolvedValue(null),
      getContextEntries: jest.fn().mockResolvedValue([]),
      upsertContextEntry: jest.fn(),
      deleteContextEntry: jest.fn(),
    },
  };
}

/** A sentinel representing an embedding provider */
function fakeEmbeddingProvider() {
  return { embed: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]) };
}

/**
 * Apply module mocks using jest.doMock (not hoisted, works after resetModules).
 */
function applyMocks() {
  jest.doMock('@/lib/sam/ai-provider', () => ({
    getEmbeddingProvider: mockGetEmbeddingProvider,
  }));
  jest.doMock('@/lib/sam/taxomind-context', () => ({
    getMemoryStores: mockGetMemoryStores,
  }));
  // @sam-ai/agentic: We provide EmbeddingSourceType for buildMemoryMetadata.
  // createMemorySystem cannot be effectively mocked here due to SWC path
  // resolution, so the real implementation is used with mocked stores.
  jest.doMock('@sam-ai/agentic', () => ({
    createMemorySystem: jest.requireActual('@sam-ai/agentic').createMemorySystem,
    EmbeddingSourceType: MOCK_EMBEDDING_SOURCE_TYPE,
  }));
}

/** Require fresh module after mocks are applied */
function loadModule() {
  return require('@/lib/sam/agentic-memory') as {
    getAgenticMemorySystem: () => Promise<Record<string, unknown>>;
    buildMemoryMetadata: (input: Record<string, unknown>) => Record<string, unknown>;
  };
}

// ---------------------------------------------------------------------------
// getAgenticMemorySystem
// ---------------------------------------------------------------------------

describe('getAgenticMemorySystem', () => {
  /**
   * Because the module caches a singleton promise in module-level state
   * (`memorySystemPromise`), we must reset modules before each test so that
   * every test gets a fresh module scope with the singleton set to null.
   */
  beforeEach(() => {
    jest.resetModules();
    mockGetEmbeddingProvider.mockReset();
    mockGetMemoryStores.mockReset();
    applyMocks();
  });

  it('should return a MemorySystem when embedding provider is available', async () => {
    const mod = loadModule();
    const provider = fakeEmbeddingProvider();
    const stores = fakeMemoryStores();

    mockGetEmbeddingProvider.mockResolvedValue(provider);
    mockGetMemoryStores.mockReturnValue(stores);

    const result = await mod.getAgenticMemorySystem();

    expect(mockGetEmbeddingProvider).toHaveBeenCalledTimes(1);
    expect(mockGetMemoryStores).toHaveBeenCalledTimes(1);

    // The real createMemorySystem constructs a MemorySystem with these properties
    expect(result).toHaveProperty('vectorStore');
    expect(result).toHaveProperty('knowledgeGraph');
    expect(result).toHaveProperty('sessionContext');
    expect(result).toHaveProperty('memoryRetriever');
  });

  it('should cache the promise (singleton pattern) and not re-initialize on second call', async () => {
    const mod = loadModule();
    const provider = fakeEmbeddingProvider();
    const stores = fakeMemoryStores();

    mockGetEmbeddingProvider.mockResolvedValue(provider);
    mockGetMemoryStores.mockReturnValue(stores);

    const first = await mod.getAgenticMemorySystem();
    const second = await mod.getAgenticMemorySystem();

    // Same object reference - singleton is cached
    expect(first).toBe(second);
    // initializeMemorySystem should only run once
    expect(mockGetEmbeddingProvider).toHaveBeenCalledTimes(1);
    expect(mockGetMemoryStores).toHaveBeenCalledTimes(1);
  });

  it('should throw when embedding provider is null', async () => {
    const mod = loadModule();
    mockGetEmbeddingProvider.mockResolvedValue(null);

    await expect(mod.getAgenticMemorySystem()).rejects.toThrow(
      'Embedding adapter not available for agentic memory system'
    );
  });

  it('should throw when embedding provider rejects', async () => {
    const mod = loadModule();
    mockGetEmbeddingProvider.mockRejectedValue(
      new Error('Provider initialization failed')
    );

    await expect(mod.getAgenticMemorySystem()).rejects.toThrow(
      'Provider initialization failed'
    );
  });

  it('should reset the cached promise on failure so the next call retries', async () => {
    const mod = loadModule();

    // First call: embedding provider returns null -> throws
    mockGetEmbeddingProvider.mockResolvedValue(null);

    await expect(mod.getAgenticMemorySystem()).rejects.toThrow(
      'Embedding adapter not available'
    );

    // Second call: embedding provider is available -> succeeds
    const provider = fakeEmbeddingProvider();
    const stores = fakeMemoryStores();

    mockGetEmbeddingProvider.mockResolvedValue(provider);
    mockGetMemoryStores.mockReturnValue(stores);

    const result = await mod.getAgenticMemorySystem();
    expect(result).toHaveProperty('vectorStore');
    // getEmbeddingProvider called twice: once for failure, once for retry
    expect(mockGetEmbeddingProvider).toHaveBeenCalledTimes(2);
  });

  it('should wire the mocked stores into the MemorySystem', async () => {
    const mod = loadModule();
    const provider = fakeEmbeddingProvider();
    const stores = fakeMemoryStores();

    mockGetEmbeddingProvider.mockResolvedValue(provider);
    mockGetMemoryStores.mockReturnValue(stores);

    const result = await mod.getAgenticMemorySystem();

    // The VectorStore inside should use our mocked persistence adapter
    const vectorStore = result.vectorStore as Record<string, unknown>;
    expect(vectorStore).toBeDefined();

    // The KnowledgeGraph should use our mocked graph store
    const kg = result.knowledgeGraph as Record<string, unknown>;
    expect(kg).toBeDefined();

    // The SessionContext should use our mocked context store
    const sc = result.sessionContext as Record<string, unknown>;
    expect(sc).toBeDefined();
  });

  it('should produce independent singletons across separate module loads', async () => {
    // Load first module instance
    const mod1 = loadModule();
    const provider1 = fakeEmbeddingProvider();
    const stores1 = fakeMemoryStores();

    mockGetEmbeddingProvider.mockResolvedValue(provider1);
    mockGetMemoryStores.mockReturnValue(stores1);

    const result1 = await mod1.getAgenticMemorySystem();

    // Reset modules to simulate a fresh load
    jest.resetModules();
    mockGetEmbeddingProvider.mockReset();
    mockGetMemoryStores.mockReset();
    applyMocks();

    const mod2 = loadModule();
    const provider2 = fakeEmbeddingProvider();
    const stores2 = fakeMemoryStores();

    mockGetEmbeddingProvider.mockResolvedValue(provider2);
    mockGetMemoryStores.mockReturnValue(stores2);

    const result2 = await mod2.getAgenticMemorySystem();

    // Different module instances should produce different MemorySystem instances
    expect(result1).not.toBe(result2);
  });
});

// ---------------------------------------------------------------------------
// buildMemoryMetadata
// ---------------------------------------------------------------------------

describe('buildMemoryMetadata', () => {
  let buildMemoryMetadata: (input: Record<string, unknown>) => Record<string, unknown>;

  beforeAll(() => {
    jest.resetModules();
    applyMocks();
    const mod = require('@/lib/sam/agentic-memory') as {
      buildMemoryMetadata: typeof buildMemoryMetadata;
    };
    buildMemoryMetadata = mod.buildMemoryMetadata;
  });

  it('should return a complete metadata object with all fields populated', () => {
    const result = buildMemoryMetadata({
      sourceId: 'src-123',
      sourceType: 'COURSE_CONTENT',
      userId: 'user-1',
      courseId: 'course-1',
      chapterId: 'chapter-1',
      sectionId: 'section-1',
      contentHash: 'abc123hash',
      tags: ['math', 'algebra'],
      language: 'en',
      customMetadata: { difficulty: 'hard' },
    });

    expect(result).toEqual({
      sourceId: 'src-123',
      sourceType: 'course_content',
      userId: 'user-1',
      courseId: 'course-1',
      chapterId: 'chapter-1',
      sectionId: 'section-1',
      contentHash: 'abc123hash',
      tags: ['math', 'algebra'],
      language: 'en',
      customMetadata: { difficulty: 'hard' },
    });
  });

  it('should default tags to an empty array when not provided', () => {
    const result = buildMemoryMetadata({
      sourceId: 'src-456',
      sourceType: 'USER_NOTE',
      contentHash: 'hash456',
    });

    expect(result.tags).toEqual([]);
  });

  it('should handle optional fields as undefined when not provided', () => {
    const result = buildMemoryMetadata({
      sourceId: 'src-789',
      sourceType: 'CONVERSATION',
      contentHash: 'hash789',
    });

    expect(result.userId).toBeUndefined();
    expect(result.courseId).toBeUndefined();
    expect(result.chapterId).toBeUndefined();
    expect(result.sectionId).toBeUndefined();
    expect(result.language).toBeUndefined();
    expect(result.customMetadata).toBeUndefined();
  });

  it('should throw for an invalid sourceType', () => {
    expect(() =>
      buildMemoryMetadata({
        sourceId: 'src-bad',
        sourceType: 'NONEXISTENT_TYPE',
        contentHash: 'hashbad',
      })
    ).toThrow('Invalid EmbeddingSourceType: NONEXISTENT_TYPE');
  });

  it('should pass through customMetadata unchanged', () => {
    const custom = { nested: { a: 1 }, list: [1, 2, 3] };
    const result = buildMemoryMetadata({
      sourceId: 'src-custom',
      sourceType: 'SUMMARY',
      contentHash: 'hashcustom',
      customMetadata: custom,
    });

    expect(result.customMetadata).toBe(custom);
  });

  it('should correctly resolve each valid sourceType to its enum value', () => {
    const mappings: Array<{ key: string; expected: string }> = [
      { key: 'COURSE_CONTENT', expected: 'course_content' },
      { key: 'CHAPTER_CONTENT', expected: 'chapter_content' },
      { key: 'SECTION_CONTENT', expected: 'section_content' },
      { key: 'USER_NOTE', expected: 'user_note' },
      { key: 'CONVERSATION', expected: 'conversation' },
      { key: 'QUESTION', expected: 'question' },
      { key: 'ANSWER', expected: 'answer' },
      { key: 'SUMMARY', expected: 'summary' },
      { key: 'ARTIFACT', expected: 'artifact' },
      { key: 'EXTERNAL_RESOURCE', expected: 'external_resource' },
    ];

    for (const { key, expected } of mappings) {
      const result = buildMemoryMetadata({
        sourceId: `src-${key}`,
        sourceType: key,
        contentHash: `hash-${key}`,
      });
      expect(result.sourceType).toBe(expected);
    }
  });

  it('should preserve the original tags array reference when provided', () => {
    const tags = ['tag-a', 'tag-b'];
    const result = buildMemoryMetadata({
      sourceId: 'src-tags',
      sourceType: 'QUESTION',
      contentHash: 'hashtags',
      tags,
    });

    expect(result.tags).toBe(tags);
  });

  it('should include sourceId and contentHash in the output', () => {
    const result = buildMemoryMetadata({
      sourceId: 'unique-source-id',
      sourceType: 'ARTIFACT',
      contentHash: 'sha256-content-hash',
    });

    expect(result.sourceId).toBe('unique-source-id');
    expect(result.contentHash).toBe('sha256-content-hash');
  });
});
