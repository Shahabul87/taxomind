/**
 * Teacher Session Monitoring API — Session Messages
 *
 * GET: Read-only access to student SAM conversation messages.
 * Auth check: teacher must be course instructor for the student.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import {
  isTeacherOfStudent,
  getSessionMessages,
} from '@/lib/sam/stores/prisma-session-stores';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as { id: string; role?: string; isTeacher?: boolean };
    const isTeacher = user.isTeacher === true || user.role === 'ADMIN' || user.role === 'SUPERADMIN';

    if (!isTeacher) {
      return NextResponse.json(
        { error: 'Forbidden: Teacher or admin role required' },
        { status: 403 },
      );
    }

    const { sessionId } = await params;

    // Look up the session to get the student ID
    const samSession = await db.sAMAgenticSession.findUnique({
      where: { id: sessionId },
      select: { userId: true, topicName: true, startTime: true },
    });

    if (!samSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify the teacher has access to this student's data
    const hasAccess = await isTeacherOfStudent(user.id, samSession.userId);

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: You do not instruct a course this student is enrolled in' },
        { status: 403 },
      );
    }

    const messages = await getSessionMessages(sessionId);

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        studentId: samSession.userId,
        topicName: samSession.topicName,
        startTime: samSession.startTime.toISOString(),
        messages,
        messageCount: messages.length,
      },
    });
  } catch (error) {
    logger.error('[SAM Sessions] Message read failed', { error });
    return NextResponse.json(
      { error: 'Failed to fetch session messages' },
      { status: 500 },
    );
  }
}
