import { NextRequest, NextResponse } from "next/server";
import { withAuth, type APIAuthContext, createSuccessResponse, createErrorResponse, ApiError } from "@/lib/api";
import { db } from "@/lib/db";
import { isRateLimited, getRateLimitMessage } from "@/lib/rate-limit";
import { logger } from '@/lib/logger';
import { ReplyCreateSchema } from '@/lib/validations/blog';
import { invalidateCache } from "@/app/lib/cache";
import type { Reply, Reaction } from '@prisma/client';

// Enterprise Type Definitions
interface ReplyUser {
  id: string;
  name: string | null;
  image: string | null;
}

interface ReplyWithRelations extends Reply {
  User: ReplyUser;
  Reaction: Array<Reaction & { user: ReplyUser }>;
}

interface ReplyAPIParams {
  params: Promise<{
    postId: string;
    commentId: string;
  }>;
}

export const POST = withAuth(async (
  request: NextRequest,
  context: APIAuthContext,
  props: ReplyAPIParams
) => {
  const startTime = Date.now();

  try {
    // Rate limiting
    const rateLimitResult = await isRateLimited(context.user.id, 'reply');
    if (rateLimitResult.limited) {
      logger.warn('[REPLY_POST] Rate limit exceeded', {
        userId: context.user.id,
        reset: rateLimitResult.reset,
      });
      return createErrorResponse(
        ApiError.tooManyRequests(getRateLimitMessage('reply', rateLimitResult.reset))
      );
    }

    // Parse parameters
    const { postId, commentId } = await props.params;

    // Validate parameter formats
    if (!postId || typeof postId !== 'string') {
      logger.warn('[REPLY_POST] Invalid postId', { postId });
      return createErrorResponse(ApiError.badRequest('Invalid post ID'));
    }

    if (!commentId || typeof commentId !== 'string') {
      logger.warn('[REPLY_POST] Invalid commentId', { commentId });
      return createErrorResponse(ApiError.badRequest('Invalid comment ID'));
    }

    // Parse and validate request body
    const body = await request.json().catch(() => ({}));
    const validationResult = ReplyCreateSchema.safeParse(body);

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0]?.message || 'Invalid input';
      logger.warn('[REPLY_POST] Validation failed', {
        errors: validationResult.error.errors,
        userId: context.user.id,
        commentId,
      });
      return createErrorResponse(ApiError.badRequest(errorMessage));
    }

    const { content, parentReplyId } = validationResult.data;

    // Check if comment exists and belongs to the post
    const comment = await db.comment.findFirst({
      where: {
        id: commentId,
        postId,
      },
      select: {
        id: true,
        postId: true,
      },
    });

    if (!comment) {
      logger.warn('[REPLY_POST] Comment not found', { commentId, postId });
      return createErrorResponse(ApiError.notFound('Comment not found'));
    }

    // If parentReplyId is provided, validate nesting depth
    let depth = 1;
    if (parentReplyId) {
      const parentReply = await db.reply.findFirst({
        where: {
          id: parentReplyId,
          commentId,
        },
        select: {
          id: true,
          parentReplyId: true,
          depth: true,
        },
      });

      if (!parentReply) {
        logger.warn('[REPLY_POST] Parent reply not found', { parentReplyId, commentId });
        return createErrorResponse(ApiError.notFound('Parent reply not found'));
      }

      // Calculate depth based on parent
      depth = (parentReply.depth || 0) + 1;

      // Check nesting depth to prevent excessive depth (hard limit: 10 levels)
      if (depth > 10) {
        logger.warn('[REPLY_POST] Maximum nesting depth exceeded', {
          depth,
          parentReplyId,
          commentId,
          userId: context.user.id,
        });
        return createErrorResponse(
          ApiError.badRequest('Maximum reply nesting depth exceeded')
        );
      }
    }

    // Create reply with validated data
    const reply = await db.reply.create({
      data: {
        content,
        userId: context.user.id,
        postId,
        commentId,
        parentReplyId: parentReplyId || null,
        depth,
      },
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
      },
    });

    // Invalidate cache for this post's comments
    await invalidateCache(`comments:${postId}:*`);

    // Log success metrics
    const duration = Date.now() - startTime;
    logger.info('[REPLY_POST] Reply created successfully', {
      replyId: reply.id,
      commentId,
      postId,
      userId: context.user.id,
      depth,
      duration,
    });

    return createSuccessResponse(reply, 201);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('[REPLY_POST] Error creating reply', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: context.user.id,
      duration,
    });
    return createErrorResponse(ApiError.internal('Failed to create reply'));
  }
});

export const GET = withAuth(async (
  request: NextRequest,
  context: APIAuthContext,
  props: ReplyAPIParams
) => {
  const startTime = Date.now();

  try {
    // Parse parameters
    const { postId, commentId } = await props.params;

    // Validate parameter formats
    if (!postId || typeof postId !== 'string') {
      logger.warn('[REPLIES_GET] Invalid postId', { postId });
      return createErrorResponse(ApiError.badRequest('Invalid post ID'));
    }

    if (!commentId || typeof commentId !== 'string') {
      logger.warn('[REPLIES_GET] Invalid commentId', { commentId });
      return createErrorResponse(ApiError.badRequest('Invalid comment ID'));
    }

    // Verify comment exists
    const comment = await db.comment.findFirst({
      where: {
        id: commentId,
        postId,
      },
      select: {
        id: true,
      },
    });

    if (!comment) {
      logger.warn('[REPLIES_GET] Comment not found', { commentId, postId });
      return createErrorResponse(ApiError.notFound('Comment not found'));
    }

    // Fetch replies with relations
    const replies = await db.reply.findMany({
      where: {
        commentId,
      },
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
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 30,
    });

    const duration = Date.now() - startTime;
    logger.info('[REPLIES_GET] Replies fetched successfully', {
      commentId,
      postId,
      count: replies.length,
      duration,
    });

    return createSuccessResponse(replies, 200);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('[REPLIES_GET] Error fetching replies', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
    });
    return createErrorResponse(ApiError.internal('Failed to fetch replies'));
  }
});

