/**
 * Unified Bloom's Engine Tests
 *
 * Tests for Priority 1: Unified Bloom's Engine
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { UnifiedBloomsEngine, createUnifiedBloomsEngine } from '../unified-blooms-engine';
import type { UnifiedBloomsConfig } from '../../types/unified-blooms.types';
import type { SAMConfig, AIAdapter, AIChatParams, AIChatResponse } from '@sam-ai/core';

// Mock AI Adapter
const createMockAIAdapter = (): AIAdapter => ({
  name: 'mock-ai',
  version: '1.0.0',
  chat: async (params: AIChatParams): Promise<AIChatResponse> => ({
    content: JSON.stringify({
      dominantLevel: 'ANALYZE',
      distribution: {
        REMEMBER: 10,
        UNDERSTAND: 20,
        APPLY: 25,
        ANALYZE: 30,
        EVALUATE: 10,
        CREATE: 5,
      },
      confidence: 0.85,
      cognitiveDepth: 55,
      balance: 'well-balanced',
      gaps: ['CREATE'],
      recommendations: [
        {
          level: 'CREATE',
          action: 'Add more creative activities',
          priority: 'medium',
        },
      ],
    }),
    model: 'mock-model',
    usage: { inputTokens: 100, outputTokens: 200 },
    finishReason: 'stop',
  }),
  isConfigured: () => true,
  getModel: () => 'mock-model',
});

// Create mock SAM config
const createMockConfig = (): SAMConfig => ({
  ai: createMockAIAdapter(),
  features: {
    gamification: true,
    formSync: true,
    autoContext: true,
    emotionDetection: true,
    learningStyleDetection: true,
    streaming: true,
    analytics: true,
  },
  model: {
    name: 'mock-model',
    temperature: 0.7,
    maxTokens: 4000,
  },
  engine: {
    timeout: 30000,
    retries: 2,
    concurrency: 3,
    cacheEnabled: true,
    cacheTTL: 300,
  },
  maxConversationHistory: 50,
});

describe('UnifiedBloomsEngine', () => {
  let engine: UnifiedBloomsEngine;
  let config: UnifiedBloomsConfig;

  beforeEach(() => {
    config = {
      samConfig: createMockConfig(),
      defaultMode: 'standard',
      confidenceThreshold: 0.7,
      enableCache: true,
      cacheTTL: 3600,
    };
    engine = createUnifiedBloomsEngine(config);
  });

  describe('quickClassify', () => {
    it('should classify content with REMEMBER keywords', () => {
      const content = 'Define the concept. List the key terms. Identify the main ideas.';
      const result = engine.quickClassify(content);
      expect(result).toBe('REMEMBER');
    });

    it('should classify content with UNDERSTAND keywords', () => {
      const content = 'Explain the process. Summarize the findings. Interpret the results.';
      const result = engine.quickClassify(content);
      expect(result).toBe('UNDERSTAND');
    });

    it('should classify content with APPLY keywords', () => {
      const content = 'Apply the formula. Demonstrate the technique. Solve the problem.';
      const result = engine.quickClassify(content);
      expect(result).toBe('APPLY');
    });

    it('should classify content with ANALYZE keywords', () => {
      const content = 'Analyze the data. Compare the approaches. Differentiate between concepts.';
      const result = engine.quickClassify(content);
      expect(result).toBe('ANALYZE');
    });

    it('should classify content with EVALUATE keywords', () => {
      const content = 'Evaluate the effectiveness. Judge the quality. Critique the argument.';
      const result = engine.quickClassify(content);
      expect(result).toBe('EVALUATE');
    });

    it('should classify content with CREATE keywords', () => {
      const content = 'Create a design. Develop a plan. Compose a solution.';
      const result = engine.quickClassify(content);
      expect(result).toBe('CREATE');
    });

    it('should return UNDERSTAND as default for empty content', () => {
      const result = engine.quickClassify('');
      expect(result).toBe('UNDERSTAND');
    });
  });

  describe('analyze', () => {
    it('should return keyword-based analysis in quick mode', async () => {
      const content = 'Analyze the data patterns. Compare different approaches.';
      const result = await engine.analyze(content, { mode: 'quick' });

      expect(result).toBeDefined();
      expect(result.dominantLevel).toBe('ANALYZE');
      expect(result.distribution).toBeDefined();
      expect(result.metadata.method).toBe('keyword');
      expect(result.metadata.processingTimeMs).toBeLessThan(100);
    });

    it('should include confidence in analysis result', async () => {
      const content = 'Explain the concept. Summarize the key points.';
      const result = await engine.analyze(content, { mode: 'quick' });

      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should identify gaps in distribution', async () => {
      const content = 'Define and list all key terms. Identify the concepts.';
      const result = await engine.analyze(content, { mode: 'quick' });

      expect(result.gaps).toBeDefined();
      expect(Array.isArray(result.gaps)).toBe(true);
    });

    it('should provide recommendations', async () => {
      const content = 'Explain the process. Summarize the findings.';
      const result = await engine.analyze(content, { mode: 'quick' });

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should escalate to AI in comprehensive mode', async () => {
      const content = 'Analyze the complex patterns in the data.';
      const result = await engine.analyze(content, { mode: 'comprehensive' });

      expect(result).toBeDefined();
      expect(result.metadata.method).toBe('ai');
      expect(result.metadata.aiModel).toBeDefined();
    });

    it('should use cache for repeated requests', async () => {
      const content = 'Explain the concept. Summarize the key points.';

      // First call
      const result1 = await engine.analyze(content, { mode: 'quick' });
      expect(result1.metadata.fromCache).toBe(false);

      // Second call (should hit cache)
      const result2 = await engine.analyze(content, { mode: 'quick' });
      expect(result2.metadata.fromCache).toBe(true);

      // Results should be equivalent
      expect(result1.dominantLevel).toBe(result2.dominantLevel);
    });
  });

  describe('analyzeCourse', () => {
    it('should analyze a course structure', async () => {
      const courseData = {
        id: 'course-1',
        title: 'Introduction to Programming',
        description: 'Learn the fundamentals of programming',
        chapters: [
          {
            id: 'ch-1',
            title: 'Getting Started',
            position: 1,
            sections: [
              {
                id: 's-1',
                title: 'What is Programming?',
                content: 'Explain what programming is. Define key concepts.',
              },
              {
                id: 's-2',
                title: 'Your First Program',
                content: 'Apply the basics. Create your first program.',
              },
            ],
          },
          {
            id: 'ch-2',
            title: 'Variables and Data Types',
            position: 2,
            sections: [
              {
                id: 's-3',
                title: 'Understanding Variables',
                content: 'Analyze how variables work. Compare different data types.',
              },
            ],
          },
        ],
      };

      const result = await engine.analyzeCourse(courseData, { mode: 'quick' });

      expect(result).toBeDefined();
      expect(result.courseId).toBe('course-1');
      expect(result.courseLevel).toBeDefined();
      expect(result.chapters).toHaveLength(2);
      expect(result.recommendations).toBeDefined();
      expect(result.learningPathway).toBeDefined();
    });

    it('should provide chapter-level analysis', async () => {
      const courseData = {
        id: 'course-1',
        title: 'Test Course',
        chapters: [
          {
            id: 'ch-1',
            title: 'Chapter 1',
            position: 1,
            sections: [
              { id: 's-1', title: 'Section 1', content: 'Define concepts.' },
            ],
          },
        ],
      };

      const result = await engine.analyzeCourse(courseData);

      expect(result.chapters).toHaveLength(1);
      expect(result.chapters[0].chapterId).toBe('ch-1');
      expect(result.chapters[0].distribution).toBeDefined();
      expect(result.chapters[0].primaryLevel).toBeDefined();
    });
  });

  describe('calculateSpacedRepetition', () => {
    it('should calculate next review date for good performance', () => {
      const result = engine.calculateSpacedRepetition({
        userId: 'user-1',
        conceptId: 'concept-1',
        performance: 0.9,
      });

      expect(result.nextReviewDate).toBeInstanceOf(Date);
      expect(result.intervalDays).toBeGreaterThan(0);
      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('should reset interval for poor performance', () => {
      const result = engine.calculateSpacedRepetition({
        userId: 'user-1',
        conceptId: 'concept-1',
        performance: 0.2, // Low performance
      });

      expect(result.intervalDays).toBe(1);
      expect(result.repetitionCount).toBe(0);
    });

    it('should increase interval for repeated success', () => {
      const result1 = engine.calculateSpacedRepetition({
        userId: 'user-1',
        conceptId: 'concept-1',
        performance: 0.8,
      });

      const result2 = engine.calculateSpacedRepetition({
        userId: 'user-1',
        conceptId: 'concept-1',
        performance: 0.8,
        previousInterval: result1.intervalDays,
        previousEaseFactor: result1.easeFactor,
      });

      expect(result2.intervalDays).toBeGreaterThanOrEqual(result1.intervalDays);
    });
  });

  describe('cache management', () => {
    it('should return cache stats', () => {
      const stats = engine.getCacheStats();

      expect(stats).toBeDefined();
      expect(typeof stats.hits).toBe('number');
      expect(typeof stats.misses).toBe('number');
      expect(typeof stats.size).toBe('number');
    });

    it('should clear cache', async () => {
      // Add something to cache
      await engine.analyze('Test content', { mode: 'quick' });

      const statsBefore = engine.getCacheStats();
      expect(statsBefore.size).toBeGreaterThan(0);

      engine.clearCache();

      const statsAfter = engine.getCacheStats();
      expect(statsAfter.size).toBe(0);
      expect(statsAfter.hits).toBe(0);
      expect(statsAfter.misses).toBe(0);
    });
  });

  describe('factory function', () => {
    it('should create engine with default options', () => {
      const minimalConfig: UnifiedBloomsConfig = {
        samConfig: createMockConfig(),
      };

      const minimalEngine = createUnifiedBloomsEngine(minimalConfig);

      expect(minimalEngine).toBeInstanceOf(UnifiedBloomsEngine);
    });

    it('should create engine with custom options', () => {
      const customConfig: UnifiedBloomsConfig = {
        samConfig: createMockConfig(),
        defaultMode: 'comprehensive',
        confidenceThreshold: 0.9,
        enableCache: false,
        cacheTTL: 7200,
      };

      const customEngine = createUnifiedBloomsEngine(customConfig);

      expect(customEngine).toBeInstanceOf(UnifiedBloomsEngine);
    });
  });
});
