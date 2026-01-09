import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * SAM Real News Fetcher - Platform Updates Implementation
 * Fetches internal platform news, course updates, and announcements
 */

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  category?: string;
  relevanceScore?: number;
}

/**
 * Fetch platform news (recent course publications, blog posts, announcements)
 */
export async function fetchRealNews(
  category: string = 'all',
  limit: number = 10
): Promise<NewsArticle[]> {
  try {
    const articles: NewsArticle[] = [];

    // Fetch recent published courses
    if (category === 'all' || category === 'courses') {
      const recentCourses = await db.course.findMany({
        where: { isPublished: true },
        orderBy: { updatedAt: 'desc' },
        take: Math.floor(limit / 2),
        select: {
          id: true,
          title: true,
          description: true,
          updatedAt: true,
          category: { select: { name: true } },
        },
      });

      articles.push(
        ...recentCourses.map((course) => ({
          id: `course-${course.id}`,
          title: `New Course: ${course.title}`,
          description: course.description ?? 'A new course is available for learning.',
          url: `/courses/${course.id}`,
          source: 'Taxomind Courses',
          publishedAt: course.updatedAt.toISOString(),
          category: course.category?.name ?? 'General',
          relevanceScore: 0.9,
        }))
      );
    }

    // Fetch recent blog posts
    if (category === 'all' || category === 'blog') {
      const recentPosts = await db.post.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        take: Math.floor(limit / 2),
        select: {
          id: true,
          title: true,
          description: true,
          createdAt: true,
        },
      });

      articles.push(
        ...recentPosts.map((post) => ({
          id: `post-${post.id}`,
          title: post.title,
          description: post.description ?? 'Read our latest blog post.',
          url: `/blog/${post.id}`,
          source: 'Taxomind Blog',
          publishedAt: post.createdAt.toISOString(),
          category: 'Blog',
          relevanceScore: 0.8,
        }))
      );
    }

    // Sort by published date descending
    articles.sort((a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    return articles.slice(0, limit);
  } catch (error) {
    logger.error('SAM News Fetcher: Failed to fetch news', { category, limit, error });
    return [];
  }
}

/**
 * Fetch news by search query
 */
export async function fetchNewsByQuery(
  query: string,
  limit: number = 10
): Promise<NewsArticle[]> {
  try {
    const articles: NewsArticle[] = [];

    // Search courses
    const courses = await db.course.findMany({
      where: {
        isPublished: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        updatedAt: true,
        category: { select: { name: true } },
      },
    });

    articles.push(
      ...courses.map((course) => ({
        id: `course-${course.id}`,
        title: course.title,
        description: course.description ?? '',
        url: `/courses/${course.id}`,
        source: 'Taxomind Courses',
        publishedAt: course.updatedAt.toISOString(),
        category: course.category?.name ?? 'General',
        relevanceScore: 0.9,
      }))
    );

    // Search blog posts
    const posts = await db.post.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
      },
    });

    articles.push(
      ...posts.map((post) => ({
        id: `post-${post.id}`,
        title: post.title,
        description: post.description ?? '',
        url: `/blog/${post.id}`,
        source: 'Taxomind Blog',
        publishedAt: post.createdAt.toISOString(),
        category: 'Blog',
        relevanceScore: 0.8,
      }))
    );

    return articles.slice(0, limit);
  } catch (error) {
    logger.error('SAM News Fetcher: Failed to search news', { query, limit, error });
    return [];
  }
}

/**
 * Get trending topics based on recent activity
 */
export async function getTrendingTopics(): Promise<string[]> {
  try {
    // Get popular categories from recent enrollments
    const popularCategories = await db.category.findMany({
      where: {
        courses: {
          some: {
            isPublished: true,
          },
        },
      },
      select: {
        name: true,
        _count: {
          select: { courses: true },
        },
      },
      orderBy: {
        courses: { _count: 'desc' },
      },
      take: 10,
    });

    return popularCategories.map((cat) => cat.name);
  } catch (error) {
    logger.error('SAM News Fetcher: Failed to get trending topics', { error });
    return [];
  }
}

/**
 * Cache news articles in memory (simple in-memory cache)
 */
const newsCache = new Map<string, { articles: NewsArticle[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function cacheNewsArticles(articles: NewsArticle[], category: string = 'all'): Promise<void> {
  newsCache.set(category, {
    articles,
    timestamp: Date.now(),
  });
  logger.debug('SAM News Fetcher: Cached articles', { category, count: articles.length });
}

/**
 * Get cached news (with TTL check)
 */
export async function getCachedNews(category: string): Promise<NewsArticle[]> {
  const cached = newsCache.get(category);

  if (!cached) {
    return [];
  }

  // Check if cache is expired
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    newsCache.delete(category);
    return [];
  }

  return cached.articles;
}

/**
 * Get news with caching
 */
export async function getNews(category: string = 'all', limit: number = 10): Promise<NewsArticle[]> {
  // Check cache first
  const cached = await getCachedNews(category);
  if (cached.length > 0) {
    return cached.slice(0, limit);
  }

  // Fetch fresh news
  const articles = await fetchRealNews(category, limit);

  // Cache the results
  await cacheNewsArticles(articles, category);

  return articles;
}

/**
 * Real news fetcher instance
 */
export const samRealNewsFetcher = {
  fetchNews: fetchRealNews,
  fetchByQuery: fetchNewsByQuery,
  getTrendingTopics,
  cacheArticles: cacheNewsArticles,
  getCached: getCachedNews,
  getNews,
};
