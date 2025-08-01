import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

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

    // Create breakout room
    const breakoutRoom = await db.breakoutRoom.create({
      data: {
        sessionId,
        name: room.name,
        topic: room.topic,
        timeLimit: room.timeLimit,
        createdBy: session.user.id,
        isActive: true,
      },
    });

    return NextResponse.json({
      id: breakoutRoom.id,
      name: breakoutRoom.name,
      topic: breakoutRoom.topic,
      timeLimit: breakoutRoom.timeLimit,
      participants: [],
      createdAt: breakoutRoom.createdAt,
    });
  } catch (error) {
    console.error("Error creating breakout room:", error);
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

    // Get breakout rooms for this session
    const breakoutRooms = await db.breakoutRoom.findMany({
      where: {
        sessionId,
        isActive: true,
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const formattedRooms = breakoutRooms.map((room) => ({
      id: room.id,
      name: room.name,
      topic: room.topic,
      timeLimit: room.timeLimit,
      createdAt: room.createdAt,
      participants: room.participants.map((p) => ({
        id: p.user.id,
        name: p.user.name,
        avatar: p.user.image,
        status: "online",
        role: "student",
        joinedAt: p.joinedAt,
        lastActivity: new Date(),
        isVideoEnabled: false,
        isAudioEnabled: false,
        isScreenSharing: false,
      })),
    }));

    return NextResponse.json(formattedRooms);
  } catch (error) {
    console.error("Error fetching breakout rooms:", error);
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

    const breakoutRoom = await db.breakoutRoom.findUnique({
      where: { id: roomId },
      include: { session: true },
    });

    if (!breakoutRoom) {
      return NextResponse.json(
        { error: "Breakout room not found" },
        { status: 404 }
      );
    }

    // Verify user is participant in the main session
    const participant = await db.collaborationParticipant.findFirst({
      where: {
        sessionId: breakoutRoom.sessionId,
        userId: session.user.id,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Not a participant in this session" },
        { status: 403 }
      );
    }

    switch (action) {
      case "join":
        // Remove user from other breakout rooms first
        await db.breakoutRoomParticipant.deleteMany({
          where: {
            userId: session.user.id,
            room: {
              sessionId: breakoutRoom.sessionId,
            },
          },
        });

        // Add user to this room
        await db.breakoutRoomParticipant.create({
          data: {
            roomId,
            userId: session.user.id,
            joinedAt: new Date(),
          },
        });
        break;

      case "leave":
        await db.breakoutRoomParticipant.deleteMany({
          where: {
            roomId,
            userId: session.user.id,
          },
        });
        break;

      case "close":
        // Only room creator or session host can close
        if (breakoutRoom.createdBy !== session.user.id && 
            breakoutRoom.session.hostId !== session.user.id) {
          return NextResponse.json(
            { error: "Not authorized to close this room" },
            { status: 403 }
          );
        }

        await db.breakoutRoom.update({
          where: { id: roomId },
          data: { isActive: false },
        });

        // Remove all participants
        await db.breakoutRoomParticipant.deleteMany({
          where: { roomId },
        });
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating breakout room:", error);
    return NextResponse.json(
      { error: "Failed to update breakout room" },
      { status: 500 }
    );
  }
}