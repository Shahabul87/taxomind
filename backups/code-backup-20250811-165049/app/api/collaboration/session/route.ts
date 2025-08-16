import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const courseId = searchParams.get("courseId");
    const chapterId = searchParams.get("chapterId");
    const sectionId = searchParams.get("sectionId");

    if (!courseId || !chapterId || !sectionId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Check if user is enrolled in the course
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id!,
          courseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    // Find existing active collaboration session
    const existingSession = await db.collaborationSession.findFirst({
      where: {
        courseId,
        chapterId,
        contentId: sectionId, // Using contentId for section
        isActive: true,
      },
      include: {
        CollaborationParticipant: {
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
    });

    if (existingSession) {
      // Join existing session if not already a participant
      const isParticipant = existingSession.CollaborationParticipant?.some(
        (p) => p.userId === session.user.id
      ) || false;

      if (!isParticipant) {
        await db.collaborationParticipant.create({
          data: {
            sessionId: existingSession.id,
            userId: session.user.id!,
            role: "student",
            joinedAt: new Date(),
          },
        });
      }

      // Update last activity
      await db.collaborationParticipant.updateMany({
        where: {
          sessionId: existingSession.id,
          userId: session.user.id!,
        },
        data: {
          lastActivity: new Date(),
        },
      });

      return NextResponse.json({
        session: existingSession,
        participants: existingSession.CollaborationParticipant?.map((p) => ({
          id: p.user.id,
          name: p.user.name,
          avatar: p.user.image,
          status: p.isActive ? "online" : "offline",
          role: p.role,
          joinedAt: p.joinedAt,
          lastActivity: p.lastActivity,
          contributions: p.contributions,
        })) || [],
      });
    }

    return NextResponse.json({
      session: null,
      participants: [],
    });
  } catch (error) {
    logger.error("Error fetching collaboration session:", error);
    return NextResponse.json(
      { error: "Failed to fetch collaboration session" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { courseId, chapterId, sectionId, title, sessionType } = body;

    if (!courseId || !chapterId || !sectionId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Check if user is enrolled in the course
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id!,
          courseId,
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    // Create new collaboration session
    const collaborationSession = await db.collaborationSession.create({
      data: {
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        contentId: sectionId,
        contentType: "SECTION",
        participants: [],
        activeParticipants: [],
        courseId,
        chapterId,
        initiatorId: session.user.id!,
        isActive: true,
        sessionType: sessionType || "study-group",
        sessionData: {
          title: title || `Study Session - Section ${sectionId}`,
          description: `Collaborative learning session for section ${sectionId}`,
          maxParticipants: 20,
          isPublic: true,
        },
      },
    });

    // Add host as first participant
    await db.collaborationParticipant.create({
      data: {
        sessionId: collaborationSession.id,
        userId: session.user.id!,
        role: "student",
        joinedAt: new Date(),
      },
    });

    return NextResponse.json(collaborationSession);
  } catch (error) {
    logger.error("Error creating collaboration session:", error);
    return NextResponse.json(
      { error: "Failed to create collaboration session" },
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
    const { sessionId, action, data } = body;

    if (!sessionId || !action) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Verify user is participant in the session
    const participant = await db.collaborationParticipant.findFirst({
      where: {
        sessionId,
        userId: session.user.id!,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Not a participant in this session" },
        { status: 403 }
      );
    }

    switch (action) {
      case "update-media-status":
        await db.collaborationParticipant.update({
          where: {
            id: participant.id,
          },
          data: {
            lastActivity: new Date(),
          },
        });
        break;

      case "update-activity":
        await db.collaborationParticipant.update({
          where: {
            id: participant.id,
          },
          data: {
            lastActivity: new Date(),
          },
        });
        break;

      case "leave-session":
        await db.collaborationParticipant.delete({
          where: {
            id: participant.id,
          },
        });
        
        // Check if session should be deactivated (no more participants)
        const remainingParticipants = await db.collaborationParticipant.count({
          where: {
            sessionId,
          },
        });

        if (remainingParticipants === 0) {
          await db.collaborationSession.update({
            where: {
              id: sessionId,
            },
            data: {
              isActive: false,
              endedAt: new Date(),
            },
          });
        }
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error updating collaboration session:", error);
    return NextResponse.json(
      { error: "Failed to update collaboration session" },
      { status: 500 }
    );
  }
}