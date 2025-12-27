import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAchievementEngine } from '@/lib/adapters/achievement-adapter';
import { logger } from '@/lib/logger';

/**
 * POST /api/sam/track-achievement
 * Track achievement progress and award points/badges
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, metadata, context } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      );
    }

    const result = await getAchievementEngine().trackProgress(
      session.user.id,
      action,
      metadata ?? {},
      context
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error('Error in track-achievement API:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        pointsAwarded: 0,
        achievementsUnlocked: [],
        challengesCompleted: [],
      },
      { status: 500 }
    );
  }
}
