/**
 * @sam-ai/agentic - PlanBuilder Tests
 * Comprehensive tests for plan building functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PlanBuilder,
  createPlanBuilder,
  type PlanBuilderConfig,
  type PlanConstraints,
  type PlanAdaptationRequest,
} from '../src/goal-planning/plan-builder';
import {
  type LearningGoal,
  type GoalDecomposition,
  type SubGoal,
  GoalPriority,
  GoalStatus,
  SubGoalType,
  MasteryLevel,
  PlanStatus,
  StepStatus,
  StepType,
} from '../src/goal-planning/types';

// ============================================================================
// MOCK DATA
// ============================================================================

const mockLearningGoal: LearningGoal = {
  id: 'goal-1',
  userId: 'user-123',
  title: 'Master TypeScript',
  description: 'Learn TypeScript fundamentals and advanced patterns',
  priority: GoalPriority.HIGH,
  status: GoalStatus.ACTIVE,
  context: {
    courseId: 'course-123',
    chapterId: 'chapter-1',
    currentMastery: MasteryLevel.NOVICE,
    availableTimeMinutes: 120,
  },
  targetMastery: MasteryLevel.PROFICIENT,
  targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
  estimatedTotalMinutes: 300,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockSubGoals: SubGoal[] = [
  {
    id: 'sub-1',
    goalId: 'goal-1',
    title: 'TypeScript Basics',
    description: 'Learn basic types and syntax',
    type: SubGoalType.LEARN,
    order: 0,
    estimatedMinutes: 45,
    targetMastery: MasteryLevel.COMPETENT,
    currentMastery: MasteryLevel.NOVICE,
    prerequisites: [],
    isOptional: false,
  },
  {
    id: 'sub-2',
    goalId: 'goal-1',
    title: 'Practice Types',
    description: 'Practice using TypeScript types',
    type: SubGoalType.PRACTICE,
    order: 1,
    estimatedMinutes: 60,
    targetMastery: MasteryLevel.PROFICIENT,
    currentMastery: MasteryLevel.NOVICE,
    prerequisites: ['sub-1'],
    isOptional: false,
  },
  {
    id: 'sub-3',
    goalId: 'goal-1',
    title: 'Advanced Types',
    description: 'Learn advanced type patterns',
    type: SubGoalType.LEARN,
    order: 2,
    estimatedMinutes: 60,
    targetMastery: MasteryLevel.PROFICIENT,
    currentMastery: MasteryLevel.NOVICE,
    prerequisites: ['sub-2'],
    isOptional: false,
  },
  {
    id: 'sub-4',
    goalId: 'goal-1',
    title: 'TypeScript Quiz',
    description: 'Assessment on TypeScript knowledge',
    type: SubGoalType.ASSESS,
    order: 3,
    estimatedMinutes: 30,
    targetMastery: MasteryLevel.PROFICIENT,
    currentMastery: MasteryLevel.NOVICE,
    prerequisites: ['sub-3'],
    isOptional: false,
  },
];

const mockDecomposition: GoalDecomposition = {
  goalId: 'goal-1',
  subGoals: mockSubGoals,
  dependencies: {
    nodes: ['sub-1', 'sub-2', 'sub-3', 'sub-4'],
    edges: [
      { from: 'sub-1', to: 'sub-2', type: 'prerequisite' },
      { from: 'sub-2', to: 'sub-3', type: 'prerequisite' },
      { from: 'sub-3', to: 'sub-4', type: 'prerequisite' },
    ],
  },
  estimatedTotalMinutes: 195,
  createdAt: new Date(),
};

// ============================================================================
// TESTS
// ============================================================================

describe('PlanBuilder', () => {
  let builder: PlanBuilder;
  let config: PlanBuilderConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    config = {
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    };
    builder = new PlanBuilder(config);
  });

  describe('constructor', () => {
    it('should create a PlanBuilder instance', () => {
      expect(builder).toBeInstanceOf(PlanBuilder);
    });

    it('should use default options if not provided', () => {
      const defaultBuilder = new PlanBuilder();
      expect(defaultBuilder).toBeInstanceOf(PlanBuilder);
    });

    it('should merge custom options with defaults', () => {
      const customBuilder = new PlanBuilder({
        defaultOptions: { dailyMinutes: 90 },
      });
      expect(customBuilder).toBeInstanceOf(PlanBuilder);
    });
  });

  describe('createPlanBuilder factory', () => {
    it('should create a PlanBuilder using factory function', () => {
      const instance = createPlanBuilder(config);
      expect(instance).toBeInstanceOf(PlanBuilder);
    });
  });

  describe('createPlan', () => {
    it('should create an execution plan from decomposition', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition);

      expect(plan).toBeDefined();
      expect(plan.goalId).toBe(mockLearningGoal.id);
      expect(plan.userId).toBe(mockLearningGoal.userId);
      expect(plan.status).toBe(PlanStatus.DRAFT);
    });

    it('should create steps from sub-goals', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition);

      expect(plan.steps).toHaveLength(4);
      expect(plan.steps[0].title).toBe('TypeScript Basics');
      expect(plan.steps[0].status).toBe(StepStatus.PENDING);
    });

    it('should map sub-goal types to step types', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition);

      expect(plan.steps[0].type).toBe(StepType.READ_CONTENT); // LEARN -> READ_CONTENT
      expect(plan.steps[1].type).toBe(StepType.PRACTICE_PROBLEM); // PRACTICE -> PRACTICE_PROBLEM
      expect(plan.steps[3].type).toBe(StepType.TAKE_QUIZ); // ASSESS -> TAKE_QUIZ
    });

    it('should order steps topologically', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition);

      expect(plan.steps[0].order).toBe(0);
      expect(plan.steps[1].order).toBe(1);
      expect(plan.steps[2].order).toBe(2);
      expect(plan.steps[3].order).toBe(3);
    });

    it('should generate a schedule when requested', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition, {
        generateSchedule: true,
        dailyMinutes: 60,
      });

      expect(plan.schedule).toBeDefined();
      expect(plan.schedule?.sessions.length).toBeGreaterThan(0);
    });

    it('should generate checkpoints when requested', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition, {
        includeCheckpoints: true,
      });

      expect(plan.checkpoints.length).toBeGreaterThan(0);
    });

    it('should generate fallback strategies when requested', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition, {
        includeFallbacks: true,
      });

      expect(plan.fallbackStrategies.length).toBeGreaterThan(0);
    });

    it('should skip schedule generation when disabled', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition, {
        generateSchedule: false,
      });

      expect(plan.schedule).toBeUndefined();
    });
  });

  describe('optimizePlan', () => {
    it('should apply time constraints', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition);
      const constraints: PlanConstraints = { maxTotalMinutes: 100 };

      const optimized = builder.optimizePlan(plan, constraints);

      const totalMinutes = optimized.steps.reduce(
        (sum, s) => sum + s.estimatedMinutes,
        0
      );
      expect(totalMinutes).toBeLessThanOrEqual(100);
    });

    it('should apply deadline constraints', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition);
      const deadline = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
      const constraints: PlanConstraints = { deadline };

      const optimized = builder.optimizePlan(plan, constraints);

      expect(optimized.targetDate).toEqual(deadline);
    });

    it('should apply daily limit constraints', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition, {
        generateSchedule: true,
        dailyMinutes: 120,
      });

      const constraints: PlanConstraints = { maxDailyMinutes: 45 };
      const optimized = builder.optimizePlan(plan, constraints);

      if (optimized.schedule) {
        optimized.schedule.sessions.forEach((session) => {
          expect(session.estimatedMinutes).toBeLessThanOrEqual(45 + 30); // Allow for single large step
        });
      }
    });
  });

  describe('adaptPlan', () => {
    it('should increase difficulty for target steps', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition);
      const adaptation: PlanAdaptationRequest = {
        type: 'difficulty_increase',
        targetStepIds: [plan.steps[1].id],
      };

      const adapted = builder.adaptPlan(plan, adaptation);

      const targetStep = adapted.steps.find((s) => s.id === plan.steps[1].id);
      expect(targetStep?.metadata?.difficulty).toBe('increased');
    });

    it('should decrease difficulty and increase time', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition);
      const originalMinutes = plan.steps[0].estimatedMinutes;
      const adaptation: PlanAdaptationRequest = {
        type: 'difficulty_decrease',
        targetStepIds: [plan.steps[0].id],
      };

      const adapted = builder.adaptPlan(plan, adaptation);

      const targetStep = adapted.steps.find((s) => s.id === plan.steps[0].id);
      expect(targetStep?.metadata?.difficulty).toBe('decreased');
      expect(targetStep?.estimatedMinutes).toBeGreaterThan(originalMinutes);
    });

    it('should add support steps', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition);
      const originalCount = plan.steps.length;
      const adaptation: PlanAdaptationRequest = {
        type: 'add_support',
        targetStepIds: [plan.steps[1].id],
      };

      const adapted = builder.adaptPlan(plan, adaptation);

      expect(adapted.steps.length).toBeGreaterThan(originalCount);
    });

    it('should skip specified steps', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition);
      const adaptation: PlanAdaptationRequest = {
        type: 'skip_ahead',
        targetStepIds: [plan.steps[0].id],
      };

      const adapted = builder.adaptPlan(plan, adaptation);

      const skippedStep = adapted.steps.find((s) => s.id === plan.steps[0].id);
      expect(skippedStep?.status).toBe(StepStatus.SKIPPED);
    });

    it('should update schedule when rescheduling', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition, {
        generateSchedule: true,
      });

      const newSchedule = {
        dailyMinutes: 90,
        sessions: [],
      };

      const adaptation: PlanAdaptationRequest = {
        type: 'reschedule',
        newSchedule,
      };

      const adapted = builder.adaptPlan(plan, adaptation);

      expect(adapted.schedule?.dailyMinutes).toBe(90);
    });
  });

  describe('calculateProgress', () => {
    it('should calculate 0% progress for a new plan', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition);
      const progress = builder.calculateProgress(plan);

      expect(progress.overallPercentage).toBe(0);
      expect(progress.stepStats.completed).toBe(0);
      expect(progress.stepStats.pending).toBe(4);
    });

    it('should calculate progress with completed steps', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition);
      plan.steps[0].status = StepStatus.COMPLETED;
      plan.steps[1].status = StepStatus.COMPLETED;

      const progress = builder.calculateProgress(plan);

      expect(progress.overallPercentage).toBe(50);
      expect(progress.stepStats.completed).toBe(2);
    });

    it('should track in-progress steps', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition);
      plan.steps[0].status = StepStatus.COMPLETED;
      plan.steps[1].status = StepStatus.IN_PROGRESS;

      const progress = builder.calculateProgress(plan);

      expect(progress.stepStats.inProgress).toBe(1);
      expect(progress.currentStep?.id).toBe(plan.steps[1].id);
    });

    it('should track failed and skipped steps', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition);
      plan.steps[0].status = StepStatus.FAILED;
      plan.steps[1].status = StepStatus.SKIPPED;

      const progress = builder.calculateProgress(plan);

      expect(progress.stepStats.failed).toBe(1);
      expect(progress.stepStats.skipped).toBe(1);
    });

    it('should calculate time stats', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition);
      plan.steps[0].status = StepStatus.COMPLETED;
      plan.steps[0].actualMinutes = 40;

      const progress = builder.calculateProgress(plan);

      expect(progress.timeStats.completed).toBe(40);
      expect(progress.timeStats.remaining).toBeGreaterThan(0);
    });

    it('should identify next pending step', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition);
      plan.steps[0].status = StepStatus.COMPLETED;

      const progress = builder.calculateProgress(plan);

      expect(progress.nextStep?.id).toBe(plan.steps[1].id);
    });
  });

  describe('schedule generation', () => {
    it('should distribute steps across days', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition, {
        generateSchedule: true,
        dailyMinutes: 60,
      });

      expect(plan.schedule).toBeDefined();
      expect(plan.schedule?.sessions.length).toBeGreaterThan(1);
    });

    it('should respect excluded days', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition, {
        generateSchedule: true,
        dailyMinutes: 60,
        excludeDays: [0, 6], // Exclude weekends
      });

      if (plan.schedule) {
        plan.schedule.sessions.forEach((session) => {
          const dayOfWeek = session.date.getDay();
          expect(dayOfWeek).not.toBe(0);
          expect(dayOfWeek).not.toBe(6);
        });
      }
    });

    it('should respect max days ahead limit', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition, {
        generateSchedule: true,
        dailyMinutes: 10, // Very low to spread over many days
        maxDaysAhead: 5,
      });

      if (plan.schedule) {
        const firstDate = plan.schedule.sessions[0].date;
        const lastDate = plan.schedule.sessions[plan.schedule.sessions.length - 1].date;
        const daysDiff = Math.ceil(
          (lastDate.getTime() - firstDate.getTime()) / (24 * 60 * 60 * 1000)
        );
        expect(daysDiff).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('checkpoint generation', () => {
    it('should create milestone checkpoints', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition, {
        includeCheckpoints: true,
      });

      const milestones = plan.checkpoints.filter((c) => c.type === 'milestone');
      expect(milestones.length).toBeGreaterThan(0);
    });

    it('should create assessment checkpoints', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition, {
        includeCheckpoints: true,
      });

      const assessments = plan.checkpoints.filter((c) => c.type === 'assessment');
      expect(assessments.length).toBeGreaterThan(0);
    });

    it('should link checkpoints to steps', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition, {
        includeCheckpoints: true,
      });

      plan.checkpoints.forEach((checkpoint) => {
        expect(checkpoint.stepId).toBeDefined();
        const step = plan.steps.find((s) => s.id === checkpoint.stepId);
        expect(step).toBeDefined();
      });
    });
  });

  describe('fallback strategies', () => {
    it('should include step failure fallback', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition, {
        includeFallbacks: true,
      });

      const stepFailureFallback = plan.fallbackStrategies.find(
        (f) => f.trigger.type === 'step_failed'
      );
      expect(stepFailureFallback).toBeDefined();
    });

    it('should include stuck too long fallback', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition, {
        includeFallbacks: true,
      });

      const stuckFallback = plan.fallbackStrategies.find(
        (f) => f.trigger.type === 'stuck_too_long'
      );
      expect(stuckFallback).toBeDefined();
    });

    it('should have prioritized fallback strategies', async () => {
      const plan = await builder.createPlan(mockLearningGoal, mockDecomposition, {
        includeFallbacks: true,
      });

      const priorities = plan.fallbackStrategies.map((f) => f.priority);
      const sortedPriorities = [...priorities].sort((a, b) => a - b);
      expect(priorities).toEqual(sortedPriorities);
    });
  });
});
