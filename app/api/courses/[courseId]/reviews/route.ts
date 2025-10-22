import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';


export async function POST(req: Request, props: { params: Promise<{ courseId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
      }

    const userId = user?.id;

    const { rating, comment } = await req.json();

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return new NextResponse("Invalid rating", { status: 400 });
    }

    if (!comment || comment.length < 10) {
      return new NextResponse("Review comment must be at least 10 characters", { status: 400 });
    }

    // Check if course exists
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
      },
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    // Check if user has already reviewed this course
    const existingReview = await db.courseReview.findFirst({
      where: {
        courseId: params.courseId,
        userId,
      },
    });

    if (existingReview) {
      return new NextResponse("You have already reviewed this course", { status: 400 });
    }

    // Create the review
    const review = await db.courseReview.create({
      data: {
        rating,
        comment,
        courseId: params.courseId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    logger.error("[COURSE_REVIEW_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Get all reviews for a course
export async function GET(req: Request, props: { params: Promise<{ courseId: string }> }) {
  const params = await props.params;
  try {
    const viewer = await currentUser().catch(() => null);
    const viewerId = viewer?.id || null;
    const url = new URL(req.url);
    const sp = url.searchParams;

    const hasQueryControls = sp.has('page') || sp.has('pageSize') || sp.has('sortBy') || sp.has('rating');

    // Backwards-compatible: if no query controls are provided, return the full list (legacy behavior)
    if (!hasQueryControls) {
      const results = await db.courseReview.findMany({
        where: {
          courseId: params.courseId,
        },
        select: {
          id: true,
          rating: true,
          comment: true,
          courseId: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          _count: { select: { helpfulVotes: true } },
          ...(viewerId
            ? { helpfulVotes: { where: { userId: viewerId }, select: { id: true } } }
            : {}),
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      const items = results.map((r: any) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        courseId: r.courseId,
        userId: r.userId,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        user: r.user,
        helpfulCount: r._count?.helpfulVotes || 0,
        viewerHasVoted: Array.isArray(r.helpfulVotes) ? r.helpfulVotes.length > 0 : false,
      }));
      return NextResponse.json(items);
    }

    // Paginated/sorted/filtered response
    const page = Math.max(parseInt(sp.get('page') || '1', 10) || 1, 1);
    const rawPageSize = Math.max(parseInt(sp.get('pageSize') || '10', 10) || 10, 1);
    const pageSize = Math.min(rawPageSize, 50); // cap page size
    const sortBy = (sp.get('sortBy') || 'recent').toLowerCase();
    const ratingParam = sp.get('rating');
    const ratingFilter = ratingParam ? parseInt(ratingParam, 10) : null;

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'highest') orderBy = { rating: 'desc' };
    if (sortBy === 'lowest') orderBy = { rating: 'asc' };
    if (sortBy === 'helpful') orderBy = [ { helpfulVotes: { _count: 'desc' } }, { createdAt: 'desc' } ];
    // 'helpful' not implemented in schema yet; keep recent as default/fallback

    const where: any = { courseId: params.courseId };
    if (ratingFilter && ratingFilter >= 1 && ratingFilter <= 5) {
      where.rating = ratingFilter;
    }

    const [total, rawItems, grouped] = await Promise.all([
      db.courseReview.count({ where }),
      db.courseReview.findMany({
        where,
        select: {
          id: true,
          rating: true,
          comment: true,
          courseId: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          _count: { select: { helpfulVotes: true } },
          ...(viewerId
            ? { helpfulVotes: { where: { userId: viewerId }, select: { id: true } } }
            : {}),
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      // distribution across all reviews for this course (ignoring ratingFilter)
      db.courseReview.groupBy({
        by: ['rating'],
        where: { courseId: params.courseId },
        _count: { rating: true },
      })
    ]);

    const ratingCounts = [0, 0, 0, 0, 0]; // 1..5
    for (const g of grouped) {
      const r = (g as any).rating as number;
      const c = (g as any)._count.rating as number;
      if (r >= 1 && r <= 5) ratingCounts[r - 1] = c;
    }

    const items = rawItems.map((r: any) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      courseId: r.courseId,
      userId: r.userId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      user: r.user,
      helpfulCount: r._count?.helpfulVotes || 0,
      viewerHasVoted: Array.isArray(r.helpfulVotes) ? r.helpfulVotes.length > 0 : false,
    }));
    return NextResponse.json({ items, total, page, pageSize, ratingCounts });
  } catch (error) {
    logger.error('[COURSE_REVIEWS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
