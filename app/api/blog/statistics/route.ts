import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { redisCache, CACHE_PREFIXES, CACHE_TTL } from '@/lib/cache/redis-cache';
import { logger } from '@/lib/logger';
import { BlogStatisticsSchema } from '@/lib/validations/blog';
import { safeErrorResponse } from '@/lib/api/safe-error';

// Force Node.js runtime
export const runtime = 'nodejs';

/**
 * Blog Statistics Response Interface
 * Contains platform-wide statistics for blog posts, readers, and authors
 */
interface BlogStatisticsResponse {
  success: boolean;
  data?: {
    totalArticles: number;
    publishedArticles: number;
    totalReaders: number;
    totalAuthors: number;
    totalViews: number;
    totalComments: number;
    averageViews: number;
    popularCategories: Array<{ category: string; count: number }>;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    timestamp: string;
    cached: boolean;
    ttl?: number;
  };
}

/**
 * GET /api/blog/statistics
 *
 * Public endpoint to fetch platform-wide blog statistics
 *
 * Returns:
 * - Total articles (all and published)
 * - Total readers (unique commenters and viewers estimate)
 * - Total authors (unique post creators)
 * - Total views across all posts
 * - Total comments
 * - Average views per post
 * - Popular categories with counts
 *
 * Features:
 * - Redis caching (10 minutes TTL)
 * - Comprehensive error handling
 * - Parallel query execution for performance
 * - Type-safe responses
 */
export async function GET(req: Request): Promise<NextResponse<BlogStatisticsResponse>> {
  try {
    const cacheKey = 'blog:statistics';

    // Try to get from cache first
    const cached = await redisCache.get<BlogStatisticsResponse['data']>(cacheKey, {
      prefix: CACHE_PREFIXES.COURSE, // Reuse course prefix for blog
    });

    if (cached.hit && cached.value) {
      logger.info('[BLOG_STATISTICS] Cache hit for blog statistics');
      return NextResponse.json({
        success: true,
        data: cached.value,
        metadata: {
          timestamp: new Date().toISOString(),
          cached: true,
        },
      });
    }

    // Execute all queries in parallel for optimal performance
    const [
      totalArticlesCount,
      publishedArticlesCount,
      totalViewsData,
      totalCommentsCount,
      uniqueAuthorsData,
      uniqueCommentersData,
      categoryData,
    ] = await Promise.all([
      // Total articles (all statuses)
      db.post.count(),

      // Published articles only
      db.post.count({
        where: { published: true },
      }),

      // Total views across all posts
      db.post.aggregate({
        _sum: { views: true },
        _avg: { views: true },
      }),

      // Total comments count
      db.comment.count(),

      // Unique authors (users who created posts)
      db.post.findMany({
        select: { userId: true },
        distinct: ['userId'],
      }),

      // Unique commenters (approximation of active readers)
      db.comment.findMany({
        select: { userId: true },
        distinct: ['userId'],
      }),

      // Popular categories with counts
      db.post.groupBy({
        by: ['category'],
        where: {
          published: true,
          category: { not: null },
        },
        _count: true,
        orderBy: {
          _count: {
            category: 'desc',
          },
        },
        take: 10, // Top 10 categories
      }),
    ]);

    // Calculate statistics
    const totalViews = totalViewsData._sum.views || 0;
    const averageViews = totalViewsData._avg.views || 0;
    const totalAuthors = uniqueAuthorsData.length;

    // Estimate total readers: unique commenters + (views / 10)
    // Assuming roughly 1 in 10 readers leaves a comment
    const estimatedReaders = uniqueCommentersData.length + Math.floor(totalViews / 10);

    // Format popular categories
    const popularCategories = categoryData.map((cat) => ({
      category: cat.category || 'Uncategorized',
      count: cat._count,
    }));

    // Build statistics response
    const statistics = {
      totalArticles: totalArticlesCount,
      publishedArticles: publishedArticlesCount,
      totalReaders: estimatedReaders,
      totalAuthors,
      totalViews,
      totalComments: totalCommentsCount,
      averageViews: Math.round(averageViews),
      popularCategories,
    };

    // Validate statistics before returning/caching
    const validatedStatistics = BlogStatisticsSchema.parse(statistics);

    // Cache the results for 10 minutes
    await redisCache.set(cacheKey, validatedStatistics, {
      prefix: CACHE_PREFIXES.COURSE,
      ttl: CACHE_TTL.MEDIUM, // 10 minutes
      tags: ['statistics', 'blog', 'posts'],
    });

    logger.info('[BLOG_STATISTICS] Successfully calculated and cached blog statistics', {
      stats: validatedStatistics,
    });

    return NextResponse.json({
      success: true,
      data: validatedStatistics,
      metadata: {
        timestamp: new Date().toISOString(),
        cached: false,
        ttl: CACHE_TTL.MEDIUM,
      },
    });
  } catch (error) {
    logger.error('[BLOG_STATISTICS] Error fetching blog statistics:', error);
    return safeErrorResponse(error, 500, 'BLOG_STATISTICS');
  }
}
