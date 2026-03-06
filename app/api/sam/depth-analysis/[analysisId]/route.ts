/**
 * GET /api/sam/depth-analysis/[analysisId]
 *
 * Retrieve a completed depth analysis result with all issues.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { analysisId } = await params;

    const analysis = await db.courseDepthAnalysisV2.findUnique({
      where: { id: analysisId },
      include: {
        issues: {
          orderBy: [
            { severity: 'asc' }, // CRITICAL first (alphabetical)
            { createdAt: 'asc' },
          ],
          take: 500,
        },
        course: {
          select: { id: true, title: true, userId: true },
        },
      },
    });

    if (!analysis) {
      return NextResponse.json({ success: false, error: 'Analysis not found' }, { status: 404 });
    }

    // Authorization: user must be the course owner
    if (analysis.course?.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: analysis.id,
        courseId: analysis.courseId,
        courseTitle: analysis.course?.title ?? 'Untitled',
        version: analysis.version,
        status: analysis.status,
        overallScore: analysis.overallScore,
        depthScore: analysis.depthScore,
        consistencyScore: analysis.consistencyScore,
        flowScore: analysis.flowScore,
        qualityScore: analysis.qualityScore,
        bloomsDistribution: analysis.bloomsDistribution,
        bloomsBalance: analysis.bloomsBalance,
        chapterAnalysis: analysis.chapterAnalysis,
        contentFlowAnalysis: analysis.contentFlowAnalysis,
        issueCountCritical: analysis.issueCountCritical,
        issueCountHigh: analysis.issueCountHigh,
        issueCountMedium: analysis.issueCountMedium,
        issueCountLow: analysis.issueCountLow,
        totalIssues: analysis.totalIssues,
        contentHash: analysis.contentHash,
        analysisMethod: analysis.analysisMethod,
        previousVersionId: analysis.previousVersionId,
        scoreImprovement: analysis.scoreImprovement,
        issuesResolved: analysis.issuesResolved,
        analyzedAt: analysis.analyzedAt,
        updatedAt: analysis.updatedAt,
        issues: analysis.issues.map(issue => ({
          id: issue.id,
          type: issue.type,
          severity: issue.severity,
          status: issue.status,
          title: issue.title,
          description: issue.description,
          location: {
            chapterId: issue.chapterId,
            chapterTitle: issue.chapterTitle,
            chapterPosition: issue.chapterPosition,
            sectionId: issue.sectionId,
            sectionTitle: issue.sectionTitle,
            sectionPosition: issue.sectionPosition,
            contentType: issue.contentType,
          },
          evidence: issue.evidence as string[] ?? [],
          impact: {
            area: issue.impactArea ?? '',
            description: issue.impactDescription ?? '',
          },
          fix: {
            action: issue.fixAction ?? '',
            what: issue.fixWhat ?? '',
            why: issue.fixWhy ?? '',
            how: issue.fixHow ?? '',
            suggestedContent: issue.suggestedContent ?? undefined,
            examples: issue.fixExamples as string[] ?? undefined,
          },
          userNotes: issue.userNotes,
          skippedReason: issue.skippedReason,
          resolvedAt: issue.resolvedAt,
          resolvedBy: issue.resolvedBy,
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt,
        })),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analysis', details: msg },
      { status: 500 }
    );
  }
}
