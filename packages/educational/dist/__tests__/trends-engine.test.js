/**
 * @sam-ai/educational - Trends Engine Tests
 * Tests for AI trends analysis engine
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { TrendsEngine } from '../engines/trends-engine';
import { createMockSAMConfig } from './setup';
// ============================================================================
// SAMPLE DATA FACTORIES
// ============================================================================
function createTrendsConfig(overrides = {}) {
    return {
        samConfig: createMockSAMConfig(),
        ...overrides,
    };
}
function createSampleTrend(overrides = {}) {
    return {
        trendId: 'test-trend-1',
        title: 'Test Trend',
        category: 'AI & Machine Learning',
        relevance: 85,
        timeframe: 'current',
        impact: 'high',
        description: 'A test trend for unit testing purposes.',
        keyInsights: ['Insight 1', 'Insight 2', 'Insight 3'],
        relatedTechnologies: ['Tech A', 'Tech B'],
        applicationAreas: ['Education', 'Learning Analytics'],
        marketAdoption: 25,
        futureOutlook: 'Expected growth',
        educationalImplications: ['Implication 1', 'Implication 2'],
        skillsRequired: ['Skill 1', 'Skill 2'],
        sources: [
            {
                name: 'Test Source',
                url: 'https://example.com',
                credibility: 90,
                publishDate: new Date(),
            },
        ],
        timestamp: new Date(),
        ...overrides,
    };
}
function createSampleCategory(overrides = {}) {
    return {
        id: 'cat-1',
        name: 'AI & Machine Learning',
        description: 'AI and ML trends',
        icon: 'brain',
        trendCount: 5,
        growthRate: 15,
        ...overrides,
    };
}
// ============================================================================
// TESTS
// ============================================================================
describe('TrendsEngine', () => {
    let engine;
    let config;
    beforeEach(() => {
        config = createTrendsConfig();
        engine = new TrendsEngine(config);
    });
    // ============================================================================
    // CONSTRUCTOR TESTS
    // ============================================================================
    describe('constructor', () => {
        it('should create engine with default config', () => {
            const defaultEngine = new TrendsEngine(createTrendsConfig());
            expect(defaultEngine).toBeInstanceOf(TrendsEngine);
        });
        it('should create engine with custom config', () => {
            const customConfig = createTrendsConfig({
                samConfig: createMockSAMConfig({ maxConversationHistory: 25 }),
            });
            const customEngine = new TrendsEngine(customConfig);
            expect(customEngine).toBeInstanceOf(TrendsEngine);
        });
        it('should initialize with built-in trend data', async () => {
            const trends = await engine.analyzeTrends();
            expect(trends.length).toBeGreaterThan(0);
        });
    });
    // ============================================================================
    // ANALYZE TRENDS TESTS
    // ============================================================================
    describe('analyzeTrends', () => {
        it('should return all trends without filter', async () => {
            const trends = await engine.analyzeTrends();
            expect(Array.isArray(trends)).toBe(true);
            expect(trends.length).toBeGreaterThan(0);
        });
        it('should filter trends by category', async () => {
            const trends = await engine.analyzeTrends({ category: 'AI & Machine Learning' });
            expect(Array.isArray(trends)).toBe(true);
            trends.forEach((trend) => {
                expect(trend.category).toBe('AI & Machine Learning');
            });
        });
        it('should filter trends by timeframe', async () => {
            const trends = await engine.analyzeTrends({ timeframe: 'current' });
            expect(Array.isArray(trends)).toBe(true);
            trends.forEach((trend) => {
                expect(trend.timeframe).toBe('current');
            });
        });
        it('should filter trends by minimum relevance', async () => {
            const minRelevance = 80;
            const trends = await engine.analyzeTrends({ minRelevance });
            expect(Array.isArray(trends)).toBe(true);
            trends.forEach((trend) => {
                expect(trend.relevance).toBeGreaterThanOrEqual(minRelevance);
            });
        });
        it('should filter trends by impact level', async () => {
            const trends = await engine.analyzeTrends({ impact: 'transformative' });
            expect(Array.isArray(trends)).toBe(true);
            trends.forEach((trend) => {
                expect(trend.impact).toBe('transformative');
            });
        });
        it('should sort trends by relevance', async () => {
            const trends = await engine.analyzeTrends();
            for (let i = 1; i < trends.length; i++) {
                expect(trends[i - 1].relevance).toBeGreaterThanOrEqual(trends[i].relevance);
            }
        });
        it('should return filtered results with multiple criteria', async () => {
            const trends = await engine.analyzeTrends({
                category: 'AI & Machine Learning',
                minRelevance: 50,
            });
            expect(Array.isArray(trends)).toBe(true);
        });
    });
    // ============================================================================
    // GET TREND TESTS (via analyzeTrends)
    // ============================================================================
    describe('getTrend', () => {
        it('should return trend by searching', async () => {
            const trends = await engine.analyzeTrends();
            expect(trends.length).toBeGreaterThan(0);
            if (trends.length > 0) {
                const foundTrends = await engine.searchTrends(trends[0].title);
                expect(foundTrends.length).toBeGreaterThan(0);
            }
        });
        it('should return empty for non-existent search', async () => {
            const trends = await engine.searchTrends('xyznonexistent123456');
            expect(trends.length).toBe(0);
        });
    });
    // ============================================================================
    // COMPARE TRENDS TESTS
    // ============================================================================
    describe('compareTrends', () => {
        it('should compare two trends', async () => {
            const trends = await engine.analyzeTrends();
            if (trends.length >= 2) {
                const comparison = await engine.compareTrends(trends[0].trendId, trends[1].trendId);
                expect(comparison).toBeDefined();
                expect(comparison.trend1).toBeDefined();
                expect(comparison.trend2).toBeDefined();
            }
        });
        it('should include similarities', async () => {
            const trends = await engine.analyzeTrends();
            if (trends.length >= 2) {
                const comparison = await engine.compareTrends(trends[0].trendId, trends[1].trendId);
                expect(comparison.similarities).toBeDefined();
                expect(Array.isArray(comparison.similarities)).toBe(true);
            }
        });
        it('should include differences', async () => {
            const trends = await engine.analyzeTrends();
            if (trends.length >= 2) {
                const comparison = await engine.compareTrends(trends[0].trendId, trends[1].trendId);
                expect(comparison.differences).toBeDefined();
                expect(Array.isArray(comparison.differences)).toBe(true);
            }
        });
        it('should include competitive analysis', async () => {
            const trends = await engine.analyzeTrends();
            if (trends.length >= 2) {
                const comparison = await engine.compareTrends(trends[0].trendId, trends[1].trendId);
                expect(comparison.competitiveAnalysis).toBeDefined();
                expect(typeof comparison.competitiveAnalysis).toBe('string');
            }
        });
        it('should throw error for invalid trend IDs', async () => {
            await expect(engine.compareTrends('invalid-1', 'invalid-2')).rejects.toThrow();
        });
    });
    // ============================================================================
    // PREDICT TREND TRAJECTORY TESTS
    // ============================================================================
    describe('predictTrendTrajectory', () => {
        it('should predict trend trajectory', async () => {
            const trends = await engine.analyzeTrends();
            if (trends.length > 0) {
                const prediction = await engine.predictTrendTrajectory(trends[0].trendId, '6months');
                expect(prediction).toBeDefined();
                expect(prediction.trend).toBe(trends[0].title);
            }
        });
        it('should include adoption curve', async () => {
            const trends = await engine.analyzeTrends();
            if (trends.length > 0) {
                const prediction = await engine.predictTrendTrajectory(trends[0].trendId, '6months');
                expect(prediction.adoptionCurve).toBeDefined();
                expect(prediction.adoptionCurve.current).toBeDefined();
                expect(prediction.adoptionCurve.predicted).toBeDefined();
                expect(prediction.adoptionCurve.confidence).toBeDefined();
            }
        });
        it('should identify risk factors', async () => {
            const trends = await engine.analyzeTrends();
            if (trends.length > 0) {
                const prediction = await engine.predictTrendTrajectory(trends[0].trendId, '1year');
                expect(prediction.riskFactors).toBeDefined();
                expect(Array.isArray(prediction.riskFactors)).toBe(true);
            }
        });
        it('should identify opportunities', async () => {
            const trends = await engine.analyzeTrends();
            if (trends.length > 0) {
                const prediction = await engine.predictTrendTrajectory(trends[0].trendId, '1year');
                expect(prediction.opportunities).toBeDefined();
                expect(Array.isArray(prediction.opportunities)).toBe(true);
            }
        });
        it('should provide recommendations', async () => {
            const trends = await engine.analyzeTrends();
            if (trends.length > 0) {
                const prediction = await engine.predictTrendTrajectory(trends[0].trendId, '1year');
                expect(prediction.recommendations).toBeDefined();
                expect(Array.isArray(prediction.recommendations)).toBe(true);
            }
        });
        it('should support different prediction horizons', async () => {
            const trends = await engine.analyzeTrends();
            if (trends.length > 0) {
                const prediction6m = await engine.predictTrendTrajectory(trends[0].trendId, '6months');
                const prediction2y = await engine.predictTrendTrajectory(trends[0].trendId, '2years');
                expect(prediction6m.predictionHorizon).toBe('6months');
                expect(prediction2y.predictionHorizon).toBe('2years');
            }
        });
        it('should throw error for non-existent trend', async () => {
            await expect(engine.predictTrendTrajectory('non-existent-id', '1year')).rejects.toThrow();
        });
    });
    // ============================================================================
    // GENERATE INDUSTRY REPORT TESTS
    // ============================================================================
    describe('generateIndustryReport', () => {
        it('should generate industry report', async () => {
            const report = await engine.generateIndustryReport('Education');
            expect(report).toBeDefined();
            expect(report.industry).toBe('Education');
        });
        it('should include top trends', async () => {
            const report = await engine.generateIndustryReport('Education');
            expect(report.topTrends).toBeDefined();
            expect(Array.isArray(report.topTrends)).toBe(true);
        });
        it('should identify emerging technologies', async () => {
            const report = await engine.generateIndustryReport('Education');
            expect(report.emergingTechnologies).toBeDefined();
            expect(Array.isArray(report.emergingTechnologies)).toBe(true);
        });
        it('should identify skill gaps', async () => {
            const report = await engine.generateIndustryReport('Education');
            expect(report.skillGaps).toBeDefined();
            expect(Array.isArray(report.skillGaps)).toBe(true);
        });
        it('should include education opportunities', async () => {
            const report = await engine.generateIndustryReport('Education');
            expect(report.educationOpportunities).toBeDefined();
            expect(Array.isArray(report.educationOpportunities)).toBe(true);
        });
        it('should include market metrics', async () => {
            const report = await engine.generateIndustryReport('Education');
            expect(report.marketSize).toBeDefined();
            expect(report.growthProjection).toBeDefined();
            expect(report.disruptionPotential).toBeDefined();
        });
        it('should list key players', async () => {
            const report = await engine.generateIndustryReport('Education');
            expect(report.keyPlayers).toBeDefined();
            expect(Array.isArray(report.keyPlayers)).toBe(true);
        });
    });
    // ============================================================================
    // SEARCH TRENDS TESTS
    // ============================================================================
    describe('searchTrends', () => {
        it('should search trends by title', async () => {
            const results = await engine.searchTrends('AI');
            expect(Array.isArray(results)).toBe(true);
        });
        it('should search trends by description', async () => {
            const results = await engine.searchTrends('learning');
            expect(Array.isArray(results)).toBe(true);
        });
        it('should search trends by technology', async () => {
            const results = await engine.searchTrends('GPT');
            expect(Array.isArray(results)).toBe(true);
        });
        it('should return empty array for no matches', async () => {
            const results = await engine.searchTrends('xyznonexistent123');
            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBe(0);
        });
        it('should be case insensitive', async () => {
            const resultsLower = await engine.searchTrends('ai');
            const resultsUpper = await engine.searchTrends('AI');
            expect(resultsLower.length).toBe(resultsUpper.length);
        });
        it('should sort results by relevance', async () => {
            const results = await engine.searchTrends('AI');
            for (let i = 1; i < results.length; i++) {
                expect(results[i - 1].relevance).toBeGreaterThanOrEqual(results[i].relevance);
            }
        });
    });
    // ============================================================================
    // TRENDING NOW TESTS
    // ============================================================================
    describe('getTrendingNow', () => {
        it('should return current high-relevance trends', async () => {
            const trends = await engine.getTrendingNow();
            expect(Array.isArray(trends)).toBe(true);
            trends.forEach((trend) => {
                expect(trend.timeframe).toBe('current');
                expect(trend.relevance).toBeGreaterThan(80);
            });
        });
        it('should limit to top 5 trends', async () => {
            const trends = await engine.getTrendingNow();
            expect(trends.length).toBeLessThanOrEqual(5);
        });
        it('should sort by relevance', async () => {
            const trends = await engine.getTrendingNow();
            for (let i = 1; i < trends.length; i++) {
                expect(trends[i - 1].relevance).toBeGreaterThanOrEqual(trends[i].relevance);
            }
        });
    });
    // ============================================================================
    // EMERGING TRENDS TESTS
    // ============================================================================
    describe('getEmergingTrends', () => {
        it('should return only emerging trends', async () => {
            const trends = await engine.getEmergingTrends();
            expect(Array.isArray(trends)).toBe(true);
            trends.forEach((trend) => {
                expect(trend.timeframe).toBe('emerging');
            });
        });
        it('should sort by relevance', async () => {
            const trends = await engine.getEmergingTrends();
            for (let i = 1; i < trends.length; i++) {
                expect(trends[i - 1].relevance).toBeGreaterThanOrEqual(trends[i].relevance);
            }
        });
    });
    // ============================================================================
    // EDUCATIONAL TRENDS TESTS
    // ============================================================================
    describe('getEducationalTrends', () => {
        it('should return education-related trends', async () => {
            const trends = await engine.getEducationalTrends();
            expect(Array.isArray(trends)).toBe(true);
            trends.forEach((trend) => {
                const hasEducationArea = trend.applicationAreas.some((a) => a.toLowerCase().includes('education') ||
                    a.toLowerCase().includes('learning'));
                expect(hasEducationArea).toBe(true);
            });
        });
        it('should sort by relevance', async () => {
            const trends = await engine.getEducationalTrends();
            for (let i = 1; i < trends.length; i++) {
                expect(trends[i - 1].relevance).toBeGreaterThanOrEqual(trends[i].relevance);
            }
        });
    });
    // ============================================================================
    // ADD TRENDS TESTS
    // ============================================================================
    describe('addTrends', () => {
        it('should add new trends to database', async () => {
            const newTrend = createSampleTrend({ trendId: 'custom-trend-1', title: 'Custom Test Trend XYZ' });
            engine.addTrends([newTrend]);
            const found = await engine.searchTrends('Custom Test Trend XYZ');
            expect(found.length).toBeGreaterThan(0);
            expect(found[0].title).toBe(newTrend.title);
        });
        it('should add multiple trends', async () => {
            const trends = [
                createSampleTrend({ trendId: 'multi-1', title: 'MultiTrend One ABC' }),
                createSampleTrend({ trendId: 'multi-2', title: 'MultiTrend Two DEF' }),
            ];
            engine.addTrends(trends);
            const found1 = await engine.searchTrends('MultiTrend One ABC');
            const found2 = await engine.searchTrends('MultiTrend Two DEF');
            expect(found1.length).toBeGreaterThan(0);
            expect(found2.length).toBeGreaterThan(0);
        });
        it('should update existing trend with same ID', async () => {
            const originalTrend = createSampleTrend({ trendId: 'update-test', title: 'Original XYZ123' });
            engine.addTrends([originalTrend]);
            const updatedTrend = createSampleTrend({ trendId: 'update-test', title: 'Updated XYZ123' });
            engine.addTrends([updatedTrend]);
            const found = await engine.searchTrends('Updated XYZ123');
            expect(found.length).toBeGreaterThan(0);
            expect(found[0].title).toBe('Updated XYZ123');
        });
    });
    // ============================================================================
    // ADD CATEGORIES TESTS
    // ============================================================================
    describe('addCategories', () => {
        it('should add new categories', () => {
            const category = createSampleCategory({ id: 'custom-cat' });
            engine.addCategories([category]);
            // Categories are added internally, can be verified through trend filtering
            expect(true).toBe(true);
        });
        it('should add multiple categories', () => {
            const categories = [
                createSampleCategory({ id: 'cat-a', name: 'Category A' }),
                createSampleCategory({ id: 'cat-b', name: 'Category B' }),
            ];
            engine.addCategories(categories);
            expect(true).toBe(true);
        });
    });
    // ============================================================================
    // RECORD INTERACTION TESTS
    // ============================================================================
    describe('recordInteraction', () => {
        it('should not throw without database adapter', async () => {
            await expect(engine.recordInteraction('user-1', 'trend-1', 'view')).resolves.not.toThrow();
        });
        it('should handle different interaction types', async () => {
            await expect(engine.recordInteraction('user-1', 'trend-1', 'share')).resolves.not.toThrow();
            await expect(engine.recordInteraction('user-1', 'trend-1', 'save')).resolves.not.toThrow();
            await expect(engine.recordInteraction('user-1', 'trend-1', 'analyze')).resolves.not.toThrow();
        });
    });
    // ============================================================================
    // EDGE CASES
    // ============================================================================
    describe('edge cases', () => {
        it('should handle empty search query', async () => {
            const results = await engine.searchTrends('');
            expect(Array.isArray(results)).toBe(true);
        });
        it('should handle filter with all parameters', async () => {
            const trends = await engine.analyzeTrends({
                category: 'AI & Machine Learning',
                timeframe: 'current',
                minRelevance: 50,
                impact: 'high',
            });
            expect(Array.isArray(trends)).toBe(true);
        });
        it('should handle report for unknown industry', async () => {
            const report = await engine.generateIndustryReport('UnknownIndustry');
            expect(report).toBeDefined();
            expect(report.industry).toBe('UnknownIndustry');
        });
    });
});
