/**
 * Course Creation Escalation Approval API
 *
 * POST /api/sam/course-creation/approve
 *
 * Handles human escalation decisions when the pipeline is paused due to
 * a quality flag with `enableEscalationGate` enabled.
 *
 * Decisions:
 *   approve_continue — Resume pipeline without changes
 *   approve_heal     — Mark the flagged chapter for healing, then resume
 *   reject_abort     — Abort the pipeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// =============================================================================
// VALIDATION
// =============================================================================

const ApproveRequestSchema = z.object({
  courseId: z.string().min(1).max(100),
  decision: z.enum(['approve_continue', 'approve_heal', 'reject_abort']),
});

// =============================================================================
// HANDLER
// =============================================================================

export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    // 2. Parse and validate body
    const body = await req.json();
    const parsed = ApproveRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { courseId, decision } = parsed.data;

    // 3. Find the paused plan for this specific course + user
    //    Filter by courseId IN the query (not post-fetch) to avoid wrong-course ambiguity
    const plan = await db.sAMExecutionPlan.findFirst({
      where: {
        goal: { userId: user.id },
        status: 'PAUSED',
        checkpointData: {
          not: null,
          path: ['courseId'],
          equals: courseId,
        },
      },
      select: {
        id: true,
        checkpointData: true,
        goal: { select: { userId: true } },
      },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: `No paused pipeline found for course ${courseId}` },
        { status: 404 },
      );
    }

    // 4. Authorization: verify the plan owner matches the requesting user
    if (plan.goal.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: pipeline belongs to another user' },
        { status: 403 },
      );
    }

    const checkpoint = plan.checkpointData as Record<string, unknown> | null;

    // 5. Apply decision
    const planId = plan.id;
    const completedChapterCount = (checkpoint?.completedChapterCount as number) ?? 0;
    const totalChapters = (checkpoint?.totalChapters as number) ?? 0;

    const RESUME_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

    switch (decision) {
      case 'approve_continue': {
        const resumeDeadline = new Date(Date.now() + RESUME_WINDOW_MS).toISOString();

        await db.sAMExecutionPlan.update({
          where: { id: planId },
          data: {
            status: 'ACTIVE',
            checkpointData: { ...checkpoint, resumeDeadline },
          },
        });

        logger.info('[APPROVE_API] Pipeline approved to continue', {
          userId: user.id, courseId, planId, resumeDeadline,
        });

        return NextResponse.json({
          success: true,
          decision: 'approve_continue',
          courseId,
          planId,
          resumeReady: true,
          resumeToken: planId,
          approveAndResumeEndpoint: '/api/sam/course-creation/approve-and-resume',
          resumeEndpoint: '/api/sam/course-creation/orchestrate',
          resumeMethod: 'POST',
          resumeBody: { resumeCourseId: courseId },
          resumeDeadline,
          progress: {
            completedChapters: completedChapterCount,
            totalChapters,
          },
          message: `Pipeline approved. Preferred: POST /api/sam/course-creation/approve-and-resume with the same payload for one-call resume, or POST /api/sam/course-creation/orchestrate with { resumeCourseId: "${courseId}" }. Resume window: 30 minutes.`,
        });
      }

      case 'approve_heal': {
        const resumeDeadline = new Date(Date.now() + RESUME_WINDOW_MS).toISOString();

        // Mark the flagged chapter for healing in checkpoint data
        const updatedCheckpoint = {
          ...checkpoint,
          escalationDecision: 'approve_heal',
          resumeDeadline,
        };

        await db.sAMExecutionPlan.update({
          where: { id: planId },
          data: {
            status: 'ACTIVE',
            checkpointData: updatedCheckpoint,
          },
        });

        logger.info('[APPROVE_API] Pipeline approved with healing', {
          userId: user.id, courseId, planId, resumeDeadline,
        });

        return NextResponse.json({
          success: true,
          decision: 'approve_heal',
          courseId,
          planId,
          resumeReady: true,
          resumeToken: planId,
          approveAndResumeEndpoint: '/api/sam/course-creation/approve-and-resume',
          resumeEndpoint: '/api/sam/course-creation/orchestrate',
          resumeMethod: 'POST',
          resumeBody: { resumeCourseId: courseId },
          resumeDeadline,
          progress: {
            completedChapters: completedChapterCount,
            totalChapters,
          },
          message: `Pipeline approved with healing. Preferred: POST /api/sam/course-creation/approve-and-resume with the same payload for one-call resume, or POST /api/sam/course-creation/orchestrate with { resumeCourseId: "${courseId}" }. Resume window: 30 minutes.`,
        });
      }

      case 'reject_abort': {
        await db.sAMExecutionPlan.update({
          where: { id: planId },
          data: { status: 'FAILED' },
        });

        logger.info('[APPROVE_API] Pipeline aborted by user', {
          userId: user.id, courseId, planId,
        });

        return NextResponse.json({
          success: true,
          decision: 'reject_abort',
          courseId,
          message: 'Pipeline has been aborted. The course has been saved with content generated so far.',
        });
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[APPROVE_API] Error:', msg);
    return NextResponse.json(
      { success: false, error: 'Failed to process escalation decision' },
      { status: 500 },
    );
  }
}
