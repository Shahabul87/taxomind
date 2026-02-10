/**
 * SAM AI Practice Problems - Evaluate API
 *
 * Thin API layer that uses the portable PracticeProblemsEngine from @sam-ai/educational
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { createPracticeProblemsEngine, type PracticeProblem } from '@sam-ai/educational';
import { runSAMChatWithPreference, handleAIAccessError } from '@/lib/sam/ai-provider';

const EvaluateAnswerSchema = z.object({
  problemId: z.string(),
  problem: z.object({
    id: z.string(),
    type: z.string(),
    title: z.string().optional(),
    statement: z.string(),
    difficulty: z.string(),
    bloomsLevel: z.string(),
    points: z.number().optional().default(10),
    timeLimit: z.number().optional(),
    correctAnswer: z.string().optional(),
    solutionExplanation: z.string().optional(),
    options: z.array(z.object({
      id: z.string(),
      text: z.string(),
      isCorrect: z.boolean().optional(),
      explanation: z.string().optional(),
    })).nullable().optional(),
    hints: z.array(z.object({
      id: z.string(),
      type: z.string().optional(),
      content: z.string(),
      order: z.number(),
      penaltyPoints: z.number().optional(),
    })).optional().default([]),
    relatedConcepts: z.array(z.string()).optional().default([]),
    prerequisites: z.array(z.string()).optional().default([]),
    tags: z.array(z.string()).optional().default([]),
    learningObjectives: z.array(z.string()).optional().default([]),
  }),
  userAnswer: z.string(),
  hintsUsed: z.array(z.string()).optional().default([]),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
});

// Create engine with AI adapter
const createEngineWithAI = (userId: string) => {
  return createPracticeProblemsEngine({
    aiAdapter: {
      chat: async ({ messages }) => {
        const systemMessage = messages.find(m => m.role === 'system')?.content || '';
        const userMessage = messages.find(m => m.role === 'user')?.content || '';

        const response = await runSAMChatWithPreference({
          userId,
          capability: 'chat',
          maxTokens: 1500,
          temperature: 0.3,
          systemPrompt: systemMessage,
          messages: [{ role: 'user', content: userMessage }],
        });

        return { content: response };
      },
    },
  });
};

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = EvaluateAnswerSchema.parse(body);

    const { problem, userAnswer, hintsUsed } = validatedData;

    // Use the portable engine
    const engine = createEngineWithAI(user.id);

    // Transform the problem to match the engine's expected type
    const practiceProblem: PracticeProblem = {
      id: problem.id,
      type: problem.type as PracticeProblem['type'],
      title: problem.title || 'Practice Problem',
      statement: problem.statement,
      difficulty: problem.difficulty as PracticeProblem['difficulty'],
      bloomsLevel: problem.bloomsLevel as PracticeProblem['bloomsLevel'],
      points: problem.points,
      timeLimit: problem.timeLimit,
      correctAnswer: problem.correctAnswer,
      solutionExplanation: problem.solutionExplanation || '',
      options: problem.options as PracticeProblem['options'],
      hints: problem.hints.map(h => ({
        id: h.id,
        type: (h.type || 'conceptual') as 'conceptual' | 'procedural' | 'partial_solution',
        content: h.content,
        order: h.order,
        penaltyPoints: h.penaltyPoints || 2,
      })),
      relatedConcepts: problem.relatedConcepts,
      prerequisites: problem.prerequisites,
      tags: problem.tags,
      learningObjectives: problem.learningObjectives,
      createdAt: new Date(),
    };

    // Evaluate the answer
    const evaluation = await engine.evaluateAttempt(practiceProblem, userAnswer, {
      partialCredit: true,
    });

    // Calculate hint penalty for stats
    const hintPenalty = Math.min(hintsUsed.length * 0.1, 0.3);
    const adjustedScore = Math.max(0, (evaluation.partialCredit || 0) - hintPenalty);

    return NextResponse.json({
      success: true,
      data: {
        isCorrect: evaluation.isCorrect,
        score: adjustedScore,
        partialCredit: adjustedScore,
        feedback: evaluation.feedback,
        correctAnswer: practiceProblem.correctAnswer,
        explanation: practiceProblem.solutionExplanation,
        conceptsToReview: evaluation.conceptsToReview || [],
        strengthsIdentified: [],
        timeSpent: 0,
        hintsUsedCount: hintsUsed.length,
        nextDifficulty: evaluation.nextDifficulty,
        nextBloomsLevel: evaluation.nextBloomsLevel,
      },
      stats: {
        totalAttempts: 1,
        correctAnswers: evaluation.isCorrect ? 1 : 0,
        averageScore: adjustedScore,
        streakCount: evaluation.isCorrect ? 1 : 0,
      },
    });

  } catch (error) {
    const accessResponse = handleAIAccessError(error);
    if (accessResponse) return accessResponse;
    logger.error('Practice problem evaluation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid request data', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { message: 'Failed to evaluate answer' } },
      { status: 500 }
    );
  }
}
