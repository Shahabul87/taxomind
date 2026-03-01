"use server";

/**
 * Optimized Post Fetching with Caching and Pagination
 * Replaces get-all-posts.ts with better performance
 */

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';
import { 
  cacheWrapper, 
  getCachedData, 
  createPaginatedResponse,
  getPaginationParams,
  PaginationParams,
  PaginatedResponse,
  CACHE_TAGS,
  CACHE_REVALIDATE_TIMES 
} from '@/lib/api-cache';

interface PostWithRelations {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  published: boolean | null;
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  views: number;
  body: string;
  isArchived: boolean;
  authorId: string | null;
  User: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  comments: {
    id: string;
  }[];
  _count?: {
    comments: number;
  };
}

/**
 * Get paginated posts with caching
 * @param params - Pagination and filter parameters
 */
export async function getPostsOptimized(
  params: PaginationParams & {
    userId?: string;
    published?: boolean;
    search?: string;
  } = {}
): Promise<PaginatedResponse<PostWithRelations>> {
  const user = await currentUser();
  
  // Create cache key
  const cacheKey = `posts:${JSON.stringify(params)}:${user?.id || 'anon'}`;
  
  try {
    return await getCachedData(
      cacheKey,
      async () => {
        const { skip, take, page, limit } = getPaginationParams(params);
        
        // Build where clause
        const where: any = {};
        
        // Default to published posts for non-authors
        if (params.published !== undefined) {
          where.published = params.published;
        } else if (!params.userId || params.userId !== user?.id) {
          where.published = true;
        }
        
        if (params.userId) {
          where.userId = params.userId;
        }
        
        // Note: 'featured' field doesn't exist in the Post model
        // Removed featured filter
        
        if (params.search) {
          where.OR = [
            {
              title: {
                contains: params.search,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: params.search,
                mode: 'insensitive',
              },
            },
            {
              body: {
                contains: params.search,
                mode: 'insensitive',
              },
            },
          ];
        }
        
        // Execute queries in parallel
        const [posts, total] = await Promise.all([
          // Get paginated posts
          db.post.findMany({
            where,
            select: {
              id: true,
              title: true,
              description: true,
              imageUrl: true,
              published: true,
              category: true,
              createdAt: true,
              updatedAt: true,
              userId: true,
              views: true,
              body: true,
              isArchived: true,
              authorId: true,
              User: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
              comments: {
                select: {
                  id: true,
                },
              },
              _count: {
                select: {
                  comments: true,
                },
              },
            },
            orderBy: [
              { createdAt: 'desc' },
            ],
            skip,
            take,
          }),
          // Get total count
          db.post.count({ where }),
        ]);
        
        return createPaginatedResponse(posts, params, total);
      },
      180 // Cache for 3 minutes
    );
  } catch (error: any) {
    logger.error('[GET_POSTS_OPTIMIZED]', error);
    throw new Error('Failed to fetch posts');
  }
}

/**
 * Get featured posts (cached) - Returns most recent published posts
 * Note: 'featured' field doesn't exist in Post model
 */
export const getFeaturedPosts = cacheWrapper(
  async (limit: number = 6) => {
    return getPostsOptimized({
      published: true,
      limit,
      page: 1,
    });
  },
  ['featured-posts'],
  {
    revalidate: CACHE_REVALIDATE_TIMES.POSTS,
    tags: [CACHE_TAGS.POSTS],
  }
);

/**
 * Get recent posts (cached)
 */
export const getRecentPosts = cacheWrapper(
  async (limit: number = 10) => {
    return getPostsOptimized({
      published: true,
      limit,
      page: 1,
    });
  },
  ['recent-posts'],
  {
    revalidate: CACHE_REVALIDATE_TIMES.POSTS,
    tags: [CACHE_TAGS.POSTS],
  }
);

/**
 * Get user posts (cached)
 */
export async function getUserPosts(
  userId: string,
  params: PaginationParams = {}
): Promise<PaginatedResponse<PostWithRelations>> {
  const cacheKey = `user-posts:${userId}:${JSON.stringify(params)}`;
  
  return getCachedData(
    cacheKey,
    async () => {
      return getPostsOptimized({
        ...params,
        userId,
      });
    },
    120 // Cache for 2 minutes
  );
}

/**
 * Search posts (cached with shorter TTL)
 */
export const searchPosts = cacheWrapper(
  async (query: string, params: PaginationParams = {}) => {
    return getPostsOptimized({
      ...params,
      search: query,
      published: true,
    });
  },
  ['search-posts'],
  {
    revalidate: 60, // 1 minute cache for search results
    tags: [CACHE_TAGS.POSTS],
  }
);

/**
 * Get trending posts based on engagement
 */
export const getTrendingPosts = cacheWrapper(
  async (limit: number = 5) => {
    const posts = await db.post.findMany({
      where: {
        published: true,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        published: true,
        category: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        views: true,
        body: true,
        isArchived: true,
        authorId: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        comments: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: [
        {
          views: 'desc',
        },
        {
          comments: {
            _count: 'desc',
          },
        },
      ],
      take: limit,
    });
    
    return posts;
  },
  ['trending-posts'],
  {
    revalidate: 300, // 5 minutes
    tags: [CACHE_TAGS.POSTS],
  }
);

/**
 * Invalidate post caches when posts are updated
 */
export async function invalidatePostCache(postId?: string) {
  const { invalidateCache } = await import('@/lib/api-cache');
  
  // Invalidate specific post cache
  if (postId) {
    await invalidateCache(`*post*${postId}*`);
  }
  
  // Invalidate post lists
  await invalidateCache(`*posts*`);
  
  logger.info(`Post cache invalidated for: ${postId || 'all'}`);
}