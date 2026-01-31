/**
 * Tests for response-composer with coordinator content (Gap 2)
 *
 * Verifies that coordinator content and suggestions are properly merged.
 */

import { composeAgenticResponse } from '@/lib/sam/agentic-chat/response-composer';
import type { AgenticChatData, ClassifiedIntent } from '@/lib/sam/agentic-chat/types';

// =============================================================================
// TEST HELPERS
// =============================================================================

function makeEngineResponse() {
  return {
    message: 'Engine response message',
    suggestions: ['Original suggestion'],
    actions: [],
    insights: {},
  };
}

function makeIntent(): ClassifiedIntent {
  return {
    intent: 'question',
    shouldUseTool: false,
    shouldCheckGoals: false,
    shouldCheckInterventions: false,
    toolHints: [],
    confidence: 0.8,
  };
}

function makeAgenticData(overrides: Partial<AgenticChatData> = {}): AgenticChatData {
  return {
    intent: makeIntent(),
    toolResults: [],
    goalContext: null,
    interventionContext: null,
    confidence: null,
    processingTimeMs: 100,
    ...overrides,
  };
}

// =============================================================================
// TESTS
// =============================================================================

describe('composeAgenticResponse', () => {
  it('should return engine response when no agentic data', () => {
    const engine = makeEngineResponse();
    const result = composeAgenticResponse(engine, null);

    expect(result.message).toBe('Engine response message');
    expect(result.suggestions).toEqual(['Original suggestion']);
    expect(result.agenticData).toBeNull();
  });

  it('should pass through agentic data without coordinator content', () => {
    const engine = makeEngineResponse();
    const agentic = makeAgenticData();
    const result = composeAgenticResponse(engine, agentic);

    expect(result.message).toBe('Engine response message');
    expect(result.agenticData).toBe(agentic);
  });

  describe('coordinator content integration', () => {
    it('should prepend coordinator content to engine message', () => {
      const engine = makeEngineResponse();
      const agentic = makeAgenticData({
        coordinatorContent: 'Multi-agent analysis result',
      });
      const result = composeAgenticResponse(engine, agentic);

      expect(result.message).toContain('Multi-agent analysis result');
      expect(result.message).toContain('Engine response message');
      // Coordinator content should come first
      expect(result.message.indexOf('Multi-agent')).toBeLessThan(
        result.message.indexOf('Engine response')
      );
    });

    it('should include coordinator suggestions in output', () => {
      const engine = makeEngineResponse();
      const agentic = makeAgenticData({
        coordinatorSuggestions: ['Coordinator suggestion 1', 'Coordinator suggestion 2'],
      });
      const result = composeAgenticResponse(engine, agentic);

      expect(result.suggestions).toContain('Original suggestion');
      expect(result.suggestions).toContain('Coordinator suggestion 1');
      expect(result.suggestions).toContain('Coordinator suggestion 2');
    });

    it('should handle empty coordinator suggestions', () => {
      const engine = makeEngineResponse();
      const agentic = makeAgenticData({
        coordinatorSuggestions: [],
      });
      const result = composeAgenticResponse(engine, agentic);

      expect(result.suggestions).toEqual(['Original suggestion']);
    });

    it('should handle null coordinatorContent gracefully', () => {
      const engine = makeEngineResponse();
      const agentic = makeAgenticData({
        coordinatorContent: null,
      });
      const result = composeAgenticResponse(engine, agentic);

      expect(result.message).toBe('Engine response message');
    });
  });

  describe('tool result integration', () => {
    it('should append tool summaries to message', () => {
      const engine = makeEngineResponse();
      const agentic = makeAgenticData({
        toolResults: [
          {
            toolId: 'quiz-gen',
            toolName: 'Quiz Generator',
            category: 'assessment',
            status: 'success',
            data: { summary: 'Generated a 10-question quiz' },
            reasoning: null,
            durationMs: 500,
          },
        ],
      });
      const result = composeAgenticResponse(engine, agentic);

      expect(result.message).toContain('Generated a 10-question quiz');
    });

    it('should not include failed tool results', () => {
      const engine = makeEngineResponse();
      const agentic = makeAgenticData({
        toolResults: [
          {
            toolId: 'quiz-gen',
            toolName: 'Quiz Generator',
            category: 'assessment',
            status: 'failure',
            data: null,
            reasoning: null,
            durationMs: 500,
          },
        ],
      });
      const result = composeAgenticResponse(engine, agentic);

      expect(result.message).toBe('Engine response message');
    });
  });

  describe('goal context integration', () => {
    it('should add goal progress to suggestions', () => {
      const engine = makeEngineResponse();
      const agentic = makeAgenticData({
        goalContext: {
          activeGoals: [{ id: 'g1', title: 'Learn TypeScript', progress: 75, status: 'active' }],
          relevantGoal: { id: 'g1', title: 'Learn TypeScript', progress: 75, status: 'active' },
        },
      });
      const result = composeAgenticResponse(engine, agentic);

      expect(result.suggestions.some((s) => s.includes('Learn TypeScript'))).toBe(true);
      expect(result.suggestions.some((s) => s.includes('75%'))).toBe(true);
    });
  });

  describe('intervention context integration', () => {
    it('should add intervention messages to suggestions', () => {
      const engine = makeEngineResponse();
      const agentic = makeAgenticData({
        interventionContext: {
          interventions: [
            {
              id: 'int-1',
              type: 'check-in',
              priority: 'medium',
              message: 'You seem stuck. Want a hint?',
              suggestedActions: [],
            },
          ],
        },
      });
      const result = composeAgenticResponse(engine, agentic);

      expect(result.suggestions).toContain('You seem stuck. Want a hint?');
    });
  });
});
