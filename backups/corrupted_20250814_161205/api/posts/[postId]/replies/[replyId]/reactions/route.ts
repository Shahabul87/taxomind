import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

// Helper function for safer error responses
const createErrorResponse = (message: string, status = 500) => {
  logger.error(`[REPLY_REACTIONS_POST] Error: ${message}`);
  return NextResponse.json(
    { error: message },
    { status }
  );
};

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ postId: string; replyId: string }> }
) {
  // Declare user at the top level of the function
  let user;
  
  try {
    // Safe session check
    try {
      user = await currentUser();
      if (!user || !user.id) {
        return createErrorResponse("Unauthorized", 401);
      }
    } catch (sessionError) {
      logger.error("[REPLY_REACTIONS_POST] Session Error:", sessionError);
      return createErrorResponse("Authentication error. Please sign in again.", 401);
    }
    
    // Safely parse the request body
    let type;
    try {
      const body = await req.json();
      type = body.type;
    } catch (parseError) {
      logger.error("[REPLY_REACTIONS_POST] JSON Parse Error:", parseError);
      return createErrorResponse("Invalid request format", 400);
    }

    if (!type) {
      return createErrorResponse("Reaction type is required", 400);
    }

    // Get the params
    const params = await props.params;
    const { replyId, postId } = params;
    
    // Validate IDs
    if (!postId || typeof postId !== 'string') {
      return createErrorResponse("Invalid post ID", 400);
    }
    
    if (!replyId || typeof replyId !== 'string') {
      return createErrorResponse("Invalid reply ID", 400);
    }

    // First verify the post exists
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true }
    });

    if (!post) {
      return createErrorResponse("Post not found", 404);
    }

    // Verify the reply exists and belongs to the post
    const reply = await db.reply.findFirst({
      where: {
        id: replyId,
        postId,
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

    if (!reply) {

      return createErrorResponse("Reply not found", 404);
    }
    
    // Store the user ID to ensure it's accessible in the transaction
    const userId = user.id as string;

    // Handle the reaction in a transaction
    const result = await db.$transaction(async (tx) => {
      // Check for existing reaction
      const existingReaction = await tx.reaction.findFirst({
        where: {
          userId: userId, // Use the variable from outside the transaction
          replyId: replyId,
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
            type,
            userId: userId, // Use the variable from outside the transaction
            replyId,
            updatedAt: new Date(),
          },
        });
      }

      // Get updated reply with reactions
      const updatedReply = await tx.reply.findUnique({
        where: {
          id: replyId,
        },
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
      });

      return updatedReply;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error("[REPLY_REACTIONS_POST] Error:", error);
    
    // Provide more specific error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes("database") || error.message.includes("prisma")) {
        return createErrorResponse("Database error. Please try again later.", 500);
      }
    }
    
    return createErrorResponse("Internal server error", 500);
  }
} 