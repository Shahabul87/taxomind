import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

/**
 * Self-Assessment Questions API
 *
 * GET /api/self-assessment/exams/[examId]/questions - List questions
 * POST /api/self-assessment/exams/[examId]/questions - Add question(s)
 */

// Validation schemas
const CreateQuestionSchema = z.object({
  question: z.string().min(10),
  questionType: z.enum([
    'MULTIPLE_CHOICE',
    'TRUE_FALSE',
    'SHORT_ANSWER',
    'ESSAY',
    'FILL_IN_BLANK',
  ]),
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
    isCorrect: z.boolean(),
  })).optional(),
  correctAnswer: z.string(),
  acceptableVariations: z.array(z.string()).optional(),
  points: z.number().positive().default(1),
  bloomsLevel: z.enum([
    'REMEMBER',
    'UNDERSTAND',
    'APPLY',
    'ANALYZE',
    'EVALUATE',
    'CREATE',
  ]).default('REMEMBER'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  hint: z.string().optional(),
  explanation: z.string().optional(),
  tags: z.array(z.string()).default([]),
  estimatedTime: z.number().int().positive().optional(),
  rubric: z.any().optional(),
});

const BulkCreateQuestionsSchema = z.object({
  questions: z.array(CreateQuestionSchema),
});

interface RouteParams {
  params: Promise<{ examId: string }>;
}

/**
 * GET - List exam questions
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await currentUser();
    const { examId } = await params;

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership
    const exam = await db.selfAssessmentExam.findUnique({
      where: { id: examId },
      select: { userId: true, showResults: true },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    if (exam.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const questions = await db.selfAssessmentQuestion.findMany({
      where: { examId },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({
      success: true,
      questions: questions.map((q) => ({
        id: q.id,
        question: q.question,
        questionType: q.questionType,
        options: q.options,
        correctAnswer: q.correctAnswer,
        acceptableVariations: q.acceptableVariations,
        points: q.points,
        bloomsLevel: q.bloomsLevel,
        difficulty: q.difficulty,
        hint: q.hint,
        explanation: q.explanation,
        order: q.order,
        tags: q.tags,
        estimatedTime: q.estimatedTime,
        rubric: q.rubric,
        stats: {
          totalAttempts: q.totalAttempts,
          correctAttempts: q.correctAttempts,
          avgTimeSpent: q.avgTimeSpent,
        },
      })),
      total: questions.length,
    });
  } catch (error) {
    logger.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

/**
 * POST - Add question(s) to exam
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await currentUser();
    const { examId } = await params;

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership
    const exam = await db.selfAssessmentExam.findUnique({
      where: { id: examId },
      select: { userId: true, status: true },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    if (exam.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (exam.status === 'ARCHIVED') {
      return NextResponse.json(
        { error: 'Cannot add questions to archived exam' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Check if bulk or single question
    let questions: z.infer<typeof CreateQuestionSchema>[];
    if (body.questions && Array.isArray(body.questions)) {
      const parsed = BulkCreateQuestionsSchema.parse(body);
      questions = parsed.questions;
    } else {
      const parsed = CreateQuestionSchema.parse(body);
      questions = [parsed];
    }

    // Get current max order
    const maxOrderResult = await db.selfAssessmentQuestion.aggregate({
      where: { examId },
      _max: { order: true },
    });
    let currentOrder = (maxOrderResult._max.order ?? -1) + 1;

    // Create questions
    const createdQuestions = await db.$transaction(
      questions.map((q) =>
        db.selfAssessmentQuestion.create({
          data: {
            examId,
            question: q.question,
            questionType: q.questionType,
            options: (q.options ?? Prisma.DbNull) as Prisma.InputJsonValue,
            correctAnswer: q.correctAnswer,
            acceptableVariations: (q.acceptableVariations ?? Prisma.DbNull) as Prisma.InputJsonValue,
            points: q.points,
            bloomsLevel: q.bloomsLevel,
            difficulty: q.difficulty,
            hint: q.hint ?? null,
            explanation: q.explanation ?? null,
            tags: q.tags,
            estimatedTime: q.estimatedTime ?? null,
            rubric: q.rubric ?? null,
            order: currentOrder++,
          },
        })
      )
    );

    // Update exam stats
    const totalQuestions = await db.selfAssessmentQuestion.count({
      where: { examId },
    });

    const totalPointsResult = await db.selfAssessmentQuestion.aggregate({
      where: { examId },
      _sum: { points: true },
    });

    // Calculate actual Bloom's distribution
    const bloomsCounts = await db.selfAssessmentQuestion.groupBy({
      by: ['bloomsLevel'],
      where: { examId },
      _count: true,
    });

    const bloomsDistribution: Record<string, number> = {};
    bloomsCounts.forEach((item) => {
      bloomsDistribution[item.bloomsLevel] = Math.round(
        (item._count / totalQuestions) * 100
      );
    });

    await db.selfAssessmentExam.update({
      where: { id: examId },
      data: {
        totalQuestions,
        totalPoints: totalPointsResult._sum.points ?? 0,
        actualBloomsDistribution: bloomsDistribution,
      },
    });

    return NextResponse.json({
      success: true,
      questions: createdQuestions.map((q) => ({
        id: q.id,
        question: q.question,
        questionType: q.questionType,
        order: q.order,
      })),
      message: `${createdQuestions.length} question(s) added successfully`,
    });
  } catch (error) {
    logger.error('Error adding questions:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to add questions' },
      { status: 500 }
    );
  }
}
