/**
 * Depth Analysis V2 - Get Analysis Results
 *
 * Retrieves a specific depth analysis by ID with all details.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

// ============================================================================
// GET - Retrieve Analysis by ID
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

    // Fetch analysis with issues
    const analysis = await db.courseDepthAnalysisV2.findUnique({
      where: { id: analysisId },
      include: {
        issues: {
          orderBy: [
            { severity: 'asc' }, // CRITICAL first
            { type: 'asc' },
          ],
        },
        course: {
          select: {
            id: true,
            title: true,
            userId: true,
          },
        },
      },
    });

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Analysis not found' } },
        { status: 404 }
      );
    }

    // Check if user owns the course
    if (analysis.course.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Get previous analysis for comparison if exists
    let comparison = null;
    if (analysis.previousVersionId) {
      const previousAnalysis = await db.courseDepthAnalysisV2.findUnique({
        where: { id: analysis.previousVersionId },
        select: {
          id: true,
          overallScore: true,
          totalIssues: true,
          version: true,
        },
      });

      if (previousAnalysis) {
        // Count resolved issues (issues in previous that are not in current)
        const previousIssues = await db.depthAnalysisIssue.count({
          where: { analysisId: previousAnalysis.id },
        });

        const currentIssues = await db.depthAnalysisIssue.count({
          where: { analysisId: analysis.id },
        });

        comparison = {
          previousVersionId: previousAnalysis.id,
          previousVersion: previousAnalysis.version,
          scoreImprovement: analysis.overallScore - previousAnalysis.overallScore,
          issuesResolved: Math.max(0, previousIssues - currentIssues),
          newIssues: Math.max(0, currentIssues - previousIssues),
        };
      }
    }

    // Transform to response format
    const response = {
      id: analysis.id,
      courseId: analysis.courseId,
      courseTitle: analysis.course.title,
      version: analysis.version,
      status: analysis.status,
      analysisMethod: analysis.analysisMethod,

      // Scores
      overallScore: analysis.overallScore,
      depthScore: analysis.depthScore,
      consistencyScore: analysis.consistencyScore,
      flowScore: analysis.flowScore,
      qualityScore: analysis.qualityScore,

      // Bloom's
      bloomsDistribution: analysis.bloomsDistribution,
      bloomsBalance: analysis.bloomsBalance,

      // Chapter Analysis
      chapterAnalysis: analysis.chapterAnalysis,

      // Issues
      issueCount: {
        critical: analysis.issueCountCritical,
        high: analysis.issueCountHigh,
        medium: analysis.issueCountMedium,
        low: analysis.issueCountLow,
        total: analysis.totalIssues,
      },
      issues: analysis.issues.map((issue) => ({
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
      })),

      // Outcomes
      learningOutcomes: analysis.learningOutcomes,
      skillsGained: analysis.skillsGained,
      knowledgeGaps: analysis.knowledgeGaps,

      // Content Analysis
      duplicateContent: analysis.duplicateContent,
      thinSections: analysis.thinSections,
      contentFlowAnalysis: analysis.contentFlowAnalysis,

      // Comparison
      comparison,

      // Timestamps
      analyzedAt: analysis.analyzedAt,
      updatedAt: analysis.updatedAt,
    };

    return NextResponse.json({
      success: true,
      data: response,
      metadata: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('[DepthAnalysisV2] GET error:', error);

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve analysis' } },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete an Analysis
// ============================================================================

export async function DELETE(
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

    // Fetch analysis to check ownership
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

    // Delete analysis (issues will cascade delete)
    await db.courseDepthAnalysisV2.delete({
      where: { id: analysisId },
    });

    logger.info('[DepthAnalysisV2] Analysis deleted', {
      analysisId,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: { deleted: true, analysisId },
      metadata: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    logger.error('[DepthAnalysisV2] DELETE error:', error);

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete analysis' } },
      { status: 500 }
    );
  }
}
