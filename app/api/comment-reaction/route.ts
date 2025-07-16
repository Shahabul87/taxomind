import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isRateLimited, getRateLimitMessage } from "@/app/lib/rate-limit";

// A simplified, universal endpoint for handling all types of reactions
export async function POST(req: NextRequest) {
  console.log("[COMMENT_REACTION] Received request");
  
  try {
    // Authenticate the user
    const user = await currentUser();
    if (!user || !user.id) {
      console.log("[COMMENT_REACTION] Unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check rate limiting
    const rateLimitResult = await isRateLimited(user.id, 'reaction');
    if (rateLimitResult.limited) {
      console.log(`[COMMENT_REACTION] Rate limited: ${user.id}`, rateLimitResult);
      return NextResponse.json({ 
        error: getRateLimitMessage('reaction', rateLimitResult.reset),
        rateLimitInfo: rateLimitResult
      }, { status: 429 });
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
      console.log("[COMMENT_REACTION] Request body:", body);
    } catch (err) {
      console.error("[COMMENT_REACTION] Error parsing request:", err);
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
    }

    const { postId, commentId, replyId, type } = body;
    
    // Validate required fields
    if (!type) {
      return NextResponse.json({ error: "Reaction type is required" }, { status: 400 });
    }
    
    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }
    
    // Modified validation to allow either/or for testing purposes
    if (!commentId && !replyId) {
      console.log("[COMMENT_REACTION] Both commentId and replyId are missing");
      return NextResponse.json({ 
        error: "Either commentId or replyId is required",
        status: "VALIDATION_ERROR"
      }, { status: 400 });
    }

    console.log("[COMMENT_REACTION] Processing reaction:", {
      postId,
      commentId: commentId || 'none',
      replyId: replyId || 'none',
      type,
      userId: user.id
    });

    // For test/dev environment, allow dummy requests
    if (process.env.NODE_ENV === 'development' && postId === 'test-post-id') {
      console.log("[COMMENT_REACTION] Handling test request");
      return NextResponse.json({
        id: replyId || commentId,
        reactions: [{
          id: 'test-reaction-id',
          type,
          userId: user.id,
          user: {
            id: user.id,
            name: user.name || 'Test User'
          }
        }],
        message: "Test reaction processed successfully"
      });
    }

    // First verify the post exists
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true }
    });

    if (!post) {
      console.log("[COMMENT_REACTION] Post not found");
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Handle comment reaction
    if (commentId && !replyId) {
      return await handleCommentReaction(user.id, type, commentId, postId);
    }
    
    // Handle reply reaction
    if (replyId) {
      return await handleReplyReaction(user.id, type, replyId, postId, commentId);
    }

    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  } catch (error) {
    console.error("[COMMENT_REACTION] Error:", error);
    return NextResponse.json(
      { error: "Error processing reaction" },
      { status: 500 }
    );
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
    });

    if (!comment) {
      console.log("[COMMENT_REACTION] Comment not found");
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Process the reaction in a transaction
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
        // Remove existing reaction (toggle off)
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

    console.log("[COMMENT_REACTION] Successfully processed comment reaction");
    return NextResponse.json(result);
  } catch (error) {
    console.error("[COMMENT_REACTION] Comment reaction error:", error);
    throw error;
  }
}

// Helper function to handle reply reactions
async function handleReplyReaction(userId: string, type: string, replyId: string, postId: string, commentId?: string) {
  try {
    console.log("[COMMENT_REACTION] Reply reaction request for:", { replyId, type, commentId });
    
    // For test/dev environment, allow dummy requests with test IDs
    if (process.env.NODE_ENV === 'development' && 
        (postId === 'test-post-id' || replyId === 'test-reply-id')) {
      console.log("[COMMENT_REACTION] Handling test reply reaction");
      return NextResponse.json({
        id: replyId,
        reactions: [{
          id: 'test-reaction-id',
          type,
          userId,
          user: {
            id: userId,
            name: 'Test User'
          }
        }],
        message: "Test reply reaction processed successfully"
      });
    }
    
    // Find the reply using just the ID for simplicity
    let reply = await db.reply.findUnique({
      where: {
        id: replyId,
      },
      select: {
        id: true,
        userId: true,
        postId: true,
        commentId: true,
        path: true
      }
    });

    if (!reply) {
      console.log("[COMMENT_REACTION] Reply not found");
      
      // Additional error details
      return NextResponse.json({ 
        error: "Reply not found", 
        details: {
          replyId,
          postId,
          commentId,
          timestamp: new Date().toISOString()
        }
      }, { status: 404 });
    }

    // Process the reaction in a transaction
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
        // Remove existing reaction (toggle off)
        console.log("[COMMENT_REACTION] Removing existing reaction:", existingReaction.id);
        await tx.reaction.delete({
          where: {
            id: existingReaction.id,
          },
        });
      } else {
        // Remove any existing reactions by this user on this reply
        const deleted = await tx.reaction.deleteMany({
          where: {
            userId,
            replyId,
          },
        });
        console.log("[COMMENT_REACTION] Removed previous reactions:", deleted.count);

        // Create new reaction
        const newReaction = await tx.reaction.create({
          data: {
            type,
            userId,
            replyId,
            updatedAt: new Date(),
          },
        });
        console.log("[COMMENT_REACTION] Created new reaction:", newReaction.id);
      }

      // Get updated reply with reactions
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

    console.log("[COMMENT_REACTION] Successfully processed reply reaction with reaction count:", result?.Reaction?.length || 0);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[COMMENT_REACTION] Reply reaction error:", error);
    throw error;
  }
} 