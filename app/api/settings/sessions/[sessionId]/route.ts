import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { safeErrorResponse } from '@/lib/api/safe-error';

// DELETE - Logout a specific session
export async function DELETE(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    // Authenticate user
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { sessionId } = params;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Verify the session belongs to the current user
    const session = await db.activeSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    if (session.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized to delete this session" },
        { status: 403 }
      );
    }

    // Check if this is the current session (Auth.js v5 uses 'authjs' prefix)
    const currentSessionToken = req.cookies.get('authjs.session-token')?.value ||
                                req.cookies.get('__Secure-authjs.session-token')?.value;
    const isDeletingCurrentSession = session.sessionToken === currentSessionToken;

    if (isDeletingCurrentSession) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete your current session. Please use logout instead."
        },
        { status: 400 }
      );
    }

    // Delete the session
    await db.activeSession.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: "Session successfully terminated",
        sessionId: sessionId,
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error("Session deletion error:", error);
    return safeErrorResponse(error, 500, 'SESSION_DELETE');
  }
}
