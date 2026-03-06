/**
 * GET /api/sam/depth-analysis/history?courseId=...
 *
 * Retrieve analysis history for a specific course.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const QuerySchema = z.object({
  courseId: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parseResult = QuerySchema.safeParse(searchParams);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { courseId, limit, offset } = parseResult.data;

    // Verify the user has access to this course
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { userId: true, title: true },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    if (course.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const [analyses, total] = await Promise.all([
      db.courseDepthAnalysisV2.findMany({
        where: { courseId },
        orderBy: { analyzedAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          version: true,
          status: true,
          overallScore: true,
          depthScore: true,
          consistencyScore: true,
          flowScore: true,
          qualityScore: true,
          totalIssues: true,
          issueCountCritical: true,
          issueCountHigh: true,
          issueCountMedium: true,
          issueCountLow: true,
          analysisMethod: true,
          contentHash: true,
          analyzedAt: true,
          updatedAt: true,
        },
      }),
      db.courseDepthAnalysisV2.count({ where: { courseId } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        courseId,
        courseTitle: course.title,
        analyses,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analysis history', details: msg },
      { status: 500 }
    );
  }
}
