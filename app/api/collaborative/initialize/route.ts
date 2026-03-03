import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * Initialize collaborative editing features for a content item
 * POST /api/collaborative/initialize
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { contentType, contentId, title } = body;

    if (!contentType || !contentId) {
      return NextResponse.json(
        { error: 'Content type and ID are required' },
        { status: 400 }
      );
    }

    // Check if user has permission to enable collaborative editing
    const hasPermission = await checkEnablePermission(session.user.id, contentType, contentId);
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Create or get existing collaborative session
    const collaborativeSession = await db.collaborativeSession.upsert({
      where: {
        contentType_contentId: {
          contentType,
          contentId,
        },
      },
      update: {
        isActive: true,
        lastActivity: new Date(),
      },
      create: {
        id: `${contentType}_${contentId}_${Date.now()}`,
        contentType,
        contentId,
        roomId: `room_${contentType}_${contentId}`,
        title: title || `${contentType} collaboration`,
        isActive: true,
        lockType: 'NONE',
        createdById: session.user.id,
        createdAt: new Date(),
        lastActivity: new Date(),
      },
    });

    // Initialize default permissions for the creator
    await db.collaborativePermission.upsert({
      where: {
        userId_contentType_contentId: {
          userId: session.user.id,
          contentType,
          contentId,
        },
      },
      update: {
        permissions: ['READ', 'WRITE', 'COMMENT', 'MODERATE', 'ADMIN'],
        role: 'ADMIN',
        isActive: true,
      },
      create: {
        userId: session.user.id,
        contentType,
        contentId,
        permissions: ['READ', 'WRITE', 'COMMENT', 'MODERATE', 'ADMIN'],
        role: 'ADMIN',
        grantedBy: session.user.id,
        grantedAt: new Date(),
        isActive: true,
      },
    });

    // Create default permission rules
    await createDefaultPermissionRules(contentType, contentId, session.user.id);

    // Track initialization activity
    await db.collaborativeActivity.create({
      data: {
        sessionId: collaborativeSession.id,
        userId: session.user.id,
        activityType: 'SESSION_INITIALIZED',
        description: 'Collaborative editing enabled',
        metadata: {
          contentType,
          contentId,
          timestamp: new Date().toISOString(),
        },
      },
    });

    logger.info(`Collaborative editing initialized for ${contentType}:${contentId} by user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      sessionId: collaborativeSession.id,
      roomId: collaborativeSession.roomId,
      message: 'Collaborative editing enabled successfully',
    });

  } catch (error: unknown) {
    logger.error('Error initializing collaborative editing:', error);
    return NextResponse.json(
      { error: 'Failed to initialize collaborative editing' },
      { status: 500 }
    );
  }
}

/**
 * Get collaborative session info
 * GET /api/collaborative/initialize?contentType=course&contentId=123
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('contentType');
    const contentId = searchParams.get('contentId');

    if (!contentType || !contentId) {
      return NextResponse.json(
        { error: 'Content type and ID are required' },
        { status: 400 }
      );
    }

    // Get existing collaborative session
    const collaborativeSession = await db.collaborativeSession.findFirst({
      where: {
        contentType,
        contentId,
        isActive: true,
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            activities: true,
            conflicts: true,
          },
        },
      },
    });

    if (!collaborativeSession) {
      return NextResponse.json({
        enabled: false,
        message: 'Collaborative editing not enabled for this content',
      });
    }

    // Check user permissions
    const userPermissions = await db.collaborativePermission.findFirst({
      where: {
        userId: session.user.id,
        contentType,
        contentId,
        isActive: true,
      },
    });

    return NextResponse.json({
      enabled: true,
      sessionId: collaborativeSession.id,
      roomId: collaborativeSession.roomId,
      title: collaborativeSession.title,
      participants: collaborativeSession.participants.map(p => ({
        id: p.user.id,
        name: p.user.name,
        image: p.user.image,
        joinedAt: p.joinedAt,
        isOnline: p.isOnline,
      })),
      userPermissions: userPermissions?.permissions || [],
      userRole: userPermissions?.role || 'VIEWER',
      activityCount: collaborativeSession._count.activities,
      conflictCount: collaborativeSession._count.conflicts,
      lastActivity: collaborativeSession.lastActivity,
    });

  } catch (error: unknown) {
    logger.error('Error getting collaborative session info:', error);
    return NextResponse.json(
      { error: 'Failed to get session information' },
      { status: 500 }
    );
  }
}

async function checkEnablePermission(userId: string, contentType: string, contentId: string): Promise<boolean> {
  try {
    // Check if user is the content owner or admin
    if (contentType === 'course') {
      const course = await db.course.findFirst({
        where: { id: contentId, userId },
      });
      if (course) return true;
    }

    if (contentType === 'post') {
      const post = await db.post.findFirst({
        where: { id: contentId, userId },
      });
      if (post) return true;
    }

    // Check if user is admin - admins are now in AdminAccount table
    const adminAccount = await db.adminAccount.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    return adminAccount?.role === 'ADMIN' || adminAccount?.role === 'SUPERADMIN';
  } catch (error: unknown) {
    logger.error('Error checking enable permission:', error);
    return false;
  }
}

async function createDefaultPermissionRules(contentType: string, contentId: string, createdBy: string): Promise<void> {
  try {
    // Rule: Enrolled users can read and comment
    await db.permissionRule.upsert({
      where: { id: `default_${contentType}_${contentId}_enrolled` },
      update: {},
      create: {
        id: `default_${contentType}_${contentId}_enrolled`,
        contentType,
        contentId,
        userRole: 'USER',
        permissions: ['READ', 'COMMENT'],
        conditions: {
          enrollmentRequired: true,
        },
        isActive: true,
        createdBy,
        createdAt: new Date(),
      },
    });

    // Rule: Admins have full permissions
    await db.permissionRule.upsert({
      where: { id: `default_${contentType}_${contentId}_admin` },
      update: {},
      create: {
        id: `default_${contentType}_${contentId}_admin`,
        contentType,
        contentId,
        userRole: 'ADMIN',
        permissions: ['READ', 'WRITE', 'COMMENT', 'MODERATE', 'ADMIN'],
        conditions: {},
        isActive: true,
        createdBy,
        createdAt: new Date(),
      },
    });

  } catch (error: unknown) {
    logger.error('Error creating default permission rules:', error);
  }
}