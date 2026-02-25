/**
 * Tests for PracticeProblemsEngine
 * @sam-ai/educational
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PracticeProblemsEngine, createPracticeProblemsEngine } from '../engines/practice-problems-engine';
import type { PracticeProblem, PracticeProblemConfig } from '../types/practice-problems.types';

function makeProblem(overrides: Partial<PracticeProblem> = {}): PracticeProblem {
  return {
    id: 'prob-1',
    type: 'multiple_choice',
    title: 'Test Problem',
    statement: 'Which of the following is correct?',
    difficulty: 'intermediate',
    bloomsLevel: 'APPLY' as never,
    points: 10,
    timeLimit: 5,
    options: [
      { id: 'a', text: 'Correct', isCorrect: true, explanation: 'This is right' },
      { id: 'b', text: 'Wrong', isCorrect: false, explanation: 'This is wrong' },
    ],
    correctAnswer: 'Correct',
    hints: [
      { id: 'h1', type: 'conceptual', content: 'Think about it', order: 1, penaltyPoints: 2 },
      { id: 'h2', type: 'procedural', content: 'Step by step', order: 2, penaltyPoints: 3 },
      { id: 'h3', type: 'partial_solution', content: 'Almost there', order: 3, penaltyPoints: 5 },
    ],
    solutionExplanation: 'The answer is A because...',
    relatedConcepts: ['testing'],
    prerequisites: [],
    tags: ['testing', 'intermediate'],
    learningObjectives: [],
    createdAt: new Date(),
    ...overrides,
  } as PracticeProblem;
}

describe('PracticeProblemsEngine', () => {
  let engine: PracticeProblemsEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new PracticeProblemsEngine();
  });

  it('should generate problems by topic using templates', async () => {
    const result = await engine.generateProblems({
      topic: 'JavaScript',
      count: 3,
    } as never);

    expect(result.problems.length).toBe(3);
    expect(result.totalCount).toBe(3);
    expect(result.problems[0].tags).toContain('JavaScript');
  });

  it('should support multiple difficulty levels', async () => {
    const beginnerResult = await engine.generateProblems({
      topic: 'Python',
      difficulty: 'beginner',
      count: 2,
      userSkillLevel: 20,
    } as never);

    expect(beginnerResult.problems[0].difficulty).toBe('beginner');
    expect(beginnerResult.problems[0].points).toBe(5);
  });

  it('should align problems with Bloom taxonomy', async () => {
    const result = await engine.generateProblems({
      topic: 'Algorithms',
      bloomsLevel: 'ANALYZE',
      count: 1,
    } as never);

    expect(result.problems[0].bloomsLevel).toBe('ANALYZE');
  });

  it('should generate hints in progressive order', () => {
    const problem = makeProblem();
    const firstHint = engine.getNextHint(problem, []);

    expect(firstHint).not.toBeNull();
    expect(firstHint!.order).toBe(1);
    expect(firstHint!.type).toBe('conceptual');

    const secondHint = engine.getNextHint(problem, [firstHint!.id]);
    expect(secondHint!.order).toBe(2);
  });

  it('should return null when all hints are used', () => {
    const problem = makeProblem();
    const result = engine.getNextHint(problem, ['h1', 'h2', 'h3']);
    expect(result).toBeNull();
  });

  it('should evaluate correct multiple choice answer', async () => {
    const problem = makeProblem();
    const result = await engine.evaluateAttempt(problem, 'a');

    expect(result.isCorrect).toBe(true);
    expect(result.pointsEarned).toBe(10);
    expect(result.nextDifficulty).toBe('advanced');
  });

  it('should evaluate incorrect answer with feedback', async () => {
    const problem = makeProblem();
    const result = await engine.evaluateAttempt(problem, 'b');

    expect(result.isCorrect).toBe(false);
    expect(result.pointsEarned).toBe(0);
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.conceptsToReview).toContain('testing');
  });

  it('should generate prerequisite-aware problems', async () => {
    const result = await engine.generateProblems({
      topic: 'Advanced React',
      count: 2,
      learningObjectives: ['Understand hooks', 'Apply state management'],
    } as never);

    expect(result.coveredObjectives).toContain('Understand hooks');
  });

  it('should adjust difficulty based on user skill level', async () => {
    const lowSkill = await engine.generateProblems({
      topic: 'Math',
      difficulty: 'expert',
      userSkillLevel: 10,
      count: 1,
    } as never);

    expect(lowSkill.problems[0].difficulty).toBe('beginner');
  });

  it('should handle errors in AI generation gracefully', async () => {
    const mockAI = { chat: vi.fn().mockRejectedValue(new Error('AI down')) };
    const engineWithAI = new PracticeProblemsEngine({ aiAdapter: mockAI as never });

    const result = await engineWithAI.generateProblems({
      topic: 'Fallback Test',
      count: 2,
    } as never);

    // Falls back to template generation
    expect(result.problems.length).toBe(2);
  });
});

describe('createPracticeProblemsEngine', () => {
  it('should create engine via factory', () => {
    const engine = createPracticeProblemsEngine();
    expect(engine).toBeInstanceOf(PracticeProblemsEngine);
  });
});
