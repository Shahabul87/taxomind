/**
 * PrismaPlanStore Unit Tests
 *
 * Tests the PlanStore adapter that bridges @sam-ai/agentic PlanStore interface
 * to Prisma SAMExecutionPlan, SAMPlanStep, SAMPlanState, SAMCheckpoint models.
 * Covers CRUD, state management, step updates, and status transitions.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPlanCreate = jest.fn();
const mockPlanFindUnique = jest.fn();
const mockPlanFindMany = jest.fn();
const mockPlanUpdate = jest.fn();
const mockPlanDelete = jest.fn();

const mockStateUpsert = jest.fn();
const mockStateFindUnique = jest.fn();

const mockCheckpointCreate = jest.fn();
const mockCheckpointFindUnique = jest.fn();

const mockStepUpdate = jest.fn();

const mockDb = {
  sAMExecutionPlan: {
    create: mockPlanCreate,
    findUnique: mockPlanFindUnique,
    findMany: mockPlanFindMany,
    update: mockPlanUpdate,
    delete: mockPlanDelete,
  },
  sAMPlanState: {
    upsert: mockStateUpsert,
    findUnique: mockStateFindUnique,
  },
  sAMCheckpoint: {
    create: mockCheckpointCreate,
    findUnique: mockCheckpointFindUnique,
  },
  sAMPlanStep: {
    update: mockStepUpdate,
  },
};

jest.mock('@/lib/sam/stores/db-provider', () => ({
  getDb: () => mockDb,
}));

jest.mock('@prisma/client', () => ({
  Prisma: {
    SAMExecutionPlanWhereInput: {},
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { PrismaPlanStore, createPrismaPlanStore } from '@/lib/sam/stores/prisma-plan-store';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const NOW = new Date('2026-02-01T12:00:00Z');

const makePrismaStep = (overrides: Record<string, unknown> = {}) => ({
  id: 'step-1',
  planId: 'plan-1',
  subGoalId: null,
  type: 'READ_CONTENT',
  title: 'Read chapter 1',
  description: null,
  order: 0,
  status: 'PENDING',
  startedAt: null,
  completedAt: null,
  estimatedMinutes: 30,
  actualMinutes: null,
  retryCount: 0,
  maxRetries: 3,
  lastError: null,
  inputs: [],
  outputs: [],
  executionContext: {},
  metadata: {},
  ...overrides,
});

const makePrismaPlan = (overrides: Record<string, unknown> = {}) => ({
  id: 'plan-1',
  goalId: 'goal-1',
  userId: 'user-1',
  startDate: NOW,
  targetDate: new Date('2026-06-01'),
  currentStepId: null,
  overallProgress: 0,
  status: 'DRAFT',
  pausedAt: null,
  checkpointData: {},
  schedule: {},
  fallbackStrategies: [],
  createdAt: NOW,
  updatedAt: NOW,
  completedAt: null,
  steps: [makePrismaStep()],
  checkpoints: [],
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PrismaPlanStore', () => {
  let store: PrismaPlanStore;

  beforeEach(() => {
    jest.clearAllMocks();
    store = createPrismaPlanStore();
  });

  // -----------------------------------------------------------------------
  // create
  // -----------------------------------------------------------------------
  describe('create', () => {
    it('creates a plan with steps and checkpoints', async () => {
      mockPlanCreate.mockResolvedValue(makePrismaPlan());

      const result = await store.create({
        goalId: 'goal-1',
        userId: 'user-1',
        steps: [
          {
            id: '',
            planId: '',
            type: 'read_content',
            title: 'Read chapter 1',
            order: 0,
            status: 'pending',
            estimatedMinutes: 30,
            retryCount: 0,
            maxRetries: 3,
          },
        ] as never[],
        checkpoints: [],
        fallbackStrategies: [],
        overallProgress: 0,
        status: 'draft',
        createdAt: NOW,
        updatedAt: NOW,
      });

      expect(mockPlanCreate).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('plan-1');
      expect(result.steps).toHaveLength(1);
      expect(result.steps[0].type).toBe('read_content');
      expect(result.status).toBe('draft');
    });
  });

  // -----------------------------------------------------------------------
  // get
  // -----------------------------------------------------------------------
  describe('get', () => {
    it('returns a plan with steps ordered by order asc', async () => {
      mockPlanFindUnique.mockResolvedValue(makePrismaPlan());

      const result = await store.get('plan-1');

      expect(mockPlanFindUnique).toHaveBeenCalledWith({
        where: { id: 'plan-1' },
        include: {
          steps: { orderBy: { order: 'asc' } },
          checkpoints: true,
        },
      });
      expect(result).not.toBeNull();
      expect(result?.id).toBe('plan-1');
    });

    it('returns null when plan is not found', async () => {
      mockPlanFindUnique.mockResolvedValue(null);

      const result = await store.get('nonexistent');
      expect(result).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // getByUser
  // -----------------------------------------------------------------------
  describe('getByUser', () => {
    it('returns plans for user', async () => {
      mockPlanFindMany.mockResolvedValue([makePrismaPlan()]);

      const results = await store.getByUser('user-1');
      expect(results).toHaveLength(1);
    });

    it('filters by status', async () => {
      mockPlanFindMany.mockResolvedValue([]);

      await store.getByUser('user-1', { status: ['active', 'paused'] });

      const call = mockPlanFindMany.mock.calls[0][0];
      expect(call.where.status).toEqual({ in: ['ACTIVE', 'PAUSED'] });
    });

    it('filters by goalId', async () => {
      mockPlanFindMany.mockResolvedValue([]);

      await store.getByUser('user-1', { goalId: 'goal-99' });

      const call = mockPlanFindMany.mock.calls[0][0];
      expect(call.where.goalId).toBe('goal-99');
    });
  });

  // -----------------------------------------------------------------------
  // getByGoal
  // -----------------------------------------------------------------------
  describe('getByGoal', () => {
    it('returns plans associated with a goal', async () => {
      mockPlanFindMany.mockResolvedValue([makePrismaPlan()]);

      const results = await store.getByGoal('goal-1');

      expect(mockPlanFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { goalId: 'goal-1' } })
      );
      expect(results).toHaveLength(1);
    });
  });

  // -----------------------------------------------------------------------
  // update
  // -----------------------------------------------------------------------
  describe('update', () => {
    it('updates plan fields', async () => {
      mockPlanUpdate.mockResolvedValue(
        makePrismaPlan({ overallProgress: 50, status: 'ACTIVE' })
      );

      const result = await store.update('plan-1', {
        overallProgress: 50,
        status: 'active',
      });

      expect(result.overallProgress).toBe(50);
      expect(result.status).toBe('active');
    });

    it('returns empty plan when planId is empty string', async () => {
      const result = await store.update('', { overallProgress: 10 });

      expect(result.id).toBe('');
      expect(mockPlanUpdate).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // delete
  // -----------------------------------------------------------------------
  describe('delete', () => {
    it('deletes a plan by ID', async () => {
      mockPlanDelete.mockResolvedValue({ id: 'plan-1' });

      await store.delete('plan-1');
      expect(mockPlanDelete).toHaveBeenCalledWith({ where: { id: 'plan-1' } });
    });

    it('skips delete when planId is empty', async () => {
      await store.delete('');
      expect(mockPlanDelete).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // saveState / getState / loadState
  // -----------------------------------------------------------------------
  describe('state management', () => {
    const mockState = {
      planId: 'plan-1',
      goalId: 'goal-1',
      userId: 'user-1',
      currentStepId: 'step-1',
      currentStepProgress: 50,
      completedSteps: ['step-0'],
      failedSteps: [],
      skippedSteps: [],
      startedAt: NOW,
      lastActiveAt: NOW,
      totalActiveTime: 3600,
      context: {},
      checkpointData: {},
      sessionCount: 2,
    };

    it('saves plan state via upsert', async () => {
      mockStateUpsert.mockResolvedValue(mockState);

      await store.saveState(mockState);

      expect(mockStateUpsert).toHaveBeenCalledTimes(1);
      expect(mockStateUpsert.mock.calls[0][0].where).toEqual({ planId: 'plan-1' });
    });

    it('skips saveState when planId is empty', async () => {
      await store.saveState({ ...mockState, planId: '' });
      expect(mockStateUpsert).not.toHaveBeenCalled();
    });

    it('getState returns mapped state', async () => {
      mockStateFindUnique.mockResolvedValue({
        ...mockState,
        pausedAt: null,
        currentSessionStart: null,
      });

      const result = await store.getState('plan-1');

      expect(result).not.toBeNull();
      expect(result?.planId).toBe('plan-1');
      expect(result?.currentStepProgress).toBe(50);
    });

    it('getState returns null when not found', async () => {
      mockStateFindUnique.mockResolvedValue(null);

      const result = await store.getState('nonexistent');
      expect(result).toBeNull();
    });

    it('loadState delegates to getState', async () => {
      mockStateFindUnique.mockResolvedValue({
        ...mockState,
        pausedAt: null,
        currentSessionStart: null,
      });

      const result = await store.loadState('plan-1');
      expect(result?.planId).toBe('plan-1');
    });
  });

  // -----------------------------------------------------------------------
  // createCheckpoint / restoreCheckpoint
  // -----------------------------------------------------------------------
  describe('checkpoint management', () => {
    it('creates a checkpoint', async () => {
      mockCheckpointCreate.mockResolvedValue({
        id: 'cp-1',
        planId: 'plan-1',
        stepId: 'step-1',
        name: 'Midpoint',
        description: null,
        type: 'PROGRESS',
        targetDate: null,
        achieved: false,
        achievedAt: null,
      });

      const result = await store.createCheckpoint('plan-1', 'step-1', 'Midpoint');

      expect(result.id).toBe('cp-1');
      expect(result.type).toBe('progress');
      expect(result.achieved).toBe(false);
    });

    it('restoreCheckpoint returns null for unknown checkpoint', async () => {
      mockCheckpointFindUnique.mockResolvedValue(null);

      const result = await store.restoreCheckpoint('bad-id');
      expect(result).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // updateStep
  // -----------------------------------------------------------------------
  describe('updateStep', () => {
    it('updates step status and touches plan updatedAt', async () => {
      mockStepUpdate.mockResolvedValue(makePrismaStep({ status: 'COMPLETED' }));
      mockPlanUpdate.mockResolvedValue(makePrismaPlan());

      const result = await store.updateStep('plan-1', 'step-1', { status: 'completed' });

      expect(mockStepUpdate).toHaveBeenCalledTimes(1);
      expect(mockPlanUpdate).toHaveBeenCalledTimes(1);
      expect(result.status).toBe('completed');
    });

    it('returns default step when planId or stepId is empty', async () => {
      const result = await store.updateStep('', '', { status: 'completed' });

      expect(result.id).toBe('');
      expect(mockStepUpdate).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // Status transitions
  // -----------------------------------------------------------------------
  describe('status transitions', () => {
    it('activate sets status to ACTIVE', async () => {
      mockPlanUpdate.mockResolvedValue(makePrismaPlan({ status: 'ACTIVE' }));
      const result = await store.activate('plan-1');
      expect(result.status).toBe('active');
    });

    it('pause sets status to PAUSED', async () => {
      mockPlanUpdate.mockResolvedValue(makePrismaPlan({ status: 'PAUSED', pausedAt: NOW }));
      const result = await store.pause('plan-1');
      expect(result.status).toBe('paused');
    });

    it('complete sets status to COMPLETED', async () => {
      mockPlanUpdate.mockResolvedValue(makePrismaPlan({ status: 'COMPLETED', completedAt: NOW }));
      const result = await store.complete('plan-1');
      expect(result.status).toBe('completed');
    });

    it('fail sets status to FAILED', async () => {
      mockPlanUpdate.mockResolvedValue(makePrismaPlan({ status: 'FAILED' }));
      const result = await store.fail('plan-1', 'Timeout');
      expect(result.status).toBe('failed');
    });

    it('cancel sets status to CANCELLED', async () => {
      mockPlanUpdate.mockResolvedValue(makePrismaPlan({ status: 'CANCELLED' }));
      const result = await store.cancel('plan-1');
      expect(result.status).toBe('cancelled');
    });
  });

  // -----------------------------------------------------------------------
  // Error handling
  // -----------------------------------------------------------------------
  describe('error handling', () => {
    it('propagates database errors on create', async () => {
      mockPlanCreate.mockRejectedValue(new Error('DB error'));

      await expect(
        store.create({
          goalId: 'g',
          userId: 'u',
          steps: [],
          checkpoints: [],
          fallbackStrategies: [],
          overallProgress: 0,
          status: 'draft',
          createdAt: NOW,
          updatedAt: NOW,
        })
      ).rejects.toThrow('DB error');
    });
  });
});
