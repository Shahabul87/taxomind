/**
 * @sam-ai/educational - Financial Engine
 * Portable financial intelligence engine for LMS analytics
 */
import type { FinancialEngineConfig, FinancialAnalytics, DateRange, FinancialEngine as IFinancialEngine } from '../types';
export declare class FinancialEngine implements IFinancialEngine {
    private config;
    constructor(config: FinancialEngineConfig);
    /**
     * Analyze financials for an organization
     */
    analyzeFinancials(organizationId: string, dateRange: DateRange): Promise<FinancialAnalytics>;
    private analyzeRevenue;
    private categorizeRevenueSources;
    private calculateRevenueGrowth;
    private analyzeCosts;
    private analyzeProfitability;
    private analyzeCourseProfitability;
    private calculateBreakEvenPoint;
    private analyzePricing;
    private getCurrentPricingStrategy;
    private calculateOptimalPricing;
    private analyzeCompetitorPricing;
    private getPricingExperiments;
    private generatePricingRecommendations;
    private analyzeSubscriptions;
    private generateForecasts;
    private createForecast;
    private createScenarioAnalysis;
    private calculateForecastConfidence;
    private calculateGrowthVolatility;
    private generateRecommendations;
}
/**
 * Factory function to create a FinancialEngine instance
 */
export declare function createFinancialEngine(config: FinancialEngineConfig): FinancialEngine;
//# sourceMappingURL=financial-engine.d.ts.map