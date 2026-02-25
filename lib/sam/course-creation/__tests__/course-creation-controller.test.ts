/**
 * Tests for course-creation-controller.ts
 *
 * Verifies initializeCourseCreationGoal, advanceCourseStage,
 * completeStageStep, completeCourseCreation, failCourseCreation,
 * and SubGoal operations.
 */

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockGoalStore = {
  create: jest.fn().mockResolvedValue({ id: 'goal-1' }),
  get: jest.fn().mockResolvedValue({ id: 'goal-1', metadata: {} }),
  update: jest.fn().mockResolvedValue({}),
  complete: jest.fn().mockResolvedValue({}),
  pause: jest.fn().mockResolvedValue({}),
};

const mockPlanStore = {
  create: jest.fn().mockResolvedValue({
    id: 'plan-1',
    steps: [{ id: 'step-1' }, { id: 'step-2' }, { id: 'step-3' }],
  }),
  get: jest.fn().mockResolvedValue({ id: 'plan-1', checkpointData: {} }),
  update: jest.fn().mockResolvedValue({}),
  updateStep: jest.fn().mockResolvedValue({}),
};

const mockSubGoalStore = {
  create: jest.fn().mockResolvedValue({ id: 'subgoal-1' }),
  markComplete: jest.fn().mockResolvedValue({}),
  update: jest.fn().mockResolvedValue({}),
};

jest.mock('@/lib/sam/taxomind-context', () => ({
  getGoalStores: jest.fn(() => ({
    goal: mockGoalStore,
    plan: mockPlanStore,
    subGoal: mockSubGoalStore,
  })),
}));

jest.mock('@sam-ai/agentic', () => ({
  GoalStatus: { ACTIVE: 'active', COMPLETED: 'completed', PAUSED: 'paused' },
  PlanStatus: { ACTIVE: 'active', COMPLETED: 'completed', FAILED: 'failed' },
  SubGoalType: { CREATE: 'create' },
}));

// Must import AFTER mocks
import {
  initializeCourseCreationGoal,
  advanceCourseStage,
  completeStageStep,
  completeCourseCreation,
  failCourseCreation,
  reactivateCourseCreation,
  initializeChapterSubGoal,
  completeChapterSubGoal,
  storeBlueprintInGoal,
  storeDecisionInPlan,
  storeReflectionInGoal,
} from '../course-creation-controller';
import { getGoalStores } from '@/lib/sam/taxomind-context';

// Helper to restore mock implementations after clearAllMocks/resetMocks
function restoreMockDefaults() {
  // Restore taxomind-context mock
  (getGoalStores as jest.Mock).mockReturnValue({
    goal: mockGoalStore,
    plan: mockPlanStore,
    subGoal: mockSubGoalStore,
  });
  mockGoalStore.create.mockResolvedValue({ id: 'goal-1' });
  mockGoalStore.get.mockResolvedValue({ id: 'goal-1', metadata: {} });
  mockGoalStore.update.mockResolvedValue({});
  mockGoalStore.complete.mockResolvedValue({});
  mockGoalStore.pause.mockResolvedValue({});
  mockPlanStore.create.mockResolvedValue({
    id: 'plan-1',
    steps: [{ id: 'step-1' }, { id: 'step-2' }, { id: 'step-3' }],
  });
  mockPlanStore.get.mockResolvedValue({ id: 'plan-1', checkpointData: {} });
  mockPlanStore.update.mockResolvedValue({});
  mockPlanStore.updateStep.mockResolvedValue({});
  mockSubGoalStore.create.mockResolvedValue({ id: 'subgoal-1' });
  mockSubGoalStore.markComplete.mockResolvedValue({});
  mockSubGoalStore.update.mockResolvedValue({});
}

describe('initializeCourseCreationGoal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    restoreMockDefaults();
  });

  it('should create a goal and plan', async () => {
    const result = await initializeCourseCreationGoal('user-1', 'React Course', 'course-1');
    expect(result.goalId).toBe('goal-1');
    expect(result.planId).toBe('plan-1');
    expect(result.stepIds).toHaveLength(3);
    expect(mockGoalStore.create).toHaveBeenCalled();
    expect(mockPlanStore.create).toHaveBeenCalled();
  });

  it('should return empty IDs on error', async () => {
    mockGoalStore.create.mockRejectedValueOnce(new Error('fail'));
    const result = await initializeCourseCreationGoal('user-1', 'Test', 'c1');
    expect(result.goalId).toBe('');
    expect(result.planId).toBe('');
    expect(result.stepIds).toHaveLength(0);
  });
});

describe('advanceCourseStage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    restoreMockDefaults();
  });

  it('should update step status and plan progress', async () => {
    await advanceCourseStage('plan-1', ['s1', 's2', 's3'], 2);
    expect(mockPlanStore.updateStep).toHaveBeenCalledWith('plan-1', 's2', expect.objectContaining({ status: 'in_progress' }));
    expect(mockPlanStore.update).toHaveBeenCalledWith('plan-1', expect.objectContaining({ overallProgress: 33 }));
  });

  it('should do nothing with empty planId', async () => {
    await advanceCourseStage('', ['s1'], 1);
    expect(mockPlanStore.updateStep).not.toHaveBeenCalled();
  });
});

describe('completeCourseCreation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    restoreMockDefaults();
  });

  it('should mark plan 100% and goal complete', async () => {
    await completeCourseCreation('goal-1', 'plan-1', { totalChapters: 5, totalSections: 15, totalTime: 300, averageQualityScore: 85 });
    expect(mockPlanStore.update).toHaveBeenCalledWith('plan-1', expect.objectContaining({ overallProgress: 100 }));
    expect(mockGoalStore.complete).toHaveBeenCalledWith('goal-1');
  });

  it('should do nothing with empty IDs', async () => {
    await completeCourseCreation('', '', { totalChapters: 0, totalSections: 0, totalTime: 0, averageQualityScore: 0 });
    expect(mockPlanStore.update).not.toHaveBeenCalled();
  });
});

describe('failCourseCreation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    restoreMockDefaults();
  });

  it('should preserve checkpoint data on failure', async () => {
    mockPlanStore.get.mockResolvedValueOnce({ checkpointData: { existingData: true } });
    await failCourseCreation('goal-1', 'plan-1', 'AI timeout');
    expect(mockPlanStore.update).toHaveBeenCalledWith('plan-1', expect.objectContaining({
      status: 'failed',
      checkpointData: expect.objectContaining({ existingData: true, failureReason: 'AI timeout' }),
    }));
    expect(mockGoalStore.pause).toHaveBeenCalledWith('goal-1');
  });
});

describe('initializeChapterSubGoal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    restoreMockDefaults();
  });

  it('should create a SubGoal for a chapter', async () => {
    const subGoalId = await initializeChapterSubGoal('goal-1', 2, 'State Management', 5);
    expect(subGoalId).toBe('subgoal-1');
    expect(mockSubGoalStore.create).toHaveBeenCalled();
  });

  it('should return empty string when goalId is empty', async () => {
    const result = await initializeChapterSubGoal('', 1, 'Test', 5);
    expect(result).toBe('');
  });
});

describe('storeBlueprintInGoal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    restoreMockDefaults();
  });

  it('should merge blueprint into goal metadata', async () => {
    await storeBlueprintInGoal('goal-1', { chapters: [] });
    expect(mockGoalStore.update).toHaveBeenCalledWith('goal-1', expect.objectContaining({
      metadata: expect.objectContaining({ blueprint: { chapters: [] } }),
    }));
  });
});
