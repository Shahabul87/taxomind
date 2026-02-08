/**
 * SAM External Knowledge Integration
 * Integrates @sam-ai/external-knowledge package with Taxomind
 *
 * Phase 4: Advanced Features - Real API integrations for external knowledge
 *
 * Supported providers:
 * - News: NewsAPI.org (requires NEWS_API_KEY)
 * - Research: Semantic Scholar (free, no key required)
 * - Documentation: DevDocs API (free, no key required)
 */

import { logger } from '@/lib/logger';

import {
  createKnowledgeAggregator,
  KnowledgeAggregator,
  InMemoryContentCache,
  type ExternalContent,
  type NewsArticle,
  type ResearchPaper,
  type Documentation,
  type NewsProvider,
  type ResearchProvider,
  type DocumentationProvider,
  type ExternalKnowledgeConfig,
} from '@sam-ai/external-knowledge';

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let aggregatorInstance: KnowledgeAggregator | null = null;

// ============================================================================
// REAL API PROVIDERS
// ============================================================================

/**
 * NewsAPI.org provider for real news articles
 * Requires NEWS_API_KEY environment variable
 * Docs: https://newsapi.org/docs
 */
const createNewsAPIProvider = (): NewsProvider => {
  const apiKey = process.env.NEWS_API_KEY;
  const isEnabled = Boolean(apiKey);

  return {
    name: 'newsapi',
    search: async (options) => {
      if (!isEnabled) {
        logger.debug('[SAM_KNOWLEDGE] NewsAPI not configured (NEWS_API_KEY not set)');
        return [];
      }

      try {
        // Build focused AI search query — avoid generic terms like "education" or "learning"
        // that pull in UPSC prep sites, generic school news, etc.
        const baseQuery = options.query || 'artificial intelligence';

        const isGeneralAISearch = baseQuery.toLowerCase().includes('artificial intelligence') ||
                                   baseQuery.toLowerCase().includes('ai education') ||
                                   baseQuery.toLowerCase().includes('ai news');

        // Use quoted phrases and AI-specific terms to improve precision
        const searchQuery = isGeneralAISearch
          ? '("artificial intelligence" OR "machine learning" OR "deep learning" OR ChatGPT OR "large language model" OR LLM OR "generative AI" OR "neural network" OR OpenAI OR "AI model" OR "AI startup" OR "AI regulation")'
          : baseQuery;

        // Request max articles so we have enough after relevance filtering
        // NewsAPI caps at 100 per request — we filter aggressively so fetch the max
        const fetchSize = 100;

        const params = new URLSearchParams({
          q: searchQuery,
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: String(fetchSize),
          apiKey: apiKey!,
        });

        const response = await fetch(`https://newsapi.org/v2/everything?${params}`);
        if (!response.ok) {
          throw new Error(`NewsAPI error: ${response.status}`);
        }

        const data = await response.json();
        const articles = data.articles ?? [];

        // AI-relevance keywords — at least one must appear in title or description
        const AI_KEYWORDS = [
          'artificial intelligence', 'machine learning', 'deep learning',
          'neural network', 'chatgpt', 'openai', 'anthropic', 'claude',
          'llm', 'large language model', 'generative ai', 'gen ai',
          'gpt', 'gemini', 'copilot', 'ai model', 'ai agent',
          'ai startup', 'ai regulation', 'ai safety', 'ai ethics',
          'natural language processing', 'nlp', 'computer vision',
          'robotics', 'autonomous', 'transformer model',
          'ai-powered', 'ai-driven', 'ai tool', 'ai platform',
          'deepmind', 'midjourney', 'stable diffusion', 'hugging face',
          'reinforcement learning', 'federated learning',
          ' ai ', // standalone "AI" with spaces to avoid matching "said", "aim", etc.
        ];

        // Filter: valid article + AI-relevant + not auto-generated noise
        const seenTitles = new Set<string>();
        const validArticles = articles.filter((article: Record<string, unknown>) => {
          if (!article.title || (article.title as string).includes('[Removed]') || !article.url) {
            return false;
          }

          const title = article.title as string;
          const description = (article.description as string) ?? '';
          const titleLower = title.toLowerCase();
          const descLower = description.toLowerCase();

          // Must be AI-relevant: keyword must appear in title, OR in both title+description
          // This prevents articles that mention AI once in passing from slipping through
          const titleHasAI = AI_KEYWORDS.some(kw => titleLower.includes(kw));
          const descHasAI = AI_KEYWORDS.some(kw => descLower.includes(kw));
          if (!titleHasAI && !descHasAI) return false;
          // If only in description, require at least 2 different AI keywords for confidence
          if (!titleHasAI) {
            const descMatches = AI_KEYWORDS.filter(kw => descLower.includes(kw));
            if (descMatches.length < 2) return false;
          }

          // Filter out auto-generated package release noise from PyPI
          // These are automated "X added to PyPI" or "X 1.2.3" version bumps — not real news
          const url = article.url as string;
          if (url.includes('pypi.org')) return false;

          // Deduplicate: exact match, substring match, or significant word overlap
          const normalizedTitle = titleLower
            .replace(/\d+\.\d+(\.\d+)?(\.\d+)?/g, '')
            .replace(/added to pypi/gi, '')
            .replace(/\s*[-–|:]\s*(macr|theverge|slashdot|cnn|bbc|reuters).*$/i, '')
            .replace(/\s+/g, ' ')
            .trim();
          if (seenTitles.has(normalizedTitle)) return false;
          // Extract significant words (4+ chars, stripped of punctuation) for overlap comparison
          const extractWords = (t: string) =>
            new Set(t.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length >= 4));
          const sigWords = extractWords(normalizedTitle);
          for (const seen of seenTitles) {
            // Substring check
            if (normalizedTitle.length > 20 && seen.length > 20) {
              if (normalizedTitle.includes(seen) || seen.includes(normalizedTitle)) return false;
            }
            // Word overlap check — if >50% of significant words match, it's a dupe
            if (sigWords.size >= 3) {
              const seenWords = extractWords(seen);
              const overlap = [...sigWords].filter(w => seenWords.has(w)).length;
              const minSize = Math.min(sigWords.size, seenWords.size);
              if (minSize > 0 && overlap / minSize > 0.5) return false;
            }
          }
          seenTitles.add(normalizedTitle);

          // Skip non-English articles (basic Latin alphabet check on title)
          const latinRatio = (title.match(/[a-zA-Z]/g) ?? []).length / title.length;
          if (latinRatio < 0.5) return false;

          return true;
        });

        // Cap to requested limit after AI-relevance filtering
        const cappedArticles = validArticles.slice(0, options.limit ?? 50);

        return cappedArticles.map((article: Record<string, unknown>, index: number) => {
          // Detect category based on title/description content
          const text = `${article.title} ${article.description}`.toLowerCase();
          const detectedTopics: string[] = [];

          if (text.includes('research') || text.includes('study') || text.includes('paper') || text.includes('arxiv') || text.includes('findings') || text.includes('benchmark')) {
            detectedTopics.push('research');
          }
          if (text.includes('startup') || text.includes('funding') || text.includes('venture') || text.includes('seed round') || text.includes('series a') || text.includes('raised $')) {
            detectedTopics.push('startup');
          }
          if (text.includes('policy') || text.includes('regulation') || text.includes('government') || text.includes('legislation') || text.includes('compliance') || text.includes('eu ai act') || text.includes('dominance') || text.includes('geopolit') || text.includes('ban')) {
            detectedTopics.push('policy');
          }
          if (text.includes('education') || text.includes('edtech') || text.includes('classroom') || text.includes('university') || text.includes('students') || text.includes('teaching') || text.includes('teaches') || text.includes('kids') || text.includes('learners') || text.includes('curriculum')) {
            detectedTopics.push('education');
          }
          if (text.includes('ethics') || text.includes('bias') || text.includes('fairness') || text.includes('ai safety') || text.includes('responsible ai') || text.includes('uncensored')) {
            detectedTopics.push('ethics');
          }
          if (text.includes('breakthrough') || text.includes('unveils') || text.includes('reveals') || text.includes('new model') || text.includes('state-of-the-art') || text.includes('outperform')) {
            detectedTopics.push('breakthrough');
          }
          if (text.includes('partnership') || text.includes('partners with') || text.includes('collaboration') || text.includes('joint venture') || text.includes('teaming up')) {
            detectedTopics.push('partnership');
          }
          if (text.includes('investment') || text.includes('acquires') || text.includes('acquisition') || text.includes('ipo') || text.includes('valuation') || text.includes('billion') || text.includes('spending') || text.includes('investor')) {
            detectedTopics.push('investment');
          }
          if (text.includes('show hn') || text.includes('open-source') || text.includes('open source') || text.includes('i built') || text.includes('product') || text.includes('launch') || text.includes('release') || text.includes('new version') || text.includes('announcing')) {
            detectedTopics.push('product-launch');
          }
          // "industry" only as fallback when no other category matched
          if (detectedTopics.length === 0) {
            if (text.includes('enterprise') || text.includes('industry') || text.includes('business') || text.includes('market') || text.includes('deploy') || text.includes('company')) {
              detectedTopics.push('industry');
            }
          }
          // Final fallback
          if (detectedTopics.length === 0) {
            detectedTopics.push('technology');
          }

          return {
            id: `newsapi-${Date.now()}-${index}`,
            sourceType: 'news' as const,
            title: article.title as string ?? 'Untitled',
            source: (article.source as Record<string, string>)?.name ?? 'Unknown',
            url: article.url as string ?? '',
            publishedAt: new Date(article.publishedAt as string ?? Date.now()),
            summary: article.description as string ?? '',
            relevanceScore: 0.9 - (index * 0.02), // Higher base score for recent articles
            topics: detectedTopics,
            tags: options.topics ?? [],
            language: 'en',
            quality: 'medium' as const,
          };
        });
      } catch (error) {
        logger.error('[SAM_KNOWLEDGE] NewsAPI search failed', { error });
        return [];
      }
    },
    getTrending: async (topics, limit) => {
      if (!isEnabled) return [];

      try {
        const params = new URLSearchParams({
          q: topics?.join(' OR ') ?? 'education',
          language: 'en',
          sortBy: 'popularity',
          pageSize: String(limit ?? 5),
          apiKey: apiKey!,
        });

        const response = await fetch(`https://newsapi.org/v2/everything?${params}`);
        if (!response.ok) return [];

        const data = await response.json();
        const articles = data.articles ?? [];

        return articles.map((article: Record<string, unknown>, index: number) => ({
          id: `newsapi-trending-${Date.now()}-${index}`,
          sourceType: 'news' as const,
          title: article.title as string ?? 'Untitled',
          source: (article.source as Record<string, string>)?.name ?? 'Unknown',
          url: article.url as string ?? '',
          publishedAt: new Date(article.publishedAt as string ?? Date.now()),
          summary: article.description as string ?? '',
          relevanceScore: 0.9 - (index * 0.05),
          topics: topics ?? [],
          tags: [],
          language: 'en',
          quality: 'medium' as const,
        }));
      } catch (error) {
        logger.error('[SAM_KNOWLEDGE] NewsAPI trending failed', { error });
        return [];
      }
    },
    getByCategory: async (category, limit) => {
      if (!isEnabled) return [];

      try {
        const params = new URLSearchParams({
          category: category === 'technology' ? 'technology' : 'science',
          language: 'en',
          pageSize: String(limit ?? 5),
          apiKey: apiKey!,
        });

        const response = await fetch(`https://newsapi.org/v2/top-headlines?${params}`);
        if (!response.ok) return [];

        const data = await response.json();
        return (data.articles ?? []).map((article: Record<string, unknown>, index: number) => ({
          id: `newsapi-cat-${Date.now()}-${index}`,
          sourceType: 'news' as const,
          title: article.title as string ?? 'Untitled',
          source: (article.source as Record<string, string>)?.name ?? 'Unknown',
          url: article.url as string ?? '',
          publishedAt: new Date(article.publishedAt as string ?? Date.now()),
          summary: article.description as string ?? '',
          relevanceScore: 0.85,
          topics: [category],
          tags: [],
          language: 'en',
          quality: 'medium' as const,
        }));
      } catch (error) {
        logger.error('[SAM_KNOWLEDGE] NewsAPI category failed', { error });
        return [];
      }
    },
  };
};

/**
 * Semantic Scholar provider for research papers
 * Free API - no key required
 * Docs: https://api.semanticscholar.org/
 */
const createSemanticScholarProvider = (): ResearchProvider => ({
  name: 'semantic-scholar',
  search: async (options) => {
    try {
      const params = new URLSearchParams({
        query: `${options.query} education learning`,
        limit: String(options.limit ?? 5),
        fields: 'paperId,title,abstract,authors,citationCount,url,publicationDate,journal',
      });

      const response = await fetch(
        `https://api.semanticscholar.org/graph/v1/paper/search?${params}`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Semantic Scholar error: ${response.status}`);
      }

      const data = await response.json();
      const papers = data.data ?? [];

      return papers.map((paper: Record<string, unknown>, index: number) => ({
        id: paper.paperId as string ?? `ss-${Date.now()}-${index}`,
        sourceType: 'research' as const,
        title: paper.title as string ?? 'Untitled',
        url: paper.url as string ?? `https://www.semanticscholar.org/paper/${paper.paperId}`,
        publishedAt: paper.publicationDate
          ? new Date(paper.publicationDate as string)
          : new Date(),
        abstract: paper.abstract as string ?? '',
        authors: (paper.authors as Array<{ name: string }> ?? []).map(a => a.name),
        citations: paper.citationCount as number ?? 0,
        journal: (paper.journal as Record<string, string>)?.name,
        relevanceScore: 0.9 - (index * 0.05),
        topics: [],
        tags: options.fields ?? [],
        keywords: options.fields ?? [],
        language: 'en',
        quality: 'high' as const,
      }));
    } catch (error) {
      logger.error('[SAM_KNOWLEDGE] Semantic Scholar search failed', { error });
      return [];
    }
  },
  getByDoi: async (doi) => {
    try {
      const response = await fetch(
        `https://api.semanticscholar.org/graph/v1/paper/${encodeURIComponent(doi)}?fields=paperId,title,abstract,authors,citationCount,url,publicationDate,journal`
      );

      if (!response.ok) return null;

      const paper = await response.json();
      return {
        id: paper.paperId as string,
        sourceType: 'research' as const,
        title: paper.title as string ?? 'Untitled',
        url: paper.url as string ?? `https://www.semanticscholar.org/paper/${paper.paperId}`,
        publishedAt: paper.publicationDate
          ? new Date(paper.publicationDate as string)
          : new Date(),
        abstract: paper.abstract as string ?? '',
        authors: (paper.authors as Array<{ name: string }> ?? []).map(a => a.name),
        citations: paper.citationCount as number ?? 0,
        doi,
        relevanceScore: 1.0,
        topics: [],
        tags: [],
        keywords: [],
        language: 'en',
        quality: 'high' as const,
      };
    } catch (error) {
      logger.error('[SAM_KNOWLEDGE] Semantic Scholar DOI lookup failed', { error, doi });
      return null;
    }
  },
  getByArxivId: async (arxivId) => {
    try {
      const response = await fetch(
        `https://api.semanticscholar.org/graph/v1/paper/arXiv:${arxivId}?fields=paperId,title,abstract,authors,citationCount,url,publicationDate`
      );

      if (!response.ok) return null;

      const paper = await response.json();
      return {
        id: paper.paperId as string,
        sourceType: 'research' as const,
        title: paper.title as string ?? 'Untitled',
        url: paper.url as string ?? `https://arxiv.org/abs/${arxivId}`,
        publishedAt: paper.publicationDate
          ? new Date(paper.publicationDate as string)
          : new Date(),
        abstract: paper.abstract as string ?? '',
        authors: (paper.authors as Array<{ name: string }> ?? []).map(a => a.name),
        citations: paper.citationCount as number ?? 0,
        arxivId,
        relevanceScore: 1.0,
        topics: [],
        tags: [],
        keywords: [],
        language: 'en',
        quality: 'high' as const,
      };
    } catch (error) {
      logger.error('[SAM_KNOWLEDGE] Semantic Scholar arXiv lookup failed', { error, arxivId });
      return null;
    }
  },
  getCitations: async (paperId) => {
    try {
      const response = await fetch(
        `https://api.semanticscholar.org/graph/v1/paper/${paperId}/citations?fields=paperId,title,abstract,authors,citationCount,url&limit=10`
      );

      if (!response.ok) return [];

      const data = await response.json();
      return (data.data ?? []).map((item: { citingPaper: Record<string, unknown> }, index: number) => {
        const paper = item.citingPaper;
        return {
          id: paper.paperId as string ?? `citation-${index}`,
          sourceType: 'research' as const,
          title: paper.title as string ?? 'Untitled',
          url: paper.url as string ?? '',
          publishedAt: new Date(),
          abstract: paper.abstract as string ?? '',
          authors: (paper.authors as Array<{ name: string }> ?? []).map(a => a.name),
          citations: paper.citationCount as number ?? 0,
          relevanceScore: 0.8,
          topics: [],
          tags: [],
          keywords: [],
          language: 'en',
          quality: 'high' as const,
        };
      });
    } catch (error) {
      logger.error('[SAM_KNOWLEDGE] Semantic Scholar citations failed', { error, paperId });
      return [];
    }
  },
});

/**
 * DevDocs provider for technical documentation
 * Free API - no key required
 * Docs: https://devdocs.io/
 */
const createDevDocsProvider = (): DocumentationProvider => ({
  name: 'devdocs',
  search: async (options) => {
    try {
      // DevDocs doesn't have a public search API, so we construct doc URLs
      // based on common frameworks and provide direct links
      const query = options.query.toLowerCase();
      const docs: Documentation[] = [];

      // Common framework documentation mappings
      const frameworkDocs: Record<string, { name: string; url: string; version?: string }> = {
        react: { name: 'React', url: 'https://react.dev/learn', version: '18' },
        nextjs: { name: 'Next.js', url: 'https://nextjs.org/docs', version: '14' },
        typescript: { name: 'TypeScript', url: 'https://www.typescriptlang.org/docs/', version: '5' },
        javascript: { name: 'JavaScript', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide' },
        node: { name: 'Node.js', url: 'https://nodejs.org/docs/latest/api/', version: '20' },
        python: { name: 'Python', url: 'https://docs.python.org/3/', version: '3.12' },
        prisma: { name: 'Prisma', url: 'https://www.prisma.io/docs', version: '5' },
        tailwind: { name: 'Tailwind CSS', url: 'https://tailwindcss.com/docs', version: '3' },
      };

      // Find matching frameworks
      for (const [key, info] of Object.entries(frameworkDocs)) {
        if (query.includes(key)) {
          docs.push({
            id: `devdocs-${key}-${Date.now()}`,
            sourceType: 'documentation' as const,
            title: `${info.name} Documentation`,
            url: info.url,
            description: `Official documentation for ${info.name}. Search for "${options.query}" in the docs.`,
            version: info.version,
            relevanceScore: 0.9,
            topics: [key],
            tags: [key, 'documentation'],
            codeExamples: [],
            language: 'en',
            quality: 'high' as const,
          });
        }
      }

      // Add MDN for web-related queries
      if (query.includes('css') || query.includes('html') || query.includes('web') || query.includes('dom')) {
        docs.push({
          id: `mdn-${Date.now()}`,
          sourceType: 'documentation' as const,
          title: `MDN Web Docs: ${options.query}`,
          url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(options.query)}`,
          description: `Mozilla Developer Network documentation for ${options.query}.`,
          relevanceScore: 0.85,
          topics: ['web', 'mdn'],
          tags: ['mdn', 'web', 'documentation'],
          codeExamples: [],
          language: 'en',
          quality: 'high' as const,
        });
      }

      // Fallback to general search
      if (docs.length === 0) {
        docs.push({
          id: `devdocs-search-${Date.now()}`,
          sourceType: 'documentation' as const,
          title: `Search DevDocs for "${options.query}"`,
          url: `https://devdocs.io/#q=${encodeURIComponent(options.query)}`,
          description: `Search DevDocs.io for documentation about ${options.query}.`,
          relevanceScore: 0.7,
          topics: [],
          tags: ['devdocs'],
          codeExamples: [],
          language: 'en',
          quality: 'medium' as const,
        });
      }

      return docs.slice(0, options.limit ?? 5);
    } catch (error) {
      logger.error('[SAM_KNOWLEDGE] DevDocs search failed', { error });
      return [];
    }
  },
  getForFramework: async (framework, version) => {
    const frameworkUrls: Record<string, string> = {
      react: 'https://react.dev/learn',
      nextjs: 'https://nextjs.org/docs',
      vue: 'https://vuejs.org/guide/introduction.html',
      angular: 'https://angular.io/docs',
      svelte: 'https://svelte.dev/docs',
      express: 'https://expressjs.com/en/guide/routing.html',
      django: 'https://docs.djangoproject.com/',
      fastapi: 'https://fastapi.tiangolo.com/',
      prisma: 'https://www.prisma.io/docs',
    };

    const url = frameworkUrls[framework.toLowerCase()];
    if (!url) return [];

    return [{
      id: `framework-${framework}-${Date.now()}`,
      sourceType: 'documentation' as const,
      title: `${framework} Documentation`,
      url,
      description: `Official documentation for ${framework}${version ? ` v${version}` : ''}.`,
      version,
      relevanceScore: 1.0,
      topics: [framework],
      tags: [framework, 'documentation'],
      codeExamples: [],
      language: 'en',
      quality: 'high' as const,
    }];
  },
});

// Create provider instances
const newsAPIProvider = createNewsAPIProvider();
const semanticScholarProvider = createSemanticScholarProvider();
const devDocsProvider = createDevDocsProvider();

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the external knowledge aggregator
 */
export function initializeExternalKnowledge(
  config?: Partial<ExternalKnowledgeConfig>
): KnowledgeAggregator {
  if (aggregatorInstance) {
    return aggregatorInstance;
  }

  const cache = new InMemoryContentCache(3600); // 1 hour TTL in seconds

  aggregatorInstance = createKnowledgeAggregator({
    cache,
    newsProviders: [newsAPIProvider],
    researchProviders: [semanticScholarProvider],
    documentationProviders: [devDocsProvider],
    defaultLimit: config?.defaultLimit ?? 5,
    cacheTTL: config?.cacheTTL ?? 3600, // 1 hour in seconds
    logger: {
      debug: (msg, data) => logger.debug(`[SAM_KNOWLEDGE] ${msg}`, data),
      info: (msg, data) => logger.info(`[SAM_KNOWLEDGE] ${msg}`, data),
      warn: (msg, data) => logger.warn(`[SAM_KNOWLEDGE] ${msg}`, data),
      error: (msg, data) => logger.error(`[SAM_KNOWLEDGE] ${msg}`, data),
    },
  });

  logger.info('[SAM_KNOWLEDGE] External knowledge aggregator initialized', {
    newsProvider: newsAPIProvider.name,
    researchProvider: semanticScholarProvider.name,
    documentationProvider: devDocsProvider.name,
    newsAPIEnabled: Boolean(process.env.NEWS_API_KEY),
  });

  return aggregatorInstance;
}

/**
 * Get the knowledge aggregator instance
 */
export function getExternalKnowledgeAggregator(): KnowledgeAggregator {
  if (!aggregatorInstance) {
    return initializeExternalKnowledge();
  }
  return aggregatorInstance;
}

// ============================================================================
// SEARCH FUNCTIONS
// ============================================================================

/**
 * Search for educational content across all sources
 */
export async function searchEducationalContent(
  query: string,
  options?: {
    includeNews?: boolean;
    includeResearch?: boolean;
    includeDocs?: boolean;
    maxResults?: number;
  }
): Promise<ExternalContent[]> {
  const aggregator = getExternalKnowledgeAggregator();

  const types: Array<'news' | 'research' | 'documentation'> = [];
  if (options?.includeNews !== false) types.push('news');
  if (options?.includeResearch !== false) types.push('research');
  if (options?.includeDocs !== false) types.push('documentation');

  try {
    const results = await aggregator.search(query, {
      types,
      limit: options?.maxResults ?? 10,
    });

    logger.info('[SAM_KNOWLEDGE] Search completed', {
      query,
      resultCount: results.content.length,
    });

    return results.content;
  } catch (error) {
    logger.error('[SAM_KNOWLEDGE] Search failed', { query, error });
    return [];
  }
}

/**
 * Search for news articles related to a topic
 */
export async function searchNews(
  topic: string,
  maxResults?: number
): Promise<NewsArticle[]> {
  const results = await searchEducationalContent(topic, {
    includeNews: true,
    includeResearch: false,
    includeDocs: false,
    maxResults,
  });

  return results.filter((r): r is NewsArticle => r.sourceType === 'news');
}

/**
 * Search for research papers related to a topic
 */
export async function searchResearch(
  topic: string,
  maxResults?: number
): Promise<ResearchPaper[]> {
  const results = await searchEducationalContent(topic, {
    includeNews: false,
    includeResearch: true,
    includeDocs: false,
    maxResults,
  });

  return results.filter((r): r is ResearchPaper => r.sourceType === 'research');
}

/**
 * Search for documentation related to a topic
 */
export async function searchDocumentation(
  topic: string,
  maxResults?: number
): Promise<Documentation[]> {
  const results = await searchEducationalContent(topic, {
    includeNews: false,
    includeResearch: false,
    includeDocs: true,
    maxResults,
  });

  return results.filter((r): r is Documentation => r.sourceType === 'documentation');
}

// ============================================================================
// CONTEXT ENRICHMENT
// ============================================================================

/**
 * Enrich a learning topic with external knowledge
 * Used to provide additional context for SAM tutoring sessions
 */
export async function enrichTopicContext(
  topic: string,
  options?: {
    includeLatestNews?: boolean;
    includeResearch?: boolean;
    maxItems?: number;
  }
): Promise<{
  topic: string;
  news: NewsArticle[];
  research: ResearchPaper[];
  documentation: Documentation[];
  enrichedAt: Date;
}> {
  const maxItems = options?.maxItems ?? 3;

  const [news, research, documentation] = await Promise.all([
    options?.includeLatestNews !== false
      ? searchNews(topic, maxItems)
      : Promise.resolve([]),
    options?.includeResearch !== false
      ? searchResearch(topic, maxItems)
      : Promise.resolve([]),
    searchDocumentation(topic, maxItems),
  ]);

  return {
    topic,
    news,
    research,
    documentation,
    enrichedAt: new Date(),
  };
}

/**
 * Get trending topics in education
 */
export async function getTrendingEducationTopics(): Promise<string[]> {
  // This would integrate with news APIs to get trending education topics
  // Placeholder implementation
  return [
    'AI in Education',
    'Personalized Learning',
    'STEM Education',
    'Online Learning',
    'Educational Assessment',
  ];
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  createKnowledgeAggregator,
  KnowledgeAggregator,
  InMemoryContentCache,
  type ExternalContent,
  type NewsArticle,
  type ResearchPaper,
  type Documentation,
  type NewsProvider,
  type ResearchProvider,
  type DocumentationProvider,
  type ExternalKnowledgeConfig,
};
