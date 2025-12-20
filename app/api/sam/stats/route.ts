import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserSAMStats } from '@/lib/sam/utils/sam-database';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId') || undefined;

    const stats = await getUserSAMStats(session.user.id, courseId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error fetching SAM stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SAM stats' },
      { status: 500 }
    );
  }
}