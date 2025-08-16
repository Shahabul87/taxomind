import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { randomUUID } from 'crypto';

// A simplified endpoint specifically for nested reply reactions
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
      logger.error("[NESTED_REPLY_REACTION] Error parsing request:", err);
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
    }

    const { postId, replyId, type } = body;
    
    // Validate required fields
    if (!type) {
      return NextResponse.json({ error: "Reaction type is required" }, { status: 400 });
    }
    
    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }
    
    if (!replyId) {
      return NextResponse.json({ error: "Reply ID is required" }, { status: 400 });
    }

    // First, try to find the reply with just ID
    let reply = await db.reply.findUnique({
      where: {
        id: replyId,
      },
    });

    if (!reply) {

      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    // Debug info

    // Process the reaction in a transaction
    const result = await db.$transaction(async (tx) => {
      // Check for existing reaction
      const existingReaction = await tx.reaction.findFirst({
        where: {
          userId: user.id,
          replyId,
          type,
        },
      });

      if (existingReaction) {
        // Remove existing reaction (toggle off)

        await tx.reaction.delete({
          where: {
            id: existingReaction.id,
          },
        });
      } else {
        // Remove any existing reactions by this user on this reply
        const deleted = await tx.reaction.deleteMany({
          where: {
            userId: user.id,
            replyId,
          },
        });

        // Create new reaction
        const newReaction = await tx.reaction.create({
          data: {
            id: randomUUID(),
            type,
            replyId,
            updatedAt: new Date(),
            user: {
              connect: {
                id: user.id
              }
            }
          },
        });

      }

      // Get updated reply with reactions
      const updatedReply = await tx.reply.findUnique({
        where: {
          id: replyId,
        },
        include: {
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

      return updatedReply;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    logger.error("[NESTED_REPLY_REACTION] Error:", error);
    return NextResponse.json(
      { error: "Error processing reaction" },
      { status: 500 }
    );
  }
} 