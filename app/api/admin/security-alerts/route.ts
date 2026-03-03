/**
 * Admin Security Alerts API
 * Provides real-time security alerts and authentication metrics for administrators
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { AdminRole } from '@prisma/client';
import { authAuditHelpers } from '@/lib/audit/auth-audit';
import { withAdminAuth } from '@/lib/api/with-api-auth';
import { safeErrorResponse } from '@/lib/api/safe-error';

export const GET = withAdminAuth(async (request, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const timeWindow = parseInt(searchParams.get('timeWindow') || '24'); // hours
    const alertType = searchParams.get('type') || 'all';

    // Get security alerts based on type
    let alerts;
    if (alertType === 'metrics') {
      alerts = await authAuditHelpers.getAuthMetrics(timeWindow);
    } else {
      alerts = await authAuditHelpers.getSecurityAlerts(timeWindow);
    }

    return NextResponse.json({
      success: true,
      data: alerts,
      timeWindow: `${timeWindow}h`,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Security alerts API error:', error);
    return safeErrorResponse(error, 500, 'ADMIN_SECURITY_ALERTS_GET');
  }
}, {
  rateLimit: { requests: 30, window: 60000 },
  auditLog: true
});

export const POST = withAdminAuth(async (request, context) => {
  try {
    const body = await request.json();
    const { action, targetUserId, targetEmail, reason } = body;

    switch (action) {
      case 'force_logout':
        // Log forced logout (implementation would depend on session management)
        await authAuditHelpers.logSignOut(targetUserId, targetEmail, true);
        return NextResponse.json({
          success: true,
          message: `Forced logout logged for user ${targetEmail}`,
        });

      case 'mark_suspicious':
        // Mark user as suspicious
        await authAuditHelpers.logSuspiciousActivity(
          targetUserId,
          targetEmail,
          'ADMIN_MARKED_SUSPICIOUS',
          reason || 'Marked as suspicious by admin'
        );
        return NextResponse.json({
          success: true,
          message: `User ${targetEmail} marked as suspicious`,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Security action API error:', error);
    return safeErrorResponse(error, 500, 'ADMIN_SECURITY_ALERTS_POST');
  }
}, {
  rateLimit: { requests: 10, window: 60000 },
  auditLog: true
});