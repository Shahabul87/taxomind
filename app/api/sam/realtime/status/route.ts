/**
 * SAM Realtime Status API Route
 *
 * Provides status information about the SAM realtime server.
 * Used for health checks, monitoring, and debugging.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { getSAMRealtimeServer, isWebSocketEnabled } from '@/lib/sam/realtime';

/**
 * GET /api/sam/realtime/status
 *
 * Returns the current status of the SAM realtime server.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const realtimeServer = getSAMRealtimeServer();
    const stats = await realtimeServer.getStats();

    // Check if current user is online
    const isCurrentUserOnline = await realtimeServer.isUserOnline(session.user.id);
    const currentUserPresence = await realtimeServer.getPresence(session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        server: {
          isRunning: stats.isRunning,
          wsEnabled: isWebSocketEnabled(),
          wsUrl: process.env.NEXT_PUBLIC_WS_URL ?? null,
        },
        stats: {
          onlineUsers: stats.onlineUsers,
          queueSize: stats.dispatcherStats.queueSize,
          deliveredCount: stats.dispatcherStats.deliveredCount,
          failedCount: stats.dispatcherStats.failedCount,
        },
        currentUser: {
          isOnline: isCurrentUserOnline,
          presence: currentUserPresence,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('[SAM_REALTIME_STATUS] Error getting status', {
      error: error instanceof Error ? error.message : 'Unknown',
    });

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get realtime status',
      },
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
