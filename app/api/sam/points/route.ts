import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { awardSAMPoints } from '@/lib/sam/utils/sam-database';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { points, reason, source, courseId, chapterId, sectionId } = body;

    if (!points || !reason || !source) {
      return NextResponse.json(
        { error: 'Missing required fields: points, reason, source' },
        { status: 400 }
      );
    }

    const result = await awardSAMPoints(session.user.id, {
      points,
      reason,
      source,
      courseId,
      chapterId,
      sectionId,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error awarding SAM points:', error);
    return NextResponse.json(
      { error: 'Failed to award SAM points' },
      { status: 500 }
    );
  }
}