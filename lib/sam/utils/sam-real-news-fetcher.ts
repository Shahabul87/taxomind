import { logger } from '@/lib/logger';

/**
 * SAM Real News Fetcher - Stub Implementation
 * This is a minimal stub for backward compatibility
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
 * Fetch AI/tech news (stub)
 */
export async function fetchRealNews(
  category: string = 'ai',
  limit: number = 10
): Promise<NewsArticle[]> {
  logger.info('SAM News Fetcher: Fetch real news (stub)', { category, limit });
  return [];
}

/**
 * Fetch news by query (stub)
 */
export async function fetchNewsByQuery(
  query: string,
  limit: number = 10
): Promise<NewsArticle[]> {
  logger.info('SAM News Fetcher: Fetch by query (stub)', { query, limit });
  return [];
}

/**
 * Get trending topics (stub)
 */
export async function getTrendingTopics(): Promise<string[]> {
  logger.info('SAM News Fetcher: Get trending topics (stub)');
  return [];
}

/**
 * Cache news articles (stub)
 */
export async function cacheNewsArticles(articles: NewsArticle[]): Promise<void> {
  logger.info('SAM News Fetcher: Cache articles (stub)', { count: articles.length });
  // Stub implementation
}

/**
 * Get cached news (stub)
 */
export async function getCachedNews(category: string): Promise<NewsArticle[]> {
  logger.info('SAM News Fetcher: Get cached news (stub)', { category });
  return [];
}

/**
 * Real news fetcher instance (stub)
 */
export const samRealNewsFetcher = {
  fetchNews: fetchRealNews,
  fetchByQuery: fetchNewsByQuery,
  getTrendingTopics,
  cacheArticles: cacheNewsArticles,
  getCached: getCachedNews
};
