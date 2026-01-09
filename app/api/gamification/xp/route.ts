/**
 * XP Management API
 * GET /api/gamification/xp - Get user XP data
 * POST /api/gamification/xp - Award XP to user
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { getUserXP, awardXP, updateStreak } from '@/lib/gamification';
import { XPSource } from '@/types/gamification';
import { logger } from '@/lib/logger';

// ==========================================
// Validation Schemas
// ==========================================

const AwardXPSchema = z.object({
  amount: z.number().int().positive().max(10000),
  source: z.nativeEnum(XPSource),
  sourceId: z.string().optional(),
  description: z.string().min(1).max(500),
  metadata: z.record(z.unknown()).optional(),
});

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
// GET - Fetch User XP
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
    const userXP = await getUserXP(userId);

    // Also update streak on activity
    const streakResult = await updateStreak(userId);

    const response: ApiResponse<{ xp: typeof userXP; streak: typeof streakResult }> = {
      success: true,
      data: {
        xp: userXP,
        streak: streakResult,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: request.headers.get('x-request-id') || crypto.randomUUID(),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    logger.error('[XP_GET] Unexpected error:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Unable to load XP data',
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// ==========================================
// POST - Award XP
// ==========================================

export async function POST(request: NextRequest) {
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
    const body = await request.json();

    // Validate input
    const validatedData = AwardXPSchema.parse(body);

    // Award XP
    const result = await awardXP({
      userId,
      ...validatedData,
    });

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: request.headers.get('x-request-id') || crypto.randomUUID(),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('[XP_POST] Validation error:', { error: error.errors });
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid XP award request',
          details: { errors: error.errors },
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    logger.error('[XP_POST] Unexpected error:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Unable to award XP',
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
