import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

interface RouteParams { params: Promise<{ courseId: string; reportId: string }>; }

// DELETE: Dismiss a report (instructor only)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await currentUser();
    if (!user?.id) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Login required' } }, { status: 401 });
    const { courseId, reportId } = await params;

    // Ensure report belongs to course and user is instructor
    let report: any = null;
    try {
      const reportClient = (db as any).questionReport;
      if (reportClient && typeof reportClient.findUnique === 'function') {
        report = await reportClient.findUnique({
          where: { id: reportId },
          include: { question: { select: { courseId: true } } },
        });
      }
    } catch {}
    if (!report || report.question.courseId !== courseId) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Report not found' } }, { status: 404 });
    }
    const course = await db.course.findUnique({ where: { id: courseId }, select: { userId: true } });
    if (!course || course.userId !== user.id) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Instructor only' } }, { status: 403 });
    }

    try {
      const reportClient = (db as any).questionReport;
      if (reportClient && typeof reportClient.delete === 'function') {
        await reportClient.delete({ where: { id: reportId } });
      }
    } catch {}
    return NextResponse.json({ success: true, data: { dismissed: true } });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to dismiss report' } }, { status: 500 });
  }
}
