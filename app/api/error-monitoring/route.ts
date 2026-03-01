import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { currentUser } from '@/lib/auth';

const ErrorReportSchema = z.object({
  message: z.string().max(5000).default('Unknown error'),
  stack: z.string().max(10000).optional(),
  componentStack: z.string().max(10000).optional(),
  level: z.enum(['error', 'warning', 'critical']).default('error'),
  errorId: z.string().max(100).optional(),
  timestamp: z.string().optional(),
  userAgent: z.string().max(500).optional(),
  url: z.string().max(2000).optional(),
  context: z.record(z.unknown()).optional(),
  retryCount: z.number().int().min(0).max(10).optional(),
  sessionId: z.string().max(100).optional(),
});

export async function POST(request: NextRequest) {
  // Rate limit by IP (allows unauthenticated error reports but prevents abuse)
  const rateLimitResponse = await withRateLimit(request, 'standard');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const parsed = ErrorReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid error report data' },
        { status: 400 }
      );
    }

    const errorData = parsed.data;

    // Resolve userId from session, not from client payload
    const user = await currentUser();
    const resolvedUserId = user?.id ?? null;

    const errorId = errorData.errorId ?? `err_${Date.now()}`;

    await db.auditLog.create({
      data: {
        userId: resolvedUserId,
        action: 'CREATE',
        entityType: 'ERROR',
        entityId: errorId,
        entityName: errorData.message.slice(0, 200),
        changes: {
          message: errorData.message,
          level: errorData.level,
          timestamp: errorData.timestamp ? new Date(errorData.timestamp) : new Date(),
          url: errorData.url,
          context: errorData.context,
          metadata: {
            retryCount: errorData.retryCount ?? 0,
            sessionId: errorData.sessionId,
            buildVersion: process.env.BUILD_VERSION || 'unknown'
          }
        },
        severity: errorData.level === 'critical' ? 'CRITICAL' : 'ERROR',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: errorData.userAgent?.slice(0, 500),
        tags: ['error', 'monitoring']
      }
    });

    // Create alert for critical errors
    if (errorData.level === 'critical' && resolvedUserId) {
      await db.progress_alerts.create({
        data: {
          id: `alert_${errorId}`,
          userId: resolvedUserId,
          alertType: 'AT_RISK',
          severity: 'CRITICAL',
          message: `Critical error: ${errorData.message.slice(0, 200)}`,
          aiSuggestion: 'Please investigate this critical error immediately.',
          actionRequired: true,
          metadata: {
            errorId,
            url: errorData.url,
          }
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[ERROR_MONITORING]', error);
    return NextResponse.json(
      { error: 'Failed to log error' },
      { status: 500 }
    );
  }
}
