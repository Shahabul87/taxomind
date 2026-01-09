/**
 * Gamification Preferences API
 * GET /api/gamification/preferences - Get user preferences
 * PATCH /api/gamification/preferences - Update user preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import {
  getGamificationPreferences,
  updateGamificationPreferences,
} from '@/lib/gamification';
import { logger } from '@/lib/logger';

// ==========================================
// Validation Schemas
// ==========================================

const UpdatePreferencesSchema = z.object({
  achievementNotifications: z.boolean().optional(),
  levelUpNotifications: z.boolean().optional(),
  streakReminders: z.boolean().optional(),
  leaderboardUpdates: z.boolean().optional(),
  showOnLeaderboard: z.boolean().optional(),
  showAchievements: z.boolean().optional(),
  showLevel: z.boolean().optional(),
  showStreak: z.boolean().optional(),
  pinnedAchievements: z.array(z.string()).optional(),
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
// GET - Fetch Preferences
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
    const preferences = await getGamificationPreferences(userId);

    const response: ApiResponse<typeof preferences> = {
      success: true,
      data: preferences,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: request.headers.get('x-request-id') || crypto.randomUUID(),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    logger.error('[PREFERENCES_GET] Unexpected error:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Unable to load preferences',
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// ==========================================
// PATCH - Update Preferences
// ==========================================

export async function PATCH(request: NextRequest) {
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
    const validatedData = UpdatePreferencesSchema.parse(body);

    // Update preferences
    const updatedPreferences = await updateGamificationPreferences(userId, validatedData);

    const response: ApiResponse<typeof updatedPreferences> = {
      success: true,
      data: updatedPreferences,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: request.headers.get('x-request-id') || crypto.randomUUID(),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('[PREFERENCES_PATCH] Validation error:', { error: error.errors });
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid preferences data',
          details: { errors: error.errors },
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    logger.error('[PREFERENCES_PATCH] Unexpected error:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Unable to update preferences',
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
