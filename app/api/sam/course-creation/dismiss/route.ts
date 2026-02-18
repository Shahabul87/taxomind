/**
 * Dismiss / Cancel Course Creation API
 *
 * POST /api/sam/course-creation/dismiss
 *
 * Marks the user's active SAMExecutionPlan as CANCELLED so the resume banner
 * no longer appears. Called when the user clicks "Dismiss" on the resume banner
 * or cancels an in-progress creation.
 */

import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function POST() {
  try {
    // 1. Auth
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Find all active/paused/draft plans for this user.
    //    DRAFT is included because the dedup check blocks on both ACTIVE and DRAFT.
    //    NOTE: We intentionally do NOT filter on checkpointData — plans that failed
    //    before any checkpoint was saved still have status ACTIVE/DRAFT and will block
    //    new creation attempts via the fingerprint dedup check (409 ALREADY_RUNNING).
    const activePlans = await db.sAMExecutionPlan.findMany({
      where: {
        goal: { userId: user.id },
        status: { in: ['ACTIVE', 'PAUSED', 'DRAFT'] },
      },
      select: { id: true },
    });

    if (activePlans.length === 0) {
      return NextResponse.json({ success: true, dismissed: 0 });
    }

    // 3. Mark all as CANCELLED
    const result = await db.sAMExecutionPlan.updateMany({
      where: {
        id: { in: activePlans.map(p => p.id) },
      },
      data: {
        status: 'CANCELLED',
      },
    });

    logger.info('[DISMISS_API] Cancelled active creation plans', {
      userId: user.id,
      dismissed: result.count,
      planIds: activePlans.map(p => p.id),
    });

    return NextResponse.json({ success: true, dismissed: result.count });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[DISMISS_API] Error:', msg);
    return NextResponse.json(
      { success: false, error: 'Failed to dismiss creation' },
      { status: 500 }
    );
  }
}
