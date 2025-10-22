import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { z } from 'zod';
import { qaEventBus } from '@/lib/realtime/event-bus';

// Schema for updating a question
const UpdateQuestionSchema = z.object({
  title: z.string().min(10).max(200).optional(),
  content: z.string().min(20).max(5000).optional(),
  isPinned: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  mergedIntoId: z.string().nullable().optional(),
});

interface RouteParams {
  params: {
    courseId: string;
    questionId: string;
  };
}

// GET: Get a single question with its answers
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'You must be logged in to view questions' }
        },
        { status: 401 }
      );
    }

    const { courseId, questionId } = params;

    // Fetch question with answers
    const question = await db.courseQuestion.findFirst({
      where: {
        id: questionId,
        courseId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        section: {
          select: {
            id: true,
            title: true,
          },
        },
        answers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            _count: {
              select: {
                votes: true,
              },
            },
          },
          orderBy: [
            { isBestAnswer: 'desc' },
            { upvotes: 'desc' },
            { createdAt: 'asc' },
          ],
        },
        _count: {
          select: {
            answers: true,
            votes: true,
          },
        },
      },
    });

    if (!question) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Question not found' }
        },
        { status: 404 }
      );
    }

    // Get user's vote for this question
    const userVote = await db.questionVote.findUnique({
      where: {
        questionId_userId: {
          questionId,
          userId: user.id,
        },
      },
    });

    // Get user's votes for all answers
    const answerIds = question.answers.map((a) => a.id);
    const userAnswerVotes = await db.answerVote.findMany({
      where: {
        userId: user.id,
        answerId: { in: answerIds },
      },
    });

    const userAnswerVotesMap = new Map(userAnswerVotes.map((v) => [v.answerId, v.value]));

    // Check if user is course instructor
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { userId: true },
    });

    const isInstructor = course?.userId === user.id;

    // Enhance answers with user vote status
    const enhancedAnswers = question.answers.map((answer) => ({
      ...answer,
      userVote: userAnswerVotesMap.get(answer.id) || 0,
      canMarkBest: isInstructor || question.userId === user.id,
    }));

    const hasInstructorAnswer = question.answers.some((a) => a.isInstructor);

    return NextResponse.json({
      success: true,
      data: {
        ...question,
        answers: enhancedAnswers,
        userVote: userVote?.value || 0,
        canEdit: question.userId === user.id || isInstructor,
        canDelete: question.userId === user.id || isInstructor,
        canPin: isInstructor,
        hasInstructorAnswer,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    });
  } catch (error) {
    console.error('Error fetching question:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching the question',
        },
      },
      { status: 500 }
    );
  }
}

// PATCH: Update a question
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'You must be logged in to edit questions' }
        },
        { status: 401 }
      );
    }

    const { courseId, questionId } = params;

    // Fetch question
    const question = await db.courseQuestion.findFirst({
      where: {
        id: questionId,
        courseId,
      },
    });

    if (!question) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Question not found' }
        },
        { status: 404 }
      );
    }

    // Check permissions
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { userId: true },
    });

    const isInstructor = course?.userId === user.id;
    const isOwner = question.userId === user.id;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = UpdateQuestionSchema.parse(body);

    // Only instructor can pin or lock questions
    if ((validatedData.isPinned !== undefined || validatedData.isLocked !== undefined) && !isInstructor) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Only instructors can update moderation fields' }
        },
        { status: 403 }
      );
    }

    // Only instructor can merge questions
    if (validatedData.mergedIntoId !== undefined && !isInstructor) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Only instructors can merge questions' }
        },
        { status: 403 }
      );
    }

    // Only owner or instructor can edit
    if (!isOwner && !isInstructor) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'You can only edit your own questions' }
        },
        { status: 403 }
      );
    }

    // Build update data (only include provided fields)
    const updateData: {
      title?: string;
      content?: string;
      isPinned?: boolean;
      isLocked?: boolean;
      mergedIntoId?: string | null;
    } = {};

    if (validatedData.title !== undefined) {
      updateData.title = validatedData.title;
    }
    if (validatedData.content !== undefined) {
      updateData.content = validatedData.content;
    }
    if (validatedData.isPinned !== undefined) {
      updateData.isPinned = validatedData.isPinned;
    }
    if (validatedData.isLocked !== undefined) {
      updateData.isLocked = validatedData.isLocked;
    }
    if (validatedData.mergedIntoId !== undefined) {
      updateData.mergedIntoId = validatedData.mergedIntoId ?? null;
    }

    // Update question
    const updatedQuestion = await db.courseQuestion.update({
      where: { id: questionId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        section: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            answers: true,
            votes: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedQuestion,
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    });
    
    // Emit SSE update (fire-and-forget)
    try { qaEventBus.emitEvent({ type: 'question_updated', courseId, questionId, payload: { fields: Object.keys(updateData) } }); } catch {}
  } catch (error) {
    console.error('Error updating question:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid update data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating the question',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete a question
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'You must be logged in to delete questions' }
        },
        { status: 401 }
      );
    }

    const { courseId, questionId } = params;

    // Fetch question
    const question = await db.courseQuestion.findFirst({
      where: {
        id: questionId,
        courseId,
      },
    });

    if (!question) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Question not found' }
        },
        { status: 404 }
      );
    }

    // Check permissions
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { userId: true },
    });

    const isInstructor = course?.userId === user.id;
    const isOwner = question.userId === user.id;

    if (!isOwner && !isInstructor) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'You can only delete your own questions' }
        },
        { status: 403 }
      );
    }

    // Delete question (cascade will delete answers and votes)
    await db.courseQuestion.delete({
      where: { id: questionId },
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Question deleted successfully' },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    });
  } catch (error) {
    console.error('Error deleting question:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while deleting the question',
        },
      },
      { status: 500 }
    );
  }
}
