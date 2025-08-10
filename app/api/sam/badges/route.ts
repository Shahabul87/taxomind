import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { unlockSAMBadge } from '@/lib/sam-database';
import { SAMBadgeType, BadgeLevel } from '@prisma/client';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { badgeType, level, description, requirements, courseId, chapterId } = body;

    if (!badgeType || !level || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: badgeType, level, description' },
        { status: 400 }
      );
    }

    const result = await unlockSAMBadge(session.user.id, {
      badgeType: badgeType as SAMBadgeType,
      level: level as BadgeLevel,
      description,
      requirements: requirements || {},
      courseId,
      chapterId,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error unlocking SAM badge:', error);
    return NextResponse.json(
      { error: 'Failed to unlock SAM badge' },
      { status: 500 }
    );
  }
}