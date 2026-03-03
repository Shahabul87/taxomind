import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { terminateSession } from '@/lib/auth/session-limiter';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

interface RouteParams {
  params: Promise<{
    sessionId: string;
  }>;
}

/**
 * DELETE /api/auth/sessions/[sessionId]
 * Revoke a specific session
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
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

    // In Next.js 15, params is a Promise
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID required' },
        { status: 400 }
      );
    }

    const success = await terminateSession(sessionId, session.user.id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Session not found or already revoked' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session revoked successfully',
    });
  } catch (error) {
    logger.error('[Sessions API] Error revoking session', error);
    return NextResponse.json(
      { success: false, error: 'Failed to revoke session' },
      { status: 500 }
    );
  }
}
