import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { trackAchievementProgress } from '@/lib/sam-achievement-engine';
import { logger } from '@/lib/logger';

/**
 * POST /api/sam/track-achievement
 * Track achievement progress and award points/badges
 * Server-side only - handles Prisma database operations
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { action, metadata, context } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      );
    }

    // Track achievement progress using server-side function
    const result = await trackAchievementProgress(
      session.user.id,
      action,
      metadata || {},
      context
    );

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
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
