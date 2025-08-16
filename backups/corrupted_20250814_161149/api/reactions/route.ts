import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

const createErrorResponse = (message: string, status = 500) => {
  logger.error(`[UNIVERSAL_REACTIONS] Error: ${message}`);
  return NextResponse.json(
    { error: message },
    { status }
  );
};

export async function POST(req: NextRequest) {
  try {
    // Safe session check
    let user;
    try {
      user = await currentUser();
      if (!user || !user.id) {
        return createErrorResponse("Unauthorized", 401);
      }
    } catch (sessionError) {
      logger.error("[UNIVERSAL_REACTIONS] Session Error:", sessionError);
      return createErrorResponse("Authentication error. Please sign in again.", 401);
    }

    // Safely parse the request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      logger.error("[UNIVERSAL_REACTIONS] JSON Parse Error:", parseError);
      return createErrorResponse("Invalid request format", 400);
    }
    
    const { type, commentId, replyId, postId } = body;

    if (!type) {
      return createErrorResponse("Reaction type is required", 400);
    }

    if (!postId) {
      return createErrorResponse("Post ID is required", 400);
    }

    if (!commentId && !replyId) {
      return createErrorResponse("Either commentId or replyId is required", 400);
    }

    // First verify the post exists
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true }
    });

    if (!post) {
      return createErrorResponse("Post not found", 404);
    }

    // At the beginning of the POST function, after getting the user
    const userId = user.id as string;

    // Now handle reactions based on target type
    if (commentId && !replyId) {
      // This is a comment reaction
      return handleCommentReaction(userId, type, commentId, postId);
    } else if (replyId) {
      // This is a reply reaction
      return handleReplyReaction(userId, type, replyId, postId, commentId);
    } else {
      return createErrorResponse("Invalid request parameters", 400);
    }
  } catch (error: any) {
    logger.error("[UNIVERSAL_REACTIONS] Error:", error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("database") || error.message.includes("prisma")) {
        return createErrorResponse("Database error. Please try again later.", 500);
      }
    }
    
    return createErrorResponse("Internal server error", 500);
  }
}

// Helper function to handle comment reactions
async function handleCommentReaction(userId: string, type: string, commentId: string, postId: string) {
  try {
    // Verify comment exists and belongs to post
    const comment = await db.comment.findFirst({
      where: {
        id: commentId,
        postId,
      },
      include: {
        reactions: true,
      },
    });

    if (!comment) {
      return createErrorResponse("Comment not found", 404);
    }

    const result = await db.$transaction(async (tx) => {
      // Check for existing reaction
      const existingReaction = await tx.reaction.findFirst({
        where: {
          userId,
          commentId,
          type,
        },
      });

      if (existingReaction) {
        // Remove existing reaction (toggle)
        await tx.reaction.delete({
          where: {
            id: existingReaction.id,
          },
        });
      } else {
        // Remove any existing reactions by this user on this comment
        await tx.reaction.deleteMany({
          where: {
            userId,
            commentId,
          },
        });

        // Create new reaction
        await tx.reaction.create({
          data: {
            type,
            userId,
            commentId,
            updatedAt: new Date(),
          },
        });
      }

      // Get updated comment
      const updatedComment = await tx.comment.findUnique({
        where: {
          id: commentId,
        },
        include: {
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

      return updatedComment;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error("[COMMENT_REACTION_HANDLER] Error:", error);
    throw error;
  }
}

// Helper function to handle reply reactions
async function handleReplyReaction(userId: string, type: string, replyId: string, postId: string, commentId?: string) {
  try {
    // Build the query to find the reply
    const query: any = {
      id: replyId,
      postId,
    };
    
    // Add commentId to query if provided
    if (commentId) {
      query.commentId = commentId;
    }
    
    // Verify reply exists with the given criteria
    const reply = await db.reply.findFirst({
      where: query,
      include: {
        Reaction: true,
      },
    });

    if (!reply) {
      return createErrorResponse("Reply not found", 404);
    }

    const result = await db.$transaction(async (tx) => {
      // Check for existing reaction
      const existingReaction = await tx.reaction.findFirst({
        where: {
          userId,
          replyId,
          type,
        },
      });

      if (existingReaction) {
        // Remove existing reaction (toggle)
        await tx.reaction.delete({
          where: {
            id: existingReaction.id,
          },
        });
      } else {
        // Remove any existing reactions by this user on this reply
        await tx.reaction.deleteMany({
          where: {
            userId,
            replyId,
          },
        });

        // Create new reaction
        await tx.reaction.create({
          data: {
            type,
            userId,
            replyId,
            updatedAt: new Date(),
          },
        });
      }

      // Get updated reply
      const updatedReply = await tx.reply.findUnique({
        where: {
          id: replyId,
        },
        include: {
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
      });

      return updatedReply;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error("[REPLY_REACTION_HANDLER] Error:", error);
    throw error;
  }
} 