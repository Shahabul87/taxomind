import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { currentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    const body = await req.json().catch(() => ({}));
    const event = {
      eventName: body?.eventName || 'unknown',
      properties: body?.properties || {},
      timestamp: body?.timestamp || new Date().toISOString(),
      userId: user?.id,
      organizationId: (user as any)?.organizationId,
      url: req.headers.get('referer') || undefined,
    };

    logger.info('Analytics event', event);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('POST /api/analytics failed', { error: error?.message });
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

