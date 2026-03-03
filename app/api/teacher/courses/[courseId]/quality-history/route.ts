import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { safeErrorResponse } from '@/lib/api/safe-error';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { courseId } = await params;

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { userId: true, qualityHistory: true },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    if (course.userId !== user.id) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const history = Array.isArray(course.qualityHistory) ? course.qualityHistory : [];

    return NextResponse.json({ success: true, qualityHistory: history });
  } catch (error) {
    return safeErrorResponse(error, 500, 'QUALITY_HISTORY');
  }
}
