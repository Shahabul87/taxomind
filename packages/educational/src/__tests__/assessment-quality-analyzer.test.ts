/**
 * Tests for AssessmentQualityAnalyzer
 * @sam-ai/educational
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AssessmentQualityAnalyzer, type ExamData, type QuestionData } from '../analyzers/assessment-quality-analyzer';

function makeQuestion(overrides: Partial<QuestionData> = {}): QuestionData {
  return {
    id: `q-${Math.random().toString(36).slice(2)}`,
    text: 'What is testing?',
    type: 'multiple_choice',
    bloomsLevel: 'REMEMBER',
    difficulty: 3,
    options: [
      { id: 'a', text: 'Verification process', isCorrect: true, explanation: 'Correct' },
      { id: 'b', text: 'Random process', isCorrect: false },
      { id: 'c', text: 'Guessing', isCorrect: false },
      { id: 'd', text: 'None of the above', isCorrect: false },
    ],
    explanation: 'Testing is a verification process',
    feedback: 'Review chapter 2 for more details',
    ...overrides,
  };
}

function makeExam(questions: QuestionData[]): ExamData {
  return { id: 'exam-1', title: 'Test Exam', questions };
}

describe('AssessmentQualityAnalyzer', () => {
  let analyzer: AssessmentQualityAnalyzer;

  beforeEach(() => {
    analyzer = new AssessmentQualityAnalyzer();
  });

  it('should analyze question variety across types', () => {
    const questions = [
      makeQuestion({ type: 'multiple_choice' }),
      makeQuestion({ type: 'true_false' }),
      makeQuestion({ type: 'short_answer' }),
      makeQuestion({ type: 'essay' }),
      makeQuestion({ type: 'coding' }),
    ];

    const result = analyzer.analyzeAssessments([makeExam(questions)]);

    expect(result.questionVariety.uniqueTypes).toBe(5);
    expect(result.questionVariety.score).toBe(100);
  });

  it('should check Bloom taxonomy distribution', () => {
    const questions = [
      makeQuestion({ bloomsLevel: 'REMEMBER' }),
      makeQuestion({ bloomsLevel: 'UNDERSTAND' }),
      makeQuestion({ bloomsLevel: 'APPLY' }),
      makeQuestion({ bloomsLevel: 'ANALYZE' }),
      makeQuestion({ bloomsLevel: 'EVALUATE' }),
      makeQuestion({ bloomsLevel: 'CREATE' }),
    ];

    const result = analyzer.analyzeAssessments([makeExam(questions)]);

    expect(result.bloomsCoverage.coveredLevels.length).toBe(6);
    expect(result.bloomsCoverage.missingLevels.length).toBe(0);
    expect(result.bloomsCoverage.score).toBeGreaterThan(90);
  });

  it('should detect missing Bloom levels', () => {
    const questions = [
      makeQuestion({ bloomsLevel: 'REMEMBER' }),
      makeQuestion({ bloomsLevel: 'REMEMBER' }),
      makeQuestion({ bloomsLevel: 'UNDERSTAND' }),
    ];

    const result = analyzer.analyzeAssessments([makeExam(questions)]);

    expect(result.bloomsCoverage.missingLevels).toContain('APPLY');
    expect(result.bloomsCoverage.missingLevels).toContain('ANALYZE');
    expect(result.bloomsCoverage.missingLevels).toContain('CREATE');
  });

  it('should analyze difficulty distribution for ascending pattern', () => {
    const questions = [
      makeQuestion({ difficulty: 1 }),
      makeQuestion({ difficulty: 2 }),
      makeQuestion({ difficulty: 3 }),
      makeQuestion({ difficulty: 4 }),
      makeQuestion({ difficulty: 5 }),
    ];

    const result = analyzer.analyzeAssessments([makeExam(questions)]);

    expect(result.difficultyProgression.pattern).toBe('ascending');
    expect(result.difficultyProgression.isAppropriate).toBe(true);
    expect(result.difficultyProgression.score).toBe(95);
  });

  it('should analyze distractor quality for MC questions', () => {
    const questions = [
      makeQuestion({
        type: 'multiple_choice',
        options: [
          { id: 'a', text: 'A correct answer here', isCorrect: true },
          { id: 'b', text: 'A plausible alternative', isCorrect: false, explanation: 'Common misconception' },
          { id: 'c', text: 'Another plausible one', isCorrect: false },
          { id: 'd', text: 'Less plausible option', isCorrect: false },
        ],
      }),
    ];

    const result = analyzer.analyzeAssessments([makeExam(questions)]);

    expect(result.distractorAnalysis).not.toBeNull();
    expect(result.distractorAnalysis!.averagePlausibility).toBeGreaterThan(0);
  });

  it('should detect bias toward single question type', () => {
    const questions = Array.from({ length: 10 }, () =>
      makeQuestion({ type: 'multiple_choice' })
    );

    const result = analyzer.analyzeAssessments([makeExam(questions)]);

    expect(result.questionVariety.uniqueTypes).toBe(1);
    expect(result.questionVariety.score).toBeLessThan(50);
  });

  it('should estimate reliability through overall score', () => {
    const diverseQuestions = [
      makeQuestion({ type: 'multiple_choice', bloomsLevel: 'REMEMBER', difficulty: 1 }),
      makeQuestion({ type: 'true_false', bloomsLevel: 'UNDERSTAND', difficulty: 2 }),
      makeQuestion({ type: 'short_answer', bloomsLevel: 'APPLY', difficulty: 3 }),
      makeQuestion({ type: 'essay', bloomsLevel: 'ANALYZE', difficulty: 4 }),
    ];

    const result = analyzer.analyzeAssessments([makeExam(diverseQuestions)]);

    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it('should check feedback quality for explanations', () => {
    const questionsWithFeedback = [
      makeQuestion({ explanation: 'Detailed explanation with review material. Refer to chapter 3 for more context.' }),
      makeQuestion({ explanation: 'Brief.' }),
      makeQuestion({ explanation: undefined, feedback: undefined }),
    ];

    const result = analyzer.analyzeAssessments([makeExam(questionsWithFeedback)]);

    expect(result.feedbackQuality.hasExplanations).toBe(true);
    expect(result.feedbackQuality.score).toBeGreaterThan(0);
  });

  it('should suggest improvements based on analysis', () => {
    const weakQuestions = [
      makeQuestion({ type: 'multiple_choice', bloomsLevel: 'REMEMBER' }),
      makeQuestion({ type: 'multiple_choice', bloomsLevel: 'REMEMBER' }),
    ];

    const result = analyzer.analyzeAssessments([makeExam(weakQuestions)]);

    expect(result.bloomsCoverage.recommendation).toBeDefined();
    expect(result.questionVariety.recommendation).toBeDefined();
  });

  it('should return empty metrics when no questions provided', () => {
    const result = analyzer.analyzeAssessments([makeExam([])]);

    expect(result.overallScore).toBe(0);
    expect(result.bloomsCoverage.coveredLevels).toHaveLength(0);
    expect(result.questionVariety.uniqueTypes).toBe(0);
  });
});
