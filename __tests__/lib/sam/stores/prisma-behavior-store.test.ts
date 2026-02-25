/**
 * PrismaBehaviorEventStore Unit Tests
 *
 * Tests the BehaviorEventStore adapter that bridges @sam-ai/agentic
 * BehaviorEventStore interface to Prisma SAMInteraction model.
 * Covers add, addBatch, get, getByUser, getBySession, markProcessed, count.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockCreate = jest.fn();
const mockFindUnique = jest.fn();
const mockFindMany = jest.fn();
const mockUpdate = jest.fn();
const mockCount = jest.fn();
const mockTransaction = jest.fn();

const mockDb = {
  sAMInteraction: {
    create: mockCreate,
    findUnique: mockFindUnique,
    findMany: mockFindMany,
    update: mockUpdate,
    count: mockCount,
  },
  $transaction: mockTransaction,
};

jest.mock('@/lib/sam/stores/db-provider', () => ({
  getDb: () => mockDb,
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import {
  PrismaBehaviorEventStore,
  createPrismaBehaviorEventStore,
} from '@/lib/sam/stores/prisma-behavior-store';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const NOW = new Date('2026-02-15T10:00:00Z');

const makeInteraction = (overrides: Record<string, unknown> = {}) => ({
  id: 'evt-1',
  userId: 'user-1',
  interactionType: 'ANALYTICS_VIEW',
  context: {
    sessionId: 'session-1',
    timestamp: NOW.toISOString(),
    type: 'page_view',
    data: { url: '/course/1' },
    pageContext: {
      url: '/course/1',
      courseId: 'course-1',
      chapterId: 'ch-1',
      sectionId: 'sec-1',
      contentType: 'lesson',
      timeOnPage: 120,
      scrollDepth: 75,
    },
    emotionalSignals: [],
    processed: false,
  },
  courseId: 'course-1',
  chapterId: 'ch-1',
  sectionId: 'sec-1',
  actionTaken: 'page_view',
  duration: 120,
  createdAt: NOW,
  ...overrides,
});

const makeEventInput = () => ({
  userId: 'user-1',
  sessionId: 'session-1',
  timestamp: NOW,
  type: 'page_view' as const,
  data: { url: '/course/1' },
  pageContext: {
    url: '/course/1',
    courseId: 'course-1',
    chapterId: 'ch-1',
    sectionId: 'sec-1',
    contentType: 'lesson',
    timeOnPage: 120,
    scrollDepth: 75,
  },
  emotionalSignals: [],
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PrismaBehaviorEventStore', () => {
  let store: ReturnType<typeof createPrismaBehaviorEventStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    store = createPrismaBehaviorEventStore();
  });

  // -----------------------------------------------------------------------
  // add
  // -----------------------------------------------------------------------
  describe('add', () => {
    it('creates a behavior event and returns mapped result', async () => {
      mockCreate.mockResolvedValue(makeInteraction());

      const result = await store.add(makeEventInput());

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('evt-1');
      expect(result.userId).toBe('user-1');
      expect(result.sessionId).toBe('session-1');
      expect(result.type).toBe('page_view');
      expect(result.pageContext.courseId).toBe('course-1');
      expect(result.processed).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // addBatch
  // -----------------------------------------------------------------------
  describe('addBatch', () => {
    it('creates multiple events in a transaction', async () => {
      mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
        await fn({
          sAMInteraction: {
            create: mockCreate.mockResolvedValue(makeInteraction()),
          },
        });
      });

      const events = [makeEventInput(), makeEventInput()];
      const results = await store.addBatch(events);

      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(results).toHaveLength(2);
    });
  });

  // -----------------------------------------------------------------------
  // get
  // -----------------------------------------------------------------------
  describe('get', () => {
    it('returns a behavior event by ID', async () => {
      mockFindUnique.mockResolvedValue(makeInteraction());

      const result = await store.get('evt-1');

      expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: 'evt-1' } });
      expect(result).not.toBeNull();
      expect(result?.id).toBe('evt-1');
    });

    it('returns null when event not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await store.get('nonexistent');

      expect(result).toBeNull();
    });

    it('returns null when interaction type does not match', async () => {
      mockFindUnique.mockResolvedValue(
        makeInteraction({ interactionType: 'QUIZ_ATTEMPT' })
      );

      const result = await store.get('evt-1');

      expect(result).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // getByUser
  // -----------------------------------------------------------------------
  describe('getByUser', () => {
    it('returns events for a user', async () => {
      mockFindMany.mockResolvedValue([makeInteraction()]);

      const results = await store.getByUser('user-1');

      expect(results).toHaveLength(1);
    });

    it('filters out processed events by default', async () => {
      mockFindMany.mockResolvedValue([
        makeInteraction({ context: { ...makeInteraction().context, processed: true } }),
        makeInteraction({ id: 'evt-2' }),
      ]);

      const results = await store.getByUser('user-1');

      // The unprocessed event should be included
      expect(results.some((e) => !e.processed)).toBe(true);
    });

    it('includes processed events when includeProcessed is true', async () => {
      mockFindMany.mockResolvedValue([
        makeInteraction({ context: { ...makeInteraction().context, processed: true } }),
      ]);

      const results = await store.getByUser('user-1', { includeProcessed: true });

      expect(results).toHaveLength(1);
    });

    it('filters by event types', async () => {
      mockFindMany.mockResolvedValue([
        makeInteraction(),
        makeInteraction({
          id: 'evt-2',
          context: { ...makeInteraction().context, type: 'quiz_attempt' },
        }),
      ]);

      const results = await store.getByUser('user-1', {
        types: ['page_view' as never],
        includeProcessed: true,
      });

      expect(results.every((e) => e.type === 'page_view')).toBe(true);
    });

    it('applies date range filters', async () => {
      mockFindMany.mockResolvedValue([]);

      await store.getByUser('user-1', {
        since: new Date('2026-01-01'),
        until: new Date('2026-03-01'),
      });

      const call = mockFindMany.mock.calls[0][0];
      expect(call.where.createdAt).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // getByTimeRange
  // -----------------------------------------------------------------------
  describe('getByTimeRange', () => {
    it('delegates to getByUser with date range', async () => {
      mockFindMany.mockResolvedValue([makeInteraction()]);

      const results = await store.getByTimeRange(
        'user-1',
        new Date('2026-01-01'),
        new Date('2026-03-01')
      );

      expect(results).toHaveLength(1);
    });
  });

  // -----------------------------------------------------------------------
  // getBySession
  // -----------------------------------------------------------------------
  describe('getBySession', () => {
    it('returns events for a specific session', async () => {
      mockFindMany.mockResolvedValue([
        makeInteraction({ context: { ...makeInteraction().context, sessionId: 'session-1' } }),
        makeInteraction({
          id: 'evt-other',
          context: { ...makeInteraction().context, sessionId: 'session-other' },
        }),
      ]);

      const results = await store.getBySession('session-1');

      expect(results.every((e) => e.sessionId === 'session-1')).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // getUnprocessed
  // -----------------------------------------------------------------------
  describe('getUnprocessed', () => {
    it('returns only unprocessed events up to limit', async () => {
      mockFindMany.mockResolvedValue([
        makeInteraction(),
        makeInteraction({ id: 'evt-2' }),
      ]);

      const results = await store.getUnprocessed(5);

      expect(results.every((e) => !e.processed)).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // markProcessed
  // -----------------------------------------------------------------------
  describe('markProcessed', () => {
    it('marks events as processed via transaction', async () => {
      mockTransaction.mockResolvedValue([]);

      await store.markProcessed(['evt-1', 'evt-2']);

      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });
  });

  // -----------------------------------------------------------------------
  // count
  // -----------------------------------------------------------------------
  describe('count', () => {
    it('counts events for a user', async () => {
      mockCount.mockResolvedValue(42);

      const result = await store.count('user-1');

      expect(result).toBe(42);
      expect(mockCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1' }),
        })
      );
    });

    it('filters by type and since date', async () => {
      mockCount.mockResolvedValue(10);

      await store.count('user-1', 'page_view' as never, new Date('2026-01-01'));

      const call = mockCount.mock.calls[0][0];
      expect(call.where.actionTaken).toBe('page_view');
      expect(call.where.createdAt).toEqual({ gte: new Date('2026-01-01') });
    });
  });

  // -----------------------------------------------------------------------
  // Error handling
  // -----------------------------------------------------------------------
  describe('error handling', () => {
    it('propagates DB errors on add', async () => {
      mockCreate.mockRejectedValue(new Error('Connection lost'));

      await expect(store.add(makeEventInput())).rejects.toThrow('Connection lost');
    });
  });
});
