import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, type APIAuthContext, createSuccessResponse, createErrorResponse, ApiError } from "@/lib/api";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';
import { invalidateCache } from "@/app/lib/cache";

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

const UpdateReplySchema = z.object({
  content: z.string().min(1, 'Content is required').max(10000, 'Content too long').trim(),
});

interface ReplyItemParams {
  params: Promise<{ postId: string; commentId: string; replyId: string }>;
}

// PATCH endpoint for updating a reply
export const PATCH = withAuth(async (
  request: NextRequest,
  context: APIAuthContext,
  props: ReplyItemParams
) => {
  try {
    const { postId, commentId, replyId } = await props.params;
    const body = await request.json().catch(() => ({}));
    const validation = UpdateReplySchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.errors[0]?.message || 'Invalid input';
      return createErrorResponse(ApiError.badRequest(errorMessage));
    }

    // Verify reply exists and belongs to the user
    const reply = await db.reply.findFirst({
      where: { id: replyId, commentId, postId, userId: context.user.id },
      select: { id: true },
    });

    if (!reply) {
      return createErrorResponse(ApiError.notFound('Reply not found'));
    }

    const updated = await db.reply.update({
      where: { id: replyId },
      data: {
        content: validation.data.content,
        updatedAt: new Date(),
      },
      include: {
        User: { select: { id: true, name: true, image: true } },
        Reaction: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    await invalidateCache(`comments:${postId}:*`);
    logger.info('[REPLY_PATCH] Reply updated', { replyId, commentId, postId });

    return createSuccessResponse(updated, 200);
  } catch (error) {
    logger.error('[REPLY_PATCH]', error);
    return createErrorResponse(ApiError.internal('Internal server error'));
  }
});

// DELETE endpoint for deleting a reply and its descendants
export const DELETE = withAuth(async (
  request: NextRequest,
  context: APIAuthContext,
  props: ReplyItemParams
) => {
  try {
    const { postId, commentId, replyId } = await props.params;

    // Verify reply exists and belongs to the user
    const reply = await db.reply.findFirst({
      where: { id: replyId, commentId, postId, userId: context.user.id },
      select: { id: true },
    });

    if (!reply) {
      return createErrorResponse(ApiError.notFound('Reply not found'));
    }

    // Recursively collect all descendant reply IDs
    const collectDescendantIds = async (parentId: string): Promise<string[]> => {
      const children = await db.reply.findMany({
        where: { parentReplyId: parentId },
        select: { id: true },
      });
      const childIds = children.map((c) => c.id);
      const grandchildIds = await Promise.all(childIds.map(collectDescendantIds));
      return [...childIds, ...grandchildIds.flat()];
    };

    const descendantIds = await collectDescendantIds(replyId);
    const allReplyIds = [replyId, ...descendantIds];

    await db.$transaction(async (tx) => {
      // Delete all reactions on this reply and its descendants
      await tx.reaction.deleteMany({
        where: { replyId: { in: allReplyIds } },
      });
      // Delete descendant replies
      if (descendantIds.length > 0) {
        await tx.reply.deleteMany({
          where: { id: { in: descendantIds } },
        });
      }
      // Delete the reply itself
      await tx.reply.delete({
        where: { id: replyId },
      });
    });

    await invalidateCache(`comments:${postId}:*`);
    logger.info('[REPLY_DELETE] Reply deleted', {
      replyId, commentId, postId, descendantCount: descendantIds.length,
    });

    return createSuccessResponse({ success: true }, 200);
  } catch (error) {
    logger.error('[REPLY_DELETE]', error);
    return createErrorResponse(ApiError.internal('Internal server error'));
  }
});