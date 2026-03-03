import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { z } from 'zod';
import { qaEventBus } from '@/lib/realtime/event-bus';
import { logger } from '@/lib/logger';

// Schema for updating an answer
const UpdateAnswerSchema = z.object({
  content: z.string().min(20).max(5000).optional(),
  isBestAnswer: z.boolean().optional(),
});

function sanitizeHtmlServer(input: string): string {
  try {
    let out = input;
    out = out.replace(/<\/(?:script|style)>/gi, '').replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '');
    out = out.replace(/ on[a-z]+="[^"]*"/gi, '').replace(/ on[a-z]+='[^']*'/gi, '');
    out = out.replace(/javascript:/gi, '');
    return out;
  } catch {
    return input;
  }
}

interface RouteParams {
  params: {
    courseId: string;
    questionId: string;
    answerId: string;
  };
}

// PATCH: Update an answer or mark as best answer
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
          error: { code: 'UNAUTHORIZED', message: 'You must be logged in to update answers' }
        },
        { status: 401 }
      );
    }

    const { courseId, questionId, answerId } = params;

    // Verify answer exists
    const answer = await db.courseAnswer.findFirst({
      where: {
        id: answerId,
        questionId,
        question: {
          courseId,
        },
      },
      include: {
        question: true,
      },
    });

    if (!answer) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Answer not found' }
        },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = UpdateAnswerSchema.parse(body);

    // Check permissions
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { userId: true },
    });

    const isInstructor = course?.userId === user.id;
    const isOwner = answer.userId === user.id;
    const isQuestionOwner = answer.question.userId === user.id;

    // Only owner can edit content
    if (validatedData.content !== undefined && !isOwner && !isInstructor) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'You can only edit your own answers' }
        },
        { status: 403 }
      );
    }

    // Only question owner or instructor can mark best answer
    if (validatedData.isBestAnswer !== undefined && !isQuestionOwner && !isInstructor) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Only the question author or instructor can mark best answer' }
        },
        { status: 403 }
      );
    }

    // If marking as best answer, unmark other answers first
    if (validatedData.isBestAnswer === true) {
      await db.courseAnswer.updateMany({
        where: {
          questionId,
          id: { not: answerId },
        },
        data: { isBestAnswer: false },
      });
    }

    // Build update data
    const updateData: {
      content?: string;
      isBestAnswer?: boolean;
    } = {};

    if (validatedData.content !== undefined) {
      updateData.content = sanitizeHtmlServer(validatedData.content);
    }
    if (validatedData.isBestAnswer !== undefined) {
      updateData.isBestAnswer = validatedData.isBestAnswer;
    }

    // Update answer
    const updatedAnswer = await db.courseAnswer.update({
      where: { id: answerId },
      data: updateData,
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
    });

    const response = NextResponse.json({
      success: true,
      data: updatedAnswer,
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    });
    try {
      if (validatedData.isBestAnswer !== undefined) {
        qaEventBus.emitEvent({ type: 'answer_marked_best', courseId, questionId, payload: { answerId, isBest: Boolean(validatedData.isBestAnswer) } });
      } else {
        qaEventBus.emitEvent({ type: 'question_updated', courseId, questionId, payload: { fields: ['answer_updated'] } });
      }
    } catch {}
    return response;
  } catch (error) {
    logger.error('[ANSWER_PATCH] Error updating answer', error);

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
          message: 'An error occurred while updating the answer',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE: Delete an answer
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
          error: { code: 'UNAUTHORIZED', message: 'You must be logged in to delete answers' }
        },
        { status: 401 }
      );
    }

    const { courseId, questionId, answerId } = params;

    // Verify answer exists
    const answer = await db.courseAnswer.findFirst({
      where: {
        id: answerId,
        questionId,
        question: {
          courseId,
        },
      },
    });

    if (!answer) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Answer not found' }
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
    const isOwner = answer.userId === user.id;

    if (!isOwner && !isInstructor) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'You can only delete your own answers' }
        },
        { status: 403 }
      );
    }

    // Delete answer (cascade will delete votes)
    await db.courseAnswer.delete({
      where: { id: answerId },
    });

    // Check if question still has answers
    const remainingAnswers = await db.courseAnswer.count({
      where: { questionId },
    });

    // If no more answers, mark question as unanswered
    if (remainingAnswers === 0) {
      await db.courseQuestion.update({
        where: { id: questionId },
        data: { isAnswered: false },
      });
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Answer deleted successfully' },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    });
  } catch (error) {
    logger.error('[ANSWER_DELETE] Error deleting answer', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while deleting the answer',
        },
      },
      { status: 500 }
    );
  }
}
