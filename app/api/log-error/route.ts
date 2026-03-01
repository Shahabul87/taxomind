import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

const LogErrorSchema = z.object({
  message: z.string().max(5000).optional(),
  digest: z.string().max(200).optional(),
  page: z.string().max(500).optional(),
  timestamp: z.union([z.string(), z.number()]).optional(),
});

export async function POST(request: NextRequest) {
  const rateLimitResponse = await withRateLimit(request, 'standard');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const data = await request.json().catch(() => ({}));

    const parsed = LogErrorSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    const context = {
      message: parsed.data.message || 'Client error reported',
      digest: parsed.data.digest,
      page: parsed.data.page,
      timestamp: parsed.data.timestamp,
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
