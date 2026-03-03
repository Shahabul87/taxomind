import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { getMonitoringStats, checkRedirectSafety } from '@/lib/monitoring/middleware-monitor';
import { logger } from '@/lib/logger';

/**
 * API endpoint to get redirect monitoring statistics
 * Only accessible by admin users
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await currentUser();

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Admin access required'
          }
        },
        { status: 401 }
      );
    }

    // Get monitoring statistics
    const stats = await getMonitoringStats();
    const safeToRemove = await checkRedirectSafety();

    return NextResponse.json({
      success: true,
      data: {
        stats,
        safeToRemove,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        version: '1.0.0',
      },
    });
  } catch (error) {
    logger.error('Failed to get redirect stats', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve monitoring statistics',
        },
      },
      { status: 500 }
    );
  }
}