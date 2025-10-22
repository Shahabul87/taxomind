import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { z } from 'zod';
import { qaEventBus } from '@/lib/realtime/event-bus';

// Schema for voting
const VoteSchema = z.object({
  value: z.number().int().min(-1).max(1), // -1 for downvote, 0 for remove vote, 1 for upvote
});

interface RouteParams {
  params: {
    courseId: string;
    questionId: string;
  };
}

// POST: Vote on a question
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
          error: { code: 'UNAUTHORIZED', message: 'You must be logged in to vote' }
        },
        { status: 401 }
      );
    }

    const { courseId, questionId } = params;

    // Verify question exists
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = VoteSchema.parse(body);
    const { value } = validatedData;

    // Get existing vote
    const existingVote = await db.questionVote.findUnique({
      where: {
        questionId_userId: {
          questionId,
          userId: user.id,
        },
      },
    });

    let upvoteDelta = 0;
    let downvoteDelta = 0;

    // Calculate deltas based on current and new vote
    if (existingVote) {
      if (existingVote.value === 1) {
        upvoteDelta = -1; // Removing upvote
      } else if (existingVote.value === -1) {
        downvoteDelta = -1; // Removing downvote
      }
    }

    if (value === 1) {
      upvoteDelta += 1;
    } else if (value === -1) {
      downvoteDelta += 1;
    }

    // Handle vote based on value
    if (value === 0) {
      // Remove vote
      if (existingVote) {
        await db.questionVote.delete({
          where: {
            questionId_userId: {
              questionId,
              userId: user.id,
            },
          },
        });
      }
    } else {
      // Create or update vote
      await db.questionVote.upsert({
        where: {
          questionId_userId: {
            questionId,
            userId: user.id,
          },
        },
        create: {
          questionId,
          userId: user.id,
          value,
        },
        update: {
          value,
        },
      });
    }

    // Update question vote counts
    const updatedQuestion = await db.courseQuestion.update({
      where: { id: questionId },
      data: {
        upvotes: { increment: upvoteDelta },
        downvotes: { increment: downvoteDelta },
      },
      select: {
        id: true,
        upvotes: true,
        downvotes: true,
      },
    });

    const response = NextResponse.json({
      success: true,
      data: {
        questionId: updatedQuestion.id,
        upvotes: updatedQuestion.upvotes,
        downvotes: updatedQuestion.downvotes,
        userVote: value,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    });
    
    try { qaEventBus.emitEvent({ type: 'vote_updated', courseId, questionId, payload: { upvotes: updatedQuestion.upvotes, downvotes: updatedQuestion.downvotes } }); } catch {}
    return response;
  } catch (error) {
    console.error('Error voting on question:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid vote value',
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
          message: 'An error occurred while voting',
        },
      },
      { status: 500 }
    );
  }
}
