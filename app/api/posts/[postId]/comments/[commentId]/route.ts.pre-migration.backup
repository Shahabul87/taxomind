import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { invalidateCache, getCommentKey } from "@/app/lib/cache";
import { logger } from '@/lib/logger';

// Get a single comment
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ postId: string; commentId: string }> }
) {
  try {
    const params = await props.params;
    const { postId, commentId } = params;

    const comment = await db.comment.findFirst({
      where: {
        id: commentId,
        postId: postId,
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        replies: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            Reaction: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(comment);
  } catch (error) {
    logger.error("[COMMENT_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update a comment
export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ postId: string; commentId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const params = await props.params;
    const { postId, commentId } = params;
    const { content } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Find the comment to ensure it exists and belongs to the user
    const comment = await db.comment.findFirst({
      where: {
        id: commentId,
        postId: postId,
      },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    if (!user.id || comment.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized: You can only edit your own comments" },
        { status: 403 }
      );
    }

    // Update the comment
    const updatedComment = await db.comment.update({
      where: {
        id: commentId,
      },
      data: {
        content,
        updatedAt: new Date(),
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedComment);
  } catch (error) {
    logger.error("[COMMENT_PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete a comment
export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ postId: string; commentId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await props.params;
    const { postId, commentId } = params;

    // Check if the comment exists and belongs to the user
    const comment = await db.comment.findFirst({
      where: {
        id: commentId,
        postId,
        userId: user.id,
      },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete the comment and cascade to replies and reactions
    await db.$transaction(async (tx) => {
      // 1. Delete all reactions on replies
      await tx.reaction.deleteMany({
        where: {
          Reply: {
            commentId,
          },
        },
      });

      // 2. Delete all replies
      await tx.reply.deleteMany({
        where: {
          commentId,
        },
      });

      // 3. Delete all reactions on the comment
      await tx.reaction.deleteMany({
        where: {
          commentId,
        },
      });

      // 4. Delete the comment
      await tx.comment.delete({
        where: {
          id: commentId,
        },
      });
    });

    // Invalidate caches
    await Promise.all([
      invalidateCache(`comments:${postId}:*`),
      invalidateCache(getCommentKey(commentId)),
      invalidateCache(`replies:${commentId}:*`),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("[COMMENT_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 