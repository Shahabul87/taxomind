/**
 * Gamification Dashboard API
 * GET /api/gamification - Returns complete gamification dashboard data
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { getGamificationDashboard } from '@/lib/gamification';
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
// GET - Fetch Gamification Dashboard
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

    // Fetch complete gamification dashboard data
    const dashboardData = await getGamificationDashboard(userId);

    const response: ApiResponse<typeof dashboardData> = {
      success: true,
      data: dashboardData,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: request.headers.get('x-request-id') || crypto.randomUUID(),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('[GAMIFICATION_GET] Validation error:', { error: error.errors });
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid data structure',
          details: { errors: error.errors },
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    logger.error('[GAMIFICATION_GET] Unexpected error:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Unable to load gamification data',
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
