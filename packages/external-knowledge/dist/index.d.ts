import { z } from 'zod';

/**
 * @sam-ai/external-knowledge - Type Definitions
 * Types for external knowledge integration
 */

declare const ExternalSourceTypeSchema: z.ZodEnum<["news", "research", "documentation", "tutorial", "video", "course", "book", "article", "podcast", "community"]>;
type ExternalSourceType = z.infer<typeof ExternalSourceTypeSchema>;
declare const ContentQualitySchema: z.ZodEnum<["high", "medium", "low", "unknown"]>;
type ContentQuality = z.infer<typeof ContentQualitySchema>;
declare const ExternalContentSchema: z.ZodObject<{
    id: z.ZodString;
    sourceType: z.ZodEnum<["news", "research", "documentation", "tutorial", "video", "course", "book", "article", "podcast", "community"]>;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    url: z.ZodString;
    author: z.ZodOptional<z.ZodString>;
    publishedAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
    quality: z.ZodDefault<z.ZodEnum<["high", "medium", "low", "unknown"]>>;
    relevanceScore: z.ZodOptional<z.ZodNumber>;
    topics: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    language: z.ZodDefault<z.ZodString>;
    readTimeMinutes: z.ZodOptional<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    sourceType: "news" | "research" | "documentation" | "tutorial" | "video" | "course" | "book" | "article" | "podcast" | "community";
    title: string;
    url: string;
    quality: "high" | "medium" | "low" | "unknown";
    topics: string[];
    tags: string[];
    language: string;
    description?: string | undefined;
    author?: string | undefined;
    publishedAt?: Date | undefined;
    updatedAt?: Date | undefined;
    relevanceScore?: number | undefined;
    readTimeMinutes?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    id: string;
    sourceType: "news" | "research" | "documentation" | "tutorial" | "video" | "course" | "book" | "article" | "podcast" | "community";
    title: string;
    url: string;
    description?: string | undefined;
    author?: string | undefined;
    publishedAt?: Date | undefined;
    updatedAt?: Date | undefined;
    quality?: "high" | "medium" | "low" | "unknown" | undefined;
    relevanceScore?: number | undefined;
    topics?: string[] | undefined;
    tags?: string[] | undefined;
    language?: string | undefined;
    readTimeMinutes?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
type ExternalContent = z.infer<typeof ExternalContentSchema>;
declare const NewsArticleSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    url: z.ZodString;
    author: z.ZodOptional<z.ZodString>;
    publishedAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
    quality: z.ZodDefault<z.ZodEnum<["high", "medium", "low", "unknown"]>>;
    relevanceScore: z.ZodOptional<z.ZodNumber>;
    topics: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    language: z.ZodDefault<z.ZodString>;
    readTimeMinutes: z.ZodOptional<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    sourceType: z.ZodLiteral<"news">;
    source: z.ZodString;
    category: z.ZodOptional<z.ZodString>;
    sentiment: z.ZodOptional<z.ZodEnum<["positive", "negative", "neutral"]>>;
    imageUrl: z.ZodOptional<z.ZodString>;
    summary: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    sourceType: "news";
    title: string;
    url: string;
    quality: "high" | "medium" | "low" | "unknown";
    topics: string[];
    tags: string[];
    language: string;
    source: string;
    description?: string | undefined;
    author?: string | undefined;
    publishedAt?: Date | undefined;
    updatedAt?: Date | undefined;
    relevanceScore?: number | undefined;
    readTimeMinutes?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
    category?: string | undefined;
    sentiment?: "positive" | "negative" | "neutral" | undefined;
    imageUrl?: string | undefined;
    summary?: string | undefined;
}, {
    id: string;
    sourceType: "news";
    title: string;
    url: string;
    source: string;
    description?: string | undefined;
    author?: string | undefined;
    publishedAt?: Date | undefined;
    updatedAt?: Date | undefined;
    quality?: "high" | "medium" | "low" | "unknown" | undefined;
    relevanceScore?: number | undefined;
    topics?: string[] | undefined;
    tags?: string[] | undefined;
    language?: string | undefined;
    readTimeMinutes?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
    category?: string | undefined;
    sentiment?: "positive" | "negative" | "neutral" | undefined;
    imageUrl?: string | undefined;
    summary?: string | undefined;
}>;
type NewsArticle = z.infer<typeof NewsArticleSchema>;
interface NewsSearchOptions {
    query: string;
    topics?: string[];
    sources?: string[];
    language?: string;
    from?: Date;
    to?: Date;
    limit?: number;
    sortBy?: 'relevance' | 'date' | 'popularity';
}
declare const ResearchPaperSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    url: z.ZodString;
    author: z.ZodOptional<z.ZodString>;
    publishedAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
    quality: z.ZodDefault<z.ZodEnum<["high", "medium", "low", "unknown"]>>;
    relevanceScore: z.ZodOptional<z.ZodNumber>;
    topics: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    language: z.ZodDefault<z.ZodString>;
    readTimeMinutes: z.ZodOptional<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    sourceType: z.ZodLiteral<"research">;
    authors: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    abstract: z.ZodOptional<z.ZodString>;
    doi: z.ZodOptional<z.ZodString>;
    arxivId: z.ZodOptional<z.ZodString>;
    journal: z.ZodOptional<z.ZodString>;
    citations: z.ZodOptional<z.ZodNumber>;
    keywords: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    pdfUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    sourceType: "research";
    title: string;
    url: string;
    quality: "high" | "medium" | "low" | "unknown";
    topics: string[];
    tags: string[];
    language: string;
    authors: string[];
    keywords: string[];
    description?: string | undefined;
    author?: string | undefined;
    publishedAt?: Date | undefined;
    updatedAt?: Date | undefined;
    relevanceScore?: number | undefined;
    readTimeMinutes?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
    abstract?: string | undefined;
    doi?: string | undefined;
    arxivId?: string | undefined;
    journal?: string | undefined;
    citations?: number | undefined;
    pdfUrl?: string | undefined;
}, {
    id: string;
    sourceType: "research";
    title: string;
    url: string;
    description?: string | undefined;
    author?: string | undefined;
    publishedAt?: Date | undefined;
    updatedAt?: Date | undefined;
    quality?: "high" | "medium" | "low" | "unknown" | undefined;
    relevanceScore?: number | undefined;
    topics?: string[] | undefined;
    tags?: string[] | undefined;
    language?: string | undefined;
    readTimeMinutes?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
    authors?: string[] | undefined;
    abstract?: string | undefined;
    doi?: string | undefined;
    arxivId?: string | undefined;
    journal?: string | undefined;
    citations?: number | undefined;
    keywords?: string[] | undefined;
    pdfUrl?: string | undefined;
}>;
type ResearchPaper = z.infer<typeof ResearchPaperSchema>;
interface ResearchSearchOptions {
    query: string;
    fields?: string[];
    authors?: string[];
    journals?: string[];
    yearFrom?: number;
    yearTo?: number;
    minCitations?: number;
    limit?: number;
    sortBy?: 'relevance' | 'date' | 'citations';
}
declare const DocumentationSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    url: z.ZodString;
    author: z.ZodOptional<z.ZodString>;
    publishedAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
    quality: z.ZodDefault<z.ZodEnum<["high", "medium", "low", "unknown"]>>;
    relevanceScore: z.ZodOptional<z.ZodNumber>;
    topics: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    language: z.ZodDefault<z.ZodString>;
    readTimeMinutes: z.ZodOptional<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
} & {
    sourceType: z.ZodLiteral<"documentation">;
    framework: z.ZodOptional<z.ZodString>;
    version: z.ZodOptional<z.ZodString>;
    section: z.ZodOptional<z.ZodString>;
    codeExamples: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    sourceType: "documentation";
    title: string;
    url: string;
    quality: "high" | "medium" | "low" | "unknown";
    topics: string[];
    tags: string[];
    language: string;
    codeExamples: string[];
    description?: string | undefined;
    author?: string | undefined;
    publishedAt?: Date | undefined;
    updatedAt?: Date | undefined;
    relevanceScore?: number | undefined;
    readTimeMinutes?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
    framework?: string | undefined;
    version?: string | undefined;
    section?: string | undefined;
}, {
    id: string;
    sourceType: "documentation";
    title: string;
    url: string;
    description?: string | undefined;
    author?: string | undefined;
    publishedAt?: Date | undefined;
    updatedAt?: Date | undefined;
    quality?: "high" | "medium" | "low" | "unknown" | undefined;
    relevanceScore?: number | undefined;
    topics?: string[] | undefined;
    tags?: string[] | undefined;
    language?: string | undefined;
    readTimeMinutes?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
    framework?: string | undefined;
    version?: string | undefined;
    section?: string | undefined;
    codeExamples?: string[] | undefined;
}>;
type Documentation = z.infer<typeof DocumentationSchema>;
interface DocumentationSearchOptions {
    query: string;
    frameworks?: string[];
    versions?: string[];
    language?: string;
    limit?: number;
}
interface NewsProvider {
    name: string;
    search(options: NewsSearchOptions): Promise<NewsArticle[]>;
    getTrending(topics?: string[], limit?: number): Promise<NewsArticle[]>;
    getByCategory(category: string, limit?: number): Promise<NewsArticle[]>;
}
interface ResearchProvider {
    name: string;
    search(options: ResearchSearchOptions): Promise<ResearchPaper[]>;
    getByDoi(doi: string): Promise<ResearchPaper | null>;
    getByArxivId(arxivId: string): Promise<ResearchPaper | null>;
    getCitations(paperId: string): Promise<ResearchPaper[]>;
}
interface DocumentationProvider {
    name: string;
    search(options: DocumentationSearchOptions): Promise<Documentation[]>;
    getForFramework(framework: string, version?: string): Promise<Documentation[]>;
}
interface WebContentProvider {
    name: string;
    fetch(url: string): Promise<ExternalContent | null>;
    extract(url: string): Promise<{
        title: string;
        content: string;
        metadata: Record<string, unknown>;
    } | null>;
}
interface AggregatedSearchResult {
    content: ExternalContent[];
    totalResults: number;
    sources: string[];
    searchTime: number;
    query: string;
}
interface ContentRecommendation {
    content: ExternalContent;
    reason: string;
    confidence: number;
    relatedTopics: string[];
}
interface ContentCache {
    get(key: string): Promise<ExternalContent | null>;
    set(key: string, content: ExternalContent, ttl?: number): Promise<void>;
    delete(key: string): Promise<boolean>;
    clear(): Promise<void>;
}
interface ExternalKnowledgeLogger {
    debug(message: string, data?: Record<string, unknown>): void;
    info(message: string, data?: Record<string, unknown>): void;
    warn(message: string, data?: Record<string, unknown>): void;
    error(message: string, data?: Record<string, unknown>): void;
}
interface ExternalKnowledgeConfig {
    newsProviders?: NewsProvider[];
    researchProviders?: ResearchProvider[];
    documentationProviders?: DocumentationProvider[];
    webContentProvider?: WebContentProvider;
    cache?: ContentCache;
    logger?: ExternalKnowledgeLogger;
    defaultLimit?: number;
    cacheTTL?: number;
    rateLimitPerMinute?: number;
}

/**
 * @sam-ai/external-knowledge - News Module Types
 * Types for news ranking and analysis
 */

interface RankingCriteria {
    freshness: number;
    relevance: number;
    impact: number;
    credibility: number;
    virality: number;
    innovation: number;
    educational: number;
    practicality: number;
}
type RankingCriteriaKey = keyof RankingCriteria;
interface RankingWeights {
    freshness: number;
    relevance: number;
    impact: number;
    credibility: number;
    virality: number;
    innovation: number;
    educational: number;
    practicality: number;
}
declare const DEFAULT_RANKING_WEIGHTS: RankingWeights;
type TrendingStatus = 'hot' | 'rising' | 'steady' | 'new';
declare const NewsSourceTypeSchema: z.ZodEnum<["official", "research", "media", "blog", "social"]>;
type NewsSourceType = z.infer<typeof NewsSourceTypeSchema>;
interface NewsSourceInfo {
    name: string;
    url: string;
    credibility?: number;
    type?: NewsSourceType;
    country?: string;
}
declare const ImpactLevelSchema: z.ZodEnum<["low", "medium", "high", "critical"]>;
type ImpactLevel = z.infer<typeof ImpactLevelSchema>;
declare const TechnicalDepthSchema: z.ZodEnum<["beginner", "intermediate", "advanced", "expert"]>;
type TechnicalDepth = z.infer<typeof TechnicalDepthSchema>;
declare const NewsCategorySchema: z.ZodEnum<["breakthrough", "research", "industry", "policy", "education", "ethics", "startup", "investment", "product-launch", "partnership"]>;
type NewsCategory = z.infer<typeof NewsCategorySchema>;
interface NewsImage {
    url: string;
    caption: string;
    credit?: string;
}
interface Citation {
    text: string;
    source: string;
    url?: string;
}
interface RankerNewsArticle {
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
interface RankedNewsArticle extends RankerNewsArticle {
    rankingScore: number;
    rankingDetails: RankingCriteria;
    trendingStatus?: TrendingStatus;
    qualityBadges?: string[];
}
declare const DEFAULT_SOURCE_CREDIBILITY: Record<string, number>;
declare const AI_KEYWORDS: {
    readonly breakthrough: readonly ["breakthrough", "revolutionary", "groundbreaking", "novel", "first"];
    readonly technology: readonly ["gpt", "llm", "transformer", "neural", "deep learning", "machine learning", "ai model"];
    readonly research: readonly ["paper", "study", "research", "findings", "discovery", "analysis"];
    readonly industry: readonly ["google", "openai", "microsoft", "meta", "anthropic", "deepmind", "nvidia"];
    readonly application: readonly ["production", "deployment", "implementation", "integration", "real-world"];
    readonly impact: readonly ["billion", "million users", "industry-wide", "global", "significant"];
};
type AIKeywordCategory = keyof typeof AI_KEYWORDS;

/**
 * @sam-ai/external-knowledge - News Ranking Engine
 * Intelligent news ranking based on multiple criteria
 */

interface NewsRankingEngineConfig {
    weights?: Partial<RankingWeights>;
    sourceCredibility?: Record<string, number>;
}
declare class NewsRankingEngine {
    private readonly weights;
    private readonly sourceCredibility;
    constructor(config?: NewsRankingEngineConfig);
    /**
     * Rank news articles based on multiple criteria
     */
    rankNews(articles: RankerNewsArticle[]): Promise<RankedNewsArticle[]>;
    /**
     * Calculate all ranking criteria for an article
     */
    private calculateRankingCriteria;
    /**
     * Calculate freshness score based on publish date
     */
    private calculateFreshness;
    /**
     * Calculate AI/ML relevance based on content analysis
     */
    private calculateAIRelevance;
    /**
     * Calculate impact score based on various factors
     */
    private calculateImpact;
    /**
     * Calculate source credibility
     */
    private calculateCredibility;
    /**
     * Calculate virality/engagement score
     */
    private calculateVirality;
    /**
     * Calculate innovation score
     */
    private calculateInnovation;
    /**
     * Calculate educational value
     */
    private calculateEducationalValue;
    /**
     * Calculate practicality score
     */
    private calculatePracticality;
    /**
     * Calculate overall ranking score
     */
    private calculateOverallScore;
    /**
     * Determine trending status
     */
    private determineTrendingStatus;
    /**
     * Assign quality badges based on article characteristics
     */
    private assignQualityBadges;
    /**
     * Get top news by specific criteria
     */
    getTopNewsByCriteria(articles: RankerNewsArticle[], criteria: RankingCriteriaKey, limit?: number): Promise<RankedNewsArticle[]>;
    /**
     * Get trending news (hot + rising)
     */
    getTrendingNews(articles: RankerNewsArticle[], limit?: number): Promise<RankedNewsArticle[]>;
    /**
     * Update ranking weights
     */
    updateWeights(weights: Partial<RankingWeights>): void;
    /**
     * Add or update source credibility
     */
    setSourceCredibility(source: string, credibility: number): void;
    /**
     * Get current weights
     */
    getWeights(): Readonly<RankingWeights>;
}
/**
 * Create a news ranking engine instance
 */
declare function createNewsRankingEngine(config?: NewsRankingEngineConfig): NewsRankingEngine;
/**
 * Get or create the default news ranking engine instance
 */
declare function getNewsRankingEngine(): NewsRankingEngine;

/**
 * @sam-ai/external-knowledge - Content Cache
 * In-memory cache implementation for external content
 */

declare class InMemoryContentCache implements ContentCache {
    private cache;
    private defaultTTL;
    private cleanupInterval?;
    constructor(defaultTTL?: number);
    get(key: string): Promise<ExternalContent | null>;
    set(key: string, content: ExternalContent, ttl?: number): Promise<void>;
    delete(key: string): Promise<boolean>;
    clear(): Promise<void>;
    private startCleanup;
    stop(): void;
}
declare function createInMemoryCache(defaultTTL?: number): InMemoryContentCache;

/**
 * @sam-ai/external-knowledge - Knowledge Aggregator
 * Aggregates content from multiple external sources
 */

declare class KnowledgeAggregator {
    private newsProviders;
    private researchProviders;
    private documentationProviders;
    private webContentProvider?;
    private cache;
    private logger;
    private defaultLimit;
    private cacheTTL;
    private rateLimitPerMinute;
    private requestCounts;
    constructor(config?: ExternalKnowledgeConfig);
    /**
     * Search news across all providers
     */
    searchNews(options: NewsSearchOptions): Promise<NewsArticle[]>;
    /**
     * Get trending news
     */
    getTrendingNews(topics?: string[], limit?: number): Promise<NewsArticle[]>;
    /**
     * Search research papers across all providers
     */
    searchResearch(options: ResearchSearchOptions): Promise<ResearchPaper[]>;
    /**
     * Get paper by DOI
     */
    getResearchByDoi(doi: string): Promise<ResearchPaper | null>;
    /**
     * Search documentation across all providers
     */
    searchDocumentation(options: DocumentationSearchOptions): Promise<Documentation[]>;
    /**
     * Search across all content types
     */
    search(query: string, options?: {
        types?: ('news' | 'research' | 'documentation')[];
        limit?: number;
        topics?: string[];
    }): Promise<AggregatedSearchResult>;
    /**
     * Fetch content from a URL
     */
    fetchUrl(url: string): Promise<ExternalContent | null>;
    /**
     * Get content recommendations based on topics
     */
    getRecommendations(topics: string[], options?: {
        types?: ('news' | 'research' | 'documentation')[];
        limit?: number;
        excludeIds?: string[];
    }): Promise<ContentRecommendation[]>;
    private checkRateLimit;
    private recordRequest;
    /**
     * Add a news provider
     */
    addNewsProvider(provider: NewsProvider): void;
    /**
     * Add a research provider
     */
    addResearchProvider(provider: ResearchProvider): void;
    /**
     * Add a documentation provider
     */
    addDocumentationProvider(provider: DocumentationProvider): void;
    /**
     * Set web content provider
     */
    setWebContentProvider(provider: WebContentProvider): void;
    /**
     * Get provider stats
     */
    getStats(): {
        newsProviders: number;
        researchProviders: number;
        documentationProviders: number;
        hasWebContentProvider: boolean;
    };
}
declare function createKnowledgeAggregator(config?: ExternalKnowledgeConfig): KnowledgeAggregator;

/**
 * @sam-ai/external-knowledge
 * External knowledge integration for SAM AI Mentor
 *
 * This package provides:
 * - News Integration: Search and aggregate news from multiple sources
 * - News Ranking: Intelligent news ranking based on multiple criteria
 * - Research Integration: Search academic papers and research
 * - Documentation Integration: Search technical documentation
 * - Web Content Extraction: Fetch and extract content from URLs
 * - Caching: Built-in caching for external content
 */

declare const PACKAGE_NAME = "@sam-ai/external-knowledge";
declare const PACKAGE_VERSION = "0.1.0";
/**
 * Package capabilities
 */
declare const EXTERNAL_KNOWLEDGE_CAPABILITIES: {
    readonly NEWS: "external:news";
    readonly NEWS_RANKING: "external:news_ranking";
    readonly RESEARCH: "external:research";
    readonly DOCUMENTATION: "external:documentation";
    readonly WEB_CONTENT: "external:web_content";
    readonly CACHING: "external:caching";
    readonly RECOMMENDATIONS: "external:recommendations";
};
type ExternalKnowledgeCapability = (typeof EXTERNAL_KNOWLEDGE_CAPABILITIES)[keyof typeof EXTERNAL_KNOWLEDGE_CAPABILITIES];
/**
 * Check if a capability is available
 */
declare function hasCapability(capability: ExternalKnowledgeCapability): boolean;

export { type AIKeywordCategory, AI_KEYWORDS, type AggregatedSearchResult, type Citation, type ContentCache, type ContentQuality, ContentQualitySchema, type ContentRecommendation, DEFAULT_RANKING_WEIGHTS, DEFAULT_SOURCE_CREDIBILITY, type Documentation, type DocumentationProvider, DocumentationSchema, type DocumentationSearchOptions, EXTERNAL_KNOWLEDGE_CAPABILITIES, type ExternalContent, ExternalContentSchema, type ExternalKnowledgeCapability, type ExternalKnowledgeConfig, type ExternalKnowledgeLogger, type ExternalSourceType, ExternalSourceTypeSchema, type ImpactLevel, ImpactLevelSchema, InMemoryContentCache, KnowledgeAggregator, type NewsArticle, NewsArticleSchema, type NewsCategory, NewsCategorySchema, type NewsImage, type NewsProvider, NewsRankingEngine, type NewsRankingEngineConfig, type NewsSearchOptions, type NewsSourceInfo, type NewsSourceType, NewsSourceTypeSchema, PACKAGE_NAME, PACKAGE_VERSION, type RankedNewsArticle, type RankerNewsArticle, type RankingCriteria, type RankingCriteriaKey, type RankingWeights, type ResearchPaper, ResearchPaperSchema, type ResearchProvider, type ResearchSearchOptions, type TechnicalDepth, TechnicalDepthSchema, type TrendingStatus, type WebContentProvider, createInMemoryCache, createKnowledgeAggregator, createNewsRankingEngine, getNewsRankingEngine, hasCapability };
