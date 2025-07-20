import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { MarketAnalysisEngine } from '@/lib/sam-market-engine';
import { db } from '@/lib/db';

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
      select: { userId: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (course.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get competitors
    const engine = new MarketAnalysisEngine();
    const competitors = await engine.findCompetitors(courseId);

    return NextResponse.json({
      success: true,
      data: competitors,
      metadata: {
        courseId,
        count: competitors.length,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Get competitors error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve competitors' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId, competitorData } = await request.json();

    if (!courseId || !competitorData) {
      return NextResponse.json(
        { error: 'Course ID and competitor data are required' },
        { status: 400 }
      );
    }

    // Check if user has access to the course
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { userId: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (course.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Add competitor
    const engine = new MarketAnalysisEngine();
    await engine.analyzeCompetitor(courseId, competitorData);

    // Re-run market analysis with new competitor data
    const analysis = await engine.analyzeCourse(courseId, 'competition', false);

    return NextResponse.json({
      success: true,
      message: 'Competitor added successfully',
      data: {
        competitionAnalysis: analysis.competition,
      },
    });

  } catch (error) {
    console.error('Add competitor error:', error);
    return NextResponse.json(
      { error: 'Failed to add competitor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const competitorId = searchParams.get('id');

    if (!competitorId) {
      return NextResponse.json({ error: 'Competitor ID is required' }, { status: 400 });
    }

    // Get competitor to check course ownership
    const competitor = await db.courseCompetitor.findUnique({
      where: { id: competitorId },
      include: {
        course: {
          select: { userId: true },
        },
      },
    });

    if (!competitor) {
      return NextResponse.json({ error: 'Competitor not found' }, { status: 404 });
    }

    if (competitor.course.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete competitor
    await db.courseCompetitor.delete({
      where: { id: competitorId },
    });

    return NextResponse.json({
      success: true,
      message: 'Competitor removed successfully',
    });

  } catch (error) {
    console.error('Delete competitor error:', error);
    return NextResponse.json(
      { error: 'Failed to delete competitor' },
      { status: 500 }
    );
  }
}