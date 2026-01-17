/**
 * @sam-ai/educational - Unified Bloom's Engine Tests
 * Tests for Priority 1: Unified Bloom's Engine
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { UnifiedBloomsEngine, createUnifiedBloomsEngine } from '../engines/unified-blooms-engine';
import { createMockSAMConfig, createMockAIAdapter, createMockAIResponse, BLOOMS_SAMPLE_CONTENT, createSampleCourse, } from './setup';
describe('UnifiedBloomsEngine', () => {
    let engine;
    let config;
    beforeEach(() => {
        config = {
            samConfig: createMockSAMConfig(),
            defaultMode: 'standard',
            confidenceThreshold: 0.7,
            enableCache: true,
            cacheTTL: 3600,
        };
        engine = createUnifiedBloomsEngine(config);
    });
    // ============================================================================
    // QUICK CLASSIFY TESTS
    // ============================================================================
    describe('quickClassify', () => {
        it('should classify content with REMEMBER keywords', () => {
            const content = BLOOMS_SAMPLE_CONTENT.REMEMBER;
            const result = engine.quickClassify(content);
            expect(result).toBe('REMEMBER');
        });
        it('should classify content with UNDERSTAND keywords', () => {
            const content = BLOOMS_SAMPLE_CONTENT.UNDERSTAND;
            const result = engine.quickClassify(content);
            expect(result).toBe('UNDERSTAND');
        });
        it('should classify content with APPLY keywords', () => {
            const content = BLOOMS_SAMPLE_CONTENT.APPLY;
            const result = engine.quickClassify(content);
            expect(result).toBe('APPLY');
        });
        it('should classify content with ANALYZE keywords', () => {
            const content = BLOOMS_SAMPLE_CONTENT.ANALYZE;
            const result = engine.quickClassify(content);
            expect(result).toBe('ANALYZE');
        });
        it('should classify content with EVALUATE keywords', () => {
            const content = BLOOMS_SAMPLE_CONTENT.EVALUATE;
            const result = engine.quickClassify(content);
            expect(result).toBe('EVALUATE');
        });
        it('should classify content with CREATE keywords', () => {
            const content = BLOOMS_SAMPLE_CONTENT.CREATE;
            const result = engine.quickClassify(content);
            expect(result).toBe('CREATE');
        });
        it('should return UNDERSTAND as default for empty content', () => {
            const result = engine.quickClassify('');
            expect(result).toBe('UNDERSTAND');
        });
        it('should handle mixed content by returning dominant level', () => {
            const content = 'Define the terms. Analyze the patterns. Compare the results.';
            const result = engine.quickClassify(content);
            expect(['REMEMBER', 'ANALYZE']).toContain(result);
        });
    });
    // ============================================================================
    // ANALYZE TESTS
    // ============================================================================
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
        it('should handle standard mode', async () => {
            const content = 'Apply the formula. Solve the problem.';
            const result = await engine.analyze(content, { mode: 'standard' });
            expect(result).toBeDefined();
            expect(result.distribution).toBeDefined();
        });
    });
    // ============================================================================
    // ANALYZE COURSE TESTS
    // ============================================================================
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
        it('should handle empty course', async () => {
            const courseData = {
                id: 'empty-course',
                title: 'Empty Course',
                chapters: [],
            };
            const result = await engine.analyzeCourse(courseData);
            expect(result).toBeDefined();
            expect(result.courseId).toBe('empty-course');
            expect(result.chapters).toHaveLength(0);
        });
        it('should provide learning pathway', async () => {
            const courseData = createSampleCourse();
            const result = await engine.analyzeCourse(courseData);
            expect(result.learningPathway).toBeDefined();
            if (result.learningPathway) {
                expect(result.learningPathway.stages).toBeDefined();
            }
        });
    });
    // ============================================================================
    // SPACED REPETITION TESTS
    // ============================================================================
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
                performance: 0.2,
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
        it('should handle edge case performance values', () => {
            const resultZero = engine.calculateSpacedRepetition({
                userId: 'user-1',
                conceptId: 'concept-1',
                performance: 0,
            });
            expect(resultZero.intervalDays).toBe(1);
            const resultOne = engine.calculateSpacedRepetition({
                userId: 'user-1',
                conceptId: 'concept-1',
                performance: 1,
            });
            expect(resultOne.intervalDays).toBeGreaterThanOrEqual(1);
        });
        it('should return next review date as Date object', () => {
            const result = engine.calculateSpacedRepetition({
                userId: 'user-1',
                conceptId: 'concept-1',
                performance: 0.6,
            });
            expect(result.nextReviewDate).toBeInstanceOf(Date);
            expect(result.nextReviewDate.getTime()).toBeGreaterThan(Date.now());
        });
    });
    // ============================================================================
    // CACHE MANAGEMENT TESTS
    // ============================================================================
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
        it('should track cache hits and misses', async () => {
            engine.clearCache();
            const content = 'Unique test content for cache tracking';
            await engine.analyze(content, { mode: 'quick' });
            const stats1 = engine.getCacheStats();
            expect(stats1.misses).toBe(1);
            await engine.analyze(content, { mode: 'quick' });
            const stats2 = engine.getCacheStats();
            expect(stats2.hits).toBe(1);
        });
    });
    // ============================================================================
    // FACTORY FUNCTION TESTS
    // ============================================================================
    describe('factory function', () => {
        it('should create engine with default options', () => {
            const minimalConfig = {
                samConfig: createMockSAMConfig(),
            };
            const minimalEngine = createUnifiedBloomsEngine(minimalConfig);
            expect(minimalEngine).toBeInstanceOf(UnifiedBloomsEngine);
        });
        it('should create engine with custom options', () => {
            const customConfig = {
                samConfig: createMockSAMConfig(),
                defaultMode: 'comprehensive',
                confidenceThreshold: 0.9,
                enableCache: false,
                cacheTTL: 7200,
            };
            const customEngine = createUnifiedBloomsEngine(customConfig);
            expect(customEngine).toBeInstanceOf(UnifiedBloomsEngine);
        });
        it('should handle custom AI adapter', () => {
            const customAdapter = createMockAIAdapter(() => createMockAIResponse({
                dominantLevel: 'CREATE',
                distribution: {
                    REMEMBER: 5,
                    UNDERSTAND: 10,
                    APPLY: 15,
                    ANALYZE: 20,
                    EVALUATE: 20,
                    CREATE: 30,
                },
                confidence: 0.95,
            }));
            const customConfig = {
                samConfig: {
                    ...createMockSAMConfig(),
                    ai: customAdapter,
                },
            };
            const customEngine = createUnifiedBloomsEngine(customConfig);
            expect(customEngine).toBeInstanceOf(UnifiedBloomsEngine);
        });
    });
    // ============================================================================
    // COGNITIVE PROGRESS TESTS
    // ============================================================================
    describe('updateCognitiveProgress', () => {
        it('should throw error when no database adapter is configured', async () => {
            const input = {
                userId: 'user-1',
                sectionId: 'section-1',
                bloomsLevel: 'APPLY',
                score: 0.85,
            };
            await expect(engine.updateCognitiveProgress(input)).rejects.toThrow('Database adapter required for cognitive progress tracking');
        });
    });
});
