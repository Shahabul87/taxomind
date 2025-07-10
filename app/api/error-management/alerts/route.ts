import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { withErrorHandling } from '@/lib/error-handling/api-error-handler';
import { errorMonitoring } from '@/lib/error-handling/error-monitoring';

export const runtime = 'nodejs';

// GET /api/error-management/alerts - Get active alerts
export const GET = withErrorHandling(async (request: Request) => {
  const user = await currentUser();
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  const url = new URL(request.url);
  const searchParams = url.searchParams;
  
  const acknowledged = searchParams.get('acknowledged');
  const resolved = searchParams.get('resolved');
  const type = searchParams.get('type');
  const severity = searchParams.get('severity');

  const where: any = {};
  
  if (acknowledged !== null) {
    where.acknowledged = acknowledged === 'true';
  }
  
  if (resolved !== null) {
    where.resolvedAt = resolved === 'true' ? { not: null } : null;
  }
  
  if (type) {
    where.type = type;
  }
  
  if (severity) {
    where.severity = severity;
  }

  const alerts = await db.errorAlert.findMany({
    where,
    include: {
      error: {
        select: {
          id: true,
          message: true,
          component: true,
          errorType: true,
          severity: true,
          timestamp: true,
          url: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    },
    orderBy: {
      timestamp: 'desc'
    },
    take: 100
  });

  const formattedAlerts = alerts.map(alert => ({
    id: alert.id,
    errorId: alert.errorId,
    type: alert.type,
    message: alert.message,
    severity: alert.severity,
    timestamp: alert.timestamp,
    acknowledged: alert.acknowledged,
    acknowledgedBy: alert.acknowledgedBy,
    acknowledgedAt: alert.acknowledgedAt,
    resolvedAt: alert.resolvedAt,
    metadata: alert.metadata ? JSON.parse(alert.metadata) : null,
    error: alert.error,
    createdAt: alert.createdAt,
    updatedAt: alert.updatedAt
  }));

  return {
    alerts: formattedAlerts,
    summary: {
      total: alerts.length,
      acknowledged: alerts.filter(a => a.acknowledged).length,
      resolved: alerts.filter(a => a.resolvedAt).length,
      critical: alerts.filter(a => a.severity === 'CRITICAL').length,
      high: alerts.filter(a => a.severity === 'HIGH').length
    }
  };
});

// POST /api/error-management/alerts - Create manual alert
export const POST = withErrorHandling(async (request: Request) => {
  const user = await currentUser();
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  const body = await request.json();
  const { message, type, severity, metadata } = body;

  if (!message || !type || !severity) {
    throw new Error('Message, type, and severity are required');
  }

  // Create a system error log for the manual alert
  const errorLog = await db.errorLog.create({
    data: {
      message,
      errorType: 'UNKNOWN',
      severity,
      component: 'ManualAlert',
      userId: user.id,
      metadata: JSON.stringify({
        ...metadata,
        manualAlert: true,
        createdBy: user.id
      }),
      resolved: false
    }
  });

  // Create the alert
  const alert = await db.errorAlert.create({
    data: {
      errorId: errorLog.id,
      type,
      message,
      severity,
      metadata: JSON.stringify(metadata)
    }
  });

  return {
    alert: {
      id: alert.id,
      errorId: alert.errorId,
      type: alert.type,
      message: alert.message,
      severity: alert.severity,
      timestamp: alert.timestamp,
      acknowledged: alert.acknowledged,
      metadata: alert.metadata ? JSON.parse(alert.metadata) : null
    }
  };
});