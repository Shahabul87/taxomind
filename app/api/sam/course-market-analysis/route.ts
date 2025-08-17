import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { MarketAnalysisEngine } from '@/lib/sam-market-engine';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId, analysisType = 'comprehensive', includeRecommendations = true } = await request.json();

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

    // Check if user is the owner or has organization access
    const hasAccess = course.userId === user.id || 
      (course.organizationId && await checkOrganizationAccess(user.id, course.organizationId));

    if (!hasAccess && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Perform market analysis
    const engine = new MarketAnalysisEngine();
    const analysis = await engine.analyzeCourse(courseId, analysisType, includeRecommendations);

    // Record the analysis as a SAM interaction
    await recordSAMInteraction(user.id, courseId, 'MARKET_ANALYSIS', {
      analysisType,
      marketScore: analysis.marketValue.score,
    });

    return NextResponse.json({
      success: true,
      data: analysis,
      metadata: {
        courseId,
        analysisType,
        timestamp: new Date().toISOString(),
        userId: user.id,
      },
    });

  } catch (error) {
    logger.error('Market analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to perform market analysis' },
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

    // Check if user is the owner or has organization access
    const hasAccess = course.userId === user.id || 
      (course.organizationId && await checkOrganizationAccess(user.id, course.organizationId));

    if (!hasAccess && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get stored analysis
    const analysis = await db.courseMarketAnalysis.findUnique({
      where: { courseId },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'No analysis found for this course' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        marketValue: analysis.marketValue,
        demandScore: analysis.demandScore,
        brandingScore: analysis.brandingScore,
        recommendedPrice: analysis.recommendedPrice,
        marketPosition: analysis.marketPosition,
        lastAnalyzedAt: analysis.lastAnalyzedAt,
        competitorAnalysis: analysis.competitorAnalysis,
        pricingAnalysis: analysis.pricingAnalysis,
        trendAnalysis: analysis.trendAnalysis,
        opportunities: analysis.opportunities,
        threats: analysis.threats,
      },
    });

  } catch (error) {
    logger.error('Get market analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve market analysis' },
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
        interactionType: 'CONTENT_GENERATE', // Using existing enum value
        context: { type: interactionType, ...result },
      },
    });
  } catch (error) {
    logger.error('Error recording SAM interaction:', error);
  }
}