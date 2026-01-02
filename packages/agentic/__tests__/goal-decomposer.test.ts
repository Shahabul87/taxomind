/**
 * @sam-ai/agentic - GoalDecomposer Tests
 * Comprehensive tests for goal decomposition functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  GoalDecomposer,
  createGoalDecomposer,
  type GoalDecomposerConfig,
} from '../src/goal-planning/goal-decomposer';
import {
  type LearningGoal,
  type GoalContext,
  GoalPriority,
  GoalStatus,
  SubGoalType,
  MasteryLevel,
  StepStatus,
} from '../src/goal-planning/types';
import type { AIAdapter } from '@sam-ai/core';

// ============================================================================
// MOCK DATA
// ============================================================================

const mockGoalContext: GoalContext = {
  courseId: 'course-123',
  chapterId: 'chapter-1',
  sectionId: 'section-1',
  currentMastery: MasteryLevel.NOVICE,
  availableTimeMinutes: 120,
  preferredLearningStyle: 'visual',
  previousAttempts: [],
  recentTopics: [],
  struggleAreas: [],
};

const mockLearningGoal: LearningGoal = {
  id: 'goal-1',
  userId: 'user-123',
  title: 'Master React Hooks',
  description: 'Learn to use React hooks effectively including useState, useEffect, and custom hooks',
  priority: GoalPriority.HIGH,
  status: GoalStatus.ACTIVE,
  context: mockGoalContext,
  targetMastery: MasteryLevel.PROFICIENT,
  currentMastery: MasteryLevel.NOVICE,
  estimatedTotalMinutes: 180,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAIResponse = JSON.stringify({
  subGoals: [
    {
      title: 'Understand useState Hook',
      description: 'Learn the basics of useState for state management',
      type: 'learn',
      estimatedMinutes: 30,
      difficulty: 'easy',
      prerequisites: [],
      successCriteria: ['Understand state concept', 'Can create stateful components'],
    },
    {
      title: 'Practice useState',
      description: 'Apply useState in practical exercises',
      type: 'practice',
      estimatedMinutes: 45,
      difficulty: 'medium',
      prerequisites: [0],
      successCriteria: ['Complete 3 exercises'],
    },
    {
      title: 'Understand useEffect Hook',
      description: 'Learn useEffect for side effects',
      type: 'learn',
      estimatedMinutes: 30,
      difficulty: 'medium',
      prerequisites: [0],
      successCriteria: ['Understand lifecycle', 'Know cleanup patterns'],
    },
    {
      title: 'Assessment: React Hooks',
      description: 'Test understanding of React hooks',
      type: 'assess',
      estimatedMinutes: 20,
      difficulty: 'medium',
      prerequisites: [1, 2],
      successCriteria: ['Score 80% or higher'],
    },
  ],
  overallDifficulty: 'medium',
  reasoning: 'Structured learning path from basics to assessment',
});

const createMockAIAdapter = (): AIAdapter => ({
  chat: vi.fn().mockResolvedValue({
    content: mockAIResponse,
    model: 'test-model',
    usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
  }),
});

// ============================================================================
// TESTS
// ============================================================================

describe('GoalDecomposer', () => {
  let decomposer: GoalDecomposer;
  let config: GoalDecomposerConfig;
  let mockAIAdapter: AIAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAIAdapter = createMockAIAdapter();
    config = {
      aiAdapter: mockAIAdapter,
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    };
    decomposer = new GoalDecomposer(config);
  });

  describe('constructor', () => {
    it('should create a GoalDecomposer instance', () => {
      expect(decomposer).toBeInstanceOf(GoalDecomposer);
    });

    it('should use console as default logger', () => {
      const decomposerNoLogger = new GoalDecomposer({
        aiAdapter: mockAIAdapter,
      });
      expect(decomposerNoLogger).toBeInstanceOf(GoalDecomposer);
    });
  });

  describe('createGoalDecomposer factory', () => {
    it('should create a GoalDecomposer using factory function', () => {
      const instance = createGoalDecomposer(config);
      expect(instance).toBeInstanceOf(GoalDecomposer);
    });
  });

  describe('decompose', () => {
    it('should decompose a goal into sub-goals', async () => {
      const result = await decomposer.decompose(mockLearningGoal);

      expect(result).toBeDefined();
      expect(result.goalId).toBe(mockLearningGoal.id);
      expect(result.subGoals).toHaveLength(4);
      expect(result.subGoals[0].title).toBe('Understand useState Hook');
    });

    it('should call AI adapter with correct messages', async () => {
      await decomposer.decompose(mockLearningGoal);

      expect(mockAIAdapter.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user' }),
          ]),
        })
      );
    });

    it('should generate a dependency graph', async () => {
      const result = await decomposer.decompose(mockLearningGoal);

      expect(result.dependencies).toBeDefined();
      expect(result.dependencies.nodes.length).toBe(4);
      expect(result.dependencies.edges.length).toBeGreaterThan(0);
    });

    it('should calculate total estimated duration', async () => {
      const result = await decomposer.decompose(mockLearningGoal);

      // 30 + 45 + 30 + 20 = 125 minutes
      expect(result.estimatedDuration).toBe(125);
    });

    it('should handle decomposition options', async () => {
      const result = await decomposer.decompose(mockLearningGoal, {
        maxSubGoals: 3,
        minSubGoals: 2,
      });

      expect(result).toBeDefined();
      expect(mockAIAdapter.chat).toHaveBeenCalled();
    });

    it('should include difficulty in decomposition', async () => {
      const result = await decomposer.decompose(mockLearningGoal);

      expect(result.difficulty).toBe('medium');
    });

    it('should include confidence score', async () => {
      const result = await decomposer.decompose(mockLearningGoal);

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('validateDecomposition', () => {
    it('should validate a decomposition', async () => {
      const decomposition = await decomposer.decompose(mockLearningGoal);
      const validation = decomposer.validateDecomposition(decomposition);

      expect(validation.valid).toBeDefined();
      expect(validation.issues).toBeDefined();
    });

    it('should detect missing prerequisites', async () => {
      const decomposition = await decomposer.decompose(mockLearningGoal);
      // Manually add invalid prerequisite
      decomposition.subGoals[0].prerequisites = ['non-existent-id'];

      const validation = decomposer.validateDecomposition(decomposition);

      expect(validation.issues.some((i) => i.code === 'ORPHANED_SUBGOALS')).toBe(true);
    });

    it('should return valid for correct decomposition', async () => {
      const decomposition = await decomposer.decompose(mockLearningGoal);
      const validation = decomposer.validateDecomposition(decomposition);

      expect(validation.valid).toBe(true);
    });
  });

  describe('refineDecomposition', () => {
    it('should refine a decomposition with adjustments', async () => {
      const decomposition = await decomposer.decompose(mockLearningGoal);
      const originalTitle = decomposition.subGoals[0].title;

      const refined = await decomposer.refineDecomposition(decomposition, {
        adjustments: [
          {
            subGoalId: decomposition.subGoals[0].id,
            changes: { estimatedMinutes: 45 },
          },
        ],
      });

      expect(refined.subGoals[0].estimatedMinutes).toBe(45);
      expect(refined.subGoals[0].title).toBe(originalTitle);
    });

    it('should add new sub-goals', async () => {
      const decomposition = await decomposer.decompose(mockLearningGoal);
      const initialCount = decomposition.subGoals.length;

      const refined = await decomposer.refineDecomposition(decomposition, {
        addSubGoals: [
          {
            title: 'Extra Practice',
            description: 'Additional practice session',
            type: SubGoalType.PRACTICE,
            estimatedMinutes: 30,
            prerequisites: [],
          },
        ],
      });

      expect(refined.subGoals.length).toBe(initialCount + 1);
    });

    it('should remove sub-goals', async () => {
      const decomposition = await decomposer.decompose(mockLearningGoal);
      const initialCount = decomposition.subGoals.length;
      const idToRemove = decomposition.subGoals[decomposition.subGoals.length - 1].id;

      const refined = await decomposer.refineDecomposition(decomposition, {
        removeSubGoalIds: [idToRemove],
      });

      expect(refined.subGoals.length).toBe(initialCount - 1);
    });

    it('should reduce confidence after refinement', async () => {
      const decomposition = await decomposer.decompose(mockLearningGoal);
      const originalConfidence = decomposition.confidence;

      const refined = await decomposer.refineDecomposition(decomposition, {
        adjustments: [
          {
            subGoalId: decomposition.subGoals[0].id,
            changes: { estimatedMinutes: 60 },
          },
        ],
      });

      expect(refined.confidence).toBeLessThan(originalConfidence);
    });

    it('should recalculate estimated duration', async () => {
      const decomposition = await decomposer.decompose(mockLearningGoal);

      const refined = await decomposer.refineDecomposition(decomposition, {
        adjustments: [
          {
            subGoalId: decomposition.subGoals[0].id,
            changes: { estimatedMinutes: 60 },
          },
        ],
      });

      // Original duration + 30 extra minutes
      expect(refined.estimatedDuration).toBeGreaterThan(decomposition.estimatedDuration);
    });
  });

  describe('estimateEffort', () => {
    it('should estimate effort for a goal', async () => {
      const estimate = await decomposer.estimateEffort(mockLearningGoal);

      expect(estimate.totalMinutes).toBeGreaterThan(0);
      expect(estimate.breakdown).toBeDefined();
      expect(estimate.confidence).toBeGreaterThan(0);
    });

    it('should break down effort by type', async () => {
      const estimate = await decomposer.estimateEffort(mockLearningGoal);

      expect(estimate.breakdown.learning).toBeGreaterThanOrEqual(0);
      expect(estimate.breakdown.practice).toBeGreaterThanOrEqual(0);
      expect(estimate.breakdown.assessment).toBeGreaterThanOrEqual(0);
      expect(estimate.breakdown.buffer).toBeGreaterThan(0);
    });

    it('should include effort factors', async () => {
      const estimate = await decomposer.estimateEffort(mockLearningGoal);

      expect(estimate.factors).toBeDefined();
      expect(Array.isArray(estimate.factors)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle AI adapter errors gracefully', async () => {
      (mockAIAdapter.chat as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('AI service unavailable')
      );

      await expect(decomposer.decompose(mockLearningGoal)).rejects.toThrow(
        'AI service unavailable'
      );
    });

    it('should log errors', async () => {
      (mockAIAdapter.chat as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Test error')
      );

      await expect(decomposer.decompose(mockLearningGoal)).rejects.toThrow();

      expect(config.logger?.error).toHaveBeenCalled();
    });

    it('should handle malformed AI response', async () => {
      (mockAIAdapter.chat as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        content: 'not valid json',
        model: 'test-model',
        usage: { promptTokens: 100, completionTokens: 200, totalTokens: 300 },
      });

      await expect(decomposer.decompose(mockLearningGoal)).rejects.toThrow();
    });
  });

  describe('dependency graph generation', () => {
    it('should create edges for prerequisites', async () => {
      const result = await decomposer.decompose(mockLearningGoal);

      // sub-2 (Practice useState) has prerequisite sub-1 (Understand useState)
      const hasPrereqEdge = result.dependencies.edges.some(
        (e) => e.type === 'prerequisite'
      );
      expect(hasPrereqEdge).toBe(true);
    });

    it('should handle complex dependency chains', async () => {
      const result = await decomposer.decompose(mockLearningGoal);

      // Assessment has prerequisites of Practice and useEffect learning
      const assessmentSubGoal = result.subGoals[3];
      expect(assessmentSubGoal.prerequisites.length).toBe(2);
    });

    it('should include all nodes in graph', async () => {
      const result = await decomposer.decompose(mockLearningGoal);

      expect(result.dependencies.nodes.length).toBe(result.subGoals.length);
    });
  });

  describe('sub-goal properties', () => {
    it('should assign unique IDs to sub-goals', async () => {
      const result = await decomposer.decompose(mockLearningGoal);
      const ids = result.subGoals.map((sg) => sg.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should assign correct order to sub-goals', async () => {
      const result = await decomposer.decompose(mockLearningGoal);

      result.subGoals.forEach((sg, index) => {
        expect(sg.order).toBe(index);
      });
    });

    it('should set initial status to PENDING', async () => {
      const result = await decomposer.decompose(mockLearningGoal);

      result.subGoals.forEach((sg) => {
        expect(sg.status).toBe(StepStatus.PENDING);
      });
    });
  });
});
