/**
 * Tests for lib/sam/agentic-bridge.ts
 *
 * This module re-exports from ./agentic/index.ts.
 * We verify that all expected exports are present.
 */

jest.mock('@/lib/sam/agentic/index', () => ({
  SAMAgenticBridge: class MockSAMAgenticBridge {},
  createSAMAgenticBridge: jest.fn(),
  createMinimalAgenticBridge: jest.fn(),
  GoalPlanningService: class MockGoalPlanningService {},
  ToolExecutionService: class MockToolExecutionService {},
  InterventionService: class MockInterventionService {},
  SelfEvaluationService: class MockSelfEvaluationService {},
  LearningAnalyticsService: class MockLearningAnalyticsService {},
  defaultLogger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  GoalStatus: { ACTIVE: 'active', COMPLETED: 'completed', PAUSED: 'paused' },
  PlanStatus: { ACTIVE: 'active', COMPLETED: 'completed', FAILED: 'failed' },
  ConfidenceLevel: { HIGH: 'high', MEDIUM: 'medium', LOW: 'low' },
  MasteryLevel: { BEGINNER: 'beginner', INTERMEDIATE: 'intermediate', ADVANCED: 'advanced' },
  CAPABILITIES: {},
  hasCapability: jest.fn(),
}));

import {
  SAMAgenticBridge,
  createSAMAgenticBridge,
  createMinimalAgenticBridge,
  GoalPlanningService,
  ToolExecutionService,
  InterventionService,
  SelfEvaluationService,
  LearningAnalyticsService,
  defaultLogger,
  GoalStatus,
  PlanStatus,
  ConfidenceLevel,
  MasteryLevel,
  CAPABILITIES,
  hasCapability,
} from '@/lib/sam/agentic-bridge';

describe('agentic-bridge re-exports', () => {
  it('should export SAMAgenticBridge class', () => {
    expect(SAMAgenticBridge).toBeDefined();
  });

  it('should export factory functions', () => {
    expect(typeof createSAMAgenticBridge).toBe('function');
    expect(typeof createMinimalAgenticBridge).toBe('function');
  });

  it('should export domain services', () => {
    expect(GoalPlanningService).toBeDefined();
    expect(ToolExecutionService).toBeDefined();
    expect(InterventionService).toBeDefined();
    expect(SelfEvaluationService).toBeDefined();
    expect(LearningAnalyticsService).toBeDefined();
  });

  it('should export shared types and config', () => {
    expect(defaultLogger).toBeDefined();
    expect(defaultLogger).toHaveProperty('info');
  });

  it('should export enums from @sam-ai/agentic', () => {
    expect(GoalStatus).toBeDefined();
    expect(PlanStatus).toBeDefined();
    expect(ConfidenceLevel).toBeDefined();
    expect(MasteryLevel).toBeDefined();
  });

  it('should export CAPABILITIES and hasCapability', () => {
    expect(CAPABILITIES).toBeDefined();
    expect(typeof hasCapability).toBe('function');
  });
});
