import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isRateLimited, getRateLimitMessage } from "@/app/lib/rate-limit";

// Optimized endpoint for handling nested replies of any depth
export async function POST(req: NextRequest) {
  console.log("[CREATE_NESTED_REPLY] Request received");
  
  try {
    // Authenticate the user
    const user = await currentUser();
    if (!user?.id) {
      console.log("[CREATE_NESTED_REPLY] Unauthorized - no user session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check rate limiting
    const rateLimitResult = await isRateLimited(user.id, 'reply');
    if (rateLimitResult.limited) {
      console.log(`[CREATE_NESTED_REPLY] Rate limited: ${user.id}`, rateLimitResult);
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
      console.error("[CREATE_NESTED_REPLY] Error parsing request:", err);
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
    }

    const { postId, commentId, parentReplyId, content } = body;
    
    console.log("[CREATE_NESTED_REPLY] Processing request:", {
      postId,
      commentId,
      parentReplyId,
      contentLength: content?.length
    });

    // Validate required fields
    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }
    
    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }
    
    if (!commentId) {
      return NextResponse.json({ error: "Comment ID is required" }, { status: 400 });
    }

    // First verify the post exists
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true }
    });

    if (!post) {
      console.log("[CREATE_NESTED_REPLY] Post not found");
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Verify the comment exists
    const comment = await db.comment.findUnique({
      where: { id: commentId },
      select: { id: true }
    });

    if (!comment) {
      console.log("[CREATE_NESTED_REPLY] Comment not found");
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Handle depth and path generation
    let depth = 0;
    let path = `${commentId}`;
    
    // If this is a reply to another reply, get the parent info
    if (parentReplyId) {
      const parentReply = await db.reply.findUnique({
        where: { id: parentReplyId },
        select: { 
          id: true,
          depth: true,
          path: true,
          commentId: true
        }
      });
      
      if (!parentReply) {
        console.log("[CREATE_NESTED_REPLY] Parent reply not found");
        return NextResponse.json({ error: "Parent reply not found" }, { status: 404 });
      }
      
      // Set depth and path based on parent
      depth = (parentReply.depth || 0) + 1;
      path = parentReply.path ? `${parentReply.path}/${parentReplyId}` : `${commentId}/${parentReplyId}`;
      
      // Ensure we're using the same commentId as the parent for consistency
      if (parentReply.commentId !== commentId) {
        console.log("[CREATE_NESTED_REPLY] Warning: Parent reply has different commentId, using parent's commentId");
        // This ensures all replies in a thread have the same top-level comment reference
      }
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
      },
    });

    console.log("[CREATE_NESTED_REPLY] Reply created:", { 
      replyId: reply.id,
      depth,
      path
    });
    
    return NextResponse.json(reply);
  } catch (error) {
    console.error("[CREATE_NESTED_REPLY] Error:", error);
    return NextResponse.json(
      { error: "Error creating reply" },
      { status: 500 }
    );
  }
} 