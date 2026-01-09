/**
 * Leaderboard API
 * GET /api/gamification/leaderboard - Get leaderboard data
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { getLeaderboard } from '@/lib/gamification';
import { LeaderboardPeriod } from '@/types/gamification';
import { logger } from '@/lib/logger';

// ==========================================
// API Response Interface
// ==========================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
  };
}

// ==========================================
// GET - Fetch Leaderboard
// ==========================================

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      };
      return NextResponse.json(response, { status: 401 });
    }

    const userId = user.id;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const periodParam = searchParams.get('period') || 'WEEKLY';
    const period = periodParam as LeaderboardPeriod;
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate period
    if (!Object.values(LeaderboardPeriod).includes(period)) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'INVALID_PERIOD',
          message: 'Invalid leaderboard period',
          details: { validPeriods: Object.values(LeaderboardPeriod) },
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Fetch leaderboard data
    const leaderboardData = await getLeaderboard(period, {
      limit,
      offset,
      userId,
    });

    const response: ApiResponse<typeof leaderboardData> = {
      success: true,
      data: leaderboardData,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: request.headers.get('x-request-id') || crypto.randomUUID(),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('[LEADERBOARD_GET] Validation error:', { error: error.errors });
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request parameters',
          details: { errors: error.errors },
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    logger.error('[LEADERBOARD_GET] Unexpected error:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Unable to load leaderboard',
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
