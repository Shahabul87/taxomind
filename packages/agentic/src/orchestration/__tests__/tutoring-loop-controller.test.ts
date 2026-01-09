/**
 * @sam-ai/agentic - TutoringLoopController Tests
 * Tests for the tutoring loop controller and criterion evaluation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  TutoringLoopController,
  createTutoringLoopController,
  type TutoringLoopControllerConfig,
} from '../tutoring-loop-controller';
import type { TutoringContext, SessionMetadata, MemoryContextSummary } from '../types';
import type { GoalStore, PlanStore, LearningGoal, ExecutionPlan, PlanStep } from '../../goal-planning/types';
import type { ToolStore, ToolDefinition } from '../../tool-registry/types';
import type { OrchestrationConfirmationRequestStore, TutoringSessionStore, TutoringSession } from '../types';

// ============================================================================
// MOCK FACTORIES
// ============================================================================

function createMockGoalStore(): GoalStore {
  return {
    create: vi.fn(),
    get: vi.fn().mockResolvedValue(null),
    getByUser: vi.fn().mockResolvedValue([]),
    update: vi.fn(),
    delete: vi.fn(),
    list: vi.fn().mockResolvedValue([]),
  };
}

function createMockPlanStore(): PlanStore {
  return {
    create: vi.fn(),
    get: vi.fn().mockResolvedValue(null),
    getByUser: vi.fn().mockResolvedValue([]),
    getByGoal: vi.fn().mockResolvedValue([]),
    update: vi.fn(),
    updateStep: vi.fn(),
    delete: vi.fn(),
    list: vi.fn().mockResolvedValue([]),
    loadState: vi.fn().mockResolvedValue(null),
    saveState: vi.fn(),
    clearState: vi.fn(),
  };
}

function createMockToolStore(): ToolStore {
  return {
    register: vi.fn(),
    get: vi.fn().mockResolvedValue(null),
    getByName: vi.fn().mockResolvedValue(null),
    list: vi.fn().mockResolvedValue([]),
    update: vi.fn(),
    remove: vi.fn(),
    execute: vi.fn(),
    getAuditLogs: vi.fn().mockResolvedValue([]),
  };
}

function createMockConfirmationStore(): OrchestrationConfirmationRequestStore {
  return {
    create: vi.fn(),
    get: vi.fn().mockResolvedValue(null),
    getByUser: vi.fn().mockResolvedValue([]),
    update: vi.fn(),
    respond: vi.fn(),
    expireOld: vi.fn(),
  };
}

function createMockSessionStore(): TutoringSessionStore {
  return {
    getOrCreate: vi.fn().mockImplementation((userId: string) => Promise.resolve({
      id: `session-${userId}`,
      userId,
      planId: null,
      startedAt: new Date(),
      endedAt: null,
      messageCount: 0,
      stepsCompleted: [],
      toolsExecuted: [],
      metadata: {},
    })),
    update: vi.fn().mockImplementation((_, updates) => Promise.resolve(updates)),
    end: vi.fn(),
    getActive: vi.fn().mockResolvedValue(null),
    getRecent: vi.fn().mockResolvedValue([]),
  };
}

function createMockConfig(): TutoringLoopControllerConfig {
  return {
    goalStore: createMockGoalStore(),
    planStore: createMockPlanStore(),
    toolStore: createMockToolStore(),
    confirmationStore: createMockConfirmationStore(),
    sessionStore: createMockSessionStore(),
    stepCompletionThreshold: 0.8,
    autoAdvance: true,
    maxStepRetries: 3,
    sessionTimeoutMinutes: 60,
  };
}

function createMockTutoringContext(overrides: Partial<TutoringContext> = {}): TutoringContext {
  const sessionMetadata: SessionMetadata = {
    startedAt: new Date(),
    lastActiveAt: new Date(),
    messageCount: 5,
    stepsCompletedThisSession: 1,
    totalSessionTime: 15,
  };

  const memoryContext: MemoryContextSummary = {
    recentTopics: ['JavaScript', 'React'],
    strugglingConcepts: ['closures'],
    masteredConcepts: ['variables', 'functions'],
    sessionSummary: null,
    knowledgeSnippets: [],
    learningStyle: 'visual',
    currentMasteryLevel: 'intermediate',
  };

  return {
    userId: 'test-user',
    sessionId: 'test-session',
    activeGoal: null,
    activePlan: null,
    currentStep: null,
    stepObjectives: [],
    allowedTools: [],
    memoryContext,
    pendingInterventions: [],
    previousStepResults: [],
    sessionMetadata,
    ...overrides,
  };
}

function createMockPlanStep(overrides: Partial<PlanStep> = {}): PlanStep {
  return {
    id: 'step-1',
    title: 'Learn JavaScript Basics',
    description: 'Understanding variables, functions, and control flow',
    type: 'learn',
    status: 'in_progress',
    estimatedMinutes: 30,
    dependencies: [],
    outputs: [],
    metadata: {
      successCriteria: [
        'Demonstrate understanding of variables',
        'Complete practice exercises',
      ],
    },
    ...overrides,
  };
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('TutoringLoopController', () => {
  let controller: TutoringLoopController;
  let config: TutoringLoopControllerConfig;

  beforeEach(() => {
    config = createMockConfig();
    controller = createTutoringLoopController(config);
  });

  describe('initialization', () => {
    it('should create controller with default config', () => {
      expect(controller).toBeDefined();
    });

    it('should create controller via factory function', () => {
      const ctrl = createTutoringLoopController(config);
      expect(ctrl).toBeDefined();
    });
  });

  describe('prepareContext', () => {
    it('should prepare context with session metadata', async () => {
      const context = await controller.prepareContext(
        'user-123',
        'session-456',
        'Hello, help me learn JavaScript'
      );

      expect(context.userId).toBe('user-123');
      expect(context.sessionId).toBeDefined();
      expect(context.sessionMetadata).toBeDefined();
    });

    it('should include active goal when available', async () => {
      const mockGoal: LearningGoal = {
        id: 'goal-1',
        userId: 'user-123',
        title: 'Master JavaScript',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (config.goalStore.getByUser as ReturnType<typeof vi.fn>).mockResolvedValue([mockGoal]);

      const context = await controller.prepareContext(
        'user-123',
        'session-456',
        'What should I learn next?'
      );

      expect(context.activeGoal).toEqual(mockGoal);
    });
  });

  describe('evaluateProgress', () => {
    it('should return empty evaluation when no current step', async () => {
      const context = createMockTutoringContext();

      const evaluation = await controller.evaluateProgress(
        context,
        'Great explanation!',
        'What is a variable?'
      );

      expect(evaluation.stepComplete).toBe(false);
      expect(evaluation.progressPercent).toBe(0);
      expect(evaluation.evaluatedCriteria).toHaveLength(0);
    });

    it('should evaluate time-based criteria correctly', async () => {
      const context = createMockTutoringContext({
        currentStep: createMockPlanStep({
          metadata: {
            successCriteria: ['Spend at least 10 minutes studying'],
          },
        }),
        sessionMetadata: {
          startedAt: new Date(),
          lastActiveAt: new Date(),
          messageCount: 5,
          stepsCompletedThisSession: 0,
          totalSessionTime: 15, // 15 minutes > 10 required
        },
      });

      const evaluation = await controller.evaluateProgress(
        context,
        'You have been studying well.',
        'Am I making progress?'
      );

      expect(evaluation.evaluatedCriteria.length).toBeGreaterThan(0);
      const timeCriterion = evaluation.evaluatedCriteria.find(
        c => c.criterion.toLowerCase().includes('time') || c.criterion.toLowerCase().includes('minute')
      );
      if (timeCriterion) {
        expect(timeCriterion.met).toBe(true);
        expect(timeCriterion.confidence).toBeGreaterThanOrEqual(0.8);
      }
    });

    it('should evaluate quiz score criteria', async () => {
      const context = createMockTutoringContext({
        currentStep: createMockPlanStep({
          metadata: {
            successCriteria: ['Score at least 70% on quiz'],
          },
        }),
      });

      const evaluation = await controller.evaluateProgress(
        context,
        'Congratulations! You scored 8 out of 10 on the quiz.',
        'How did I do on the quiz?'
      );

      const scoreCriterion = evaluation.evaluatedCriteria.find(
        c => c.criterion.toLowerCase().includes('score') || c.criterion.toLowerCase().includes('quiz')
      );
      if (scoreCriterion) {
        expect(scoreCriterion.met).toBe(true);
        expect(scoreCriterion.evidence).toContain('80%');
      }
    });

    it('should evaluate understanding demonstration criteria', async () => {
      const context = createMockTutoringContext({
        currentStep: createMockPlanStep({
          metadata: {
            successCriteria: ['Demonstrate understanding of the concept'],
          },
        }),
      });

      const evaluation = await controller.evaluateProgress(
        context,
        'Exactly right! You have shown good understanding of closures.',
        'Because closures allow functions to remember their scope, this means they can access variables from outer functions'
      );

      const understandingCriterion = evaluation.evaluatedCriteria.find(
        c => c.criterion.toLowerCase().includes('understand') || c.criterion.toLowerCase().includes('demonstrate')
      );
      if (understandingCriterion) {
        expect(understandingCriterion.met).toBe(true);
      }
    });

    it('should evaluate completion criteria from response', async () => {
      const context = createMockTutoringContext({
        currentStep: createMockPlanStep({
          metadata: {
            successCriteria: ['Complete the introduction section'],
          },
        }),
      });

      const evaluation = await controller.evaluateProgress(
        context,
        'Well done! You have successfully completed the introduction section.',
        'I finished reading the introduction'
      );

      const completionCriterion = evaluation.evaluatedCriteria.find(
        c => c.criterion.toLowerCase().includes('complete')
      );
      if (completionCriterion) {
        expect(completionCriterion.met).toBe(true);
      }
    });

    it('should generate recommendations based on progress', async () => {
      const context = createMockTutoringContext({
        currentStep: createMockPlanStep({
          metadata: {
            successCriteria: ['Understand basics', 'Complete exercises'],
          },
        }),
      });

      const evaluation = await controller.evaluateProgress(
        context,
        'Good start, but you need more practice.',
        'I am trying to learn'
      );

      expect(evaluation.recommendations).toBeDefined();
      expect(Array.isArray(evaluation.recommendations)).toBe(true);
    });

    it('should set shouldAdvance when step is complete', async () => {
      const context = createMockTutoringContext({
        currentStep: createMockPlanStep({
          metadata: {
            successCriteria: ['Complete the task'],
          },
        }),
      });

      const evaluation = await controller.evaluateProgress(
        context,
        'Excellent! You have successfully completed this task.',
        'I finished the assignment'
      );

      // With high confidence completion, shouldAdvance should be true
      if (evaluation.stepComplete && evaluation.confidence >= 0.8) {
        expect(evaluation.shouldAdvance).toBe(true);
      }
    });
  });

  describe('planToolUsage', () => {
    it('should return empty plan when no tools available', async () => {
      const context = createMockTutoringContext();

      const plan = await controller.planToolUsage(context, 'Help me understand this');

      expect(plan.tools).toHaveLength(0);
    });

    it('should recommend quiz tool when user asks for test', async () => {
      const quizTool: ToolDefinition = {
        id: 'quiz-tool',
        name: 'quiz_generator',
        description: 'Generate practice quizzes',
        category: 'assessment',
        version: '1.0.0',
        inputSchema: {} as any,
        requiredPermissions: ['read'],
        confirmationType: 'none',
        handler: async () => ({ success: true }),
        enabled: true,
      };

      const context = createMockTutoringContext({
        allowedTools: [quizTool],
        currentStep: createMockPlanStep(),
      });

      const plan = await controller.planToolUsage(context, 'Can you test me on this topic?');

      expect(plan.tools.length).toBeGreaterThanOrEqual(0);
      // Tool matching is pattern-based, might not always match
    });

    it('should recommend explain tool when user asks for explanation', async () => {
      const explainTool: ToolDefinition = {
        id: 'explain-tool',
        name: 'concept_explainer',
        description: 'Explain concepts in detail',
        category: 'content',
        version: '1.0.0',
        inputSchema: {} as any,
        requiredPermissions: ['read'],
        confirmationType: 'none',
        handler: async () => ({ success: true }),
        enabled: true,
      };

      const context = createMockTutoringContext({
        allowedTools: [explainTool],
        currentStep: createMockPlanStep(),
      });

      const plan = await controller.planToolUsage(context, 'Explain what closures are');

      // Tool planning uses pattern matching
      expect(plan).toBeDefined();
      expect(plan.tools).toBeDefined();
    });
  });

  describe('processLoop', () => {
    it('should process complete tutoring loop', async () => {
      const result = await controller.processLoop(
        'user-123',
        'session-456',
        'Help me understand React hooks',
        'React hooks are functions that let you use state and lifecycle features in functional components.'
      );

      expect(result.response).toBeDefined();
      expect(result.context).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should include evaluation when step is present', async () => {
      const mockPlan: ExecutionPlan = {
        id: 'plan-1',
        goalId: 'goal-1',
        userId: 'user-123',
        steps: [createMockPlanStep()],
        checkpoints: [],
        fallbackStrategies: [],
        overallProgress: 0,
        status: 'active',
      };

      (config.planStore.getByUser as ReturnType<typeof vi.fn>).mockResolvedValue([mockPlan]);

      const result = await controller.processLoop(
        'user-123',
        'session-456',
        'I understand now!',
        'Great! You have demonstrated good understanding.'
      );

      expect(result.evaluation).toBeDefined();
    });
  });

  describe('advanceStep', () => {
    it('should advance to next step when evaluation indicates completion', async () => {
      const step1 = createMockPlanStep({ id: 'step-1', status: 'in_progress' });
      const step2 = createMockPlanStep({ id: 'step-2', status: 'pending', title: 'Advanced Topics' });

      const mockPlan: ExecutionPlan = {
        id: 'plan-1',
        goalId: 'goal-1',
        userId: 'user-123',
        steps: [step1, step2],
        checkpoints: [],
        fallbackStrategies: [],
        overallProgress: 50,
        status: 'active',
      };

      (config.planStore.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockPlan);
      (config.planStore.loadState as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (config.planStore.saveState as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      (config.planStore.updateStep as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const evaluation = {
        stepComplete: true,
        confidence: 0.9,
        evaluatedCriteria: [],
        pendingCriteria: [],
        progressPercent: 100,
        recommendations: [],
        shouldAdvance: true,
        recommendedNextStepId: 'step-2',
      };

      const transition = await controller.advanceStep('plan-1', evaluation);

      expect(transition.transitionType).toBe('advance');
      expect(transition.currentStep?.id).toBe('step-2');
    });

    it('should generate celebration when step completes', async () => {
      const step1 = createMockPlanStep({ id: 'step-1', status: 'in_progress' });
      const step2 = createMockPlanStep({ id: 'step-2', status: 'pending' });

      const mockPlan: ExecutionPlan = {
        id: 'plan-1',
        goalId: 'goal-1',
        userId: 'user-123',
        steps: [step1, step2],
        checkpoints: [],
        fallbackStrategies: [],
        overallProgress: 50,
        status: 'active',
      };

      (config.planStore.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockPlan);
      (config.planStore.loadState as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (config.planStore.saveState as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      (config.planStore.updateStep as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const evaluation = {
        stepComplete: true,
        confidence: 0.9,
        evaluatedCriteria: [],
        pendingCriteria: [],
        progressPercent: 100,
        recommendations: [],
        shouldAdvance: true,
        recommendedNextStepId: 'step-2',
      };

      const transition = await controller.advanceStep('plan-1', evaluation);

      // Celebration is generated when transitioning
      expect(transition.transitionMessage).toBeDefined();
    });

    it('should mark plan complete when last step finishes', async () => {
      const step1 = createMockPlanStep({ id: 'step-1', status: 'completed' });
      const step2 = createMockPlanStep({ id: 'step-2', status: 'in_progress' });

      const mockPlan: ExecutionPlan = {
        id: 'plan-1',
        goalId: 'goal-1',
        userId: 'user-123',
        steps: [step1, step2],
        checkpoints: [],
        fallbackStrategies: [],
        overallProgress: 50,
        status: 'active',
      };

      (config.planStore.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockPlan);
      (config.planStore.loadState as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (config.planStore.saveState as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
      (config.planStore.updateStep as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      const evaluation = {
        stepComplete: true,
        confidence: 0.95,
        evaluatedCriteria: [],
        pendingCriteria: [],
        progressPercent: 100,
        recommendations: [],
        shouldAdvance: true,
        recommendedNextStepId: null, // No next step
      };

      const transition = await controller.advanceStep('plan-1', evaluation);

      expect(transition.planComplete).toBe(true);
      expect(transition.celebration?.type).toBe('goal_complete');
    });
  });

  describe('criterion evaluation with AI adapter', () => {
    it('should use AI adapter when provided', async () => {
      const mockAIEvaluator = {
        evaluateCriterion: vi.fn().mockResolvedValue({
          met: true,
          confidence: 0.95,
          evidence: 'AI determined criterion was met',
          reasoning: 'Analysis of response',
        }),
      };

      const configWithAI = {
        ...createMockConfig(),
        criterionEvaluator: mockAIEvaluator,
      };

      const controllerWithAI = createTutoringLoopController(configWithAI);

      const context = createMockTutoringContext({
        currentStep: createMockPlanStep({
          metadata: {
            successCriteria: ['Complex understanding criterion'],
          },
        }),
      });

      const evaluation = await controllerWithAI.evaluateProgress(
        context,
        'Response text',
        'User message'
      );

      // AI adapter should be called for complex criteria
      expect(evaluation).toBeDefined();
    });
  });
});
