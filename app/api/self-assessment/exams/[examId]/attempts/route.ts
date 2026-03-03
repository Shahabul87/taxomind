import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Self-Assessment Attempts API
 *
 * GET /api/self-assessment/exams/[examId]/attempts - List user's attempts
 * POST /api/self-assessment/exams/[examId]/attempts - Start a new attempt
 */

interface RouteParams {
  params: Promise<{ examId: string }>;
}

/**
 * GET - List user's attempts for this exam
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await currentUser();
    const { examId } = await params;

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const attempts = await db.selfAssessmentAttempt.findMany({
      where: {
        examId,
        userId: user.id,
      },
      include: {
        exam: {
          select: {
            title: true,
            passingScore: true,
            timeLimit: true,
          },
        },
        _count: {
          select: { answers: true },
        },
      },
      orderBy: { attemptNumber: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      attempts: attempts.map((a) => ({
        id: a.id,
        attemptNumber: a.attemptNumber,
        status: a.status,
        startedAt: a.startedAt?.toISOString() ?? null,
        submittedAt: a.submittedAt?.toISOString() ?? null,
        timeSpent: a.timeSpent,
        totalQuestions: a.totalQuestions,
        correctAnswers: a.correctAnswers,
        scorePercentage: a.scorePercentage,
        isPassed: a.isPassed,
        answersCount: a._count.answers,
        examTitle: a.exam.title,
        passingScore: a.exam.passingScore,
        timeLimit: a.exam.timeLimit,
      })),
      total: attempts.length,
    });
  } catch (error) {
    logger.error('Error fetching attempts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attempts' },
      { status: 500 }
    );
  }
}

/**
 * POST - Start a new attempt
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await currentUser();
    const { examId } = await params;

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get exam details
    const exam = await db.selfAssessmentExam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            question: true,
            questionType: true,
            options: true,
            points: true,
            bloomsLevel: true,
            difficulty: true,
            hint: true,
            order: true,
            estimatedTime: true,
          },
        },
        _count: {
          select: { attempts: true },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Check if exam is published (unless user owns it)
    if (exam.status !== 'PUBLISHED' && exam.userId !== user.id) {
      return NextResponse.json(
        { error: 'Exam is not available' },
        { status: 403 }
      );
    }

    if (exam.questions.length === 0) {
      return NextResponse.json(
        { error: 'Exam has no questions' },
        { status: 400 }
      );
    }

    // Check attempt limits
    const userAttempts = await db.selfAssessmentAttempt.count({
      where: { examId, userId: user.id },
    });

    if (!exam.allowRetakes && userAttempts > 0) {
      return NextResponse.json(
        { error: 'Retakes not allowed for this exam' },
        { status: 400 }
      );
    }

    if (exam.maxAttempts && userAttempts >= exam.maxAttempts) {
      return NextResponse.json(
        { error: `Maximum attempts (${exam.maxAttempts}) reached` },
        { status: 400 }
      );
    }

    // Check for in-progress attempt
    const inProgressAttempt = await db.selfAssessmentAttempt.findFirst({
      where: {
        examId,
        userId: user.id,
        status: 'IN_PROGRESS',
      },
      include: {
        answers: {
          select: {
            questionId: true,
            answer: true,
          },
        },
      },
    });

    if (inProgressAttempt) {
      // Return existing in-progress attempt
      let questions = exam.questions;

      // Shuffle if enabled
      if (exam.shuffleQuestions) {
        questions = [...questions].sort(() => Math.random() - 0.5);
      }

      // Map existing answers
      const existingAnswers: Record<string, string | null> = {};
      inProgressAttempt.answers.forEach((a) => {
        existingAnswers[a.questionId] = a.answer;
      });

      return NextResponse.json({
        success: true,
        attempt: {
          id: inProgressAttempt.id,
          attemptNumber: inProgressAttempt.attemptNumber,
          status: inProgressAttempt.status,
          startedAt: inProgressAttempt.startedAt?.toISOString(),
          timeSpent: inProgressAttempt.timeSpent,
        },
        exam: {
          id: exam.id,
          title: exam.title,
          description: exam.description,
          instructions: exam.instructions,
          timeLimit: exam.timeLimit,
          passingScore: exam.passingScore,
          showResults: exam.showResults,
          totalQuestions: exam.questions.length,
          totalPoints: exam.totalPoints,
        },
        questions,
        existingAnswers,
        message: 'Resuming existing attempt',
      });
    }

    // Create new attempt
    const attemptNumber = userAttempts + 1;
    const attempt = await db.selfAssessmentAttempt.create({
      data: {
        id: uuidv4(),
        examId,
        userId: user.id,
        attemptNumber,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        totalQuestions: exam.questions.length,
        totalPoints: exam.totalPoints,
      },
    });

    let questions = exam.questions;

    // Shuffle if enabled
    if (exam.shuffleQuestions) {
      questions = [...questions].sort(() => Math.random() - 0.5);
    }

    return NextResponse.json({
      success: true,
      attempt: {
        id: attempt.id,
        attemptNumber: attempt.attemptNumber,
        status: attempt.status,
        startedAt: attempt.startedAt?.toISOString(),
      },
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        instructions: exam.instructions,
        timeLimit: exam.timeLimit,
        passingScore: exam.passingScore,
        showResults: exam.showResults,
        totalQuestions: exam.questions.length,
        totalPoints: exam.totalPoints,
      },
      questions,
      existingAnswers: {},
      message: 'New attempt started',
    });
  } catch (error) {
    logger.error('Error starting attempt:', error);
    return NextResponse.json(
      { error: 'Failed to start attempt' },
      { status: 500 }
    );
  }
}
