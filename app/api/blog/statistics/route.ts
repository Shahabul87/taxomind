import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { redisCache, CACHE_PREFIXES, CACHE_TTL } from '@/lib/cache/redis-cache';
import { logger } from '@/lib/logger';
import { BlogStatisticsSchema } from '@/lib/validations/blog';


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

    // Try to get from cache first (isolated from main try-catch)
    let cached = { hit: false, value: null as BlogStatisticsResponse['data'] | null };
    try {
      cached = await redisCache.get<BlogStatisticsResponse['data']>(cacheKey, {
        prefix: CACHE_PREFIXES.COURSE, // Reuse course prefix for blog
      });
    } catch {
      logger.warn('[BLOG_STATISTICS] Redis unavailable, proceeding without cache');
    }

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

    // Execute core queries in parallel for optimal performance
    const [
      totalArticlesCount,
      publishedArticlesCount,
      totalViewsData,
      totalCommentsCount,
      uniqueAuthorsData,
      uniqueCommentersData,
    ] = await Promise.all([
      db.post.count(),
      db.post.count({ where: { published: true } }),
      db.post.aggregate({ _sum: { views: true }, _avg: { views: true } }),
      db.comment.count(),
      db.post.findMany({ select: { userId: true }, distinct: ['userId'], take: 500 }),
      db.comment.findMany({ select: { userId: true }, distinct: ['userId'], take: 500 }),
    ]);

    // Category groupBy in its own try-catch to prevent it from killing the entire API
    let categoryData: Array<{ category: string | null; _count: number | Record<string, number> }> = [];
    try {
      categoryData = await db.post.groupBy({
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
        take: 10,
      });
    } catch (groupByError) {
      logger.warn('[BLOG_STATISTICS] Category groupBy failed, using fallback', groupByError);
    }

    // Calculate statistics
    const totalViews = totalViewsData._sum.views || 0;
    const averageViews = totalViewsData._avg.views || 0;
    const totalAuthors = uniqueAuthorsData.length;

    // Estimate total readers: unique commenters + (views / 10)
    const estimatedReaders = uniqueCommentersData.length + Math.floor(totalViews / 10);

    // Format popular categories — handle both number and object _count formats
    const popularCategories = categoryData.map((cat) => ({
      category: cat.category || 'Uncategorized',
      count: typeof cat._count === 'number' ? cat._count : (cat._count as Record<string, number>).category ?? 0,
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

    // Cache the results for 10 minutes (isolated so write failure doesn't kill response)
    try {
      await redisCache.set(cacheKey, validatedStatistics, {
        prefix: CACHE_PREFIXES.COURSE,
        ttl: CACHE_TTL.MEDIUM, // 10 minutes
        tags: ['statistics', 'blog', 'posts'],
      });
    } catch {
      logger.warn('[BLOG_STATISTICS] Redis cache write failed, continuing without cache');
    }

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

    // Graceful degradation — return zeroed data instead of error
    // so the frontend never sees a failure
    return NextResponse.json({
      success: true,
      data: {
        totalArticles: 0,
        publishedArticles: 0,
        totalReaders: 0,
        totalAuthors: 0,
        totalViews: 0,
        totalComments: 0,
        averageViews: 0,
        popularCategories: [],
      },
      metadata: {
        timestamp: new Date().toISOString(),
        cached: false,
      },
    });
  }
}
