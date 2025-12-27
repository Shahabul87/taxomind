import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAchievementEngine } from '@/lib/adapters/achievement-adapter';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const summary = await getAchievementEngine().getSummary(session.user.id);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error('Error fetching gamification stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gamification stats' },
      { status: 500 }
    );
  }
}
