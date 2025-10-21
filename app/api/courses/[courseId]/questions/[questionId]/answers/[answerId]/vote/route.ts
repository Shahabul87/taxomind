import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { z } from 'zod';

// Schema for voting
const VoteSchema = z.object({
  value: z.number().int().min(-1).max(1), // -1 for downvote, 0 for remove vote, 1 for upvote
});

interface RouteParams {
  params: {
    courseId: string;
    questionId: string;
    answerId: string;
  };
}

// POST: Vote on an answer
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = VoteSchema.parse(body);
    const { value } = validatedData;

    // Get existing vote
    const existingVote = await db.answerVote.findUnique({
      where: {
        answerId_userId: {
          answerId,
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
        await db.answerVote.delete({
          where: {
            answerId_userId: {
              answerId,
              userId: user.id,
            },
          },
        });
      }
    } else {
      // Create or update vote
      await db.answerVote.upsert({
        where: {
          answerId_userId: {
            answerId,
            userId: user.id,
          },
        },
        create: {
          answerId,
          userId: user.id,
          value,
        },
        update: {
          value,
        },
      });
    }

    // Update answer vote counts
    const updatedAnswer = await db.courseAnswer.update({
      where: { id: answerId },
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

    return NextResponse.json({
      success: true,
      data: {
        answerId: updatedAnswer.id,
        upvotes: updatedAnswer.upvotes,
        downvotes: updatedAnswer.downvotes,
        userVote: value,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    });
  } catch (error) {
    console.error('Error voting on answer:', error);

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
