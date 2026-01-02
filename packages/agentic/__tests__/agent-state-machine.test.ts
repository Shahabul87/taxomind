/**
 * @sam-ai/agentic - AgentStateMachine Tests
 * Comprehensive tests for the state machine execution engine
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  AgentStateMachine,
  createAgentStateMachine,
  type AgentStateMachineConfig,
  type StateMachineListener,
} from '../src/goal-planning/agent-state-machine';
import {
  type ExecutionPlan,
  type PlanStep,
  type PlanState,
  type StepResult,
  type PlanStore,
  PlanStatus,
  StepStatus,
  StepType,
} from '../src/goal-planning/types';

// ============================================================================
// MOCK DATA
// ============================================================================

const createMockStep = (id: string, order: number, type: StepType = StepType.READ_CONTENT): PlanStep => ({
  id,
  planId: 'plan-1',
  type,
  title: `Step ${order + 1}`,
  description: `Description for step ${order + 1}`,
  order,
  status: StepStatus.PENDING,
  estimatedMinutes: 30,
  retryCount: 0,
  maxRetries: 3,
});

const createMockPlan = (): ExecutionPlan => ({
  id: 'plan-1',
  goalId: 'goal-1',
  userId: 'user-123',
  steps: [
    createMockStep('step-1', 0),
    createMockStep('step-2', 1),
    createMockStep('step-3', 2, StepType.TAKE_QUIZ),
  ],
  checkpoints: [
    {
      id: 'cp-1',
      planId: 'plan-1',
      stepId: 'step-2',
      name: '50% Complete',
      type: 'milestone',
      achieved: false,
    },
  ],
  fallbackStrategies: [
    {
      trigger: { type: 'step_failed', threshold: 2 },
      action: { type: 'simplify', parameters: {} },
      priority: 1,
    },
  ],
  overallProgress: 0,
  status: PlanStatus.DRAFT,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const createMockPlanStore = (): PlanStore => ({
  get: vi.fn().mockResolvedValue(createMockPlan()),
  create: vi.fn().mockResolvedValue(createMockPlan()),
  update: vi.fn().mockResolvedValue(createMockPlan()),
  delete: vi.fn().mockResolvedValue(undefined),
  list: vi.fn().mockResolvedValue([createMockPlan()]),
  updateStep: vi.fn().mockResolvedValue(undefined),
  saveState: vi.fn().mockResolvedValue(undefined),
  loadState: vi.fn().mockResolvedValue(null),
});

// ============================================================================
// TESTS
// ============================================================================

describe('AgentStateMachine', () => {
  let stateMachine: AgentStateMachine;
  let mockPlanStore: PlanStore;
  let config: AgentStateMachineConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockPlanStore = createMockPlanStore();
    config = {
      planStore: mockPlanStore,
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
      autoSaveInterval: 5000,
      maxStepRetries: 3,
    };
    stateMachine = new AgentStateMachine(config);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should create an AgentStateMachine instance', () => {
      expect(stateMachine).toBeInstanceOf(AgentStateMachine);
    });

    it('should use default values when not provided', () => {
      const minimalConfig: AgentStateMachineConfig = {
        planStore: mockPlanStore,
      };
      const sm = new AgentStateMachine(minimalConfig);
      expect(sm).toBeInstanceOf(AgentStateMachine);
    });

    it('should start in idle state', () => {
      expect(stateMachine.getState()).toBe('idle');
    });
  });

  describe('createAgentStateMachine factory', () => {
    it('should create an AgentStateMachine using factory function', () => {
      const instance = createAgentStateMachine(config);
      expect(instance).toBeInstanceOf(AgentStateMachine);
    });
  });

  describe('getState', () => {
    it('should return current state', () => {
      expect(stateMachine.getState()).toBe('idle');
    });
  });

  describe('getPlanState', () => {
    it('should return null when no plan is loaded', () => {
      expect(stateMachine.getPlanState()).toBeNull();
    });
  });

  describe('getCurrentPlan', () => {
    it('should return null when no plan is loaded', () => {
      expect(stateMachine.getCurrentPlan()).toBeNull();
    });
  });

  describe('start', () => {
    it('should transition to running state', async () => {
      const plan = createMockPlan();

      // Don't set step executor so it goes to waiting_for_input
      await stateMachine.start(plan);

      expect(['running', 'waiting_for_input']).toContain(stateMachine.getState());
    });

    it('should update plan status to ACTIVE', async () => {
      const plan = createMockPlan();
      await stateMachine.start(plan);

      expect(mockPlanStore.update).toHaveBeenCalledWith(
        plan.id,
        expect.objectContaining({ status: PlanStatus.ACTIVE })
      );
    });

    it('should initialize plan state', async () => {
      const plan = createMockPlan();
      await stateMachine.start(plan);

      const planState = stateMachine.getPlanState();
      expect(planState).not.toBeNull();
      expect(planState?.planId).toBe(plan.id);
      expect(planState?.completedSteps).toEqual([]);
    });

    it('should throw if not in idle state', async () => {
      const plan = createMockPlan();
      await stateMachine.start(plan);

      await expect(stateMachine.start(plan)).rejects.toThrow();
    });

    it('should mark first step as in progress', async () => {
      const plan = createMockPlan();
      await stateMachine.start(plan);

      expect(mockPlanStore.updateStep).toHaveBeenCalledWith(
        plan.id,
        'step-1',
        expect.objectContaining({ status: StepStatus.IN_PROGRESS })
      );
    });
  });

  describe('pause', () => {
    it('should transition to paused state', async () => {
      const plan = createMockPlan();
      await stateMachine.start(plan);
      await stateMachine.pause('User requested pause');

      expect(stateMachine.getState()).toBe('paused');
    });

    it('should update plan status to PAUSED', async () => {
      const plan = createMockPlan();
      await stateMachine.start(plan);
      await stateMachine.pause();

      expect(mockPlanStore.update).toHaveBeenCalledWith(
        plan.id,
        expect.objectContaining({ status: PlanStatus.PAUSED })
      );
    });

    it('should save current state', async () => {
      const plan = createMockPlan();
      await stateMachine.start(plan);
      await stateMachine.pause();

      expect(mockPlanStore.saveState).toHaveBeenCalled();
    });

    it('should throw if not in running or waiting_for_input state', async () => {
      await expect(stateMachine.pause()).rejects.toThrow();
    });

    it('should return plan state for resumability', async () => {
      const plan = createMockPlan();
      await stateMachine.start(plan);
      const state = await stateMachine.pause();

      expect(state).toBeDefined();
      expect(state.planId).toBe(plan.id);
      expect(state.pausedAt).toBeInstanceOf(Date);
    });
  });

  describe('resume', () => {
    it('should transition back to running state', async () => {
      const plan = createMockPlan();
      await stateMachine.start(plan);
      await stateMachine.pause();
      await stateMachine.resume();

      expect(['running', 'waiting_for_input']).toContain(stateMachine.getState());
    });

    it('should restore plan state', async () => {
      const plan = createMockPlan();
      await stateMachine.start(plan);
      const savedState = await stateMachine.pause();

      // Create new state machine
      const newStateMachine = new AgentStateMachine(config);
      (mockPlanStore.get as ReturnType<typeof vi.fn>).mockResolvedValue(plan);
      (mockPlanStore.loadState as ReturnType<typeof vi.fn>).mockResolvedValue(savedState);

      await newStateMachine.resume(savedState);

      expect(['running', 'waiting_for_input']).toContain(newStateMachine.getState());
    });

    it('should throw if no state to resume from', async () => {
      await expect(stateMachine.resume()).rejects.toThrow('No state to resume from');
    });

    it('should clear pausedAt from state', async () => {
      const plan = createMockPlan();
      await stateMachine.start(plan);
      await stateMachine.pause();
      await stateMachine.resume();

      const state = stateMachine.getPlanState();
      expect(state?.pausedAt).toBeUndefined();
    });
  });

  describe('abort', () => {
    it('should transition to aborted state', async () => {
      const plan = createMockPlan();
      await stateMachine.start(plan);
      await stateMachine.abort('User cancelled');

      expect(stateMachine.getState()).toBe('aborted');
    });

    it('should update plan status to CANCELLED', async () => {
      const plan = createMockPlan();
      await stateMachine.start(plan);
      await stateMachine.abort('User cancelled');

      expect(mockPlanStore.update).toHaveBeenCalledWith(
        plan.id,
        expect.objectContaining({ status: PlanStatus.CANCELLED })
      );
    });

    it('should work from idle state', async () => {
      await stateMachine.abort('Never started');
      expect(stateMachine.getState()).toBe('aborted');
    });
  });

  describe('step execution', () => {
    it('should execute steps with step executor', async () => {
      const plan = createMockPlan();
      const mockExecutor = vi.fn().mockResolvedValue({
        stepId: 'step-1',
        success: true,
        completedAt: new Date(),
        duration: 5,
        outputs: [],
      } as StepResult);

      stateMachine.setStepExecutor(mockExecutor);
      await stateMachine.start(plan);

      // Allow execution to complete
      await vi.runAllTimersAsync();

      expect(mockExecutor).toHaveBeenCalled();
    });

    it('should handle step completion', async () => {
      const plan = createMockPlan();
      await stateMachine.start(plan);

      await stateMachine.completeStep('step-1', {
        stepId: 'step-1',
        success: true,
        completedAt: new Date(),
        duration: 5,
        outputs: [],
      });

      expect(mockPlanStore.updateStep).toHaveBeenCalledWith(
        plan.id,
        'step-1',
        expect.objectContaining({ status: StepStatus.COMPLETED })
      );
    });

    it('should handle step failure with retries', async () => {
      const plan = createMockPlan();
      // Ensure step has initial retryCount of 0 and maxRetries of 3
      plan.steps[0].retryCount = 0;
      plan.steps[0].maxRetries = 3;

      await stateMachine.start(plan);

      // Clear the mock to only track calls from failStep
      (mockPlanStore.updateStep as ReturnType<typeof vi.fn>).mockClear();

      // Start failStep but don't await - it has async operations with delays
      const failPromise = stateMachine.failStep('step-1', new Error('Test error'));

      // The updateStep for retry should happen synchronously before the delay
      // Give it a moment to process
      await Promise.resolve();
      await Promise.resolve();

      // Advance timer to get past the 1000ms delay in failStep
      vi.advanceTimersByTime(1100);

      // Wait for the promise but don't let it block (may hang due to recursive calls)
      await Promise.race([
        failPromise,
        new Promise((resolve) => setTimeout(resolve, 100)),
      ]);

      // Verify the step was updated with retry count incremented and status reset to pending
      const updateCalls = (mockPlanStore.updateStep as ReturnType<typeof vi.fn>).mock.calls;
      const retryCall = updateCalls.find(
        (call) =>
          call[1] === 'step-1' &&
          call[2]?.status === StepStatus.PENDING &&
          call[2]?.retryCount === 1
      );

      expect(retryCall).toBeDefined();
    });

    it('should mark step as failed after max retries', async () => {
      const plan = createMockPlan();
      plan.steps[0].retryCount = 2; // Already at 2 retries
      await stateMachine.start(plan);

      await stateMachine.failStep('step-1', new Error('Test error'));

      expect(mockPlanStore.updateStep).toHaveBeenCalledWith(
        plan.id,
        'step-1',
        expect.objectContaining({ status: StepStatus.FAILED })
      );
    });

    it('should skip steps when requested', async () => {
      const plan = createMockPlan();
      await stateMachine.start(plan);

      await stateMachine.skipStep('step-1', 'User requested skip');

      expect(mockPlanStore.updateStep).toHaveBeenCalledWith(
        plan.id,
        'step-1',
        expect.objectContaining({ status: StepStatus.SKIPPED })
      );
    });
  });

  describe('listeners', () => {
    it('should notify listeners on state change', async () => {
      const listener: StateMachineListener = {
        onStateChange: vi.fn(),
      };
      stateMachine.addListener(listener);

      const plan = createMockPlan();
      await stateMachine.start(plan);

      expect(listener.onStateChange).toHaveBeenCalledWith('idle', expect.any(String));
    });

    it('should notify listeners on step start', async () => {
      const listener: StateMachineListener = {
        onStepStart: vi.fn(),
      };
      stateMachine.addListener(listener);

      const plan = createMockPlan();
      await stateMachine.start(plan);

      expect(listener.onStepStart).toHaveBeenCalled();
    });

    it('should notify listeners on step complete', async () => {
      const listener: StateMachineListener = {
        onStepComplete: vi.fn(),
      };
      stateMachine.addListener(listener);

      const plan = createMockPlan();
      await stateMachine.start(plan);

      await stateMachine.completeStep('step-1', {
        stepId: 'step-1',
        success: true,
        completedAt: new Date(),
        duration: 5,
        outputs: [],
      });

      expect(listener.onStepComplete).toHaveBeenCalled();
    });

    it('should remove listeners', async () => {
      const listener: StateMachineListener = {
        onStateChange: vi.fn(),
      };
      stateMachine.addListener(listener);
      stateMachine.removeListener(listener);

      const plan = createMockPlan();
      await stateMachine.start(plan);

      expect(listener.onStateChange).not.toHaveBeenCalled();
    });
  });

  describe('auto-save', () => {
    it('should save state periodically', async () => {
      const plan = createMockPlan();
      await stateMachine.start(plan);

      // Advance time past auto-save interval
      await vi.advanceTimersByTimeAsync(6000);

      expect(mockPlanStore.saveState).toHaveBeenCalled();
    });

    it('should stop auto-save on pause', async () => {
      const plan = createMockPlan();
      await stateMachine.start(plan);

      const initialCalls = (mockPlanStore.saveState as ReturnType<typeof vi.fn>).mock.calls.length;

      await stateMachine.pause();

      // Advance time
      await vi.advanceTimersByTimeAsync(10000);

      // Should not have more saves after pause
      const finalCalls = (mockPlanStore.saveState as ReturnType<typeof vi.fn>).mock.calls.length;
      expect(finalCalls).toBe(initialCalls + 1); // Only the pause save
    });
  });

  describe('checkpoints', () => {
    it('should mark checkpoints as achieved', async () => {
      const plan = createMockPlan();
      plan.steps[0].status = StepStatus.COMPLETED;
      await stateMachine.start(plan);

      await stateMachine.completeStep('step-2', {
        stepId: 'step-2',
        success: true,
        completedAt: new Date(),
        duration: 5,
        outputs: [],
      });

      // Checkpoint should be achieved when step-2 completes
      const checkpoint = plan.checkpoints.find((c) => c.stepId === 'step-2');
      expect(checkpoint?.achieved).toBe(true);
    });
  });

  describe('plan completion', () => {
    it('should transition to completed when all steps done', async () => {
      const plan = createMockPlan();
      plan.steps[0].status = StepStatus.COMPLETED;
      plan.steps[1].status = StepStatus.COMPLETED;
      await stateMachine.start(plan);

      await stateMachine.completeStep('step-3', {
        stepId: 'step-3',
        success: true,
        completedAt: new Date(),
        duration: 5,
        outputs: [],
      });

      expect(stateMachine.getState()).toBe('completed');
    });

    it('should update plan to 100% progress on completion', async () => {
      const plan = createMockPlan();
      plan.steps[0].status = StepStatus.COMPLETED;
      plan.steps[1].status = StepStatus.COMPLETED;
      await stateMachine.start(plan);

      await stateMachine.completeStep('step-3', {
        stepId: 'step-3',
        success: true,
        completedAt: new Date(),
        duration: 5,
        outputs: [],
      });

      expect(mockPlanStore.update).toHaveBeenCalledWith(
        plan.id,
        expect.objectContaining({
          status: PlanStatus.COMPLETED,
          overallProgress: 100,
        })
      );
    });
  });

  describe('context updates', () => {
    it('should update execution context', async () => {
      const plan = createMockPlan();
      await stateMachine.start(plan);

      await stateMachine.updateContext({
        recentTopics: ['typescript', 'react'],
      });

      const state = stateMachine.getPlanState();
      expect(state?.context.recentTopics).toContain('typescript');
    });
  });

  describe('loadState', () => {
    it('should load state from store', async () => {
      const mockState: PlanState = {
        planId: 'plan-1',
        goalId: 'goal-1',
        userId: 'user-123',
        currentStepId: 'step-2',
        currentStepProgress: 50,
        completedSteps: ['step-1'],
        failedSteps: [],
        skippedSteps: [],
        startedAt: new Date(),
        lastActiveAt: new Date(),
        totalActiveTime: 30,
        context: { recentTopics: [], strugglingConcepts: [], masteredConcepts: [] },
        checkpointData: {},
        sessionCount: 1,
        currentSessionStart: new Date(),
      };

      (mockPlanStore.loadState as ReturnType<typeof vi.fn>).mockResolvedValue(mockState);

      const state = await stateMachine.loadState('plan-1');

      expect(state).toEqual(mockState);
      expect(mockPlanStore.loadState).toHaveBeenCalledWith('plan-1');
    });
  });

  describe('saveState', () => {
    it('should save current state to store', async () => {
      const plan = createMockPlan();
      await stateMachine.start(plan);

      await stateMachine.saveState();

      expect(mockPlanStore.saveState).toHaveBeenCalled();
    });

    it('should update lastActiveAt timestamp', async () => {
      const plan = createMockPlan();
      await stateMachine.start(plan);

      const beforeSave = new Date();
      await stateMachine.saveState();

      const savedState = (mockPlanStore.saveState as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(savedState.lastActiveAt.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
    });
  });
});
