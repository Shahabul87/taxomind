/**
 * Session Cleanup Cron Job
 *
 * Cleans up expired sessions and old login attempts.
 * Should be scheduled to run hourly.
 *
 * Configuration (vercel.json):
 * {
 *   "crons": [
 *     {
 *       "path": "/api/cron/session-cleanup",
 *       "schedule": "0 * * * *"
 *     }
 *   ]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredSessions, getCleanupStats } from '@/lib/auth/session-cleanup';
import { withCronAuth } from '@/lib/api/cron-auth';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * GET /api/cron/session-cleanup
 * Run session cleanup job
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify authorization (fail-closed)
    const authResponse = withCronAuth(req);
    if (authResponse) return authResponse;

    // Check if dry run is requested
    const { searchParams } = new URL(req.url);
    const dryRun = searchParams.get('dry_run') === 'true';

    if (dryRun) {
      // Return stats without performing cleanup
      const stats = await getCleanupStats();
      return NextResponse.json({
        success: true,
        dryRun: true,
        data: {
          ...stats,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Perform cleanup
    const result = await cleanupExpiredSessions();

    const durationMs = Date.now() - startTime;

    console.log('[SESSION_CLEANUP_CRON] Cleanup completed:', {
      ...result,
      durationMs,
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionsDeleted: result.sessionsDeleted,
        loginAttemptsDeleted: result.loginAttemptsDeleted,
        errors: result.errors.length > 0 ? result.errors : undefined,
        durationMs,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[SESSION_CLEANUP_CRON] Error running cleanup:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run session cleanup',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
