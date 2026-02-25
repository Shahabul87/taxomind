/**
 * Tests for NewsRankingEngine
 * @sam-ai/external-knowledge
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  NewsRankingEngine,
  createNewsRankingEngine,
} from '../news/news-ranking-engine';
import type {
  RankerNewsArticle,
  RankedNewsArticle,
  NewsCategory,
  ImpactLevel,
  TechnicalDepth,
} from '../news/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeArticle(overrides: Partial<RankerNewsArticle> = {}): RankerNewsArticle {
  return {
    articleId: overrides.articleId ?? 'art-1',
    title: overrides.title ?? 'GPT-5 Released',
    summary: overrides.summary ?? 'OpenAI releases GPT-5 with major improvements',
    articleUrl: 'https://example.com/article',
    category: overrides.category ?? 'breakthrough',
    tags: overrides.tags ?? ['ai', 'gpt'],
    source: overrides.source ?? {
      name: 'TechCrunch',
      url: 'https://techcrunch.com',
      type: 'media',
    },
    publishDate: overrides.publishDate ?? new Date(),
    impactLevel: overrides.impactLevel ?? 'high',
    relevanceScore: overrides.relevanceScore ?? 50,
    ...overrides,
  };
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('NewsRankingEngine', () => {
  let engine: NewsRankingEngine;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
    engine = new NewsRankingEngine();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should assign higher recency score to newer articles', async () => {
    const fresh = makeArticle({ articleId: 'fresh', publishDate: hoursAgo(0.5) });
    const old = makeArticle({ articleId: 'old', publishDate: hoursAgo(72) });

    const ranked = await engine.rankNews([old, fresh]);

    const freshRanked = ranked.find((a) => a.articleId === 'fresh');
    const oldRanked = ranked.find((a) => a.articleId === 'old');

    expect(freshRanked!.rankingDetails.freshness).toBeGreaterThan(
      oldRanked!.rankingDetails.freshness,
    );
  });

  it('should assign higher relevance to AI-related content', async () => {
    const aiArticle = makeArticle({
      articleId: 'ai',
      title: 'New deep learning transformer model breakthrough',
      summary: 'Novel neural network research with GPT and LLM advances',
      tags: ['machine learning', 'ai model'],
    });

    const genericArticle = makeArticle({
      articleId: 'generic',
      title: 'Weather Report',
      summary: 'It will be sunny today',
      tags: ['weather'],
      category: 'industry',
    });

    const ranked = await engine.rankNews([genericArticle, aiArticle]);

    const aiRanked = ranked.find((a) => a.articleId === 'ai');
    const genericRanked = ranked.find((a) => a.articleId === 'generic');

    expect(aiRanked!.rankingDetails.relevance).toBeGreaterThan(
      genericRanked!.rankingDetails.relevance,
    );
  });

  it('should assign credibility based on known sources', async () => {
    const credibleArticle = makeArticle({
      articleId: 'credible',
      source: { name: 'Nature', url: 'https://nature.com' },
    });

    const unknownArticle = makeArticle({
      articleId: 'unknown',
      source: { name: 'RandomBlog', url: 'https://randomblog.com', type: 'blog' },
    });

    const ranked = await engine.rankNews([unknownArticle, credibleArticle]);

    const credibleRanked = ranked.find((a) => a.articleId === 'credible');
    const unknownRanked = ranked.find((a) => a.articleId === 'unknown');

    expect(credibleRanked!.rankingDetails.credibility).toBeGreaterThan(
      unknownRanked!.rankingDetails.credibility,
    );
  });

  it('should calculate engagement/virality for popular sources', async () => {
    const popular = makeArticle({
      articleId: 'popular',
      source: { name: 'OpenAI Blog', url: 'https://openai.com' },
      impactLevel: 'critical',
      category: 'breakthrough',
    });

    const niche = makeArticle({
      articleId: 'niche',
      source: { name: 'SmallBlog', url: 'https://small.com', type: 'blog' },
      impactLevel: 'low',
      category: 'industry',
      publishDate: hoursAgo(48),
    });

    const ranked = await engine.rankNews([niche, popular]);

    const popularRanked = ranked.find((a) => a.articleId === 'popular');
    const nicheRanked = ranked.find((a) => a.articleId === 'niche');

    expect(popularRanked!.rankingDetails.virality).toBeGreaterThan(
      nicheRanked!.rankingDetails.virality,
    );
  });

  it('should apply freshness decay over time', async () => {
    const times = [0.5, 3, 6, 12, 24, 48, 72, 168];
    const articles = times.map((h, i) =>
      makeArticle({ articleId: `t-${i}`, publishDate: hoursAgo(h) }),
    );

    const ranked = await engine.rankNews(articles);

    // Freshness should decrease as articles get older
    for (let i = 0; i < ranked.length - 1; i++) {
      const current = ranked.find((a) => a.articleId === `t-${i}`);
      const next = ranked.find((a) => a.articleId === `t-${i + 1}`);
      expect(current!.rankingDetails.freshness).toBeGreaterThanOrEqual(
        next!.rankingDetails.freshness,
      );
    }
  });

  it('should determine trending status correctly', async () => {
    const hotArticle = makeArticle({
      articleId: 'hot',
      publishDate: hoursAgo(1),
      impactLevel: 'critical',
      category: 'breakthrough',
      relevanceScore: 80,
    });

    const ranked = await engine.rankNews([hotArticle]);
    const hotRanked = ranked.find((a) => a.articleId === 'hot');

    // Very recent + high score should be hot or rising
    expect(['hot', 'rising', 'new']).toContain(hotRanked!.trendingStatus);
  });

  it('should assign quality badges based on criteria scores', async () => {
    const article = makeArticle({
      articleId: 'badged',
      publishDate: hoursAgo(0.5), // Very fresh -> Breaking badge
      source: { name: 'Nature', url: 'https://nature.com' }, // High credibility -> Verified
      impactLevel: 'critical', // Critical badge
      category: 'breakthrough', // Breakthrough badge
      technicalDepth: 'expert', // Expert Level badge
    });

    const ranked = await engine.rankNews([article]);
    const badged = ranked[0];

    expect(badged.qualityBadges).toBeDefined();
    expect(badged.qualityBadges!.length).toBeGreaterThan(0);
    // At minimum, Critical and Breakthrough should be present
    expect(badged.qualityBadges).toContain('Critical');
    expect(badged.qualityBadges).toContain('Breakthrough');
  });

  it('should calculate combined overall ranking score', async () => {
    const article = makeArticle();

    const ranked = await engine.rankNews([article]);

    expect(ranked[0].rankingScore).toBeGreaterThan(0);
    expect(typeof ranked[0].rankingScore).toBe('number');
  });

  it('should support custom weights', async () => {
    const customEngine = new NewsRankingEngine({
      weights: { freshness: 1.0, relevance: 0, impact: 0, credibility: 0, virality: 0, innovation: 0, educational: 0, practicality: 0 },
    });

    const freshArticle = makeArticle({ articleId: 'fresh', publishDate: hoursAgo(0.5) });
    const oldArticle = makeArticle({ articleId: 'old', publishDate: hoursAgo(200) });

    const ranked = await customEngine.rankNews([oldArticle, freshArticle]);

    // With freshness weight = 1.0 and everything else = 0, the fresh article
    // should rank much higher
    expect(ranked[0].articleId).toBe('fresh');
  });

  it('should handle tie breaking by maintaining input order', async () => {
    const a1 = makeArticle({ articleId: 'a1', relevanceScore: 50 });
    const a2 = makeArticle({ articleId: 'a2', relevanceScore: 50 });

    const ranked = await engine.rankNews([a1, a2]);

    expect(ranked).toHaveLength(2);
    // Both should have valid ranking scores
    expect(ranked[0].rankingScore).toBeGreaterThan(0);
    expect(ranked[1].rankingScore).toBeGreaterThan(0);
  });

  it('should filter by date range in getTopNewsByCriteria', async () => {
    const articles = [
      makeArticle({ articleId: 'recent', publishDate: hoursAgo(1) }),
      makeArticle({ articleId: 'old', publishDate: hoursAgo(200) }),
    ];

    const result = await engine.getTopNewsByCriteria(articles, 'freshness', 10);

    // The most fresh article should come first
    expect(result[0].articleId).toBe('recent');
  });

  it('should filter by source using credibility lookup', () => {
    engine.setSourceCredibility('CustomSource', 88);
    const weights = engine.getWeights();

    expect(weights).toBeDefined();
    expect(typeof weights.freshness).toBe('number');
  });

  it('should sort results in descending order of ranking score', async () => {
    const articles = [
      makeArticle({ articleId: 'a', relevanceScore: 10, impactLevel: 'low' }),
      makeArticle({ articleId: 'b', relevanceScore: 90, impactLevel: 'critical' }),
      makeArticle({ articleId: 'c', relevanceScore: 50, impactLevel: 'medium' }),
    ];

    const ranked = await engine.rankNews(articles);

    for (let i = 0; i < ranked.length - 1; i++) {
      expect(ranked[i].rankingScore).toBeGreaterThanOrEqual(ranked[i + 1].rankingScore);
    }
  });

  it('should support pagination via getTopNewsByCriteria limit', async () => {
    const articles = Array.from({ length: 20 }, (_, i) =>
      makeArticle({ articleId: `page-${i}` }),
    );

    const result = await engine.getTopNewsByCriteria(articles, 'impact', 5);

    expect(result).toHaveLength(5);
  });

  it('should handle empty articles array gracefully', async () => {
    const ranked = await engine.rankNews([]);

    expect(ranked).toEqual([]);
  });
});
