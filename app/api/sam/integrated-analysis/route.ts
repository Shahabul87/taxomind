import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { SAMEngineIntegration } from '@/lib/sam-engine-integration';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      courseId,
      userId = user.id,
      analysisDepth = 'comprehensive',
      enginePreferences,
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

    // Check access permissions
    const hasAccess = course.userId === user.id || 
      (course.organizationId && await checkOrganizationAccess(user.id, course.organizationId)) ||
      user.role === 'ADMIN';

    if (!hasAccess) {
      // For students, check if they are enrolled
      const enrollment = await db.enrollment.findFirst({
        where: {
          userId: user.id,
          courseId,
        },
      });

      if (!enrollment) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Create integration instance and run analysis
    const integration = new SAMEngineIntegration();
    const analysis = await integration.performIntegratedAnalysis(
      {
        userId,
        courseId,
        role: user.role,
        enginePreferences,
      },
      analysisDepth as any
    );

    // Store analysis results
    await storeAnalysisResults(user.id, courseId, analysis);

    return NextResponse.json({
      success: true,
      data: analysis,
      metadata: {
        courseId,
        courseTitle: course.title,
        analysisDepth,
        timestamp: new Date().toISOString(),
        userId: user.id,
      },
    });

  } catch (error) {
    console.error('Integrated analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to perform integrated analysis' },
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
    const analysisId = searchParams.get('analysisId');

    if (!courseId && !analysisId) {
      return NextResponse.json(
        { error: 'Course ID or Analysis ID is required' },
        { status: 400 }
      );
    }

    // Get latest analysis results
    const where: any = {
      userId: user.id,
      context: {
        path: ['type'],
        equals: 'INTEGRATED_ANALYSIS',
      },
    };

    if (courseId) {
      where.courseId = courseId;
    }

    const latestAnalysis = await db.sAMInteraction.findFirst({
      where,
      orderBy: { createdAt: 'desc' },
    });

    if (!latestAnalysis) {
      return NextResponse.json(
        { error: 'No analysis found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: latestAnalysis.result,
      metadata: {
        analysisId: latestAnalysis.id,
        courseId: latestAnalysis.courseId,
        createdAt: latestAnalysis.createdAt,
      },
    });

  } catch (error) {
    console.error('Get integrated analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analysis' },
      { status: 500 }
    );
  }
}

async function checkOrganizationAccess(userId: string, organizationId: string): Promise<boolean> {
  const membership = await db.organizationUser.findFirst({
    where: {
      userId,
      organizationId,
      role: { in: ['OWNER', 'ADMIN', 'INSTRUCTOR'] },
    },
  });
  
  return !!membership;
}

async function storeAnalysisResults(userId: string, courseId: string, analysis: any): Promise<void> {
  try {
    // Store comprehensive results
    await db.sAMInteraction.create({
      data: {
        userId,
        courseId,
        interactionType: 'CONTENT_GENERATED',
        context: {
          type: 'INTEGRATED_ANALYSIS',
          engines: ['market', 'blooms', 'exam', 'guide'],
          depth: analysis.analysisDepth || 'comprehensive',
        },
        result: {
          timestamp: analysis.timestamp,
          recommendationCount: analysis.integratedRecommendations?.length || 0,
          criticalActions: analysis.integratedRecommendations?.filter(
            (r: any) => r.priority === 'critical'
          ).length || 0,
          actionPlan: analysis.actionPlan,
          keyInsights: {
            marketPosition: analysis.marketInsights?.market?.position,
            bloomsBalance: analysis.bloomsProfile?.courseLevel?.balance,
            engagementLevel: analysis.courseGuide?.metrics?.engagement?.overallEngagement,
            successProbability: analysis.courseGuide?.successPrediction?.successProbability,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error storing analysis results:', error);
  }
}