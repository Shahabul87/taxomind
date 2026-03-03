import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { logger } from '@/lib/logger';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const rateLimitResponse = await withRateLimit(req, 'standard');
    if (rateLimitResponse) return rateLimitResponse;

    const params = await context.params;

    // Check if post exists
    const post = await db.post.findUnique({
      where: { id: params.postId },
      select: { id: true, views: true },
    });

    if (!post) {
      return new NextResponse("Post not found", { status: 404 });
    }

    // Increment view count
    const updatedPost = await db.post.update({
      where: { id: params.postId },
      data: {
        views: {
          increment: 1,
        },
      },
      select: { views: true },
    });

    return NextResponse.json({
      success: true,
      data: { views: updatedPost.views },
    });
  } catch (error) {
    logger.error("[POST_VIEW_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const rateLimitResponse = await withRateLimit(req, 'standard');
    if (rateLimitResponse) return rateLimitResponse;

    const params = await context.params;

    const post = await db.post.findUnique({
      where: { id: params.postId },
      select: { views: true },
    });

    if (!post) {
      return new NextResponse("Post not found", { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { views: post.views },
    });
  } catch (error) {
    logger.error("[GET_POST_VIEWS_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
