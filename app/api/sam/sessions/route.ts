/**
 * Teacher Session Monitoring API — Session List
 *
 * GET: List SAM sessions for students enrolled in the teacher's courses.
 * Requires ADMIN or teacher (isTeacher) role.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { getStudentSessions } from '@/lib/sam/stores/prisma-session-stores';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check teacher/admin role
    const user = session.user as { id: string; role?: string; isTeacher?: boolean };
    const isTeacher = user.isTeacher === true || user.role === 'ADMIN' || user.role === 'SUPERADMIN';

    if (!isTeacher) {
      return NextResponse.json(
        { error: 'Forbidden: Teacher or admin role required' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId') ?? undefined;
    const cursor = searchParams.get('cursor') ?? undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50);

    const result = await getStudentSessions(user.id, {
      courseId,
      cursor,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: result.sessions,
      meta: {
        total: result.total,
        cursor: result.cursor,
        hasMore: !!result.cursor,
      },
    });
  } catch (error) {
    logger.error('[SAM Sessions] List failed', { error });
    return NextResponse.json(
      { error: 'Failed to fetch student sessions' },
      { status: 500 },
    );
  }
}
