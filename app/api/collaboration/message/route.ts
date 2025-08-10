import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId, message } = body;

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Verify user is participant in the session
    const participant = await db.collaborationParticipant.findFirst({
      where: {
        sessionId,
        userId: session.user.id,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Not a participant in this session" },
        { status: 403 }
      );
    }

    // Create chat message
    const chatMessage = await db.collaborationMessage.create({
      data: {
        sessionId,
        userId: session.user.id,
        content: message.content,
        type: message.type || "text",
        isPrivate: message.isPrivate || false,
        replyToId: message.replyTo || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        replyTo: {
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

    // Update participant activity
    await db.collaborationParticipant.update({
      where: {
        id: participant.id,
      },
      data: {
        lastActivity: new Date(),
      },
    });

    return NextResponse.json({
      id: chatMessage.id,
      userId: chatMessage.user.id,
      userName: chatMessage.user.name,
      userAvatar: chatMessage.user.image,
      content: chatMessage.content,
      type: chatMessage.type,
      timestamp: chatMessage.createdAt,
      isPrivate: chatMessage.isPrivate,
      replyTo: chatMessage.replyTo ? {
        id: chatMessage.replyTo.id,
        userName: chatMessage.replyTo.user.name,
        content: chatMessage.replyTo.content,
      } : null,
    });
  } catch (error) {
    logger.error("Error sending collaboration message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const sessionId = searchParams.get("sessionId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session ID" },
        { status: 400 }
      );
    }

    // Verify user is participant in the session
    const participant = await db.collaborationParticipant.findFirst({
      where: {
        sessionId,
        userId: session.user.id,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Not a participant in this session" },
        { status: 403 }
      );
    }

    // Get chat messages
    const messages = await db.collaborationMessage.findMany({
      where: {
        sessionId,
        OR: [
          { isPrivate: false },
          { userId: session.user.id },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        replyTo: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        reactions: {
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
        createdAt: "asc",
      },
      skip: offset,
      take: limit,
    });

    const formattedMessages = messages.map((message) => ({
      id: message.id,
      userId: message.user.id,
      userName: message.user.name,
      userAvatar: message.user.image,
      content: message.content,
      type: message.type,
      timestamp: message.createdAt,
      isPrivate: message.isPrivate,
      replyTo: message.replyTo ? {
        id: message.replyTo.id,
        userName: message.replyTo.user.name,
        content: message.replyTo.content,
      } : null,
      reactions: message.reactions.reduce((acc, reaction) => {
        const existing = acc.find((r) => r.emoji === reaction.emoji);
        if (existing) {
          existing.users.push(reaction.user.id);
        } else {
          acc.push({
            emoji: reaction.emoji,
            users: [reaction.user.id],
          });
        }
        return acc;
      }, [] as { emoji: string; users: string[] }[]),
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    logger.error("Error fetching collaboration messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}