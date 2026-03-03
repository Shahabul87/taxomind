import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

interface RouteParams { params: Promise<{ courseId: string }>; }

// GET: List reports for a course (instructor only)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await currentUser();
    if (!user?.id) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Login required' } }, { status: 401 });
    const { courseId } = await params;
    const course = await db.course.findUnique({ where: { id: courseId }, select: { userId: true } });
    if (!course || course.userId !== user.id) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Instructor only' } }, { status: 403 });
    }

    let reports: any[] = [];
    try {
      const reportClient = (db as any).questionReport;
      if (reportClient && typeof reportClient.findMany === 'function') {
        reports = await reportClient.findMany({
          where: { question: { courseId } },
          take: 100,
          orderBy: { createdAt: 'desc' },
          include: {
            question: { select: { id: true, title: true, userId: true } },
            user: { select: { id: true, name: true, image: true } },
          },
        });
      }
    } catch {}

    return NextResponse.json({ success: true, data: { reports } });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to load reports' } }, { status: 500 });
  }
}
