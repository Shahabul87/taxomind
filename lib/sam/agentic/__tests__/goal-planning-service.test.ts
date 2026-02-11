/**
 * Unit tests for GoalPlanningService
 *
 * Tests the goal lifecycle: creation, decomposition, planning,
 * retrieval, updates, completion, and abandonment.
 *
 * External dependencies (stores, AI adapter, factories) are fully mocked.
 * Because @sam-ai/agentic is a workspace ESM package that Jest cannot
 * reliably auto-mock, we inject mock collaborators directly into the
 * service's private fields after construction. This is a standard approach
 * for testing classes whose constructors resolve workspace ESM packages.
 */

import type {
  LearningGoal,
  GoalStore,
  GoalDecomposition,
  ExecutionPlan,
} from '@sam-ai/agentic';
import { GoalStatus } from '@sam-ai/agentic';
import type { AgenticLogger } from '../types';

// ---------------------------------------------------------------------------
// Mocks - declared before the import of the system-under-test
// ---------------------------------------------------------------------------

const mockGoalStore: jest.Mocked<GoalStore> = {
  create: jest.fn(),
  get: jest.fn(),
  getByUser: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  activate: jest.fn(),
  pause: jest.fn(),
  complete: jest.fn(),
  abandon: jest.fn(),
};

const mockDecompose = jest.fn();
const mockPlanBuilderCreatePlan = jest.fn();

jest.mock('../../taxomind-context', () => ({
  getGoalStores: jest.fn(() => ({
    goal: mockGoalStore,
    subGoal: {},
    plan: {},
  })),
}));

// Mock admin check — prevents loading auth.config.admin → Credentials() in test env
jest.mock('@/lib/admin/check-admin', () => ({
  getCurrentAdminSession: jest.fn().mockResolvedValue({ isAdmin: false }),
}));

// Import the service. Because it imports from @sam-ai/agentic at load time,
// we rely on Jest's transform chain to resolve the workspace package.
// We then inject mock collaborators into the private fields directly.
import { GoalPlanningService } from '../goal-planning-service';

// ---------------------------------------------------------------------------
// Service accessor type -- used to set private fields for testing
// ---------------------------------------------------------------------------
interface ServiceInternals {
  goalStore?: GoalStore;
  goalDecomposer?: { decompose: jest.Mock };
  planBuilder?: { createPlan: jest.Mock };
  stateMachine?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createLogger(): AgenticLogger {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

function buildGoal(overrides: Partial<LearningGoal> = {}): LearningGoal {
  return {
    id: 'goal_test_123',
    userId: 'user_1',
    title: 'Learn TypeScript Generics',
    description: 'Master generic types and constraints',
    status: GoalStatus.ACTIVE,
    priority: 'medium',
    progress: 0,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    context: {
      courseId: 'course_ts',
      topicIds: [],
      skillIds: [],
    },
    metadata: {},
    ...overrides,
  };
}

/**
 * Create a fully-wired service with mock internals injected.
 * This bypasses the ESM factory resolution issues by directly
 * setting the private fields after construction.
 */
function createServiceWithMocks(
  userId: string,
  courseId: string | undefined,
  logger: AgenticLogger,
  options: { withStore?: boolean; withDecomposer?: boolean; withPlanBuilder?: boolean } = {},
): GoalPlanningService {
  const svc = new GoalPlanningService(userId, courseId, logger, false);
  const internals = svc as unknown as ServiceInternals;

  if (options.withStore !== false) {
    internals.goalStore = mockGoalStore;
  }
  if (options.withDecomposer !== false) {
    internals.goalDecomposer = { decompose: mockDecompose };
  }
  if (options.withPlanBuilder !== false) {
    internals.planBuilder = { createPlan: mockPlanBuilderCreatePlan };
  }
  internals.stateMachine = {};

  return svc;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GoalPlanningService', () => {
  let service: GoalPlanningService;
  let logger: AgenticLogger;

  beforeEach(() => {
    jest.clearAllMocks();
    logger = createLogger();
    service = createServiceWithMocks('user_1', 'course_ts', logger);
  });

  // ========================================================================
  // createGoal
  // ========================================================================

  describe('createGoal', () => {
    it('creates a goal with correct fields via the goal store', async () => {
      const draftGoal = buildGoal({ status: GoalStatus.DRAFT });
      const activeGoal = buildGoal({ status: GoalStatus.ACTIVE });

      mockGoalStore.create.mockResolvedValue(draftGoal);
      mockGoalStore.activate.mockResolvedValue(activeGoal);

      const result = await service.createGoal('Learn TypeScript Generics', 'Master generic types and constraints', {
        priority: 'high',
        topicIds: ['generics'],
        skillIds: ['ts-generics'],
      });

      expect(mockGoalStore.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user_1',
          title: 'Learn TypeScript Generics',
          description: 'Master generic types and constraints',
          priority: 'high',
          context: expect.objectContaining({
            courseId: 'course_ts',
            topicIds: ['generics'],
            skillIds: ['ts-generics'],
          }),
        }),
      );
      expect(mockGoalStore.activate).toHaveBeenCalledWith(draftGoal.id);
      expect(result.status).toBe(GoalStatus.ACTIVE);
      expect(logger.info).toHaveBeenCalledWith(
        'Goal created and persisted',
        expect.objectContaining({ goalId: activeGoal.id }),
      );
    });

    it('uses default priority medium when no priority is provided', async () => {
      const draftGoal = buildGoal({ status: GoalStatus.DRAFT });
      const activeGoal = buildGoal();

      mockGoalStore.create.mockResolvedValue(draftGoal);
      mockGoalStore.activate.mockResolvedValue(activeGoal);

      await service.createGoal('Learn Basics');

      expect(mockGoalStore.create).toHaveBeenCalledWith(
        expect.objectContaining({ priority: 'medium' }),
      );
    });

    it('returns an in-memory goal when no goal store is available', async () => {
      const noStoreService = createServiceWithMocks('user_2', undefined, logger, {
        withStore: false,
      });

      const result = await noStoreService.createGoal('In-memory goal');

      expect(result.userId).toBe('user_2');
      expect(result.title).toBe('In-memory goal');
      expect(result.status).toBe(GoalStatus.ACTIVE);
      expect(result.id).toMatch(/^goal_/);
      expect(logger.info).toHaveBeenCalledWith(
        'Goal created (in-memory only)',
        expect.objectContaining({ title: 'In-memory goal' }),
      );
    });

    it('propagates store errors to the caller', async () => {
      mockGoalStore.create.mockRejectedValue(new Error('DB connection lost'));

      await expect(service.createGoal('Failing goal')).rejects.toThrow('DB connection lost');
    });

    it('throws when planBuilder is not available', async () => {
      const noBuilderService = createServiceWithMocks('user_1', undefined, logger, {
        withPlanBuilder: false,
        withStore: false,
        withDecomposer: false,
      });
      // Remove planBuilder to trigger the guard
      (noBuilderService as unknown as ServiceInternals).planBuilder = undefined;

      await expect(noBuilderService.createGoal('No planBuilder')).rejects.toThrow(
        'Goal Planning not enabled',
      );
    });
  });

  // ========================================================================
  // decomposeGoal
  // ========================================================================

  describe('decomposeGoal', () => {
    it('decomposes a goal using the goal decomposer and logs sub-goal count', async () => {
      const goal = buildGoal();
      const decomposition: GoalDecomposition = {
        goalId: goal.id,
        subGoals: [
          {
            id: 'sg_1',
            goalId: goal.id,
            title: 'Understand generics basics',
            type: 'learn',
            order: 0,
            estimatedMinutes: 30,
            difficulty: 'easy',
            prerequisites: [],
            successCriteria: [],
            status: 'pending',
          },
        ],
        dependencies: { nodes: ['sg_1'], edges: [] },
        estimatedDuration: 30,
        difficulty: 'easy',
        confidence: 0.85,
      };

      mockDecompose.mockResolvedValue(decomposition);

      const result = await service.decomposeGoal(goal);

      expect(mockDecompose).toHaveBeenCalledWith(goal);
      expect(result.subGoals).toHaveLength(1);
      expect(result.goalId).toBe(goal.id);
      expect(logger.info).toHaveBeenCalledWith(
        'Goal decomposed',
        expect.objectContaining({ goalId: goal.id, subGoalCount: 1 }),
      );
    });

    it('handles decomposition with zero sub-goals', async () => {
      const goal = buildGoal();
      mockDecompose.mockResolvedValue({
        goalId: goal.id,
        subGoals: [],
        dependencies: { nodes: [], edges: [] },
        estimatedDuration: 0,
        difficulty: 'easy',
        confidence: 0.5,
      });

      const result = await service.decomposeGoal(goal);

      expect(result.subGoals).toHaveLength(0);
      expect(logger.info).toHaveBeenCalledWith(
        'Goal decomposed',
        expect.objectContaining({ subGoalCount: 0 }),
      );
    });
  });

  // ========================================================================
  // createPlan
  // ========================================================================

  describe('createPlan', () => {
    it('creates a plan linked to the given goal and decomposition', async () => {
      const goal = buildGoal();
      const decomposition: GoalDecomposition = {
        goalId: goal.id,
        subGoals: [],
        dependencies: { nodes: [], edges: [] },
        estimatedDuration: 60,
        difficulty: 'medium',
        confidence: 0.8,
      };

      const plan: ExecutionPlan = {
        id: 'plan_1',
        goalId: goal.id,
        userId: 'user_1',
        steps: [],
        checkpoints: [],
        fallbackStrategies: [],
        overallProgress: 0,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPlanBuilderCreatePlan.mockResolvedValue(plan);

      const result = await service.createPlan(goal, decomposition);

      expect(mockPlanBuilderCreatePlan).toHaveBeenCalledWith(goal, decomposition);
      expect(result.goalId).toBe(goal.id);
      expect(result.id).toBe('plan_1');
      expect(logger.info).toHaveBeenCalledWith(
        'Plan created',
        expect.objectContaining({ planId: plan.id, goalId: goal.id }),
      );
    });

    it('throws when planBuilder is not available', async () => {
      const noBuilderService = createServiceWithMocks('user_1', undefined, logger, {
        withPlanBuilder: false,
      });
      (noBuilderService as unknown as ServiceInternals).planBuilder = undefined;

      await expect(
        noBuilderService.createPlan(buildGoal(), {
          goalId: 'g1',
          subGoals: [],
          dependencies: { nodes: [], edges: [] },
          estimatedDuration: 0,
          difficulty: 'easy',
          confidence: 0,
        }),
      ).rejects.toThrow('Goal Planning not enabled');
    });
  });

  // ========================================================================
  // getActiveGoals
  // ========================================================================

  describe('getActiveGoals', () => {
    it('filters goals by ACTIVE status using the goal store', async () => {
      const activeGoals = [buildGoal(), buildGoal({ id: 'goal_2', title: 'Second Goal' })];
      mockGoalStore.getByUser.mockResolvedValue(activeGoals);

      const result = await service.getActiveGoals();

      expect(mockGoalStore.getByUser).toHaveBeenCalledWith('user_1', {
        status: [GoalStatus.ACTIVE],
        courseId: 'course_ts',
        orderBy: 'createdAt',
        orderDir: 'desc',
      });
      expect(result).toHaveLength(2);
    });

    it('returns empty array when no goal store is available', async () => {
      const noStoreService = createServiceWithMocks('user_1', undefined, logger, {
        withStore: false,
      });

      const result = await noStoreService.getActiveGoals();

      expect(result).toEqual([]);
      expect(logger.debug).toHaveBeenCalledWith(
        'getActiveGoals called - no store available',
      );
    });
  });

  // ========================================================================
  // getGoal
  // ========================================================================

  describe('getGoal', () => {
    it('returns the goal when found in the store', async () => {
      const goal = buildGoal();
      mockGoalStore.get.mockResolvedValue(goal);

      const result = await service.getGoal('goal_test_123');

      expect(mockGoalStore.get).toHaveBeenCalledWith('goal_test_123');
      expect(result).toEqual(goal);
    });

    it('returns null for a non-existent goal', async () => {
      mockGoalStore.get.mockResolvedValue(null);

      const result = await service.getGoal('nonexistent');

      expect(result).toBeNull();
    });

    it('throws when goal store is not available', async () => {
      const noStoreService = createServiceWithMocks('user_1', undefined, logger, {
        withStore: false,
      });

      await expect(noStoreService.getGoal('any')).rejects.toThrow('Goal Store not available');
    });
  });

  // ========================================================================
  // updateGoal
  // ========================================================================

  describe('updateGoal', () => {
    it('updates goal fields and logs the updated keys', async () => {
      const updatedGoal = buildGoal({ title: 'Updated Title', priority: 'high' });
      mockGoalStore.update.mockResolvedValue(updatedGoal);

      const result = await service.updateGoal('goal_test_123', {
        title: 'Updated Title',
        priority: 'high',
      });

      expect(mockGoalStore.update).toHaveBeenCalledWith('goal_test_123', {
        title: 'Updated Title',
        priority: 'high',
      });
      expect(result.title).toBe('Updated Title');
      expect(logger.info).toHaveBeenCalledWith(
        'Goal updated',
        expect.objectContaining({
          goalId: 'goal_test_123',
          updates: expect.arrayContaining(['title', 'priority']),
        }),
      );
    });

    it('throws when goal store is not available', async () => {
      const noStoreService = createServiceWithMocks('user_1', undefined, logger, {
        withStore: false,
      });

      await expect(
        noStoreService.updateGoal('id', { title: 'x' }),
      ).rejects.toThrow('Goal Store not available');
    });
  });

  // ========================================================================
  // completeGoal
  // ========================================================================

  describe('completeGoal', () => {
    it('sets goal status to COMPLETED via the store', async () => {
      const completed = buildGoal({ status: GoalStatus.COMPLETED });
      mockGoalStore.complete.mockResolvedValue(completed);

      const result = await service.completeGoal('goal_test_123');

      expect(mockGoalStore.complete).toHaveBeenCalledWith('goal_test_123');
      expect(result.status).toBe(GoalStatus.COMPLETED);
      expect(logger.info).toHaveBeenCalledWith(
        'Goal completed',
        expect.objectContaining({ goalId: 'goal_test_123' }),
      );
    });

    it('throws when goal store is not available', async () => {
      const noStoreService = createServiceWithMocks('user_1', undefined, logger, {
        withStore: false,
      });

      await expect(noStoreService.completeGoal('id')).rejects.toThrow(
        'Goal Store not available',
      );
    });
  });

  // ========================================================================
  // abandonGoal
  // ========================================================================

  describe('abandonGoal', () => {
    it('sets goal status to ABANDONED with the provided reason', async () => {
      const abandoned = buildGoal({ status: GoalStatus.ABANDONED });
      mockGoalStore.abandon.mockResolvedValue(abandoned);

      const result = await service.abandonGoal('goal_test_123', 'No longer relevant');

      expect(mockGoalStore.abandon).toHaveBeenCalledWith('goal_test_123', 'No longer relevant');
      expect(result.status).toBe(GoalStatus.ABANDONED);
      expect(logger.info).toHaveBeenCalledWith(
        'Goal abandoned',
        expect.objectContaining({ goalId: 'goal_test_123', reason: 'No longer relevant' }),
      );
    });

    it('allows abandonment without a reason', async () => {
      const abandoned = buildGoal({ status: GoalStatus.ABANDONED });
      mockGoalStore.abandon.mockResolvedValue(abandoned);

      await service.abandonGoal('goal_test_123');

      expect(mockGoalStore.abandon).toHaveBeenCalledWith('goal_test_123', undefined);
    });

    it('throws when goal store is not available', async () => {
      const noStoreService = createServiceWithMocks('user_1', undefined, logger, {
        withStore: false,
      });

      await expect(
        noStoreService.abandonGoal('id', 'reason'),
      ).rejects.toThrow('Goal Store not available');
    });
  });

  // ========================================================================
  // Capability checks
  // ========================================================================

  describe('capability checks', () => {
    it('hasGoalPersistence returns true when store is available', () => {
      expect(service.hasGoalPersistence()).toBe(true);
    });

    it('hasGoalPersistence returns false when no store', () => {
      const noStoreService = createServiceWithMocks('user_1', undefined, logger, {
        withStore: false,
      });
      expect(noStoreService.hasGoalPersistence()).toBe(false);
    });

    it('isEnabled returns true when at least one sub-system is available', () => {
      expect(service.isEnabled()).toBe(true);
    });

    it('isEnabled returns false when nothing is available', () => {
      const emptyService = createServiceWithMocks('user_1', undefined, logger, {
        withStore: false,
        withDecomposer: false,
        withPlanBuilder: false,
      });
      (emptyService as unknown as ServiceInternals).goalDecomposer = undefined;
      expect(emptyService.isEnabled()).toBe(false);
    });

    it('setCourseId updates the course context used by getActiveGoals', async () => {
      service.setCourseId('new_course');

      mockGoalStore.getByUser.mockResolvedValue([]);
      await service.getActiveGoals();

      expect(mockGoalStore.getByUser).toHaveBeenCalledWith(
        'user_1',
        expect.objectContaining({ courseId: 'new_course' }),
      );
    });
  });
});
