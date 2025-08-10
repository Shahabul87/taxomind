import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { auditLogger } from '@/lib/compliance/audit-logger';
import { AuditEventType, AuditSeverity } from '@/lib/compliance/audit-logger';

export async function GET(req: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      // Log unauthorized access attempt
      await auditLogger.log(
        AuditEventType.ACCESS_DENIED,
        AuditSeverity.WARNING,
        'Unauthorized SOC2 report access attempt',
        {
          userId: session?.user?.id,
          userEmail: session?.user?.email || undefined,
        }
      );
      
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const reportType = searchParams.get('type') as 'SOC2' | 'GDPR' | 'HIPAA' || 'SOC2';

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    // Log report generation
    await auditLogger.log(
      AuditEventType.DATA_EXPORT,
      AuditSeverity.INFO,
      `${reportType} compliance report generated`,
      {
        userId: session.user.id,
        userEmail: session.user.email || undefined,
        userRole: session.user.role,
      },
      {
        resourceType: 'compliance-report',
        dataClassification: 'CONFIDENTIAL',
        complianceFlags: [reportType],
      }
    );

    // Generate the compliance report
    const report = await auditLogger.generateComplianceReport(
      new Date(startDate),
      new Date(endDate),
      reportType
    );

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('SOC2 report generation error:', error);
    
    // Log the error
    await auditLogger.log(
      AuditEventType.SECURITY_ALERT,
      AuditSeverity.ERROR,
      'SOC2 report generation failed',
      {},
      {
        reason: error instanceof Error ? error.message : 'Unknown error',
      }
    );

    return NextResponse.json(
      { error: 'Failed to generate compliance report' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'archive':
        // Archive old audit logs
        const retentionDays = body.retentionDays || 2555; // 7 years default
        const archivedCount = await auditLogger.archiveOldLogs(retentionDays);
        
        return NextResponse.json({
          success: true,
          message: `Archived ${archivedCount} audit logs`,
        });

      case 'query':
        // Query audit logs with filters
        const logs = await auditLogger.query(body.filters || {});
        
        return NextResponse.json({
          success: true,
          logs,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('SOC2 API error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}