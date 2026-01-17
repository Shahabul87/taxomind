/**
 * @sam-ai/external-knowledge - News Module Types
 * Types for news ranking and analysis
 */
import { z } from 'zod';
export interface RankingCriteria {
    freshness: number;
    relevance: number;
    impact: number;
    credibility: number;
    virality: number;
    innovation: number;
    educational: number;
    practicality: number;
}
export type RankingCriteriaKey = keyof RankingCriteria;
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
export declare const DEFAULT_RANKING_WEIGHTS: RankingWeights;
export type TrendingStatus = 'hot' | 'rising' | 'steady' | 'new';
export declare const NewsSourceTypeSchema: z.ZodEnum<["official", "research", "media", "blog", "social"]>;
export type NewsSourceType = z.infer<typeof NewsSourceTypeSchema>;
export interface NewsSourceInfo {
    name: string;
    url: string;
    credibility?: number;
    type?: NewsSourceType;
    country?: string;
}
export declare const ImpactLevelSchema: z.ZodEnum<["low", "medium", "high", "critical"]>;
export type ImpactLevel = z.infer<typeof ImpactLevelSchema>;
export declare const TechnicalDepthSchema: z.ZodEnum<["beginner", "intermediate", "advanced", "expert"]>;
export type TechnicalDepth = z.infer<typeof TechnicalDepthSchema>;
export declare const NewsCategorySchema: z.ZodEnum<["breakthrough", "research", "industry", "policy", "education", "ethics", "startup", "investment", "product-launch", "partnership"]>;
export type NewsCategory = z.infer<typeof NewsCategorySchema>;
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
export interface RankedNewsArticle extends RankerNewsArticle {
    rankingScore: number;
    rankingDetails: RankingCriteria;
    trendingStatus?: TrendingStatus;
    qualityBadges?: string[];
}
export declare const DEFAULT_SOURCE_CREDIBILITY: Record<string, number>;
export declare const AI_KEYWORDS: {
    readonly breakthrough: readonly ["breakthrough", "revolutionary", "groundbreaking", "novel", "first"];
    readonly technology: readonly ["gpt", "llm", "transformer", "neural", "deep learning", "machine learning", "ai model"];
    readonly research: readonly ["paper", "study", "research", "findings", "discovery", "analysis"];
    readonly industry: readonly ["google", "openai", "microsoft", "meta", "anthropic", "deepmind", "nvidia"];
    readonly application: readonly ["production", "deployment", "implementation", "integration", "real-world"];
    readonly impact: readonly ["billion", "million users", "industry-wide", "global", "significant"];
};
export type AIKeywordCategory = keyof typeof AI_KEYWORDS;
//# sourceMappingURL=types.d.ts.map