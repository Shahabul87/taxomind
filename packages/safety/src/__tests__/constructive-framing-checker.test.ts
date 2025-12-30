/**
 * @sam-ai/safety - Constructive Framing Checker Tests
 * Tests for ensuring feedback uses growth mindset language and constructive framing
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ConstructiveFramingChecker,
  createConstructiveFramingChecker,
  createStrictConstructiveChecker,
  createLenientConstructiveChecker,
  DEFAULT_CONSTRUCTIVE_CONFIG,
} from '../constructive-framing-checker';
import type { ConstructiveFramingCheckerConfig } from '../constructive-framing-checker';
import type { EvaluationFeedback } from '../types';

// ============================================================================
// SAMPLE DATA FACTORIES
// ============================================================================

function createFeedback(overrides: Partial<EvaluationFeedback> = {}): EvaluationFeedback {
  return {
    id: 'feedback-1',
    text: 'Good work on this assignment.',
    score: 80,
    maxScore: 100,
    strengths: ['Clear writing', 'Good organization'],
    improvements: ['Add more examples', 'Expand analysis'],
    ...overrides,
  };
}

// ============================================================================
// SAMPLE DATA
// ============================================================================

const CONSTRUCTIVE_FEEDBACK = createFeedback({
  text: 'Great work on this assignment! You demonstrated excellent understanding of the concepts. Keep up the good work.',
  score: 85,
  maxScore: 100,
  strengths: ['Clear analysis', 'Well organized', 'Strong arguments'],
  improvements: ['Consider adding more examples'],
});

const UNCONSTRUCTIVE_FEEDBACK = createFeedback({
  text: 'This is wrong. Needs work.',
  score: 40,
  maxScore: 100,
  strengths: [],
  improvements: ['Everything', 'Try harder', 'Do better'],
});

const FIXED_MINDSET_FEEDBACK = createFeedback({
  text: 'You\'re not a math person. Some people just can\'t do this. Natural talent is what matters.',
  score: 50,
  maxScore: 100,
});

const GROWTH_MINDSET_FEEDBACK = createFeedback({
  text: 'With practice, you can improve. Mistakes help us learn. Keep trying and you will succeed.',
  score: 70,
  maxScore: 100,
});

const UNBALANCED_FEEDBACK = createFeedback({
  text: 'This needs improvement.',
  score: 60,
  maxScore: 100,
  strengths: [],
  improvements: ['Fix error 1', 'Fix error 2', 'Fix error 3', 'Fix error 4', 'Fix error 5'],
});

const VAGUE_FEEDBACK = createFeedback({
  text: 'Good.',
  score: 50,
  maxScore: 100,
  strengths: [],
  improvements: [],
});

const LOW_SCORE_NO_ENCOURAGEMENT = createFeedback({
  text: 'The answer is incorrect.',
  score: 30,
  maxScore: 100,
});

const LOW_SCORE_WITH_ENCOURAGEMENT = createFeedback({
  text: 'The answer is incorrect, but you can improve with practice. Keep trying!',
  score: 30,
  maxScore: 100,
});

const ACTIONABLE_FEEDBACK = createFeedback({
  text: 'Try reviewing chapter 3. Consider adding more examples. You might want to focus on the main argument.',
  score: 75,
  maxScore: 100,
  improvements: ['Add examples'],
});

const NO_ACTIONABLE_FEEDBACK = createFeedback({
  text: 'Not great.',
  score: 60,
  maxScore: 100,
  improvements: ['Needs to be better'],
});

// ============================================================================
// TESTS
// ============================================================================

describe('ConstructiveFramingChecker', () => {
  let checker: ConstructiveFramingChecker;

  beforeEach(() => {
    checker = new ConstructiveFramingChecker();
  });

  // ============================================================================
  // CONSTRUCTOR TESTS
  // ============================================================================

  describe('constructor', () => {
    it('should create checker with default config', () => {
      expect(checker).toBeInstanceOf(ConstructiveFramingChecker);
    });

    it('should create checker with custom config', () => {
      const config: ConstructiveFramingCheckerConfig = {
        minPositiveElements: 2,
        requireActionableSuggestions: false,
        minConstructivenessScore: 80,
      };
      const customChecker = new ConstructiveFramingChecker(config);
      expect(customChecker).toBeInstanceOf(ConstructiveFramingChecker);
    });
  });

  // ============================================================================
  // FACTORY FUNCTION TESTS
  // ============================================================================

  describe('factory functions', () => {
    it('should create checker using createConstructiveFramingChecker', () => {
      const factoryChecker = createConstructiveFramingChecker();
      expect(factoryChecker).toBeInstanceOf(ConstructiveFramingChecker);
    });

    it('should create strict checker using createStrictConstructiveChecker', () => {
      const strictChecker = createStrictConstructiveChecker();
      expect(strictChecker).toBeInstanceOf(ConstructiveFramingChecker);
    });

    it('should create lenient checker using createLenientConstructiveChecker', () => {
      const lenientChecker = createLenientConstructiveChecker();
      expect(lenientChecker).toBeInstanceOf(ConstructiveFramingChecker);
    });
  });

  // ============================================================================
  // CHECK TESTS - CONSTRUCTIVE FEEDBACK
  // ============================================================================

  describe('check - constructive feedback', () => {
    it('should pass for constructive feedback', () => {
      const result = checker.check(CONSTRUCTIVE_FEEDBACK);

      expect(result.passed).toBe(true);
    });

    it('should find positive elements', () => {
      const result = checker.check(CONSTRUCTIVE_FEEDBACK);

      expect(result.positiveElements.length).toBeGreaterThan(0);
    });

    it('should have high constructiveness score', () => {
      const result = checker.check(CONSTRUCTIVE_FEEDBACK);

      expect(result.score).toBeGreaterThan(60);
    });

    it('should have few or no issues', () => {
      const result = checker.check(CONSTRUCTIVE_FEEDBACK);

      const criticalIssues = result.issues.filter(
        i => i.type === 'fixed_mindset_language' || i.type === 'unbalanced_criticism'
      );
      expect(criticalIssues).toHaveLength(0);
    });
  });

  // ============================================================================
  // CHECK TESTS - UNCONSTRUCTIVE FEEDBACK
  // ============================================================================

  describe('check - unconstructive feedback', () => {
    it('should detect issues in unconstructive feedback', () => {
      const result = checker.check(UNCONSTRUCTIVE_FEEDBACK);

      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should have lower constructiveness score', () => {
      const result = checker.check(UNCONSTRUCTIVE_FEEDBACK);

      expect(result.score).toBeLessThan(60);
    });

    it('should detect missing positives', () => {
      const result = checker.check(UNCONSTRUCTIVE_FEEDBACK);

      const missingPositives = result.issues.find(i => i.type === 'missing_positives');
      expect(missingPositives).toBeDefined();
    });
  });

  // ============================================================================
  // CHECK TESTS - FIXED MINDSET LANGUAGE
  // ============================================================================

  describe('check - fixed mindset language', () => {
    it('should detect fixed mindset language', () => {
      const result = checker.check(FIXED_MINDSET_FEEDBACK);

      const fixedMindsetIssues = result.issues.filter(
        i => i.type === 'fixed_mindset_language'
      );
      expect(fixedMindsetIssues.length).toBeGreaterThan(0);
    });

    it('should have low growth mindset score', () => {
      const result = checker.check(FIXED_MINDSET_FEEDBACK);

      expect(result.growthMindsetScore).toBeLessThan(50);
    });

    it('should not pass with fixed mindset language', () => {
      const result = checker.check(FIXED_MINDSET_FEEDBACK);

      expect(result.passed).toBe(false);
    });
  });

  // ============================================================================
  // CHECK TESTS - GROWTH MINDSET LANGUAGE
  // ============================================================================

  describe('check - growth mindset language', () => {
    it('should recognize growth mindset language', () => {
      const result = checker.check(GROWTH_MINDSET_FEEDBACK);

      expect(result.growthMindsetScore).toBeGreaterThan(50);
    });

    it('should find encouragement elements', () => {
      const result = checker.check(GROWTH_MINDSET_FEEDBACK);

      const encouragementElements = result.positiveElements.filter(
        e => e.type === 'encouragement' || e.type === 'growth_acknowledgment'
      );
      expect(encouragementElements.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // CHECK TESTS - UNBALANCED CRITICISM
  // ============================================================================

  describe('check - unbalanced criticism', () => {
    it('should detect unbalanced criticism', () => {
      const result = checker.check(UNBALANCED_FEEDBACK);

      const unbalancedIssues = result.issues.filter(
        i => i.type === 'unbalanced_criticism'
      );
      expect(unbalancedIssues.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // CHECK TESTS - VAGUE FEEDBACK
  // ============================================================================

  describe('check - vague feedback', () => {
    it('should detect vague feedback', () => {
      const result = checker.check(VAGUE_FEEDBACK);

      const vagueIssues = result.issues.filter(i => i.type === 'vague_feedback');
      expect(vagueIssues.length).toBeGreaterThan(0);
    });

    it('should suggest being more specific', () => {
      const result = checker.check(VAGUE_FEEDBACK);

      const vagueIssue = result.issues.find(i => i.type === 'vague_feedback');
      expect(vagueIssue?.suggestion).toBeDefined();
    });
  });

  // ============================================================================
  // CHECK TESTS - ENCOURAGEMENT
  // ============================================================================

  describe('check - encouragement', () => {
    it('should detect missing encouragement for low scores', () => {
      const result = checker.check(LOW_SCORE_NO_ENCOURAGEMENT);

      const missingEncouragement = result.issues.find(
        i => i.type === 'missing_encouragement'
      );
      expect(missingEncouragement).toBeDefined();
    });

    it('should not flag missing encouragement when present', () => {
      const result = checker.check(LOW_SCORE_WITH_ENCOURAGEMENT);

      const missingEncouragement = result.issues.find(
        i => i.type === 'missing_encouragement'
      );
      expect(missingEncouragement).toBeUndefined();
    });
  });

  // ============================================================================
  // CHECK TESTS - ACTIONABLE SUGGESTIONS
  // ============================================================================

  describe('check - actionable suggestions', () => {
    it('should recognize actionable suggestions', () => {
      const result = checker.check(ACTIONABLE_FEEDBACK);

      const noNextSteps = result.issues.find(i => i.type === 'no_next_steps');
      expect(noNextSteps).toBeUndefined();
    });

    it('should detect missing actionable suggestions', () => {
      const result = checker.check(NO_ACTIONABLE_FEEDBACK);

      const noNextSteps = result.issues.find(i => i.type === 'no_next_steps');
      expect(noNextSteps).toBeDefined();
    });
  });

  // ============================================================================
  // POSITIVE ELEMENTS TESTS
  // ============================================================================

  describe('positive elements', () => {
    it('should identify strength-related positive elements', () => {
      const result = checker.check(CONSTRUCTIVE_FEEDBACK);

      // The source uses 'strengths' key from POSITIVE_PATTERNS
      // which includes patterns like "great work", "excellent understanding"
      expect(result.positiveElements.length).toBeGreaterThan(0);
    });

    it('should identify progress elements', () => {
      const progressFeedback = createFeedback({
        text: 'You are improving and getting better. Showing great progress!',
      });
      const result = checker.check(progressFeedback);

      const progressElements = result.positiveElements.filter(e => e.type === 'progress');
      expect(progressElements.length).toBeGreaterThan(0);
    });

    it('should track position of positive elements', () => {
      const result = checker.check(CONSTRUCTIVE_FEEDBACK);

      for (const element of result.positiveElements) {
        expect(element.position).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ============================================================================
  // SCORE CALCULATION TESTS
  // ============================================================================

  describe('score calculation', () => {
    it('should return higher score for constructive feedback', () => {
      const constructiveResult = checker.check(CONSTRUCTIVE_FEEDBACK);
      const unconstructiveResult = checker.check(UNCONSTRUCTIVE_FEEDBACK);

      expect(constructiveResult.score).toBeGreaterThan(unconstructiveResult.score);
    });

    it('should cap score at 100', () => {
      const result = checker.check(CONSTRUCTIVE_FEEDBACK);

      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should not return negative score', () => {
      const result = checker.check(UNCONSTRUCTIVE_FEEDBACK);

      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // GROWTH MINDSET SCORE TESTS
  // ============================================================================

  describe('growth mindset score', () => {
    it('should return higher growth mindset score for growth-oriented feedback', () => {
      const growthResult = checker.check(GROWTH_MINDSET_FEEDBACK);
      const fixedResult = checker.check(FIXED_MINDSET_FEEDBACK);

      expect(growthResult.growthMindsetScore).toBeGreaterThan(fixedResult.growthMindsetScore);
    });

    it('should cap growth mindset score at 100', () => {
      const result = checker.check(GROWTH_MINDSET_FEEDBACK);

      expect(result.growthMindsetScore).toBeLessThanOrEqual(100);
    });

    it('should not return negative growth mindset score', () => {
      const result = checker.check(FIXED_MINDSET_FEEDBACK);

      expect(result.growthMindsetScore).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // GET SUGGESTIONS TESTS
  // ============================================================================

  describe('getSuggestions', () => {
    it('should return suggestions for issues', () => {
      const result = checker.check(UNCONSTRUCTIVE_FEEDBACK);
      const suggestions = checker.getSuggestions(result);

      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should return empty array for no issues', () => {
      const result = checker.check(CONSTRUCTIVE_FEEDBACK);
      const suggestions = checker.getSuggestions(result);

      // May have general suggestions based on scores
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should include growth mindset suggestion when score is low', () => {
      const result = checker.check(FIXED_MINDSET_FEEDBACK);
      const suggestions = checker.getSuggestions(result);

      const hasGrowthSuggestion = suggestions.some(s => s.includes('growth mindset'));
      expect(hasGrowthSuggestion).toBe(true);
    });

    it('should include positive element suggestion when none found', () => {
      const noPositiveFeedback = createFeedback({
        text: 'Review the material again.',
        strengths: [],
      });
      const result = checker.check(noPositiveFeedback);
      const suggestions = checker.getSuggestions(result);

      const hasPositiveSuggestion = suggestions.some(s => s.includes('positive'));
      expect(hasPositiveSuggestion).toBe(true);
    });
  });

  // ============================================================================
  // DEFAULT CONFIG TESTS
  // ============================================================================

  describe('default config', () => {
    it('should have default minimum positive elements', () => {
      expect(DEFAULT_CONSTRUCTIVE_CONFIG.minPositiveElements).toBe(1);
    });

    it('should require actionable suggestions by default', () => {
      expect(DEFAULT_CONSTRUCTIVE_CONFIG.requireActionableSuggestions).toBe(true);
    });

    it('should have default minimum constructiveness score', () => {
      expect(DEFAULT_CONSTRUCTIVE_CONFIG.minConstructivenessScore).toBe(60);
    });

    it('should have default minimum growth mindset score', () => {
      expect(DEFAULT_CONSTRUCTIVE_CONFIG.minGrowthMindsetScore).toBe(50);
    });
  });

  // ============================================================================
  // STRICT/LENIENT CHECKER TESTS
  // ============================================================================

  describe('strict/lenient checkers', () => {
    it('should require more positives with strict checker', () => {
      const strictChecker = createStrictConstructiveChecker();
      const feedback = createFeedback({
        text: 'Good work on this.',
        strengths: ['One strength'],
      });
      const result = strictChecker.check(feedback);

      // Strict requires 2 positive elements, may flag as missing
      expect(result).toBeDefined();
    });

    it('should be more lenient with lenient checker', () => {
      const lenientChecker = createLenientConstructiveChecker();
      const result = lenientChecker.check(UNCONSTRUCTIVE_FEEDBACK);

      // Lenient doesn't require positives or actionable suggestions
      const missingPositives = result.issues.find(i => i.type === 'missing_positives');
      expect(missingPositives).toBeUndefined();
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('edge cases', () => {
    it('should handle feedback with empty text', () => {
      const emptyFeedback = createFeedback({ text: '' });
      const result = checker.check(emptyFeedback);

      expect(result).toBeDefined();
    });

    it('should handle feedback with no strengths or improvements', () => {
      const minimalFeedback = createFeedback({
        strengths: undefined,
        improvements: undefined,
      });
      const result = checker.check(minimalFeedback);

      expect(result).toBeDefined();
    });

    it('should handle feedback with empty arrays', () => {
      const emptyArraysFeedback = createFeedback({
        strengths: [],
        improvements: [],
      });
      const result = checker.check(emptyArraysFeedback);

      expect(result).toBeDefined();
    });

    it('should handle very long feedback', () => {
      const longFeedback = createFeedback({
        text: 'Great work! '.repeat(500),
      });
      const result = checker.check(longFeedback);

      expect(result).toBeDefined();
    });

    it('should handle feedback with special characters', () => {
      const specialFeedback = createFeedback({
        text: 'Great work!!! Keep going??? Yes... definitely!!!',
      });
      const result = checker.check(specialFeedback);

      expect(result).toBeDefined();
    });

    it('should handle feedback with comments', () => {
      const commentFeedback = createFeedback({
        comments: 'Additional notes: Great effort overall.',
      });
      const result = checker.check(commentFeedback);

      expect(result).toBeDefined();
    });

    it('should handle high score feedback', () => {
      const highScoreFeedback = createFeedback({
        text: 'Excellent work!',
        score: 100,
        maxScore: 100,
      });
      const result = checker.check(highScoreFeedback);

      // High score feedback should not require encouragement
      const missingEncouragement = result.issues.find(
        i => i.type === 'missing_encouragement'
      );
      expect(missingEncouragement).toBeUndefined();
    });

    it('should handle zero score feedback', () => {
      const zeroScoreFeedback = createFeedback({
        text: 'Please review the instructions.',
        score: 0,
        maxScore: 100,
      });
      const result = checker.check(zeroScoreFeedback);

      expect(result).toBeDefined();
    });
  });

  // ============================================================================
  // ISSUE TYPES TESTS
  // ============================================================================

  describe('issue types', () => {
    it('should include all required issue properties', () => {
      const result = checker.check(UNCONSTRUCTIVE_FEEDBACK);

      for (const issue of result.issues) {
        expect(issue.type).toBeDefined();
        expect(issue.description).toBeDefined();
        expect(issue.suggestion).toBeDefined();
      }
    });

    it('should include problematic text in issues', () => {
      const result = checker.check(FIXED_MINDSET_FEEDBACK);

      const fixedMindsetIssue = result.issues.find(
        i => i.type === 'fixed_mindset_language'
      );
      expect(fixedMindsetIssue?.text).toBeDefined();
    });
  });

  // ============================================================================
  // DEDUPLICATION TESTS
  // ============================================================================

  describe('deduplication', () => {
    it('should deduplicate repeated positive elements', () => {
      const repeatedFeedback = createFeedback({
        text: 'Great work! Great work! Great work!',
      });
      const result = checker.check(repeatedFeedback);

      // Should not have duplicate elements
      const texts = result.positiveElements.map(e => e.text.toLowerCase());
      const uniqueTexts = [...new Set(texts)];
      expect(texts.length).toBe(uniqueTexts.length);
    });
  });
});
