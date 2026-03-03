import { NextResponse } from "next/server";
import { z } from "zod";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { ApiResponses } from '@/lib/api/api-responses';

const ReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10).max(5000).trim(),
});


export async function POST(req: Request, props: { params: Promise<{ courseId: string }> }) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
        return ApiResponses.unauthorized();
      }

    const userId = user.id;

    const body = await req.json();
    const parsed = ReviewSchema.safeParse(body);
    if (!parsed.success) {
      return ApiResponses.badRequest(parsed.error.errors[0]?.message || "Invalid input");
    }
    const { rating, comment } = parsed.data;

    // Check if course exists
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
      },
    });

    if (!course) {
      return ApiResponses.notFound("Course not found");
    }

    // Check if user has already reviewed this course
    const existingReview = await db.courseReview.findFirst({
      where: {
        courseId: params.courseId,
        userId,
      },
    });

    if (existingReview) {
      return ApiResponses.badRequest("You have already reviewed this course");
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
    return ApiResponses.internal();
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
        take: 500,
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
    return ApiResponses.internal();
  }
}
