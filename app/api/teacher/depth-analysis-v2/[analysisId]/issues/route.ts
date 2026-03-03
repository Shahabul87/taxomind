/**
 * Depth Analysis V2 - Issues API
 *
 * Manage issues within an analysis - list, filter, and bulk operations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const IssueFilterSchema = z.object({
  severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  type: z
    .enum([
      'STRUCTURE',
      'CONTENT',
      'FLOW',
      'DUPLICATE',
      'CONSISTENCY',
      'DEPTH',
      'OBJECTIVE',
      'ASSESSMENT',
    ])
    .optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'SKIPPED', 'WONT_FIX']).optional(),
  chapterId: z.string().optional(),
});

// ============================================================================
// GET - List Issues with Filters
// ============================================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { analysisId } = await params;

    // Verify access to analysis
    const analysis = await db.courseDepthAnalysisV2.findUnique({
      where: { id: analysisId },
      include: {
        course: {
          select: { userId: true },
        },
      },
    });

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Analysis not found' } },
        { status: 404 }
      );
    }

    if (analysis.course.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Parse filters from query params
    const url = new URL(req.url);
    const filters = IssueFilterSchema.parse({
      severity: url.searchParams.get('severity') || undefined,
      type: url.searchParams.get('type') || undefined,
      status: url.searchParams.get('status') || undefined,
      chapterId: url.searchParams.get('chapterId') || undefined,
    });

    // Build where clause
    const where: Record<string, unknown> = {
      analysisId,
    };

    if (filters.severity) where.severity = filters.severity;
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.chapterId) where.chapterId = filters.chapterId;

    // Fetch issues
    const issues = await db.depthAnalysisIssue.findMany({
      where,
      orderBy: [
        { severity: 'asc' }, // CRITICAL first
        { type: 'asc' },
        { createdAt: 'asc' },
      ],
      take: 100,
    });

    // Get summary counts
    const summary = await db.depthAnalysisIssue.groupBy({
      by: ['severity'],
      where: { analysisId },
      _count: true,
    });

    const statusSummary = await db.depthAnalysisIssue.groupBy({
      by: ['status'],
      where: { analysisId },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        issues: issues.map((issue) => ({
          id: issue.id,
          type: issue.type,
          severity: issue.severity,
          status: issue.status,
          location: {
            chapterId: issue.chapterId,
            chapterTitle: issue.chapterTitle,
            chapterPosition: issue.chapterPosition,
            sectionId: issue.sectionId,
            sectionTitle: issue.sectionTitle,
            sectionPosition: issue.sectionPosition,
            contentType: issue.contentType,
          },
          title: issue.title,
          description: issue.description,
          evidence: issue.evidence,
          impact: {
            area: issue.impactArea,
            description: issue.impactDescription,
          },
          fix: {
            action: issue.fixAction,
            what: issue.fixWhat,
            why: issue.fixWhy,
            how: issue.fixHow,
            suggestedContent: issue.suggestedContent,
            examples: issue.fixExamples,
          },
          resolvedAt: issue.resolvedAt,
          resolvedBy: issue.resolvedBy,
          userNotes: issue.userNotes,
          skippedReason: issue.skippedReason,
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt,
        })),
        summary: {
          bySeverity: summary.reduce(
            (acc, item) => {
              acc[item.severity] = item._count;
              return acc;
            },
            {} as Record<string, number>
          ),
          byStatus: statusSummary.reduce(
            (acc, item) => {
              acc[item.status] = item._count;
              return acc;
            },
            {} as Record<string, number>
          ),
          total: issues.length,
        },
      },
      metadata: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('[DepthAnalysisV2] Issues GET error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid filters' } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve issues' } },
      { status: 500 }
    );
  }
}
