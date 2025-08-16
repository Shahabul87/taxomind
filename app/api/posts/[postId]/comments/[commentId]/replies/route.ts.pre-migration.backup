import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isRateLimited, getRateLimitMessage } from "@/app/lib/rate-limit";
import { logger } from '@/lib/logger';

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ postId: string; commentId: string }> }
) {
  try {
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

    const { content, parentReplyId } = await req.json();
    const params = await props.params;
    const { postId, commentId } = params;

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Check if comment exists
    const comment = await db.comment.findFirst({
      where: {
        id: commentId,
        postId,
      },
    });

    if (!comment) {

      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
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

        return NextResponse.json({ error: "Parent reply not found" }, { status: 404 });
      }

      // Check nesting depth to prevent excessive depth
      // This is a backup server-side check
      let replyDepth = 1; // Start at 1 for this reply
      let currentParentId = parentReply.parentReplyId;
      
      while (currentParentId && replyDepth <= 10) {
        replyDepth++;
        
        // If we've gone too deep, prevent excessive nesting
        if (replyDepth > 10) { // Hard limit on server side for safety
          return NextResponse.json({ 
            error: "Maximum reply nesting depth exceeded" 
          }, { status: 400 });
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
        userId: user.id,
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

    return NextResponse.json(reply);
  } catch (error) {
    logger.error("[COMMENT_REPLY_POST] Error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal server error" 
    }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  props: { params: Promise<{ postId: string; commentId: string }> }
) {
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

    return NextResponse.json(replies);
  } catch (error) {
    logger.error("[REPLIES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

