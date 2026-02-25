/**
 * PrismaInterventionStore Unit Tests
 *
 * Tests the InterventionStore adapter that bridges @sam-ai/agentic
 * InterventionStore interface to Prisma SAMAnalytics model.
 * Covers get, getByUser, create, update, recordResult, getHistory.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAnalyticsCreate = jest.fn();
const mockAnalyticsFindUnique = jest.fn();
const mockAnalyticsFindMany = jest.fn();
const mockAnalyticsUpdate = jest.fn();

const mockDb = {
  sAMAnalytics: {
    create: mockAnalyticsCreate,
    findUnique: mockAnalyticsFindUnique,
    findMany: mockAnalyticsFindMany,
    update: mockAnalyticsUpdate,
  },
};

jest.mock('@/lib/sam/stores/db-provider', () => ({
  getDb: () => mockDb,
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import {
  PrismaInterventionStore,
  createPrismaInterventionStore,
} from '@/lib/sam/stores/prisma-intervention-store';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const NOW = new Date('2026-02-20T14:00:00Z');

const makeAnalyticsRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'int-1',
  userId: 'user-1',
  metricType: 'INTERACTION_COUNT',
  metricValue: 0.75,
  period: 'DAILY',
  context: {
    marker: 'AI_INTERVENTION',
    type: 'encouragement',
    priority: 'high',
    message: 'Great progress on closures!',
    suggestedActions: [
      { label: 'Review closures', action: 'navigate', params: { url: '/closures' } },
    ],
    timing: { type: 'immediate' },
    executedAt: undefined,
    result: undefined,
  },
  recordedAt: NOW,
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PrismaInterventionStore', () => {
  let store: ReturnType<typeof createPrismaInterventionStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    store = createPrismaInterventionStore();
  });

  // -----------------------------------------------------------------------
  // get
  // -----------------------------------------------------------------------
  describe('get', () => {
    it('returns an intervention when found', async () => {
      mockAnalyticsFindUnique.mockResolvedValue(makeAnalyticsRecord());

      const result = await store.get('int-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('int-1');
      expect(result?.type).toBe('encouragement');
      expect(result?.priority).toBe('high');
      expect(result?.message).toBe('Great progress on closures!');
      expect(result?.createdAt).toEqual(NOW);
    });

    it('returns null when record not found', async () => {
      mockAnalyticsFindUnique.mockResolvedValue(null);

      const result = await store.get('nonexistent');

      expect(result).toBeNull();
    });

    it('returns null when record has no AI_INTERVENTION marker', async () => {
      mockAnalyticsFindUnique.mockResolvedValue(
        makeAnalyticsRecord({
          context: { marker: 'SOMETHING_ELSE' },
        })
      );

      const result = await store.get('int-1');

      expect(result).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // getByUser
  // -----------------------------------------------------------------------
  describe('getByUser', () => {
    it('returns all interventions for a user', async () => {
      mockAnalyticsFindMany.mockResolvedValue([
        makeAnalyticsRecord(),
        makeAnalyticsRecord({ id: 'int-2' }),
      ]);

      const results = await store.getByUser('user-1');

      expect(results).toHaveLength(2);
    });

    it('filters to pending interventions (no executedAt)', async () => {
      mockAnalyticsFindMany.mockResolvedValue([
        makeAnalyticsRecord(), // no executedAt
        makeAnalyticsRecord({
          id: 'int-2',
          context: {
            ...makeAnalyticsRecord().context,
            executedAt: NOW.toISOString(),
          },
        }),
      ]);

      const results = await store.getByUser('user-1', true);

      expect(results).toHaveLength(1);
      expect(results[0].executedAt).toBeUndefined();
    });

    it('filters to executed interventions', async () => {
      mockAnalyticsFindMany.mockResolvedValue([
        makeAnalyticsRecord({
          context: {
            ...makeAnalyticsRecord().context,
            executedAt: NOW.toISOString(),
          },
        }),
      ]);

      const results = await store.getByUser('user-1', false);

      expect(results).toHaveLength(1);
      expect(results[0].executedAt).toBeDefined();
    });
  });

  // -----------------------------------------------------------------------
  // create
  // -----------------------------------------------------------------------
  describe('create', () => {
    it('creates an intervention and returns mapped result', async () => {
      mockAnalyticsCreate.mockResolvedValue(makeAnalyticsRecord());

      const result = await store.create(
        {
          type: 'encouragement' as never,
          priority: 'high',
          message: 'Great progress on closures!',
          suggestedActions: [],
          timing: { type: 'immediate' } as never,
        },
        'user-1'
      );

      expect(mockAnalyticsCreate).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('int-1');
      expect(result.type).toBe('encouragement');

      const callData = mockAnalyticsCreate.mock.calls[0][0].data;
      expect(callData.userId).toBe('user-1');
      expect(callData.metricType).toBe('INTERACTION_COUNT');
      expect(callData.metricValue).toBe(0.75); // high priority -> 0.75
    });

    it('throws when userId is not provided', async () => {
      await expect(
        store.create(
          {
            type: 'encouragement' as never,
            priority: 'medium',
            message: 'Test',
            suggestedActions: [],
            timing: { type: 'immediate' } as never,
          },
          undefined
        )
      ).rejects.toThrow('userId is required');
    });

    it('maps priority values correctly', async () => {
      const priorities: Array<{ input: string; expected: number }> = [
        { input: 'low', expected: 0.25 },
        { input: 'medium', expected: 0.5 },
        { input: 'high', expected: 0.75 },
        { input: 'critical', expected: 1.0 },
      ];

      for (const { input, expected } of priorities) {
        mockAnalyticsCreate.mockResolvedValue(
          makeAnalyticsRecord({ metricValue: expected })
        );

        await store.create(
          {
            type: 'encouragement' as never,
            priority: input as 'low' | 'medium' | 'high' | 'critical',
            message: 'Test',
            suggestedActions: [],
            timing: { type: 'immediate' } as never,
          },
          'user-1'
        );

        const callData = mockAnalyticsCreate.mock.calls.at(-1)?.[0].data;
        expect(callData.metricValue).toBe(expected);
      }
    });
  });

  // -----------------------------------------------------------------------
  // update
  // -----------------------------------------------------------------------
  describe('update', () => {
    it('updates intervention fields and persists to DB', async () => {
      mockAnalyticsFindUnique.mockResolvedValue(makeAnalyticsRecord());
      mockAnalyticsUpdate.mockResolvedValue(
        makeAnalyticsRecord({
          context: {
            ...makeAnalyticsRecord().context,
            message: 'Updated message',
          },
        })
      );

      const result = await store.update('int-1', { message: 'Updated message' });

      expect(mockAnalyticsUpdate).toHaveBeenCalledTimes(1);
      expect(result.message).toBe('Updated message');
    });

    it('throws when intervention is not found', async () => {
      mockAnalyticsFindUnique.mockResolvedValue(null);

      await expect(store.update('bad-id', { message: 'x' })).rejects.toThrow(
        'Intervention not found: bad-id'
      );
    });
  });

  // -----------------------------------------------------------------------
  // recordResult
  // -----------------------------------------------------------------------
  describe('recordResult', () => {
    it('records the result of an intervention', async () => {
      mockAnalyticsFindUnique.mockResolvedValue(makeAnalyticsRecord());
      mockAnalyticsUpdate.mockResolvedValue(makeAnalyticsRecord());

      await store.recordResult('int-1', {
        accepted: true,
        feedback: 'Very helpful!',
      } as never);

      expect(mockAnalyticsUpdate).toHaveBeenCalledTimes(1);
      const callData = mockAnalyticsUpdate.mock.calls[0][0].data.context;
      expect(callData.result).toEqual({
        accepted: true,
        feedback: 'Very helpful!',
      });
    });

    it('throws when intervention is not found', async () => {
      mockAnalyticsFindUnique.mockResolvedValue(null);

      await expect(
        store.recordResult('bad-id', { accepted: false } as never)
      ).rejects.toThrow('Intervention not found: bad-id');
    });
  });

  // -----------------------------------------------------------------------
  // getHistory
  // -----------------------------------------------------------------------
  describe('getHistory', () => {
    it('returns executed interventions with limit', async () => {
      mockAnalyticsFindMany.mockResolvedValue([
        makeAnalyticsRecord({
          context: {
            ...makeAnalyticsRecord().context,
            executedAt: NOW.toISOString(),
          },
        }),
        makeAnalyticsRecord({
          id: 'int-2',
          context: {
            ...makeAnalyticsRecord().context,
            executedAt: NOW.toISOString(),
          },
        }),
      ]);

      const results = await store.getHistory('user-1', 1);

      expect(results).toHaveLength(1);
    });
  });

  // -----------------------------------------------------------------------
  // Error handling
  // -----------------------------------------------------------------------
  describe('error handling', () => {
    it('propagates DB errors on create', async () => {
      mockAnalyticsCreate.mockRejectedValue(new Error('DB error'));

      await expect(
        store.create(
          {
            type: 'encouragement' as never,
            priority: 'medium',
            message: 'Test',
            suggestedActions: [],
            timing: { type: 'immediate' } as never,
          },
          'user-1'
        )
      ).rejects.toThrow('DB error');
    });
  });
});
