import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Minimal error logging endpoint used by client error boundaries.
// Accepts arbitrary JSON and logs at error level.

export async function POST(request: Request) {
  try {
    const data = await request.json().catch(() => ({}));

    // Attach basic request context (redacted)
    const context = {
      message: data?.message || 'Client error reported',
      digest: data?.digest,
      page: data?.page,
      timestamp: data?.timestamp,
      userAgent: request.headers.get('user-agent') || undefined,
    };

    logger.error('Client error report', context);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to log client error', error);
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }
}

export const dynamic = 'force-dynamic';
