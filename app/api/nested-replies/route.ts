import { NextRequest, NextResponse } from "next/server";
import { withAuth, type APIAuthContext, createSuccessResponse, createErrorResponse, ApiError } from "@/lib/api";
import { db } from "@/lib/db";
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

      return createSuccessResponse({ error: "Unauthorized" }, { status: 401 });
    }

    // Check rate limiting
    const rateLimitResult = await isRateLimited(user.id, 'reply');
    if (rateLimitResult.limited) {

      return createSuccessResponse({ 
        error: getRateLimitMessage('reply', rateLimitResult.reset),
        rateLimitInfo: rateLimitResult
      }, { status: 429 });
    }

    // Parse request body
    let body;
    try {
      body = await req.json();

    } catch (err) {
      logger.error("[NESTED_REPLIES] Error parsing request:", err);
      return createSuccessResponse({ error: "Invalid request format" }, { status: 400 });
    }

    const { postId, commentId, parentReplyId, content } = body;

    // Validate required fields
    if (!content) {
      return createSuccessResponse({ error: "Content is required" }, { status: 400 });
    }
    
    if (!postId) {
      return createSuccessResponse({ error: "Post ID is required" }, { status: 400 });
    }
    
    if (!commentId) {
      return createSuccessResponse({ error: "Comment ID is required" }, { status: 400 });
    }

    // First verify the post exists
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true }
    });

    if (!post) {

      return createSuccessResponse({ error: "Post not found" }, { status: 404 });
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

      return createSuccessResponse({ error: "Comment not found" }, { status: 404 });
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

        return createSuccessResponse({ error: "Parent reply not found" }, { status: 404 });
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
    return createSuccessResponse(
      { error: "Error creating reply" },
      { status: 500 }
    );
  }
} 