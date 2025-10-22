import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { z } from 'zod';
import { qaEventBus } from '@/lib/realtime/event-bus';

// Schema for creating an answer
const CreateAnswerSchema = z.object({
  content: z.string().min(20, 'Answer must be at least 20 characters').max(20000, 'Answer too long'),
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
  };
}

// POST: Create a new answer
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'You must be logged in to answer questions' }
        },
        { status: 401 }
      );
    }

    const { courseId, questionId } = params;

    // Verify question exists and belongs to course
    const question = await db.courseQuestion.findFirst({
      where: {
        id: questionId,
        courseId,
      },
      select: { id: true, courseId: true, isLocked: true },
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

    // Disallow answers on locked questions
    if ((question as any)?.isLocked) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'This question is locked' }
        },
        { status: 403 }
      );
    }

    // Verify user is enrolled in the course
    const enrollment = await db.enrollment.findFirst({
      where: {
        userId: user.id,
        courseId,
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'You must be enrolled in this course to answer questions' }
        },
        { status: 403 }
      );
    }

    // Check if user is the course instructor
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { userId: true },
    });

    const isInstructor = course?.userId === user.id;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = CreateAnswerSchema.parse(body);

    // Create answer
    const answer = await db.courseAnswer.create({
      data: {
        content: sanitizeHtmlServer(validatedData.content),
        questionId,
        userId: user.id,
        isInstructor,
      },
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

    // If this is the first answer, mark question as answered
    const answerCount = await db.courseAnswer.count({
      where: { questionId },
    });

    if (answerCount === 1) {
      await db.courseQuestion.update({
        where: { id: questionId },
        data: { isAnswered: true },
      });
    }

    // Emit SSE event
    qaEventBus.emitEvent({ type: 'answer_created', courseId, questionId, payload: { answerId: answer.id } });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...answer,
          userVote: 0, // New answer, user hasn't voted yet
        },
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating answer:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid answer data',
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
          message: 'An error occurred while creating the answer',
        },
      },
      { status: 500 }
    );
  }
}
