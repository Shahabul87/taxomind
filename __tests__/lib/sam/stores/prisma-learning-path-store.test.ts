/**
 * PrismaLearningPathStore Unit Tests
 *
 * Tests the LearningPathStore adapter that bridges @sam-ai/agentic
 * LearningPathStore to Prisma SAMLearningGoal model (with metadata typed
 * as personalized_learning_path). Covers save, get, getActive,
 * getPathForCourse, delete, and markStepCompleted.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGoalCreate = jest.fn();
const mockGoalFindUnique = jest.fn();
const mockGoalFindMany = jest.fn();
const mockGoalFindFirst = jest.fn();
const mockGoalUpdate = jest.fn();
const mockGoalDelete = jest.fn();
const mockEnrollmentUpsert = jest.fn();

const mockDb = {
  sAMLearningGoal: {
    create: mockGoalCreate,
    findUnique: mockGoalFindUnique,
    findMany: mockGoalFindMany,
    findFirst: mockGoalFindFirst,
    update: mockGoalUpdate,
    delete: mockGoalDelete,
  },
  learningPathEnrollment: {
    upsert: mockEnrollmentUpsert,
  },
};

jest.mock('@/lib/sam/stores/db-provider', () => ({
  getDb: () => mockDb,
  PrismaClient: {},
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import {
  PrismaLearningPathStore,
  createPrismaLearningPathStore,
} from '@/lib/sam/stores/prisma-learning-path-store';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const NOW = new Date('2026-02-15T10:00:00Z');
const EXPIRES = new Date('2026-03-15T10:00:00Z');

const makeGoalRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'path-1',
  userId: 'user-1',
  title: 'Learning Path: course-1',
  description: 'Personalized path for React mastery',
  courseId: 'course-1',
  priority: 'MEDIUM',
  status: 'ACTIVE',
  targetDate: EXPIRES,
  topicIds: [],
  skillIds: [],
  currentMastery: null,
  targetMastery: null,
  tags: [],
  metadata: {
    type: 'personalized_learning_path',
    steps: [
      {
        order: 0,
        conceptId: 'concept-1',
        conceptName: 'Hooks',
        action: 'learn',
        priority: 'high',
        estimatedMinutes: 45,
        reason: 'Foundation skill',
        prerequisites: [],
        completed: false,
      },
      {
        order: 1,
        conceptId: 'concept-2',
        conceptName: 'Context API',
        action: 'practice',
        priority: 'medium',
        estimatedMinutes: 30,
        reason: 'Builds on hooks',
        prerequisites: ['concept-1'],
        completed: false,
      },
    ],
    totalSteps: 2,
    completedSteps: 0,
    targetConceptId: 'concept-2',
    totalEstimatedMinutes: 75,
    difficulty: 'intermediate',
    confidence: 0.85,
  },
  createdAt: NOW,
  updatedAt: NOW,
  completedAt: null,
  ...overrides,
});

const makeLearningPath = () => ({
  id: 'path-1',
  userId: 'user-1',
  courseId: 'course-1',
  targetConceptId: 'concept-2',
  steps: [
    {
      order: 0,
      conceptId: 'concept-1',
      conceptName: 'Hooks',
      action: 'learn' as const,
      priority: 'high' as const,
      estimatedMinutes: 45,
      reason: 'Foundation skill',
      prerequisites: [],
    },
  ],
  totalEstimatedMinutes: 75,
  difficulty: 'intermediate' as const,
  confidence: 0.85,
  reason: 'Personalized path for React mastery',
  createdAt: NOW,
  expiresAt: EXPIRES,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PrismaLearningPathStore', () => {
  let store: PrismaLearningPathStore;

  beforeEach(() => {
    jest.clearAllMocks();
    store = createPrismaLearningPathStore();
  });

  // -----------------------------------------------------------------------
  // saveLearningPath
  // -----------------------------------------------------------------------
  describe('saveLearningPath', () => {
    it('creates a goal record with learning path metadata', async () => {
      mockGoalCreate.mockResolvedValue(makeGoalRecord());
      mockEnrollmentUpsert.mockResolvedValue({});

      await store.saveLearningPath(makeLearningPath());

      expect(mockGoalCreate).toHaveBeenCalledTimes(1);
      const callData = mockGoalCreate.mock.calls[0][0].data;
      expect(callData.userId).toBe('user-1');
      expect(callData.metadata.type).toBe('personalized_learning_path');
      expect(callData.metadata.totalSteps).toBe(1);
    });

    it('creates enrollment when courseId is provided', async () => {
      mockGoalCreate.mockResolvedValue(makeGoalRecord());
      mockEnrollmentUpsert.mockResolvedValue({});

      await store.saveLearningPath(makeLearningPath());

      expect(mockEnrollmentUpsert).toHaveBeenCalledTimes(1);
    });

    it('does not create enrollment when courseId is undefined', async () => {
      mockGoalCreate.mockResolvedValue(makeGoalRecord());

      const path = { ...makeLearningPath(), courseId: undefined };
      await store.saveLearningPath(path);

      expect(mockEnrollmentUpsert).not.toHaveBeenCalled();
    });

    it('propagates DB errors', async () => {
      mockGoalCreate.mockRejectedValue(new Error('Unique constraint'));

      await expect(store.saveLearningPath(makeLearningPath())).rejects.toThrow(
        'Unique constraint'
      );
    });
  });

  // -----------------------------------------------------------------------
  // getLearningPath
  // -----------------------------------------------------------------------
  describe('getLearningPath', () => {
    it('returns a learning path when found', async () => {
      mockGoalFindUnique.mockResolvedValue(makeGoalRecord());

      const result = await store.getLearningPath('path-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('path-1');
      expect(result?.userId).toBe('user-1');
      expect(result?.steps).toHaveLength(2);
      expect(result?.difficulty).toBe('intermediate');
      expect(result?.confidence).toBe(0.85);
    });

    it('returns null when goal not found', async () => {
      mockGoalFindUnique.mockResolvedValue(null);

      const result = await store.getLearningPath('bad-id');

      expect(result).toBeNull();
    });

    it('returns null when goal metadata type is not personalized_learning_path', async () => {
      mockGoalFindUnique.mockResolvedValue(
        makeGoalRecord({ metadata: { type: 'regular_goal' } })
      );

      const result = await store.getLearningPath('path-1');

      expect(result).toBeNull();
    });

    it('returns null on DB error', async () => {
      mockGoalFindUnique.mockRejectedValue(new Error('Error'));

      const result = await store.getLearningPath('path-1');

      expect(result).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // getActiveLearningPaths
  // -----------------------------------------------------------------------
  describe('getActiveLearningPaths', () => {
    it('returns active and paused learning paths for a user', async () => {
      mockGoalFindMany.mockResolvedValue([
        makeGoalRecord(),
        makeGoalRecord({ id: 'path-2', metadata: { type: 'regular_goal' } }),
      ]);

      const results = await store.getActiveLearningPaths('user-1');

      // Only the one with type === 'personalized_learning_path' is included
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('path-1');
    });

    it('filters to ACTIVE and PAUSED statuses', async () => {
      mockGoalFindMany.mockResolvedValue([]);

      await store.getActiveLearningPaths('user-1');

      const call = mockGoalFindMany.mock.calls[0][0];
      expect(call.where.status).toEqual({ in: ['ACTIVE', 'PAUSED'] });
    });

    it('returns empty array on DB error', async () => {
      mockGoalFindMany.mockRejectedValue(new Error('Error'));

      const results = await store.getActiveLearningPaths('user-1');

      expect(results).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // getPathForCourse
  // -----------------------------------------------------------------------
  describe('getPathForCourse', () => {
    it('returns learning path for a specific course', async () => {
      mockGoalFindFirst.mockResolvedValue(makeGoalRecord());

      const result = await store.getPathForCourse('user-1', 'course-1');

      expect(result).not.toBeNull();
      expect(result?.courseId).toBe('course-1');
    });

    it('returns null when no path for course', async () => {
      mockGoalFindFirst.mockResolvedValue(null);

      const result = await store.getPathForCourse('user-1', 'course-99');

      expect(result).toBeNull();
    });

    it('returns null when goal metadata type does not match', async () => {
      mockGoalFindFirst.mockResolvedValue(
        makeGoalRecord({ metadata: { type: 'other' } })
      );

      const result = await store.getPathForCourse('user-1', 'course-1');

      expect(result).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // deleteLearningPath
  // -----------------------------------------------------------------------
  describe('deleteLearningPath', () => {
    it('deletes a learning path goal', async () => {
      mockGoalDelete.mockResolvedValue({ id: 'path-1' });

      await store.deleteLearningPath('path-1');

      expect(mockGoalDelete).toHaveBeenCalledWith({ where: { id: 'path-1' } });
    });

    it('propagates DB errors', async () => {
      mockGoalDelete.mockRejectedValue(new Error('Not found'));

      await expect(store.deleteLearningPath('bad-id')).rejects.toThrow('Not found');
    });
  });

  // -----------------------------------------------------------------------
  // markStepCompleted
  // -----------------------------------------------------------------------
  describe('markStepCompleted', () => {
    it('marks a step as completed and updates progress', async () => {
      mockGoalFindUnique.mockResolvedValue(makeGoalRecord());
      mockGoalUpdate.mockResolvedValue(makeGoalRecord());

      await store.markStepCompleted('path-1', 0);

      expect(mockGoalUpdate).toHaveBeenCalledTimes(1);
      const updateCall = mockGoalUpdate.mock.calls[0][0];
      expect(updateCall.data.metadata.steps[0].completed).toBe(true);
      expect(updateCall.data.metadata.completedSteps).toBe(1);
    });

    it('sets status to COMPLETED when all steps are done', async () => {
      const record = makeGoalRecord();
      // Mark first step as already completed
      (record.metadata as Record<string, unknown[]>).steps = [
        { order: 0, completed: true },
        { order: 1, completed: false },
      ];
      (record.metadata as Record<string, number>).totalSteps = 2;
      (record.metadata as Record<string, number>).completedSteps = 1;
      mockGoalFindUnique.mockResolvedValue(record);
      mockGoalUpdate.mockResolvedValue(record);

      await store.markStepCompleted('path-1', 1);

      const updateCall = mockGoalUpdate.mock.calls[0][0];
      expect(updateCall.data.status).toBe('COMPLETED');
      expect(updateCall.data.completedAt).toBeInstanceOf(Date);
    });

    it('throws when learning path not found', async () => {
      mockGoalFindUnique.mockResolvedValue(null);

      await expect(store.markStepCompleted('bad-id', 0)).rejects.toThrow(
        'Learning path not found'
      );
    });
  });
});
