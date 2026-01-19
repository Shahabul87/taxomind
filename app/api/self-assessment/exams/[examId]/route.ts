import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

/**
 * Single Self-Assessment Exam API
 *
 * GET /api/self-assessment/exams/[examId] - Get exam details
 * PUT /api/self-assessment/exams/[examId] - Update exam
 * DELETE /api/self-assessment/exams/[examId] - Delete exam
 */

// Validation schemas
const UpdateExamSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  timeLimit: z.number().int().positive().optional().nullable(),
  passingScore: z.number().min(0).max(100).optional(),
  shuffleQuestions: z.boolean().optional(),
  showResults: z.boolean().optional(),
  allowRetakes: z.boolean().optional(),
  maxAttempts: z.number().int().positive().optional().nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

interface RouteParams {
  params: Promise<{ examId: string }>;
}

/**
 * GET - Get exam details with questions
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await currentUser();
    const { examId } = await params;

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const exam = await db.selfAssessmentExam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        attempts: {
          where: { userId: user.id },
          orderBy: { attemptNumber: 'desc' },
          take: 5,
          select: {
            id: true,
            attemptNumber: true,
            status: true,
            scorePercentage: true,
            isPassed: true,
            submittedAt: true,
            timeSpent: true,
          },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Check ownership
    if (exam.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Format questions (hide correct answers if showResults is false and there are attempts)
    const questions = exam.questions.map((q) => ({
      id: q.id,
      question: q.question,
      questionType: q.questionType,
      options: q.options,
      points: q.points,
      bloomsLevel: q.bloomsLevel,
      difficulty: q.difficulty,
      hint: q.hint,
      explanation: exam.showResults ? q.explanation : null,
      correctAnswer: exam.showResults ? q.correctAnswer : null,
      order: q.order,
      tags: q.tags,
      estimatedTime: q.estimatedTime,
    }));

    return NextResponse.json({
      success: true,
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        instructions: exam.instructions,
        courseId: exam.courseId,
        status: exam.status,
        timeLimit: exam.timeLimit,
        passingScore: exam.passingScore,
        shuffleQuestions: exam.shuffleQuestions,
        showResults: exam.showResults,
        allowRetakes: exam.allowRetakes,
        maxAttempts: exam.maxAttempts,
        generatedByAI: exam.generatedByAI,
        targetBloomsDistribution: exam.targetBloomsDistribution,
        actualBloomsDistribution: exam.actualBloomsDistribution,
        totalQuestions: exam._count.questions,
        totalPoints: exam.totalPoints,
        totalAttempts: exam._count.attempts,
        avgScore: exam.avgScore,
        createdAt: exam.createdAt.toISOString(),
        updatedAt: exam.updatedAt.toISOString(),
        publishedAt: exam.publishedAt?.toISOString() ?? null,
      },
      questions,
      recentAttempts: exam.attempts,
    });
  } catch (error) {
    logger.error('Error fetching self-assessment exam:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exam' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update exam
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await currentUser();
    const { examId } = await params;

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership
    const existingExam = await db.selfAssessmentExam.findUnique({
      where: { id: examId },
      select: { userId: true, status: true },
    });

    if (!existingExam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    if (existingExam.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const data = UpdateExamSchema.parse(body);

    // If publishing, set publishedAt
    const updateData: Record<string, unknown> = { ...data };
    if (data.status === 'PUBLISHED' && existingExam.status !== 'PUBLISHED') {
      updateData.publishedAt = new Date();
    }

    const exam = await db.selfAssessmentExam.update({
      where: { id: examId },
      data: updateData,
      include: {
        _count: {
          select: { questions: true, attempts: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      exam: {
        id: exam.id,
        title: exam.title,
        status: exam.status,
        totalQuestions: exam._count.questions,
        updatedAt: exam.updatedAt.toISOString(),
      },
      message: 'Exam updated successfully',
    });
  } catch (error) {
    logger.error('Error updating self-assessment exam:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update exam' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete exam
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await currentUser();
    const { examId } = await params;

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership
    const exam = await db.selfAssessmentExam.findUnique({
      where: { id: examId },
      select: { userId: true },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    if (exam.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete exam (cascade deletes questions, attempts, answers)
    await db.selfAssessmentExam.delete({
      where: { id: examId },
    });

    return NextResponse.json({
      success: true,
      message: 'Exam deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting self-assessment exam:', error);
    return NextResponse.json(
      { error: 'Failed to delete exam' },
      { status: 500 }
    );
  }
}
