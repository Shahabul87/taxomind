/**
 * PATCH /api/sam/depth-analysis/[analysisId]/issues/[issueId]
 *
 * Update an issue's status or add a teacher response.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';

const UpdateIssueSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'SKIPPED', 'WONT_FIX']).optional(),
  teacherResponse: z.string().max(2000).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ analysisId: string; issueId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { analysisId, issueId } = await params;

    // Validate body
    const body = await request.json();
    const parseResult = UpdateIssueSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const updates = parseResult.data;

    if (!updates.status && updates.teacherResponse === undefined) {
      return NextResponse.json(
        { success: false, error: 'No updates provided' },
        { status: 400 }
      );
    }

    // Verify ownership via course owner
    const analysis = await db.courseDepthAnalysisV2.findUnique({
      where: { id: analysisId },
      select: { course: { select: { userId: true } } },
    });

    if (!analysis) {
      return NextResponse.json({ success: false, error: 'Analysis not found' }, { status: 404 });
    }

    if (analysis.course?.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Update the issue
    const updateData: Record<string, unknown> = {};
    if (updates.status) updateData.status = updates.status;
    if (updates.teacherResponse !== undefined) updateData.userNotes = updates.teacherResponse;

    const updatedIssue = await db.depthAnalysisIssue.update({
      where: { id: issueId, analysisId },
      data: updateData,
    });

    // Update analysis-level issue counts if status changed to RESOLVED
    if (updates.status === 'RESOLVED' || updates.status === 'WONT_FIX') {
      const openCount = await db.depthAnalysisIssue.count({
        where: { analysisId, status: 'OPEN' },
      });
      const resolvedCount = await db.depthAnalysisIssue.count({
        where: { analysisId, status: { in: ['RESOLVED', 'WONT_FIX'] } },
      });

      await db.courseDepthAnalysisV2.update({
        where: { id: analysisId },
        data: {
          totalIssues: openCount + resolvedCount,
        },
      }).catch(() => {
        // Best effort count update
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedIssue.id,
        status: updatedIssue.status,
        teacherResponse: updatedIssue.userNotes,
        updatedAt: updatedIssue.updatedAt,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to update issue', details: msg },
      { status: 500 }
    );
  }
}
