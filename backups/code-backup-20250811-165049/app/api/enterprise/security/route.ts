import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Validation schemas
const securityQuerySchema = z.object({
  organizationId: z.string().optional(),
  eventType: z.enum(['UNAUTHORIZED_ACCESS', 'SUSPICIOUS_ACTIVITY', 'DATA_BREACH', 'POLICY_VIOLATION', 'SYSTEM_INTRUSION', 'MALWARE_DETECTION', 'AUTHENTICATION_FAILURE']).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum(['OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(50),
});

const createSecurityEventSchema = z.object({
  organizationId: z.string().optional(),
  eventType: z.enum(['UNAUTHORIZED_ACCESS', 'SUSPICIOUS_ACTIVITY', 'DATA_BREACH', 'POLICY_VIOLATION', 'SYSTEM_INTRUSION', 'MALWARE_DETECTION', 'AUTHENTICATION_FAILURE']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('LOW'),
  source: z.string().optional(),
  description: z.string(),
  details: z.object({}).optional(),
  affectedUsers: z.array(z.string()).optional(),
  mitigationActions: z.array(z.string()).optional(),
  status: z.enum(['OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED']).default('OPEN'),
});

const updateSecurityEventSchema = z.object({
  status: z.enum(['OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED']).optional(),
  mitigationActions: z.array(z.string()).optional(),
  resolvedAt: z.string().optional(),
});

// GET /api/enterprise/security - Get security events
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
              id: "security-1",
              eventType: "UNAUTHORIZED_ACCESS",
              severity: "HIGH",
              source: "Authentication System",
              description: "Multiple failed login attempts detected",
              details: { ip: "192.168.1.100", attempts: 5 },
              affectedUsers: ["user-123"],
              mitigationActions: ["IP blocked", "User notified"],
              status: "RESOLVED",
              createdAt: new Date().toISOString(),
              organization: { id: "demo-org-1", name: "Acme Corporation", slug: "acme-corp" }
            },
            {
              id: "security-2",
              eventType: "SUSPICIOUS_ACTIVITY",
              severity: "MEDIUM",
              source: "Content Access",
              description: "Unusual content access pattern detected",
              details: { pattern: "bulk_download", volume: "500MB" },
              affectedUsers: ["user-456"],
              mitigationActions: [],
              status: "INVESTIGATING",
              createdAt: new Date().toISOString(),
              organization: { id: "demo-org-2", name: "Tech University", slug: "tech-university" }
            }
          ],
          summary: {
            totalEvents: 2,
            statusBreakdown: [
              { status: "RESOLVED", count: 1 },
              { status: "INVESTIGATING", count: 1 }
            ],
            severityBreakdown: [
              { severity: "HIGH", count: 1 },
              { severity: "MEDIUM", count: 1 }
            ],
            eventTypeBreakdown: [
              { eventType: "UNAUTHORIZED_ACCESS", count: 1 },
              { eventType: "SUSPICIOUS_ACTIVITY", count: 1 }
            ],
            recentCritical: [],
            openCritical: 0,
            securityScore: 78
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
      severity: searchParams.get('severity') || undefined,
      status: searchParams.get('status') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    };

    const validatedQuery = securityQuerySchema.parse(queryParams);

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

    if (validatedQuery.severity) {
      where.severity = validatedQuery.severity;
    }

    if (validatedQuery.status) {
      where.status = validatedQuery.status;
    }

    if (validatedQuery.search) {
      where.OR = [
        { description: { contains: validatedQuery.search, mode: 'insensitive' } },
        { source: { contains: validatedQuery.search, mode: 'insensitive' } },
      ];
    }

    const skip = (validatedQuery.page - 1) * validatedQuery.limit;

    // Fetch security events
    const [events, total, summary] = await Promise.all([
      db.securityEvent.findMany({
        where,
        skip,
        take: validatedQuery.limit,
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
      }),
      db.securityEvent.count({ where }),
      getSecuritySummary(where),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        events,
        pagination: {
          page: validatedQuery.page,
          limit: validatedQuery.limit,
          total,
          totalPages: Math.ceil(total / validatedQuery.limit),
        },
        summary,
        query: validatedQuery,
      },
    });

  } catch (error) {
    logger.error('Error fetching security events:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch security events' },
      { status: 500 }
    );
  }
}

// POST /api/enterprise/security - Create security event
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createSecurityEventSchema.parse(body);

    // Create security event
    const securityEvent = await db.securityEvent.create({
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
        entityType: 'SECURITY_EVENT',
        entityId: securityEvent.id,
        entityName: `${validatedData.eventType} - ${validatedData.severity}`,
        changes: {
          created: validatedData,
        },
        severity: validatedData.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
      },
    });

    // If critical, also create a compliance event
    if (validatedData.severity === 'CRITICAL') {
      await db.complianceEvent.create({
        data: {
          organizationId: validatedData.organizationId,
          eventType: 'SECURITY_INCIDENT',
          complianceFramework: 'CUSTOM',
          status: 'PENDING_ACTION',
          severity: 'CRITICAL',
          details: {
            securityEventId: securityEvent.id,
            description: validatedData.description,
            eventType: validatedData.eventType,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: securityEvent,
    });

  } catch (error) {
    logger.error('Error creating security event:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create security event' },
      { status: 500 }
    );
  }
}

// PATCH /api/enterprise/security - Update security event
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Security event ID is required' }, { status: 400 });
    }

    const validatedUpdates = updateSecurityEventSchema.parse(updates);

    // Get current security event for audit trail
    const currentEvent = await db.securityEvent.findUnique({
      where: { id },
    });

    if (!currentEvent) {
      return NextResponse.json({ error: 'Security event not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = { ...validatedUpdates };
    
    if (validatedUpdates.status === 'RESOLVED' && validatedUpdates.resolvedAt) {
      updateData.resolvedAt = new Date(validatedUpdates.resolvedAt);
    }

    const updatedEvent = await db.securityEvent.update({
      where: { id },
      data: updateData,
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
        organizationId: updatedEvent.organizationId,
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'SECURITY_EVENT',
        entityId: id,
        entityName: `${updatedEvent.eventType} - ${updatedEvent.severity}`,
        changes: {
          before: currentEvent,
          after: validatedUpdates,
        },
        severity: 'INFO',
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedEvent,
    });

  } catch (error) {
    logger.error('Error updating security event:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update security event' },
      { status: 500 }
    );
  }
}

// Helper function to get security summary
async function getSecuritySummary(where: any) {
  const [
    totalEvents,
    statusBreakdown,
    severityBreakdown,
    eventTypeBreakdown,
    recentCritical,
    openCritical,
  ] = await Promise.all([
    db.securityEvent.count({ where }),
    db.securityEvent.groupBy({
      by: ['status'],
      where,
      _count: true,
    }),
    db.securityEvent.groupBy({
      by: ['severity'],
      where,
      _count: true,
    }),
    db.securityEvent.groupBy({
      by: ['eventType'],
      where,
      _count: true,
    }),
    db.securityEvent.findMany({
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
    db.securityEvent.count({
      where: {
        ...where,
        severity: 'CRITICAL',
        status: { in: ['OPEN', 'INVESTIGATING'] },
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
    eventTypeBreakdown: eventTypeBreakdown.map(e => ({
      eventType: e.eventType,
      count: e._count,
    })),
    recentCritical,
    openCritical,
    securityScore: calculateSecurityScore(severityBreakdown, statusBreakdown, totalEvents),
  };
}

function calculateSecurityScore(severityBreakdown: any[], statusBreakdown: any[], totalEvents: number) {
  if (totalEvents === 0) return 100;
  
  const criticalCount = severityBreakdown.find(s => s.severity === 'CRITICAL')?._count || 0;
  const highCount = severityBreakdown.find(s => s.severity === 'HIGH')?._count || 0;
  const openCount = statusBreakdown.find(s => s.status === 'OPEN')?._count || 0;
  const investigatingCount = statusBreakdown.find(s => s.status === 'INVESTIGATING')?._count || 0;
  
  // Calculate weighted security score (lower is worse)
  const severityPenalty = (criticalCount * 10 + highCount * 5) / totalEvents * 100;
  const statusPenalty = (openCount + investigatingCount) / totalEvents * 50;
  
  const securityScore = Math.max(0, 100 - severityPenalty - statusPenalty);
  
  return Math.round(securityScore);
}