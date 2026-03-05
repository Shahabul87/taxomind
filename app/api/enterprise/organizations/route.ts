import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Validation schemas
const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  domain: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
  subscriptionTier: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM']).default('FREE'),
  maxUsers: z.number().min(1).default(100),
  maxCourses: z.number().min(1).default(10),
  brandingConfig: z.object({}).optional(),
  settings: z.object({}).optional(),
});

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

// GET /api/enterprise/organizations - List all organizations
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 200);
    const search = searchParams.get('search') || '';
    const tier = searchParams.get('tier');
    const active = searchParams.get('active');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { domain: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (tier) {
      where.subscriptionTier = tier;
    }
    
    if (active !== null) {
      where.isActive = active === 'true';
    }

    const [organizations, total] = await Promise.all([
      db.organization.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              users: true,
              courses: true,
              analytics: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.organization.count({ where }),
    ]);

    const enrichedOrganizations = organizations.map(org => ({
      ...org,
      userCount: org._count.users,
      courseCount: org._count.courses,
      analyticsCount: org._count.analytics,
      _count: undefined,
    }));

    return NextResponse.json({
      success: true,
      data: enrichedOrganizations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    logger.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}

// POST /api/enterprise/organizations - Create new organization
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createOrganizationSchema.parse(body);

    // Check if slug already exists
    const existingOrg = await db.organization.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization with this slug already exists' },
        { status: 400 }
      );
    }

    const organization = await db.organization.create({
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

    // Log the creation in audit trail
    await db.auditLog.create({
      data: {
        organizationId: organization.id,
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'ORGANIZATION',
        entityId: organization.id,
        entityName: organization.name,
        changes: {
          created: validatedData,
        },
        severity: 'INFO',
      },
    });

    return NextResponse.json({
      success: true,
      data: organization,
    });

  } catch (error) {
    logger.error('Error creating organization:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}

// PATCH /api/enterprise/organizations - Bulk update organizations
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ids, updates } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Organization IDs array is required' },
        { status: 400 }
      );
    }

    const validatedUpdates = updateOrganizationSchema.parse(updates);

    const result = await db.organization.updateMany({
      where: { id: { in: ids } },
      data: validatedUpdates,
    });

    // Log the bulk update in audit trail
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'ORGANIZATION',
        entityId: ids.join(','),
        entityName: `Bulk update of ${ids.length} organizations`,
        changes: {
          updated: validatedUpdates,
          affectedIds: ids,
        },
        severity: 'INFO',
      },
    });

    return NextResponse.json({
      success: true,
      data: { updatedCount: result.count },
    });

  } catch (error) {
    logger.error('Error bulk updating organizations:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update organizations' },
      { status: 500 }
    );
  }
}