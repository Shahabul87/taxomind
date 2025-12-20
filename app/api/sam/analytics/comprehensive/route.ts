import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getComprehensiveAnalytics } from '@/lib/sam-engines/advanced/sam-analytics-engine';
import { logger } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId') || undefined;
    const range = searchParams.get('range') || '30d';
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (range) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    const analytics = await getComprehensiveAnalytics(session.user.id, {
      courseId,
      dateRange: { start: startDate, end: endDate },
    });

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error('Error fetching comprehensive analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}