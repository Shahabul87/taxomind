/**
 * @sam-ai/safety - Discouraging Language Detector Tests
 * Tests for detecting discouraging, demotivating, or harmful language in feedback
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { DiscouragingLanguageDetector, createDiscouragingLanguageDetector, createStrictDiscouragingDetector, createLenientDiscouragingDetector, } from '../discouraging-language-detector';
// ============================================================================
// SAMPLE DATA
// ============================================================================
const POSITIVE_TEXT = 'Great work on this assignment! Your analysis shows good understanding of the concepts.';
const ABSOLUTE_NEGATIVE_TEXT = 'You will never understand this topic. You can\'t do math properly.';
const PERSONAL_ATTACK_TEXT = 'You\'re not smart enough for this. What\'s wrong with you?';
const DISMISSIVE_TEXT = 'This is completely wrong. You clearly didn\'t read the instructions.';
const COMPARISON_TEXT = 'Unlike other students, you are falling behind the class. Everyone else understands this.';
const HOPELESSNESS_TEXT = 'There\'s no hope for improvement. It\'s too late to fix this. Give up.';
const LABELING_TEXT = 'You\'re a bad student. You\'re just not cut out for this.';
const SARCASM_TEXT = 'Great job, not. Wow, really impressive work there.';
const CONDESCENDING_TEXT = 'Obviously you don\'t understand. Even a child could do this. I\'m surprised you don\'t know this.';
const MIXED_TEXT = 'You never pay attention in class. This is completely wrong. I\'m surprised you don\'t know this basic concept.';
// ============================================================================
// TESTS
// ============================================================================
describe('DiscouragingLanguageDetector', () => {
    let detector;
    beforeEach(() => {
        detector = new DiscouragingLanguageDetector();
    });
    // ============================================================================
    // CONSTRUCTOR TESTS
    // ============================================================================
    describe('constructor', () => {
        it('should create detector with default config', () => {
            expect(detector).toBeInstanceOf(DiscouragingLanguageDetector);
        });
        it('should create detector with custom config', () => {
            const config = {
                minSeverity: 'high',
            };
            const customDetector = new DiscouragingLanguageDetector(config);
            expect(customDetector).toBeInstanceOf(DiscouragingLanguageDetector);
        });
        it('should create detector with custom phrases', () => {
            const config = {
                customPhrases: ['terrible work', 'pathetic attempt'],
            };
            const customDetector = new DiscouragingLanguageDetector(config);
            expect(customDetector.getPatternCount()).toBeGreaterThan(0);
        });
        it('should have patterns loaded', () => {
            expect(detector.getPatternCount()).toBeGreaterThan(0);
        });
    });
    // ============================================================================
    // FACTORY FUNCTION TESTS
    // ============================================================================
    describe('factory functions', () => {
        it('should create detector using createDiscouragingLanguageDetector', () => {
            const factoryDetector = createDiscouragingLanguageDetector();
            expect(factoryDetector).toBeInstanceOf(DiscouragingLanguageDetector);
        });
        it('should create strict detector using createStrictDiscouragingDetector', () => {
            const strictDetector = createStrictDiscouragingDetector();
            expect(strictDetector).toBeInstanceOf(DiscouragingLanguageDetector);
        });
        it('should create lenient detector using createLenientDiscouragingDetector', () => {
            const lenientDetector = createLenientDiscouragingDetector();
            expect(lenientDetector).toBeInstanceOf(DiscouragingLanguageDetector);
        });
    });
    // ============================================================================
    // DETECTION TESTS - POSITIVE TEXT
    // ============================================================================
    describe('detect - positive text', () => {
        it('should not detect discouraging language in positive text', () => {
            const result = detector.detect(POSITIVE_TEXT);
            expect(result.found).toBe(false);
            expect(result.matches).toHaveLength(0);
            expect(result.score).toBe(100);
        });
        it('should return perfect score for encouraging text', () => {
            const encouragingText = 'You did a great job! Keep up the excellent work.';
            const result = detector.detect(encouragingText);
            expect(result.score).toBe(100);
        });
    });
    // ============================================================================
    // DETECTION TESTS - DISCOURAGING PATTERNS
    // ============================================================================
    describe('detect - absolute negative patterns', () => {
        it('should detect absolute negative language', () => {
            const result = detector.detect(ABSOLUTE_NEGATIVE_TEXT);
            expect(result.found).toBe(true);
            expect(result.matches.length).toBeGreaterThan(0);
            expect(result.matches.some(m => m.category === 'absolute_negative')).toBe(true);
        });
        it('should detect "you will never" pattern', () => {
            const result = detector.detect('You will never understand this.');
            expect(result.found).toBe(true);
            expect(result.matches.some(m => m.phrase.toLowerCase().includes('never'))).toBe(true);
        });
    });
    describe('detect - personal attack patterns', () => {
        it('should detect personal attack language', () => {
            const result = detector.detect(PERSONAL_ATTACK_TEXT);
            expect(result.found).toBe(true);
            expect(result.matches.some(m => m.category === 'personal_attack')).toBe(true);
        });
        it('should classify personal attacks as critical severity', () => {
            const result = detector.detect('You\'re not smart enough');
            expect(result.found).toBe(true);
            expect(result.matches.some(m => m.severity === 'critical')).toBe(true);
        });
    });
    describe('detect - dismissive patterns', () => {
        it('should detect dismissive language', () => {
            const result = detector.detect(DISMISSIVE_TEXT);
            expect(result.found).toBe(true);
            expect(result.matches.some(m => m.category === 'dismissive')).toBe(true);
        });
        it('should detect "completely wrong" pattern', () => {
            const result = detector.detect('This is completely wrong.');
            expect(result.found).toBe(true);
        });
    });
    describe('detect - comparison patterns', () => {
        it('should detect negative comparison language', () => {
            const result = detector.detect(COMPARISON_TEXT);
            expect(result.found).toBe(true);
            expect(result.matches.some(m => m.category === 'comparing_negatively')).toBe(true);
        });
        it('should detect "everyone else" comparisons', () => {
            const result = detector.detect('Everyone else got this right.');
            expect(result.found).toBe(true);
        });
    });
    describe('detect - hopelessness patterns', () => {
        it('should detect hopelessness language', () => {
            const result = detector.detect(HOPELESSNESS_TEXT);
            expect(result.found).toBe(true);
            expect(result.matches.some(m => m.category === 'hopelessness')).toBe(true);
        });
        it('should detect "give up" pattern', () => {
            const result = detector.detect('You should give up trying.');
            expect(result.found).toBe(true);
            expect(result.matches.some(m => m.severity === 'critical')).toBe(true);
        });
    });
    describe('detect - labeling patterns', () => {
        it('should detect labeling language', () => {
            const result = detector.detect(LABELING_TEXT);
            expect(result.found).toBe(true);
            expect(result.matches.some(m => m.category === 'labeling')).toBe(true);
        });
        it('should classify labeling as critical severity', () => {
            const result = detector.detect('You\'re a bad student.');
            expect(result.found).toBe(true);
            expect(result.matches.some(m => m.severity === 'critical')).toBe(true);
        });
    });
    describe('detect - sarcasm patterns', () => {
        it('should detect sarcastic language', () => {
            const result = detector.detect(SARCASM_TEXT);
            expect(result.found).toBe(true);
            expect(result.matches.some(m => m.category === 'sarcasm')).toBe(true);
        });
    });
    describe('detect - condescending patterns', () => {
        it('should detect condescending language', () => {
            const result = detector.detect(CONDESCENDING_TEXT);
            expect(result.found).toBe(true);
            expect(result.matches.some(m => m.category === 'condescending')).toBe(true);
        });
        it('should detect "even a child" pattern', () => {
            const result = detector.detect('Even a child could understand this.');
            expect(result.found).toBe(true);
        });
    });
    // ============================================================================
    // SCORE CALCULATION TESTS
    // ============================================================================
    describe('score calculation', () => {
        it('should return lower score for more severe issues', () => {
            const criticalResult = detector.detect(LABELING_TEXT);
            const mediumResult = detector.detect('This is completely wrong.');
            expect(criticalResult.score).toBeLessThan(mediumResult.score);
        });
        it('should return lower score for multiple issues', () => {
            const singleResult = detector.detect('You will never understand.');
            const multipleResult = detector.detect(MIXED_TEXT);
            expect(multipleResult.score).toBeLessThan(singleResult.score);
        });
        it('should never return negative score', () => {
            const result = detector.detect(MIXED_TEXT);
            expect(result.score).toBeGreaterThanOrEqual(0);
        });
        it('should cap score at 100', () => {
            const result = detector.detect(POSITIVE_TEXT);
            expect(result.score).toBeLessThanOrEqual(100);
        });
    });
    // ============================================================================
    // SUGGEST ALTERNATIVES TESTS
    // ============================================================================
    describe('suggestAlternatives', () => {
        it('should return alternatives for matches', () => {
            const result = detector.detect(ABSOLUTE_NEGATIVE_TEXT);
            const suggestions = detector.suggestAlternatives(result.matches);
            expect(suggestions.size).toBeGreaterThan(0);
        });
        it('should return empty map for no matches', () => {
            const result = detector.detect(POSITIVE_TEXT);
            const suggestions = detector.suggestAlternatives(result.matches);
            expect(suggestions.size).toBe(0);
        });
        it('should provide constructive alternatives', () => {
            const result = detector.detect('You will never learn this.');
            const suggestions = detector.suggestAlternatives(result.matches);
            for (const alternative of suggestions.values()) {
                expect(alternative).toBeDefined();
                expect(alternative.length).toBeGreaterThan(0);
            }
        });
    });
    // ============================================================================
    // REWRITE WITH ALTERNATIVES TESTS
    // ============================================================================
    describe('rewriteWithAlternatives', () => {
        it('should rewrite text with alternatives', () => {
            const result = detector.detect('You will never understand this concept.');
            const rewritten = detector.rewriteWithAlternatives('You will never understand this concept.', result.matches);
            expect(rewritten).not.toContain('You will never');
        });
        it('should handle multiple replacements', () => {
            const text = 'You will never learn. You can\'t do this.';
            const result = detector.detect(text);
            const rewritten = detector.rewriteWithAlternatives(text, result.matches);
            expect(rewritten).not.toBe(text);
        });
        it('should handle text with no matches', () => {
            const text = 'Great job on this assignment!';
            const result = detector.detect(text);
            const rewritten = detector.rewriteWithAlternatives(text, result.matches);
            expect(rewritten).toBe(text);
        });
    });
    // ============================================================================
    // SEVERITY FILTERING TESTS
    // ============================================================================
    describe('severity filtering', () => {
        it('should filter by minimum severity', () => {
            const strictDetector = new DiscouragingLanguageDetector({ minSeverity: 'critical' });
            // Medium severity should be filtered out
            const result = strictDetector.detect('This is completely wrong.');
            expect(result.found).toBe(false);
        });
        it('should include all severities with low minimum', () => {
            const strictDetector = createStrictDiscouragingDetector();
            const result = strictDetector.detect(DISMISSIVE_TEXT);
            expect(result.found).toBe(true);
        });
        it('should only include high/critical with lenient detector', () => {
            const lenientDetector = createLenientDiscouragingDetector();
            const result = lenientDetector.detect('This is completely wrong.');
            // Medium severity "completely wrong" should be filtered
            const hasNonHighSeverity = result.matches.some(m => m.severity !== 'high' && m.severity !== 'critical');
            expect(hasNonHighSeverity).toBe(false);
        });
    });
    // ============================================================================
    // CUSTOM PATTERNS TESTS
    // ============================================================================
    describe('custom patterns', () => {
        it('should detect custom phrases', () => {
            const customDetector = new DiscouragingLanguageDetector({
                customPhrases: ['terrible work'],
            });
            const result = customDetector.detect('This is terrible work.');
            expect(result.found).toBe(true);
        });
        it('should add custom patterns to existing patterns', () => {
            const customDetector = new DiscouragingLanguageDetector({
                customPhrases: ['my custom phrase'],
            });
            expect(customDetector.getPatternCount()).toBeGreaterThan(30);
        });
    });
    // ============================================================================
    // EDGE CASES
    // ============================================================================
    describe('edge cases', () => {
        it('should handle empty text', () => {
            const result = detector.detect('');
            expect(result.found).toBe(false);
            expect(result.matches).toHaveLength(0);
            expect(result.score).toBe(100);
        });
        it('should handle text with only whitespace', () => {
            const result = detector.detect('   \n\t  ');
            expect(result.found).toBe(false);
        });
        it('should handle very long text', () => {
            const longText = POSITIVE_TEXT.repeat(100);
            const result = detector.detect(longText);
            expect(result).toBeDefined();
        });
        it('should handle special characters', () => {
            const specialText = 'You will never!!! understand??? this...';
            const result = detector.detect(specialText);
            expect(result.found).toBe(true);
        });
        it('should handle case variations', () => {
            const result = detector.detect('YOU WILL NEVER understand THIS.');
            expect(result.found).toBe(true);
        });
        it('should handle mixed case patterns', () => {
            const result = detector.detect('You Will Never learn this.');
            expect(result.found).toBe(true);
        });
    });
    // ============================================================================
    // MATCH DEDUPLICATION TESTS
    // ============================================================================
    describe('match deduplication', () => {
        it('should not return overlapping matches', () => {
            const result = detector.detect(MIXED_TEXT);
            // Check for overlapping positions
            for (let i = 0; i < result.matches.length - 1; i++) {
                for (let j = i + 1; j < result.matches.length; j++) {
                    const a = result.matches[i];
                    const b = result.matches[j];
                    const overlapping = (a.position.start < b.position.end && a.position.end > b.position.start);
                    expect(overlapping).toBe(false);
                }
            }
        });
    });
    // ============================================================================
    // POSITION TRACKING TESTS
    // ============================================================================
    describe('position tracking', () => {
        it('should provide accurate positions for matches', () => {
            const text = 'Some text. You will never understand. More text.';
            const result = detector.detect(text);
            for (const match of result.matches) {
                const extracted = text.substring(match.position.start, match.position.end);
                expect(extracted.toLowerCase()).toContain(match.phrase.toLowerCase());
            }
        });
    });
});
//# sourceMappingURL=discouraging-language-detector.test.js.map