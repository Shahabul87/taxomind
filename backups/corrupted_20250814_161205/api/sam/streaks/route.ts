import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { updateSAMStreak } from '@/lib/sam-database';
import { logger } from '@/lib/logger';


export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { streakType, currentStreak, longestStreak, courseId } = body;

    if (!streakType || currentStreak === undefined || longestStreak === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: streakType, currentStreak, longestStreak' },
        { status: 400 }
      );
    }

    const result = await updateSAMStreak(session.user.id, {
      streakType,
      currentStreak,
      longestStreak,
      courseId,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Error updating SAM streak:', error);
    return NextResponse.json(
      { error: 'Failed to update SAM streak' },
      { status: 500 }
    );
  }
}