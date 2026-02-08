/**
 * Depth Analysis V2 - Single Issue API
 *
 * Update issue status, add notes, mark as resolved/skipped.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const UpdateIssueSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'SKIPPED', 'WONT_FIX']).optional(),
  userNotes: z.string().max(2000).optional(),
  skippedReason: z.string().max(500).optional(),
});

// ============================================================================
// GET - Get Single Issue
// ============================================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ analysisId: string; issueId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { analysisId, issueId } = await params;

    // Fetch issue with analysis to verify access
    const issue = await db.depthAnalysisIssue.findUnique({
      where: { id: issueId },
      include: {
        analysis: {
          include: {
            course: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!issue || issue.analysisId !== analysisId) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Issue not found' } },
        { status: 404 }
      );
    }

    if (issue.analysis.course.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: issue.id,
        analysisId: issue.analysisId,
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
      },
      metadata: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('[DepthAnalysisV2] Issue GET error:', error);

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve issue' } },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update Issue Status/Notes
// ============================================================================

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ analysisId: string; issueId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { analysisId, issueId } = await params;
    const body = await req.json();
    const validated = UpdateIssueSchema.parse(body);

    // Verify access
    const issue = await db.depthAnalysisIssue.findUnique({
      where: { id: issueId },
      include: {
        analysis: {
          include: {
            course: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!issue || issue.analysisId !== analysisId) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Issue not found' } },
        { status: 404 }
      );
    }

    if (issue.analysis.course.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (validated.status) {
      updateData.status = validated.status;

      // Set resolvedAt and resolvedBy if marking as resolved
      if (validated.status === 'RESOLVED' && issue.status !== 'RESOLVED') {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = session.user.id;
      } else if (validated.status !== 'RESOLVED' && issue.status === 'RESOLVED') {
        // Clear resolved fields if un-resolving
        updateData.resolvedAt = null;
        updateData.resolvedBy = null;
      }
    }

    if (validated.userNotes !== undefined) {
      updateData.userNotes = validated.userNotes;
    }

    if (validated.skippedReason !== undefined) {
      updateData.skippedReason = validated.skippedReason;
    }

    // Update the issue
    const updatedIssue = await db.depthAnalysisIssue.update({
      where: { id: issueId },
      data: updateData,
    });

    // Update the analysis issue counts if status changed
    if (validated.status && validated.status !== issue.status) {
      // Get updated counts
      const counts = await db.depthAnalysisIssue.groupBy({
        by: ['severity'],
        where: {
          analysisId,
          status: 'OPEN',
        },
        _count: true,
      });

      const countMap = counts.reduce(
        (acc, item) => {
          acc[item.severity] = item._count;
          return acc;
        },
        {} as Record<string, number>
      );

      const openCount = await db.depthAnalysisIssue.count({
        where: {
          analysisId,
          status: 'OPEN',
        },
      });

      // Update analysis with new counts of open issues
      await db.courseDepthAnalysisV2.update({
        where: { id: analysisId },
        data: {
          issueCountCritical: countMap['CRITICAL'] || 0,
          issueCountHigh: countMap['HIGH'] || 0,
          issueCountMedium: countMap['MEDIUM'] || 0,
          issueCountLow: countMap['LOW'] || 0,
          totalIssues: openCount,
        },
      });
    }

    logger.info('[DepthAnalysisV2] Issue updated', {
      issueId,
      analysisId,
      updates: validated,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedIssue.id,
        status: updatedIssue.status,
        userNotes: updatedIssue.userNotes,
        skippedReason: updatedIssue.skippedReason,
        resolvedAt: updatedIssue.resolvedAt,
        resolvedBy: updatedIssue.resolvedBy,
        updatedAt: updatedIssue.updatedAt,
      },
      metadata: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('[DepthAnalysisV2] Issue PATCH error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: error.errors } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update issue' } },
      { status: 500 }
    );
  }
}
