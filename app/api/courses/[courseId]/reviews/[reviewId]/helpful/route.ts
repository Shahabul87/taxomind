import { NextResponse } from 'next/server';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { ApiResponses } from '@/lib/api/api-responses';

type Params = { params: Promise<{ courseId: string; reviewId: string }> };

export async function POST(req: Request, props: Params) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user?.id) return ApiResponses.unauthorized();

    const { courseId, reviewId } = params;

    // Ensure the review belongs to this course
    const review = await db.courseReview.findFirst({
      where: { id: reviewId, courseId },
      select: { id: true },
    });
    if (!review) return ApiResponses.notFound("Review not found");

    // Create vote (idempotent)
    await db.courseReviewHelpfulVote.upsert({
      where: { reviewId_userId: { reviewId, userId: user.id } },
      create: { reviewId, userId: user.id },
      update: {},
    });

    const helpfulCount = await db.courseReviewHelpfulVote.count({ where: { reviewId } });
    return NextResponse.json({ reviewId, helpfulCount, viewerHasVoted: true });
  } catch (error) {
    logger.error('[REVIEW_HELPFUL_POST]', error);
    return ApiResponses.internal();
  }
}

export async function DELETE(req: Request, props: Params) {
  const params = await props.params;
  try {
    const user = await currentUser();
    if (!user?.id) return ApiResponses.unauthorized();

    const { courseId, reviewId } = params;

    // Ensure the review belongs to this course
    const review = await db.courseReview.findFirst({
      where: { id: reviewId, courseId },
      select: { id: true },
    });
    if (!review) return ApiResponses.notFound("Review not found");

    // Remove vote (idempotent)
    try {
      await db.courseReviewHelpfulVote.delete({
        where: { reviewId_userId: { reviewId, userId: user.id } },
      });
    } catch {
      // ignore if not found
    }

    const helpfulCount = await db.courseReviewHelpfulVote.count({ where: { reviewId } });
    return NextResponse.json({ reviewId, helpfulCount, viewerHasVoted: false });
  } catch (error) {
    logger.error('[REVIEW_HELPFUL_DELETE]', error);
    return ApiResponses.internal();
  }
}

