/**
 * Tests for CoordinatorBridge (Gap 2)
 *
 * Verifies delegation logic, coordinator wiring, and fallback behavior.
 */

// Mock the multi-agent coordinator before imports
jest.mock('@/lib/sam/multi-agent-coordinator', () => {
  const mockCoordinate = jest.fn();
  const mockGetAllAgents = jest.fn().mockReturnValue([]);
  const mockRegisterAgent = jest.fn();

  return {
    getMultiAgentCoordinator: jest.fn().mockReturnValue({
      coordinate: mockCoordinate,
      getAllAgents: mockGetAllAgents,
      registerAgent: mockRegisterAgent,
    }),
    AgentType: { SAFETY: 'safety', QUALITY: 'quality', PEDAGOGY: 'pedagogy' },
    AgentPriority: { CRITICAL: 'critical', HIGH: 'high', MEDIUM: 'medium' },
    DecisionType: { CONSENSUS: 'consensus' },
    createSafetyAgentExecutor: jest.fn().mockReturnValue(jest.fn()),
    createQualityAgentExecutor: jest.fn().mockReturnValue(jest.fn()),
    createPedagogyAgentExecutor: jest.fn().mockReturnValue(jest.fn()),
  };
});

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import { CoordinatorBridge, getCoordinatorBridge } from '@/lib/sam/agentic-chat/coordinator-bridge';
import type { ClassifiedIntent } from '@/lib/sam/agentic-chat/types';

// =============================================================================
// TEST HELPERS
// =============================================================================

function makeIntent(overrides: Partial<ClassifiedIntent> = {}): ClassifiedIntent {
  return {
    intent: 'question',
    shouldUseTool: false,
    shouldCheckGoals: false,
    shouldCheckInterventions: false,
    toolHints: [],
    confidence: 0.8,
    ...overrides,
  };
}

// =============================================================================
// TESTS
// =============================================================================

describe('CoordinatorBridge', () => {
  let bridge: CoordinatorBridge;

  beforeEach(() => {
    bridge = new CoordinatorBridge();
  });

  describe('shouldDelegate', () => {
    it('should delegate for complex intent types', () => {
      const intent = makeIntent({ intent: 'content_generate' });
      const result = bridge.shouldDelegate(intent, 'Generate a study plan');

      expect(result.shouldDelegate).toBe(true);
      expect(result.reason).toContain('Complex intent type');
    });

    it('should delegate for assessment intents', () => {
      const intent = makeIntent({ intent: 'assessment' });
      const result = bridge.shouldDelegate(intent, 'Create a quiz');

      expect(result.shouldDelegate).toBe(true);
    });

    it('should delegate when multiple cross-domain keywords present', () => {
      const intent = makeIntent();
      const result = bridge.shouldDelegate(
        intent,
        'Compare and analyze these two approaches'
      );

      expect(result.shouldDelegate).toBe(true);
      expect(result.reason).toContain('Cross-domain complexity');
    });

    it('should delegate when multiple tool hints exist', () => {
      const intent = makeIntent({ toolHints: ['quiz-generator', 'content-analyzer'] });
      const result = bridge.shouldDelegate(intent, 'Help me study');

      expect(result.shouldDelegate).toBe(true);
      expect(result.reason).toContain('Multiple tool hints');
    });

    it('should NOT delegate for simple questions', () => {
      const intent = makeIntent({ intent: 'question' });
      const result = bridge.shouldDelegate(intent, 'What is recursion?');

      expect(result.shouldDelegate).toBe(false);
      expect(result.reason).toContain('Simple query');
    });

    it('should NOT delegate for greetings', () => {
      const intent = makeIntent({ intent: 'greeting' });
      const result = bridge.shouldDelegate(intent, 'Hello SAM');

      expect(result.shouldDelegate).toBe(false);
    });

    it('should NOT delegate with only one cross-domain keyword', () => {
      const intent = makeIntent();
      const result = bridge.shouldDelegate(intent, 'Can you analyze this?');

      expect(result.shouldDelegate).toBe(false);
    });
  });

  describe('delegateToCoordinator', () => {
    it('should call coordinator.coordinate with correct input', async () => {
      const { getMultiAgentCoordinator } = jest.requireMock(
        '@/lib/sam/multi-agent-coordinator'
      );
      const coordinator = getMultiAgentCoordinator();
      coordinator.coordinate.mockResolvedValue({
        success: true,
        content: 'Coordinated response',
        suggestions: [{ content: 'Try this' }],
        warnings: [],
        modifications: [],
        confidence: 0.9,
        metadata: { agentsRun: 3 },
      });

      const result = await bridge.delegateToCoordinator('Design a study plan', {
        userId: 'user-1',
        courseId: 'course-1',
        intent: makeIntent({ intent: 'content_generate' }),
      });

      expect(result.success).toBe(true);
      expect(result.content).toBe('Coordinated response');
      expect(result.confidence).toBe(0.9);
      expect(result.agentsUsed).toBe(3);
      expect(result.suggestions).toEqual(['Try this']);
    });

    it('should return failure result when coordinator throws', async () => {
      const { getMultiAgentCoordinator } = jest.requireMock(
        '@/lib/sam/multi-agent-coordinator'
      );
      const coordinator = getMultiAgentCoordinator();
      coordinator.coordinate.mockRejectedValue(new Error('Coordinator failed'));

      const result = await bridge.delegateToCoordinator('test', {
        userId: 'user-1',
        intent: makeIntent(),
      });

      expect(result.success).toBe(false);
      expect(result.content).toBeNull();
      expect(result.warnings).toContain(
        'Multi-agent coordination failed, using standard processing'
      );
    });

    it('should register default agents on first call', async () => {
      const { getMultiAgentCoordinator } = jest.requireMock(
        '@/lib/sam/multi-agent-coordinator'
      );
      const coordinator = getMultiAgentCoordinator();
      coordinator.getAllAgents.mockReturnValue([]);
      coordinator.coordinate.mockResolvedValue({
        success: true,
        content: null,
        suggestions: [],
        warnings: [],
        modifications: [],
        confidence: 0.5,
        metadata: { agentsRun: 0 },
      });

      await bridge.delegateToCoordinator('test', {
        userId: 'user-1',
        intent: makeIntent(),
      });

      expect(coordinator.registerAgent).toHaveBeenCalledTimes(3);
    });
  });

  describe('getCoordinatorBridge singleton', () => {
    it('should return the same instance', () => {
      const a = getCoordinatorBridge();
      const b = getCoordinatorBridge();
      expect(a).toBe(b);
    });
  });
});
