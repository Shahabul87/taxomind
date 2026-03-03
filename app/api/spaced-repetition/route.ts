// Spaced Repetition API - Simplified
import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    return NextResponse.json({ success: true, schedule: [] });
  } catch (error) {
    logger.error('[SPACED_REPETITION] GET Error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    return NextResponse.json({ success: true, message: 'Schedule updated' });
  } catch (error) {
    logger.error('[SPACED_REPETITION] POST Error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
