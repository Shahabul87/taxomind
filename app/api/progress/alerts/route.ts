import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

// Get user's progress alerts
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Log to help debug frequent calls
    logger.info('[Progress Alerts API] Called', { timestamp: new Date().toISOString() });

    // Return mock data since progressAlert model doesn't exist in schema
    const mockAlerts = [
      {
        id: '1',
        userId: session.user.id,
        alertType: 'DECLINING_ENGAGEMENT',
        severity: 'WARNING',
        title: 'Engagement dropping in React Fundamentals',
        description: 'Your engagement has decreased by 15% over the last 3 sessions',
        actionRequired: 'Consider taking a break or switching to a different topic',
        courseId: 'react-101',
        affectedAreas: ['Chapter 3: State Management'],
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        resolvedAt: null,
        course: {
          id: 'react-101',
          title: 'React Fundamentals',
          imageUrl: '/courses/react.jpg'
        }
      },
      {
        id: '2',
        userId: session.user.id,
        alertType: 'HIGH_RISK',
        severity: 'CRITICAL',
        title: 'At risk of falling behind in Advanced JavaScript',
        description: 'You haven\'t accessed this course in 10 days',
        actionRequired: 'Resume your learning to maintain progress',
        courseId: 'js-advanced',
        affectedAreas: ['All chapters'],
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        resolvedAt: null,
        course: {
          id: 'js-advanced',
          title: 'Advanced JavaScript',
          imageUrl: '/courses/javascript.jpg'
        }
      }
    ];

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const severity = searchParams.get('severity');
    const alertType = searchParams.get('alertType');
    const unresolved = searchParams.get('unresolved') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Filter mock data based on query params
    let filteredAlerts = mockAlerts;
    
    if (courseId) {
      filteredAlerts = filteredAlerts.filter(a => a.courseId === courseId);
    }
    
    if (severity) {
      filteredAlerts = filteredAlerts.filter(a => a.severity === severity);
    }
    
    if (alertType) {
      filteredAlerts = filteredAlerts.filter(a => a.alertType === alertType);
    }
    
    if (unresolved) {
      filteredAlerts = filteredAlerts.filter(a => a.resolvedAt === null);
    }

    // Apply pagination
    const paginatedAlerts = filteredAlerts.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      alerts: paginatedAlerts,
      total: filteredAlerts.length,
      unresolved: filteredAlerts.filter(a => !a.resolvedAt).length
    });

    /* Original code - commented out until progressAlert model is added to schema
    const whereClause: any = {
      userId: session.user.id
    };

    if (courseId) {
      whereClause.courseId = courseId;
    }

    if (severity) {
      whereClause.severity = severity;
    }

    if (alertType) {
      whereClause.alertType = alertType;
    }

    if (unresolved) {
      whereClause.resolvedAt = null;
    }

    const alerts = await db.progressAlert.findMany({
      where: whereClause,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            imageUrl: true
          }
        },
        resolvedBy: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    const totalCount = await db.progressAlert.count({
      where: whereClause
    });

    const unresolvedCount = await db.progressAlert.count({
      where: {
        ...whereClause,
        resolvedAt: null
      }
    });

    return NextResponse.json({
      success: true,
      alerts,
      total: totalCount,
      unresolved: unresolvedCount
    });
    */

  } catch (error) {
    logger.error("Get progress alerts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress alerts" },
      { status: 500 }
    );
  }
}

// Create a new progress alert
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return mock response since progressAlert model doesn't exist
    return NextResponse.json({
      success: true,
      alert: {
        id: Date.now().toString(),
        userId: session.user.id,
        alertType: 'INFO',
        severity: 'LOW',
        title: 'Mock alert created',
        description: 'This is a mock alert',
        createdAt: new Date()
      }
    });

    /* Original code - commented out
    const body = await req.json();
    const {
      courseId,
      alertType,
      severity,
      title,
      description,
      actionRequired,
      affectedAreas
    } = body;

    if (!courseId || !alertType || !severity || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify user has access to the course
    const enrollment = await db.enrollment.findFirst({
      where: {
        userId: session.user.id,
        courseId
      }
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    const alert = await db.progressAlert.create({
      data: {
        userId: session.user.id,
        courseId,
        alertType,
        severity,
        title,
        description,
        actionRequired,
        affectedAreas: affectedAreas || []
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            imageUrl: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      alert
    });
    */

  } catch (error) {
    logger.error("Create progress alert error:", error);
    return NextResponse.json(
      { error: "Failed to create progress alert" },
      { status: 500 }
    );
  }
}