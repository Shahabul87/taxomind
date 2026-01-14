import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import {
  getExternalKnowledgeAggregator,
  searchNews,
  type NewsArticle as ExternalNewsArticle,
} from '@/lib/sam/external-knowledge-integration';
import {
  getNewsRankingEngine,
  type RankerNewsArticle,
  type NewsCategory as RankerNewsCategory,
} from '@sam-ai/external-knowledge';
import { z } from 'zod';

/**
 * SAM AI News API Route
 *
 * Integrates with @sam-ai/external-knowledge package to provide real AI news
 * from multiple sources (NewsAPI.org, Semantic Scholar, etc.)
 */

// Request validation schema - use nullable().transform() to handle null from searchParams.get()
const QueryParamsSchema = z.object({
  realtime: z.enum(['true', 'false']).nullable().transform(v => v ?? 'false'),
  rank: z.enum(['true', 'false']).nullable().transform(v => v ?? 'true'),
  topic: z.string().nullable().transform(v => v ?? undefined),
  limit: z.coerce.number().min(1).max(100).nullable().transform(v => v ?? 50),
  category: z.string().nullable().transform(v => v ?? undefined),
});

interface NewsArticle {
  articleId: string;
  title: string;
  summary: string;
  content: string;
  articleUrl: string;
  source: {
    name: string;
    url: string;
  };
  author?: string;
  publishDate: Date;
  category: string;
  tags: string[];
  readingTime: number;
  relevanceScore: number;
  impactLevel: 'critical' | 'high' | 'medium' | 'low';
  images?: {
    url: string;
    caption: string;
  }[];
  isBookmarked?: boolean;
  isLiked?: boolean;
  rankingScore?: number;
  trendingStatus?: 'hot' | 'rising' | 'steady' | 'new';
  qualityBadges?: string[];
}

const SUPPORTED_CATEGORIES: RankerNewsCategory[] = [
  'breakthrough',
  'research',
  'industry',
  'policy',
  'education',
  'ethics',
  'startup',
  'investment',
  'product-launch',
  'partnership',
];

const normalizeCategory = (category?: string): RankerNewsCategory => {
  if (!category) return 'industry';
  const normalized = category.toLowerCase();
  const direct = normalized as RankerNewsCategory;

  if (SUPPORTED_CATEGORIES.includes(direct)) return direct;
  if (normalized.includes('product') || normalized.includes('launch')) return 'product-launch';
  if (normalized.includes('startup')) return 'startup';
  if (normalized.includes('policy') || normalized.includes('regulation')) return 'policy';
  if (normalized.includes('research') || normalized.includes('study')) return 'research';
  if (normalized.includes('education') || normalized.includes('learning')) return 'education';
  if (normalized.includes('ethic')) return 'ethics';
  if (normalized.includes('break')) return 'breakthrough';
  if (normalized.includes('invest') || normalized.includes('fund')) return 'investment';
  if (normalized.includes('partner')) return 'partnership';
  if (normalized.includes('industry') || normalized.includes('business')) return 'industry';

  return 'industry';
};

/**
 * Transform external news article to our internal format
 */
function transformExternalNews(article: ExternalNewsArticle): NewsArticle {
  // Calculate reading time - estimate full article length from summary
  // NewsAPI only provides summary/description, not full content
  // Typical news articles are 500-1500 words, summaries are ~30-80 words
  // We estimate full article is ~15x the summary length
  const summaryWordCount = (article.summary ?? '').split(/\s+/).length;
  const estimatedFullArticleWords = Math.max(summaryWordCount * 15, 400); // Minimum 400 words
  const readingTime = Math.max(2, Math.min(15, Math.ceil(estimatedFullArticleWords / 200)));

  // Default relevance score if not provided
  const score = article.relevanceScore ?? 0.5;

  // Determine impact level based on relevance score
  let impactLevel: 'critical' | 'high' | 'medium' | 'low' = 'medium';
  if (score >= 0.9) impactLevel = 'critical';
  else if (score >= 0.7) impactLevel = 'high';
  else if (score >= 0.4) impactLevel = 'medium';
  else impactLevel = 'low';

  // Determine trending status
  const publishedAt = article.publishedAt ?? new Date();
  const ageInHours = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60);
  let trendingStatus: 'hot' | 'rising' | 'steady' | 'new' = 'steady';
  if (ageInHours <= 3 && score >= 0.8) trendingStatus = 'hot';
  else if (ageInHours <= 6 && score >= 0.7) trendingStatus = 'rising';
  else if (ageInHours <= 24) trendingStatus = 'new';

  // Generate quality badges
  const qualityBadges: string[] = [];
  if (article.quality === 'high') qualityBadges.push('Verified Source');
  if (ageInHours <= 3) qualityBadges.push('Breaking News');
  if (score >= 0.9) qualityBadges.push('High Relevance');

  return {
    articleId: article.id,
    title: article.title,
    summary: article.summary ?? '',
    content: article.summary ?? '', // Full content would require fetching
    articleUrl: article.url,
    source: {
      name: article.source,
      url: article.url.split('/').slice(0, 3).join('/'),
    },
    author: undefined, // Not provided by external API
    publishDate: new Date(publishedAt),
    category: article.topics?.[0] ?? 'technology',
    tags: article.tags ?? [],
    readingTime,
    relevanceScore: Math.round(score * 10),
    impactLevel,
    rankingScore: Math.round(score * 100),
    trendingStatus,
    qualityBadges,
  };
}

/**
 * Convert API news article into ranker-compatible shape.
 */
function toRankerArticle(article: NewsArticle): RankerNewsArticle {
  const relevanceScore = Math.min(100, Math.round(article.relevanceScore * 10));
  const category = normalizeCategory(article.category);
  const images = article.images?.map(image => ({
    url: image.url,
    caption: image.caption,
    credit: article.source.name,
  }));

  return {
    articleId: article.articleId,
    title: article.title,
    summary: article.summary,
    content: article.content,
    articleUrl: article.articleUrl,
    category,
    tags: article.tags,
    source: {
      name: article.source.name,
      url: article.source.url,
      credibility: 70,
      type: 'media',
      country: 'Global',
    },
    author: article.author,
    publishDate: article.publishDate,
    relevanceScore,
    sentiment: 'neutral',
    impactLevel: article.impactLevel,
    readingTime: article.readingTime,
    keyTakeaways: [],
    relatedArticles: [],
    educationalValue: relevanceScore,
    technicalDepth: 'intermediate',
    images,
    citations: [],
  };
}

async function rankNewsArticles(articles: NewsArticle[]): Promise<NewsArticle[]> {
  if (articles.length === 0) return [];

  const rankerArticles = articles.map(toRankerArticle);
  const newsRankingEngine = getNewsRankingEngine();
  const rankedArticles = await newsRankingEngine.rankNews(rankerArticles);
  const articlesById = new Map(articles.map(article => [article.articleId, article]));

  const rankedNews: NewsArticle[] = [];
  for (const rankedArticle of rankedArticles) {
    const original = articlesById.get(rankedArticle.articleId);
    if (!original) continue;

    rankedNews.push({
      ...original,
      rankingScore: rankedArticle.rankingScore,
      trendingStatus: rankedArticle.trendingStatus,
      qualityBadges: rankedArticle.qualityBadges,
    });
  }

  return rankedNews;
}

/**
 * Check if real news API is configured (NEWS_API_KEY is set)
 */
function isRealNewsEnabled(): boolean {
  return Boolean(process.env.NEWS_API_KEY);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Validate query parameters
    const parseResult = QueryParamsSchema.safeParse({
      realtime: searchParams.get('realtime'),
      rank: searchParams.get('rank'),
      topic: searchParams.get('topic'),
      limit: searchParams.get('limit'),
      category: searchParams.get('category'),
    });

    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_PARAMS',
          message: 'Invalid query parameters',
          details: parseResult.error.flatten().fieldErrors,
        },
      }, { status: 400 });
    }

    const { realtime, rank, topic, limit, category } = parseResult.data;
    const shouldRank = rank === 'true';

    if (!isRealNewsEnabled()) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NEWS_API_NOT_CONFIGURED',
          message: 'NEWS_API_KEY is required to fetch external AI news.',
        },
      }, { status: 503 });
    }

    logger.info('[AI_NEWS] Fetching real news', { topic, limit, category });

    // Initialize aggregator (singleton, creates once)
    getExternalKnowledgeAggregator();

    // Search for news with topic or default to AI/education
    const searchTopic = topic ?? category ?? 'artificial intelligence education';
    const externalNews = await searchNews(searchTopic, limit);

    let news = externalNews.map(article => transformExternalNews(article));

    if (category) {
      news = news.filter(article =>
        article.category.toLowerCase().includes(category.toLowerCase())
      );
    }

    if (shouldRank) {
      news = await rankNewsArticles(news);
    }

    // Sort by publishDate (newest first) - ensures most recent news appears at top
    news.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

    return NextResponse.json({
      success: true,
      news,
      source: 'real',
      metadata: {
        timestamp: new Date().toISOString(),
        count: news.length,
        version: '2.0.0',
        realApiEnabled: isRealNewsEnabled(),
        usingRealApi: true,
        ranked: shouldRank,
        realtimeRequested: realtime === 'true',
      },
    });
  } catch (error) {
    logger.error('[AI_NEWS] Error fetching AI news', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch AI news',
      },
    }, { status: 500 });
  }
}
