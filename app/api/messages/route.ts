import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schemas
const SendMessageSchema = z.object({
  recipientId: z.string(),
  content: z.string().min(1).max(2000),
});

const MarkReadSchema = z.object({
  messageId: z.string(),
});

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build where clause
    const where = {
      OR: [
        { recipientId: session.user.id },
        { senderId: session.user.id },
      ],
    };

    const messages = await db.message.findMany({
      where,
      include: {
        User_Message_senderIdToUser: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
        User_Message_recipientIdToUser: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    return NextResponse.json(messages);
  } catch (error) {
    logger.error("[MESSAGES_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = SendMessageSchema.parse(body);

    const message = await db.message.create({
      data: {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: validatedData.content,
        senderId: session.user.id,
        recipientId: validatedData.recipientId,
      },
      include: {
        User_Message_senderIdToUser: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
        User_Message_recipientIdToUser: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    logger.error("[MESSAGE_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = MarkReadSchema.parse(body);

    const message = await db.message.update({
      where: {
        id: validatedData.messageId,
        recipientId: session.user.id,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }
    logger.error("[MESSAGE_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}