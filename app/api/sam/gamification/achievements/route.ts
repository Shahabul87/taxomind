import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSAMBadges } from '@/lib/sam/utils/sam-database';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const badges = await getSAMBadges(session.user.id);
    
    const achievements = badges.map((badge) => ({
      id: badge.id,
      name: badge.name ?? badge.badgeType,
      description: badge.description ?? badge.badgeType,
      icon: badge.iconUrl ?? '🏆',
      level: badge.level,
      unlockedAt: badge.earnedAt,
      points: badge.pointsRequired ?? 0,
    }));

    return NextResponse.json({
      success: true,
      data: achievements,
    });
  } catch (error) {
    logger.error('Error fetching achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}
