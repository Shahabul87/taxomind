/**
 * PrismaGoalStore Unit Tests
 *
 * Tests the GoalStore adapter that bridges @sam-ai/agentic GoalStore interface
 * to Prisma SAMLearningGoal model. Covers CRUD, status transitions, enum mapping,
 * and error handling.
 */

// ---------------------------------------------------------------------------
// Mocks (must be defined before imports)
// ---------------------------------------------------------------------------

const mockCreate = jest.fn();
const mockFindUnique = jest.fn();
const mockFindMany = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();

const mockDb = {
  sAMLearningGoal: {
    create: mockCreate,
    findUnique: mockFindUnique,
    findMany: mockFindMany,
    update: mockUpdate,
    delete: mockDelete,
  },
};

jest.mock('@/lib/sam/stores/db-provider', () => ({
  getDb: () => mockDb,
}));

jest.mock('@prisma/client', () => ({
  Prisma: {
    JsonNull: Symbol('JsonNull'),
  },
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { PrismaGoalStore, createPrismaGoalStore } from '@/lib/sam/stores/prisma-goal-store';

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

const NOW = new Date('2026-01-15T10:00:00Z');

const makePrismaGoal = (overrides: Record<string, unknown> = {}) => ({
  id: 'goal-1',
  userId: 'user-1',
  title: 'Learn TypeScript',
  description: 'Deep dive into TS generics',
  targetDate: new Date('2026-06-01'),
  priority: 'HIGH',
  status: 'ACTIVE',
  courseId: 'course-1',
  chapterId: null,
  sectionId: null,
  topicIds: ['topic-1'],
  skillIds: ['skill-1'],
  currentMastery: 'INTERMEDIATE',
  targetMastery: 'ADVANCED',
  tags: ['typescript', 'generics'],
  metadata: {},
  createdAt: NOW,
  updatedAt: NOW,
  completedAt: null,
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PrismaGoalStore', () => {
  let store: PrismaGoalStore;

  beforeEach(() => {
    jest.clearAllMocks();
    store = createPrismaGoalStore();
  });

  // -----------------------------------------------------------------------
  // create
  // -----------------------------------------------------------------------
  describe('create', () => {
    it('creates a goal and maps Prisma result to LearningGoal', async () => {
      const prismaGoal = makePrismaGoal({ status: 'DRAFT' });
      mockCreate.mockResolvedValue(prismaGoal);

      const result = await store.create({
        userId: 'user-1',
        title: 'Learn TypeScript',
        description: 'Deep dive into TS generics',
        priority: 'high',
        context: { courseId: 'course-1', topicIds: ['topic-1'], skillIds: ['skill-1'] },
        currentMastery: 'intermediate',
        targetMastery: 'advanced',
        tags: ['typescript', 'generics'],
      });

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('goal-1');
      expect(result.userId).toBe('user-1');
      expect(result.title).toBe('Learn TypeScript');
      expect(result.status).toBe('draft');
      expect(result.priority).toBe('high');
      expect(result.currentMastery).toBe('intermediate');
      expect(result.targetMastery).toBe('advanced');
      expect(result.context.courseId).toBe('course-1');
    });

    it('sets default priority to MEDIUM when not provided', async () => {
      mockCreate.mockResolvedValue(makePrismaGoal({ priority: 'MEDIUM', status: 'DRAFT' }));

      await store.create({ userId: 'user-1', title: 'Test' });

      const callData = mockCreate.mock.calls[0][0].data;
      expect(callData.priority).toBe('MEDIUM');
    });
  });

  // -----------------------------------------------------------------------
  // get
  // -----------------------------------------------------------------------
  describe('get', () => {
    it('returns a LearningGoal when found', async () => {
      mockFindUnique.mockResolvedValue(makePrismaGoal());

      const result = await store.get('goal-1');

      expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: 'goal-1' } });
      expect(result).not.toBeNull();
      expect(result?.id).toBe('goal-1');
      expect(result?.priority).toBe('high');
    });

    it('returns null when goal is not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await store.get('nonexistent');

      expect(result).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // getByUser
  // -----------------------------------------------------------------------
  describe('getByUser', () => {
    it('returns goals for a user with default ordering', async () => {
      mockFindMany.mockResolvedValue([
        makePrismaGoal({ id: 'goal-1' }),
        makePrismaGoal({ id: 'goal-2', title: 'Learn React' }),
      ]);

      const results = await store.getByUser('user-1');

      expect(mockFindMany).toHaveBeenCalledTimes(1);
      expect(results).toHaveLength(2);
    });

    it('filters by status when provided', async () => {
      mockFindMany.mockResolvedValue([makePrismaGoal()]);

      await store.getByUser('user-1', { status: ['active', 'paused'] });

      const call = mockFindMany.mock.calls[0][0];
      expect(call.where.status).toEqual({ in: ['ACTIVE', 'PAUSED'] });
    });

    it('filters by priority when provided', async () => {
      mockFindMany.mockResolvedValue([]);

      await store.getByUser('user-1', { priority: ['high', 'critical'] });

      const call = mockFindMany.mock.calls[0][0];
      expect(call.where.priority).toEqual({ in: ['HIGH', 'CRITICAL'] });
    });

    it('filters by courseId when provided', async () => {
      mockFindMany.mockResolvedValue([]);

      await store.getByUser('user-1', { courseId: 'course-99' });

      const call = mockFindMany.mock.calls[0][0];
      expect(call.where.courseId).toBe('course-99');
    });

    it('returns empty array when no goals match', async () => {
      mockFindMany.mockResolvedValue([]);

      const results = await store.getByUser('user-no-goals');
      expect(results).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // update
  // -----------------------------------------------------------------------
  describe('update', () => {
    it('updates title and priority', async () => {
      mockUpdate.mockResolvedValue(makePrismaGoal({ title: 'Updated', priority: 'CRITICAL' }));

      const result = await store.update('goal-1', { title: 'Updated', priority: 'critical' });

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(result.title).toBe('Updated');
      expect(result.priority).toBe('critical');
    });

    it('updates context fields (courseId, topicIds)', async () => {
      mockUpdate.mockResolvedValue(
        makePrismaGoal({ courseId: 'course-2', topicIds: ['topic-a', 'topic-b'] })
      );

      await store.update('goal-1', {
        context: { courseId: 'course-2', topicIds: ['topic-a', 'topic-b'] },
      });

      const callData = mockUpdate.mock.calls[0][0].data;
      expect(callData.courseId).toBe('course-2');
      expect(callData.topicIds).toEqual(['topic-a', 'topic-b']);
    });
  });

  // -----------------------------------------------------------------------
  // delete
  // -----------------------------------------------------------------------
  describe('delete', () => {
    it('deletes a goal by ID', async () => {
      mockDelete.mockResolvedValue({ id: 'goal-1' });

      await store.delete('goal-1');

      expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'goal-1' } });
    });
  });

  // -----------------------------------------------------------------------
  // Status transitions
  // -----------------------------------------------------------------------
  describe('status transitions', () => {
    it('activate sets status to ACTIVE', async () => {
      mockUpdate.mockResolvedValue(makePrismaGoal({ status: 'ACTIVE' }));

      const result = await store.activate('goal-1');
      expect(result.status).toBe('active');
    });

    it('pause sets status to PAUSED', async () => {
      mockUpdate.mockResolvedValue(makePrismaGoal({ status: 'PAUSED' }));

      const result = await store.pause('goal-1');
      expect(result.status).toBe('paused');
    });

    it('complete sets status to COMPLETED and completedAt', async () => {
      const completedAt = new Date();
      mockUpdate.mockResolvedValue(makePrismaGoal({ status: 'COMPLETED', completedAt }));

      const result = await store.complete('goal-1');

      expect(result.status).toBe('completed');
      expect(result.completedAt).toBeDefined();
      const callData = mockUpdate.mock.calls[0][0].data;
      expect(callData.status).toBe('COMPLETED');
      expect(callData.completedAt).toBeInstanceOf(Date);
    });

    it('abandon sets status to ABANDONED', async () => {
      mockUpdate.mockResolvedValue(makePrismaGoal({ status: 'ABANDONED' }));

      const result = await store.abandon('goal-1', 'No longer relevant');
      expect(result.status).toBe('abandoned');
    });
  });

  // -----------------------------------------------------------------------
  // Enum mapping edge cases
  // -----------------------------------------------------------------------
  describe('enum mapping', () => {
    it('maps unknown priority to medium', async () => {
      mockFindUnique.mockResolvedValue(makePrismaGoal({ priority: 'UNKNOWN' }));

      const result = await store.get('goal-1');
      expect(result?.priority).toBe('medium');
    });

    it('maps unknown status to draft', async () => {
      mockFindUnique.mockResolvedValue(makePrismaGoal({ status: 'UNKNOWN' }));

      const result = await store.get('goal-1');
      expect(result?.status).toBe('draft');
    });

    it('maps null mastery to undefined', async () => {
      mockFindUnique.mockResolvedValue(
        makePrismaGoal({ currentMastery: null, targetMastery: null })
      );

      const result = await store.get('goal-1');
      expect(result?.currentMastery).toBeUndefined();
      expect(result?.targetMastery).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // Error handling
  // -----------------------------------------------------------------------
  describe('error handling', () => {
    it('propagates database errors on create', async () => {
      mockCreate.mockRejectedValue(new Error('DB connection failed'));

      await expect(store.create({ userId: 'u', title: 't' })).rejects.toThrow(
        'DB connection failed'
      );
    });

    it('propagates database errors on update', async () => {
      mockUpdate.mockRejectedValue(new Error('Record not found'));

      await expect(store.update('bad-id', { title: 'x' })).rejects.toThrow('Record not found');
    });

    it('propagates database errors on delete', async () => {
      mockDelete.mockRejectedValue(new Error('Foreign key constraint'));

      await expect(store.delete('goal-1')).rejects.toThrow('Foreign key constraint');
    });
  });
});
