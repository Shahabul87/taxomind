import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';

export async function PATCH(
  req: Request,
  props: { params: Promise<{ postId: string; commentId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { type } = await req.json();
    const { commentId } = params;

    if (!type || !['like', 'love', 'laugh', 'angry'].includes(type)) {
      return new NextResponse("Invalid reaction type", { status: 400 });
    }

    const comment = await db.comment.findUnique({
      where: { id: commentId },
      select: { 
        id: true,
        reactions: {
          where: { userId: user.id },
          select: { id: true, type: true, userId: true }
        }
      }
    });

    if (!comment) {
      return new NextResponse("Comment not found", { status: 404 });
    }

    // Check if user already reacted
    const existingReaction = comment.reactions.find(r => r.userId === user.id);

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
          userId: user.id,
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

    return NextResponse.json(updatedComment);
  } catch (error: any) {
    logger.error("[COMMENT_REACTION]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}