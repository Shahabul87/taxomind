import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Validation schema
const updateOrganizationSchema = z.object({
  name: z.string().min(1).optional(),
  domain: z.string().optional(),
  subscriptionTier: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM']).optional(),
  maxUsers: z.number().min(1).optional(),
  maxCourses: z.number().min(1).optional(),
  brandingConfig: z.object({}).optional(),
  settings: z.object({}).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/enterprise/organizations/[id] - Get organization details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 });
    }

    const { id } = await params;

    const organization = await db.organization.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                createdAt: true,
              },
            },
          },
        },
        courses: {
          select: {
            id: true,
            title: true,
            isPublished: true,
            createdAt: true,
            _count: {
              select: {
                chapters: true,
                Enrollment: true,
              },
            },
          },
        },
        analytics: {
          where: {
            recordedAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
          orderBy: { recordedAt: 'desc' },
          take: 100,
        },
        _count: {
          select: {
            users: true,
            courses: true,
            analytics: true,
            auditLogs: true,
            complianceEvents: true,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Calculate organization metrics
    const totalEnrollments = organization.courses.reduce(
      (sum, course) => sum + course._count.Enrollment,
      0
    );

    const totalChapters = organization.courses.reduce(
      (sum, course) => sum + course._count.chapters,
      0
    );

    const activeUsers = organization.users.filter(u => u.isActive).length;

    const enrichedOrganization = {
      ...organization,
      metrics: {
        totalUsers: organization._count.users,
        activeUsers,
        totalCourses: organization._count.courses,
        publishedCourses: organization.courses.filter(c => c.isPublished).length,
        totalChapters,
        totalEnrollments,
        totalAnalytics: organization._count.analytics,
        totalAuditLogs: organization._count.auditLogs,
        totalComplianceEvents: organization._count.complianceEvents,
      },
      _count: undefined,
    };

    return NextResponse.json({
      success: true,
      data: enrichedOrganization,
    });

  } catch (error) {
    logger.error('Error fetching organization:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
}

// PATCH /api/enterprise/organizations/[id] - Update organization
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateOrganizationSchema.parse(body);

    // Get current organization for audit trail
    const currentOrg = await db.organization.findUnique({
      where: { id },
    });

    if (!currentOrg) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const updatedOrganization = await db.organization.update({
      where: { id },
      data: validatedData,
      include: {
        _count: {
          select: {
            users: true,
            courses: true,
          },
        },
      },
    });

    // Log the update in audit trail
    await db.auditLog.create({
      data: {
        organizationId: id,
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'ORGANIZATION',
        entityId: id,
        entityName: updatedOrganization.name,
        changes: {
          before: currentOrg,
          after: validatedData,
        },
        severity: 'INFO',
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedOrganization,
    });

  } catch (error) {
    logger.error('Error updating organization:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    );
  }
}

// DELETE /api/enterprise/organizations/[id] - Delete organization
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 });
    }

    const { id } = await params;

    // Get organization details for audit trail
    const organization = await db.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            courses: true,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if organization has active users or courses
    if (organization._count.users > 0 || organization._count.courses > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete organization with active users or courses',
          details: {
            users: organization._count.users,
            courses: organization._count.courses,
          }
        },
        { status: 400 }
      );
    }

    await db.organization.delete({
      where: { id },
    });

    // Log the deletion in audit trail
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DELETE',
        entityType: 'ORGANIZATION',
        entityId: id,
        entityName: organization.name,
        changes: {
          deleted: organization,
        },
        severity: 'WARNING',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Organization deleted successfully',
    });

  } catch (error) {
    logger.error('Error deleting organization:', error);
    return NextResponse.json(
      { error: 'Failed to delete organization' },
      { status: 500 }
    );
  }
}