import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { withAuth, withAdminAuth, withOwnership, withPublicAPI } from '@/lib/api/with-api-auth';

// Validation schemas
const complianceQuerySchema = z.object({
  organizationId: z.string().optional(),
  eventType: z.enum(['DATA_ACCESS', 'DATA_EXPORT', 'DATA_DELETION', 'POLICY_VIOLATION', 'SECURITY_INCIDENT', 'AUDIT_REQUIREMENT']).optional(),
  framework: z.enum(['GDPR', 'CCPA', 'FERPA', 'HIPAA', 'SOX', 'COPPA', 'CUSTOM']).optional(),
  status: z.enum(['COMPLIANT', 'NON_COMPLIANT', 'UNDER_REVIEW', 'PENDING_ACTION', 'RESOLVED']).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const recordComplianceEventSchema = z.object({
  organizationId: z.string().optional(),
  eventType: z.enum(['DATA_ACCESS', 'DATA_EXPORT', 'DATA_DELETION', 'POLICY_VIOLATION', 'SECURITY_INCIDENT', 'AUDIT_REQUIREMENT']),
  complianceFramework: z.enum(['GDPR', 'CCPA', 'FERPA', 'HIPAA', 'SOX', 'COPPA', 'CUSTOM']),
  status: z.enum(['COMPLIANT', 'NON_COMPLIANT', 'UNDER_REVIEW', 'PENDING_ACTION', 'RESOLVED']).default('UNDER_REVIEW'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('LOW'),
  details: z.object({}).passthrough(),
  affectedUsers: z.array(z.string()).optional(),
  affectedContent: z.array(z.string()).optional(),
  actionTaken: z.string().optional(),
});

// GET /api/enterprise/compliance - Get compliance events
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    // For demo purposes, allow access if no session (development mode)
    if (!session?.user) {
      // Return mock data for development
      return NextResponse.json({
        success: true,
        data: {
          events: [
            {
              id: "compliance-1",
              eventType: "DATA_ACCESS",
              complianceFramework: "GDPR",
              status: "COMPLIANT",
              severity: "LOW",
              details: { description: "User data access logged" },
              createdAt: new Date().toISOString(),
              organization: { id: "demo-org-1", name: "Acme Corporation", slug: "acme-corp" }
            },
            {
              id: "compliance-2",
              eventType: "DATA_EXPORT",
              complianceFramework: "CCPA",
              status: "UNDER_REVIEW",
              severity: "MEDIUM",
              details: { description: "Data export request pending review" },
              createdAt: new Date().toISOString(),
              organization: { id: "demo-org-2", name: "Tech University", slug: "tech-university" }
            }
          ],
          summary: {
            totalEvents: 2,
            statusBreakdown: [
              { status: "COMPLIANT", count: 1 },
              { status: "UNDER_REVIEW", count: 1 }
            ],
            severityBreakdown: [
              { severity: "LOW", count: 1 },
              { severity: "MEDIUM", count: 1 }
            ],
            frameworkBreakdown: [
              { framework: "GDPR", count: 1 },
              { framework: "CCPA", count: 1 }
            ],
            recentCritical: [],
            complianceScore: 85
          }
        }
      });
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = {
      organizationId: searchParams.get('organizationId') || undefined,
      eventType: searchParams.get('eventType') || undefined,
      framework: searchParams.get('framework') || undefined,
      status: searchParams.get('status') || undefined,
      severity: searchParams.get('severity') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    };

    const validatedQuery = complianceQuerySchema.parse(queryParams);

    // Build date range
    const endDate = validatedQuery.endDate ? new Date(validatedQuery.endDate) : new Date();
    const startDate = validatedQuery.startDate ? new Date(validatedQuery.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Build where clause
    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (validatedQuery.organizationId) {
      where.organizationId = validatedQuery.organizationId;
    }

    if (validatedQuery.eventType) {
      where.eventType = validatedQuery.eventType;
    }

    if (validatedQuery.framework) {
      where.complianceFramework = validatedQuery.framework;
    }

    if (validatedQuery.status) {
      where.status = validatedQuery.status;
    }

    if (validatedQuery.severity) {
      where.severity = validatedQuery.severity;
    }

    // Fetch compliance events
    const [events, summary] = await Promise.all([
      db.complianceEvent.findMany({
        where,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
      getComplianceSummary(where),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        events,
        summary,
        query: validatedQuery,
        totalRecords: events.length,
      },
    });

  } catch (error: any) {
    logger.error('Error fetching compliance events:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch compliance events' },
export const POST = withAdminAuth(async (request, context) => {
  
}, {
  rateLimit: { requests: 15, window: 60000 },
  auditLog: true
});
    );
  }
}

// POST /api/enterprise/compliance - Record compliance event
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = recordComplianceEventSchema.parse(body);

    // Create compliance event
    const complianceEvent = await db.complianceEvent.create({
      data: validatedData,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Create audit log entry
    await db.auditLog.create({
      data: {
        organizationId: validatedData.organizationId,
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'COMPLIANCE_EVENT',
        entityId: complianceEvent.id,
        entityName: `${validatedData.eventType} - ${validatedData.complianceFramework}`,
        changes: {
          created: validatedData,
        },
        severity: validatedData.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
      },
    });

    return NextResponse.json({
      success: true,
      data: complianceEvent,
    });

  } catch (error: any) {
    logger.error('Error recording compliance event:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to record compliance event' },
      { status: 500 }
    );
  }
}

// Helper function to get compliance summary
async function getComplianceSummary(where: any) {
  const [
    totalEvents,
    statusBreakdown,
    severityBreakdown,
    frameworkBreakdown,
    recentCritical,
  ] = await Promise.all([
    db.complianceEvent.count({ where }),
    db.complianceEvent.groupBy({
      by: ['status'],
      where,
      _count: true,
    }),
    db.complianceEvent.groupBy({
      by: ['severity'],
      where,
      _count: true,
    }),
    db.complianceEvent.groupBy({
      by: ['complianceFramework'],
      where,
      _count: true,
    }),
    db.complianceEvent.findMany({
      where: {
        ...where,
        severity: 'CRITICAL',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        organization: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    }),
  ]);

  return {
    totalEvents,
    statusBreakdown: statusBreakdown.map(s => ({
      status: s.status,
      count: s._count,
    })),
    severityBreakdown: severityBreakdown.map(s => ({
      severity: s.severity,
      count: s._count,
    })),
    frameworkBreakdown: frameworkBreakdown.map(f => ({
      framework: f.complianceFramework,
      count: f._count,
    })),
    recentCritical,
    complianceScore: calculateComplianceScore(statusBreakdown, totalEvents),
  };
}

function calculateComplianceScore(statusBreakdown: any[], totalEvents: number) {
  if (totalEvents === 0) return 100;
  
  const compliantCount = statusBreakdown.find(s => s.status === 'COMPLIANT')?._count || 0;
  const resolvedCount = statusBreakdown.find(s => s.status === 'RESOLVED')?._count || 0;
  
  return Math.round(((compliantCount + resolvedCount) / totalEvents) * 100);
}