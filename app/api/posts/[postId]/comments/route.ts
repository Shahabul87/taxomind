import { NextRequest, NextResponse } from "next/server";
import { withAuth, type APIAuthContext, createSuccessResponse, createErrorResponse, ApiError } from "@/lib/api";
import { db } from "@/lib/db";
import { isRateLimited, getRateLimitMessage } from "@/app/lib/rate-limit";
import { getFromCache, setInCache, getCommentsKey, shouldCachePost, invalidateCache } from "@/app/lib/cache";
import { logger } from '@/lib/logger';

export const POST = withAuth(async (
  request: NextRequest, 
  context: APIAuthContext,
  props?: any
) => {
  try {

    const rateLimitResult = await isRateLimited(context.user.id, 'comment');
    if (rateLimitResult.limited) {

      return createSuccessResponse({ 
        error: getRateLimitMessage('comment', rateLimitResult.reset),
        rateLimitInfo: rateLimitResult
      }, 429);
    }

    const { content } = await request.json();
    const params = await props.params;
    const { postId } = params;

    if (!content) {
      return createSuccessResponse({ error: "Content is required" }, 400);
    }

    // Verify that the post exists
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true }
    });

    if (!post) {
      return createSuccessResponse({ error: "Post not found" }, 404);
    }

    const comment = await db.comment.create({
      data: {
        content,
        userId: context.user.id,
        postId,
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        replies: true,
      },
    });

    // Invalidate cache for this post's comments
    await invalidateCache(`comments:${postId}:*`);

    return createSuccessResponse(comment, 201);
  } catch (error) {
    logger.error("[COMMENT_POST]", error);
    return createSuccessResponse({ error: "Internal server error" }, 500);
  }
});

export const GET = withAuth(async (
  request: NextRequest, 
  context: APIAuthContext,
  props?: any
) => {
  try {
    const params = await props.params;
    const { postId } = params;
    const url = new URL(request.url);
    
    // Get pagination and sorting parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const sortBy = url.searchParams.get('sortBy') || 'newest';
    
    // Check cache first
    const cacheKey = getCommentsKey(postId, page, sortBy);
    const cachedComments = await getFromCache<any[]>(cacheKey);
    
    if (cachedComments) {

      return createSuccessResponse(cachedComments, 200, undefined, {
        'X-Cache': 'HIT',
        'Cache-Control': 'public, max-age=120' // 2 minutes
      });
    }

    // Verify that the post exists
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true }
    });

    if (!post) {
      return createSuccessResponse({ error: "Post not found" }, 404);
    }

    // Calculate pagination
    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    // Get total count for pagination info
    const totalCount = await db.comment.count({
      where: {
        postId,
      }
    });

    // Get comments with their replies and reactions
    const comments = await db.comment.findMany({
      where: {
        postId,
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        replies: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            Reaction: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            Reply: {
              select: {
                id: true,
              }
            }
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        _count: {
          select: {
            replies: true
          }
        }
      },
      orderBy: sortBy === 'oldest' 
        ? { createdAt: "asc" } 
        : sortBy === 'popular' 
          ? { reactions: { _count: "desc" } } 
          : { createdAt: "desc" },
      skip,
      take: pageSize,
    });

    // Add pagination metadata
    const result = {
      data: comments,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasMore: skip + pageSize < totalCount
      }
    };

    // Cache the result if it's a heavily commented post
    if (shouldCachePost(totalCount)) {
      await setInCache(cacheKey, result);

    }

    return createSuccessResponse(result, 200, undefined, {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=120' // 2 minutes
      });
  } catch (error) {
    logger.error("[COMMENTS_GET]", error);
    return createErrorResponse(ApiError.internal("Internal Error"));
  }
});

