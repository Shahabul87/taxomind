/**
 * Tests for AdaptiveContentEngine
 * @sam-ai/educational
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdaptiveContentEngine, createAdaptiveContentEngine } from '../engines/adaptive-content-engine';
import type {
  AdaptiveContentConfig,
  AdaptiveLearnerProfile,
  ContentToAdapt,
  AdaptationOptions,
  ContentInteractionData,
  AdaptiveContentDatabaseAdapter,
} from '../types/adaptive-content.types';

function makeProfile(overrides: Partial<AdaptiveLearnerProfile> = {}): AdaptiveLearnerProfile {
  return {
    userId: 'user-1',
    primaryStyle: 'visual',
    secondaryStyle: undefined,
    styleScores: { visual: 40, auditory: 20, reading: 20, kinesthetic: 20 },
    preferredFormats: ['video', 'diagram', 'infographic'],
    preferredComplexity: 'standard',
    readingPace: 'moderate',
    preferredSessionDuration: 25,
    knownConcepts: ['basics'],
    conceptsInProgress: [],
    strugglingAreas: [],
    confidence: 0.7,
    lastUpdated: new Date(),
    ...overrides,
  };
}

function makeContent(overrides: Partial<ContentToAdapt> = {}): ContentToAdapt {
  return {
    id: 'content-1',
    title: 'Test Content',
    content: 'This is educational content about testing concepts.',
    topic: 'unit testing',
    concepts: ['mocking', 'assertions', 'coverage'],
    prerequisites: ['programming basics'],
    ...overrides,
  };
}

describe('AdaptiveContentEngine', () => {
  let engine: AdaptiveContentEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new AdaptiveContentEngine();
  });

  it('should adapt content for a visual learner', async () => {
    const profile = makeProfile({ primaryStyle: 'visual' });
    const content = makeContent();

    const result = await engine.adaptContent(content, profile);

    expect(result.originalId).toBe('content-1');
    expect(result.chunks.length).toBeGreaterThan(0);
    expect(result.adaptationInfo.targetStyle).toBe('visual');
    expect(result.summary).toContain('Visual');
  });

  it('should adapt difficulty for simplified complexity', async () => {
    const profile = makeProfile({ preferredComplexity: 'simplified' });
    const content = makeContent({
      content: 'Furthermore, we must utilize advanced algorithms to demonstrate results.',
    });

    const result = await engine.adaptContent(content, profile, {
      targetComplexity: 'simplified',
    });

    const mainChunk = result.chunks.find((c) => c.type === 'main');
    expect(mainChunk).toBeDefined();
    // Simplified content should replace complex words
    expect(mainChunk!.content).not.toContain('Furthermore');
    expect(mainChunk!.content).toContain('also');
  });

  it('should recommend supplementary resources for the target style', async () => {
    const profile = makeProfile({ primaryStyle: 'kinesthetic' });
    const content = makeContent();

    const result = await engine.adaptContent(content, profile, {
      includeSupplementary: true,
    });

    expect(result.supplementaryResources.length).toBeGreaterThan(0);
    expect(result.supplementaryResources[0].targetStyle).toBe('kinesthetic');
  });

  it('should handle unknown skill level with multimodal default', async () => {
    const result = await engine.detectLearningStyle('unknown-user');

    expect(result.primaryStyle).toBe('multimodal');
    expect(result.confidence).toBe(0.3);
    expect(result.scores.visual).toBe(25);
  });

  it('should sequence content chunks in order', async () => {
    const profile = makeProfile({ primaryStyle: 'visual' });
    const content = makeContent();

    const result = await engine.adaptContent(content, profile);

    const orders = result.chunks.map((c) => c.order);
    for (let i = 1; i < orders.length; i++) {
      expect(orders[i]).toBeGreaterThanOrEqual(orders[i - 1]);
    }
  });

  it('should check prerequisites and add scaffolding for unknown concepts', async () => {
    const profile = makeProfile({ knownConcepts: [] });
    const content = makeContent({ prerequisites: ['variables', 'functions'] });

    const result = await engine.adaptContent(content, profile, {
      addScaffolding: true,
    });

    expect(result.scaffolding).toBeDefined();
    expect(result.scaffolding!.length).toBe(2);
    expect(result.scaffolding![0].concept).toBe('variables');
  });

  it('should adapt for auditory learning style', async () => {
    const profile = makeProfile({ primaryStyle: 'auditory' });
    const content = makeContent();

    const result = await engine.adaptContent(content, profile);

    expect(result.adaptationInfo.targetStyle).toBe('auditory');
    expect(result.summary).toContain('Read Aloud');
  });

  it('should detect content gaps when no prerequisites are known', async () => {
    const profile = makeProfile({ knownConcepts: ['basics'] });
    const content = makeContent({ prerequisites: ['basics', 'advanced-topic'] });

    const result = await engine.adaptContent(content, profile, {
      addScaffolding: true,
    });

    expect(result.scaffolding).toBeDefined();
    expect(result.scaffolding!.length).toBe(1);
    expect(result.scaffolding![0].concept).toBe('advanced-topic');
  });

  it('should generate knowledge checks from content concepts', async () => {
    const profile = makeProfile();
    const content = makeContent({ concepts: ['testing', 'mocking'] });

    const result = await engine.adaptContent(content, profile, {
      includeKnowledgeChecks: true,
    });

    expect(result.knowledgeChecks.length).toBeGreaterThan(0);
    expect(result.knowledgeChecks[0].concept).toBe('testing');
  });

  it('should handle AI adapter failure with rule-based fallback', async () => {
    const mockAI = {
      chat: vi.fn().mockRejectedValue(new Error('AI failed')),
    };

    const engineWithAI = new AdaptiveContentEngine({ aiAdapter: mockAI as never });
    const profile = makeProfile();
    const content = makeContent();

    const result = await engineWithAI.adaptContent(content, profile);

    expect(result.originalId).toBe('content-1');
    expect(result.chunks.length).toBeGreaterThan(0);
  });
});

describe('createAdaptiveContentEngine', () => {
  it('should create engine with factory function', () => {
    const engine = createAdaptiveContentEngine();
    expect(engine).toBeInstanceOf(AdaptiveContentEngine);
  });
});
