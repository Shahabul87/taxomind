import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { withSubscriptionGate } from '@/lib/sam/ai-provider';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { withRetryableTimeout, TIMEOUT_DEFAULTS } from '@/lib/sam/utils/timeout';
import { createMarketEngine } from '@sam-ai/educational';
import { createMarketAdapter } from '@/lib/adapters';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

let marketEngine: ReturnType<typeof createMarketEngine> | null = null;

function getMarketEngine() {
  if (!marketEngine) {
    marketEngine = createMarketEngine({ databaseAdapter: createMarketAdapter(db as never) });
  }
  return marketEngine;
}

function normalizeList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry));
  }
  if (typeof value === 'string' && value.trim()) {
    return [value];
  }
  return [];
}

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(request, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

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

    const competitors = await db.courseCompetitor.findMany({
      where: { courseId },
      orderBy: { analyzedAt: 'desc' },
    });

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
    logger.error('Get competitors error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve competitors' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(request, 'ai');
    if (rateLimitResponse) return rateLimitResponse;

    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gateResult = await withSubscriptionGate(user.id, { category: 'premium-feature' });
    if (!gateResult.allowed && gateResult.response) return gateResult.response;

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

    const competitor = await db.courseCompetitor.create({
      data: {
        courseId,
        competitorName: String(competitorData.name ?? competitorData.title ?? 'Competitor'),
        competitorUrl: competitorData.url ? String(competitorData.url) : undefined,
        price: Number(competitorData.price ?? 0),
        rating: competitorData.rating !== undefined ? Number(competitorData.rating) : undefined,
        enrollments: competitorData.enrollments !== undefined ? Number(competitorData.enrollments) : undefined,
        features: normalizeList(competitorData.features),
        strengths: normalizeList(competitorData.strengths),
        weaknesses: normalizeList(competitorData.weaknesses),
      },
    });

    const analysis = await withRetryableTimeout(
      () => getMarketEngine().analyzeCourse(courseId, 'competition', false),
      TIMEOUT_DEFAULTS.AI_ANALYSIS,
      'competitorMarketAnalysis'
    );

    return NextResponse.json({
      success: true,
      message: 'Competitor added successfully',
      data: {
        competitionAnalysis: analysis.competition,
        competitorId: competitor.id,
      },
    });

  } catch (error) {
    logger.error('Add competitor error:', error);
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
    logger.error('Delete competitor error:', error);
    return NextResponse.json(
      { error: 'Failed to delete competitor' },
      { status: 500 }
    );
  }
}
