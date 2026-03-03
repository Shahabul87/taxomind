import { NextRequest, NextResponse } from "next/server";
import { withAuth, type APIAuthContext, createSuccessResponse, createErrorResponse, ApiError } from "@/lib/api";
import { db } from "@/lib/db";
import { isRateLimited, getRateLimitMessage } from "@/lib/rate-limit";
import { getFromCache, setInCache, getCommentsKey, shouldCachePost, invalidateCache } from "@/app/lib/cache";
import { logger } from '@/lib/logger';
import { CommentCreateSchema } from '@/lib/validations/blog';
import { z } from 'zod';
import type { Comment, Reply, User, Reaction } from '@prisma/client';

// Enterprise Type Definitions
interface CommentUser {
  id: string;
  name: string | null;
  image: string | null;
}

interface CommentWithRelations extends Comment {
  User: CommentUser;
  reactions: Array<Reaction & { user: CommentUser }>;
  replies: Array<Reply & {
    User: CommentUser;
    Reaction: Array<Reaction & { user: CommentUser }>;
    other_Reply: Array<Reply & {
      User: CommentUser;
      Reaction: Reaction[];
      other_Reply: Array<Reply & {
        User: CommentUser;
        Reaction: Reaction[];
      }>;
    }>;
  }>;
  _count: {
    replies: number;
  };
}

interface CommentAPIParams {
  params: Promise<{
    postId: string;
  }>;
}

export const POST = withAuth(async (
  request: NextRequest,
  context: APIAuthContext,
  props: CommentAPIParams
) => {
  const startTime = Date.now();

  try {
    // Rate limiting
    const rateLimitResult = await isRateLimited(context.user.id, 'comment');
    if (rateLimitResult.limited) {
      logger.warn('[COMMENT_POST] Rate limit exceeded', {
        userId: context.user.id,
        reset: rateLimitResult.reset,
      });
      return createErrorResponse(
        ApiError.tooManyRequests(getRateLimitMessage('comment', rateLimitResult.reset))
      );
    }

    // Parse parameters
    const { postId } = await props.params;

    // Validate postId format
    if (!postId || typeof postId !== 'string') {
      logger.warn('[COMMENT_POST] Invalid postId', { postId });
      return createErrorResponse(ApiError.badRequest('Invalid post ID'));
    }

    // Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const validationResult = CommentCreateSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0]?.message || 'Invalid input';
      logger.warn('[COMMENT_POST] Validation failed', {
        errors: validationResult.error.errors,
        userId: context.user.id,
        postId,
      });
      return createErrorResponse(ApiError.badRequest(errorMessage));
    }

    const { content } = validationResult.data;

    // Verify that the post exists
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true, userId: true }
    });

    if (!post) {
      logger.warn('[COMMENT_POST] Post not found', { postId, userId: context.user.id });
      return createErrorResponse(ApiError.notFound('Post not found'));
    }

    // Create a top-level Comment
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

    // Log success metrics
    const duration = Date.now() - startTime;
    logger.info('[COMMENT_POST] Comment created successfully', {
      commentId: comment.id,
      userId: context.user.id,
      postId,
      duration,
    });

    return createSuccessResponse(comment, 201);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('[COMMENT_POST] Error creating comment', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: context.user.id,
      duration,
    });
    return createErrorResponse(ApiError.internal('Failed to create comment'));
  }
});

export const GET = withAuth(async (
  request: NextRequest,
  context: APIAuthContext,
  props: CommentAPIParams
) => {
  const startTime = Date.now();

  try {
    // Parse parameters
    const { postId } = await props.params;
    const url = new URL(request.url);

    // Validate postId format
    if (!postId || typeof postId !== 'string') {
      logger.warn('[COMMENTS_GET] Invalid postId', { postId });
      return createErrorResponse(ApiError.badRequest('Invalid post ID'));
    }

    // Get pagination and sorting parameters with validation
    const pageParam = url.searchParams.get('page');
    const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
    const sortBy = url.searchParams.get('sortBy') || 'newest';

    // Validate sortBy parameter
    if (!['newest', 'oldest', 'popular'].includes(sortBy)) {
      return createErrorResponse(ApiError.badRequest('Invalid sortBy parameter'));
    }

    // Check cache first
    const cacheKey = getCommentsKey(postId, page, sortBy);
    const cachedComments = await getFromCache<{
      data: CommentWithRelations[];
      pagination: {
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
        hasMore: boolean;
      };
    }>(cacheKey);

    if (cachedComments) {
      logger.info('[COMMENTS_GET] Cache hit', { postId, page, sortBy });
      return createSuccessResponse(cachedComments, 200, undefined, {
        'X-Cache': 'HIT',
        'Cache-Control': 'public, max-age=120',
      });
    }

    // Verify that the post exists
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      logger.warn('[COMMENTS_GET] Post not found', { postId });
      return createErrorResponse(ApiError.notFound('Post not found'));
    }

    // Calculate pagination
    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    // Get total count for pagination info
    const totalCount = await db.comment.count({
      where: { postId },
    });

    // Build orderBy based on sortBy parameter
    const orderBy =
      sortBy === 'oldest'
        ? { createdAt: 'asc' as const }
        : sortBy === 'popular'
        ? { reactions: { _count: 'desc' as const } }
        : { createdAt: 'desc' as const };

    // Get comments with their replies and reactions
    const comments = await db.comment.findMany({
      where: { postId },
      take: 100,
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
            other_Reply: {
              include: {
                User: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
                Reaction: true,
                other_Reply: {
                  include: {
                    User: {
                      select: {
                        id: true,
                        name: true,
                        image: true,
                      },
                    },
                    Reaction: true,
                  },
                  orderBy: {
                    createdAt: 'asc',
                  },
                },
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy,
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
        hasMore: skip + pageSize < totalCount,
      },
    };

    // Cache the result if it's a heavily commented post
    if (shouldCachePost(totalCount)) {
      await setInCache(cacheKey, result);
      logger.info('[COMMENTS_GET] Result cached', { postId, page, sortBy, totalCount });
    }

    const duration = Date.now() - startTime;
    logger.info('[COMMENTS_GET] Comments fetched successfully', {
      postId,
      page,
      sortBy,
      count: comments.length,
      duration,
    });

    return createSuccessResponse(result, 200, undefined, {
      'X-Cache': 'MISS',
      'Cache-Control': 'public, max-age=120',
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('[COMMENTS_GET] Error fetching comments', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
    });
    return createErrorResponse(ApiError.internal('Failed to fetch comments'));
  }
});

