/**
 * @sam-ai/external-knowledge - Type Definitions
 * Types for external knowledge integration
 */
import { z } from 'zod';
export declare const ExternalSourceTypeSchema: z.ZodEnum<["news", "research", "documentation", "tutorial", "video", "course", "book", "article", "podcast", "community"]>;
export type ExternalSourceType = z.infer<typeof ExternalSourceTypeSchema>;
export declare const ContentQualitySchema: z.ZodEnum<["high", "medium", "low", "unknown"]>;
export type ContentQuality = z.infer<typeof ContentQualitySchema>;
export declare const ExternalContentSchema: z.ZodObject<{
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
export type ExternalContent = z.infer<typeof ExternalContentSchema>;
export declare const NewsArticleSchema: z.ZodObject<{
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
export type NewsArticle = z.infer<typeof NewsArticleSchema>;
export interface NewsSearchOptions {
    query: string;
    topics?: string[];
    sources?: string[];
    language?: string;
    from?: Date;
    to?: Date;
    limit?: number;
    sortBy?: 'relevance' | 'date' | 'popularity';
}
export declare const ResearchPaperSchema: z.ZodObject<{
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
export type ResearchPaper = z.infer<typeof ResearchPaperSchema>;
export interface ResearchSearchOptions {
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
export declare const DocumentationSchema: z.ZodObject<{
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
export type Documentation = z.infer<typeof DocumentationSchema>;
export interface DocumentationSearchOptions {
    query: string;
    frameworks?: string[];
    versions?: string[];
    language?: string;
    limit?: number;
}
export interface NewsProvider {
    name: string;
    search(options: NewsSearchOptions): Promise<NewsArticle[]>;
    getTrending(topics?: string[], limit?: number): Promise<NewsArticle[]>;
    getByCategory(category: string, limit?: number): Promise<NewsArticle[]>;
}
export interface ResearchProvider {
    name: string;
    search(options: ResearchSearchOptions): Promise<ResearchPaper[]>;
    getByDoi(doi: string): Promise<ResearchPaper | null>;
    getByArxivId(arxivId: string): Promise<ResearchPaper | null>;
    getCitations(paperId: string): Promise<ResearchPaper[]>;
}
export interface DocumentationProvider {
    name: string;
    search(options: DocumentationSearchOptions): Promise<Documentation[]>;
    getForFramework(framework: string, version?: string): Promise<Documentation[]>;
}
export interface WebContentProvider {
    name: string;
    fetch(url: string): Promise<ExternalContent | null>;
    extract(url: string): Promise<{
        title: string;
        content: string;
        metadata: Record<string, unknown>;
    } | null>;
}
export interface AggregatedSearchResult {
    content: ExternalContent[];
    totalResults: number;
    sources: string[];
    searchTime: number;
    query: string;
}
export interface ContentRecommendation {
    content: ExternalContent;
    reason: string;
    confidence: number;
    relatedTopics: string[];
}
export interface ContentCache {
    get(key: string): Promise<ExternalContent | null>;
    set(key: string, content: ExternalContent, ttl?: number): Promise<void>;
    delete(key: string): Promise<boolean>;
    clear(): Promise<void>;
}
export interface ExternalKnowledgeLogger {
    debug(message: string, data?: Record<string, unknown>): void;
    info(message: string, data?: Record<string, unknown>): void;
    warn(message: string, data?: Record<string, unknown>): void;
    error(message: string, data?: Record<string, unknown>): void;
}
export interface ExternalKnowledgeConfig {
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
//# sourceMappingURL=types.d.ts.map