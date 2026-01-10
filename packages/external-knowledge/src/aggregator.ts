/**
 * @sam-ai/external-knowledge - Knowledge Aggregator
 * Aggregates content from multiple external sources
 */

import type {
  ExternalKnowledgeConfig,
  ExternalKnowledgeLogger,
  NewsProvider,
  ResearchProvider,
  DocumentationProvider,
  WebContentProvider,
  ContentCache,
  ExternalContent,
  NewsArticle,
  ResearchPaper,
  Documentation,
  NewsSearchOptions,
  ResearchSearchOptions,
  DocumentationSearchOptions,
  AggregatedSearchResult,
  ContentRecommendation,
} from './types';
import { InMemoryContentCache } from './cache';

// ============================================================================
// DEFAULT LOGGER
// ============================================================================

const defaultLogger: ExternalKnowledgeLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

// ============================================================================
// KNOWLEDGE AGGREGATOR
// ============================================================================

export class KnowledgeAggregator {
  private newsProviders: NewsProvider[];
  private researchProviders: ResearchProvider[];
  private documentationProviders: DocumentationProvider[];
  private webContentProvider?: WebContentProvider;
  private cache: ContentCache;
  private logger: ExternalKnowledgeLogger;
  private defaultLimit: number;
  private cacheTTL: number;
  private rateLimitPerMinute: number;
  private requestCounts = new Map<string, number[]>();

  constructor(config: ExternalKnowledgeConfig = {}) {
    this.newsProviders = config.newsProviders ?? [];
    this.researchProviders = config.researchProviders ?? [];
    this.documentationProviders = config.documentationProviders ?? [];
    this.webContentProvider = config.webContentProvider;
    this.cache = config.cache ?? new InMemoryContentCache();
    this.logger = config.logger ?? defaultLogger;
    this.defaultLimit = config.defaultLimit ?? 10;
    this.cacheTTL = config.cacheTTL ?? 3600;
    this.rateLimitPerMinute = config.rateLimitPerMinute ?? 60;
  }

  // ============================================================================
  // NEWS SEARCH
  // ============================================================================

  /**
   * Search news across all providers
   */
  async searchNews(options: NewsSearchOptions): Promise<NewsArticle[]> {
    const cacheKey = `news:${JSON.stringify(options)}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return [cached] as NewsArticle[];
    }

    const results: NewsArticle[] = [];
    const limit = options.limit ?? this.defaultLimit;

    for (const provider of this.newsProviders) {
      if (!this.checkRateLimit(provider.name)) {
        this.logger.warn('[KnowledgeAggregator] Rate limit exceeded', {
          provider: provider.name,
        });
        continue;
      }

      try {
        const articles = await provider.search(options);
        results.push(...articles);
        this.recordRequest(provider.name);
      } catch (error) {
        this.logger.error('[KnowledgeAggregator] News search failed', {
          provider: provider.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Sort by relevance and limit
    const sorted = results
      .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
      .slice(0, limit);

    return sorted;
  }

  /**
   * Get trending news
   */
  async getTrendingNews(topics?: string[], limit?: number): Promise<NewsArticle[]> {
    const results: NewsArticle[] = [];

    for (const provider of this.newsProviders) {
      if (!this.checkRateLimit(provider.name)) continue;

      try {
        const articles = await provider.getTrending(topics, limit);
        results.push(...articles);
        this.recordRequest(provider.name);
      } catch (error) {
        this.logger.error('[KnowledgeAggregator] Trending news failed', {
          provider: provider.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results.slice(0, limit ?? this.defaultLimit);
  }

  // ============================================================================
  // RESEARCH SEARCH
  // ============================================================================

  /**
   * Search research papers across all providers
   */
  async searchResearch(options: ResearchSearchOptions): Promise<ResearchPaper[]> {
    const cacheKey = `research:${JSON.stringify(options)}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return [cached] as ResearchPaper[];
    }

    const results: ResearchPaper[] = [];
    const limit = options.limit ?? this.defaultLimit;

    for (const provider of this.researchProviders) {
      if (!this.checkRateLimit(provider.name)) {
        this.logger.warn('[KnowledgeAggregator] Rate limit exceeded', {
          provider: provider.name,
        });
        continue;
      }

      try {
        const papers = await provider.search(options);
        results.push(...papers);
        this.recordRequest(provider.name);
      } catch (error) {
        this.logger.error('[KnowledgeAggregator] Research search failed', {
          provider: provider.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Sort by relevance and limit
    const sorted = results
      .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
      .slice(0, limit);

    return sorted;
  }

  /**
   * Get paper by DOI
   */
  async getResearchByDoi(doi: string): Promise<ResearchPaper | null> {
    const cacheKey = `doi:${doi}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached as ResearchPaper;
    }

    for (const provider of this.researchProviders) {
      if (!this.checkRateLimit(provider.name)) continue;

      try {
        const paper = await provider.getByDoi(doi);
        if (paper) {
          await this.cache.set(cacheKey, paper, this.cacheTTL);
          this.recordRequest(provider.name);
          return paper;
        }
      } catch (error) {
        this.logger.error('[KnowledgeAggregator] Get by DOI failed', {
          provider: provider.name,
          doi,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return null;
  }

  // ============================================================================
  // DOCUMENTATION SEARCH
  // ============================================================================

  /**
   * Search documentation across all providers
   */
  async searchDocumentation(options: DocumentationSearchOptions): Promise<Documentation[]> {
    const cacheKey = `docs:${JSON.stringify(options)}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return [cached] as Documentation[];
    }

    const results: Documentation[] = [];
    const limit = options.limit ?? this.defaultLimit;

    for (const provider of this.documentationProviders) {
      if (!this.checkRateLimit(provider.name)) {
        this.logger.warn('[KnowledgeAggregator] Rate limit exceeded', {
          provider: provider.name,
        });
        continue;
      }

      try {
        const docs = await provider.search(options);
        results.push(...docs);
        this.recordRequest(provider.name);
      } catch (error) {
        this.logger.error('[KnowledgeAggregator] Documentation search failed', {
          provider: provider.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results.slice(0, limit);
  }

  // ============================================================================
  // UNIFIED SEARCH
  // ============================================================================

  /**
   * Search across all content types
   */
  async search(
    query: string,
    options?: {
      types?: ('news' | 'research' | 'documentation')[];
      limit?: number;
      topics?: string[];
    }
  ): Promise<AggregatedSearchResult> {
    const startTime = Date.now();
    const types = options?.types ?? ['news', 'research', 'documentation'];
    const limit = options?.limit ?? this.defaultLimit;
    const results: ExternalContent[] = [];
    const sources: string[] = [];

    // Search each type in parallel
    const searches: Promise<void>[] = [];

    if (types.includes('news')) {
      searches.push(
        this.searchNews({ query, topics: options?.topics, limit }).then((articles) => {
          results.push(...articles);
          sources.push(...this.newsProviders.map((p) => p.name));
        })
      );
    }

    if (types.includes('research')) {
      searches.push(
        this.searchResearch({ query, limit }).then((papers) => {
          results.push(...papers);
          sources.push(...this.researchProviders.map((p) => p.name));
        })
      );
    }

    if (types.includes('documentation')) {
      searches.push(
        this.searchDocumentation({ query, limit }).then((docs) => {
          results.push(...docs);
          sources.push(...this.documentationProviders.map((p) => p.name));
        })
      );
    }

    await Promise.allSettled(searches);

    // Sort by relevance
    results.sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0));

    return {
      content: results.slice(0, limit),
      totalResults: results.length,
      sources: [...new Set(sources)],
      searchTime: Date.now() - startTime,
      query,
    };
  }

  // ============================================================================
  // WEB CONTENT
  // ============================================================================

  /**
   * Fetch content from a URL
   */
  async fetchUrl(url: string): Promise<ExternalContent | null> {
    if (!this.webContentProvider) {
      this.logger.warn('[KnowledgeAggregator] No web content provider configured');
      return null;
    }

    const cacheKey = `url:${url}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const content = await this.webContentProvider.fetch(url);
      if (content) {
        await this.cache.set(cacheKey, content, this.cacheTTL);
      }
      return content;
    } catch (error) {
      this.logger.error('[KnowledgeAggregator] Fetch URL failed', {
        url,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  // ============================================================================
  // RECOMMENDATIONS
  // ============================================================================

  /**
   * Get content recommendations based on topics
   */
  async getRecommendations(
    topics: string[],
    options?: {
      types?: ('news' | 'research' | 'documentation')[];
      limit?: number;
      excludeIds?: string[];
    }
  ): Promise<ContentRecommendation[]> {
    const searchResults = await this.search(topics.join(' '), {
      types: options?.types,
      limit: (options?.limit ?? this.defaultLimit) * 2,
      topics,
    });

    const excludeSet = new Set(options?.excludeIds ?? []);
    const recommendations: ContentRecommendation[] = [];

    for (const content of searchResults.content) {
      if (excludeSet.has(content.id)) continue;

      // Calculate topic overlap
      const contentTopics = new Set([...content.topics, ...content.tags]);
      const matchingTopics = topics.filter((t) =>
        contentTopics.has(t.toLowerCase()) ||
        content.title.toLowerCase().includes(t.toLowerCase())
      );

      if (matchingTopics.length > 0 || (content.relevanceScore ?? 0) > 0.5) {
        recommendations.push({
          content,
          reason: matchingTopics.length > 0
            ? `Matches topics: ${matchingTopics.join(', ')}`
            : 'High relevance score',
          confidence: content.relevanceScore ?? 0.5,
          relatedTopics: matchingTopics,
        });
      }
    }

    // Sort by confidence
    recommendations.sort((a, b) => b.confidence - a.confidence);

    return recommendations.slice(0, options?.limit ?? this.defaultLimit);
  }

  // ============================================================================
  // RATE LIMITING
  // ============================================================================

  private checkRateLimit(provider: string): boolean {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    const requests = this.requestCounts.get(provider) ?? [];
    const recentRequests = requests.filter((t) => t > windowStart);

    return recentRequests.length < this.rateLimitPerMinute;
  }

  private recordRequest(provider: string): void {
    const now = Date.now();
    const requests = this.requestCounts.get(provider) ?? [];
    requests.push(now);

    // Keep only last minute
    const windowStart = now - 60000;
    const filtered = requests.filter((t) => t > windowStart);
    this.requestCounts.set(provider, filtered);
  }

  // ============================================================================
  // PROVIDER MANAGEMENT
  // ============================================================================

  /**
   * Add a news provider
   */
  addNewsProvider(provider: NewsProvider): void {
    this.newsProviders.push(provider);
  }

  /**
   * Add a research provider
   */
  addResearchProvider(provider: ResearchProvider): void {
    this.researchProviders.push(provider);
  }

  /**
   * Add a documentation provider
   */
  addDocumentationProvider(provider: DocumentationProvider): void {
    this.documentationProviders.push(provider);
  }

  /**
   * Set web content provider
   */
  setWebContentProvider(provider: WebContentProvider): void {
    this.webContentProvider = provider;
  }

  /**
   * Get provider stats
   */
  getStats(): {
    newsProviders: number;
    researchProviders: number;
    documentationProviders: number;
    hasWebContentProvider: boolean;
  } {
    return {
      newsProviders: this.newsProviders.length,
      researchProviders: this.researchProviders.length,
      documentationProviders: this.documentationProviders.length,
      hasWebContentProvider: !!this.webContentProvider,
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createKnowledgeAggregator(
  config?: ExternalKnowledgeConfig
): KnowledgeAggregator {
  return new KnowledgeAggregator(config);
}
