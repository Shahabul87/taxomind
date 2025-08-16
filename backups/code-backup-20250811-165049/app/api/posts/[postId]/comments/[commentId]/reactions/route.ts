import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';

// Near the top of the file, add a helper function for safer error responses
const createErrorResponse = (message: string, status = 500) => {
  logger.error(`[REACTIONS_POST] Error: ${message}`);
  return NextResponse.json(
    { error: message },
    { status }
  );
};

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ postId: string; commentId: string }> }
) {
  try {
    // At the start of the POST function, add a try/catch for the session check
    let user;
    try {
      user = await currentUser();
      if (!user || !user.id) {
        return createErrorResponse("Unauthorized", 401);
      }
    } catch (sessionError) {
      logger.error("[REACTIONS_POST] Session Error:", sessionError);
      return createErrorResponse("Authentication error. Please sign in again.", 401);
    }

    // Get the reaction type from the request body
    const body = await request.json();
    const { type } = body;

    // Add validation for request body
    if (!type || typeof type !== 'string') {
      return createErrorResponse("Invalid reaction type", 400);
    }

    // Get the params and extract commentId and postId
    const params = await props.params;
    const { commentId, postId } = params;

    // Validate IDs
    if (!postId || typeof postId !== 'string') {
      return createErrorResponse("Invalid post ID", 400);
    }
    
    if (!commentId || typeof commentId !== 'string') {
      return createErrorResponse("Invalid comment ID", 400);
    }

    // First verify the post exists
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true }
    });

    if (!post) {

      return createErrorResponse("Post not found", 404);
    }

    // Verify the comment exists and belongs to the post
    const comment = await db.comment.findFirst({
      where: {
        id: commentId,
        postId: postId,
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

    if (!comment) {

      // Let's check if the comment exists at all, regardless of postId
      const commentExists = await db.comment.findUnique({
        where: { id: commentId },
        select: { id: true, postId: true }
      });
      
      if (commentExists) {
}
      return createErrorResponse("Comment not found", 404);
    }

    // Handle the reaction in a transaction
    const result = await db.$transaction(async (tx) => {
      // Check for existing reaction
      const existingReaction = await tx.reaction.findFirst({
        where: {
          userId: user.id!,
          commentId: commentId,
          type: type,
        },
      });

      if (existingReaction) {

        // Remove existing reaction
        await tx.reaction.delete({
          where: {
            id: existingReaction.id,
          },
        });
      } else {

        // Create new reaction
        await tx.reaction.create({
          data: {
            id: randomUUID(),
            type,
            userId: user.id!,
            commentId,
            updatedAt: new Date(),
          },
        });
      }

      // Get updated comment with reactions
      const updatedComment = await tx.comment.findUnique({
        where: {
          id: commentId,
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

      return updatedComment;
    });

    return NextResponse.json(result);
  } catch (error) {
    // Improve error logging
    logger.error("[REACTIONS_POST] Unexpected error:", error);
    
    // Provide more specific error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes("database") || error.message.includes("prisma")) {
        return createErrorResponse("Database error. Please try again later.", 500);
      }
    }
    
    return createErrorResponse("Internal server error", 500);
  }
} 