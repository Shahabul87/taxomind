/**
 * SAM Telemetry API
 * Exposes agentic metrics and system health snapshots.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { getSAMTelemetryService } from '@/lib/sam/telemetry';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

const querySchema = z.object({
  hours: z.coerce.number().int().min(1).max(168).optional().default(24),
  summary: z.coerce.boolean().optional().default(false),
  health: z.coerce.boolean().optional().default(false),
});

export async function GET(req: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(req, 'standard');
    if (rateLimitResponse) return rateLimitResponse;

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      hours: searchParams.get('hours') ?? undefined,
      summary: searchParams.get('summary') ?? undefined,
      health: searchParams.get('health') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const telemetry = getSAMTelemetryService();
    telemetry.start();

    if (parsed.data.health) {
      const health = await telemetry.getSystemHealth();
      return NextResponse.json({ success: true, data: { health } });
    }

    if (parsed.data.summary) {
      const summary = await telemetry.getQuickSummary();
      return NextResponse.json({ success: true, data: { summary } });
    }

    const metrics = await telemetry.getMetrics(parsed.data.hours);
    return NextResponse.json({ success: true, data: { metrics } });
  } catch (error) {
    logger.error('Error fetching telemetry metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch telemetry metrics' },
      { status: 500 }
    );
  }
}
