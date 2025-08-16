import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

export async function PATCH(req: NextRequest) {

  try {
    // Get current user
    const user = await currentUser();
    if (!user) {

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (err) {
      logger.error("[UPDATE_NESTED_REPLY] Error parsing request:", err);
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
    }

    // Get URL parameters
    const url = new URL(req.url);
    const postId = url.searchParams.get('postId');
    const commentId = url.searchParams.get('commentId');
    const replyId = url.searchParams.get('replyId');
    const { content } = body;

    // Validate required fields
    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }
    
    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }
    
    if (!replyId) {
      return NextResponse.json({ error: "Reply ID is required" }, { status: 400 });
    }

    // First verify the post exists
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true }
    });

    if (!post) {

      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // First, try to find the reply with minimal constraints
    let reply = await db.reply.findFirst({
      where: {
        id: replyId,
        userId: user.id, // Must belong to current user
      },
    });

    if (!reply) {

      // For debugging - check if reply exists at all
      const anyReply = await db.reply.findUnique({
        where: { id: replyId },
        select: { 
          id: true, 
          userId: true, 
          postId: true,
          commentId: true,
          parentReplyId: true
        }
      });
      
      if (!anyReply) {

        return NextResponse.json({ error: "Reply not found" }, { status: 404 });
      }
      
      if (anyReply.userId !== user.id) {

        return NextResponse.json({ error: "You don't have permission to update this reply" }, { status: 403 });
      }

      // If we get here, the reply exists but didn't match our query
      // Since we've verified user ownership, we can proceed with the update
      reply = anyReply;
    }

    // Update the reply
    const updatedReply = await db.reply.update({
      where: {
        id: replyId,
      },
      data: {
        content,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(updatedReply);
  } catch (error) {
    logger.error("[UPDATE_NESTED_REPLY] Error:", error);
    return NextResponse.json(
      { error: "Error updating reply" },
      { status: 500 }
    );
  }
} 