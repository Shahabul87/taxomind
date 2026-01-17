/**
 * @sam-ai/safety - Bias Detector Tests
 * Tests for detecting potential bias patterns in evaluation feedback
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { BiasDetector, createBiasDetector, createStrictBiasDetector, createLenientBiasDetector, createCategoryBiasDetector, } from '../bias-detector';
// ============================================================================
// SAMPLE DATA
// ============================================================================
const NEUTRAL_TEXT = 'Your analysis demonstrates good understanding of the concepts. Continue practicing these skills.';
const GENDER_BIAS_TEXT = 'For a girl, you did really well on this math problem. Boys are naturally better at this.';
const RACIAL_ETHNIC_BIAS_TEXT = 'Surprisingly good work for your background. Your people don\'t usually excel at this.';
const AGE_BIAS_TEXT = 'At your age, you should know this already. Kids these days just don\'t pay attention.';
const DISABILITY_BIAS_TEXT = 'Despite your condition, you performed well. Normal students would find this easier.';
const SOCIOECONOMIC_BIAS_TEXT = 'For someone from your neighborhood, this is impressive. You probably don\'t have access to resources.';
const NEURODIVERSITY_BIAS_TEXT = 'Your ADHD is not an excuse for this work. You just need to focus more.';
const CULTURAL_BIAS_TEXT = 'Your culture doesn\'t value education the same way. The Western approach would help.';
const EDUCATIONAL_BIAS_TEXT = 'Homeschooled students always struggle with this. First-generation students need extra help.';
const MULTI_BIAS_TEXT = 'For a girl from your background, surprisingly good. At your age, boys do better.';
// ============================================================================
// TESTS
// ============================================================================
describe('BiasDetector', () => {
    let detector;
    beforeEach(() => {
        detector = new BiasDetector();
    });
    // ============================================================================
    // CONSTRUCTOR TESTS
    // ============================================================================
    describe('constructor', () => {
        it('should create detector with default config', () => {
            expect(detector).toBeInstanceOf(BiasDetector);
        });
        it('should create detector with custom config', () => {
            const config = {
                minConfidence: 0.8,
            };
            const customDetector = new BiasDetector(config);
            expect(customDetector).toBeInstanceOf(BiasDetector);
        });
        it('should create detector with category filtering', () => {
            const config = {
                categoriesToCheck: ['gender', 'age'],
            };
            const customDetector = new BiasDetector(config);
            expect(customDetector).toBeInstanceOf(BiasDetector);
        });
        it('should have patterns loaded', () => {
            expect(detector.getPatternCount()).toBeGreaterThan(0);
        });
    });
    // ============================================================================
    // FACTORY FUNCTION TESTS
    // ============================================================================
    describe('factory functions', () => {
        it('should create detector using createBiasDetector', () => {
            const factoryDetector = createBiasDetector();
            expect(factoryDetector).toBeInstanceOf(BiasDetector);
        });
        it('should create strict detector using createStrictBiasDetector', () => {
            const strictDetector = createStrictBiasDetector();
            expect(strictDetector).toBeInstanceOf(BiasDetector);
        });
        it('should create lenient detector using createLenientBiasDetector', () => {
            const lenientDetector = createLenientBiasDetector();
            expect(lenientDetector).toBeInstanceOf(BiasDetector);
        });
        it('should create category-specific detector using createCategoryBiasDetector', () => {
            const categoryDetector = createCategoryBiasDetector(['gender']);
            expect(categoryDetector).toBeInstanceOf(BiasDetector);
        });
    });
    // ============================================================================
    // DETECTION TESTS - NEUTRAL TEXT
    // ============================================================================
    describe('detect - neutral text', () => {
        it('should not detect bias in neutral text', () => {
            const result = detector.detect(NEUTRAL_TEXT);
            expect(result.detected).toBe(false);
            expect(result.indicators).toHaveLength(0);
            expect(result.riskScore).toBe(0);
        });
        it('should return empty categories for neutral text', () => {
            const result = detector.detect(NEUTRAL_TEXT);
            expect(result.categories).toHaveLength(0);
        });
    });
    // ============================================================================
    // DETECTION TESTS - BIAS PATTERNS
    // ============================================================================
    describe('detect - gender bias patterns', () => {
        it('should detect gender bias', () => {
            const result = detector.detect(GENDER_BIAS_TEXT);
            expect(result.detected).toBe(true);
            expect(result.categories).toContain('gender');
        });
        it('should detect "for a girl/boy" pattern', () => {
            const result = detector.detect('For a boy, this is excellent work.');
            expect(result.detected).toBe(true);
            expect(result.indicators.some(i => i.type === 'gender')).toBe(true);
        });
    });
    describe('detect - racial/ethnic bias patterns', () => {
        it('should detect racial/ethnic bias', () => {
            const result = detector.detect(RACIAL_ETHNIC_BIAS_TEXT);
            expect(result.detected).toBe(true);
            expect(result.categories).toContain('racial_ethnic');
        });
        it('should detect "surprisingly good" pattern', () => {
            const result = detector.detect('You are surprisingly articulate.');
            expect(result.detected).toBe(true);
        });
    });
    describe('detect - age bias patterns', () => {
        it('should detect age bias', () => {
            const result = detector.detect(AGE_BIAS_TEXT);
            expect(result.detected).toBe(true);
            expect(result.categories).toContain('age');
        });
        it('should detect "at your age" pattern', () => {
            const result = detector.detect('At your age, this should be easy.');
            expect(result.detected).toBe(true);
        });
    });
    describe('detect - disability bias patterns', () => {
        it('should detect disability bias', () => {
            const result = detector.detect(DISABILITY_BIAS_TEXT);
            expect(result.detected).toBe(true);
            expect(result.categories).toContain('disability');
        });
        it('should detect "normal students" pattern', () => {
            const result = detector.detect('Normal students understand this quickly.');
            expect(result.detected).toBe(true);
        });
    });
    describe('detect - socioeconomic bias patterns', () => {
        it('should detect socioeconomic bias', () => {
            const result = detector.detect(SOCIOECONOMIC_BIAS_TEXT);
            expect(result.detected).toBe(true);
            expect(result.categories).toContain('socioeconomic');
        });
    });
    describe('detect - neurodiversity bias patterns', () => {
        it('should detect neurodiversity bias', () => {
            const result = detector.detect(NEURODIVERSITY_BIAS_TEXT);
            expect(result.detected).toBe(true);
            expect(result.categories).toContain('neurodiversity');
        });
        it('should detect dismissal of attention challenges', () => {
            const result = detector.detect('You just need to focus more.');
            expect(result.detected).toBe(true);
        });
    });
    describe('detect - cultural bias patterns', () => {
        it('should detect cultural bias', () => {
            const result = detector.detect(CULTURAL_BIAS_TEXT);
            expect(result.detected).toBe(true);
            expect(result.indicators.some(i => i.type === 'cultural')).toBe(true);
        });
    });
    describe('detect - educational background bias patterns', () => {
        it('should detect educational background bias', () => {
            const result = detector.detect(EDUCATIONAL_BIAS_TEXT);
            expect(result.detected).toBe(true);
            expect(result.categories).toContain('educational_background');
        });
    });
    // ============================================================================
    // MULTIPLE CATEGORY DETECTION TESTS
    // ============================================================================
    describe('detect - multiple categories', () => {
        it('should detect multiple bias categories', () => {
            const result = detector.detect(MULTI_BIAS_TEXT);
            expect(result.detected).toBe(true);
            expect(result.categories.length).toBeGreaterThan(1);
        });
        it('should have higher risk score for multiple categories', () => {
            const singleResult = detector.detect('For a girl, this is good work.');
            const multiResult = detector.detect(MULTI_BIAS_TEXT);
            expect(multiResult.riskScore).toBeGreaterThan(singleResult.riskScore);
        });
    });
    // ============================================================================
    // RISK SCORE TESTS
    // ============================================================================
    describe('risk score calculation', () => {
        it('should return zero risk score for neutral text', () => {
            const result = detector.detect(NEUTRAL_TEXT);
            expect(result.riskScore).toBe(0);
        });
        it('should return higher risk score for more indicators', () => {
            const singleResult = detector.detect('For a boy, this is good work.');
            const multiResult = detector.detect(MULTI_BIAS_TEXT);
            expect(multiResult.riskScore).toBeGreaterThan(singleResult.riskScore);
        });
        it('should cap risk score at 100', () => {
            const result = detector.detect(MULTI_BIAS_TEXT);
            expect(result.riskScore).toBeLessThanOrEqual(100);
        });
        it('should never return negative risk score', () => {
            const result = detector.detect(MULTI_BIAS_TEXT);
            expect(result.riskScore).toBeGreaterThanOrEqual(0);
        });
    });
    // ============================================================================
    // SUGGESTIONS TESTS
    // ============================================================================
    describe('getSuggestions', () => {
        it('should return suggestions for indicators', () => {
            const result = detector.detect(GENDER_BIAS_TEXT);
            const suggestions = detector.getSuggestions(result.indicators);
            expect(suggestions.size).toBeGreaterThan(0);
        });
        it('should return empty map for no indicators', () => {
            const result = detector.detect(NEUTRAL_TEXT);
            const suggestions = detector.getSuggestions(result.indicators);
            expect(suggestions.size).toBe(0);
        });
        it('should provide neutral alternatives', () => {
            const result = detector.detect(GENDER_BIAS_TEXT);
            const suggestions = detector.getSuggestions(result.indicators);
            for (const alternative of suggestions.values()) {
                expect(alternative).toBeDefined();
                expect(alternative.length).toBeGreaterThan(0);
            }
        });
    });
    // ============================================================================
    // HAS CATEGORY TESTS
    // ============================================================================
    describe('hasCategory', () => {
        it('should return true for detected category', () => {
            const hasGender = detector.hasCategory(GENDER_BIAS_TEXT, 'gender');
            expect(hasGender).toBe(true);
        });
        it('should return false for non-detected category', () => {
            const hasDisability = detector.hasCategory(GENDER_BIAS_TEXT, 'disability');
            expect(hasDisability).toBe(false);
        });
        it('should return false for neutral text', () => {
            const hasGender = detector.hasCategory(NEUTRAL_TEXT, 'gender');
            expect(hasGender).toBe(false);
        });
    });
    // ============================================================================
    // GET INDICATORS BY CATEGORY TESTS
    // ============================================================================
    describe('getIndicatorsByCategory', () => {
        it('should group indicators by category', () => {
            const result = detector.detect(MULTI_BIAS_TEXT);
            const grouped = detector.getIndicatorsByCategory(result.indicators);
            expect(grouped.size).toBeGreaterThan(0);
        });
        it('should return empty map for no indicators', () => {
            const result = detector.detect(NEUTRAL_TEXT);
            const grouped = detector.getIndicatorsByCategory(result.indicators);
            expect(grouped.size).toBe(0);
        });
        it('should correctly categorize indicators', () => {
            const result = detector.detect(GENDER_BIAS_TEXT);
            const grouped = detector.getIndicatorsByCategory(result.indicators);
            if (grouped.has('gender')) {
                const genderIndicators = grouped.get('gender');
                expect(genderIndicators).toBeDefined();
                expect(genderIndicators.every(i => i.type === 'gender')).toBe(true);
            }
        });
    });
    // ============================================================================
    // SUPPORTED CATEGORIES TESTS
    // ============================================================================
    describe('getSupportedCategories', () => {
        it('should return list of supported categories', () => {
            const categories = detector.getSupportedCategories();
            expect(categories).toContain('gender');
            expect(categories).toContain('racial_ethnic');
            expect(categories).toContain('age');
            expect(categories).toContain('disability');
            expect(categories).toContain('socioeconomic');
            expect(categories).toContain('neurodiversity');
            expect(categories).toContain('cultural');
            expect(categories).toContain('educational_background');
        });
    });
    // ============================================================================
    // CONFIDENCE FILTERING TESTS
    // ============================================================================
    describe('confidence filtering', () => {
        it('should filter by minimum confidence', () => {
            const lenientDetector = createLenientBiasDetector();
            const result = lenientDetector.detect('At your age, you should know this.');
            // Lower confidence patterns should be filtered
            const allHighConfidence = result.indicators.every(i => i.confidence >= 0.8);
            expect(allHighConfidence).toBe(true);
        });
        it('should include low confidence with strict detector', () => {
            const strictDetector = createStrictBiasDetector();
            const result = strictDetector.detect(AGE_BIAS_TEXT);
            expect(result.detected).toBe(true);
        });
    });
    // ============================================================================
    // CATEGORY FILTERING TESTS
    // ============================================================================
    describe('category filtering', () => {
        it('should only detect specified categories', () => {
            const genderOnlyDetector = createCategoryBiasDetector(['gender']);
            const result = genderOnlyDetector.detect(MULTI_BIAS_TEXT);
            const allGender = result.indicators.every(i => i.type === 'gender');
            expect(allGender).toBe(true);
        });
        it('should not detect excluded categories', () => {
            const genderOnlyDetector = createCategoryBiasDetector(['gender']);
            const result = genderOnlyDetector.detect(AGE_BIAS_TEXT);
            expect(result.detected).toBe(false);
        });
    });
    // ============================================================================
    // EDGE CASES
    // ============================================================================
    describe('edge cases', () => {
        it('should handle empty text', () => {
            const result = detector.detect('');
            expect(result.detected).toBe(false);
            expect(result.indicators).toHaveLength(0);
            expect(result.riskScore).toBe(0);
        });
        it('should handle text with only whitespace', () => {
            const result = detector.detect('   \n\t  ');
            expect(result.detected).toBe(false);
        });
        it('should handle very long text', () => {
            const longText = NEUTRAL_TEXT.repeat(100);
            const result = detector.detect(longText);
            expect(result).toBeDefined();
        });
        it('should handle special characters', () => {
            const specialText = 'For a girl!!! you did really??? well...';
            const result = detector.detect(specialText);
            expect(result.detected).toBe(true);
        });
        it('should handle case variations', () => {
            const result = detector.detect('FOR A GIRL, you did well.');
            expect(result.detected).toBe(true);
        });
    });
    // ============================================================================
    // INDICATOR PROPERTIES TESTS
    // ============================================================================
    describe('indicator properties', () => {
        it('should include all required properties', () => {
            const result = detector.detect(GENDER_BIAS_TEXT);
            for (const indicator of result.indicators) {
                expect(indicator.type).toBeDefined();
                expect(indicator.trigger).toBeDefined();
                expect(indicator.confidence).toBeDefined();
                expect(indicator.explanation).toBeDefined();
                expect(typeof indicator.confidence).toBe('number');
                expect(indicator.confidence).toBeGreaterThanOrEqual(0);
                expect(indicator.confidence).toBeLessThanOrEqual(1);
            }
        });
        it('should include neutral alternatives', () => {
            const result = detector.detect(GENDER_BIAS_TEXT);
            const hasAlternatives = result.indicators.some(i => i.neutralAlternative);
            expect(hasAlternatives).toBe(true);
        });
    });
});
//# sourceMappingURL=bias-detector.test.js.map