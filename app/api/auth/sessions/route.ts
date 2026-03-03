import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { getActiveSessions, terminateAllSessions } from '@/lib/auth/session-limiter';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

/**
 * GET /api/auth/sessions
 * List all active sessions for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(req, 'standard');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sessions = await getActiveSessions(session.user.id);

    return NextResponse.json({
      success: true,
      sessions: sessions.map((s) => ({
        id: s.id,
        deviceId: s.deviceId,
        deviceName: s.deviceName ?? 'Unknown Device',
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        lastActivity: s.lastActivity.toISOString(),
        createdAt: s.createdAt.toISOString(),
        isTrusted: s.isTrustedDevice,
        riskLevel: s.riskLevel,
      })),
      total: sessions.length,
    });
  } catch (error) {
    console.error('[Sessions API] Error getting sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get sessions' },
      { status: 500 }
    );
  }
}

// Request body schema for DELETE
const DeleteSessionsSchema = z.object({
  keepCurrent: z.boolean().default(false),
  currentDeviceId: z.string().optional(),
});

/**
 * DELETE /api/auth/sessions
 * Logout all devices (except current if keepCurrent=true)
 */
export async function DELETE(req: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(req, 'standard');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    let body: { keepCurrent?: boolean; currentDeviceId?: string } = {};
    try {
      const rawBody = await req.json();
      const parsed = DeleteSessionsSchema.safeParse(rawBody);
      if (parsed.success) {
        body = parsed.data;
      }
    } catch {
      // Empty body is allowed - will terminate all sessions
    }

    const { keepCurrent, currentDeviceId } = body;

    const result = await terminateAllSessions(
      session.user.id,
      keepCurrent ? currentDeviceId : undefined
    );

    return NextResponse.json({
      success: true,
      terminatedCount: result.terminatedCount,
      message: `Logged out of ${result.terminatedCount} device(s)`,
    });
  } catch (error) {
    console.error('[Sessions API] Error terminating sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to logout devices' },
      { status: 500 }
    );
  }
}
