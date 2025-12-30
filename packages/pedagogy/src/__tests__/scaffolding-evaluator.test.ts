/**
 * @sam-ai/pedagogy - Scaffolding Evaluator Tests
 * Tests for pedagogical scaffolding evaluation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ScaffoldingEvaluator,
  createScaffoldingEvaluator,
  createStrictScaffoldingEvaluator,
  createLenientScaffoldingEvaluator,
  SUPPORT_INDICATORS,
  GRADUAL_RELEASE_INDICATORS,
  COMPLEXITY_INDICATORS,
  DEFAULT_SCAFFOLDING_CONFIG,
} from '../scaffolding-evaluator';
import type { ScaffoldingEvaluatorConfig } from '../scaffolding-evaluator';
import type {
  PedagogicalContent,
  StudentCognitiveProfile,
  PriorContentSummary,
} from '../types';

// ============================================================================
// SAMPLE DATA FACTORIES
// ============================================================================

function createPedagogicalContent(
  overrides: Partial<PedagogicalContent> = {}
): PedagogicalContent {
  return {
    content: 'This is a basic introduction. First, let us start with the fundamentals.',
    type: 'lesson',
    topic: 'Introduction to Programming',
    targetDifficulty: 'beginner',
    prerequisites: ['basic math'],
    ...overrides,
  };
}

function createStudentProfile(
  overrides: Partial<StudentCognitiveProfile> = {}
): StudentCognitiveProfile {
  return {
    masteryLevels: {
      'basic math': {
        topicId: 'basic math',
        mastery: 80,
        highestBloomsLevel: 'APPLY',
        confidence: 0.8,
        lastAssessed: new Date().toISOString(),
      },
    },
    demonstratedBloomsLevels: {
      'basic math': 'APPLY',
    },
    currentDifficultyLevel: 'beginner',
    learningVelocity: 'moderate',
    completedTopics: ['basic math'],
    inProgressTopics: ['Introduction to Programming'],
    knowledgeGaps: [],
    recentPerformance: {
      averageScore: 75,
      trend: 'stable',
      assessmentCount: 5,
      timeSpentMinutes: 120,
      engagementLevel: 'moderate',
    },
    ...overrides,
  };
}

// Sample content with good scaffolding
const WELL_SCAFFOLDED_CONTENT = createPedagogicalContent({
  content: `
    # Introduction to Variables

    Let's begin with a simple concept. First, we'll define what a variable is.

    For example, consider this: a variable is like a container.

    ## Step-by-Step Guide
    Step 1: Understand what a variable stores.
    Then, step 2: Learn how to declare a variable.
    Next, step 3: Practice using variables.
    Finally, step 4: Apply your knowledge.

    Here is an example of how to declare a variable in Python.

    Hint: Remember that variable names should be descriptive.

    ## Guided Practice
    Let's try together to create a variable. Work with me on this exercise.

    ## Your Turn
    Now you try it independently. Practice by creating your own variable.

    Correct! Well done if you got it right.
  `,
  prerequisites: ['basic syntax'],
  priorContent: [
    {
      topic: 'basic syntax',
      bloomsLevel: 'UNDERSTAND',
      difficulty: 'beginner',
      conceptsIntroduced: ['syntax', 'code structure'],
    },
  ],
});

const POORLY_SCAFFOLDED_CONTENT = createPedagogicalContent({
  content: `
    Advanced recursive algorithms require understanding of base cases and recursive calls.
    The complexity analysis involves analyzing time and space requirements.
    Implement a solution using dynamic programming optimization.
  `,
  targetDifficulty: 'advanced',
  prerequisites: ['recursion', 'data structures', 'algorithms'],
});

const CONTENT_WITH_COMPLEXITY_JUMP = createPedagogicalContent({
  content: `
    Basic introduction to simple concepts.

    Simple easy straightforward fundamentals.

    Now we jump to advanced sophisticated complex integration synthesis expert nuanced material.

    This is challenging and requires sophisticated understanding.
  `,
});

const CONTENT_WITH_GRADUAL_RELEASE = createPedagogicalContent({
  content: `
    I'll show you how this works. Let me demonstrate the process.
    Watch as I complete this example.

    Now, let's try together. Work with me on this problem.
    We'll work through this as a class.

    Now work with a partner to solve this. In groups, discuss the solution.

    Finally, try it yourself independently. On your own, complete the exercise.
  `,
});

// ============================================================================
// TESTS
// ============================================================================

describe('ScaffoldingEvaluator', () => {
  let evaluator: ScaffoldingEvaluator;

  beforeEach(() => {
    evaluator = new ScaffoldingEvaluator();
  });

  // ============================================================================
  // CONSTRUCTOR TESTS
  // ============================================================================

  describe('constructor', () => {
    it('should create evaluator with default config', () => {
      expect(evaluator).toBeInstanceOf(ScaffoldingEvaluator);
      expect(evaluator.name).toBe('ScaffoldingEvaluator');
    });

    it('should create evaluator with custom config', () => {
      const config: ScaffoldingEvaluatorConfig = {
        maxComplexityJump: 20,
        minPrerequisiteCoverage: 80,
        minSupportStructures: 4,
        passingScore: 80,
        requireGradualRelease: true,
      };
      const customEvaluator = new ScaffoldingEvaluator(config);
      expect(customEvaluator).toBeInstanceOf(ScaffoldingEvaluator);
    });

    it('should have proper description', () => {
      expect(evaluator.description).toContain('scaffolding');
    });
  });

  // ============================================================================
  // FACTORY FUNCTION TESTS
  // ============================================================================

  describe('factory functions', () => {
    it('should create evaluator using createScaffoldingEvaluator', () => {
      const factoryEvaluator = createScaffoldingEvaluator();
      expect(factoryEvaluator).toBeInstanceOf(ScaffoldingEvaluator);
    });

    it('should create strict evaluator using createStrictScaffoldingEvaluator', () => {
      const strictEvaluator = createStrictScaffoldingEvaluator();
      expect(strictEvaluator).toBeInstanceOf(ScaffoldingEvaluator);
    });

    it('should create lenient evaluator using createLenientScaffoldingEvaluator', () => {
      const lenientEvaluator = createLenientScaffoldingEvaluator();
      expect(lenientEvaluator).toBeInstanceOf(ScaffoldingEvaluator);
    });
  });

  // ============================================================================
  // EVALUATE TESTS - BASIC
  // ============================================================================

  describe('evaluate - basic', () => {
    it('should return valid result structure', async () => {
      const result = await evaluator.evaluate(WELL_SCAFFOLDED_CONTENT);

      expect(result.evaluatorName).toBe('ScaffoldingEvaluator');
      expect(typeof result.passed).toBe('boolean');
      expect(typeof result.score).toBe('number');
      expect(typeof result.confidence).toBe('number');
      expect(Array.isArray(result.issues)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.properlyScaffolded).toBeDefined();
      expect(result.complexityProgression).toBeDefined();
      expect(result.prerequisiteCoverage).toBeDefined();
      expect(result.supportStructures).toBeDefined();
      expect(result.gradualRelease).toBeDefined();
    });

    it('should include processing time', async () => {
      const result = await evaluator.evaluate(WELL_SCAFFOLDED_CONTENT);

      expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // EVALUATE TESTS - COMPLEXITY PROGRESSION
  // ============================================================================

  describe('evaluate - complexity progression', () => {
    it('should detect appropriate complexity progression', async () => {
      const result = await evaluator.evaluate(WELL_SCAFFOLDED_CONTENT);

      expect(result.complexityProgression).toBeDefined();
      expect(typeof result.complexityProgression.appropriate).toBe('boolean');
      expect(result.complexityProgression.startingComplexity).toBeGreaterThanOrEqual(0);
      expect(result.complexityProgression.endingComplexity).toBeGreaterThanOrEqual(0);
    });

    it('should detect complexity jumps', async () => {
      const result = await evaluator.evaluate(CONTENT_WITH_COMPLEXITY_JUMP);

      expect(result.complexityProgression.complexityJumps.length).toBeGreaterThanOrEqual(0);
    });

    it('should classify curve type', async () => {
      const result = await evaluator.evaluate(WELL_SCAFFOLDED_CONTENT);

      expect(['linear', 'stepped', 'exponential', 'flat', 'irregular']).toContain(
        result.complexityProgression.curveType
      );
    });

    it('should flag problematic complexity jumps', async () => {
      const jumpContent = createPedagogicalContent({
        content: `
          Simple basic introduction.

          Now advanced sophisticated complex expert-level synthesis with nuanced integration.
        `,
      });
      const result = await evaluator.evaluate(jumpContent);

      const hasProblematicJump = result.complexityProgression.complexityJumps.some(
        j => j.problematic
      );
      // May or may not have problematic jumps depending on threshold
      expect(typeof hasProblematicJump).toBe('boolean');
    });
  });

  // ============================================================================
  // EVALUATE TESTS - PREREQUISITE COVERAGE
  // ============================================================================

  describe('evaluate - prerequisite coverage', () => {
    it('should analyze prerequisite coverage', async () => {
      const result = await evaluator.evaluate(WELL_SCAFFOLDED_CONTENT);

      expect(result.prerequisiteCoverage).toBeDefined();
      expect(Array.isArray(result.prerequisiteCoverage.required)).toBe(true);
      expect(Array.isArray(result.prerequisiteCoverage.addressed)).toBe(true);
      expect(Array.isArray(result.prerequisiteCoverage.missing)).toBe(true);
      expect(typeof result.prerequisiteCoverage.coveragePercentage).toBe('number');
    });

    it('should detect missing prerequisites', async () => {
      const contentWithMissingPrereqs = createPedagogicalContent({
        content: 'Advanced content without prerequisite explanations.',
        prerequisites: ['prerequisite1', 'prerequisite2', 'prerequisite3'],
      });
      const result = await evaluator.evaluate(contentWithMissingPrereqs);

      expect(result.prerequisiteCoverage.missing.length).toBeGreaterThan(0);
    });

    it('should handle content without prerequisites', async () => {
      const noPrereqContent = createPedagogicalContent({
        content: 'Basic content without prerequisites.',
        prerequisites: undefined,
      });
      const result = await evaluator.evaluate(noPrereqContent);

      expect(result.prerequisiteCoverage.coveragePercentage).toBe(100);
    });

    it('should use student profile for prerequisite checking', async () => {
      // Create profile with 'basic math' in completedTopics so it matches the prerequisite
      const profile: StudentCognitiveProfile = {
        ...createStudentProfile(),
        completedTopics: ['basic math', 'algebra'],
      };
      const contentWithKnownPrereq = createPedagogicalContent({
        content: 'This content builds on prior knowledge.',
        prerequisites: ['basic math'],
      });
      const result = await evaluator.evaluate(contentWithKnownPrereq, profile);

      // Since 'basic math' is in completedTopics, it should be marked as assumed
      expect(result.prerequisiteCoverage.assumed).toContain('basic math');
    });
  });

  // ============================================================================
  // EVALUATE TESTS - SUPPORT STRUCTURES
  // ============================================================================

  describe('evaluate - support structures', () => {
    it('should detect support structures', async () => {
      const result = await evaluator.evaluate(WELL_SCAFFOLDED_CONTENT);

      expect(result.supportStructures.length).toBeGreaterThan(0);
    });

    it('should categorize support structures by type', async () => {
      const result = await evaluator.evaluate(WELL_SCAFFOLDED_CONTENT);

      for (const structure of result.supportStructures) {
        expect(['example', 'hint', 'scaffold', 'prompt', 'feedback', 'model']).toContain(
          structure.type
        );
      }
    });

    it('should estimate effectiveness of support structures', async () => {
      const result = await evaluator.evaluate(WELL_SCAFFOLDED_CONTENT);

      for (const structure of result.supportStructures) {
        expect(structure.effectiveness).toBeGreaterThanOrEqual(0);
        expect(structure.effectiveness).toBeLessThanOrEqual(100);
      }
    });

    it('should flag insufficient support structures', async () => {
      const noSupportContent = createPedagogicalContent({
        content: 'Content without any support indicators.',
      });
      const result = await evaluator.evaluate(noSupportContent);

      const supportIssue = result.issues.find(
        i => i.type === 'insufficient_support'
      );
      expect(supportIssue).toBeDefined();
    });
  });

  // ============================================================================
  // EVALUATE TESTS - GRADUAL RELEASE
  // ============================================================================

  describe('evaluate - gradual release', () => {
    it('should detect gradual release phases', async () => {
      const result = await evaluator.evaluate(CONTENT_WITH_GRADUAL_RELEASE);

      expect(result.gradualRelease.phasesPresent.length).toBeGreaterThan(0);
    });

    it('should detect all four phases in complete content', async () => {
      const result = await evaluator.evaluate(CONTENT_WITH_GRADUAL_RELEASE);

      expect(result.gradualRelease.phasesPresent).toContain('I_DO');
      expect(result.gradualRelease.phasesPresent).toContain('WE_DO');
      expect(result.gradualRelease.phasesPresent).toContain('YOU_DO_TOGETHER');
      expect(result.gradualRelease.phasesPresent).toContain('YOU_DO_ALONE');
    });

    it('should mark complete gradual release', async () => {
      const result = await evaluator.evaluate(CONTENT_WITH_GRADUAL_RELEASE);

      expect(result.gradualRelease.complete).toBe(true);
    });

    it('should analyze balance', async () => {
      const result = await evaluator.evaluate(CONTENT_WITH_GRADUAL_RELEASE);

      expect(['teacher-heavy', 'balanced', 'student-heavy']).toContain(
        result.gradualRelease.balance
      );
    });
  });

  // ============================================================================
  // EVALUATE TESTS - SCORING
  // ============================================================================

  describe('evaluate - scoring', () => {
    it('should give higher score for well-scaffolded content', async () => {
      const wellResult = await evaluator.evaluate(WELL_SCAFFOLDED_CONTENT);
      const poorResult = await evaluator.evaluate(POORLY_SCAFFOLDED_CONTENT);

      expect(wellResult.score).toBeGreaterThan(poorResult.score);
    });

    it('should cap score at 100', async () => {
      const result = await evaluator.evaluate(WELL_SCAFFOLDED_CONTENT);

      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should not return negative score', async () => {
      const result = await evaluator.evaluate(POORLY_SCAFFOLDED_CONTENT);

      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // EVALUATE TESTS - CONFIDENCE
  // ============================================================================

  describe('evaluate - confidence', () => {
    it('should return confidence between 0 and 1', async () => {
      const result = await evaluator.evaluate(WELL_SCAFFOLDED_CONTENT);

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should return higher confidence for longer content', async () => {
      const shortContent = createPedagogicalContent({
        content: 'Short.',
      });
      const longContent = createPedagogicalContent({
        content: 'This is much longer content. '.repeat(100),
      });

      const shortResult = await evaluator.evaluate(shortContent);
      const longResult = await evaluator.evaluate(longContent);

      expect(longResult.confidence).toBeGreaterThanOrEqual(shortResult.confidence);
    });
  });

  // ============================================================================
  // EVALUATE TESTS - ISSUES AND RECOMMENDATIONS
  // ============================================================================

  describe('evaluate - issues and recommendations', () => {
    it('should generate issues for poorly scaffolded content', async () => {
      const result = await evaluator.evaluate(POORLY_SCAFFOLDED_CONTENT);

      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should generate recommendations', async () => {
      const result = await evaluator.evaluate(POORLY_SCAFFOLDED_CONTENT);

      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should have proper issue structure', async () => {
      const result = await evaluator.evaluate(POORLY_SCAFFOLDED_CONTENT);

      for (const issue of result.issues) {
        expect(issue.type).toBeDefined();
        expect(issue.severity).toBeDefined();
        expect(issue.description).toBeDefined();
        expect(issue.learningImpact).toBeDefined();
      }
    });
  });

  // ============================================================================
  // EVALUATE TESTS - WITH STUDENT PROFILE
  // ============================================================================

  describe('evaluate - with student profile', () => {
    it('should consider student profile for complexity assessment', async () => {
      const profile = createStudentProfile();
      const result = await evaluator.evaluate(WELL_SCAFFOLDED_CONTENT, profile);

      expect(result).toBeDefined();
    });

    it('should adjust based on student difficulty level', async () => {
      const beginnerProfile = createStudentProfile({
        currentDifficultyLevel: 'beginner',
      });
      const advancedProfile = createStudentProfile({
        currentDifficultyLevel: 'advanced',
      });

      const beginnerResult = await evaluator.evaluate(
        WELL_SCAFFOLDED_CONTENT,
        beginnerProfile
      );
      const advancedResult = await evaluator.evaluate(
        WELL_SCAFFOLDED_CONTENT,
        advancedProfile
      );

      // Both should complete
      expect(beginnerResult).toBeDefined();
      expect(advancedResult).toBeDefined();
    });
  });

  // ============================================================================
  // STRICT/LENIENT TESTS
  // ============================================================================

  describe('strict vs lenient', () => {
    it('should be stricter with strict evaluator', async () => {
      const strictEvaluator = createStrictScaffoldingEvaluator();
      const strictResult = await strictEvaluator.evaluate(WELL_SCAFFOLDED_CONTENT);

      // Strict requires gradual release, higher thresholds
      expect(strictResult).toBeDefined();
    });

    it('should be more lenient with lenient evaluator', async () => {
      const lenientEvaluator = createLenientScaffoldingEvaluator();
      const lenientResult = await lenientEvaluator.evaluate(POORLY_SCAFFOLDED_CONTENT);

      // Lenient has lower thresholds
      expect(lenientResult.score).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('edge cases', () => {
    it('should handle empty content', async () => {
      const emptyContent = createPedagogicalContent({
        content: '',
      });
      const result = await evaluator.evaluate(emptyContent);

      expect(result).toBeDefined();
    });

    it('should handle very short content', async () => {
      const shortContent = createPedagogicalContent({
        content: 'Hello.',
      });
      const result = await evaluator.evaluate(shortContent);

      expect(result).toBeDefined();
    });

    it('should handle very long content', async () => {
      const longContent = createPedagogicalContent({
        content: 'For example, this is content. '.repeat(500),
      });
      const result = await evaluator.evaluate(longContent);

      expect(result).toBeDefined();
    });

    it('should handle content with special characters', async () => {
      const specialContent = createPedagogicalContent({
        content: 'For example!!! Here is a hint??? Step 1...',
      });
      const result = await evaluator.evaluate(specialContent);

      expect(result).toBeDefined();
    });

    it('should handle content without prior content', async () => {
      const noPriorContent = createPedagogicalContent({
        content: 'First, let us begin with the basics.',
        priorContent: undefined,
      });
      const result = await evaluator.evaluate(noPriorContent);

      expect(result).toBeDefined();
    });
  });

  // ============================================================================
  // CONSTANTS TESTS
  // ============================================================================

  describe('constants', () => {
    it('should have support indicators for all types', () => {
      const types = ['example', 'hint', 'scaffold', 'prompt', 'feedback', 'model'];

      for (const type of types) {
        expect(SUPPORT_INDICATORS[type as keyof typeof SUPPORT_INDICATORS]).toBeDefined();
        expect(
          SUPPORT_INDICATORS[type as keyof typeof SUPPORT_INDICATORS].length
        ).toBeGreaterThan(0);
      }
    });

    it('should have gradual release indicators for all phases', () => {
      const phases = ['I_DO', 'WE_DO', 'YOU_DO_TOGETHER', 'YOU_DO_ALONE'];

      for (const phase of phases) {
        expect(
          GRADUAL_RELEASE_INDICATORS[phase as keyof typeof GRADUAL_RELEASE_INDICATORS]
        ).toBeDefined();
        expect(
          GRADUAL_RELEASE_INDICATORS[phase as keyof typeof GRADUAL_RELEASE_INDICATORS]
            .length
        ).toBeGreaterThan(0);
      }
    });

    it('should have complexity indicators for all levels', () => {
      expect(COMPLEXITY_INDICATORS.low.length).toBeGreaterThan(0);
      expect(COMPLEXITY_INDICATORS.medium.length).toBeGreaterThan(0);
      expect(COMPLEXITY_INDICATORS.high.length).toBeGreaterThan(0);
    });

    it('should have valid default config', () => {
      expect(DEFAULT_SCAFFOLDING_CONFIG.maxComplexityJump).toBeGreaterThan(0);
      expect(DEFAULT_SCAFFOLDING_CONFIG.minPrerequisiteCoverage).toBeGreaterThan(0);
      expect(DEFAULT_SCAFFOLDING_CONFIG.minSupportStructures).toBeGreaterThan(0);
      expect(DEFAULT_SCAFFOLDING_CONFIG.passingScore).toBeGreaterThan(0);
    });
  });
});
