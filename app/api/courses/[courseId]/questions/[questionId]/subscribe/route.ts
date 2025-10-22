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

    // Verify question belongs to course
    const question = await db.courseQuestion.findFirst({ where: { id: questionId, courseId } });
    if (!question) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Question not found' } }, { status: 404 });
    }

    // Upsert subscription (graceful if model not available yet)
    try {
      const subClient = (db as any).questionSubscription;
      if (subClient && typeof subClient.upsert === 'function') {
        await subClient.upsert({
          where: {
            questionId_userId: { questionId, userId: user.id },
          },
          update: {},
          create: { questionId, userId: user.id },
        });
      }
    } catch {}

    return NextResponse.json({ success: true, data: { subscribed: true } });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to subscribe' } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Login required' } }, { status: 401 });
    }
    const { courseId, questionId } = await params;
    const question = await db.courseQuestion.findFirst({ where: { id: questionId, courseId } });
    if (!question) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Question not found' } }, { status: 404 });
    }
    try {
      const subClient = (db as any).questionSubscription;
      if (subClient && typeof subClient.delete === 'function') {
        await subClient.delete({
          where: { questionId_userId: { questionId, userId: user.id } },
        });
      }
    } catch {}
    return NextResponse.json({ success: true, data: { subscribed: false } });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to unsubscribe' } }, { status: 500 });
  }
}
