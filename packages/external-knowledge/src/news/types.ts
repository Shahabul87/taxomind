/**
 * @sam-ai/external-knowledge - News Module Types
 * Types for news ranking and analysis
 */

import { z } from 'zod';

// ============================================================================
// RANKING CRITERIA
// ============================================================================

export interface RankingCriteria {
  freshness: number;        // 0-100: How recent the news is
  relevance: number;        // 0-100: AI/ML relevance score
  impact: number;           // 0-100: Industry impact score
  credibility: number;      // 0-100: Source credibility
  virality: number;         // 0-100: Social engagement/shares
  innovation: number;       // 0-100: Technical innovation score
  educational: number;      // 0-100: Educational value
  practicality: number;     // 0-100: Real-world application
}

export type RankingCriteriaKey = keyof RankingCriteria;

// ============================================================================
// RANKING WEIGHTS
// ============================================================================

export interface RankingWeights {
  freshness: number;
  relevance: number;
  impact: number;
  credibility: number;
  virality: number;
  innovation: number;
  educational: number;
  practicality: number;
}

export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  freshness: 0.25,      // 25% - Prioritize recent news
  relevance: 0.20,      // 20% - AI/ML specific relevance
  impact: 0.15,         // 15% - Industry/research impact
  credibility: 0.15,    // 15% - Source credibility
  virality: 0.10,       // 10% - Social engagement
  innovation: 0.08,     // 8% - Technical innovation
  educational: 0.05,    // 5% - Educational value
  practicality: 0.02    // 2% - Practical applications
};

// ============================================================================
// TRENDING STATUS
// ============================================================================

export type TrendingStatus = 'hot' | 'rising' | 'steady' | 'new';

// ============================================================================
// NEWS SOURCE TYPES
// ============================================================================

export const NewsSourceTypeSchema = z.enum([
  'official',
  'research',
  'media',
  'blog',
  'social',
]);
export type NewsSourceType = z.infer<typeof NewsSourceTypeSchema>;

export interface NewsSourceInfo {
  name: string;
  url: string;
  credibility?: number;
  type?: NewsSourceType;
  country?: string;
}

// ============================================================================
// IMPACT LEVEL
// ============================================================================

export const ImpactLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);
export type ImpactLevel = z.infer<typeof ImpactLevelSchema>;

// ============================================================================
// TECHNICAL DEPTH
// ============================================================================

export const TechnicalDepthSchema = z.enum([
  'beginner',
  'intermediate',
  'advanced',
  'expert',
]);
export type TechnicalDepth = z.infer<typeof TechnicalDepthSchema>;

// ============================================================================
// NEWS CATEGORY
// ============================================================================

export const NewsCategorySchema = z.enum([
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
]);
export type NewsCategory = z.infer<typeof NewsCategorySchema>;

// ============================================================================
// RANKER NEWS ARTICLE
// ============================================================================

export interface NewsImage {
  url: string;
  caption: string;
  credit?: string;
}

export interface Citation {
  text: string;
  source: string;
  url?: string;
}

export interface RankerNewsArticle {
  articleId: string;
  title: string;
  summary: string;
  content?: string;
  articleUrl: string;
  category: NewsCategory;
  tags: string[];
  source: NewsSourceInfo;
  author?: string;
  publishDate: Date;
  relevanceScore?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  impactLevel: ImpactLevel;
  readingTime?: number;
  keyTakeaways?: string[];
  relatedArticles?: string[];
  educationalValue?: number;
  technicalDepth?: TechnicalDepth;
  images?: NewsImage[];
  citations?: Citation[];
}

// ============================================================================
// RANKED NEWS ARTICLE
// ============================================================================

export interface RankedNewsArticle extends RankerNewsArticle {
  rankingScore: number;
  rankingDetails: RankingCriteria;
  trendingStatus?: TrendingStatus;
  qualityBadges?: string[];
}

// ============================================================================
// SOURCE CREDIBILITY DATABASE
// ============================================================================

export const DEFAULT_SOURCE_CREDIBILITY: Record<string, number> = {
  'OpenAI Blog': 95,
  'Google DeepMind': 98,
  'Microsoft News': 95,
  'MIT Technology Review': 92,
  'Stanford HAI': 97,
  'Nature': 100,
  'Science': 100,
  'arXiv': 85,
  'TechCrunch': 80,
  'The Verge': 75,
  'VentureBeat': 78,
  'Wired': 82,
  'IEEE': 90,
  'ACM': 90,
  'European Commission': 100,
  'Reuters': 88,
  'Bloomberg': 85,
};

// ============================================================================
// AI KEYWORDS FOR RELEVANCE SCORING
// ============================================================================

export const AI_KEYWORDS = {
  breakthrough: ['breakthrough', 'revolutionary', 'groundbreaking', 'novel', 'first'],
  technology: ['gpt', 'llm', 'transformer', 'neural', 'deep learning', 'machine learning', 'ai model'],
  research: ['paper', 'study', 'research', 'findings', 'discovery', 'analysis'],
  industry: ['google', 'openai', 'microsoft', 'meta', 'anthropic', 'deepmind', 'nvidia'],
  application: ['production', 'deployment', 'implementation', 'integration', 'real-world'],
  impact: ['billion', 'million users', 'industry-wide', 'global', 'significant'],
} as const;

export type AIKeywordCategory = keyof typeof AI_KEYWORDS;
