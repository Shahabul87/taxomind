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
    const collaborationSession = await db.collaborationSession.findUnique({
      where: { sessionId },
    });

    if (!collaborationSession) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Check if user is in participants JSON array
    const participants = collaborationSession.participants as any[];
    const isParticipant = participants?.some(
      (p: any) => p.userId === session.user.id || p.id === session.user.id
    );

    if (!isParticipant) {
      return NextResponse.json(
        { error: "Not a participant in this session" },
        { status: 403 }
      );
    }

    // Create chat message (mock implementation - table doesn't exist)
    const chatMessage = {
      id: `msg_${Date.now()}`,
      sessionId,
      userId: session.user.id,
      content: message.content,
      type: message.type || "text",
      isPrivate: message.isPrivate || false,
      replyToId: message.replyTo || null,
      createdAt: new Date(),
      user: {
        id: session.user.id,
        name: session.user.name,
        image: session.user.image,
      },
      replyTo: null,
    };
    
    // TODO: Store in collaboration session metadata or create message table

    // TODO: Update participant activity in collaboration session
    // Need to update the participants JSON in collaborationSession

    return NextResponse.json({
      id: chatMessage.id,
      userId: chatMessage.user.id,
      userName: chatMessage.user.name,
      userAvatar: chatMessage.user.image,
      content: chatMessage.content,
      type: chatMessage.type,
      timestamp: chatMessage.createdAt,
      isPrivate: chatMessage.isPrivate,
      replyTo: null, // Mock implementation - no reply support yet
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
    const collaborationSession = await db.collaborationSession.findUnique({
      where: { sessionId },
    });

    if (!collaborationSession) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Check if user is in participants JSON array
    const participants = collaborationSession.participants as any[];
    const isParticipant = participants?.some(
      (p: any) => p.userId === session.user.id || p.id === session.user.id
    );

    if (!isParticipant) {
      return NextResponse.json(
        { error: "Not a participant in this session" },
        { status: 403 }
      );
    }

    // Get chat messages (mock implementation - table doesn't exist)
    const messages: any[] = [];
    
    // TODO: Implement message retrieval
    /* await db.collaborationMessage.findMany({
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
    }); */

    const formattedMessages = messages; // Return empty array for now

    return NextResponse.json(formattedMessages);
  } catch (error) {
    logger.error("Error fetching collaboration messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}