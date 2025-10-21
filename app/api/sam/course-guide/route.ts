import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { CourseGuideEngine } from '@/sam/engines/educational/sam-course-guide-engine';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      courseId,
      includeComparison = true,
      includeProjections = true,
    } = await request.json();

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Check if user has access to the course
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { 
        userId: true, 
        organizationId: true,
        title: true,
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check access permissions - only course owner or organization admins
    const hasAccess = course.userId === user.id || 
      (course.organizationId && await checkOrganizationAccess(user.id, course.organizationId));

    if (!hasAccess && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Generate course guide
    const engine = new CourseGuideEngine();
    const guide = await engine.generateCourseGuide(
      courseId,
      includeComparison,
      includeProjections
    );

    // Record the generation as a SAM interaction
    await recordSAMInteraction(user.id, courseId, 'COURSE_GUIDE_GENERATED', {
      metrics: {
        depth: guide.metrics.depth.overallDepth,
        engagement: guide.metrics.engagement.overallEngagement,
        marketAcceptance: guide.metrics.marketAcceptance.overallAcceptance,
      },
      successProbability: guide.successPrediction?.successProbability,
    });

    return NextResponse.json({
      success: true,
      data: guide,
      metadata: {
        courseId,
        courseTitle: course.title,
        generatedAt: new Date().toISOString(),
        userId: user.id,
      },
    });

  } catch (error) {
    logger.error('Generate course guide error:', error);
    return NextResponse.json(
      { error: 'Failed to generate course guide' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const format = searchParams.get('format') || 'json';

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Check if user has access to the course
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { userId: true, organizationId: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const hasAccess = course.userId === user.id || 
      (course.organizationId && await checkOrganizationAccess(user.id, course.organizationId));

    if (!hasAccess && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Generate and export course guide
    const engine = new CourseGuideEngine();
    
    if (format === 'html') {
      const htmlContent = await engine.exportCourseGuide(courseId, 'html');
      return new NextResponse(htmlContent as string, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="course-guide-${courseId}.html"`,
        },
      });
    } else {
      const guide = await engine.generateCourseGuide(courseId);
      return NextResponse.json({
        success: true,
        data: guide,
      });
    }

  } catch (error) {
    logger.error('Get course guide error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve course guide' },
      { status: 500 }
    );
  }
}

async function checkOrganizationAccess(userId: string, organizationId: string): Promise<boolean> {
  const membership = await db.organizationUser.findFirst({
    where: {
      userId,
      organizationId,
      role: 'ADMIN',
    },
  });
  
  return !!membership;
}

async function recordSAMInteraction(
  userId: string,
  courseId: string,
  interactionType: string,
  result: any
): Promise<void> {
  try {
    await db.sAMInteraction.create({
      data: {
        userId,
        courseId,
        interactionType: 'CONTENT_GENERATE',
        context: { type: interactionType, result },
      },
    });
  } catch (error) {
    logger.error('Error recording SAM interaction:', error);
  }
}