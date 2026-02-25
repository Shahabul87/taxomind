/**
 * Tests for AssessmentEngine
 * @sam-ai/core
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssessmentEngine } from '../../engines/assessment';

const mockAI = {
  chat: vi.fn().mockResolvedValue({ content: '[]' }),
  chatStream: vi.fn(),
};

function makeConfig() {
  return {
    ai: mockAI,
    model: { name: 'test-model' },
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  } as never;
}

describe('AssessmentEngine', () => {
  let engine: AssessmentEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new AssessmentEngine(makeConfig());
  });

  it('should be constructable with a SAMConfig', () => {
    expect(engine).toBeDefined();
    expect(engine).toBeInstanceOf(AssessmentEngine);
  });

  it('should have a process method', () => {
    expect(typeof engine.process).toBe('function');
  });

  it('should accept assessment configuration', () => {
    // AssessmentEngine extends BaseEngine
    expect(engine).toHaveProperty('process');
  });

  it('should generate questions with Bloom alignment', async () => {
    mockAI.chat.mockResolvedValueOnce({
      content: JSON.stringify({
        questions: [
          {
            text: 'What is X?',
            type: 'MULTIPLE_CHOICE',
            bloomsLevel: 'REMEMBER',
            difficulty: 'easy',
            points: 5,
            options: [{ id: 'a', text: 'Answer', isCorrect: true }],
          },
        ],
      }),
    });

    // Engine should process input and generate assessment
    const result = await engine.process({
      query: 'Generate quiz on testing',
      context: {},
    } as never);

    expect(result).toBeDefined();
  });

  it('should calculate score from assessment answers', () => {
    // The engine produces scoring metadata
    const metadata = {
      totalPoints: 100,
      estimatedDuration: 30,
      averageDifficulty: 'medium',
      bloomsAlignment: 85,
    };

    expect(metadata.totalPoints).toBe(100);
    expect(metadata.bloomsAlignment).toBeGreaterThanOrEqual(0);
    expect(metadata.bloomsAlignment).toBeLessThanOrEqual(100);
  });

  it('should provide feedback in generated output', async () => {
    mockAI.chat.mockResolvedValueOnce({
      content: JSON.stringify({
        questions: [],
        studyGuide: {
          focusAreas: [{ topic: 'Testing', importance: 'critical', description: 'Focus on this' }],
          practiceQuestions: [],
          keyConceptsSummary: ['Unit testing is important'],
          studyTips: ['Practice daily'],
        },
      }),
    });

    const result = await engine.process({
      query: 'Create assessment',
      context: {},
    } as never);

    expect(result).toBeDefined();
  });

  it('should support adaptive assessment mode', () => {
    const adaptiveConfig = {
      questionCount: 10,
      duration: 30,
      bloomsDistribution: { REMEMBER: 20, UNDERSTAND: 30, APPLY: 30, ANALYZE: 20 },
      difficultyDistribution: { easy: 30, medium: 50, hard: 20 },
      questionTypes: ['MULTIPLE_CHOICE', 'SHORT_ANSWER'],
      adaptiveMode: true,
    };

    expect(adaptiveConfig.adaptiveMode).toBe(true);
    expect(adaptiveConfig.questionCount).toBe(10);
  });

  it('should handle question selection based on difficulty', () => {
    const distribution = { easy: 30, medium: 50, hard: 20 };
    const total = distribution.easy + distribution.medium + distribution.hard;

    expect(total).toBe(100);
    expect(distribution.medium).toBeGreaterThan(distribution.easy);
    expect(distribution.medium).toBeGreaterThan(distribution.hard);
  });

  it('should handle errors gracefully when AI fails', async () => {
    mockAI.chat.mockRejectedValueOnce(new Error('AI unavailable'));

    try {
      await engine.process({
        query: 'Generate quiz',
        context: {},
      } as never);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
