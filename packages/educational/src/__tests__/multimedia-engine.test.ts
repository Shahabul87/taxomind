/**
 * MultimediaEngine Tests
 *
 * Comprehensive tests for multi-modal content analysis including
 * video, audio, and interactive content analysis.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SAMConfig, AIChatParams } from '@sam-ai/core';
import {
  MultimediaEngine,
  createMultimediaEngine,
} from '../engines/multimedia-engine';
import type {
  MultimediaEngineConfig,
  VideoContent,
  AudioContent,
  InteractiveContent,
  MultiModalContentTypes,
  VideoAnalysis,
  AudioAnalysis,
  InteractiveAnalysis,
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
    return createMockAIResponse(['recommendation 1', 'recommendation 2', 'recommendation 3']);
  });

  return {
    ...baseCreateMockSAMConfig(),
    ai: mockAI,
    ...overrides,
  };
};

const createMockEngineConfig = (
  overrides: Partial<MultimediaEngineConfig> = {}
): MultimediaEngineConfig => ({
  samConfig: createMockSAMConfig(),
  ...overrides,
});

const createMockVideoContent = (overrides: Partial<VideoContent> = {}): VideoContent => ({
  url: 'https://example.com/video.mp4',
  duration: 600, // 10 minutes
  format: 'mp4',
  courseId: 'course-123',
  chapterId: 'chapter-456',
  ...overrides,
});

const createMockAudioContent = (overrides: Partial<AudioContent> = {}): AudioContent => ({
  url: 'https://example.com/audio.mp3',
  duration: 300, // 5 minutes
  format: 'mp3',
  courseId: 'course-123',
  ...overrides,
});

const createMockInteractiveContent = (
  overrides: Partial<InteractiveContent> = {}
): InteractiveContent => ({
  type: 'quiz',
  elements: [
    {
      id: 'element-1',
      type: 'question',
      properties: { questionText: 'What is 2+2?' },
      interactions: ['answer', 'submit'],
    },
    {
      id: 'element-2',
      type: 'question',
      properties: { questionText: 'Explain the concept' },
      interactions: ['explain', 'describe', 'analyze'],
    },
  ],
  courseId: 'course-123',
  ...overrides,
});

const createMockVideoAnalysis = (overrides: Partial<VideoAnalysis> = {}): VideoAnalysis => ({
  transcription: 'Test transcription',
  visualElements: [
    { timestamp: 0, type: 'slide', description: 'Intro slide', educationalValue: 0.8 },
  ],
  teachingMethods: ['lecture', 'demonstration'],
  engagementScore: 0.85,
  accessibilityScore: 0.75,
  keyMoments: [
    { timestamp: 0, type: 'introduction', description: 'Course intro', importance: 0.9 },
  ],
  recommendedImprovements: ['Add captions'],
  cognitiveLoad: 'medium',
  ...overrides,
});

const createMockAudioAnalysis = (overrides: Partial<AudioAnalysis> = {}): AudioAnalysis => ({
  transcript: 'Test transcript',
  speakingPace: 150,
  clarity: 0.9,
  engagement: 0.8,
  keyTopics: ['topic1', 'topic2'],
  sentimentAnalysis: { overall: 'positive', confidence: 0.85 },
  recommendedImprovements: ['Add pauses'],
  ...overrides,
});

const createMockInteractiveAnalysis = (
  overrides: Partial<InteractiveAnalysis> = {}
): InteractiveAnalysis => ({
  interactivityLevel: 0.7,
  learningEffectiveness: 0.8,
  userEngagement: 0.85,
  skillsAssessed: ['problem-solving'],
  bloomsLevels: ['Remember', 'Understand'],
  accessibilityCompliance: { wcagLevel: 'AA', issues: [], score: 0.9 },
  recommendedEnhancements: ['Add hints'],
  ...overrides,
});

// ============================================================================
// CONSTRUCTOR AND INITIALIZATION TESTS
// ============================================================================

describe('MultimediaEngine', () => {
  describe('Constructor and Initialization', () => {
    it('should create engine with default configuration', () => {
      const config = createMockEngineConfig();
      const engine = new MultimediaEngine(config);

      expect(engine).toBeInstanceOf(MultimediaEngine);
    });

    it('should create engine using factory function', () => {
      const config = createMockEngineConfig();
      const engine = createMultimediaEngine(config);

      expect(engine).toBeInstanceOf(MultimediaEngine);
    });

    it('should create engine with database adapter', () => {
      const config = createMockEngineConfig({
        database: {
          query: vi.fn(),
          execute: vi.fn(),
        } as unknown as MultimediaEngineConfig['database'],
      });
      const engine = new MultimediaEngine(config);

      expect(engine).toBeInstanceOf(MultimediaEngine);
    });
  });

  // ============================================================================
  // VIDEO ANALYSIS TESTS
  // ============================================================================

  describe('Video Analysis', () => {
    let engine: MultimediaEngine;

    beforeEach(() => {
      engine = new MultimediaEngine(createMockEngineConfig());
    });

    it('should analyze video content', async () => {
      const content = createMockVideoContent();

      const analysis = await engine.analyzeVideo(content);

      expect(analysis).toBeDefined();
      expect(analysis.transcription).toBeDefined();
      expect(analysis.visualElements).toBeDefined();
      expect(analysis.teachingMethods).toBeDefined();
    });

    it('should return engagement score', async () => {
      const content = createMockVideoContent();

      const analysis = await engine.analyzeVideo(content);

      expect(analysis.engagementScore).toBeDefined();
      expect(analysis.engagementScore).toBeGreaterThanOrEqual(0);
      expect(analysis.engagementScore).toBeLessThanOrEqual(1);
    });

    it('should return accessibility score', async () => {
      const content = createMockVideoContent();

      const analysis = await engine.analyzeVideo(content);

      expect(analysis.accessibilityScore).toBeDefined();
      expect(analysis.accessibilityScore).toBeGreaterThanOrEqual(0);
      expect(analysis.accessibilityScore).toBeLessThanOrEqual(1);
    });

    it('should detect visual elements', async () => {
      const content = createMockVideoContent();

      const analysis = await engine.analyzeVideo(content);

      expect(Array.isArray(analysis.visualElements)).toBe(true);
      if (analysis.visualElements.length > 0) {
        expect(analysis.visualElements[0].timestamp).toBeDefined();
        expect(analysis.visualElements[0].type).toBeDefined();
        expect(analysis.visualElements[0].description).toBeDefined();
      }
    });

    it('should identify teaching methods', async () => {
      const content = createMockVideoContent();

      const analysis = await engine.analyzeVideo(content);

      expect(Array.isArray(analysis.teachingMethods)).toBe(true);
      expect(analysis.teachingMethods.length).toBeGreaterThan(0);
    });

    it('should identify key moments', async () => {
      const content = createMockVideoContent();

      const analysis = await engine.analyzeVideo(content);

      expect(Array.isArray(analysis.keyMoments)).toBe(true);
      if (analysis.keyMoments.length > 0) {
        expect(analysis.keyMoments[0].timestamp).toBeDefined();
        expect(analysis.keyMoments[0].type).toBeDefined();
        expect(analysis.keyMoments[0].importance).toBeDefined();
      }
    });

    it('should generate recommendations', async () => {
      const content = createMockVideoContent();

      const analysis = await engine.analyzeVideo(content);

      expect(Array.isArray(analysis.recommendedImprovements)).toBe(true);
      expect(analysis.recommendedImprovements.length).toBeGreaterThan(0);
    });

    it('should assess cognitive load', async () => {
      const content = createMockVideoContent();

      const analysis = await engine.analyzeVideo(content);

      expect(['low', 'medium', 'high']).toContain(analysis.cognitiveLoad);
    });

    it('should handle video without URL', async () => {
      const content = createMockVideoContent({ url: undefined });

      const analysis = await engine.analyzeVideo(content);

      expect(analysis).toBeDefined();
    });

    it('should handle video without chapter ID', async () => {
      const content = createMockVideoContent({ chapterId: undefined });

      const analysis = await engine.analyzeVideo(content);

      expect(analysis).toBeDefined();
    });

    it('should handle AI errors gracefully for recommendations', async () => {
      const failingAI = createMockAIAdapter(() => {
        throw new Error('AI Error');
      });
      const failingConfig = createMockEngineConfig({
        samConfig: {
          ...createMockSAMConfig(),
          ai: failingAI,
        },
      });
      const failingEngine = new MultimediaEngine(failingConfig);
      const content = createMockVideoContent();

      const analysis = await failingEngine.analyzeVideo(content);

      expect(analysis.recommendedImprovements.length).toBeGreaterThan(0);
    });

    it('should handle invalid AI JSON response', async () => {
      const invalidJsonAI = createMockAIAdapter(() => {
        return createMockAIResponse('not valid json');
      });
      const invalidJsonConfig = createMockEngineConfig({
        samConfig: {
          ...createMockSAMConfig(),
          ai: invalidJsonAI,
        },
      });
      const invalidEngine = new MultimediaEngine(invalidJsonConfig);
      const content = createMockVideoContent();

      const analysis = await invalidEngine.analyzeVideo(content);

      expect(analysis.recommendedImprovements.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // AUDIO ANALYSIS TESTS
  // ============================================================================

  describe('Audio Analysis', () => {
    let engine: MultimediaEngine;

    beforeEach(() => {
      engine = new MultimediaEngine(createMockEngineConfig());
    });

    it('should analyze audio content', async () => {
      const content = createMockAudioContent();

      const analysis = await engine.analyzeAudio(content);

      expect(analysis).toBeDefined();
      expect(analysis.transcript).toBeDefined();
      expect(analysis.speakingPace).toBeDefined();
    });

    it('should use provided transcript if available', async () => {
      const content = createMockAudioContent({
        transcript: 'Provided transcript text',
      });

      const analysis = await engine.analyzeAudio(content);

      expect(analysis.transcript).toBe('Provided transcript text');
    });

    it('should generate transcript if not provided', async () => {
      const content = createMockAudioContent({ transcript: undefined });

      const analysis = await engine.analyzeAudio(content);

      expect(analysis.transcript).toBeDefined();
    });

    it('should analyze speaking pace', async () => {
      const content = createMockAudioContent();

      const analysis = await engine.analyzeAudio(content);

      expect(analysis.speakingPace).toBeDefined();
      expect(analysis.speakingPace).toBeGreaterThan(0);
    });

    it('should assess audio clarity', async () => {
      const content = createMockAudioContent();

      const analysis = await engine.analyzeAudio(content);

      expect(analysis.clarity).toBeDefined();
      expect(analysis.clarity).toBeGreaterThanOrEqual(0);
      expect(analysis.clarity).toBeLessThanOrEqual(1);
    });

    it('should calculate audio engagement', async () => {
      const content = createMockAudioContent();

      const analysis = await engine.analyzeAudio(content);

      expect(analysis.engagement).toBeDefined();
      expect(analysis.engagement).toBeGreaterThanOrEqual(0);
      expect(analysis.engagement).toBeLessThanOrEqual(1);
    });

    it('should extract key topics', async () => {
      const content = createMockAudioContent();

      const analysis = await engine.analyzeAudio(content);

      expect(Array.isArray(analysis.keyTopics)).toBe(true);
    });

    it('should analyze sentiment', async () => {
      const content = createMockAudioContent();

      const analysis = await engine.analyzeAudio(content);

      expect(analysis.sentimentAnalysis).toBeDefined();
      expect(['positive', 'neutral', 'negative']).toContain(
        analysis.sentimentAnalysis.overall
      );
      expect(analysis.sentimentAnalysis.confidence).toBeGreaterThanOrEqual(0);
      expect(analysis.sentimentAnalysis.confidence).toBeLessThanOrEqual(1);
    });

    it('should generate audio recommendations', async () => {
      const content = createMockAudioContent();

      const analysis = await engine.analyzeAudio(content);

      expect(Array.isArray(analysis.recommendedImprovements)).toBe(true);
      expect(analysis.recommendedImprovements.length).toBeGreaterThan(0);
    });

    it('should handle audio without URL', async () => {
      const content = createMockAudioContent({ url: undefined });

      const analysis = await engine.analyzeAudio(content);

      expect(analysis).toBeDefined();
    });

    it('should handle AI errors gracefully for key topics', async () => {
      const failingAI = createMockAIAdapter(() => {
        throw new Error('AI Error');
      });
      const failingConfig = createMockEngineConfig({
        samConfig: {
          ...createMockSAMConfig(),
          ai: failingAI,
        },
      });
      const failingEngine = new MultimediaEngine(failingConfig);
      const content = createMockAudioContent();

      const analysis = await failingEngine.analyzeAudio(content);

      expect(Array.isArray(analysis.keyTopics)).toBe(true);
    });
  });

  // ============================================================================
  // INTERACTIVE ANALYSIS TESTS
  // ============================================================================

  describe('Interactive Analysis', () => {
    let engine: MultimediaEngine;

    beforeEach(() => {
      engine = new MultimediaEngine(createMockEngineConfig());
    });

    it('should analyze interactive content', async () => {
      const content = createMockInteractiveContent();

      const analysis = await engine.analyzeInteractive(content);

      expect(analysis).toBeDefined();
      expect(analysis.interactivityLevel).toBeDefined();
      expect(analysis.learningEffectiveness).toBeDefined();
    });

    it('should calculate interactivity level', async () => {
      const content = createMockInteractiveContent();

      const analysis = await engine.analyzeInteractive(content);

      expect(analysis.interactivityLevel).toBeGreaterThanOrEqual(0);
      expect(analysis.interactivityLevel).toBeLessThanOrEqual(1);
    });

    it('should give higher interactivity for VR content', async () => {
      const quizContent = createMockInteractiveContent({ type: 'quiz' });
      const vrContent = createMockInteractiveContent({ type: 'vr' });

      const quizAnalysis = await engine.analyzeInteractive(quizContent);
      const vrAnalysis = await engine.analyzeInteractive(vrContent);

      expect(vrAnalysis.interactivityLevel).toBeGreaterThan(quizAnalysis.interactivityLevel);
    });

    it('should give higher interactivity for AR content', async () => {
      const quizContent = createMockInteractiveContent({ type: 'quiz' });
      const arContent = createMockInteractiveContent({ type: 'ar' });

      const quizAnalysis = await engine.analyzeInteractive(quizContent);
      const arAnalysis = await engine.analyzeInteractive(arContent);

      expect(arAnalysis.interactivityLevel).toBeGreaterThan(quizAnalysis.interactivityLevel);
    });

    it('should assess learning effectiveness', async () => {
      const content = createMockInteractiveContent();

      const analysis = await engine.analyzeInteractive(content);

      expect(analysis.learningEffectiveness).toBeGreaterThanOrEqual(0);
      expect(analysis.learningEffectiveness).toBeLessThanOrEqual(1);
    });

    it('should predict user engagement for quiz', async () => {
      const content = createMockInteractiveContent({ type: 'quiz' });

      const analysis = await engine.analyzeInteractive(content);

      expect(analysis.userEngagement).toBe(0.7);
    });

    it('should predict higher engagement for games', async () => {
      const content = createMockInteractiveContent({ type: 'game' });

      const analysis = await engine.analyzeInteractive(content);

      expect(analysis.userEngagement).toBe(0.95);
    });

    it('should predict engagement for simulation', async () => {
      const content = createMockInteractiveContent({ type: 'simulation' });

      const analysis = await engine.analyzeInteractive(content);

      expect(analysis.userEngagement).toBe(0.9);
    });

    it('should identify assessed skills', async () => {
      const content = createMockInteractiveContent();

      const analysis = await engine.analyzeInteractive(content);

      expect(Array.isArray(analysis.skillsAssessed)).toBe(true);
      expect(analysis.skillsAssessed.length).toBeGreaterThan(0);
    });

    it('should map to Blooms levels based on interactions', async () => {
      const content = createMockInteractiveContent({
        elements: [
          {
            id: 'el-1',
            type: 'question',
            properties: {},
            interactions: ['explain', 'describe'],
          },
        ],
      });

      const analysis = await engine.analyzeInteractive(content);

      expect(analysis.bloomsLevels).toContain('Understand');
    });

    it('should detect Remember level from identify interaction', async () => {
      const content = createMockInteractiveContent({
        elements: [
          {
            id: 'el-1',
            type: 'question',
            properties: {},
            interactions: ['identify', 'recall'],
          },
        ],
      });

      const analysis = await engine.analyzeInteractive(content);

      expect(analysis.bloomsLevels).toContain('Remember');
    });

    it('should detect Apply level from apply interaction', async () => {
      const content = createMockInteractiveContent({
        elements: [
          {
            id: 'el-1',
            type: 'question',
            properties: {},
            interactions: ['apply', 'solve'],
          },
        ],
      });

      const analysis = await engine.analyzeInteractive(content);

      expect(analysis.bloomsLevels).toContain('Apply');
    });

    it('should detect Analyze level', async () => {
      const content = createMockInteractiveContent({
        elements: [
          {
            id: 'el-1',
            type: 'question',
            properties: {},
            interactions: ['analyze', 'compare'],
          },
        ],
      });

      const analysis = await engine.analyzeInteractive(content);

      expect(analysis.bloomsLevels).toContain('Analyze');
    });

    it('should detect Evaluate level', async () => {
      const content = createMockInteractiveContent({
        elements: [
          {
            id: 'el-1',
            type: 'question',
            properties: {},
            interactions: ['evaluate', 'judge'],
          },
        ],
      });

      const analysis = await engine.analyzeInteractive(content);

      expect(analysis.bloomsLevels).toContain('Evaluate');
    });

    it('should detect Create level', async () => {
      const content = createMockInteractiveContent({
        elements: [
          {
            id: 'el-1',
            type: 'question',
            properties: {},
            interactions: ['create', 'design'],
          },
        ],
      });

      const analysis = await engine.analyzeInteractive(content);

      expect(analysis.bloomsLevels).toContain('Create');
    });

    it('should check accessibility compliance', async () => {
      const content = createMockInteractiveContent();

      const analysis = await engine.analyzeInteractive(content);

      expect(analysis.accessibilityCompliance).toBeDefined();
      expect(analysis.accessibilityCompliance.wcagLevel).toBeDefined();
      expect(analysis.accessibilityCompliance.score).toBeGreaterThanOrEqual(0);
    });

    it('should flag accessibility issues for VR content', async () => {
      const content = createMockInteractiveContent({ type: 'vr' });

      const analysis = await engine.analyzeInteractive(content);

      expect(analysis.accessibilityCompliance.issues.length).toBeGreaterThan(0);
      expect(analysis.accessibilityCompliance.wcagLevel).toBe('A');
    });

    it('should flag accessibility issues for AR content', async () => {
      const content = createMockInteractiveContent({ type: 'ar' });

      const analysis = await engine.analyzeInteractive(content);

      expect(analysis.accessibilityCompliance.issues.length).toBeGreaterThan(0);
    });

    it('should not flag issues for quiz content', async () => {
      const content = createMockInteractiveContent({ type: 'quiz' });

      const analysis = await engine.analyzeInteractive(content);

      expect(analysis.accessibilityCompliance.issues.length).toBe(0);
      expect(analysis.accessibilityCompliance.wcagLevel).toBe('AA');
    });

    it('should generate interactive recommendations', async () => {
      const content = createMockInteractiveContent();

      const analysis = await engine.analyzeInteractive(content);

      expect(Array.isArray(analysis.recommendedEnhancements)).toBe(true);
      expect(analysis.recommendedEnhancements.length).toBeGreaterThan(0);
    });

    it('should handle empty elements array', async () => {
      const content = createMockInteractiveContent({ elements: [] });

      const analysis = await engine.analyzeInteractive(content);

      expect(analysis.interactivityLevel).toBe(0);
    });

    it('should handle elements without interactions', async () => {
      const content = createMockInteractiveContent({
        elements: [
          {
            id: 'el-1',
            type: 'static',
            properties: {},
            interactions: [],
          },
        ],
      });

      const analysis = await engine.analyzeInteractive(content);

      expect(analysis.bloomsLevels).toEqual([]);
    });
  });

  // ============================================================================
  // MULTI-MODAL INSIGHTS TESTS
  // ============================================================================

  describe('Multi-Modal Insights', () => {
    let engine: MultimediaEngine;

    beforeEach(() => {
      engine = new MultimediaEngine(createMockEngineConfig());
    });

    it('should generate multi-modal insights', async () => {
      const contentTypes: MultiModalContentTypes = {
        videos: [createMockVideoAnalysis()],
        audios: [createMockAudioAnalysis()],
        interactives: [createMockInteractiveAnalysis()],
      };

      const insights = await engine.generateMultiModalInsights('course-123', contentTypes);

      expect(insights).toBeDefined();
      expect(insights.overallEffectiveness).toBeDefined();
      expect(insights.learningStylesCovered).toBeDefined();
    });

    it('should calculate overall effectiveness', async () => {
      const contentTypes: MultiModalContentTypes = {
        videos: [createMockVideoAnalysis({ engagementScore: 0.8 })],
        audios: [createMockAudioAnalysis({ engagement: 0.7 })],
      };

      const insights = await engine.generateMultiModalInsights('course-123', contentTypes);

      expect(insights.overallEffectiveness).toBeGreaterThan(0);
    });

    it('should identify visual learning style for videos', async () => {
      const contentTypes: MultiModalContentTypes = {
        videos: [createMockVideoAnalysis()],
      };

      const insights = await engine.generateMultiModalInsights('course-123', contentTypes);

      expect(insights.learningStylesCovered).toContain('visual');
    });

    it('should identify auditory learning style for audio', async () => {
      const contentTypes: MultiModalContentTypes = {
        audios: [createMockAudioAnalysis()],
      };

      const insights = await engine.generateMultiModalInsights('course-123', contentTypes);

      expect(insights.learningStylesCovered).toContain('auditory');
    });

    it('should identify kinesthetic learning style for interactives', async () => {
      const contentTypes: MultiModalContentTypes = {
        interactives: [createMockInteractiveAnalysis()],
      };

      const insights = await engine.generateMultiModalInsights('course-123', contentTypes);

      expect(insights.learningStylesCovered).toContain('kinesthetic');
    });

    it('should identify experiential for high interactivity', async () => {
      const contentTypes: MultiModalContentTypes = {
        interactives: [createMockInteractiveAnalysis({ interactivityLevel: 0.9 })],
      };

      const insights = await engine.generateMultiModalInsights('course-123', contentTypes);

      expect(insights.learningStylesCovered).toContain('experiential');
    });

    it('should predict engagement based on variety', async () => {
      const singleType: MultiModalContentTypes = {
        videos: [createMockVideoAnalysis()],
      };

      const multipleTypes: MultiModalContentTypes = {
        videos: [createMockVideoAnalysis()],
        audios: [createMockAudioAnalysis()],
        interactives: [createMockInteractiveAnalysis()],
      };

      const singleInsights = await engine.generateMultiModalInsights(
        'course-123',
        singleType
      );
      const multipleInsights = await engine.generateMultiModalInsights(
        'course-123',
        multipleTypes
      );

      expect(multipleInsights.engagementPrediction).toBeGreaterThan(
        singleInsights.engagementPrediction
      );
    });

    it('should predict retention', async () => {
      const contentTypes: MultiModalContentTypes = {
        videos: [createMockVideoAnalysis()],
      };

      const insights = await engine.generateMultiModalInsights('course-123', contentTypes);

      expect(insights.retentionPrediction).toBeGreaterThanOrEqual(0);
      expect(insights.retentionPrediction).toBeLessThanOrEqual(1);
    });

    it('should provide tiered recommendations', async () => {
      const contentTypes: MultiModalContentTypes = {
        videos: [createMockVideoAnalysis()],
      };

      const insights = await engine.generateMultiModalInsights('course-123', contentTypes);

      expect(insights.recommendations).toBeDefined();
      expect(insights.recommendations.immediate).toBeDefined();
      expect(insights.recommendations.shortTerm).toBeDefined();
      expect(insights.recommendations.longTerm).toBeDefined();
    });

    it('should assess best practices alignment', async () => {
      const contentTypes: MultiModalContentTypes = {
        videos: [createMockVideoAnalysis({ accessibilityScore: 0.9 })],
      };

      const insights = await engine.generateMultiModalInsights('course-123', contentTypes);

      expect(insights.bestPracticesAlignment).toBeGreaterThanOrEqual(0);
      expect(insights.bestPracticesAlignment).toBeLessThanOrEqual(1);
    });

    it('should handle empty content types', async () => {
      const contentTypes: MultiModalContentTypes = {};

      const insights = await engine.generateMultiModalInsights('course-123', contentTypes);

      expect(insights.overallEffectiveness).toBe(0);
      expect(insights.learningStylesCovered).toEqual([]);
    });

    it('should handle undefined content arrays', async () => {
      const contentTypes: MultiModalContentTypes = {
        videos: undefined,
        audios: undefined,
        interactives: undefined,
      };

      const insights = await engine.generateMultiModalInsights('course-123', contentTypes);

      expect(insights).toBeDefined();
    });
  });

  // ============================================================================
  // CONTENT RECOMMENDATIONS TESTS
  // ============================================================================

  describe('Content Recommendations', () => {
    let engine: MultimediaEngine;

    beforeEach(() => {
      engine = new MultimediaEngine(createMockEngineConfig());
    });

    it('should get content recommendations', async () => {
      const recommendations = await engine.getContentRecommendations('course-123');

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should include navigation recommendations', async () => {
      const recommendations = await engine.getContentRecommendations('course-123');

      const hasNavigation = recommendations.some((r) =>
        r.toLowerCase().includes('navigation') || r.toLowerCase().includes('markers')
      );
      expect(hasNavigation).toBe(true);
    });

    it('should include accessibility recommendations', async () => {
      const recommendations = await engine.getContentRecommendations('course-123');

      const hasAccessibility = recommendations.some(
        (r) =>
          r.toLowerCase().includes('caption') ||
          r.toLowerCase().includes('accessible')
      );
      expect(hasAccessibility).toBe(true);
    });

    it('should include interactive recommendations', async () => {
      const recommendations = await engine.getContentRecommendations('course-123');

      const hasInteractive = recommendations.some(
        (r) =>
          r.toLowerCase().includes('quiz') || r.toLowerCase().includes('interactive')
      );
      expect(hasInteractive).toBe(true);
    });
  });

  // ============================================================================
  // ACCESSIBILITY REPORT TESTS
  // ============================================================================

  describe('Accessibility Report', () => {
    let engine: MultimediaEngine;

    beforeEach(() => {
      engine = new MultimediaEngine(createMockEngineConfig());
    });

    it('should get accessibility report', async () => {
      const report = await engine.getAccessibilityReport('course-123');

      expect(report).toBeDefined();
      expect(report.overallScore).toBeDefined();
      expect(report.issues).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });

    it('should return overall score between 0 and 1', async () => {
      const report = await engine.getAccessibilityReport('course-123');

      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(1);
    });

    it('should return issues array', async () => {
      const report = await engine.getAccessibilityReport('course-123');

      expect(Array.isArray(report.issues)).toBe(true);
    });

    it('should return recommendations array', async () => {
      const report = await engine.getAccessibilityReport('course-123');

      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should include caption recommendations', async () => {
      const report = await engine.getAccessibilityReport('course-123');

      const hasCaptions = report.recommendations.some((r) =>
        r.toLowerCase().includes('caption')
      );
      expect(hasCaptions).toBe(true);
    });

    it('should include screen reader recommendations', async () => {
      const report = await engine.getAccessibilityReport('course-123');

      const hasScreenReader = report.recommendations.some((r) =>
        r.toLowerCase().includes('screen reader')
      );
      expect(hasScreenReader).toBe(true);
    });

    it('should include keyboard accessibility recommendations', async () => {
      const report = await engine.getAccessibilityReport('course-123');

      const hasKeyboard = report.recommendations.some((r) =>
        r.toLowerCase().includes('keyboard')
      );
      expect(hasKeyboard).toBe(true);
    });
  });

  // ============================================================================
  // EDGE CASES AND ERROR HANDLING
  // ============================================================================

  describe('Edge Cases', () => {
    let engine: MultimediaEngine;

    beforeEach(() => {
      engine = new MultimediaEngine(createMockEngineConfig());
    });

    it('should handle video with zero duration', async () => {
      const content = createMockVideoContent({ duration: 0 });

      const analysis = await engine.analyzeVideo(content);

      expect(analysis).toBeDefined();
    });

    it('should handle audio with zero duration', async () => {
      const content = createMockAudioContent({ duration: 0 });

      const analysis = await engine.analyzeAudio(content);

      expect(analysis).toBeDefined();
    });

    it('should handle interactive with unknown type', async () => {
      const content = createMockInteractiveContent({
        type: 'unknown' as InteractiveContent['type'],
      });

      const analysis = await engine.analyzeInteractive(content);

      expect(analysis.userEngagement).toBe(0.7); // default value
    });

    it('should handle very long transcript', async () => {
      const longTranscript = 'word '.repeat(10000);
      const content = createMockAudioContent({ transcript: longTranscript });

      const analysis = await engine.analyzeAudio(content);

      expect(analysis).toBeDefined();
    });

    it('should handle special characters in transcript', async () => {
      const content = createMockAudioContent({
        transcript: 'Special <script>alert("xss")</script> & characters',
      });

      const analysis = await engine.analyzeAudio(content);

      expect(analysis).toBeDefined();
    });

    it('should handle unicode in content', async () => {
      const content = createMockAudioContent({
        transcript: '\u{1F600} Unicode emoji and \u00e9\u00e8\u00ea characters',
      });

      const analysis = await engine.analyzeAudio(content);

      expect(analysis).toBeDefined();
    });

    it('should handle empty courseId', async () => {
      const content = createMockVideoContent({ courseId: '' });

      const analysis = await engine.analyzeVideo(content);

      expect(analysis).toBeDefined();
    });

    it('should handle multiple videos in multi-modal', async () => {
      const contentTypes: MultiModalContentTypes = {
        videos: [
          createMockVideoAnalysis({ engagementScore: 0.9 }),
          createMockVideoAnalysis({ engagementScore: 0.7 }),
          createMockVideoAnalysis({ engagementScore: 0.8 }),
        ],
      };

      const insights = await engine.generateMultiModalInsights('course-123', contentTypes);

      // Use toBeCloseTo for floating point comparisons
      expect(insights.overallEffectiveness).toBeCloseTo(0.8, 5);
    });

    it('should handle lab type interactive', async () => {
      const content = createMockInteractiveContent({ type: 'lab' });

      const analysis = await engine.analyzeInteractive(content);

      expect(analysis.userEngagement).toBe(0.8);
    });

    it('should handle simulation type interactive', async () => {
      const content = createMockInteractiveContent({ type: 'simulation' });

      const analysis = await engine.analyzeInteractive(content);

      expect(analysis.userEngagement).toBe(0.9);
    });

    it('should handle many interactions for interactivity calculation', async () => {
      const manyInteractions = createMockInteractiveContent({
        elements: [
          { id: 'el-1', type: 'q', properties: {}, interactions: ['a', 'b', 'c', 'd', 'e'] },
          { id: 'el-2', type: 'q', properties: {}, interactions: ['a', 'b', 'c', 'd', 'e'] },
          { id: 'el-3', type: 'q', properties: {}, interactions: ['a', 'b', 'c', 'd', 'e'] },
        ],
      });

      const analysis = await engine.analyzeInteractive(manyInteractions);

      expect(analysis.interactivityLevel).toBe(1); // Capped at 1
    });
  });

  // ============================================================================
  // INTEGRATION SCENARIOS
  // ============================================================================

  describe('Integration Scenarios', () => {
    let engine: MultimediaEngine;

    beforeEach(() => {
      engine = new MultimediaEngine(createMockEngineConfig());
    });

    it('should analyze complete course content', async () => {
      // Analyze video
      const videoAnalysis = await engine.analyzeVideo(createMockVideoContent());

      // Analyze audio
      const audioAnalysis = await engine.analyzeAudio(createMockAudioContent());

      // Analyze interactive
      const interactiveAnalysis = await engine.analyzeInteractive(
        createMockInteractiveContent()
      );

      // Generate multi-modal insights
      const insights = await engine.generateMultiModalInsights('course-123', {
        videos: [videoAnalysis],
        audios: [audioAnalysis],
        interactives: [interactiveAnalysis],
      });

      // Should cover multiple learning styles (at least visual, auditory, kinesthetic)
      expect(insights.learningStylesCovered.length).toBeGreaterThanOrEqual(3);
      expect(insights.overallEffectiveness).toBeGreaterThan(0);
    });

    it('should provide comprehensive recommendations', async () => {
      const contentRecommendations = await engine.getContentRecommendations('course-123');
      const accessibilityReport = await engine.getAccessibilityReport('course-123');

      // Total recommendations should cover multiple aspects
      const totalRecommendations = [
        ...contentRecommendations,
        ...accessibilityReport.recommendations,
      ];

      expect(totalRecommendations.length).toBeGreaterThan(5);
    });
  });
});
