import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

// Input validation schema
const DiscussionCreateSchema = z.object({
  content: z.string().min(1).max(5000),
  parentId: z.string().optional(),
});

// Create a new discussion or reply
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    const { sectionId } = await params;
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = DiscussionCreateSchema.parse(body);

    // Check if user has access to this section
    const section = await db.section.findUnique({
      where: { id: sectionId },
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
    });

    if (!section) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      );
    }

    const isEnrolled = section.chapter.course.Enrollment.length > 0;
    const isTeacher = section.chapter.course.userId === user.id;

    if (!isEnrolled && !isTeacher) {
      return NextResponse.json(
        { error: 'Access denied - You must be enrolled to participate in discussions' },
        { status: 403 }
      );
    }

    // If parentId is provided, verify it exists
    if (validatedData.parentId) {
      const parentDiscussion = await db.discussion.findUnique({
        where: { id: validatedData.parentId },
      });

      if (!parentDiscussion) {
        return NextResponse.json(
          { error: 'Parent discussion not found' },
          { status: 404 }
        );
      }

      if (parentDiscussion.sectionId !== sectionId) {
        return NextResponse.json(
          { error: 'Parent discussion is from a different section' },
          { status: 400 }
        );
      }
    }

    // Create discussion
    const discussion = await db.discussion.create({
      data: {
        userId: user.id,
        sectionId: sectionId,
        content: validatedData.content,
        parentId: validatedData.parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
        votes: true,
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, discussion });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Discussion creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create discussion' },
      { status: 500 }
    );
  }
}

// Get all discussions for a section
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  try {
    const { sectionId } = await params;
    const user = await currentUser();

    // Get discussions (only top-level, not replies)
    const discussions = await db.discussion.findMany({
      where: {
        sectionId: sectionId,
        parentId: null, // Only top-level discussions
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
        votes: {
          select: {
            id: true,
            userId: true,
            voteType: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                email: true,
              },
            },
            votes: {
              select: {
                id: true,
                userId: true,
                voteType: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: [
        { isPinned: 'desc' }, // Pinned first
        { createdAt: 'desc' }, // Then newest
      ],
      take: 50,
    });

    // Calculate vote scores for each discussion
    const discussionsWithScores = discussions.map((discussion) => {
      const upvotes = discussion.votes.filter((v) => v.voteType === 'UPVOTE').length;
      const downvotes = discussion.votes.filter((v) => v.voteType === 'DOWNVOTE').length;
      const score = upvotes - downvotes;
      const userVote = user ? discussion.votes.find((v) => v.userId === user.id) : null;

      // Calculate reply scores
      const repliesWithScores = discussion.replies.map((reply) => {
        const replyUpvotes = reply.votes.filter((v) => v.voteType === 'UPVOTE').length;
        const replyDownvotes = reply.votes.filter((v) => v.voteType === 'DOWNVOTE').length;
        const replyScore = replyUpvotes - replyDownvotes;
        const replyUserVote = user ? reply.votes.find((v) => v.userId === user.id) : null;

        return {
          ...reply,
          score: replyScore,
          upvotes: replyUpvotes,
          downvotes: replyDownvotes,
          userVote: replyUserVote?.voteType || null,
        };
      });

      return {
        ...discussion,
        score,
        upvotes,
        downvotes,
        userVote: userVote?.voteType || null,
        replies: repliesWithScores,
      };
    });

    return NextResponse.json({
      success: true,
      discussions: discussionsWithScores,
      count: discussions.length,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Discussion fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discussions' },
      { status: 500 }
    );
  }
}
