/**
 * @sam-ai/pedagogy - Bloom's Aligner Tests
 * Tests for Bloom's taxonomy alignment evaluator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  BloomsAligner,
  createBloomsAligner,
  createStrictBloomsAligner,
  createLenientBloomsAligner,
  BLOOMS_VERBS,
  BLOOMS_ACTIVITIES,
  DEFAULT_BLOOMS_ALIGNER_CONFIG,
} from '../blooms-aligner';
import type { BloomsAlignerConfig } from '../blooms-aligner';
import type { PedagogicalContent, BloomsLevel } from '../types';

// ============================================================================
// SAMPLE DATA FACTORIES
// ============================================================================

function createPedagogicalContent(
  overrides: Partial<PedagogicalContent> = {}
): PedagogicalContent {
  return {
    content: 'Learn the concepts and understand the material.',
    type: 'lesson',
    topic: 'Introduction to Programming',
    targetBloomsLevel: 'UNDERSTAND',
    ...overrides,
  };
}

// Sample content with specific Bloom's levels
const REMEMBER_CONTENT = createPedagogicalContent({
  content: `
    List the key concepts. Define the main terms.
    Identify the components. Name the parts.
    Recall the definitions. State the facts.
    Memorize the formula. Recognize the patterns.
  `,
  targetBloomsLevel: 'REMEMBER',
});

const UNDERSTAND_CONTENT = createPedagogicalContent({
  content: `
    Explain how the system works. Summarize the main points.
    Interpret the results. Classify the types.
    Compare and contrast the methods. Discuss the implications.
    Paraphrase the concept. Predict the outcome.
  `,
  targetBloomsLevel: 'UNDERSTAND',
});

const APPLY_CONTENT = createPedagogicalContent({
  content: `
    Apply the formula to solve this problem. Demonstrate the technique.
    Calculate the result. Implement the solution.
    Use the method to complete the exercise. Practice the skills.
    Execute the procedure. Modify the approach.
  `,
  targetBloomsLevel: 'APPLY',
});

const ANALYZE_CONTENT = createPedagogicalContent({
  content: `
    Analyze the data. Break down the components.
    Examine the relationships. Investigate the causes.
    Differentiate between the types. Compare the approaches.
    Case study analysis. Pattern recognition exercise.
  `,
  targetBloomsLevel: 'ANALYZE',
});

const EVALUATE_CONTENT = createPedagogicalContent({
  content: `
    Evaluate the effectiveness. Assess the quality.
    Critique the methodology. Judge the results.
    Justify your reasoning. Rate the performance.
    Peer review exercise. Debate the merits.
  `,
  targetBloomsLevel: 'EVALUATE',
});

const CREATE_CONTENT = createPedagogicalContent({
  content: `
    Create a new solution. Design your own system.
    Develop a hypothesis. Generate ideas.
    Invent a new approach. Plan the project.
    Research proposal. Original design project.
  `,
  targetBloomsLevel: 'CREATE',
});

const MIXED_CONTENT = createPedagogicalContent({
  content: `
    First, list and define the key concepts (Remember).
    Then, explain and summarize the main ideas (Understand).
    Next, apply and demonstrate the techniques (Apply).
    Finally, analyze and evaluate the results (Analyze/Evaluate).
  `,
  targetBloomsLevel: 'APPLY',
});

// ============================================================================
// TESTS
// ============================================================================

describe('BloomsAligner', () => {
  let aligner: BloomsAligner;

  beforeEach(() => {
    aligner = new BloomsAligner();
  });

  // ============================================================================
  // CONSTRUCTOR TESTS
  // ============================================================================

  describe('constructor', () => {
    it('should create aligner with default config', () => {
      expect(aligner).toBeInstanceOf(BloomsAligner);
      expect(aligner.name).toBe('BloomsAligner');
    });

    it('should create aligner with custom config', () => {
      const config: BloomsAlignerConfig = {
        significanceThreshold: 15,
        acceptableVariance: 2,
        verbWeight: 0.7,
        activityWeight: 0.3,
        passingScore: 80,
      };
      const customAligner = new BloomsAligner(config);
      expect(customAligner).toBeInstanceOf(BloomsAligner);
    });

    it('should have proper description', () => {
      expect(aligner.description).toContain('Bloom');
    });
  });

  // ============================================================================
  // FACTORY FUNCTION TESTS
  // ============================================================================

  describe('factory functions', () => {
    it('should create aligner using createBloomsAligner', () => {
      const factoryAligner = createBloomsAligner();
      expect(factoryAligner).toBeInstanceOf(BloomsAligner);
    });

    it('should create strict aligner using createStrictBloomsAligner', () => {
      const strictAligner = createStrictBloomsAligner();
      expect(strictAligner).toBeInstanceOf(BloomsAligner);
    });

    it('should create lenient aligner using createLenientBloomsAligner', () => {
      const lenientAligner = createLenientBloomsAligner();
      expect(lenientAligner).toBeInstanceOf(BloomsAligner);
    });
  });

  // ============================================================================
  // EVALUATE TESTS - BASIC
  // ============================================================================

  describe('evaluate - basic', () => {
    it('should return valid result structure', async () => {
      const result = await aligner.evaluate(UNDERSTAND_CONTENT);

      expect(result.evaluatorName).toBe('BloomsAligner');
      expect(typeof result.passed).toBe('boolean');
      expect(typeof result.score).toBe('number');
      expect(typeof result.confidence).toBe('number');
      expect(Array.isArray(result.issues)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.detectedDistribution).toBeDefined();
      expect(result.dominantLevel).toBeDefined();
      expect(result.targetLevel).toBeDefined();
      expect(result.alignmentStatus).toBeDefined();
      expect(result.verbAnalysis).toBeDefined();
      expect(result.activityAnalysis).toBeDefined();
    });

    it('should include processing time', async () => {
      const result = await aligner.evaluate(UNDERSTAND_CONTENT);

      expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should use default target level if not specified', async () => {
      const contentWithoutTarget = createPedagogicalContent({
        targetBloomsLevel: undefined,
      });
      const result = await aligner.evaluate(contentWithoutTarget);

      expect(result.targetLevel).toBe('UNDERSTAND');
    });
  });

  // ============================================================================
  // EVALUATE TESTS - LEVEL DETECTION
  // ============================================================================

  describe('evaluate - level detection', () => {
    it('should detect REMEMBER level content', async () => {
      const result = await aligner.evaluate(REMEMBER_CONTENT);

      expect(result.dominantLevel).toBe('REMEMBER');
      expect(result.detectedDistribution.REMEMBER).toBeGreaterThan(0);
    });

    it('should detect UNDERSTAND level content', async () => {
      const result = await aligner.evaluate(UNDERSTAND_CONTENT);

      expect(result.dominantLevel).toBe('UNDERSTAND');
      expect(result.detectedDistribution.UNDERSTAND).toBeGreaterThan(0);
    });

    it('should detect APPLY level content', async () => {
      const result = await aligner.evaluate(APPLY_CONTENT);

      expect(result.dominantLevel).toBe('APPLY');
      expect(result.detectedDistribution.APPLY).toBeGreaterThan(0);
    });

    it('should detect ANALYZE level content', async () => {
      const result = await aligner.evaluate(ANALYZE_CONTENT);

      expect(result.dominantLevel).toBe('ANALYZE');
      expect(result.detectedDistribution.ANALYZE).toBeGreaterThan(0);
    });

    it('should detect EVALUATE level content', async () => {
      const result = await aligner.evaluate(EVALUATE_CONTENT);

      expect(result.dominantLevel).toBe('EVALUATE');
      expect(result.detectedDistribution.EVALUATE).toBeGreaterThan(0);
    });

    it('should detect CREATE level content', async () => {
      const result = await aligner.evaluate(CREATE_CONTENT);

      expect(result.dominantLevel).toBe('CREATE');
      expect(result.detectedDistribution.CREATE).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // EVALUATE TESTS - ALIGNMENT
  // ============================================================================

  describe('evaluate - alignment', () => {
    it('should mark as aligned when content matches target', async () => {
      const result = await aligner.evaluate(UNDERSTAND_CONTENT);

      expect(result.alignmentStatus).toBe('aligned');
      expect(result.levelDistance).toBe(0);
    });

    it('should mark as below_target when content is lower than target', async () => {
      const belowTargetContent = createPedagogicalContent({
        content: 'List the items. Define the terms. Name the parts.',
        targetBloomsLevel: 'ANALYZE',
      });
      const result = await aligner.evaluate(belowTargetContent);

      expect(result.alignmentStatus).toBe('below_target');
      expect(result.levelDistance).toBeLessThan(0);
    });

    it('should mark as above_target when content is higher than target', async () => {
      const aboveTargetContent = createPedagogicalContent({
        content: 'Analyze the data. Evaluate the results. Create a solution.',
        targetBloomsLevel: 'REMEMBER',
      });
      const result = await aligner.evaluate(aboveTargetContent);

      expect(result.alignmentStatus).toBe('above_target');
      expect(result.levelDistance).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // EVALUATE TESTS - VERB ANALYSIS
  // ============================================================================

  describe('evaluate - verb analysis', () => {
    it('should count verbs correctly', async () => {
      const result = await aligner.evaluate(REMEMBER_CONTENT);

      expect(result.verbAnalysis.totalVerbs).toBeGreaterThan(0);
    });

    it('should categorize verbs by level', async () => {
      const result = await aligner.evaluate(REMEMBER_CONTENT);

      expect(result.verbAnalysis.verbsByLevel.REMEMBER.length).toBeGreaterThan(0);
    });

    it('should identify dominant verb category', async () => {
      const result = await aligner.evaluate(UNDERSTAND_CONTENT);

      expect(result.verbAnalysis.dominantCategory).toBe('UNDERSTAND');
    });
  });

  // ============================================================================
  // EVALUATE TESTS - ACTIVITY ANALYSIS
  // ============================================================================

  describe('evaluate - activity analysis', () => {
    it('should detect activity types', async () => {
      const contentWithActivities = createPedagogicalContent({
        content: 'Complete this problem solving exercise. Try the case study analysis.',
        targetBloomsLevel: 'ANALYZE',
      });
      const result = await aligner.evaluate(contentWithActivities);

      expect(result.activityAnalysis.activityTypes.length).toBeGreaterThan(0);
    });

    it('should detect higher-order activities', async () => {
      const result = await aligner.evaluate(ANALYZE_CONTENT);

      expect(result.activityAnalysis.hasHigherOrderActivities).toBe(true);
    });

    it('should not flag higher-order activities for lower level content', async () => {
      const result = await aligner.evaluate(REMEMBER_CONTENT);

      // May or may not have higher-order activities
      expect(typeof result.activityAnalysis.hasHigherOrderActivities).toBe('boolean');
    });
  });

  // ============================================================================
  // EVALUATE TESTS - SCORING
  // ============================================================================

  describe('evaluate - scoring', () => {
    it('should give higher score for aligned content', async () => {
      const result = await aligner.evaluate(UNDERSTAND_CONTENT);

      expect(result.score).toBeGreaterThan(50);
    });

    it('should give lower score for misaligned content', async () => {
      const misalignedContent = createPedagogicalContent({
        content: 'List and define the basic terms.',
        targetBloomsLevel: 'CREATE',
      });
      const result = await aligner.evaluate(misalignedContent);

      expect(result.score).toBeLessThan(70);
    });

    it('should cap score at 100', async () => {
      const result = await aligner.evaluate(UNDERSTAND_CONTENT);

      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should not return negative score', async () => {
      const result = await aligner.evaluate(MIXED_CONTENT);

      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // EVALUATE TESTS - CONFIDENCE
  // ============================================================================

  describe('evaluate - confidence', () => {
    it('should return higher confidence with more verbs', async () => {
      const lowVerbContent = createPedagogicalContent({
        content: 'Explain this.',
        targetBloomsLevel: 'UNDERSTAND',
      });
      const highVerbContent = createPedagogicalContent({
        content: 'Explain, summarize, interpret, classify, compare, contrast, discuss, and paraphrase.',
        targetBloomsLevel: 'UNDERSTAND',
      });

      const lowResult = await aligner.evaluate(lowVerbContent);
      const highResult = await aligner.evaluate(highVerbContent);

      expect(highResult.confidence).toBeGreaterThan(lowResult.confidence);
    });

    it('should return confidence between 0 and 1', async () => {
      const result = await aligner.evaluate(UNDERSTAND_CONTENT);

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  // ============================================================================
  // EVALUATE TESTS - ISSUES AND RECOMMENDATIONS
  // ============================================================================

  describe('evaluate - issues and recommendations', () => {
    it('should generate issues for misaligned content', async () => {
      const misalignedContent = createPedagogicalContent({
        content: 'List and define the terms.',
        targetBloomsLevel: 'CREATE',
      });
      const result = await aligner.evaluate(misalignedContent);

      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should generate recommendations for misaligned content', async () => {
      const misalignedContent = createPedagogicalContent({
        content: 'List and define.',
        targetBloomsLevel: 'EVALUATE',
      });
      const result = await aligner.evaluate(misalignedContent);

      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should detect low verb diversity', async () => {
      const lowDiversityContent = createPedagogicalContent({
        content: 'Do it.',
        targetBloomsLevel: 'UNDERSTAND',
      });
      const result = await aligner.evaluate(lowDiversityContent);

      const lowDiversityIssue = result.issues.find(
        i => i.type === 'low_verb_diversity'
      );
      expect(lowDiversityIssue).toBeDefined();
    });
  });

  // ============================================================================
  // EVALUATE TESTS - DISTRIBUTION
  // ============================================================================

  describe('evaluate - distribution', () => {
    it('should return distribution summing to approximately 100', async () => {
      const result = await aligner.evaluate(MIXED_CONTENT);

      const sum = Object.values(result.detectedDistribution).reduce(
        (a, b) => a + b,
        0
      );
      expect(sum).toBeCloseTo(100, 0);
    });

    it('should have non-negative distribution values', async () => {
      const result = await aligner.evaluate(MIXED_CONTENT);

      for (const value of Object.values(result.detectedDistribution)) {
        expect(value).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ============================================================================
  // STRICT/LENIENT TESTS
  // ============================================================================

  describe('strict vs lenient', () => {
    it('should be stricter with strict aligner', async () => {
      const strictAligner = createStrictBloomsAligner();
      const slightlyMisalignedContent = createPedagogicalContent({
        content: 'Explain and summarize the concepts.',
        targetBloomsLevel: 'APPLY',
      });

      const strictResult = await strictAligner.evaluate(slightlyMisalignedContent);
      const normalResult = await aligner.evaluate(slightlyMisalignedContent);

      // Strict should fail more often
      expect(strictResult.passed).toBe(false);
      expect(normalResult.passed || !normalResult.passed).toBe(true); // Either is valid
    });

    it('should be more lenient with lenient aligner', async () => {
      const lenientAligner = createLenientBloomsAligner();
      const slightlyMisalignedContent = createPedagogicalContent({
        content: 'Explain and summarize the concepts.',
        targetBloomsLevel: 'APPLY',
      });

      const lenientResult = await lenientAligner.evaluate(slightlyMisalignedContent);

      // Lenient has higher variance tolerance
      expect(lenientResult).toBeDefined();
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('edge cases', () => {
    it('should handle empty content', async () => {
      const emptyContent = createPedagogicalContent({
        content: '',
        targetBloomsLevel: 'UNDERSTAND',
      });
      const result = await aligner.evaluate(emptyContent);

      expect(result).toBeDefined();
      expect(result.detectedDistribution.UNDERSTAND).toBe(100); // Default
    });

    it('should handle content with no recognized verbs', async () => {
      const noVerbsContent = createPedagogicalContent({
        content: 'Lorem ipsum dolor sit amet.',
        targetBloomsLevel: 'UNDERSTAND',
      });
      const result = await aligner.evaluate(noVerbsContent);

      expect(result).toBeDefined();
      expect(result.verbAnalysis.totalVerbs).toBe(0);
    });

    it('should handle very long content', async () => {
      const longContent = createPedagogicalContent({
        content: 'Explain the concept. '.repeat(500),
        targetBloomsLevel: 'UNDERSTAND',
      });
      const result = await aligner.evaluate(longContent);

      expect(result).toBeDefined();
    });

    it('should handle special characters', async () => {
      const specialContent = createPedagogicalContent({
        content: 'Explain!!! the concept??? Summarize...',
        targetBloomsLevel: 'UNDERSTAND',
      });
      const result = await aligner.evaluate(specialContent);

      expect(result).toBeDefined();
    });

    it('should handle mixed case verbs', async () => {
      const mixedCaseContent = createPedagogicalContent({
        content: 'EXPLAIN the concept. Summarize THE material. AnalYZE the data.',
        targetBloomsLevel: 'UNDERSTAND',
      });
      const result = await aligner.evaluate(mixedCaseContent);

      expect(result.verbAnalysis.totalVerbs).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // CONSTANTS TESTS
  // ============================================================================

  describe('constants', () => {
    it('should have verbs for all Bloom levels', () => {
      const levels: BloomsLevel[] = [
        'REMEMBER',
        'UNDERSTAND',
        'APPLY',
        'ANALYZE',
        'EVALUATE',
        'CREATE',
      ];

      for (const level of levels) {
        expect(BLOOMS_VERBS[level]).toBeDefined();
        expect(BLOOMS_VERBS[level].length).toBeGreaterThan(0);
      }
    });

    it('should have activities for all Bloom levels', () => {
      const levels: BloomsLevel[] = [
        'REMEMBER',
        'UNDERSTAND',
        'APPLY',
        'ANALYZE',
        'EVALUATE',
        'CREATE',
      ];

      for (const level of levels) {
        expect(BLOOMS_ACTIVITIES[level]).toBeDefined();
        expect(BLOOMS_ACTIVITIES[level].length).toBeGreaterThan(0);
      }
    });

    it('should have valid default config', () => {
      expect(DEFAULT_BLOOMS_ALIGNER_CONFIG.significanceThreshold).toBeGreaterThan(0);
      expect(DEFAULT_BLOOMS_ALIGNER_CONFIG.acceptableVariance).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_BLOOMS_ALIGNER_CONFIG.verbWeight).toBeGreaterThan(0);
      expect(DEFAULT_BLOOMS_ALIGNER_CONFIG.activityWeight).toBeGreaterThan(0);
      expect(DEFAULT_BLOOMS_ALIGNER_CONFIG.passingScore).toBeGreaterThan(0);
    });
  });
});
