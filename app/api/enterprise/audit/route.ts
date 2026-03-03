import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Validation schemas
const auditQuerySchema = z.object({
  organizationId: z.string().optional(),
  userId: z.string().optional(),
  action: z.enum(['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT', 'PUBLISH', 'UNPUBLISH']).optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  severity: z.enum(['INFO', 'WARNING', 'ERROR', 'CRITICAL']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(50),
});

const createAuditLogSchema = z.object({
  organizationId: z.string().optional(),
  userId: z.string().optional(),
  action: z.enum(['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT', 'PUBLISH', 'UNPUBLISH']),
  entityType: z.string(),
  entityId: z.string(),
  entityName: z.string().optional(),
  changes: z.object({}).optional(),
  context: z.object({}).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  severity: z.enum(['INFO', 'WARNING', 'ERROR', 'CRITICAL']).default('INFO'),
  tags: z.array(z.string()).default([]),
});

// GET /api/enterprise/audit - Get audit logs
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = {
      organizationId: searchParams.get('organizationId') || undefined,
      userId: searchParams.get('userId') || undefined,
      action: searchParams.get('action') || undefined,
      entityType: searchParams.get('entityType') || undefined,
      entityId: searchParams.get('entityId') || undefined,
      severity: searchParams.get('severity') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    };

    const validatedQuery = auditQuerySchema.parse(queryParams);

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

    if (validatedQuery.userId) {
      where.userId = validatedQuery.userId;
    }

    if (validatedQuery.action) {
      where.action = validatedQuery.action;
    }

    if (validatedQuery.entityType) {
      where.entityType = validatedQuery.entityType;
    }

    if (validatedQuery.entityId) {
      where.entityId = validatedQuery.entityId;
    }

    if (validatedQuery.severity) {
      where.severity = validatedQuery.severity;
    }

    if (validatedQuery.search) {
      where.OR = [
        { entityName: { contains: validatedQuery.search, mode: 'insensitive' } },
        { entityType: { contains: validatedQuery.search, mode: 'insensitive' } },
        { entityId: { contains: validatedQuery.search, mode: 'insensitive' } },
      ];
    }

    const skip = (validatedQuery.page - 1) * validatedQuery.limit;

    // Fetch audit logs
    const [logs, total, summary] = await Promise.all([
      db.auditLog.findMany({
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
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.auditLog.count({ where }),
      getAuditSummary(where),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        logs,
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
    logger.error('Error fetching audit logs:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

// POST /api/enterprise/audit - Create audit log entry
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createAuditLogSchema.parse(body);

    // Extract IP address and user agent from request if not provided
    const ipAddress = validatedData.ipAddress || 
      request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      'unknown';

    const userAgent = validatedData.userAgent || 
      request.headers.get('user-agent') || 
      'unknown';

    // Create audit log entry
    const auditLog = await db.auditLog.create({
      data: {
        ...validatedData,
        ipAddress,
        userAgent,
        userId: validatedData.userId || session.user.id,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: auditLog,
    });

  } catch (error) {
    logger.error('Error creating audit log:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create audit log' },
      { status: 500 }
    );
  }
}

// Helper function to get audit summary
async function getAuditSummary(where: any) {
  const [
    totalLogs,
    actionBreakdown,
    severityBreakdown,
    entityTypeBreakdown,
    userActivityBreakdown,
    recentCritical,
  ] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.groupBy({
      by: ['action'],
      where,
      _count: true,
    }),
    db.auditLog.groupBy({
      by: ['severity'],
      where,
      _count: true,
    }),
    db.auditLog.groupBy({
      by: ['entityType'],
      where,
      _count: true,
    }),
    db.auditLog.groupBy({
      by: ['userId'],
      where,
      _count: true,
      orderBy: { _count: { userId: 'desc' } },
      take: 10,
    }),
    db.auditLog.findMany({
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
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return {
    totalLogs,
    actionBreakdown: actionBreakdown.map(a => ({
      action: a.action,
      count: a._count,
    })),
    severityBreakdown: severityBreakdown.map(s => ({
      severity: s.severity,
      count: s._count,
    })),
    entityTypeBreakdown: entityTypeBreakdown.map(e => ({
      entityType: e.entityType,
      count: e._count,
    })),
    userActivityBreakdown: userActivityBreakdown.map(u => ({
      userId: u.userId,
      count: u._count,
    })),
    recentCritical,
    riskScore: calculateRiskScore(severityBreakdown, totalLogs),
  };
}

function calculateRiskScore(severityBreakdown: any[], totalLogs: number) {
  if (totalLogs === 0) return 0;
  
  const criticalCount = severityBreakdown.find(s => s.severity === 'CRITICAL')?._count || 0;
  const errorCount = severityBreakdown.find(s => s.severity === 'ERROR')?._count || 0;
  const warningCount = severityBreakdown.find(s => s.severity === 'WARNING')?._count || 0;
  
  // Calculate weighted risk score
  const riskScore = (criticalCount * 4 + errorCount * 2 + warningCount * 1) / totalLogs * 100;
  
  return Math.round(riskScore);
}