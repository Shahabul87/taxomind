import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

/**
 * Ultra simple reply endpoint - just create a reply with whatever is provided
 * Last resort fallback for when other APIs fail
 */
export async function POST(req: NextRequest) {

  try {
    // Authenticate the user
    const user = await currentUser();
    if (!user || !user.id) {

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    let body;
    try {
      body = await req.json();

    } catch (err) {
      logger.error("[SIMPLE_REPLY] Error parsing request:", err);
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
    }

    const { postId, commentId, parentReplyId, content } = body;

    // Only validate content and postId
    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }
    
    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }
    
    // Determine the comment ID and depth
    let targetCommentId = commentId;
    let depth = 0;
    
    // If parentReplyId is given, try to look it up - but don't fail if not found
    if (parentReplyId) {
      try {
        // Try to get the parent reply info
        const parentReply = await db.reply.findUnique({
          where: { id: parentReplyId },
          select: { id: true, commentId: true, depth: true }
        });
        
        if (parentReply) {
          // We found it - use its commentId and increment its depth
          targetCommentId = parentReply.commentId;
          depth = (parentReply.depth || 0) + 1;

        } else {
}
      } catch (lookupError) {
        logger.error("[SIMPLE_REPLY] Error looking up parent reply - ignoring:", lookupError);
        // Continue anyway - we'll use the provided commentId
      }
    }
    
    // Safety check - in case we still don't have a valid commentId
    if (!targetCommentId) {

      // Create a fallback comment ID - this should never happen, but just in case
      targetCommentId = "fallback-" + postId;
    }
    
    // ESSENTIAL: Verify the commentId exists in the database to avoid foreign key constraint errors
    try {
      // Check if this commentId actually exists
      const commentExists = await db.comment.findUnique({
        where: { id: targetCommentId },
        select: { id: true }
      });
      
      if (!commentExists) {

        // As a last resort, try to find ANY comment for this post
        const anyComment = await db.comment.findFirst({
          where: { postId },
          select: { id: true }
        });
        
        if (anyComment) {

          targetCommentId = anyComment.id;
        } else {

          return NextResponse.json({ 
            error: "Cannot create reply - no valid comment found" 
          }, { status: 404 });
        }
      }
    } catch (commentCheckError) {
      logger.error("[SIMPLE_REPLY] Error checking comment existence:", commentCheckError);
      return NextResponse.json({ 
        error: "Error validating comment - cannot create reply" 
      }, { status: 500 });
    }
    
    // Create the reply with minimal required fields

    const reply = await db.reply.create({
      data: {
        content,
        userId: user.id,
        postId,
        commentId: targetCommentId,
        parentReplyId: parentReplyId || null,
        depth
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    // Return the created reply
    return NextResponse.json({
      ...reply,
      reactions: [] // Add an empty reactions array to match other APIs
    });
  } catch (error: any) {
    logger.error("[SIMPLE_REPLY] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error creating reply" },
      { status: 500 }
    );
  }
} 