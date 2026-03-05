import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { adminAuth } from '@/auth.admin';
import { devOnlyGuard } from '@/lib/api/dev-only-guard';
import { currentUser } from '@/lib/auth';

// Admin-only route to check database connectivity and counts
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const blocked = devOnlyGuard();
    if (blocked) return blocked;

    // Require user authentication
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Require admin role
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Require admin authentication
    const adminSession = await adminAuth();
    if (!adminSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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