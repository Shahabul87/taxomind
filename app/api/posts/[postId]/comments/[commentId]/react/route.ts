import { NextRequest } from "next/server";
import { withAuth, type APIAuthContext, createSuccessResponse, createErrorResponse, ApiError } from "@/lib/api";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';

export const PATCH = withAuth(async (
  request: NextRequest, 
  context: APIAuthContext,
  props?: any
) => {
  const params = await props.params;
  try {

    const { type } = await request.json();
    const { commentId } = params;

    if (!type || !['like', 'love', 'laugh', 'angry'].includes(type)) {
      return createErrorResponse(ApiError.badRequest("Invalid reaction type"));
    }

    const comment = await db.comment.findUnique({
      where: { id: commentId },
      select: { 
        id: true,
        reactions: {
          where: { userId: context.user.id },
          select: { id: true, type: true, userId: true }
        }
      }
    });

    if (!comment) {
      return createErrorResponse(ApiError.notFound("Comment not found"));
    }

    // Check if user already reacted
    const existingReaction = comment.reactions.find(r => r.userId === context.user.id);

    if (existingReaction) {
      if (existingReaction.type === type) {
        // Remove existing reaction of same type (toggle off)
        await db.reaction.delete({
          where: { id: existingReaction.id }
        });
      } else {
        // Update existing reaction to new type
        await db.reaction.update({
          where: { id: existingReaction.id },
          data: { type, updatedAt: new Date() }
        });
      }
    } else {
      // Create new reaction
      await db.reaction.create({
        data: {
          id: randomUUID(),
          type,
          userId: context.user.id,
          commentId,
          updatedAt: new Date(),
        }
      });
    }

    // Get updated comment with reactions
    const updatedComment = await db.comment.findUnique({
      where: { id: commentId },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              }
            }
          }
        }
      }
    });

    return createSuccessResponse(updatedComment);
  } catch (error) {
    logger.error("[COMMENT_REACTION]", error);
    return createErrorResponse(ApiError.internal("Internal Error"));
  }
});