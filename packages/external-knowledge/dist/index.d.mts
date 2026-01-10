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

export { type AggregatedSearchResult, type ContentCache, type ContentQuality, ContentQualitySchema, type ContentRecommendation, type Documentation, type DocumentationProvider, DocumentationSchema, type DocumentationSearchOptions, EXTERNAL_KNOWLEDGE_CAPABILITIES, type ExternalContent, ExternalContentSchema, type ExternalKnowledgeCapability, type ExternalKnowledgeConfig, type ExternalKnowledgeLogger, type ExternalSourceType, ExternalSourceTypeSchema, InMemoryContentCache, KnowledgeAggregator, type NewsArticle, NewsArticleSchema, type NewsProvider, type NewsSearchOptions, PACKAGE_NAME, PACKAGE_VERSION, type ResearchPaper, ResearchPaperSchema, type ResearchProvider, type ResearchSearchOptions, type WebContentProvider, createInMemoryCache, createKnowledgeAggregator, hasCapability };
