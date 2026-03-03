/**
 * Admin Audit Dashboard API
 * Provides comprehensive audit data for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { auditLogger, AuditEventType, AuditSeverity } from '@/lib/compliance/audit-logger';
import { authAuditHelpers } from '@/lib/audit/auth-audit';
import { withAdminAuth } from '@/lib/api/with-api-auth';
import { safeErrorResponse } from '@/lib/api/safe-error';

export const GET = withAdminAuth(async (request, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const timeWindow = parseInt(searchParams.get('timeWindow') || '24'); // hours
    const dashboardType = searchParams.get('dashboard') || 'overview';

    const startTime = new Date(Date.now() - timeWindow * 60 * 60 * 1000);
    const endTime = new Date();

    let dashboardData;

    switch (dashboardType) {
      case 'overview':
        // Get comprehensive overview
        const [authMetrics, securityAlerts, recentActivities] = await Promise.all([
          authAuditHelpers.getAuthMetrics(timeWindow),
          authAuditHelpers.getSecurityAlerts(timeWindow),
          auditLogger.query({
            startDate: startTime,
            endDate: endTime,
            limit: 50
          })
        ]);

        dashboardData = {
          authMetrics,
          securityAlerts: securityAlerts.slice(0, 10), // Latest 10 alerts
          recentActivities,
          summary: {
            totalAlerts: securityAlerts.length,
            criticalAlerts: securityAlerts.filter(alert => alert.severity === 'CRITICAL').length,
            suspiciousActivities: authMetrics.suspiciousActivities || 0,
            authenticationSuccessRate: parseFloat(authMetrics.successRate || '0'),
          }
        };
        break;

      case 'authentication':
        // Authentication-focused dashboard
        dashboardData = await authAuditHelpers.getAuthMetrics(timeWindow);
        
        // Add more detailed auth data
        const authEvents = await auditLogger.query({
          startDate: startTime,
          endDate: endTime,
          eventType: AuditEventType.USER_LOGIN,
          limit: 100
        });

        dashboardData.detailedAuthEvents = authEvents;
        break;

      case 'security':
        // Security-focused dashboard
        const securityEvents = await auditLogger.query({
          startDate: startTime,
          endDate: endTime,
          severity: AuditSeverity.WARNING,
          minRiskScore: 50,
          limit: 100
        });

        dashboardData = {
          securityEvents,
          alerts: await authAuditHelpers.getSecurityAlerts(timeWindow),
          riskAnalysis: await generateRiskAnalysis(timeWindow),
        };
        break;

      case 'compliance':
        // Generate compliance report
        dashboardData = await auditLogger.generateComplianceReport(
          startTime,
          endTime,
          'SOC2'
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid dashboard type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      dashboard: dashboardType,
      timeWindow: `${timeWindow}h`,
      data: dashboardData,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Audit dashboard API error:', error);
    return safeErrorResponse(error, 500, 'ADMIN_AUDIT_DASHBOARD_GET');
  }
}, {
  rateLimit: { requests: 30, window: 60000 },
  auditLog: true
});

export const POST = withAdminAuth(async (request, context) => {
  try {
    const body = await request.json();
    const { action, params } = body;

    switch (action) {
      case 'archive_logs':
        // Archive old audit logs
        const retentionDays = params?.retentionDays || 2555; // ~7 years default
        const archivedCount = await auditLogger.archiveOldLogs(retentionDays);
        
        return NextResponse.json({
          success: true,
          message: `Archived ${archivedCount} audit logs`,
          archivedCount,
        });

      case 'export_compliance_report':
        // Generate and return compliance report
        const reportType = params?.type || 'SOC2';
        const startDate = new Date(params?.startDate || Date.now() - 30 * 24 * 60 * 60 * 1000);
        const endDate = new Date(params?.endDate || Date.now());
        
        const report = await auditLogger.generateComplianceReport(
          startDate,
          endDate,
          reportType as 'SOC2' | 'GDPR' | 'HIPAA'
        );
        
        return NextResponse.json({
          success: true,
          report,
          exportedAt: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Audit dashboard action error:', error);
    return safeErrorResponse(error, 500, 'ADMIN_AUDIT_DASHBOARD_POST');
  }
}, {
  rateLimit: { requests: 10, window: 60000 },
  auditLog: true
});

/**
 * Generate risk analysis for security dashboard
 */
async function generateRiskAnalysis(timeWindow: number) {
  try {
    const startTime = new Date(Date.now() - timeWindow * 60 * 60 * 1000);
    
    const highRiskEvents = await auditLogger.query({
      startDate: startTime,
      minRiskScore: 70,
      limit: 50
    });

    const riskByType: Record<string, number> = {};
    const riskByUser: Record<string, number> = {};
    
    highRiskEvents.forEach(event => {
      // Count risk by event type
      riskByType[event.eventType] = (riskByType[event.eventType] || 0) + 1;
      
      // Count risk by user
      if (event.userEmail) {
        riskByUser[event.userEmail] = (riskByUser[event.userEmail] || 0) + 1;
      }
    });

    // Sort and get top risks
    const topRiskTypes = Object.entries(riskByType)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }));

    const topRiskUsers = Object.entries(riskByUser)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([email, count]) => ({ email, count }));

    return {
      totalHighRiskEvents: highRiskEvents.length,
      topRiskTypes,
      topRiskUsers,
      averageRiskScore: highRiskEvents.length > 0 
        ? Math.round(highRiskEvents.reduce((sum, event) => sum + (event.riskScore || 0), 0) / highRiskEvents.length)
        : 0,
      timeWindow: `${timeWindow}h`
    };

  } catch (error) {
    console.error('Error generating risk analysis:', error);
    return {
      error: 'Failed to generate risk analysis',
      totalHighRiskEvents: 0,
      topRiskTypes: [],
      topRiskUsers: [],
      averageRiskScore: 0,
      timeWindow: `${timeWindow}h`
    };
  }
}