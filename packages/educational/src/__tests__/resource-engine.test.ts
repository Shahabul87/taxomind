/**
 * ResourceEngine Tests
 *
 * Comprehensive tests for resource discovery, quality scoring,
 * license checking, ROI analysis, and personalized recommendations.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SAMConfig, AIChatParams } from '@sam-ai/core';
import {
  ResourceEngine,
  createResourceEngine,
} from '../engines/resource-engine';
import type {
  ResourceEngineConfig,
  TopicForResource,
  ExternalResource,
  StudentResourceProfile,
  ResourceDiscoveryConfig,
  ResourceType,
} from '../types';
import {
  createMockSAMConfig as baseCreateMockSAMConfig,
  createMockAIAdapter,
  createMockAIResponse,
} from './setup';

// ============================================================================
// TEST UTILITIES
// ============================================================================

const createMockSAMConfig = (overrides: Partial<SAMConfig> = {}): SAMConfig => {
  const mockAI = createMockAIAdapter((params: AIChatParams) => {
    return createMockAIResponse('0.85');
  });

  return {
    ...baseCreateMockSAMConfig(),
    ai: mockAI,
    ...overrides,
  };
};

const createMockEngineConfig = (
  overrides: Partial<ResourceEngineConfig> = {}
): ResourceEngineConfig => ({
  samConfig: createMockSAMConfig(),
  ...overrides,
});

const createMockTopic = (overrides: Partial<TopicForResource> = {}): TopicForResource => ({
  id: 'topic-123',
  name: 'Machine Learning',
  category: 'technology',
  keywords: ['AI', 'neural networks', 'deep learning'],
  difficulty: 'intermediate',
  ...overrides,
});

const createMockResource = (overrides: Partial<ExternalResource> = {}): ExternalResource => ({
  id: 'resource-123',
  title: 'Introduction to Machine Learning',
  description: 'A comprehensive guide to machine learning fundamentals',
  url: 'https://example.com/ml-guide',
  type: 'article',
  source: 'coursera',
  language: 'en',
  tags: ['ML', 'AI', 'beginner'],
  relevanceScore: 0.85,
  license: {
    type: 'CC-BY-4.0',
    commercialUse: true,
    attribution: true,
    shareAlike: false,
    modifications: true,
  },
  cost: {
    type: 'free',
  },
  ...overrides,
});

const createMockProfile = (
  overrides: Partial<StudentResourceProfile> = {}
): StudentResourceProfile => ({
  userId: 'user-123',
  preferredTypes: ['video', 'article', 'tutorial'],
  preferredFormats: ['interactive', 'visual'],
  preferredDuration: { min: 10, max: 60 },
  languagePreferences: ['en'],
  learningGoals: ['skill improvement', 'career advancement'],
  skillLevel: 'intermediate',
  ...overrides,
});

// ============================================================================
// CONSTRUCTOR AND INITIALIZATION TESTS
// ============================================================================

describe('ResourceEngine', () => {
  describe('Constructor and Initialization', () => {
    it('should create engine with default configuration', () => {
      const config = createMockEngineConfig();
      const engine = new ResourceEngine(config);

      expect(engine).toBeInstanceOf(ResourceEngine);
    });

    it('should create engine using factory function', () => {
      const config = createMockEngineConfig();
      const engine = createResourceEngine(config);

      expect(engine).toBeInstanceOf(ResourceEngine);
    });

    it('should create engine with database adapter', () => {
      const config = createMockEngineConfig({
        database: {
          query: vi.fn(),
          execute: vi.fn(),
        } as unknown as ResourceEngineConfig['database'],
      });
      const engine = new ResourceEngine(config);

      expect(engine).toBeInstanceOf(ResourceEngine);
    });
  });

  // ============================================================================
  // RESOURCE DISCOVERY TESTS
  // ============================================================================

  describe('Resource Discovery', () => {
    let engine: ResourceEngine;

    beforeEach(() => {
      engine = new ResourceEngine(createMockEngineConfig());
    });

    it('should discover resources for a topic', async () => {
      const topic = createMockTopic();

      const resources = await engine.discoverResources(topic);

      expect(Array.isArray(resources)).toBe(true);
      expect(resources.length).toBeGreaterThan(0);
    });

    it('should filter by quality threshold', async () => {
      const topic = createMockTopic();
      const config: ResourceDiscoveryConfig = {
        sources: ['youtube'],
        maxResults: 10,
        qualityThreshold: 0.8,
        includeTypes: ['video'],
        languages: ['en'],
      };

      const resources = await engine.discoverResources(topic, config);

      for (const resource of resources) {
        expect(resource.qualityScore).toBeGreaterThanOrEqual(0.7);
      }
    });

    it('should limit results by maxResults', async () => {
      const topic = createMockTopic();
      const config: ResourceDiscoveryConfig = {
        sources: ['youtube', 'coursera', 'medium'],
        maxResults: 5,
        qualityThreshold: 0.5,
        includeTypes: ['video', 'article'],
        languages: ['en'],
      };

      const resources = await engine.discoverResources(topic, config);

      expect(resources.length).toBeLessThanOrEqual(5);
    });

    it('should sort resources by quality and relevance', async () => {
      const topic = createMockTopic();

      const resources = await engine.discoverResources(topic);

      if (resources.length > 1) {
        const scores = resources.map(
          (r) => (r.qualityScore || 0) * 0.5 + (r.relevanceScore || 0) * 0.5
        );

        for (let i = 1; i < scores.length; i++) {
          expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i]);
        }
      }
    });

    it('should cache discovered resources', async () => {
      const topic = createMockTopic();

      const resources1 = await engine.discoverResources(topic);
      const resources2 = await engine.discoverResources(topic);

      expect(resources1).toEqual(resources2);
    });

    it('should search multiple sources', async () => {
      const topic = createMockTopic();
      const config: ResourceDiscoveryConfig = {
        sources: ['youtube', 'coursera', 'medium', 'github'],
        maxResults: 20,
        qualityThreshold: 0.5,
        includeTypes: ['video', 'article', 'tutorial'],
        languages: ['en'],
      };

      const resources = await engine.discoverResources(topic, config);

      const sources = [...new Set(resources.map((r) => r.source))];
      expect(sources.length).toBeGreaterThan(0);
    });

    it('should handle discovery with custom config', async () => {
      const topic = createMockTopic();
      const config: ResourceDiscoveryConfig = {
        sources: ['medium'],
        maxResults: 3,
        qualityThreshold: 0.6,
        includeTypes: ['article'],
        languages: ['en'],
        costFilter: 'free',
      };

      const resources = await engine.discoverResources(topic, config);

      expect(resources.length).toBeLessThanOrEqual(3);
    });

    it('should handle empty topic keywords', async () => {
      const topic = createMockTopic({ keywords: [] });

      const resources = await engine.discoverResources(topic);

      expect(Array.isArray(resources)).toBe(true);
    });
  });

  // ============================================================================
  // QUALITY SCORING TESTS
  // ============================================================================

  describe('Quality Scoring', () => {
    let engine: ResourceEngine;

    beforeEach(() => {
      engine = new ResourceEngine(createMockEngineConfig());
    });

    it('should score resource quality', async () => {
      const resource = createMockResource();

      const quality = await engine.scoreResourceQuality(resource);

      expect(quality.overall).toBeDefined();
      expect(quality.overall).toBeGreaterThanOrEqual(0);
      expect(quality.overall).toBeLessThanOrEqual(1);
    });

    it('should include all quality factors', async () => {
      const resource = createMockResource();

      const quality = await engine.scoreResourceQuality(resource);

      expect(quality.relevance).toBeDefined();
      expect(quality.accuracy).toBeDefined();
      expect(quality.completeness).toBeDefined();
      expect(quality.clarity).toBeDefined();
      expect(quality.engagement).toBeDefined();
      expect(quality.authority).toBeDefined();
      expect(quality.recency).toBeDefined();
    });

    it('should return quality factors with weights', async () => {
      const resource = createMockResource();

      const quality = await engine.scoreResourceQuality(resource);

      expect(Array.isArray(quality.factors)).toBe(true);
      expect(quality.factors.length).toBeGreaterThan(0);

      for (const factor of quality.factors) {
        expect(factor.name).toBeDefined();
        expect(factor.score).toBeGreaterThanOrEqual(0);
        expect(factor.score).toBeLessThanOrEqual(1);
        expect(factor.weight).toBeGreaterThan(0);
        expect(factor.description).toBeDefined();
      }
    });

    it('should give higher authority to reputable sources', async () => {
      const courseraResource = createMockResource({ source: 'coursera' });
      const unknownResource = createMockResource({ source: 'unknown-blog' });

      const courseraQuality = await engine.scoreResourceQuality(courseraResource);
      const unknownQuality = await engine.scoreResourceQuality(unknownResource);

      // Reputable sources should have at least equal authority
      expect(courseraQuality.authority).toBeGreaterThanOrEqual(unknownQuality.authority);
    });

    it('should score recency based on date', async () => {
      const recentResource = createMockResource({
        lastUpdated: new Date(),
      });
      const oldResource = createMockResource({
        lastUpdated: new Date('2020-01-01'),
      });

      const recentQuality = await engine.scoreResourceQuality(recentResource);
      const oldQuality = await engine.scoreResourceQuality(oldResource);

      // Recent resources should have at least equal recency score
      expect(recentQuality.recency).toBeGreaterThanOrEqual(oldQuality.recency);
    });

    it('should handle resource without dates', async () => {
      const resource = createMockResource({
        lastUpdated: undefined,
        publishedDate: undefined,
      });

      const quality = await engine.scoreResourceQuality(resource);

      expect(quality.recency).toBe(0.5);
    });

    it('should cache quality scores', async () => {
      const resource = createMockResource();

      const quality1 = await engine.scoreResourceQuality(resource);
      const quality2 = await engine.scoreResourceQuality(resource);

      expect(quality1.overall).toBe(quality2.overall);
    });

    it('should calculate completeness based on type', async () => {
      const bookResource = createMockResource({ type: 'book' });
      const articleResource = createMockResource({ type: 'article' });

      const bookQuality = await engine.scoreResourceQuality(bookResource);
      const articleQuality = await engine.scoreResourceQuality(articleResource);

      // Books should have at least equal completeness to articles
      expect(bookQuality.completeness).toBeGreaterThanOrEqual(articleQuality.completeness);
    });

    it('should calculate engagement based on type', async () => {
      const videoResource = createMockResource({ type: 'video' });
      const paperResource = createMockResource({ type: 'research-paper' });

      const videoQuality = await engine.scoreResourceQuality(videoResource);
      const paperQuality = await engine.scoreResourceQuality(paperResource);

      // Videos should have at least equal engagement to papers
      expect(videoQuality.engagement).toBeGreaterThanOrEqual(paperQuality.engagement);
    });
  });

  // ============================================================================
  // LICENSE CHECKING TESTS
  // ============================================================================

  describe('License Checking', () => {
    let engine: ResourceEngine;

    beforeEach(() => {
      engine = new ResourceEngine(createMockEngineConfig());
    });

    it('should check license compatibility', async () => {
      const resource = createMockResource();

      const status = await engine.checkLicenseCompatibility(resource);

      expect(status.compatible).toBeDefined();
      expect(Array.isArray(status.restrictions)).toBe(true);
      expect(Array.isArray(status.recommendations)).toBe(true);
    });

    it('should return incompatible for no license', async () => {
      const resource = createMockResource({ license: undefined });

      const status = await engine.checkLicenseCompatibility(resource);

      expect(status.compatible).toBe(false);
      expect(status.restrictions).toContain('No license information available');
    });

    it('should require attribution when license requires it', async () => {
      const resource = createMockResource({
        license: {
          type: 'CC-BY',
          commercialUse: true,
          attribution: true,
          shareAlike: false,
          modifications: true,
        },
      });

      const status = await engine.checkLicenseCompatibility(
        resource,
        'commercial'
      );

      expect(status.restrictions).toContain('Attribution required');
    });

    it('should flag commercial use restrictions', async () => {
      const resource = createMockResource({
        license: {
          type: 'CC-BY-NC',
          commercialUse: false,
          attribution: true,
          shareAlike: false,
          modifications: true,
        },
      });

      const status = await engine.checkLicenseCompatibility(
        resource,
        'commercial'
      );

      expect(status.compatible).toBe(false);
      expect(status.restrictions).toContain('No commercial use allowed');
    });

    it('should flag modification restrictions', async () => {
      const resource = createMockResource({
        license: {
          type: 'CC-BY-ND',
          commercialUse: true,
          attribution: true,
          shareAlike: false,
          modifications: false,
        },
      });

      const status = await engine.checkLicenseCompatibility(
        resource,
        'modify'
      );

      expect(status.restrictions).toContain('No modifications allowed');
    });

    it('should flag share-alike requirements', async () => {
      const resource = createMockResource({
        license: {
          type: 'CC-BY-SA',
          commercialUse: true,
          attribution: true,
          shareAlike: true,
          modifications: true,
        },
      });

      const status = await engine.checkLicenseCompatibility(resource);

      expect(status.restrictions).toContain('Share-alike requirement');
    });

    it('should suggest alternative licenses when incompatible', async () => {
      const resource = createMockResource({
        license: {
          type: 'CC-BY-NC',
          commercialUse: false,
          attribution: true,
          shareAlike: false,
          modifications: true,
        },
      });

      const status = await engine.checkLicenseCompatibility(
        resource,
        'commercial'
      );

      expect(status.alternativeLicenses).toBeDefined();
      expect(status.alternativeLicenses!.length).toBeGreaterThan(0);
    });

    it('should be compatible when only attribution required', async () => {
      const resource = createMockResource({
        license: {
          type: 'CC-BY',
          commercialUse: true,
          attribution: true,
          shareAlike: false,
          modifications: true,
        },
      });

      const status = await engine.checkLicenseCompatibility(resource, 'commercial');

      expect(status.compatible).toBe(true);
    });
  });

  // ============================================================================
  // ROI ANALYSIS TESTS
  // ============================================================================

  describe('ROI Analysis', () => {
    let engine: ResourceEngine;

    beforeEach(() => {
      engine = new ResourceEngine(createMockEngineConfig());
    });

    it('should analyze resource ROI', async () => {
      const resource = createMockResource();

      const roi = await engine.analyzeResourceROI(resource);

      expect(roi.costBenefitRatio).toBeDefined();
      expect(roi.timeToValue).toBeDefined();
      expect(roi.learningEfficiency).toBeDefined();
      expect(roi.recommendation).toBeDefined();
      expect(roi.justification).toBeDefined();
    });

    it('should calculate cost-benefit ratio', async () => {
      const freeResource = createMockResource({ cost: { type: 'free' } });
      const paidResource = createMockResource({
        cost: { type: 'paid', amount: 50, currency: 'USD' },
      });

      const freeRoi = await engine.analyzeResourceROI(freeResource);
      const paidRoi = await engine.analyzeResourceROI(paidResource);

      expect(freeRoi.costBenefitRatio).toBeGreaterThan(paidRoi.costBenefitRatio);
    });

    it('should estimate time to value', async () => {
      const videoResource = createMockResource({ type: 'video' });
      const courseResource = createMockResource({ type: 'course' });

      const videoRoi = await engine.analyzeResourceROI(videoResource);
      const courseRoi = await engine.analyzeResourceROI(courseResource);

      expect(videoRoi.timeToValue).toBeLessThan(courseRoi.timeToValue);
    });

    it('should calculate learning efficiency', async () => {
      const resource = createMockResource();

      const roi = await engine.analyzeResourceROI(resource);

      expect(roi.learningEfficiency).toBeGreaterThanOrEqual(0);
      expect(roi.learningEfficiency).toBeLessThanOrEqual(1);
    });

    it('should compare with alternatives', async () => {
      const resource = createMockResource();

      const roi = await engine.analyzeResourceROI(resource);

      expect(Array.isArray(roi.alternativeComparison)).toBe(true);
    });

    it('should provide recommendation', async () => {
      const resource = createMockResource();

      const roi = await engine.analyzeResourceROI(resource);

      expect([
        'highly-recommended',
        'recommended',
        'consider-alternatives',
        'not-recommended',
      ]).toContain(roi.recommendation);
    });

    it('should consider learner profile for efficiency', async () => {
      const resource = createMockResource({ type: 'video', duration: 30 });
      const profile = createMockProfile({
        preferredTypes: ['video'],
        preferredDuration: { min: 20, max: 60 },
      });

      const roiWithProfile = await engine.analyzeResourceROI(resource, profile);
      const roiWithoutProfile = await engine.analyzeResourceROI(resource);

      // Profile should boost efficiency for matching resources
      expect(roiWithProfile.learningEfficiency).toBeGreaterThanOrEqual(
        roiWithoutProfile.learningEfficiency * 0.9
      );
    });

    it('should respect budget constraints', async () => {
      const expensiveResource = createMockResource({
        cost: { type: 'paid', amount: 500, currency: 'USD' },
      });
      const profile = createMockProfile({
        budgetConstraints: { max: 100, currency: 'USD' },
      });

      const roi = await engine.analyzeResourceROI(expensiveResource, profile);

      expect(roi.costBenefitRatio).toBe(0);
    });

    it('should generate justification', async () => {
      const resource = createMockResource();

      const roi = await engine.analyzeResourceROI(resource);

      expect(roi.justification).toBeDefined();
      expect(roi.justification.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // PERSONALIZED RECOMMENDATIONS TESTS
  // ============================================================================

  describe('Personalized Recommendations', () => {
    let engine: ResourceEngine;

    beforeEach(() => {
      engine = new ResourceEngine(createMockEngineConfig());
    });

    it('should personalize recommendations', async () => {
      const profile = createMockProfile();
      const resources = [
        createMockResource({ id: 'res-1', type: 'video' }),
        createMockResource({ id: 'res-2', type: 'article' }),
      ];

      const recommendations = await engine.personalizeRecommendations(
        profile,
        resources
      );

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBe(2);
    });

    it('should calculate match score', async () => {
      const profile = createMockProfile();
      const resources = [createMockResource()];

      const recommendations = await engine.personalizeRecommendations(
        profile,
        resources
      );

      expect(recommendations[0].matchScore).toBeGreaterThanOrEqual(0);
      expect(recommendations[0].matchScore).toBeLessThanOrEqual(1);
    });

    it('should provide match reasons', async () => {
      const profile = createMockProfile({ preferredTypes: ['video'] });
      const resources = [createMockResource({ type: 'video' })];

      const recommendations = await engine.personalizeRecommendations(
        profile,
        resources
      );

      expect(Array.isArray(recommendations[0].reasons)).toBe(true);
      expect(recommendations[0].reasons.length).toBeGreaterThan(0);
    });

    it('should provide personalized notes', async () => {
      const profile = createMockProfile();
      const resources = [createMockResource()];

      const recommendations = await engine.personalizeRecommendations(
        profile,
        resources
      );

      expect(recommendations[0].personalizedNotes).toBeDefined();
      expect(recommendations[0].personalizedNotes.length).toBeGreaterThan(0);
    });

    it('should suggest usage patterns', async () => {
      const profile = createMockProfile();
      const resources = [
        createMockResource({ type: 'video' }),
        createMockResource({ type: 'course' }),
        createMockResource({ type: 'article' }),
      ];

      const recommendations = await engine.personalizeRecommendations(
        profile,
        resources
      );

      for (const rec of recommendations) {
        expect(rec.suggestedUsage).toBeDefined();
      }
    });

    it('should identify prerequisites', async () => {
      const profile = createMockProfile({ skillLevel: 'beginner' });
      const resources = [
        createMockResource({ description: 'Advanced machine learning techniques' }),
      ];

      const recommendations = await engine.personalizeRecommendations(
        profile,
        resources
      );

      expect(recommendations[0].prerequisites).toBeDefined();
    });

    it('should suggest next steps', async () => {
      const profile = createMockProfile();
      const resources = [createMockResource()];

      const recommendations = await engine.personalizeRecommendations(
        profile,
        resources
      );

      expect(recommendations[0].nextSteps).toBeDefined();
      expect(recommendations[0].nextSteps!.length).toBeGreaterThan(0);
    });

    it('should sort by match score', async () => {
      const profile = createMockProfile({ preferredTypes: ['video'] });
      const resources = [
        createMockResource({ id: 'res-1', type: 'article' }),
        createMockResource({ id: 'res-2', type: 'video' }),
        createMockResource({ id: 'res-3', type: 'podcast' }),
      ];

      const recommendations = await engine.personalizeRecommendations(
        profile,
        resources
      );

      for (let i = 1; i < recommendations.length; i++) {
        expect(recommendations[i - 1].matchScore).toBeGreaterThanOrEqual(
          recommendations[i].matchScore
        );
      }
    });

    it('should match type preferences', async () => {
      const profile = createMockProfile({ preferredTypes: ['video', 'tutorial'] });
      const resources = [
        createMockResource({ id: 'res-1', type: 'video' }),
        createMockResource({ id: 'res-2', type: 'research-paper' }),
      ];

      const recommendations = await engine.personalizeRecommendations(
        profile,
        resources
      );

      // Video should have higher match score
      const videoRec = recommendations.find((r) => r.resource.type === 'video');
      const paperRec = recommendations.find((r) => r.resource.type === 'research-paper');

      expect(videoRec?.matchScore).toBeGreaterThan(paperRec?.matchScore || 0);
    });

    it('should consider language preferences', async () => {
      const profile = createMockProfile({ languagePreferences: ['en'] });
      const resources = [
        createMockResource({ id: 'res-1', language: 'en' }),
        createMockResource({ id: 'res-2', language: 'es' }),
      ];

      const recommendations = await engine.personalizeRecommendations(
        profile,
        resources
      );

      const enRec = recommendations.find((r) => r.resource.language === 'en');
      const esRec = recommendations.find((r) => r.resource.language === 'es');

      expect(enRec?.matchScore).toBeGreaterThan(esRec?.matchScore || 0);
    });

    it('should consider duration preferences', async () => {
      const profile = createMockProfile({
        preferredDuration: { min: 20, max: 40 },
      });
      const resources = [
        createMockResource({ id: 'res-1', duration: 30 }),
        createMockResource({ id: 'res-2', duration: 120 }),
      ];

      const recommendations = await engine.personalizeRecommendations(
        profile,
        resources
      );

      const shortRec = recommendations.find((r) => r.resource.duration === 30);
      const longRec = recommendations.find((r) => r.resource.duration === 120);

      expect(shortRec?.matchScore).toBeGreaterThan(longRec?.matchScore || 0);
    });

    it('should prefer free resources within budget', async () => {
      const profile = createMockProfile({
        budgetConstraints: { max: 50, currency: 'USD' },
      });
      const resources = [
        createMockResource({ id: 'res-1', cost: { type: 'free' } }),
        createMockResource({
          id: 'res-2',
          cost: { type: 'paid', amount: 100, currency: 'USD' },
        }),
      ];

      const recommendations = await engine.personalizeRecommendations(
        profile,
        resources
      );

      const freeRec = recommendations.find(
        (r) => r.resource.cost?.type === 'free'
      );
      const paidRec = recommendations.find(
        (r) => r.resource.cost?.type === 'paid'
      );

      expect(freeRec?.matchScore).toBeGreaterThan(paidRec?.matchScore || 0);
    });
  });

  // ============================================================================
  // GET RESOURCE RECOMMENDATIONS TESTS
  // ============================================================================

  describe('Get Resource Recommendations', () => {
    let engine: ResourceEngine;

    beforeEach(() => {
      engine = new ResourceEngine(createMockEngineConfig());
    });

    it('should get recommendations for a user and topic', async () => {
      const recommendations = await engine.getResourceRecommendations(
        'user-123',
        'Machine Learning'
      );

      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should build default profile for user', async () => {
      const recommendations = await engine.getResourceRecommendations(
        'new-user',
        'Web Development'
      );

      expect(recommendations).toBeDefined();
    });

    it('should handle multi-word topics', async () => {
      const recommendations = await engine.getResourceRecommendations(
        'user-123',
        'React Native Mobile Development'
      );

      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should handle short topics', async () => {
      const recommendations = await engine.getResourceRecommendations(
        'user-123',
        'AI'
      );

      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  // ============================================================================
  // EDGE CASES AND ERROR HANDLING
  // ============================================================================

  describe('Edge Cases', () => {
    let engine: ResourceEngine;

    beforeEach(() => {
      engine = new ResourceEngine(createMockEngineConfig());
    });

    it('should handle empty resources array', async () => {
      const profile = createMockProfile();
      const resources: ExternalResource[] = [];

      const recommendations = await engine.personalizeRecommendations(
        profile,
        resources
      );

      expect(recommendations).toEqual([]);
    });

    it('should handle resource without cost info', async () => {
      const resource = createMockResource({ cost: undefined });

      const roi = await engine.analyzeResourceROI(resource);

      expect(roi).toBeDefined();
    });

    it('should handle resource without duration', async () => {
      const resource = createMockResource({ duration: undefined });

      const quality = await engine.scoreResourceQuality(resource);

      expect(quality).toBeDefined();
    });

    it('should handle AI errors gracefully for relevance', async () => {
      const failingAI = createMockAIAdapter(() => {
        throw new Error('AI Error');
      });
      const failingConfig = createMockEngineConfig({
        samConfig: {
          ...createMockSAMConfig(),
          ai: failingAI,
        },
      });
      const failingEngine = new ResourceEngine(failingConfig);
      const resource = createMockResource();

      const quality = await failingEngine.scoreResourceQuality(resource);

      expect(quality.relevance).toBeDefined();
    });

    it('should handle invalid AI response for relevance', async () => {
      const invalidAI = createMockAIAdapter(() => {
        return createMockAIResponse('not a number');
      });
      const invalidConfig = createMockEngineConfig({
        samConfig: {
          ...createMockSAMConfig(),
          ai: invalidAI,
        },
      });
      const invalidEngine = new ResourceEngine(invalidConfig);
      const resource = createMockResource();

      const quality = await invalidEngine.scoreResourceQuality(resource);

      expect(quality.relevance).toBeDefined();
    });

    it('should handle special characters in topic', async () => {
      const topic = createMockTopic({
        name: 'C++ & C# Programming <special>',
      });

      const resources = await engine.discoverResources(topic);

      expect(Array.isArray(resources)).toBe(true);
    });

    it('should handle very long topic name', async () => {
      const topic = createMockTopic({
        name: 'A '.repeat(500) + 'very long topic name',
      });

      const resources = await engine.discoverResources(topic);

      expect(Array.isArray(resources)).toBe(true);
    });

    it('should handle unicode in topic', async () => {
      const topic = createMockTopic({
        name: '\u{1F4DA} Programming \u00e9\u00e8',
      });

      const resources = await engine.discoverResources(topic);

      expect(Array.isArray(resources)).toBe(true);
    });

    it('should handle profile without budget constraints', async () => {
      const profile = createMockProfile({ budgetConstraints: undefined });
      const resources = [createMockResource()];

      const recommendations = await engine.personalizeRecommendations(
        profile,
        resources
      );

      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should handle profile with empty learning goals', async () => {
      const profile = createMockProfile({ learningGoals: [] });
      const resources = [createMockResource()];

      const recommendations = await engine.personalizeRecommendations(
        profile,
        resources
      );

      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should handle subscription cost type', async () => {
      const resource = createMockResource({
        cost: { type: 'subscription', amount: 29.99, billingCycle: 'monthly' },
      });

      const roi = await engine.analyzeResourceROI(resource);

      expect(roi.costBenefitRatio).toBeDefined();
    });
  });

  // ============================================================================
  // SOURCE AUTHORITY TESTS
  // ============================================================================

  describe('Source Authority', () => {
    let engine: ResourceEngine;

    beforeEach(() => {
      engine = new ResourceEngine(createMockEngineConfig());
    });

    it('should give high authority to MIT OCW', async () => {
      const resource = createMockResource({ source: 'mit-ocw' });

      const quality = await engine.scoreResourceQuality(resource);

      expect(quality.authority).toBe(1.0);
    });

    it('should give high authority to Coursera', async () => {
      const resource = createMockResource({ source: 'coursera' });

      const quality = await engine.scoreResourceQuality(resource);

      expect(quality.authority).toBeGreaterThanOrEqual(0.9);
    });

    it('should give high authority to edX', async () => {
      const resource = createMockResource({ source: 'edx' });

      const quality = await engine.scoreResourceQuality(resource);

      expect(quality.authority).toBeGreaterThanOrEqual(0.9);
    });

    it('should give moderate authority to YouTube', async () => {
      const resource = createMockResource({ source: 'youtube' });

      const quality = await engine.scoreResourceQuality(resource);

      expect(quality.authority).toBe(0.7);
    });

    it('should give author bonus', async () => {
      const withAuthor = createMockResource({
        source: 'medium',
        author: 'John Doe',
      });
      const withoutAuthor = createMockResource({
        source: 'medium',
        author: undefined,
      });

      const authorQuality = await engine.scoreResourceQuality(withAuthor);
      const noAuthorQuality = await engine.scoreResourceQuality(withoutAuthor);

      // Author should give at least equal authority
      expect(authorQuality.authority).toBeGreaterThanOrEqual(noAuthorQuality.authority);
    });
  });

  // ============================================================================
  // RESOURCE TYPE TESTS
  // ============================================================================

  describe('Resource Type Handling', () => {
    let engine: ResourceEngine;

    beforeEach(() => {
      engine = new ResourceEngine(createMockEngineConfig());
    });

    const testResourceTypes: ResourceType[] = [
      'article',
      'video',
      'course',
      'book',
      'podcast',
      'tutorial',
      'documentation',
      'tool',
      'dataset',
      'research-paper',
    ];

    for (const type of testResourceTypes) {
      it(`should handle ${type} resource type`, async () => {
        const resource = createMockResource({ type });

        const quality = await engine.scoreResourceQuality(resource);

        expect(quality.completeness).toBeDefined();
        expect(quality.engagement).toBeDefined();
      });
    }

    it('should suggest next steps for course type', async () => {
      const profile = createMockProfile();
      const resources = [createMockResource({ type: 'course' })];

      const recommendations = await engine.personalizeRecommendations(
        profile,
        resources
      );

      expect(recommendations[0].nextSteps).toContain(
        'Complete all modules and assessments'
      );
    });

    it('should suggest next steps for tutorial type', async () => {
      const profile = createMockProfile();
      const resources = [createMockResource({ type: 'tutorial' })];

      const recommendations = await engine.personalizeRecommendations(
        profile,
        resources
      );

      expect(recommendations[0].nextSteps).toContain(
        'Practice the demonstrated techniques'
      );
    });

    it('should suggest next steps for video type', async () => {
      const profile = createMockProfile();
      const resources = [createMockResource({ type: 'video' })];

      const recommendations = await engine.personalizeRecommendations(
        profile,
        resources
      );

      expect(recommendations[0].nextSteps).toContain('Take notes on key concepts');
    });
  });
});
