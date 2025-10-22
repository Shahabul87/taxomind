import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

interface RouteParams {
  params: Promise<{ courseId: string; questionId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Login required' } }, { status: 401 });
    }
    const { courseId, questionId } = await params;
    const body = await request.json().catch(() => ({}));
    const reason: string | undefined = typeof body?.reason === 'string' ? body.reason.slice(0, 500) : undefined;

    // Verify question exists
    const question = await db.courseQuestion.findFirst({ where: { id: questionId, courseId } });
    if (!question) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Question not found' } }, { status: 404 });
    }

    try {
      const reportClient = (db as any).questionReport;
      if (reportClient && typeof reportClient.create === 'function') {
        await reportClient.create({
          data: { questionId, userId: user.id, reason: reason || null },
        });
      }
    } catch {}
    return NextResponse.json({ success: true, data: { reported: true } });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to report question' } }, { status: 500 });
  }
}
