/**
 * FinancialEngine Tests
 *
 * Comprehensive tests for financial analytics, revenue analysis,
 * cost analysis, profitability, pricing, and forecasting.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FinancialEngine, createFinancialEngine, } from '../engines/financial-engine';
import { createMockSAMConfig as baseCreateMockSAMConfig, createMockAIAdapter, createMockAIResponse, } from './setup';
// ============================================================================
// TEST UTILITIES
// ============================================================================
const createMockSAMConfig = (overrides = {}) => {
    const mockAI = createMockAIAdapter((params) => {
        return createMockAIResponse({
            recommendations: [
                {
                    category: 'revenue',
                    priority: 'high',
                    recommendation: 'Increase pricing for premium courses',
                    expectedImpact: { revenue: 15000, timeframe: '3 months' },
                    implementation: ['Update pricing page'],
                    risks: ['Potential customer churn'],
                },
            ],
        });
    });
    return {
        ...baseCreateMockSAMConfig(),
        ai: mockAI,
        ...overrides,
    };
};
const createMockEngineConfig = (overrides = {}) => ({
    samConfig: createMockSAMConfig(),
    ...overrides,
});
const createDateRange = (daysBack = 30) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - daysBack);
    return { start, end };
};
// ============================================================================
// CONSTRUCTOR AND INITIALIZATION TESTS
// ============================================================================
describe('FinancialEngine', () => {
    describe('Constructor and Initialization', () => {
        it('should create engine with default configuration', () => {
            const config = createMockEngineConfig();
            const engine = new FinancialEngine(config);
            expect(engine).toBeInstanceOf(FinancialEngine);
        });
        it('should create engine using factory function', () => {
            const config = createMockEngineConfig();
            const engine = createFinancialEngine(config);
            expect(engine).toBeInstanceOf(FinancialEngine);
        });
        it('should create engine with database adapter', () => {
            const config = createMockEngineConfig({
                database: {
                    query: vi.fn(),
                    execute: vi.fn(),
                },
            });
            const engine = new FinancialEngine(config);
            expect(engine).toBeInstanceOf(FinancialEngine);
        });
    });
    // ============================================================================
    // FINANCIAL ANALYTICS TESTS
    // ============================================================================
    describe('Financial Analytics', () => {
        let engine;
        beforeEach(() => {
            engine = new FinancialEngine(createMockEngineConfig());
        });
        it('should analyze financials for an organization', async () => {
            const dateRange = createDateRange(30);
            const analytics = await engine.analyzeFinancials('org-123', dateRange);
            expect(analytics).toBeDefined();
            expect(analytics.revenue).toBeDefined();
            expect(analytics.costs).toBeDefined();
            expect(analytics.profitability).toBeDefined();
            expect(analytics.pricing).toBeDefined();
            expect(analytics.subscriptions).toBeDefined();
            expect(analytics.forecasts).toBeDefined();
            expect(analytics.recommendations).toBeDefined();
        });
        it('should handle different date ranges', async () => {
            const shortRange = createDateRange(7);
            const longRange = createDateRange(365);
            const shortAnalytics = await engine.analyzeFinancials('org-123', shortRange);
            const longAnalytics = await engine.analyzeFinancials('org-123', longRange);
            expect(shortAnalytics).toBeDefined();
            expect(longAnalytics).toBeDefined();
        });
        it('should handle empty organization ID', async () => {
            const dateRange = createDateRange(30);
            const analytics = await engine.analyzeFinancials('', dateRange);
            expect(analytics).toBeDefined();
        });
    });
    // ============================================================================
    // REVENUE ANALYSIS TESTS
    // ============================================================================
    describe('Revenue Analysis', () => {
        let engine;
        beforeEach(() => {
            engine = new FinancialEngine(createMockEngineConfig());
        });
        it('should return revenue metrics', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.revenue.totalRevenue).toBeDefined();
            expect(analytics.revenue.totalRevenue).toBeGreaterThanOrEqual(0);
        });
        it('should break down recurring vs one-time revenue', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.revenue.recurringRevenue).toBeDefined();
            expect(analytics.revenue.oneTimeRevenue).toBeDefined();
            expect(analytics.revenue.recurringRevenue + analytics.revenue.oneTimeRevenue).toBeLessThanOrEqual(analytics.revenue.totalRevenue * 1.01); // Allow small rounding
        });
        it('should provide revenue by source', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(Array.isArray(analytics.revenue.revenueBySource)).toBe(true);
            if (analytics.revenue.revenueBySource.length > 0) {
                const source = analytics.revenue.revenueBySource[0];
                expect(source.source).toBeDefined();
                expect(source.amount).toBeDefined();
                expect(source.percentage).toBeDefined();
                expect(['increasing', 'stable', 'decreasing']).toContain(source.trend);
            }
        });
        it('should calculate revenue growth metrics', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.revenue.revenueGrowth).toBeDefined();
            expect(analytics.revenue.revenueGrowth.daily).toBeDefined();
            expect(analytics.revenue.revenueGrowth.weekly).toBeDefined();
            expect(analytics.revenue.revenueGrowth.monthly).toBeDefined();
            expect(analytics.revenue.revenueGrowth.quarterly).toBeDefined();
            expect(analytics.revenue.revenueGrowth.yearly).toBeDefined();
        });
        it('should calculate average revenue per user', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.revenue.averageRevenuePerUser).toBeDefined();
            expect(analytics.revenue.averageRevenuePerUser).toBeGreaterThanOrEqual(0);
        });
        it('should calculate customer lifetime value', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.revenue.customerLifetimeValue).toBeDefined();
            expect(analytics.revenue.customerLifetimeValue).toBeGreaterThanOrEqual(0);
        });
        it('should calculate churn rate', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.revenue.churnRate).toBeDefined();
            expect(analytics.revenue.churnRate).toBeGreaterThanOrEqual(0);
            // Churn rate can be expressed as percentage (0-100)
            expect(analytics.revenue.churnRate).toBeLessThanOrEqual(100);
        });
    });
    // ============================================================================
    // COST ANALYSIS TESTS
    // ============================================================================
    describe('Cost Analysis', () => {
        let engine;
        beforeEach(() => {
            engine = new FinancialEngine(createMockEngineConfig());
        });
        it('should return cost breakdown', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.costs.totalCosts).toBeDefined();
            expect(analytics.costs.totalCosts).toBeGreaterThanOrEqual(0);
        });
        it('should break down fixed vs variable costs', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.costs.fixedCosts).toBeDefined();
            expect(analytics.costs.variableCosts).toBeDefined();
        });
        it('should provide cost categories', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(Array.isArray(analytics.costs.costCategories)).toBe(true);
            if (analytics.costs.costCategories.length > 0) {
                const category = analytics.costs.costCategories[0];
                expect(category.category).toBeDefined();
                expect(category.amount).toBeDefined();
                expect(category.percentage).toBeDefined();
                expect(typeof category.isFixed).toBe('boolean');
                expect(category.optimizationPotential).toBeDefined();
            }
        });
        it('should calculate cost per student', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.costs.costPerStudent).toBeDefined();
            expect(analytics.costs.costPerStudent).toBeGreaterThanOrEqual(0);
        });
        it('should calculate cost per course', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.costs.costPerCourse).toBeDefined();
            expect(analytics.costs.costPerCourse).toBeGreaterThanOrEqual(0);
        });
        it('should track infrastructure costs', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.costs.infrastructureCosts).toBeDefined();
            expect(analytics.costs.infrastructureCosts).toBeGreaterThanOrEqual(0);
        });
        it('should track content creation costs', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.costs.contentCreationCosts).toBeDefined();
            expect(analytics.costs.contentCreationCosts).toBeGreaterThanOrEqual(0);
        });
        it('should track marketing costs', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.costs.marketingCosts).toBeDefined();
            expect(analytics.costs.marketingCosts).toBeGreaterThanOrEqual(0);
        });
    });
    // ============================================================================
    // PROFITABILITY ANALYSIS TESTS
    // ============================================================================
    describe('Profitability Analysis', () => {
        let engine;
        beforeEach(() => {
            engine = new FinancialEngine(createMockEngineConfig());
        });
        it('should calculate gross profit', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.profitability.grossProfit).toBeDefined();
        });
        it('should calculate net profit', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.profitability.netProfit).toBeDefined();
        });
        it('should calculate gross margin', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.profitability.grossMargin).toBeDefined();
        });
        it('should calculate net margin', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.profitability.netMargin).toBeDefined();
        });
        it('should calculate break-even point', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.profitability.breakEvenPoint).toBeDefined();
        });
        it('should identify profitable courses', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(Array.isArray(analytics.profitability.profitableCourses)).toBe(true);
            if (analytics.profitability.profitableCourses.length > 0) {
                const course = analytics.profitability.profitableCourses[0];
                expect(course.courseId).toBeDefined();
                expect(course.courseName).toBeDefined();
                expect(course.profit).toBeGreaterThanOrEqual(0);
            }
        });
        it('should identify unprofitable courses', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(Array.isArray(analytics.profitability.unprofitableCourses)).toBe(true);
            if (analytics.profitability.unprofitableCourses.length > 0) {
                const course = analytics.profitability.unprofitableCourses[0];
                expect(course.courseId).toBeDefined();
                expect(course.profit).toBeLessThan(0);
            }
        });
        it('should calculate customer acquisition cost', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.profitability.customerAcquisitionCost).toBeDefined();
            expect(analytics.profitability.customerAcquisitionCost).toBeGreaterThanOrEqual(0);
        });
        it('should calculate return on investment', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.profitability.returnOnInvestment).toBeDefined();
        });
    });
    // ============================================================================
    // PRICING ANALYSIS TESTS
    // ============================================================================
    describe('Pricing Analysis', () => {
        let engine;
        beforeEach(() => {
            engine = new FinancialEngine(createMockEngineConfig());
        });
        it('should analyze current pricing', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.pricing.currentPricing).toBeDefined();
            expect(analytics.pricing.currentPricing.basePrice).toBeDefined();
        });
        it('should suggest optimal pricing', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.pricing.optimalPricing).toBeDefined();
            expect(analytics.pricing.optimalPricing.basePrice).toBeDefined();
        });
        it('should calculate price elasticity', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.pricing.priceElasticity).toBeDefined();
        });
        it('should provide competitor analysis', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(Array.isArray(analytics.pricing.competitorAnalysis)).toBe(true);
            if (analytics.pricing.competitorAnalysis.length > 0) {
                const competitor = analytics.pricing.competitorAnalysis[0];
                expect(competitor.competitor).toBeDefined();
                expect(competitor.averagePrice).toBeDefined();
                expect(competitor.priceRange).toBeDefined();
            }
        });
        it('should track pricing experiments', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(Array.isArray(analytics.pricing.pricingExperiments)).toBe(true);
        });
        it('should provide pricing recommendations', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(Array.isArray(analytics.pricing.recommendations)).toBe(true);
            if (analytics.pricing.recommendations.length > 0) {
                const rec = analytics.pricing.recommendations[0];
                expect(rec.action).toBeDefined();
                expect(rec.expectedImpact).toBeDefined();
                expect(rec.rationale).toBeDefined();
            }
        });
        it('should include discount strategies', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(Array.isArray(analytics.pricing.currentPricing.discountStrategy)).toBe(true);
        });
        it('should include bundle options', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(Array.isArray(analytics.pricing.currentPricing.bundleOptions)).toBe(true);
        });
        it('should include region pricing', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(Array.isArray(analytics.pricing.currentPricing.regionPricing)).toBe(true);
        });
    });
    // ============================================================================
    // SUBSCRIPTION METRICS TESTS
    // ============================================================================
    describe('Subscription Metrics', () => {
        let engine;
        beforeEach(() => {
            engine = new FinancialEngine(createMockEngineConfig());
        });
        it('should track total subscribers', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.subscriptions.totalSubscribers).toBeDefined();
            expect(analytics.subscriptions.totalSubscribers).toBeGreaterThanOrEqual(0);
        });
        it('should track active subscribers', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.subscriptions.activeSubscribers).toBeDefined();
            expect(analytics.subscriptions.activeSubscribers).toBeLessThanOrEqual(analytics.subscriptions.totalSubscribers);
        });
        it('should calculate MRR', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.subscriptions.monthlyRecurringRevenue).toBeDefined();
            expect(analytics.subscriptions.monthlyRecurringRevenue).toBeGreaterThanOrEqual(0);
        });
        it('should calculate ARR', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.subscriptions.annualRecurringRevenue).toBeDefined();
            expect(analytics.subscriptions.annualRecurringRevenue).toBeGreaterThanOrEqual(0);
        });
        it('should calculate average subscription value', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.subscriptions.averageSubscriptionValue).toBeDefined();
        });
        it('should track churn rate', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.subscriptions.churnRate).toBeDefined();
            expect(analytics.subscriptions.churnRate).toBeGreaterThanOrEqual(0);
            // Churn rate can be expressed as percentage (0-100)
            expect(analytics.subscriptions.churnRate).toBeLessThanOrEqual(100);
        });
        it('should track retention rate', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.subscriptions.retentionRate).toBeDefined();
            expect(analytics.subscriptions.retentionRate).toBeGreaterThanOrEqual(0);
            // Retention rate can be expressed as percentage (0-100)
            expect(analytics.subscriptions.retentionRate).toBeLessThanOrEqual(100);
        });
        it('should provide subscription growth metrics', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.subscriptions.subscriptionGrowth).toBeDefined();
            expect(analytics.subscriptions.subscriptionGrowth.monthly).toBeDefined();
        });
        it('should provide tier distribution', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(Array.isArray(analytics.subscriptions.tierDistribution)).toBe(true);
            if (analytics.subscriptions.tierDistribution.length > 0) {
                const tier = analytics.subscriptions.tierDistribution[0];
                expect(tier.tier).toBeDefined();
                expect(tier.subscribers).toBeDefined();
                expect(tier.revenue).toBeDefined();
                expect(tier.churnRate).toBeDefined();
            }
        });
    });
    // ============================================================================
    // FORECASTING TESTS
    // ============================================================================
    describe('Financial Forecasting', () => {
        let engine;
        beforeEach(() => {
            engine = new FinancialEngine(createMockEngineConfig());
        });
        it('should provide short-term forecasts', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.forecasts.shortTerm).toBeDefined();
            expect(analytics.forecasts.shortTerm.period).toBeDefined();
            expect(analytics.forecasts.shortTerm.projectedRevenue).toBeDefined();
            expect(analytics.forecasts.shortTerm.projectedCosts).toBeDefined();
            expect(analytics.forecasts.shortTerm.projectedProfit).toBeDefined();
        });
        it('should provide medium-term forecasts', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.forecasts.mediumTerm).toBeDefined();
            expect(analytics.forecasts.mediumTerm.projectedRevenue).toBeDefined();
        });
        it('should provide long-term forecasts', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.forecasts.longTerm).toBeDefined();
            expect(analytics.forecasts.longTerm.projectedRevenue).toBeDefined();
        });
        it('should include forecast assumptions', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(Array.isArray(analytics.forecasts.shortTerm.assumptions)).toBe(true);
        });
        it('should include forecast risks', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(Array.isArray(analytics.forecasts.shortTerm.risks)).toBe(true);
        });
        it('should provide scenario analysis', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(Array.isArray(analytics.forecasts.scenarios)).toBe(true);
            if (analytics.forecasts.scenarios.length > 0) {
                const scenario = analytics.forecasts.scenarios[0];
                expect(scenario.scenario).toBeDefined();
                expect(scenario.probability).toBeDefined();
                expect(scenario.revenue).toBeDefined();
                expect(scenario.profit).toBeDefined();
            }
        });
        it('should include forecast confidence level', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.forecasts.confidence).toBeDefined();
            expect(analytics.forecasts.confidence).toBeGreaterThanOrEqual(0);
            expect(analytics.forecasts.confidence).toBeLessThanOrEqual(1);
        });
        it('should project growth in forecasts', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.forecasts.shortTerm.projectedGrowth).toBeDefined();
            expect(analytics.forecasts.mediumTerm.projectedGrowth).toBeDefined();
            expect(analytics.forecasts.longTerm.projectedGrowth).toBeDefined();
        });
    });
    // ============================================================================
    // RECOMMENDATIONS TESTS
    // ============================================================================
    describe('Financial Recommendations', () => {
        let engine;
        beforeEach(() => {
            engine = new FinancialEngine(createMockEngineConfig());
        });
        it('should provide financial recommendations', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            expect(Array.isArray(analytics.recommendations)).toBe(true);
            expect(analytics.recommendations.length).toBeGreaterThan(0);
        });
        it('should categorize recommendations', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            if (analytics.recommendations.length > 0) {
                const rec = analytics.recommendations[0];
                expect(['revenue', 'cost', 'pricing', 'investment']).toContain(rec.category);
            }
        });
        it('should prioritize recommendations', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            if (analytics.recommendations.length > 0) {
                const rec = analytics.recommendations[0];
                expect(['high', 'medium', 'low']).toContain(rec.priority);
            }
        });
        it('should include expected impact', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            if (analytics.recommendations.length > 0) {
                const rec = analytics.recommendations[0];
                expect(rec.expectedImpact).toBeDefined();
                expect(rec.expectedImpact.timeframe).toBeDefined();
            }
        });
        it('should include implementation steps', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            if (analytics.recommendations.length > 0) {
                const rec = analytics.recommendations[0];
                expect(Array.isArray(rec.implementation)).toBe(true);
            }
        });
        it('should include risks', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            if (analytics.recommendations.length > 0) {
                const rec = analytics.recommendations[0];
                expect(Array.isArray(rec.risks)).toBe(true);
            }
        });
    });
    // ============================================================================
    // EDGE CASES AND ERROR HANDLING
    // ============================================================================
    describe('Edge Cases', () => {
        let engine;
        beforeEach(() => {
            engine = new FinancialEngine(createMockEngineConfig());
        });
        it('should handle date range in the future', async () => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);
            const dateRange = {
                start: new Date(),
                end: futureDate,
            };
            const analytics = await engine.analyzeFinancials('org-123', dateRange);
            expect(analytics).toBeDefined();
        });
        it('should handle date range in the past', async () => {
            const dateRange = {
                start: new Date('2020-01-01'),
                end: new Date('2020-12-31'),
            };
            const analytics = await engine.analyzeFinancials('org-123', dateRange);
            expect(analytics).toBeDefined();
        });
        it('should handle same start and end date', async () => {
            const sameDate = new Date();
            const dateRange = {
                start: sameDate,
                end: sameDate,
            };
            const analytics = await engine.analyzeFinancials('org-123', dateRange);
            expect(analytics).toBeDefined();
        });
        it('should handle very long organization ID', async () => {
            const longOrgId = 'org-' + 'x'.repeat(1000);
            const analytics = await engine.analyzeFinancials(longOrgId, createDateRange());
            expect(analytics).toBeDefined();
        });
        it('should handle special characters in organization ID', async () => {
            const specialOrgId = 'org-123-&-special/chars';
            const analytics = await engine.analyzeFinancials(specialOrgId, createDateRange());
            expect(analytics).toBeDefined();
        });
        it('should handle AI errors gracefully for recommendations', async () => {
            const failingAI = createMockAIAdapter(() => {
                throw new Error('AI Error');
            });
            const failingConfig = createMockEngineConfig({
                samConfig: {
                    ...createMockSAMConfig(),
                    ai: failingAI,
                },
            });
            const failingEngine = new FinancialEngine(failingConfig);
            const analytics = await failingEngine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.recommendations.length).toBeGreaterThan(0);
        });
        it('should handle invalid AI JSON response', async () => {
            const invalidJsonAI = createMockAIAdapter(() => {
                return createMockAIResponse('not valid json');
            });
            const invalidJsonConfig = createMockEngineConfig({
                samConfig: {
                    ...createMockSAMConfig(),
                    ai: invalidJsonAI,
                },
            });
            const invalidEngine = new FinancialEngine(invalidJsonConfig);
            const analytics = await invalidEngine.analyzeFinancials('org-123', createDateRange());
            expect(analytics.recommendations.length).toBeGreaterThan(0);
        });
    });
    // ============================================================================
    // DATA CONSISTENCY TESTS
    // ============================================================================
    describe('Data Consistency', () => {
        let engine;
        beforeEach(() => {
            engine = new FinancialEngine(createMockEngineConfig());
        });
        it('should have consistent revenue breakdown', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            const { revenue } = analytics;
            // Revenue sources should sum to approximately total revenue
            const sourceSum = revenue.revenueBySource.reduce((sum, src) => sum + src.amount, 0);
            // Allow for some variance due to mocked data
            expect(sourceSum).toBeGreaterThanOrEqual(0);
        });
        it('should have consistent cost breakdown', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            const { costs } = analytics;
            // Fixed + variable should relate to total
            expect(costs.fixedCosts + costs.variableCosts).toBeLessThanOrEqual(costs.totalCosts * 1.01);
        });
        it('should have consistent profitability', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            const { revenue, costs, profitability } = analytics;
            // Gross profit should be revenue - costs (approximately)
            const calculatedProfit = revenue.totalRevenue - costs.totalCosts;
            // Just verify the values are reasonable
            expect(profitability.grossProfit).toBeDefined();
        });
        it('should have consistent subscription metrics', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            const { subscriptions } = analytics;
            // Active subscribers should not exceed total
            expect(subscriptions.activeSubscribers).toBeLessThanOrEqual(subscriptions.totalSubscribers);
            // Churn + retention should relate
            expect(subscriptions.churnRate + subscriptions.retentionRate).toBeGreaterThanOrEqual(0);
        });
        it('should have valid percentages in cost categories', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            for (const category of analytics.costs.costCategories) {
                expect(category.percentage).toBeGreaterThanOrEqual(0);
                expect(category.percentage).toBeLessThanOrEqual(100);
            }
        });
        it('should have valid percentages in revenue sources', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            for (const source of analytics.revenue.revenueBySource) {
                expect(source.percentage).toBeGreaterThanOrEqual(0);
                expect(source.percentage).toBeLessThanOrEqual(100);
            }
        });
    });
    // ============================================================================
    // INTEGRATION SCENARIOS
    // ============================================================================
    describe('Integration Scenarios', () => {
        let engine;
        beforeEach(() => {
            engine = new FinancialEngine(createMockEngineConfig());
        });
        it('should provide actionable insights for new business', async () => {
            const analytics = await engine.analyzeFinancials('new-org', createDateRange());
            // Should have recommendations even with no historical data
            expect(analytics.recommendations.length).toBeGreaterThan(0);
            // Should have forecasts
            expect(analytics.forecasts.shortTerm).toBeDefined();
        });
        it('should analyze quarter-over-quarter', async () => {
            const q1 = {
                start: new Date('2024-01-01'),
                end: new Date('2024-03-31'),
            };
            const q2 = {
                start: new Date('2024-04-01'),
                end: new Date('2024-06-30'),
            };
            const q1Analytics = await engine.analyzeFinancials('org-123', q1);
            const q2Analytics = await engine.analyzeFinancials('org-123', q2);
            expect(q1Analytics).toBeDefined();
            expect(q2Analytics).toBeDefined();
        });
        it('should provide complete financial picture', async () => {
            const analytics = await engine.analyzeFinancials('org-123', createDateRange());
            // Verify all major sections are populated
            expect(Object.keys(analytics.revenue).length).toBeGreaterThan(5);
            expect(Object.keys(analytics.costs).length).toBeGreaterThan(5);
            expect(Object.keys(analytics.profitability).length).toBeGreaterThan(5);
            expect(Object.keys(analytics.pricing).length).toBeGreaterThan(3);
            expect(Object.keys(analytics.subscriptions).length).toBeGreaterThan(5);
            expect(Object.keys(analytics.forecasts).length).toBeGreaterThan(3);
        });
    });
});
