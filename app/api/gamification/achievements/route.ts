/**
 * Achievements API
 * GET /api/gamification/achievements - Get user achievements
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { getUserAchievements, getAllAchievements } from '@/lib/gamification';
import { AchievementCategory } from '@/types/gamification';
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
// GET - Fetch User Achievements
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
    const unlockedOnly = searchParams.get('unlockedOnly') === 'true';
    const categoryParam = searchParams.get('category');
    const category = categoryParam as AchievementCategory | undefined;

    // Fetch user achievements
    const userAchievements = await getUserAchievements(userId, {
      unlockedOnly,
      category,
    });

    // Also fetch all available achievements for showing locked ones
    const allAchievements = await getAllAchievements();

    // Calculate stats
    const stats = {
      totalUnlocked: userAchievements.filter((a) => a.isUnlocked).length,
      totalAvailable: allAchievements.length,
      byCategory: Object.values(AchievementCategory).reduce(
        (acc, cat) => {
          const catAchievements = userAchievements.filter(
            (a) => a.achievement?.category === cat
          );
          acc[cat] = {
            unlocked: catAchievements.filter((a) => a.isUnlocked).length,
            total: allAchievements.filter((a) => a.category === cat).length,
          };
          return acc;
        },
        {} as Record<string, { unlocked: number; total: number }>
      ),
      byRarity: {
        COMMON: userAchievements.filter(
          (a) => a.isUnlocked && a.achievement?.rarity === 'COMMON'
        ).length,
        UNCOMMON: userAchievements.filter(
          (a) => a.isUnlocked && a.achievement?.rarity === 'UNCOMMON'
        ).length,
        RARE: userAchievements.filter(
          (a) => a.isUnlocked && a.achievement?.rarity === 'RARE'
        ).length,
        EPIC: userAchievements.filter(
          (a) => a.isUnlocked && a.achievement?.rarity === 'EPIC'
        ).length,
        LEGENDARY: userAchievements.filter(
          (a) => a.isUnlocked && a.achievement?.rarity === 'LEGENDARY'
        ).length,
      },
    };

    const response: ApiResponse<{
      achievements: typeof userAchievements;
      allAchievements: typeof allAchievements;
      stats: typeof stats;
    }> = {
      success: true,
      data: {
        achievements: userAchievements,
        allAchievements,
        stats,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: request.headers.get('x-request-id') || crypto.randomUUID(),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('[ACHIEVEMENTS_GET] Validation error:', { error: error.errors });
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

    logger.error('[ACHIEVEMENTS_GET] Unexpected error:', error);
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Unable to load achievements',
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
