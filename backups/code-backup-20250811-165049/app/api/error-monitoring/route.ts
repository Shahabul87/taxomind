import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json();
    
    // Log to database using auditLog
    await db.auditLog.create({
      data: {
        userId: errorData.userId !== 'anonymous' ? errorData.userId : null,
        action: 'CREATE',
        entityType: 'ERROR',
        entityId: errorData.errorId,
        entityName: errorData.message,
        changes: {
          message: errorData.message,
          stack: errorData.stack,
          componentStack: errorData.componentStack,
          level: errorData.level || 'error',
          timestamp: new Date(errorData.timestamp),
          userAgent: errorData.userAgent,
          url: errorData.url,
          context: errorData.context,
          metadata: {
            retryCount: errorData.retryCount || 0,
            sessionId: errorData.sessionId,
            buildVersion: process.env.BUILD_VERSION || 'unknown'
          }
        },
        severity: errorData.level === 'critical' ? 'CRITICAL' : 'ERROR',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: errorData.userAgent,
        tags: ['error', 'monitoring']
      }
    });

    // Create alert for critical errors using progress_alerts
    if (errorData.level === 'critical') {
      await db.progress_alerts.create({
        data: {
          id: `alert_${errorData.errorId}`,
          userId: errorData.userId !== 'anonymous' ? errorData.userId : null,
          alertType: 'AT_RISK',
          severity: 'CRITICAL',
          message: `Critical error: ${errorData.message}`,
          aiSuggestion: 'Please investigate this critical error immediately.',
          actionRequired: true,
          metadata: {
            errorId: errorData.errorId,
            url: errorData.url,
            userId: errorData.userId
          }
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error logging failed:', error);
    return NextResponse.json(
      { error: 'Failed to log error' },
      { status: 500 }
    );
  }
}