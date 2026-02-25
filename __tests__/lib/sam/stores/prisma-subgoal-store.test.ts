/**
 * PrismaSubGoalStore Unit Tests
 *
 * Tests the SubGoalStore adapter that bridges @sam-ai/agentic SubGoalStore
 * interface to Prisma SAMSubGoal model. Covers create, createMany, get,
 * getByGoal, update, delete, deleteByGoal, and status transitions
 * (markComplete, markFailed, markSkipped).
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockCreate = jest.fn();
const mockFindUnique = jest.fn();
const mockFindMany = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockDeleteMany = jest.fn();
const mockTransaction = jest.fn();

const mockDb = {
  sAMSubGoal: {
    create: mockCreate,
    findUnique: mockFindUnique,
    findMany: mockFindMany,
    update: mockUpdate,
    delete: mockDelete,
    deleteMany: mockDeleteMany,
  },
  $transaction: mockTransaction,
};

jest.mock('@/lib/sam/stores/db-provider', () => ({
  getDb: () => mockDb,
}));

jest.mock('@prisma/client', () => ({
  Prisma: {
    SAMSubGoalWhereInput: {},
  },
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import {
  PrismaSubGoalStore,
  createPrismaSubGoalStore,
} from '@/lib/sam/stores/prisma-subgoal-store';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const NOW = new Date('2026-02-10T08:00:00Z');

const makePrismaSubGoal = (overrides: Record<string, unknown> = {}) => ({
  id: 'sg-1',
  goalId: 'goal-1',
  title: 'Learn closures',
  description: 'Understand JavaScript closures',
  type: 'LEARN',
  order: 0,
  estimatedMinutes: 45,
  difficulty: 'MEDIUM',
  prerequisites: ['sg-0'],
  successCriteria: ['Explain closures', 'Write closure examples'],
  status: 'PENDING',
  completedAt: null,
  metadata: { source: 'ai-generated' },
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PrismaSubGoalStore', () => {
  let store: PrismaSubGoalStore;

  beforeEach(() => {
    jest.clearAllMocks();
    store = createPrismaSubGoalStore();
  });

  // -----------------------------------------------------------------------
  // create
  // -----------------------------------------------------------------------
  describe('create', () => {
    it('creates a sub-goal with mapped enum values', async () => {
      mockCreate.mockResolvedValue(makePrismaSubGoal());

      const result = await store.create({
        goalId: 'goal-1',
        title: 'Learn closures',
        description: 'Understand JavaScript closures',
        type: 'learn' as never,
        order: 0,
        estimatedMinutes: 45,
        difficulty: 'medium',
        prerequisites: ['sg-0'],
        successCriteria: ['Explain closures', 'Write closure examples'],
      });

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('sg-1');
      expect(result.type).toBe('learn');
      expect(result.difficulty).toBe('medium');
      expect(result.status).toBe('pending');
      expect(result.prerequisites).toEqual(['sg-0']);

      // Verify Prisma receives uppercase enum values
      const callData = mockCreate.mock.calls[0][0].data;
      expect(callData.type).toBe('LEARN');
      expect(callData.difficulty).toBe('MEDIUM');
      expect(callData.status).toBe('PENDING');
    });

    it('defaults prerequisites and successCriteria to empty arrays', async () => {
      mockCreate.mockResolvedValue(
        makePrismaSubGoal({ prerequisites: [], successCriteria: [] })
      );

      await store.create({
        goalId: 'goal-1',
        title: 'Test',
        type: 'practice' as never,
        order: 0,
        estimatedMinutes: 30,
        difficulty: 'easy',
      });

      const callData = mockCreate.mock.calls[0][0].data;
      expect(callData.prerequisites).toEqual([]);
      expect(callData.successCriteria).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // createMany
  // -----------------------------------------------------------------------
  describe('createMany', () => {
    it('creates multiple sub-goals in a transaction', async () => {
      mockTransaction.mockResolvedValue([
        makePrismaSubGoal({ id: 'sg-1' }),
        makePrismaSubGoal({ id: 'sg-2', title: 'Practice closures', type: 'PRACTICE', order: 1 }),
      ]);

      const results = await store.createMany([
        {
          goalId: 'goal-1',
          title: 'Learn closures',
          type: 'learn' as never,
          order: 0,
          estimatedMinutes: 45,
          difficulty: 'medium',
        },
        {
          goalId: 'goal-1',
          title: 'Practice closures',
          type: 'practice' as never,
          order: 1,
          estimatedMinutes: 30,
          difficulty: 'medium',
        },
      ]);

      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(results).toHaveLength(2);
      expect(results[1].type).toBe('practice');
    });
  });

  // -----------------------------------------------------------------------
  // get
  // -----------------------------------------------------------------------
  describe('get', () => {
    it('returns a sub-goal when found', async () => {
      mockFindUnique.mockResolvedValue(makePrismaSubGoal());

      const result = await store.get('sg-1');

      expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: 'sg-1' } });
      expect(result).not.toBeNull();
      expect(result?.id).toBe('sg-1');
    });

    it('returns null when not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await store.get('nonexistent');

      expect(result).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // getByGoal
  // -----------------------------------------------------------------------
  describe('getByGoal', () => {
    it('returns sub-goals for a goal with default ordering by order asc', async () => {
      mockFindMany.mockResolvedValue([
        makePrismaSubGoal({ order: 0 }),
        makePrismaSubGoal({ id: 'sg-2', order: 1 }),
      ]);

      const results = await store.getByGoal('goal-1');

      expect(results).toHaveLength(2);
      const call = mockFindMany.mock.calls[0][0];
      expect(call.orderBy).toEqual({ order: 'asc' });
    });

    it('filters by status', async () => {
      mockFindMany.mockResolvedValue([]);

      await store.getByGoal('goal-1', { status: ['completed', 'failed'] as never[] });

      const call = mockFindMany.mock.calls[0][0];
      expect(call.where.status).toEqual({ in: ['COMPLETED', 'FAILED'] });
    });

    it('filters by type', async () => {
      mockFindMany.mockResolvedValue([]);

      await store.getByGoal('goal-1', { type: ['learn', 'practice'] as never[] });

      const call = mockFindMany.mock.calls[0][0];
      expect(call.where.type).toEqual({ in: ['LEARN', 'PRACTICE'] });
    });

    it('applies offset and limit', async () => {
      mockFindMany.mockResolvedValue([]);

      await store.getByGoal('goal-1', { offset: 5, limit: 10 });

      const call = mockFindMany.mock.calls[0][0];
      expect(call.skip).toBe(5);
      expect(call.take).toBe(10);
    });

    it('returns empty array when no sub-goals match', async () => {
      mockFindMany.mockResolvedValue([]);

      const results = await store.getByGoal('goal-empty');

      expect(results).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // update
  // -----------------------------------------------------------------------
  describe('update', () => {
    it('updates sub-goal fields with enum mapping', async () => {
      mockUpdate.mockResolvedValue(
        makePrismaSubGoal({ title: 'Updated title', type: 'ASSESS', difficulty: 'HARD' })
      );

      const result = await store.update('sg-1', {
        title: 'Updated title',
        type: 'assess' as never,
        difficulty: 'hard',
      });

      expect(result.title).toBe('Updated title');
      expect(result.type).toBe('assess');
      expect(result.difficulty).toBe('hard');

      const callData = mockUpdate.mock.calls[0][0].data;
      expect(callData.type).toBe('ASSESS');
      expect(callData.difficulty).toBe('HARD');
    });

    it('updates metadata', async () => {
      mockUpdate.mockResolvedValue(
        makePrismaSubGoal({ metadata: { custom: 'value' } })
      );

      await store.update('sg-1', { metadata: { custom: 'value' } });

      const callData = mockUpdate.mock.calls[0][0].data;
      expect(callData.metadata).toEqual({ custom: 'value' });
    });
  });

  // -----------------------------------------------------------------------
  // delete / deleteByGoal
  // -----------------------------------------------------------------------
  describe('delete', () => {
    it('deletes a sub-goal by ID', async () => {
      mockDelete.mockResolvedValue({ id: 'sg-1' });

      await store.delete('sg-1');

      expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'sg-1' } });
    });
  });

  describe('deleteByGoal', () => {
    it('deletes all sub-goals for a goal', async () => {
      mockDeleteMany.mockResolvedValue({ count: 3 });

      await store.deleteByGoal('goal-1');

      expect(mockDeleteMany).toHaveBeenCalledWith({ where: { goalId: 'goal-1' } });
    });
  });

  // -----------------------------------------------------------------------
  // Status transitions
  // -----------------------------------------------------------------------
  describe('markComplete', () => {
    it('sets status to COMPLETED with completedAt', async () => {
      mockUpdate.mockResolvedValue(
        makePrismaSubGoal({ status: 'COMPLETED', completedAt: NOW })
      );

      const result = await store.markComplete('sg-1');

      expect(result.status).toBe('completed');
      expect(result.completedAt).toEqual(NOW);

      const callData = mockUpdate.mock.calls[0][0].data;
      expect(callData.status).toBe('COMPLETED');
      expect(callData.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('markFailed', () => {
    it('sets status to FAILED', async () => {
      mockUpdate.mockResolvedValue(makePrismaSubGoal({ status: 'FAILED' }));

      const result = await store.markFailed('sg-1');

      expect(result.status).toBe('failed');
      const callData = mockUpdate.mock.calls[0][0].data;
      expect(callData.status).toBe('FAILED');
    });
  });

  describe('markSkipped', () => {
    it('sets status to SKIPPED', async () => {
      mockUpdate.mockResolvedValue(makePrismaSubGoal({ status: 'SKIPPED' }));

      const result = await store.markSkipped('sg-1');

      expect(result.status).toBe('skipped');
      const callData = mockUpdate.mock.calls[0][0].data;
      expect(callData.status).toBe('SKIPPED');
    });
  });

  // -----------------------------------------------------------------------
  // Enum mapping edge cases
  // -----------------------------------------------------------------------
  describe('enum mapping edge cases', () => {
    it('maps unknown type to learn', async () => {
      mockFindUnique.mockResolvedValue(makePrismaSubGoal({ type: 'UNKNOWN' }));

      const result = await store.get('sg-1');

      expect(result?.type).toBe('learn');
    });

    it('maps unknown difficulty to medium', async () => {
      mockFindUnique.mockResolvedValue(makePrismaSubGoal({ difficulty: 'EXTREME' }));

      const result = await store.get('sg-1');

      expect(result?.difficulty).toBe('medium');
    });

    it('maps unknown status to pending', async () => {
      mockFindUnique.mockResolvedValue(makePrismaSubGoal({ status: 'UNKNOWN' }));

      const result = await store.get('sg-1');

      expect(result?.status).toBe('pending');
    });
  });

  // -----------------------------------------------------------------------
  // Error handling
  // -----------------------------------------------------------------------
  describe('error handling', () => {
    it('propagates DB errors on create', async () => {
      mockCreate.mockRejectedValue(new Error('FK constraint'));

      await expect(
        store.create({
          goalId: 'bad-goal',
          title: 'Test',
          type: 'learn' as never,
          order: 0,
          estimatedMinutes: 10,
          difficulty: 'easy',
        })
      ).rejects.toThrow('FK constraint');
    });

    it('propagates DB errors on delete', async () => {
      mockDelete.mockRejectedValue(new Error('Not found'));

      await expect(store.delete('bad-id')).rejects.toThrow('Not found');
    });

    it('propagates DB errors on update', async () => {
      mockUpdate.mockRejectedValue(new Error('Record not found'));

      await expect(
        store.update('bad-id', { title: 'x' })
      ).rejects.toThrow('Record not found');
    });
  });
});
