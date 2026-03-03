// Emotion Detection API - Simplified
import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    return NextResponse.json({ success: true, emotion: 'neutral' });
  } catch (error) {
    logger.error('[EMOTION_DETECTION] GET Error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    return NextResponse.json({ success: true, message: 'Emotion analyzed' });
  } catch (error) {
    logger.error('[EMOTION_DETECTION] POST Error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
