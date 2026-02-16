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

    // 3. Find the paused plan for this course
    const plan = await db.sAMExecutionPlan.findFirst({
      where: {
        goal: { userId: user.id },
        status: 'PAUSED',
        checkpointData: { not: null },
      },
      select: { id: true, checkpointData: true },
    });

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'No paused pipeline found for this course' },
        { status: 404 },
      );
    }

    // 4. Validate the checkpoint references the correct course
    const checkpoint = plan.checkpointData as Record<string, unknown> | null;
    if (checkpoint?.courseId !== courseId) {
      return NextResponse.json(
        { success: false, error: 'Course ID does not match the paused pipeline' },
        { status: 400 },
      );
    }

    // 5. Apply decision
    switch (decision) {
      case 'approve_continue': {
        await db.sAMExecutionPlan.update({
          where: { id: plan.id },
          data: { status: 'ACTIVE' },
        });

        logger.info('[APPROVE_API] Pipeline approved to continue', {
          userId: user.id, courseId, planId: plan.id,
        });

        return NextResponse.json({
          success: true,
          decision: 'approve_continue',
          message: 'Pipeline will resume on next creation request.',
        });
      }

      case 'approve_heal': {
        // Mark the flagged chapter for healing in checkpoint data
        const updatedCheckpoint = {
          ...checkpoint,
          escalationDecision: 'approve_heal',
        };

        await db.sAMExecutionPlan.update({
          where: { id: plan.id },
          data: {
            status: 'ACTIVE',
            checkpointData: updatedCheckpoint,
          },
        });

        logger.info('[APPROVE_API] Pipeline approved with healing', {
          userId: user.id, courseId, planId: plan.id,
        });

        return NextResponse.json({
          success: true,
          decision: 'approve_heal',
          message: 'Pipeline will resume with healing on next creation request.',
        });
      }

      case 'reject_abort': {
        await db.sAMExecutionPlan.update({
          where: { id: plan.id },
          data: { status: 'FAILED' },
        });

        logger.info('[APPROVE_API] Pipeline aborted by user', {
          userId: user.id, courseId, planId: plan.id,
        });

        return NextResponse.json({
          success: true,
          decision: 'reject_abort',
          message: 'Pipeline has been aborted.',
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
