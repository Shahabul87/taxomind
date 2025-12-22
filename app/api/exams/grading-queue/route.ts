import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { EvaluationType } from '@prisma/client';

// ==========================================
// Teacher Grading Queue API Route
// ==========================================

// Schema for updating a grade
const UpdateGradeSchema = z.object({
  answerId: z.string().min(1, 'Answer ID is required'),
  newScore: z.number().min(0, 'Score must be non-negative'),
  feedback: z.string().optional(),
  reason: z.string().min(1, 'Reason for override is required'),
});

// Schema for bulk approve
const BulkApproveSchema = z.object({
  answerIds: z.array(z.string()).min(1, 'At least one answer ID is required'),
});

export async function GET(request: Request) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only teachers can access grading queue
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only teachers can access the grading queue' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Build where clause
    const whereClause: any = {
      status: 'GRADED',
      enhancedAnswers: {
        some: {
          evaluationType: 'AI_EVALUATED',
        },
      },
    };

    if (courseId) {
      whereClause.Exam = {
        section: {
          chapter: {
            courseId,
          },
        },
      };
    }

    // Get attempts that need review (AI-evaluated answers that haven't been teacher-approved)
    const attempts = await db.userExamAttempt.findMany({
      where: whereClause,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        Exam: {
          select: {
            id: true,
            title: true,
            section: {
              select: {
                id: true,
                title: true,
                chapter: {
                  select: {
                    id: true,
                    title: true,
                    course: {
                      select: {
                        id: true,
                        title: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        enhancedAnswers: {
          where: {
            evaluationType: 'AI_EVALUATED',
          },
          include: {
            question: true,
            aiEvaluations: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'asc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Transform to grading queue items
    const gradingQueue = attempts.map((attempt) => {
      const aiAnswers = attempt.enhancedAnswers.filter(
        (a) => a.evaluationType === 'AI_EVALUATED'
      );
      const flaggedForReview = aiAnswers.filter(
        (a) => a.aiEvaluations.some((e) => e.flaggedForReview)
      ).length;
      const totalAIScore = aiAnswers.reduce((sum, a) => sum + (a.pointsEarned || 0), 0);
      const totalMaxScore = aiAnswers.reduce((sum, a) => sum + (a.question?.points || 0), 0);

      return {
        attemptId: attempt.id,
        studentId: attempt.userId,
        studentName: attempt.User.name || 'Unknown Student',
        studentImage: attempt.User.image,
        studentEmail: attempt.User.email,
        examId: attempt.Exam.id,
        examTitle: attempt.Exam.title,
        courseId: attempt.Exam.section?.chapter?.course?.id,
        courseName: attempt.Exam.section?.chapter?.course?.title,
        chapterName: attempt.Exam.section?.chapter?.title,
        sectionName: attempt.Exam.section?.title,
        submittedAt: attempt.submittedAt?.toISOString(),
        questionsToReview: aiAnswers.length,
        flaggedForReview,
        autoScore: totalMaxScore > 0 ? Math.round((totalAIScore / totalMaxScore) * 100) : 0,
        status: flaggedForReview > 0 ? 'needs_review' : 'pending',
      };
    });

    // Get total count for pagination
    const totalCount = await db.userExamAttempt.count({
      where: whereClause,
    });

    return NextResponse.json({
      success: true,
      queue: gradingQueue,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching grading queue:', error);
    return NextResponse.json({ error: 'Failed to fetch grading queue' }, { status: 500 });
  }
}

// Update a single answer's grade (teacher override)
export async function PATCH(request: Request) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only teachers can update grades' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = UpdateGradeSchema.parse(body);

    // Get the answer
    const answer = await db.enhancedAnswer.findUnique({
      where: { id: validatedData.answerId },
      include: {
        question: true,
        aiEvaluations: true,
      },
    });

    if (!answer) {
      return NextResponse.json({ error: 'Answer not found' }, { status: 404 });
    }

    // Validate score doesn't exceed max points
    if (validatedData.newScore > (answer.question?.points || 0)) {
      return NextResponse.json(
        { error: 'Score cannot exceed maximum points' },
        { status: 400 }
      );
    }

    const originalScore = answer.pointsEarned || 0;

    // Update the answer with teacher grading
    // Note: Teacher override metadata could be stored in AIEvaluationRecord if needed
    const updatedAnswer = await db.enhancedAnswer.update({
      where: { id: validatedData.answerId },
      data: {
        pointsEarned: validatedData.newScore,
        evaluationType: 'TEACHER_GRADED',
        updatedAt: new Date(),
      },
    });

    // Recalculate attempt score
    const attempt = await db.userExamAttempt.findUnique({
      where: { id: answer.attemptId },
      include: {
        enhancedAnswers: {
          include: {
            question: true,
          },
        },
        Exam: true,
      },
    });

    if (attempt) {
      const totalScore = attempt.enhancedAnswers.reduce(
        (sum, a) => sum + (a.pointsEarned || 0),
        0
      );
      const maxScore = attempt.enhancedAnswers.reduce(
        (sum, a) => sum + (a.question?.points || 0),
        0
      );
      const scorePercentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
      const isPassed = scorePercentage >= attempt.Exam.passingScore;

      await db.userExamAttempt.update({
        where: { id: attempt.id },
        data: {
          scorePercentage,
          isPassed,
          correctAnswers: attempt.enhancedAnswers.filter((a) => a.isCorrect).length,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Grade updated successfully',
      answer: {
        id: updatedAnswer.id,
        newScore: validatedData.newScore,
        originalScore,
        evaluationType: 'TEACHER_GRADED',
      },
    });
  } catch (error) {
    console.error('Error updating grade:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to update grade' }, { status: 500 });
  }
}

// Bulk approve AI grades
export async function POST(request: Request) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only teachers can approve grades' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'bulk-approve') {
      const validatedData = BulkApproveSchema.parse(body);

      // Update all answers to teacher-approved
      const result = await db.enhancedAnswer.updateMany({
        where: {
          id: { in: validatedData.answerIds },
          evaluationType: 'AI_EVALUATED',
        },
        data: {
          evaluationType: 'TEACHER_GRADED',
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: `${result.count} answers approved`,
        count: result.count,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in grading queue action:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
