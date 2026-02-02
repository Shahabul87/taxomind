/**
 * Quiz Grader Tool
 *
 * Algorithmically grades quiz answers, provides per-question feedback,
 * and identifies missed concepts for targeted review.
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import {
  type ToolDefinition,
  type ToolHandler,
  type ToolExecutionResult,
  ToolCategory,
  PermissionLevel,
  ConfirmationType,
} from '@sam-ai/agentic';

// =============================================================================
// TYPES
// =============================================================================

export interface QuestionFeedback {
  questionIndex: number;
  correct: boolean;
  studentAnswer: string;
  correctAnswer: string;
  feedback: string;
}

export interface GradingResult {
  score: number;
  totalQuestions: number;
  correctCount: number;
  percentage: number;
  grade: string;
  feedback: QuestionFeedback[];
  missedConcepts: string[];
}

// =============================================================================
// INPUT SCHEMA
// =============================================================================

const QuizGraderInputSchema = z.object({
  questions: z.array(z.string().min(1)).min(1).max(50).describe('Array of question texts'),
  studentAnswers: z.array(z.string()).min(1).max(50).describe('Array of student answers'),
  correctAnswers: z.array(z.string()).min(1).max(50).describe('Array of correct answers'),
  concepts: z.array(z.string()).optional().describe('Optional concept labels per question'),
  caseSensitive: z.boolean().optional().default(false),
  partialCredit: z.boolean().optional().default(true),
});

// =============================================================================
// GRADING LOGIC
// =============================================================================

function normalizeAnswer(answer: string, caseSensitive: boolean): string {
  let normalized = answer.trim().replace(/\s+/g, ' ');
  if (!caseSensitive) {
    normalized = normalized.toLowerCase();
  }
  // Remove trailing punctuation
  normalized = normalized.replace(/[.!?]+$/, '');
  return normalized;
}

function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  if (a.length === 0 || b.length === 0) return 0;

  // Simple word overlap (Jaccard-like)
  const wordsA = new Set(a.split(/\s+/));
  const wordsB = new Set(b.split(/\s+/));
  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

function gradeToLetter(percentage: number): string {
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 60) return 'D';
  return 'F';
}

// =============================================================================
// HANDLER
// =============================================================================

function createQuizGraderHandler(): ToolHandler {
  return async (input): Promise<ToolExecutionResult> => {
    const parsed = QuizGraderInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: `Invalid input: ${parsed.error.message}`,
          recoverable: true,
        },
      };
    }

    const { questions, studentAnswers, correctAnswers, concepts, caseSensitive, partialCredit } = parsed.data;

    if (questions.length !== studentAnswers.length || questions.length !== correctAnswers.length) {
      return {
        success: false,
        error: {
          code: 'ARRAY_LENGTH_MISMATCH',
          message: 'questions, studentAnswers, and correctAnswers must have the same length',
          recoverable: true,
        },
      };
    }

    logger.info('[QuizGrader] Grading quiz', {
      questionCount: questions.length,
      caseSensitive,
      partialCredit,
    });

    const feedback: QuestionFeedback[] = [];
    const missedConceptSet = new Set<string>();
    let totalScore = 0;

    for (let i = 0; i < questions.length; i++) {
      const normStudent = normalizeAnswer(studentAnswers[i], caseSensitive);
      const normCorrect = normalizeAnswer(correctAnswers[i], caseSensitive);
      const exact = normStudent === normCorrect;

      let questionScore: number;
      let feedbackText: string;

      if (exact) {
        questionScore = 1;
        feedbackText = 'Correct!';
      } else if (partialCredit) {
        const similarity = calculateSimilarity(normStudent, normCorrect);
        if (similarity >= 0.8) {
          questionScore = 0.9;
          feedbackText = 'Very close! Minor differences from the expected answer.';
        } else if (similarity >= 0.5) {
          questionScore = 0.5;
          feedbackText = 'Partially correct. Some key elements are missing.';
        } else {
          questionScore = 0;
          feedbackText = `Incorrect. The expected answer was: ${correctAnswers[i]}`;
          if (concepts?.[i]) {
            missedConceptSet.add(concepts[i]);
          }
        }
      } else {
        questionScore = 0;
        feedbackText = `Incorrect. The expected answer was: ${correctAnswers[i]}`;
        if (concepts?.[i]) {
          missedConceptSet.add(concepts[i]);
        }
      }

      totalScore += questionScore;
      feedback.push({
        questionIndex: i,
        correct: exact,
        studentAnswer: studentAnswers[i],
        correctAnswer: correctAnswers[i],
        feedback: feedbackText,
      });
    }

    const percentage = Math.round((totalScore / questions.length) * 100);

    const result: GradingResult = {
      score: Math.round(totalScore * 10) / 10,
      totalQuestions: questions.length,
      correctCount: feedback.filter((f) => f.correct).length,
      percentage,
      grade: gradeToLetter(percentage),
      feedback,
      missedConcepts: [...missedConceptSet],
    };

    return {
      success: true,
      output: result,
    };
  };
}

// =============================================================================
// TOOL DEFINITION
// =============================================================================

export function createQuizGraderTool(): ToolDefinition {
  return {
    id: 'sam-quiz-grader',
    name: 'Quiz Grader',
    description: 'Grades quiz answers, provides per-question feedback, and identifies missed concepts for review.',
    version: '1.0.0',
    category: ToolCategory.ASSESSMENT,
    handler: createQuizGraderHandler(),
    inputSchema: QuizGraderInputSchema,
    outputSchema: z.object({
      score: z.number(),
      totalQuestions: z.number(),
      correctCount: z.number(),
      percentage: z.number(),
      grade: z.string(),
      feedback: z.array(z.object({
        questionIndex: z.number(),
        correct: z.boolean(),
        studentAnswer: z.string(),
        correctAnswer: z.string(),
        feedback: z.string(),
      })),
      missedConcepts: z.array(z.string()),
    }),
    requiredPermissions: [PermissionLevel.READ],
    confirmationType: ConfirmationType.NONE,
    enabled: true,
    tags: ['assessment', 'grading', 'quiz', 'feedback'],
    rateLimit: { maxCalls: 30, windowMs: 60_000, scope: 'user' },
    timeoutMs: 5000,
    maxRetries: 1,
  };
}
