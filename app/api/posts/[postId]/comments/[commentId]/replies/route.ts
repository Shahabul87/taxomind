import { NextRequest, NextResponse } from "next/server";
import { withAuth, type APIAuthContext, createSuccessResponse, createErrorResponse, ApiError } from "@/lib/api";
import { db } from "@/lib/db";
import { isRateLimited, getRateLimitMessage } from "@/lib/rate-limit";
import { logger } from '@/lib/logger';

export const POST = withAuth(async (
  request: NextRequest, 
  context: APIAuthContext,
  props?: any
) => {
  try {

    const rateLimitResult = await isRateLimited(context.user.id, 'reply');
    if (rateLimitResult.limited) {

      return createSuccessResponse({ 
        error: getRateLimitMessage('reply', rateLimitResult.reset),
        rateLimitInfo: rateLimitResult
      }, 429);
    }

    const { content, parentReplyId } = await request.json();
    const params = await props.params;
    const { postId, commentId } = params;

    if (!content) {
      return createSuccessResponse({ error: "Content is required" }, 400);
    }

    // Check if comment exists
    const comment = await db.comment.findFirst({
      where: {
        id: commentId,
        postId,
      },
    });

    if (!comment) {

      return createSuccessResponse({ error: "Comment not found" }, 404);
    }

    // If parentReplyId is provided, ensure it exists and belongs to this comment
    if (parentReplyId) {
      const parentReply = await db.reply.findFirst({
        where: {
          id: parentReplyId,
          commentId,
        },
        select: {
          id: true,
          parentReplyId: true
        }
      });

      if (!parentReply) {

        return createSuccessResponse({ error: "Parent reply not found" }, 404);
      }

      // Check nesting depth to prevent excessive depth
      // This is a backup server-side check
      let replyDepth = 1; // Start at 1 for this reply
      let currentParentId = parentReply.parentReplyId;
      
      while (currentParentId && replyDepth <= 10) {
        replyDepth++;
        
        // If we've gone too deep, prevent excessive nesting
        if (replyDepth > 10) { // Hard limit on server side for safety
          return createSuccessResponse({ 
            error: "Maximum reply nesting depth exceeded" 
          }, 400);
        }
        
        // Get the next parent in the chain
        const nextParent = await db.reply.findUnique({
          where: { id: currentParentId },
          select: { parentReplyId: true }
        });
        
        currentParentId = nextParent?.parentReplyId || null;
      }

    }

    // Create reply with optional parentReplyId
    const reply = await db.reply.create({
      data: {
        content,
        userId: context.user.id,
        postId,
        commentId,
        parentReplyId: parentReplyId || null, // Include parentReplyId if provided
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

    return createSuccessResponse(reply, 201);
  } catch (error) {
    logger.error("[COMMENT_REPLY_POST] Error:", error);
    return createSuccessResponse({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    }, 500);
  }
});

export const GET = withAuth(async (
  request: NextRequest, 
  context: APIAuthContext,
  props?: any
) => {
  try {
    const params = await props.params;
    const { commentId } = params;

    const replies = await db.reply.findMany({
      where: {
        commentId,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return createSuccessResponse(replies, 200);
  } catch (error) {
    logger.error("[REPLIES_GET]", error);
    return createErrorResponse(ApiError.internal("Internal Error"));
  }
});

