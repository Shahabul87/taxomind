/**
 * Depth Analysis V2 - List Analyses API
 *
 * List all depth analyses for a course with pagination.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ListAnalysesSchema = z.object({
  courseId: z.string().min(1),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
});

// ============================================================================
// GET - List Analyses for a Course
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const validated = ListAnalysesSchema.parse({
      courseId: url.searchParams.get('courseId'),
      page: url.searchParams.get('page') || undefined,
      pageSize: url.searchParams.get('pageSize') || undefined,
    });

    // Verify course ownership
    const course = await db.course.findFirst({
      where: {
        id: validated.courseId,
        userId: session.user.id,
      },
      select: { id: true, title: true },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Course not found or access denied' } },
        { status: 404 }
      );
    }

    // Get total count
    const total = await db.courseDepthAnalysisV2.count({
      where: { courseId: validated.courseId },
    });

    // Get paginated analyses
    const analyses = await db.courseDepthAnalysisV2.findMany({
      where: { courseId: validated.courseId },
      orderBy: { version: 'desc' },
      skip: (validated.page - 1) * validated.pageSize,
      take: validated.pageSize,
      select: {
        id: true,
        version: true,
        status: true,
        overallScore: true,
        depthScore: true,
        consistencyScore: true,
        flowScore: true,
        qualityScore: true,
        bloomsBalance: true,
        issueCountCritical: true,
        issueCountHigh: true,
        issueCountMedium: true,
        issueCountLow: true,
        totalIssues: true,
        analysisMethod: true,
        analyzedAt: true,
      },
    });

    const totalPages = Math.ceil(total / validated.pageSize);

    return NextResponse.json({
      success: true,
      data: {
        courseId: validated.courseId,
        courseTitle: course.title,
        analyses: analyses.map((analysis) => ({
          id: analysis.id,
          version: analysis.version,
          status: analysis.status,
          scores: {
            overall: analysis.overallScore,
            depth: analysis.depthScore,
            consistency: analysis.consistencyScore,
            flow: analysis.flowScore,
            quality: analysis.qualityScore,
          },
          bloomsBalance: analysis.bloomsBalance,
          issueCount: {
            critical: analysis.issueCountCritical,
            high: analysis.issueCountHigh,
            medium: analysis.issueCountMedium,
            low: analysis.issueCountLow,
            total: analysis.totalIssues,
          },
          analysisMethod: analysis.analysisMethod,
          analyzedAt: analysis.analyzedAt,
        })),
        pagination: {
          page: validated.page,
          pageSize: validated.pageSize,
          total,
          totalPages,
        },
      },
      metadata: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('[DepthAnalysisV2] List GET error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid parameters', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list analyses' } },
      { status: 500 }
    );
  }
}
