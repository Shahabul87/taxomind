import { NextRequest, NextResponse } from "next/server";
import { withAuth, type APIAuthContext, createSuccessResponse, createErrorResponse, ApiError } from "@/lib/api";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';

// POST endpoint for adding a reply to an existing reply
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ postId: string; commentId: string; replyId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return createSuccessResponse({ error: "Unauthorized" }, 401);
    }

    const { content } = await req.json();
    const params = await props.params;
    const { postId, commentId, replyId } = params;

    if (!content) {
      return createSuccessResponse({ error: "Content is required" }, 400);
    }

    // Check if the parent comment exists
    const comment = await db.comment.findFirst({
      where: {
        id: commentId,
        postId,
      },
    });

    if (!comment) {
      return createSuccessResponse({ error: "Parent comment not found" }, 404);
    }

    // Check if the parent reply exists and belongs to the comment
    const parentReply = await db.reply.findFirst({
      where: {
        id: replyId,
        commentId,
        postId,
      },
    });

    if (!parentReply) {
      return createSuccessResponse({ error: "Parent reply not found" }, 404);
    }

    // Create new reply with parentReplyId set
    const newReply = await db.reply.create({
      data: {
        id: randomUUID(),
        content,
        userId: user.id!,
        postId,
        commentId,
        parentReplyId: replyId, // Set the parent reply ID
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

    return createSuccessResponse(newReply, 201);
  } catch (error) {
    logger.error("[REPLY_TO_REPLY_POST]", error);
    return createSuccessResponse({ error: "Internal server error" }, 500);
  }
} 