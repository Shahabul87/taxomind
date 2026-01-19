import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

/**
 * Single Self-Assessment Attempt API
 *
 * GET /api/self-assessment/exams/[examId]/attempts/[attemptId] - Get attempt details
 * PUT /api/self-assessment/exams/[examId]/attempts/[attemptId] - Save progress (partial answers)
 */

// Validation schemas
const SaveProgressSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      answer: z.string().nullable(),
    })
  ),
  timeSpent: z.number().int().min(0).optional(),
});

interface RouteParams {
  params: Promise<{ examId: string; attemptId: string }>;
}

/**
 * GET - Get attempt details with results (if submitted)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await currentUser();
    const { examId, attemptId } = await params;

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const attempt = await db.selfAssessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
            },
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (attempt.examId !== examId) {
      return NextResponse.json({ error: 'Attempt does not match exam' }, { status: 400 });
    }

    // Build response based on status
    const isGraded = attempt.status === 'GRADED';
    const showResults = attempt.exam.showResults;

    const questionsWithAnswers = attempt.exam.questions.map((q) => {
      const userAnswer = attempt.answers.find((a) => a.questionId === q.id);
      return {
        id: q.id,
        question: q.question,
        questionType: q.questionType,
        options: q.options,
        points: q.points,
        bloomsLevel: q.bloomsLevel,
        difficulty: q.difficulty,
        hint: q.hint,
        order: q.order,
        // User's answer
        userAnswer: userAnswer?.answer ?? null,
        // Only show correct answer and feedback if graded and showResults enabled
        correctAnswer: isGraded && showResults ? q.correctAnswer : null,
        explanation: isGraded && showResults ? q.explanation : null,
        isCorrect: isGraded ? userAnswer?.isCorrect : null,
        pointsEarned: isGraded ? userAnswer?.pointsEarned : null,
        feedback: isGraded && showResults ? userAnswer?.feedback : null,
        aiEvaluation: isGraded && showResults ? userAnswer?.aiEvaluation : null,
      };
    });

    return NextResponse.json({
      success: true,
      attempt: {
        id: attempt.id,
        attemptNumber: attempt.attemptNumber,
        status: attempt.status,
        startedAt: attempt.startedAt?.toISOString() ?? null,
        submittedAt: attempt.submittedAt?.toISOString() ?? null,
        timeSpent: attempt.timeSpent,
        totalQuestions: attempt.totalQuestions,
        correctAnswers: attempt.correctAnswers,
        totalPoints: attempt.totalPoints,
        earnedPoints: attempt.earnedPoints,
        scorePercentage: attempt.scorePercentage,
        isPassed: attempt.isPassed,
        // Bloom's breakdown
        bloomsBreakdown: isGraded ? attempt.bloomsBreakdown : null,
        cognitiveProfile: isGraded && showResults ? attempt.cognitiveProfile : null,
        learningRecommendations:
          isGraded && showResults ? attempt.learningRecommendations : null,
      },
      exam: {
        id: attempt.exam.id,
        title: attempt.exam.title,
        description: attempt.exam.description,
        passingScore: attempt.exam.passingScore,
        timeLimit: attempt.exam.timeLimit,
        showResults: attempt.exam.showResults,
      },
      questions: questionsWithAnswers,
    });
  } catch (error) {
    logger.error('Error fetching attempt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attempt' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Save progress (partial answers without submitting)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await currentUser();
    const { examId, attemptId } = await params;

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const attempt = await db.selfAssessmentAttempt.findUnique({
      where: { id: attemptId },
      select: { userId: true, examId: true, status: true },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (attempt.examId !== examId) {
      return NextResponse.json({ error: 'Attempt does not match exam' }, { status: 400 });
    }

    if (attempt.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Cannot modify a submitted attempt' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = SaveProgressSchema.parse(body);

    // Upsert answers
    for (const answer of data.answers) {
      if (answer.answer !== null) {
        await db.selfAssessmentAnswer.upsert({
          where: {
            attemptId_questionId: {
              attemptId,
              questionId: answer.questionId,
            },
          },
          create: {
            attemptId,
            questionId: answer.questionId,
            answer: answer.answer,
            answeredAt: new Date(),
          },
          update: {
            answer: answer.answer,
            answeredAt: new Date(),
          },
        });
      }
    }

    // Update time spent if provided
    if (data.timeSpent !== undefined) {
      await db.selfAssessmentAttempt.update({
        where: { id: attemptId },
        data: { timeSpent: data.timeSpent },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Progress saved',
      savedAnswers: data.answers.length,
    });
  } catch (error) {
    logger.error('Error saving progress:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save progress' },
      { status: 500 }
    );
  }
}
