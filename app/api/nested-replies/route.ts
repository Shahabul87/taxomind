import { NextRequest, NextResponse } from "next/server";
import { withAuth, type APIAuthContext, createSuccessResponse, createErrorResponse, ApiError } from "@/lib/api";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { isRateLimited, getRateLimitMessage } from "@/app/lib/rate-limit";
import { logger } from '@/lib/logger';

/**
 * Universal endpoint for nested replies at any depth.
 * This is a fallback API that provides the same functionality as create-nested-reply.
 */
export async function POST(req: NextRequest) {

  try {
    // Authenticate the user
    const user = await currentUser();
    if (!user || !user.id) {

      return createErrorResponse(new ApiError("Unauthorized", 401));
    }

    // Check rate limiting
    const rateLimitResult = await isRateLimited(user.id, 'reply');
    if (rateLimitResult.limited) {

      return createErrorResponse(
        new ApiError(getRateLimitMessage('reply', rateLimitResult.reset), 429)
      );
    }

    // Parse request body
    let body;
    try {
      body = await req.json();

    } catch (err) {
      logger.error("[NESTED_REPLIES] Error parsing request:", err);
      return createErrorResponse(new ApiError("Invalid request format", 400));
    }

    const { postId, commentId, parentReplyId, content } = body;

    // Validate required fields
    if (!content) {
      return createErrorResponse(new ApiError("Content is required", 400));
    }
    
    if (!postId) {
      return createErrorResponse(new ApiError("Post ID is required", 400));
    }
    
    if (!commentId) {
      return createErrorResponse(new ApiError("Comment ID is required", 400));
    }

    // First verify the post exists
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true }
    });

    if (!post) {

      return createErrorResponse(new ApiError("Post not found", 404));
    }

    // Verify the comment exists and belongs to the post
    const comment = await db.comment.findFirst({
      where: {
        id: commentId,
        postId,
      },
      select: { id: true }
    });

    if (!comment) {

      return createErrorResponse(new ApiError("Comment not found", 404));
    }

    // Handle depth and path generation
    let depth = 0;
    let path = `${commentId}`;
    
    // If this is a reply to another reply, get the parent info
    if (parentReplyId) {
      const parentReply = await db.reply.findFirst({
        where: {
          id: parentReplyId,
          commentId,
          postId,
        },
        select: { 
          id: true,
          depth: true,
          path: true,
          commentId: true
        }
      });
      
      if (!parentReply) {

        return createErrorResponse(new ApiError("Parent reply not found", 404));
      }
      
      // Set depth and path based on parent
      depth = (parentReply.depth || 0) + 1;
      path = parentReply.path ? `${parentReply.path}/${parentReplyId}` : `${commentId}/${parentReplyId}`;
    }

    // Create the nested reply with depth and path info
    const reply = await db.reply.create({
      data: {
        content,
        userId: user.id,
        postId,
        commentId,
        parentReplyId: parentReplyId || null,
        depth,
        path,
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

    return createSuccessResponse(reply);
  } catch (error) {
    logger.error("[NESTED_REPLIES] Error:", error);
    return createErrorResponse(new ApiError("Error creating reply", 500));
  }
} 