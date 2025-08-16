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
    const { sessionId, room } = body;

    if (!sessionId || !room) {
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

    // TODO: Create breakout room (BreakoutRoom model needs to be added to schema)
    // const breakoutRoom = await db.breakoutRoom.create({
    //   data: {
    //     sessionId,
    //     name: room.name,
    //     topic: room.topic,
    //     timeLimit: room.timeLimit,
    //     createdBy: session.user.id,
    //     isActive: true,
    //   },
    // });

    // For now, create a temporary response until BreakoutRoom model is added
    const breakoutRoom = {
      id: `temp_${Date.now()}`,
      name: room.name,
      topic: room.topic,
      timeLimit: room.timeLimit,
    };

    return NextResponse.json({
      id: breakoutRoom.id,
      name: breakoutRoom.name,
      topic: breakoutRoom.topic,
      timeLimit: breakoutRoom.timeLimit,
      participants: [],
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error creating breakout room:", error);
    return NextResponse.json(
      { error: "Failed to create breakout room" },
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

    // TODO: Get breakout rooms for this session
    // Need to add BreakoutRoom model to schema
    const formattedRooms: any[] = [];

    return NextResponse.json(formattedRooms);
  } catch (error) {
    logger.error("Error fetching breakout rooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch breakout rooms" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { roomId, action } = body;

    if (!roomId || !action) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // TODO: Implement breakout room actions
    // Need to add BreakoutRoom and BreakoutRoomParticipant models to schema
    
    switch (action) {
      case "join":
      case "leave":
      case "close":
        // Mock success for now
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error updating breakout room:", error);
    return NextResponse.json(
      { error: "Failed to update breakout room" },
      { status: 500 }
    );
  }
}