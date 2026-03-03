import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { adminAuth } from '@/auth.admin';
import { devOnlyGuard } from '@/lib/api/dev-only-guard';

// Admin-only route to check database connectivity and counts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  // Require admin authentication
  const adminSession = await adminAuth();
  if (!adminSession?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get counts of various tables (no sample data exposed)
    const counts = {
      courses: await db.course.count(),
      blogs: await db.blog.count(),
      users: await db.user.count(),
      chapters: await db.chapter.count()
    };

    return NextResponse.json({
      connected: true,
      counts,
    });
  } catch (error) {
    logger.error('Database check error:', error);

    return NextResponse.json(
      {
        connected: false,
        error: 'Database check failed',
      },
      { status: 500 }
    );
  }
}