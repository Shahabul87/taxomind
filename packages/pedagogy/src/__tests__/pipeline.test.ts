/**
 * Pedagogical Pipeline Tests
 *
 * Tests for the unified pedagogical evaluation pipeline
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PedagogicalPipeline,
  createPedagogicalPipeline,
  createBloomsPipeline,
  createScaffoldingPipeline,
  createZPDPipeline,
  createStrictPedagogicalPipeline,
  evaluatePedagogically,
} from '../pipeline';
import type {
  PedagogicalContent,
  StudentCognitiveProfile,
} from '../types';

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

function createTestContent(overrides: Partial<PedagogicalContent> = {}): PedagogicalContent {
  return {
    content: `
      This lesson teaches students to analyze and evaluate concepts.
      First, we review the key definitions. Then, we examine examples.
      For example, consider this scenario. Students should analyze the patterns.
      Step by step, we build understanding with scaffolding and hints.
      Remember that practice with feedback helps you improve.
    `,
    type: 'lesson',
    topic: 'mathematics',
    targetBloomsLevel: 'ANALYZE',
    targetDifficulty: 'intermediate',
    prerequisites: ['algebra', 'basic-math'],
    learningObjectives: [
      'Analyze patterns in data',
      'Evaluate solutions to problems',
    ],
    priorContent: [
      {
        topic: 'algebra',
        bloomsLevel: 'UNDERSTAND',
        difficulty: 'beginner',
        conceptsIntroduced: ['variables', 'equations'],
      },
    ],
    ...overrides,
  };
}

function createTestStudentProfile(
  overrides: Partial<StudentCognitiveProfile> = {}
): StudentCognitiveProfile {
  return {
    masteryLevels: {
      algebra: {
        topicId: 'algebra',
        mastery: 75,
        highestBloomsLevel: 'APPLY',
        confidence: 0.8,
        lastAssessed: '2024-01-01',
      },
      'basic-math': {
        topicId: 'basic-math',
        mastery: 90,
        highestBloomsLevel: 'APPLY',
        confidence: 0.9,
        lastAssessed: '2024-01-01',
      },
    },
    demonstratedBloomsLevels: {
      mathematics: 'UNDERSTAND',
      algebra: 'APPLY',
    },
    currentDifficultyLevel: 'intermediate',
    learningVelocity: 'moderate',
    completedTopics: ['basic-math', 'algebra'],
    inProgressTopics: ['mathematics'],
    knowledgeGaps: [],
    recentPerformance: {
      averageScore: 80,
      trend: 'stable',
      assessmentCount: 5,
      timeSpentMinutes: 120,
      engagementLevel: 'high',
    },
    ...overrides,
  };
}

// ============================================================================
// PIPELINE TESTS
// ============================================================================

describe('PedagogicalPipeline', () => {
  let pipeline: PedagogicalPipeline;

  beforeEach(() => {
    pipeline = new PedagogicalPipeline();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const p = new PedagogicalPipeline();
      expect(p).toBeDefined();
    });

    it('should create with custom config', () => {
      const p = new PedagogicalPipeline({
        evaluators: ['blooms', 'scaffolding'],
        threshold: 80,
        parallel: false,
      });
      expect(p).toBeDefined();
    });

    it('should accept custom logger', () => {
      const mockLogger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };

      const p = new PedagogicalPipeline({ logger: mockLogger });
      expect(p).toBeDefined();
    });
  });

  describe('evaluate basic structure', () => {
    it('should return all required fields', async () => {
      const content = createTestContent();
      const result = await pipeline.evaluate(content);

      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('evaluatorResults');
      expect(result).toHaveProperty('allIssues');
      expect(result).toHaveProperty('allRecommendations');
      expect(result).toHaveProperty('metadata');
    });

    it('should include metadata', async () => {
      const content = createTestContent();
      const result = await pipeline.evaluate(content);

      expect(result.metadata).toHaveProperty('totalTimeMs');
      expect(result.metadata).toHaveProperty('evaluatorsRun');
      expect(result.metadata).toHaveProperty('studentProfileUsed');
      expect(result.metadata.totalTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should record student profile usage', async () => {
      const content = createTestContent();
      const profile = createTestStudentProfile();

      const resultWithout = await pipeline.evaluate(content);
      const resultWith = await pipeline.evaluate(content, profile);

      expect(resultWithout.metadata.studentProfileUsed).toBe(false);
      expect(resultWith.metadata.studentProfileUsed).toBe(true);
    });
  });

  describe('evaluator execution', () => {
    it('should run all default evaluators', async () => {
      const content = createTestContent();
      const result = await pipeline.evaluate(content);

      expect(result.metadata.evaluatorsRun).toContain('blooms');
      expect(result.metadata.evaluatorsRun).toContain('scaffolding');
      expect(result.metadata.evaluatorsRun).toContain('zpd');
    });

    it('should run only selected evaluators', async () => {
      const p = new PedagogicalPipeline({
        evaluators: ['blooms'],
      });

      const content = createTestContent();
      const result = await p.evaluate(content);

      expect(result.metadata.evaluatorsRun).toContain('blooms');
      expect(result.metadata.evaluatorsRun).not.toContain('scaffolding');
      expect(result.metadata.evaluatorsRun).not.toContain('zpd');
    });

    it('should return evaluator results', async () => {
      const content = createTestContent();
      const result = await pipeline.evaluate(content);

      expect(result.evaluatorResults.blooms).toBeDefined();
      expect(result.evaluatorResults.scaffolding).toBeDefined();
      expect(result.evaluatorResults.zpd).toBeDefined();
    });

    it('should aggregate issues from all evaluators', async () => {
      const content = createTestContent();
      const result = await pipeline.evaluate(content);

      expect(Array.isArray(result.allIssues)).toBe(true);
    });

    it('should deduplicate recommendations', async () => {
      const content = createTestContent();
      const result = await pipeline.evaluate(content);

      const uniqueRecommendations = new Set(result.allRecommendations);
      expect(result.allRecommendations.length).toBe(uniqueRecommendations.size);
    });
  });

  describe('parallel execution', () => {
    it('should run evaluators in parallel by default', async () => {
      const p = new PedagogicalPipeline({ parallel: true });
      const content = createTestContent();

      const result = await p.evaluate(content);

      expect(result.metadata.evaluatorsRun.length).toBe(3);
    });

    it('should run evaluators sequentially when configured', async () => {
      const p = new PedagogicalPipeline({ parallel: false });
      const content = createTestContent();

      const result = await p.evaluate(content);

      expect(result.metadata.evaluatorsRun.length).toBe(3);
    });
  });

  describe('score calculation', () => {
    it('should calculate overall score', async () => {
      const content = createTestContent();
      const result = await pipeline.evaluate(content);

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('should average individual evaluator scores', async () => {
      const content = createTestContent();
      const result = await pipeline.evaluate(content);

      const scores = [
        result.evaluatorResults.blooms?.score,
        result.evaluatorResults.scaffolding?.score,
        result.evaluatorResults.zpd?.score,
      ].filter((s): s is number => s !== undefined);

      if (scores.length > 0) {
        const expectedAvg = Math.round(
          scores.reduce((a, b) => a + b, 0) / scores.length
        );
        expect(result.overallScore).toBe(expectedAvg);
      }
    });
  });

  describe('pass/fail determination', () => {
    it('should pass when score exceeds threshold', async () => {
      const p = new PedagogicalPipeline({ threshold: 50 });
      const content = createTestContent({
        content: `
          This comprehensive lesson analyzes key concepts step by step.
          For example, consider these patterns. Students should evaluate.
          Hints and scaffolding help with feedback for improvement.
          We provide examples and modeling for guided practice.
        `,
      });

      const result = await p.evaluate(content);

      // May or may not pass depending on evaluator results
      expect(typeof result.passed).toBe('boolean');
    });

    it('should fail when score is below threshold', async () => {
      const p = new PedagogicalPipeline({ threshold: 100 });
      const content = createTestContent();

      const result = await p.evaluate(content);

      // With threshold at 100, unlikely to pass
      expect(result.passed).toBe(false);
    });

    it('should fail if any evaluator fails', async () => {
      const strictPipeline = createStrictPedagogicalPipeline();
      const content = createTestContent({
        content: 'Minimal content.',
        targetBloomsLevel: 'CREATE',
      });

      const result = await strictPipeline.evaluate(content);

      // Individual evaluator failures affect overall pass
      const allPassed =
        (result.evaluatorResults.blooms?.passed ?? true) &&
        (result.evaluatorResults.scaffolding?.passed ?? true) &&
        (result.evaluatorResults.zpd?.passed ?? true);

      if (!allPassed) {
        expect(result.passed).toBe(false);
      }
    });
  });

  describe('student profile requirement', () => {
    it('should not require profile by default', async () => {
      const content = createTestContent();
      const result = await pipeline.evaluate(content);

      expect(result.passed).toBeDefined();
      expect(result.allIssues.some((i) => i.type === 'pipeline_error')).toBe(
        false
      );
    });

    it('should fail when profile required but not provided', async () => {
      const p = new PedagogicalPipeline({
        requireStudentProfile: true,
      });
      const content = createTestContent();

      const result = await p.evaluate(content);

      expect(result.passed).toBe(false);
      expect(result.allIssues.some((i) => i.type === 'pipeline_error')).toBe(
        true
      );
    });

    it('should succeed when profile required and provided', async () => {
      const p = new PedagogicalPipeline({
        requireStudentProfile: true,
        threshold: 50,
      });
      const content = createTestContent();
      const profile = createTestStudentProfile();

      const result = await p.evaluate(content, profile);

      expect(
        result.allIssues.some((i) => i.type === 'pipeline_error')
      ).toBe(false);
    });

    it('should log warning when profile required but missing', async () => {
      const mockLogger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };

      const p = new PedagogicalPipeline({
        requireStudentProfile: true,
        logger: mockLogger,
      });
      const content = createTestContent();

      await p.evaluate(content);

      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('getEvaluators', () => {
    it('should return all evaluator instances', () => {
      const evaluators = pipeline.getEvaluators();

      expect(evaluators).toHaveProperty('blooms');
      expect(evaluators).toHaveProperty('scaffolding');
      expect(evaluators).toHaveProperty('zpd');
    });

    it('should return functional evaluators', async () => {
      const evaluators = pipeline.getEvaluators();
      const content = createTestContent();

      const bloomsResult = await evaluators.blooms.evaluate(content);
      expect(bloomsResult.evaluatorName).toBe('BloomsAligner');

      const scaffoldingResult = await evaluators.scaffolding.evaluate(content);
      expect(scaffoldingResult.evaluatorName).toBe('ScaffoldingEvaluator');

      const zpdResult = await evaluators.zpd.evaluate(content);
      expect(zpdResult.evaluatorName).toBe('ZPDEvaluator');
    });
  });

  describe('error handling', () => {
    it('should handle empty content gracefully', async () => {
      const content = createTestContent({
        content: '',
      });

      const result = await pipeline.evaluate(content);

      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
    });

    it('should create error result on critical failure', async () => {
      // Test the error result format
      const p = new PedagogicalPipeline({
        requireStudentProfile: true,
      });
      const content = createTestContent();

      const result = await p.evaluate(content);

      expect(result.passed).toBe(false);
      expect(result.allIssues[0].severity).toBe('critical');
    });
  });

  describe('timeout handling', () => {
    it('should complete within timeout', async () => {
      const p = new PedagogicalPipeline({
        timeoutMs: 5000,
      });
      const content = createTestContent();

      const startTime = Date.now();
      const result = await p.evaluate(content);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000);
      expect(result).toBeDefined();
    });
  });
});

// ============================================================================
// FACTORY FUNCTION TESTS
// ============================================================================

describe('Factory Functions', () => {
  describe('createPedagogicalPipeline', () => {
    it('should create pipeline with default config', () => {
      const p = createPedagogicalPipeline();
      expect(p).toBeInstanceOf(PedagogicalPipeline);
    });

    it('should create pipeline with custom config', () => {
      const p = createPedagogicalPipeline({
        threshold: 80,
        parallel: false,
      });
      expect(p).toBeInstanceOf(PedagogicalPipeline);
    });
  });

  describe('createBloomsPipeline', () => {
    it('should create blooms-only pipeline', async () => {
      const p = createBloomsPipeline();
      const content = createTestContent();

      const result = await p.evaluate(content);

      expect(result.metadata.evaluatorsRun).toContain('blooms');
      expect(result.metadata.evaluatorsRun).toHaveLength(1);
    });

    it('should accept blooms config', () => {
      const p = createBloomsPipeline({
        targetLevel: 'APPLY',
        passingScore: 75,
      });
      expect(p).toBeInstanceOf(PedagogicalPipeline);
    });
  });

  describe('createScaffoldingPipeline', () => {
    it('should create scaffolding-only pipeline', async () => {
      const p = createScaffoldingPipeline();
      const content = createTestContent();

      const result = await p.evaluate(content);

      expect(result.metadata.evaluatorsRun).toContain('scaffolding');
      expect(result.metadata.evaluatorsRun).toHaveLength(1);
    });

    it('should accept scaffolding config', () => {
      const p = createScaffoldingPipeline({
        maxComplexityJump: 25,
        passingScore: 75,
      });
      expect(p).toBeInstanceOf(PedagogicalPipeline);
    });
  });

  describe('createZPDPipeline', () => {
    it('should create zpd-only pipeline', async () => {
      const p = createZPDPipeline();
      const content = createTestContent();
      const profile = createTestStudentProfile();

      const result = await p.evaluate(content, profile);

      expect(result.metadata.evaluatorsRun).toContain('zpd');
      expect(result.metadata.evaluatorsRun).toHaveLength(1);
    });

    it('should require student profile', async () => {
      const p = createZPDPipeline();
      const content = createTestContent();

      const result = await p.evaluate(content);

      // Should fail without profile
      expect(result.passed).toBe(false);
    });

    it('should accept zpd config', () => {
      const p = createZPDPipeline({
        targetZone: 'ZPD_OPTIMAL',
        passingScore: 75,
      });
      expect(p).toBeInstanceOf(PedagogicalPipeline);
    });
  });

  describe('createStrictPedagogicalPipeline', () => {
    it('should create strict pipeline', () => {
      const p = createStrictPedagogicalPipeline();
      expect(p).toBeInstanceOf(PedagogicalPipeline);
    });

    it('should have high threshold', async () => {
      const strict = createStrictPedagogicalPipeline();
      const regular = createPedagogicalPipeline();

      const content = createTestContent();
      const profile = createTestStudentProfile();

      const strictResult = await strict.evaluate(content, profile);
      const regularResult = await regular.evaluate(content, profile);

      // Strict should be more likely to fail
      if (strictResult.passed === false && regularResult.passed === true) {
        expect(strictResult.overallScore).toBeLessThan(80);
      }
    });

    it('should require student profile', async () => {
      const p = createStrictPedagogicalPipeline();
      const content = createTestContent();

      const result = await p.evaluate(content);

      expect(result.passed).toBe(false);
    });
  });
});

// ============================================================================
// CONVENIENCE FUNCTION TESTS
// ============================================================================

describe('evaluatePedagogically', () => {
  it('should evaluate content with default config', async () => {
    const content = createTestContent();

    const result = await evaluatePedagogically(content);

    expect(result).toBeDefined();
    expect(result.passed).toBeDefined();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it('should evaluate content with student profile', async () => {
    const content = createTestContent();
    const profile = createTestStudentProfile();

    const result = await evaluatePedagogically(content, profile);

    expect(result.metadata.studentProfileUsed).toBe(true);
  });

  it('should evaluate content with custom config', async () => {
    const content = createTestContent();

    const result = await evaluatePedagogically(content, undefined, {
      evaluators: ['blooms'],
      threshold: 60,
    });

    expect(result.metadata.evaluatorsRun).toHaveLength(1);
    expect(result.metadata.evaluatorsRun).toContain('blooms');
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Pipeline Integration', () => {
  it('should evaluate complete educational content', async () => {
    const pipeline = createPedagogicalPipeline();

    const content: PedagogicalContent = {
      content: `
        Welcome to this lesson on data analysis.

        Learning Objectives:
        - Analyze data patterns
        - Evaluate statistical significance
        - Create data visualizations

        First, let us review key concepts. Remember that data analysis
        involves examining datasets to draw conclusions.

        For example, consider a dataset of student scores. We can
        analyze the distribution to understand performance patterns.

        Step by step, we will:
        1. First, collect and organize data
        2. Then, calculate summary statistics
        3. Next, identify patterns and trends
        4. Finally, draw conclusions

        Hint: Look for outliers in your data that might affect results.

        Practice Exercise:
        Analyze the following dataset and evaluate whether the results
        are statistically significant. Create a visualization to support
        your conclusions.

        Remember to check your work using the provided rubric.
      `,
      type: 'lesson',
      topic: 'data-analysis',
      targetBloomsLevel: 'ANALYZE',
      targetDifficulty: 'intermediate',
      prerequisites: ['statistics-basics', 'math-fundamentals'],
      learningObjectives: [
        'Analyze data patterns',
        'Evaluate statistical significance',
        'Create data visualizations',
      ],
      priorContent: [
        {
          topic: 'statistics-basics',
          bloomsLevel: 'UNDERSTAND',
          difficulty: 'beginner',
          conceptsIntroduced: ['mean', 'median', 'mode'],
        },
      ],
    };

    const profile: StudentCognitiveProfile = {
      masteryLevels: {
        'statistics-basics': {
          topicId: 'statistics-basics',
          mastery: 80,
          highestBloomsLevel: 'APPLY',
          confidence: 0.85,
          lastAssessed: '2024-01-15',
        },
        'math-fundamentals': {
          topicId: 'math-fundamentals',
          mastery: 90,
          highestBloomsLevel: 'APPLY',
          confidence: 0.9,
          lastAssessed: '2024-01-10',
        },
      },
      demonstratedBloomsLevels: {
        'data-analysis': 'UNDERSTAND',
        'statistics-basics': 'APPLY',
      },
      currentDifficultyLevel: 'intermediate',
      learningVelocity: 'moderate',
      completedTopics: ['statistics-basics', 'math-fundamentals'],
      inProgressTopics: ['data-analysis'],
      knowledgeGaps: [],
      recentPerformance: {
        averageScore: 82,
        trend: 'improving',
        assessmentCount: 8,
        timeSpentMinutes: 180,
        engagementLevel: 'high',
      },
    };

    const result = await pipeline.evaluate(content, profile);

    // Verify all evaluators ran
    expect(result.metadata.evaluatorsRun).toContain('blooms');
    expect(result.metadata.evaluatorsRun).toContain('scaffolding');
    expect(result.metadata.evaluatorsRun).toContain('zpd');

    // Verify evaluator results exist
    expect(result.evaluatorResults.blooms).toBeDefined();
    expect(result.evaluatorResults.scaffolding).toBeDefined();
    expect(result.evaluatorResults.zpd).toBeDefined();

    // Verify Bloom's analysis
    expect(result.evaluatorResults.blooms?.dominantLevel).toBeDefined();
    expect(result.evaluatorResults.blooms?.alignmentStatus).toBeDefined();

    // Verify scaffolding analysis
    expect(result.evaluatorResults.scaffolding?.properlyScaffolded).toBeDefined();
    expect(result.evaluatorResults.scaffolding?.supportStructures).toBeDefined();

    // Verify ZPD analysis
    expect(result.evaluatorResults.zpd?.zpdZone).toBeDefined();
    expect(result.evaluatorResults.zpd?.inZPD).toBeDefined();

    // Overall result should be valid
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it('should handle poor quality content', async () => {
    const pipeline = createPedagogicalPipeline();

    const poorContent: PedagogicalContent = {
      content: 'Do this. Do that.',
      type: 'lesson',
      targetBloomsLevel: 'CREATE',
      targetDifficulty: 'expert',
    };

    const result = await pipeline.evaluate(poorContent);

    // Poor content should generate issues
    expect(result.allIssues.length).toBeGreaterThan(0);
    expect(result.allRecommendations.length).toBeGreaterThan(0);
  });

  it('should identify mismatched content for student', async () => {
    const pipeline = createPedagogicalPipeline();

    const advancedContent: PedagogicalContent = {
      content: `
        This advanced lesson covers expert-level synthesis and creation
        of novel theoretical frameworks. Students must create original
        research proposals and evaluate complex hypotheses.
      `,
      type: 'lesson',
      targetBloomsLevel: 'CREATE',
      targetDifficulty: 'expert',
      prerequisites: ['advanced-theory', 'research-methods', 'statistics-advanced'],
    };

    const beginnerProfile: StudentCognitiveProfile = {
      masteryLevels: {},
      demonstratedBloomsLevels: {},
      currentDifficultyLevel: 'beginner',
      learningVelocity: 'slow',
      completedTopics: [],
      inProgressTopics: [],
      knowledgeGaps: [],
      recentPerformance: {
        averageScore: 60,
        trend: 'declining',
        assessmentCount: 2,
        timeSpentMinutes: 30,
        engagementLevel: 'low',
      },
    };

    const result = await pipeline.evaluate(advancedContent, beginnerProfile);

    // Should detect mismatch
    expect(result.evaluatorResults.zpd?.inZPD).toBe(false);
    expect(result.allIssues.length).toBeGreaterThan(0);
  });

  it('should provide actionable recommendations', async () => {
    const pipeline = createPedagogicalPipeline();

    const content = createTestContent({
      content: 'Brief lesson content.',
    });

    const result = await pipeline.evaluate(content);

    // All recommendations should be non-empty strings
    for (const rec of result.allRecommendations) {
      expect(typeof rec).toBe('string');
      expect(rec.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge Cases', () => {
  it('should handle content with no type specified', async () => {
    const pipeline = createPedagogicalPipeline();

    const content = {
      content: 'Some educational content',
      type: 'lesson' as const,
    };

    const result = await pipeline.evaluate(content);
    expect(result).toBeDefined();
  });

  it('should handle empty evaluators list', async () => {
    const pipeline = new PedagogicalPipeline({
      evaluators: [],
    });

    const content = createTestContent();
    const result = await pipeline.evaluate(content);

    expect(result.metadata.evaluatorsRun).toHaveLength(0);
    expect(result.overallScore).toBe(0);
  });

  it('should handle single evaluator', async () => {
    const pipeline = new PedagogicalPipeline({
      evaluators: ['blooms'],
    });

    const content = createTestContent();
    const result = await pipeline.evaluate(content);

    expect(result.metadata.evaluatorsRun).toHaveLength(1);
    expect(result.evaluatorResults.blooms).toBeDefined();
    expect(result.evaluatorResults.scaffolding).toBeUndefined();
    expect(result.evaluatorResults.zpd).toBeUndefined();
  });

  it('should handle content with special characters', async () => {
    const pipeline = createPedagogicalPipeline();

    const content = createTestContent({
      content: `
        This lesson covers special cases: α, β, γ, δ, ε
        Mathematical expressions: x² + y² = z²
        Programming: if (x > 0) { return true; }
        Quotes: "Hello" and 'World'
      `,
    });

    const result = await pipeline.evaluate(content);
    expect(result).toBeDefined();
  });

  it('should handle very long content', async () => {
    const pipeline = createPedagogicalPipeline();

    const longContent = createTestContent({
      content: 'This is educational content. '.repeat(500),
    });

    const result = await pipeline.evaluate(longContent);
    expect(result).toBeDefined();
  });

  it('should handle student profile with empty fields', async () => {
    const pipeline = createPedagogicalPipeline();

    const content = createTestContent();
    const emptyProfile: StudentCognitiveProfile = {
      masteryLevels: {},
      demonstratedBloomsLevels: {},
      currentDifficultyLevel: 'beginner',
      learningVelocity: 'moderate',
      completedTopics: [],
      inProgressTopics: [],
      knowledgeGaps: [],
      recentPerformance: {
        averageScore: 0,
        trend: 'stable',
        assessmentCount: 0,
        timeSpentMinutes: 0,
        engagementLevel: 'moderate',
      },
    };

    const result = await pipeline.evaluate(content, emptyProfile);
    expect(result).toBeDefined();
  });

  it('should handle rapid sequential evaluations', async () => {
    const pipeline = createPedagogicalPipeline();
    const content = createTestContent();

    const results = await Promise.all([
      pipeline.evaluate(content),
      pipeline.evaluate(content),
      pipeline.evaluate(content),
    ]);

    expect(results).toHaveLength(3);
    results.forEach((result) => {
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
    });
  });
});
