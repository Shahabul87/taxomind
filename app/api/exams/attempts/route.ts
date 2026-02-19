import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { AttemptStatus, Prisma } from '@prisma/client';

/**
 * GET /api/exams/attempts
 *
 * Fetches exam attempts for the current user.
 * Used by AIExamFeedbackPanel to display graded exam history.
 *
 * Query params:
 * - limit: number (default 10, max 50)
 * - status: 'GRADED' | 'IN_PROGRESS' | 'NOT_STARTED' | 'SUBMITTED' (optional)
 * - courseId: string (optional)
 * - offset: number (default 0)
 */

const QuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(10),
  offset: z.coerce.number().min(0).default(0),
  status: z.enum(['GRADED', 'IN_PROGRESS', 'NOT_STARTED', 'SUBMITTED']).optional(),
  courseId: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = QuerySchema.parse({
      limit: searchParams.get('limit') ?? 10,
      offset: searchParams.get('offset') ?? 0,
      status: searchParams.get('status') ?? undefined,
      courseId: searchParams.get('courseId') ?? undefined,
    });

    // Build where clause
    const where: Prisma.UserExamAttemptWhereInput = {
      userId: user.id,
    };

    if (query.status) {
      where.status = query.status as AttemptStatus;
    }

    if (query.courseId) {
      where.Exam = {
        section: {
          chapter: {
            courseId: query.courseId,
          },
        },
      };
    }

    // Fetch attempts with exam details
    const [attempts, total] = await Promise.all([
      db.userExamAttempt.findMany({
        where,
        include: {
          Exam: {
            select: {
              id: true,
              title: true,
              passingScore: true,
              section: {
                select: {
                  title: true,
                  chapter: {
                    select: {
                      title: true,
                      courseId: true,
                      course: {
                        select: {
                          title: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          startedAt: 'desc',
        },
        take: query.limit,
        skip: query.offset,
      }),
      db.userExamAttempt.count({ where }),
    ]);

    // Transform the response
    const formattedAttempts = attempts.map((attempt) => ({
      id: attempt.id,
      examId: attempt.examId,
      examTitle: attempt.Exam.title,
      sectionTitle: attempt.Exam.section?.title ?? null,
      chapterTitle: attempt.Exam.section?.chapter?.title ?? null,
      courseTitle: attempt.Exam.section?.chapter?.course?.title ?? null,
      courseId: attempt.Exam.section?.chapter?.courseId ?? null,
      status: attempt.status,
      scorePercentage: attempt.scorePercentage ?? 0,
      isPassed: attempt.isPassed ?? false,
      correctAnswers: attempt.correctAnswers ?? 0,
      totalQuestions: attempt.totalQuestions,
      passingScore: attempt.Exam.passingScore,
      startedAt: attempt.startedAt.toISOString(),
      submittedAt: attempt.submittedAt?.toISOString() ?? null,
      timeSpent: attempt.timeSpent,
    }));

    return NextResponse.json({
      success: true,
      attempts: formattedAttempts,
      pagination: {
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + query.limit < total,
      },
    });
  } catch (error) {
    logger.error('Error fetching exam attempts:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch exam attempts' },
      { status: 500 }
    );
  }
}
