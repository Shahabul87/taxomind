import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSAMBadges } from '@/lib/sam/utils/sam-database';
import { TEACHER_ACHIEVEMENTS } from '@/lib/sam/utils/sam-achievements';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const badges = await getSAMBadges(session.user.id);
    
    // Map badges to achievement format
    const achievements = badges.map(badge => {
      const achievementDef = TEACHER_ACHIEVEMENTS.find(a => a.id === badge.description);
      
      return {
        id: badge.description,
        name: achievementDef?.name || 'Unknown Achievement',
        description: achievementDef?.description || badge.description,
        icon: achievementDef?.icon || '🏆',
        level: badge.level,
        unlockedAt: badge.earnedAt,
        points: achievementDef?.points || 0,
      };
    });

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