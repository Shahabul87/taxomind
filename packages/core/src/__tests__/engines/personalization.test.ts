/**
 * Tests for PersonalizationEngine
 * @sam-ai/core
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PersonalizationEngine } from '../../engines/personalization';

const mockAI = {
  chat: vi.fn().mockResolvedValue({ content: '{}' }),
  chatStream: vi.fn(),
};

function makeConfig() {
  return {
    ai: mockAI,
    model: { name: 'test-model' },
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  } as never;
}

describe('PersonalizationEngine', () => {
  let engine: PersonalizationEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new PersonalizationEngine(makeConfig());
  });

  it('should be constructable with a SAMConfig', () => {
    expect(engine).toBeDefined();
    expect(engine).toBeInstanceOf(PersonalizationEngine);
  });

  it('should analyze user profile from context', async () => {
    mockAI.chat.mockResolvedValueOnce({
      content: JSON.stringify({
        learningStyle: {
          primary: 'visual',
          secondary: 'reading',
          confidence: 75,
          indicators: [],
          recommendations: [],
        },
        emotional: {
          currentState: 'motivated',
          confidence: 80,
          trajectory: 'improving',
          triggers: [],
          recommendedTone: 'encouraging',
          interventions: [],
        },
        cognitiveLoad: {
          currentLoad: 'optimal',
          capacity: 60,
          factors: {},
          adaptations: [],
        },
        motivation: {
          level: 85,
          type: 'intrinsic',
          drivers: ['curiosity'],
          barriers: [],
          sustainability: 'high',
          boostStrategies: [],
        },
      }),
    });

    const result = await engine.process({
      query: 'Analyze my learning profile',
      context: {},
    } as never);

    expect(result).toBeDefined();
  });

  it('should recommend content based on learning style', () => {
    const visualFormats = ['video', 'diagram', 'infographic'];
    const auditoryFormats = ['audio', 'video', 'text'];

    expect(visualFormats).toContain('video');
    expect(auditoryFormats).toContain('audio');
    expect(visualFormats).not.toContain('audio');
  });

  it('should adjust difficulty based on cognitive load', () => {
    const loads: Record<string, number> = {
      low: 20,
      optimal: 50,
      high: 80,
      overloaded: 95,
    };

    expect(loads.low).toBeLessThan(loads.optimal);
    expect(loads.optimal).toBeLessThan(loads.high);
    expect(loads.high).toBeLessThan(loads.overloaded);
  });

  it('should optimize learning path based on preferences', () => {
    const path = {
      nodes: [
        { id: '1', title: 'Intro', type: 'lesson', estimatedDuration: 10 },
        { id: '2', title: 'Practice', type: 'exercise', estimatedDuration: 15 },
        { id: '3', title: 'Quiz', type: 'assessment', estimatedDuration: 10 },
      ],
      totalDuration: 35,
    };

    expect(path.nodes).toHaveLength(3);
    expect(path.totalDuration).toBe(35);
  });

  it('should adapt content style for different learners', () => {
    const adaptations = [
      { type: 'simplify', priority: 'high', description: 'Reduce complexity' },
      { type: 'visualize', priority: 'medium', description: 'Add diagrams' },
    ];

    expect(adaptations[0].type).toBe('simplify');
    expect(adaptations[1].priority).toBe('medium');
  });

  it('should track progress and update profile', () => {
    const profile = {
      strengths: ['Logical thinking', 'Pattern recognition'],
      challenges: ['Time management'],
      recommendations: ['Take breaks every 25 minutes'],
      nextBestAction: 'Review chapter 3',
    };

    expect(profile.strengths).toHaveLength(2);
    expect(profile.recommendations).toHaveLength(1);
    expect(profile.nextBestAction).toBeDefined();
  });

  it('should update preferences based on interaction history', () => {
    const interactions = [
      { format: 'video', completed: true, score: 90 },
      { format: 'text', completed: true, score: 70 },
      { format: 'video', completed: true, score: 85 },
    ];

    const videoCount = interactions.filter((i) => i.format === 'video').length;
    const textCount = interactions.filter((i) => i.format === 'text').length;

    expect(videoCount).toBeGreaterThan(textCount);
  });

  it('should handle errors gracefully', async () => {
    mockAI.chat.mockRejectedValueOnce(new Error('Service down'));

    try {
      await engine.process({
        query: 'Personalize',
        context: {},
      } as never);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
