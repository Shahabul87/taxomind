import { NextRequest, NextResponse } from "next/server";
import { withAuth, type APIAuthContext, createSuccessResponse, createErrorResponse, ApiError } from "@/lib/api";
import { db } from "@/lib/db";
import { invalidateCache, getCommentKey } from "@/app/lib/cache";
import { logger } from '@/lib/logger';
import { currentUser } from "@/lib/auth";

// Get a single comment
export const GET = withAuth(async (
  request: NextRequest, 
  context: APIAuthContext,
  props?: any
) => {
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
      return createSuccessResponse(
        { error: "Comment not found" },
        404);
    }

    return createSuccessResponse(comment, 200);
  } catch (error) {
    logger.error("[COMMENT_GET]", error);
    return createSuccessResponse(
      { error: "Internal server error" },
      500
    );
  }
});

// Update a comment
export const PATCH = withAuth(async (
  request: NextRequest, 
  context: APIAuthContext,
  props?: any
) => {
  try {

    const params = await props.params;
    const { postId, commentId } = params;
    const { content } = await request.json();

    if (!content) {
      return createSuccessResponse(
        { error: "Content is required" },
        400);
    }

    // Find the comment to ensure it exists and belongs to the user
    const comment = await db.comment.findFirst({
      where: {
        id: commentId,
        postId: postId,
      },
    });

    if (!comment) {
      return createSuccessResponse(
        { error: "Comment not found" },
        404
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

    return createSuccessResponse(updatedComment, 200);
  } catch (error) {
    logger.error("[COMMENT_PATCH]", error);
    return createSuccessResponse(
      { error: "Internal server error" },
      500
    );
  }
});

// Delete a comment
export const DELETE = withAuth(async (
  request: NextRequest,
  context: APIAuthContext,
  props?: any
) => {
  try {

    const params = await props.params;
    const { postId, commentId } = params;

    // Check if the comment exists and belongs to the user
    const comment = await db.comment.findFirst({
      where: {
        id: commentId,
        postId,
        userId: context.user.id,
      },
    });

    if (!comment) {
      return createSuccessResponse(
        { error: "Comment not found or unauthorized" },
        404
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

    return createSuccessResponse({ success: true }, 200);
  } catch (error) {
    logger.error("[COMMENT_DELETE]", error);
    return createSuccessResponse(
      { error: "Internal server error" },
      500
    );
  }
});