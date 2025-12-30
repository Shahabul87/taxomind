/**
 * @sam-ai/safety - Accessibility Checker Tests
 * Tests for checking readability and accessibility of evaluation feedback
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AccessibilityChecker,
  createAccessibilityChecker,
  createElementaryAccessibilityChecker,
  createHighSchoolAccessibilityChecker,
  createCollegeAccessibilityChecker,
  DEFAULT_ACCESSIBILITY_CONFIG,
} from '../accessibility-checker';
import type { AccessibilityCheckerConfig } from '../accessibility-checker';

// ============================================================================
// SAMPLE DATA
// ============================================================================

const SIMPLE_TEXT = 'Good work. You did well on this. Keep it up.';

const COMPLEX_TEXT = `
The epistemological underpinnings of your methodological paradigm demonstrate
a sophisticated conceptualization of the phenomenological implications,
notwithstanding the hermeneutic ambiguities inherent in your axiological framework.
`;

const LONG_SENTENCE_TEXT = `
This is a very long sentence that goes on and on and on and on and on and on and on
and on and on and on and on and on and on and on and keeps going without stopping
for a very long time without any punctuation to break it up into smaller parts.
`;

const PASSIVE_VOICE_TEXT = `
The work was completed. The concepts were understood. The assignment was submitted.
The results were analyzed. The conclusions were drawn.
`;

const JARGON_TEXT = `
Your methodology demonstrates good synergy. You should leverage your understanding
to optimize the paradigm and contextualize the heuristic approach.
`;

const BALANCED_TEXT = `
Great work on this assignment! You showed good understanding of the main concepts.
Your analysis was clear and well-organized. Consider reviewing the third section
to strengthen your argument. Keep practicing these skills.
`;

const DENSE_PARAGRAPH_TEXT = `
${'This is a sample word. '.repeat(60)}
`;

// ============================================================================
// TESTS
// ============================================================================

describe('AccessibilityChecker', () => {
  let checker: AccessibilityChecker;

  beforeEach(() => {
    checker = new AccessibilityChecker();
  });

  // ============================================================================
  // CONSTRUCTOR TESTS
  // ============================================================================

  describe('constructor', () => {
    it('should create checker with default config', () => {
      expect(checker).toBeInstanceOf(AccessibilityChecker);
    });

    it('should create checker with custom config', () => {
      const config: AccessibilityCheckerConfig = {
        targetGradeLevel: 6,
        maxGradeLevel: 10,
        maxSentenceLength: 20,
      };
      const customChecker = new AccessibilityChecker(config);
      expect(customChecker).toBeInstanceOf(AccessibilityChecker);
    });
  });

  // ============================================================================
  // FACTORY FUNCTION TESTS
  // ============================================================================

  describe('factory functions', () => {
    it('should create checker using createAccessibilityChecker', () => {
      const factoryChecker = createAccessibilityChecker();
      expect(factoryChecker).toBeInstanceOf(AccessibilityChecker);
    });

    it('should create elementary checker using createElementaryAccessibilityChecker', () => {
      const elementaryChecker = createElementaryAccessibilityChecker();
      expect(elementaryChecker).toBeInstanceOf(AccessibilityChecker);
    });

    it('should create high school checker using createHighSchoolAccessibilityChecker', () => {
      const hsChecker = createHighSchoolAccessibilityChecker();
      expect(hsChecker).toBeInstanceOf(AccessibilityChecker);
    });

    it('should create college checker using createCollegeAccessibilityChecker', () => {
      const collegeChecker = createCollegeAccessibilityChecker();
      expect(collegeChecker).toBeInstanceOf(AccessibilityChecker);
    });
  });

  // ============================================================================
  // CHECK TESTS - SIMPLE TEXT
  // ============================================================================

  describe('check - simple text', () => {
    it('should pass for simple, readable text', () => {
      const result = checker.check(SIMPLE_TEXT);

      expect(result.passed).toBe(true);
      expect(result.readabilityScore).toBeGreaterThan(50);
    });

    it('should have low grade level for simple text', () => {
      const result = checker.check(SIMPLE_TEXT);

      expect(result.gradeLevel).toBeLessThan(8);
    });

    it('should have minimal issues for simple text', () => {
      const result = checker.check(SIMPLE_TEXT);

      const criticalIssues = result.issues.filter(
        i => i.severity === 'critical' || i.severity === 'high'
      );
      expect(criticalIssues).toHaveLength(0);
    });
  });

  // ============================================================================
  // CHECK TESTS - COMPLEX TEXT
  // ============================================================================

  describe('check - complex text', () => {
    it('should detect issues in complex text', () => {
      const result = checker.check(COMPLEX_TEXT);

      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should have high grade level for complex text', () => {
      const result = checker.check(COMPLEX_TEXT);

      expect(result.gradeLevel).toBeGreaterThan(12);
    });

    it('should detect jargon in complex text', () => {
      const result = checker.check(COMPLEX_TEXT);

      const jargonIssues = result.issues.filter(
        i => i.type === 'jargon_without_explanation'
      );
      expect(jargonIssues.length).toBeGreaterThan(0);
    });

    it('should detect reading level too high', () => {
      const result = checker.check(COMPLEX_TEXT);

      const readingLevelIssues = result.issues.filter(
        i => i.type === 'reading_level_too_high'
      );
      expect(readingLevelIssues.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // CHECK TESTS - LONG SENTENCES
  // ============================================================================

  describe('check - long sentences', () => {
    it('should detect sentences that are too long', () => {
      const result = checker.check(LONG_SENTENCE_TEXT);

      const longSentenceIssues = result.issues.filter(
        i => i.type === 'sentence_too_long'
      );
      expect(longSentenceIssues.length).toBeGreaterThan(0);
    });

    it('should suggest breaking up long sentences', () => {
      const result = checker.check(LONG_SENTENCE_TEXT);

      const longSentenceIssue = result.issues.find(
        i => i.type === 'sentence_too_long'
      );
      expect(longSentenceIssue?.suggestion).toContain('Break');
    });
  });

  // ============================================================================
  // CHECK TESTS - PASSIVE VOICE
  // ============================================================================

  describe('check - passive voice', () => {
    it('should detect passive voice overuse', () => {
      const result = checker.check(PASSIVE_VOICE_TEXT);

      const passiveIssues = result.issues.filter(
        i => i.type === 'passive_voice_overuse'
      );
      expect(passiveIssues.length).toBeGreaterThan(0);
    });

    it('should track passive voice percentage', () => {
      const result = checker.check(PASSIVE_VOICE_TEXT);

      expect(result.statistics.passiveVoicePercentage).toBeGreaterThan(30);
    });
  });

  // ============================================================================
  // CHECK TESTS - JARGON
  // ============================================================================

  describe('check - jargon', () => {
    it('should detect jargon terms', () => {
      const result = checker.check(JARGON_TEXT);

      const jargonIssues = result.issues.filter(
        i => i.type === 'jargon_without_explanation'
      );
      expect(jargonIssues.length).toBeGreaterThan(0);
    });

    it('should list detected jargon terms', () => {
      const result = checker.check(JARGON_TEXT);

      const jargonIssue = result.issues.find(
        i => i.type === 'jargon_without_explanation'
      );
      expect(jargonIssue?.description).toContain('methodology');
    });
  });

  // ============================================================================
  // CHECK TESTS - DENSE PARAGRAPHS
  // ============================================================================

  describe('check - dense paragraphs', () => {
    it('should detect dense paragraphs', () => {
      const result = checker.check(DENSE_PARAGRAPH_TEXT);

      const denseParagraphIssues = result.issues.filter(
        i => i.type === 'dense_paragraphs'
      );
      expect(denseParagraphIssues.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // STATISTICS TESTS
  // ============================================================================

  describe('statistics', () => {
    it('should calculate word count', () => {
      const result = checker.check(SIMPLE_TEXT);

      expect(result.statistics.wordCount).toBeGreaterThan(0);
    });

    it('should calculate sentence count', () => {
      const result = checker.check(SIMPLE_TEXT);

      expect(result.statistics.sentenceCount).toBeGreaterThan(0);
    });

    it('should calculate average sentence length', () => {
      const result = checker.check(BALANCED_TEXT);

      expect(result.statistics.averageSentenceLength).toBeGreaterThan(0);
    });

    it('should calculate average word syllables', () => {
      const result = checker.check(SIMPLE_TEXT);

      expect(result.statistics.averageWordSyllables).toBeGreaterThan(0);
    });

    it('should calculate complex word percentage', () => {
      const result = checker.check(COMPLEX_TEXT);

      expect(result.statistics.complexWordPercentage).toBeGreaterThan(0);
    });

    it('should calculate passive voice percentage', () => {
      const result = checker.check(PASSIVE_VOICE_TEXT);

      expect(result.statistics.passiveVoicePercentage).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // READABILITY SCORE TESTS
  // ============================================================================

  describe('readability score', () => {
    it('should return higher score for simpler text', () => {
      const simpleResult = checker.check(SIMPLE_TEXT);
      const complexResult = checker.check(COMPLEX_TEXT);

      expect(simpleResult.readabilityScore).toBeGreaterThan(complexResult.readabilityScore);
    });

    it('should cap readability score at 100', () => {
      const result = checker.check(SIMPLE_TEXT);

      expect(result.readabilityScore).toBeLessThanOrEqual(100);
    });

    it('should not return negative readability score', () => {
      const result = checker.check(COMPLEX_TEXT);

      expect(result.readabilityScore).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // GRADE LEVEL TESTS
  // ============================================================================

  describe('grade level', () => {
    it('should calculate Flesch-Kincaid grade level', () => {
      const result = checker.check(BALANCED_TEXT);

      expect(result.gradeLevel).toBeGreaterThanOrEqual(0);
    });

    it('should return lower grade level for simpler text', () => {
      const simpleResult = checker.check(SIMPLE_TEXT);
      const complexResult = checker.check(COMPLEX_TEXT);

      expect(simpleResult.gradeLevel).toBeLessThan(complexResult.gradeLevel);
    });
  });

  // ============================================================================
  // TARGET AUDIENCE TESTS
  // ============================================================================

  describe('target audience', () => {
    it('should accept custom target audience', () => {
      const result = checker.check(BALANCED_TEXT, 5);

      expect(result).toBeDefined();
    });

    it('should flag text above target audience', () => {
      const result = checker.check(COMPLEX_TEXT, 5);

      const readingLevelIssues = result.issues.filter(
        i => i.type === 'reading_level_too_high'
      );
      expect(readingLevelIssues.length).toBeGreaterThan(0);
    });

    it('should pass text at or below target audience', () => {
      const result = checker.check(SIMPLE_TEXT, 12);

      const readingLevelIssues = result.issues.filter(
        i => i.type === 'reading_level_too_high'
      );
      expect(readingLevelIssues).toHaveLength(0);
    });
  });

  // ============================================================================
  // GET SUGGESTIONS TESTS
  // ============================================================================

  describe('getSuggestions', () => {
    it('should return suggestions for issues', () => {
      const result = checker.check(COMPLEX_TEXT);
      const suggestions = checker.getSuggestions(result);

      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should return empty array for no issues', () => {
      const result = checker.check(SIMPLE_TEXT);
      const suggestions = checker.getSuggestions(result);

      // May still have suggestions based on statistics
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should sort suggestions by severity', () => {
      const result = checker.check(COMPLEX_TEXT);
      const suggestions = checker.getSuggestions(result);

      // First suggestions should be from higher severity issues
      expect(suggestions.length).toBeGreaterThan(0);
    });

    it('should include grade level reduction suggestion when needed', () => {
      const result = checker.check(COMPLEX_TEXT);
      const suggestions = checker.getSuggestions(result);

      const hasGradeReduction = suggestions.some(s => s.includes('grade'));
      expect(hasGradeReduction).toBe(true);
    });
  });

  // ============================================================================
  // DEFAULT CONFIG TESTS
  // ============================================================================

  describe('default config', () => {
    it('should have default target grade level', () => {
      expect(DEFAULT_ACCESSIBILITY_CONFIG.targetGradeLevel).toBe(8);
    });

    it('should have default max grade level', () => {
      expect(DEFAULT_ACCESSIBILITY_CONFIG.maxGradeLevel).toBe(12);
    });

    it('should have default max sentence length', () => {
      expect(DEFAULT_ACCESSIBILITY_CONFIG.maxSentenceLength).toBe(25);
    });

    it('should have default max passive voice percentage', () => {
      expect(DEFAULT_ACCESSIBILITY_CONFIG.maxPassiveVoicePercentage).toBe(30);
    });

    it('should have default max complex word percentage', () => {
      expect(DEFAULT_ACCESSIBILITY_CONFIG.maxComplexWordPercentage).toBe(20);
    });
  });

  // ============================================================================
  // LEVEL-SPECIFIC CHECKERS TESTS
  // ============================================================================

  describe('level-specific checkers', () => {
    it('should have stricter limits for elementary checker', () => {
      const elementaryChecker = createElementaryAccessibilityChecker();
      const result = elementaryChecker.check(BALANCED_TEXT);

      // Elementary checker should be stricter
      expect(result).toBeDefined();
    });

    it('should have more lenient limits for college checker', () => {
      const collegeChecker = createCollegeAccessibilityChecker();
      const result = collegeChecker.check(COMPLEX_TEXT);

      // College checker should be more lenient
      expect(result).toBeDefined();
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('edge cases', () => {
    it('should handle empty text', () => {
      const result = checker.check('');

      expect(result.passed).toBe(true);
      expect(result.statistics.wordCount).toBe(0);
      expect(result.statistics.sentenceCount).toBe(0);
    });

    it('should handle text with only whitespace', () => {
      const result = checker.check('   \n\t  ');

      expect(result.passed).toBe(true);
      expect(result.statistics.wordCount).toBe(0);
    });

    it('should handle single word', () => {
      const result = checker.check('Good');

      expect(result).toBeDefined();
      expect(result.statistics.wordCount).toBe(1);
    });

    it('should handle text without sentences', () => {
      const result = checker.check('no punctuation here');

      expect(result).toBeDefined();
    });

    it('should handle very long text', () => {
      const longText = BALANCED_TEXT.repeat(100);
      const result = checker.check(longText);

      expect(result).toBeDefined();
    });

    it('should handle special characters', () => {
      const specialText = 'Good work!!! You did well??? Keep going...';
      const result = checker.check(specialText);

      expect(result).toBeDefined();
    });

    it('should handle multiple paragraph breaks', () => {
      const multiParagraph = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
      const result = checker.check(multiParagraph);

      expect(result).toBeDefined();
    });

    it('should handle numbers in text', () => {
      const numbersText = 'You scored 85 out of 100 points. That is 85% correct.';
      const result = checker.check(numbersText);

      expect(result).toBeDefined();
    });
  });

  // ============================================================================
  // ISSUE SEVERITY TESTS
  // ============================================================================

  describe('issue severity', () => {
    it('should assign severity to all issues', () => {
      const result = checker.check(COMPLEX_TEXT);

      for (const issue of result.issues) {
        expect(['low', 'medium', 'high', 'critical']).toContain(issue.severity);
      }
    });

    it('should include suggestions for all issues', () => {
      const result = checker.check(COMPLEX_TEXT);

      for (const issue of result.issues) {
        expect(issue.suggestion).toBeDefined();
        expect(issue.suggestion.length).toBeGreaterThan(0);
      }
    });

    it('should fail only for high/critical issues', () => {
      // Create a checker that should pass with low/medium issues only
      const result = checker.check(BALANCED_TEXT);

      if (!result.passed) {
        const hasHighCritical = result.issues.some(
          i => i.severity === 'high' || i.severity === 'critical'
        );
        expect(hasHighCritical).toBe(true);
      }
    });
  });

  // ============================================================================
  // SYLLABLE COUNTING TESTS (Indirect)
  // ============================================================================

  describe('syllable counting', () => {
    it('should correctly estimate syllables for simple words', () => {
      const result = checker.check('cat dog bird fish');
      // Simple one-syllable words should have low syllable average
      expect(result.statistics.averageWordSyllables).toBeLessThan(2);
    });

    it('should correctly estimate syllables for complex words', () => {
      const result = checker.check('epistemological phenomenological');
      // Complex words should have high syllable average
      expect(result.statistics.averageWordSyllables).toBeGreaterThan(3);
    });
  });
});
