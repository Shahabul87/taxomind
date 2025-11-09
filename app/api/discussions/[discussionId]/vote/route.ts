import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Input validation schema
const VoteSchema = z.object({
  voteType: z.enum(['UPVOTE', 'DOWNVOTE']),
});

// Vote on a discussion
export async function POST(
  request: NextRequest,
  { params }: { params: { discussionId: string } }
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = VoteSchema.parse(body);

    // Check if discussion exists
    const discussion = await db.discussion.findUnique({
      where: { id: params.discussionId },
      include: {
        section: {
          include: {
            chapter: {
              include: {
                course: {
                  include: {
                    Enrollment: {
                      where: { userId: user.id },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!discussion) {
      return NextResponse.json(
        { error: 'Discussion not found' },
        { status: 404 }
      );
    }

    // Check access
    const isEnrolled = discussion.section.chapter.course.Enrollment.length > 0;
    const isTeacher = discussion.section.chapter.course.userId === user.id;

    if (!isEnrolled && !isTeacher) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if user already voted
    const existingVote = await db.discussionVote.findUnique({
      where: {
        discussionId_userId: {
          discussionId: params.discussionId,
          userId: user.id,
        },
      },
    });

    // If same vote type, remove the vote (toggle)
    if (existingVote && existingVote.voteType === validatedData.voteType) {
      await db.discussionVote.delete({
        where: {
          discussionId_userId: {
            discussionId: params.discussionId,
            userId: user.id,
          },
        },
      });

      return NextResponse.json({
        success: true,
        action: 'removed',
        voteType: null,
      });
    }

    // Otherwise, upsert the vote
    const vote = await db.discussionVote.upsert({
      where: {
        discussionId_userId: {
          discussionId: params.discussionId,
          userId: user.id,
        },
      },
      update: {
        voteType: validatedData.voteType,
      },
      create: {
        discussionId: params.discussionId,
        userId: user.id,
        voteType: validatedData.voteType,
      },
    });

    return NextResponse.json({
      success: true,
      action: existingVote ? 'updated' : 'created',
      vote,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Vote error:', error);
    return NextResponse.json(
      { error: 'Failed to process vote' },
      { status: 500 }
    );
  }
}

// Remove vote
export async function DELETE(
  request: NextRequest,
  { params }: { params: { discussionId: string } }
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await db.discussionVote.delete({
      where: {
        discussionId_userId: {
          discussionId: params.discussionId,
          userId: user.id,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Vote deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to remove vote' },
      { status: 500 }
    );
  }
}
