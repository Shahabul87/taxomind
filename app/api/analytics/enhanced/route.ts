import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { adminAuth } from '@/auth.admin';
import { logger } from '@/lib/logger';

// Enhanced analytics endpoint with comprehensive data
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');
    const view = searchParams.get('view') || 'student';

    // Check admin access - admins can view any user's data
    const adminSession = await adminAuth();
    const isAdmin = !!adminSession?.user;

    // Simple permission check - users can only access their own data unless admin
    if (!isAdmin && userId && userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Return basic analytics data for now
    const analyticsData = {
      user: {
        id: session.user.id,
        isAdmin,
        email: session.user.email,
      },
      request: {
        userId,
        courseId,
        view,
        timestamp: new Date().toISOString(),
      },
      analytics: {
        message: 'Analytics data would be processed here',
        status: 'success',
      },
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    logger.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}