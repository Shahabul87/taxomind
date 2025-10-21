import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - List all active sessions for the current user
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch all active sessions for this user
    const sessions = await db.activeSession.findMany({
      where: {
        userId: user.id,
        expiresAt: {
          gt: new Date(), // Only get non-expired sessions
        },
      },
      orderBy: {
        lastActive: 'desc',
      },
    });

    // Transform sessions into frontend-friendly format
    const formattedSessions = sessions.map((session) => ({
      id: session.id,
      deviceName: session.deviceName || 'Unknown Device',
      deviceType: session.deviceType || 'desktop',
      browser: session.browser || 'Unknown Browser',
      os: session.os || 'Unknown OS',
      ipAddress: session.ipAddress,
      location: session.location || 'Unknown Location',
      lastActive: session.lastActive,
      createdAt: session.createdAt,
      isCurrent: session.sessionToken === req.cookies.get('next-auth.session-token')?.value,
    }));

    return NextResponse.json({
      success: true,
      data: formattedSessions,
      metadata: {
        timestamp: new Date().toISOString(),
        count: formattedSessions.length,
      },
    });

  } catch (error) {
    console.error("Session fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch sessions",
      },
      { status: 500 }
    );
  }
}

// DELETE - Logout all other sessions (keep only current session)
export async function DELETE(req: NextRequest) {
  try {
    // Authenticate user
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get current session token
    const currentSessionToken = req.cookies.get('next-auth.session-token')?.value;

    if (!currentSessionToken) {
      return NextResponse.json(
        { success: false, error: "No active session found" },
        { status: 400 }
      );
    }

    // Delete all sessions except the current one
    const deleteResult = await db.activeSession.deleteMany({
      where: {
        userId: user.id,
        sessionToken: {
          not: currentSessionToken,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: deleteResult.count,
        message: `Successfully logged out of ${deleteResult.count} other session(s)`,
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error("Session deletion error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete sessions",
      },
      { status: 500 }
    );
  }
}
