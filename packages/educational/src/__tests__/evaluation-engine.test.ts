/**
 * Tests for SAMEvaluationEngine
 * @sam-ai/educational
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SAMEvaluationEngine, createEvaluationEngine } from '../engines/evaluation-engine';

function makeMockAI(response = '{}') {
  return { chat: vi.fn().mockResolvedValue({ content: response }) };
}

function makeConfig(aiOverride?: ReturnType<typeof makeMockAI>, settings = {}) {
  const ai = aiOverride ?? makeMockAI();
  return {
    samConfig: {
      ai,
      model: { name: 'test' },
      logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    } as never,
    settings,
  };
}

describe('SAMEvaluationEngine', () => {
  let engine: SAMEvaluationEngine;
  let mockAI: ReturnType<typeof makeMockAI>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAI = makeMockAI();
    engine = new SAMEvaluationEngine(makeConfig(mockAI));
  });

  it('should evaluate correct multiple choice answer', () => {
    const result = engine.evaluateObjectiveAnswer({
      questionId: 'q1',
      questionType: 'MULTIPLE_CHOICE',
      studentAnswer: 'option a',
      correctAnswer: 'option a',
      points: 10,
      bloomsLevel: 'REMEMBER' as never,
      options: [
        { id: 'a', text: 'Option A', isCorrect: true },
        { id: 'b', text: 'Option B', isCorrect: false },
      ],
    } as never);

    expect(result.isCorrect).toBe(true);
    expect(result.score).toBe(10);
    expect(result.feedback).toBe('Correct!');
  });

  it('should award zero for incorrect answers', () => {
    const result = engine.evaluateObjectiveAnswer({
      questionId: 'q1',
      questionType: 'MULTIPLE_CHOICE',
      studentAnswer: 'wrong',
      correctAnswer: 'option a',
      points: 10,
      bloomsLevel: 'REMEMBER' as never,
      options: [
        { id: 'a', text: 'Option A', isCorrect: true },
        { id: 'b', text: 'Wrong', isCorrect: false },
      ],
    } as never);

    expect(result.isCorrect).toBe(false);
    expect(result.score).toBe(0);
  });

  it('should assess Bloom level through AI evaluation', async () => {
    mockAI.chat.mockResolvedValue({
      content: JSON.stringify({
        score: 8,
        maxScore: 10,
        accuracy: 80,
        completeness: 75,
        relevance: 90,
        depth: 70,
        feedback: 'Good analysis',
        strengths: ['Clear reasoning'],
        improvements: ['Add more examples'],
        nextSteps: ['Practice more'],
        demonstratedBloomsLevel: 'ANALYZE',
      }),
    });

    const result = await engine.evaluateAnswer('Student wrote an analysis...', {
      questionText: 'Analyze the pattern',
      questionType: 'SHORT_ANSWER',
      bloomsLevel: 'ANALYZE' as never,
      maxPoints: 10,
      expectedAnswer: 'A thorough analysis covering...',
    } as never);

    expect(result.score).toBe(8);
    expect(result.demonstratedBloomsLevel).toBe('ANALYZE');
    expect(result.feedback).toBe('Good analysis');
  });

  it('should support rubric-based evaluation via grading assistance', async () => {
    mockAI.chat.mockResolvedValue({
      content: JSON.stringify({
        suggestedScore: 7,
        maxScore: 10,
        confidence: 0.8,
        reasoning: 'Meets most criteria',
        rubricAlignment: [
          { criterionName: 'Clarity', score: 8, maxScore: 10, justification: 'Clear writing' },
        ],
        keyStrengths: ['Well organized'],
        keyWeaknesses: ['Missing examples'],
        suggestedFeedback: 'Good work but add examples',
        flaggedIssues: [],
        comparisonToExpected: {
          coveragePercentage: 70,
          missingKeyPoints: ['point 1'],
          extraneousPoints: [],
          accuracyScore: 80,
        },
        teacherTips: ['Ask for elaboration'],
      }),
    });

    const result = await engine.getGradingAssistance(
      'Explain OOP',
      'OOP is about encapsulation...',
      'OOP uses classes',
      { criteria: ['Clarity', 'Depth'], maxScore: 10 },
      'UNDERSTAND' as never
    );

    expect(result.suggestedScore).toBe(7);
    expect(result.confidence).toBe(0.8);
    expect(result.keyStrengths).toContain('Well organized');
  });

  it('should generate constructive feedback', async () => {
    mockAI.chat.mockResolvedValue({
      content: JSON.stringify({
        score: 5,
        maxScore: 10,
        accuracy: 50,
        completeness: 40,
        relevance: 70,
        depth: 30,
        feedback: 'Partial understanding demonstrated',
        strengths: ['On topic'],
        improvements: ['Expand your analysis'],
        nextSteps: ['Review chapter 3'],
        demonstratedBloomsLevel: 'UNDERSTAND',
      }),
    });

    const result = await engine.evaluateAnswer('Basic answer', {
      questionText: 'Evaluate the approach',
      questionType: 'ESSAY',
      bloomsLevel: 'EVALUATE' as never,
      maxPoints: 10,
      expectedAnswer: 'A comprehensive evaluation...',
    } as never);

    expect(result.improvements).toBeDefined();
    expect(result.improvements!.length).toBeGreaterThan(0);
  });

  it('should evaluate true/false questions', () => {
    const result = engine.evaluateObjectiveAnswer({
      questionId: 'q2',
      questionType: 'TRUE_FALSE',
      studentAnswer: 'true',
      correctAnswer: 'true',
      points: 5,
      bloomsLevel: 'REMEMBER' as never,
    } as never);

    expect(result.isCorrect).toBe(true);
    expect(result.score).toBe(5);
  });

  it('should compute confidence scoring for adaptive questions', async () => {
    mockAI.chat.mockResolvedValue({
      content: JSON.stringify({
        id: 'q-adaptive',
        text: 'What is X?',
        questionType: 'MULTIPLE_CHOICE',
        bloomsLevel: 'UNDERSTAND',
        difficulty: 'MEDIUM',
        options: [{ id: 'a', text: 'A', isCorrect: true }],
        correctAnswer: 'A',
        explanation: 'Because A',
        hints: ['Think about...'],
        timeEstimate: 60,
        points: 10,
        tags: ['testing'],
      }),
    });

    const result = await engine.generateAdaptiveQuestion({
      subject: 'CS',
      topic: 'Testing',
      currentDifficulty: 'MEDIUM' as never,
      previousQuestions: [],
      studentResponses: [
        { questionId: 'q1', isCorrect: true, timeSpent: 30 },
        { questionId: 'q2', isCorrect: true, timeSpent: 25 },
      ],
    } as never);

    expect(result.question).toBeDefined();
    expect(result.performanceAnalysis.accuracy).toBeGreaterThan(0);
  });

  it('should compare student answers for matching questions', () => {
    const result = engine.evaluateObjectiveAnswer({
      questionId: 'q3',
      questionType: 'MATCHING',
      studentAnswer: JSON.stringify({ a: '1', b: '2' }),
      correctAnswer: JSON.stringify({ a: '1', b: '2' }),
      points: 10,
      bloomsLevel: 'APPLY' as never,
    } as never);

    expect(result.isCorrect).toBe(true);
    expect(result.score).toBe(10);
  });

  it('should handle edge case of empty student answer', () => {
    const result = engine.evaluateObjectiveAnswer({
      questionId: 'q4',
      questionType: 'MULTIPLE_CHOICE',
      studentAnswer: '',
      correctAnswer: 'correct',
      points: 10,
      bloomsLevel: 'REMEMBER' as never,
      options: [{ id: 'a', text: 'Correct', isCorrect: true }],
    } as never);

    expect(result.isCorrect).toBe(false);
    expect(result.score).toBe(0);
  });

  it('should handle AI evaluation failure gracefully', async () => {
    mockAI.chat.mockRejectedValue(new Error('Service down'));

    const result = await engine.evaluateAnswer('My answer', {
      questionText: 'Question',
      questionType: 'ESSAY',
      bloomsLevel: 'UNDERSTAND' as never,
      maxPoints: 10,
      expectedAnswer: 'Expected',
    } as never);

    expect(result.feedback).toContain('pending');
    expect(result.score).toBe(0);
  });
});

describe('createEvaluationEngine', () => {
  it('should create engine via factory', () => {
    const engine = createEvaluationEngine(makeConfig());
    expect(engine).toBeInstanceOf(SAMEvaluationEngine);
  });
});
