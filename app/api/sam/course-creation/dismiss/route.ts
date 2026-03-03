/**
 * Dismiss / Cancel Course Creation API
 *
 * POST /api/sam/course-creation/dismiss
 *
 * Marks the user's active SAMExecutionPlan as CANCELLED so the resume banner
 * no longer appears. Called when the user clicks "Dismiss" on the resume banner
 * or cancels an in-progress creation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const rateLimitResponse = await withRateLimit(req, 'standard');
    if (rateLimitResponse) return rateLimitResponse;

    // 1. Auth
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Find all active/paused/draft/failed plans for this user.
    //    DRAFT is included because the dedup check blocks on both ACTIVE and DRAFT.
    //    FAILED is included because the progress API finds FAILED plans with checkpoints
    //    (showing the resume banner), so dismiss must also cancel them to stop the banner.
    //    NOTE: We intentionally do NOT filter on checkpointData — plans that failed
    //    before any checkpoint was saved still have status ACTIVE/DRAFT and will block
    //    new creation attempts via the fingerprint dedup check (409 ALREADY_RUNNING).
    const activePlans = await db.sAMExecutionPlan.findMany({
      where: {
        goal: { userId: user.id },
        status: { in: ['ACTIVE', 'PAUSED', 'DRAFT', 'FAILED'] },
      },
      select: { id: true },
      take: 100,
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

    // 4. Clean up DB dedupe locks so the next creation attempt is not blocked.
    //    These locks are created by the orchestrate route and keyed by
    //    `${userId}:${requestId|fingerprint}` with endpoint 'sam_orchestrate_dedupe_lock'.
    try {
      await db.rateLimit.deleteMany({
        where: {
          identifier: { startsWith: `${user.id}:` },
          endpoint: 'sam_orchestrate_dedupe_lock',
        },
      });
    } catch {
      // Best-effort lock cleanup
    }

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
