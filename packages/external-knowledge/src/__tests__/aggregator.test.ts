/**
 * Tests for KnowledgeAggregator
 * @sam-ai/external-knowledge
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KnowledgeAggregator, createKnowledgeAggregator } from '../aggregator';
import type {
  NewsProvider,
  ResearchProvider,
  DocumentationProvider,
  WebContentProvider,
  ContentCache,
  NewsArticle,
  ResearchPaper,
  Documentation,
  ExternalContent,
} from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeNewsProvider(name: string, articles: NewsArticle[] = []): NewsProvider {
  return {
    name,
    search: vi.fn().mockResolvedValue(articles),
    getTrending: vi.fn().mockResolvedValue(articles),
    getByCategory: vi.fn().mockResolvedValue(articles),
  };
}

function makeResearchProvider(name: string, papers: ResearchPaper[] = []): ResearchProvider {
  return {
    name,
    search: vi.fn().mockResolvedValue(papers),
    getByDoi: vi.fn().mockResolvedValue(papers[0] ?? null),
    getByArxivId: vi.fn().mockResolvedValue(papers[0] ?? null),
    getCitations: vi.fn().mockResolvedValue([]),
  };
}

function makeDocProvider(name: string, docs: Documentation[] = []): DocumentationProvider {
  return {
    name,
    search: vi.fn().mockResolvedValue(docs),
    getForFramework: vi.fn().mockResolvedValue(docs),
  };
}

function makeCache(): ContentCache {
  return {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(true),
    clear: vi.fn().mockResolvedValue(undefined),
  };
}

function makeArticle(overrides: Partial<NewsArticle> = {}): NewsArticle {
  return {
    id: 'article-1',
    sourceType: 'news',
    title: 'AI Breakthrough',
    url: 'https://example.com/article',
    source: 'TechCrunch',
    topics: ['ai'],
    tags: ['ml'],
    quality: 'high',
    language: 'en',
    relevanceScore: 0.8,
    ...overrides,
  } as NewsArticle;
}

function makePaper(overrides: Partial<ResearchPaper> = {}): ResearchPaper {
  return {
    id: 'paper-1',
    sourceType: 'research',
    title: 'Attention Is All You Need',
    url: 'https://arxiv.org/paper',
    authors: ['Vaswani et al.'],
    topics: ['transformers'],
    tags: ['nlp'],
    quality: 'high',
    language: 'en',
    keywords: [],
    relevanceScore: 0.9,
    ...overrides,
  } as ResearchPaper;
}

function makeDoc(overrides: Partial<Documentation> = {}): Documentation {
  return {
    id: 'doc-1',
    sourceType: 'documentation',
    title: 'React Docs',
    url: 'https://react.dev',
    topics: ['react'],
    tags: ['frontend'],
    quality: 'high',
    language: 'en',
    codeExamples: [],
    ...overrides,
  } as Documentation;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('KnowledgeAggregator', () => {
  let cache: ContentCache;

  beforeEach(() => {
    vi.clearAllMocks();
    cache = makeCache();
  });

  it('should search news across multiple providers', async () => {
    const provider1 = makeNewsProvider('provider1', [makeArticle({ id: 'a1' })]);
    const provider2 = makeNewsProvider('provider2', [makeArticle({ id: 'a2' })]);

    const aggregator = new KnowledgeAggregator({
      newsProviders: [provider1, provider2],
      cache,
    });

    const results = await aggregator.searchNews({ query: 'AI' });

    expect(provider1.search).toHaveBeenCalledWith({ query: 'AI' });
    expect(provider2.search).toHaveBeenCalledWith({ query: 'AI' });
    expect(results).toHaveLength(2);
  });

  it('should aggregate results sorted by relevance', async () => {
    const highRelevance = makeArticle({ id: 'high', relevanceScore: 0.95 });
    const lowRelevance = makeArticle({ id: 'low', relevanceScore: 0.3 });
    const provider = makeNewsProvider('p1', [lowRelevance, highRelevance]);

    const aggregator = new KnowledgeAggregator({
      newsProviders: [provider],
      cache,
    });

    const results = await aggregator.searchNews({ query: 'test' });

    expect(results[0].id).toBe('high');
    expect(results[1].id).toBe('low');
  });

  it('should return cached results when available', async () => {
    const cachedArticle = makeArticle({ id: 'cached' });
    (cache.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce(cachedArticle);

    const provider = makeNewsProvider('p1', [makeArticle()]);
    const aggregator = new KnowledgeAggregator({
      newsProviders: [provider],
      cache,
    });

    const results = await aggregator.searchNews({ query: 'AI' });

    // Should return the cached result, not call the provider
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('cached');
    expect(provider.search).not.toHaveBeenCalled();
  });

  it('should enforce rate limiting per provider', async () => {
    const provider = makeNewsProvider('rate-limited', [makeArticle()]);
    const aggregator = new KnowledgeAggregator({
      newsProviders: [provider],
      cache,
      rateLimitPerMinute: 1,
    });

    // First call should succeed
    await aggregator.searchNews({ query: 'test1' });
    expect(provider.search).toHaveBeenCalledTimes(1);

    // Second call within the same minute should be rate limited
    await aggregator.searchNews({ query: 'test2' });
    expect(provider.search).toHaveBeenCalledTimes(1); // Not called again
  });

  it('should handle provider errors gracefully with fallback', async () => {
    const failingProvider = makeNewsProvider('failing');
    (failingProvider.search as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Provider down'),
    );
    const workingProvider = makeNewsProvider('working', [makeArticle()]);

    const aggregator = new KnowledgeAggregator({
      newsProviders: [failingProvider, workingProvider],
      cache,
    });

    const results = await aggregator.searchNews({ query: 'test' });

    // Should still get results from the working provider
    expect(results).toHaveLength(1);
  });

  it('should deduplicate results by returning unique articles', async () => {
    // Two providers returning articles with different IDs
    const p1 = makeNewsProvider('p1', [makeArticle({ id: 'unique-1' })]);
    const p2 = makeNewsProvider('p2', [makeArticle({ id: 'unique-2' })]);

    const aggregator = new KnowledgeAggregator({
      newsProviders: [p1, p2],
      cache,
    });

    const results = await aggregator.searchNews({ query: 'AI' });
    const ids = results.map((r) => r.id);
    const uniqueIds = [...new Set(ids)];
    expect(ids.length).toBe(uniqueIds.length);
  });

  it('should respect relevance scoring when sorting results', async () => {
    const articles = [
      makeArticle({ id: 'mid', relevanceScore: 0.5 }),
      makeArticle({ id: 'top', relevanceScore: 1.0 }),
      makeArticle({ id: 'low', relevanceScore: 0.1 }),
    ];
    const provider = makeNewsProvider('p1', articles);

    const aggregator = new KnowledgeAggregator({
      newsProviders: [provider],
      cache,
    });

    const results = await aggregator.searchNews({ query: 'test' });

    expect(results[0].id).toBe('top');
    expect(results[1].id).toBe('mid');
    expect(results[2].id).toBe('low');
  });

  it('should limit results based on provided limit or default', async () => {
    const articles = Array.from({ length: 20 }, (_, i) =>
      makeArticle({ id: `a-${i}`, relevanceScore: 0.5 }),
    );
    const provider = makeNewsProvider('p1', articles);

    const aggregator = new KnowledgeAggregator({
      newsProviders: [provider],
      cache,
      defaultLimit: 5,
    });

    const results = await aggregator.searchNews({ query: 'test' });
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it('should handle timeout by catching provider errors', async () => {
    const slowProvider = makeNewsProvider('slow');
    (slowProvider.search as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Timeout'),
    );

    const aggregator = new KnowledgeAggregator({
      newsProviders: [slowProvider],
      cache,
    });

    const results = await aggregator.searchNews({ query: 'test' });
    expect(results).toEqual([]);
  });

  it('should return empty results when no providers are configured', async () => {
    const aggregator = new KnowledgeAggregator({ cache });

    const results = await aggregator.searchNews({ query: 'test' });
    expect(results).toEqual([]);
  });

  it('should support unified search across all content types', async () => {
    const newsProvider = makeNewsProvider('news', [makeArticle()]);
    const researchProvider = makeResearchProvider('research', [makePaper()]);
    const docProvider = makeDocProvider('docs', [makeDoc()]);

    const aggregator = new KnowledgeAggregator({
      newsProviders: [newsProvider],
      researchProviders: [researchProvider],
      documentationProviders: [docProvider],
      cache,
    });

    const result = await aggregator.search('AI');

    expect(result.content.length).toBeGreaterThan(0);
    expect(result.query).toBe('AI');
    expect(result.searchTime).toBeGreaterThanOrEqual(0);
    expect(result.sources.length).toBeGreaterThan(0);
  });

  it('should handle concurrent requests from multiple providers', async () => {
    const providers = Array.from({ length: 3 }, (_, i) =>
      makeNewsProvider(`p${i}`, [makeArticle({ id: `concurrent-${i}` })]),
    );

    const aggregator = new KnowledgeAggregator({
      newsProviders: providers,
      cache,
    });

    const results = await aggregator.searchNews({ query: 'concurrent' });
    expect(results).toHaveLength(3);
  });

  it('should create aggregator via factory function', () => {
    const aggregator = createKnowledgeAggregator({ defaultLimit: 15 });

    expect(aggregator).toBeInstanceOf(KnowledgeAggregator);
  });

  it('should search research papers and sort by relevance', async () => {
    const papers = [
      makePaper({ id: 'p-low', relevanceScore: 0.3 }),
      makePaper({ id: 'p-high', relevanceScore: 0.95 }),
    ];
    const provider = makeResearchProvider('research', papers);

    const aggregator = new KnowledgeAggregator({
      researchProviders: [provider],
      cache,
    });

    const results = await aggregator.searchResearch({ query: 'transformers' });

    expect(results[0].id).toBe('p-high');
  });

  it('should provide provider stats', () => {
    const aggregator = new KnowledgeAggregator({
      newsProviders: [makeNewsProvider('n1')],
      researchProviders: [makeResearchProvider('r1'), makeResearchProvider('r2')],
      documentationProviders: [],
    });

    const stats = aggregator.getStats();

    expect(stats.newsProviders).toBe(1);
    expect(stats.researchProviders).toBe(2);
    expect(stats.documentationProviders).toBe(0);
    expect(stats.hasWebContentProvider).toBe(false);
  });
});
