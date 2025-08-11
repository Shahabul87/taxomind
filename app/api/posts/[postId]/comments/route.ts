import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isRateLimited, getRateLimitMessage } from "@/app/lib/rate-limit";
import { getFromCache, setInCache, getCommentsKey, shouldCachePost, invalidateCache } from "@/app/lib/cache";
import { logger } from '@/lib/logger';

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ postId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check rate limiting
    const rateLimitResult = await isRateLimited(user.id, 'comment');
    if (rateLimitResult.limited) {

      return NextResponse.json({ 
        error: getRateLimitMessage('comment', rateLimitResult.reset),
        rateLimitInfo: rateLimitResult
      }, { status: 429 });
    }

    const { content } = await req.json();
    const params = await props.params;
    const { postId } = params;

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Verify that the post exists
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true }
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const comment = await db.comment.create({
      data: {
        content,
        userId: user.id,
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

    return NextResponse.json(comment);
  } catch (error) {
    logger.error("[COMMENT_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  props: { params: Promise<{ postId: string }> }
) {
  try {
    const params = await props.params;
    const { postId } = params;
    const url = new URL(req.url);
    
    // Get pagination and sorting parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const sortBy = url.searchParams.get('sortBy') || 'newest';
    
    // Check cache first
    const cacheKey = getCommentsKey(postId, page, sortBy);
    const cachedComments = await getFromCache<any[]>(cacheKey);
    
    if (cachedComments) {

      return NextResponse.json(cachedComments, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=120' // 2 minutes
        }
      });
    }

    // Verify that the post exists
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { id: true }
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
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

    return NextResponse.json(result, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=120' // 2 minutes
      }
    });
  } catch (error) {
    logger.error("[COMMENTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

