import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isRateLimited, getRateLimitMessage } from "@/app/lib/rate-limit";
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';

/**
 * Additional fallback API for nested replies - different URL structure
 * This provides yet another way to create nested replies if the other endpoints fail
 */
export async function POST(req: NextRequest) {

  try {
    // Authenticate the user
    const user = await currentUser();
    if (!user || !user.id) {

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check rate limiting
    const rateLimitResult = await isRateLimited(user.id, 'reply');
    if (rateLimitResult.limited) {

      return NextResponse.json({ 
        error: getRateLimitMessage('reply', rateLimitResult.reset),
        rateLimitInfo: rateLimitResult
      }, { status: 429 });
    }

    // Parse request body
    let body;
    try {
      body = await req.json();

    } catch (err) {
      logger.error("[NESTED_REPLY] Error parsing request:", err);
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
    }

    const { postId, commentId, parentReplyId, content } = body;

    // Validate required fields
    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }
    
    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    // First verify the post exists
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true }
    });

    if (!post) {

      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // SIMPLIFIED APPROACH: We'll work with either commentId or parentReplyId
    let targetCommentId = commentId;
    let depth = 0;
    let path = "";
    
    // If this is a reply to another reply, get the parent info
    if (parentReplyId) {
      // Look up the parent reply by ID - relaxed query just using parentReplyId
      const parentReply = await db.reply.findUnique({
        where: { id: parentReplyId },
        select: { 
          id: true,
          commentId: true,
          depth: true,
          path: true
        }
      });
      
      if (!parentReply) {

        return NextResponse.json({ error: "Parent reply not found" }, { status: 404 });
      }
      
      // Use the parent's commentId if no comment ID was provided
      targetCommentId = targetCommentId || parentReply.commentId;
      
      // IMPORTANT: Verify that the commentId exists in the database
      if (targetCommentId) {
        const commentExists = await db.comment.findUnique({
          where: { id: targetCommentId },
          select: { id: true }
        });
        
        if (!commentExists) {

          return NextResponse.json({ error: "Target comment not found" }, { status: 404 });
        }
      } else {

        return NextResponse.json({ error: "Missing valid comment ID" }, { status: 400 });
      }
      
      // Set depth and path based on parent
      depth = (parentReply.depth || 0) + 1;
      
      // Generate path
      if (parentReply.path) {
        path = `${parentReply.path}/${parentReplyId}`;
      } else if (targetCommentId) {
        path = `${targetCommentId}/${parentReplyId}`;
      } else {
        // Fallback if we can't establish a proper path
        path = `reply/${parentReplyId}`;
      }

    } else if (targetCommentId) {
      // Direct reply to a comment
      path = targetCommentId;
      
      // Verify the comment exists
      const comment = await db.comment.findUnique({
        where: { id: targetCommentId },
        select: { id: true }
      });
      
      if (!comment) {

        return NextResponse.json({ error: "Comment not found" }, { status: 404 });
      }
    } else {
      // We need either a comment ID or a parent reply ID

      return NextResponse.json({ error: "Either commentId or parentReplyId is required" }, { status: 400 });
    }

    // Create the nested reply with depth and path info
    const reply = await db.reply.create({
      data: {
        id: randomUUID(),
        content,
        userId: user.id,
        postId,
        commentId: targetCommentId,
        parentReplyId: parentReplyId || null,
        depth,
        path,
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

    return NextResponse.json(reply);
  } catch (error: any) {
    logger.error("[NESTED_REPLY] Error:", error);
    return NextResponse.json(
      { error: "Error creating reply" },
      { status: 500 }
    );
  }
} 