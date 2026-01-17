/**
 * @sam-ai/external-knowledge - Knowledge Aggregator
 * Aggregates content from multiple external sources
 */
import type { ExternalKnowledgeConfig, NewsProvider, ResearchProvider, DocumentationProvider, WebContentProvider, ExternalContent, NewsArticle, ResearchPaper, Documentation, NewsSearchOptions, ResearchSearchOptions, DocumentationSearchOptions, AggregatedSearchResult, ContentRecommendation } from './types';
export declare class KnowledgeAggregator {
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
export declare function createKnowledgeAggregator(config?: ExternalKnowledgeConfig): KnowledgeAggregator;
//# sourceMappingURL=aggregator.d.ts.map