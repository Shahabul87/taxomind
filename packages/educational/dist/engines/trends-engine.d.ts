/**
 * @sam-ai/educational - Trends Engine
 *
 * Portable AI trends analysis engine for tracking technology and education trends.
 * Provides comprehensive trend analysis, prediction, and industry reporting.
 */
import type { TrendsEngineConfig, TrendAnalysis, TrendCategory, TrendMarketSignal, TrendComparison, TrendPrediction, IndustryTrendReport, TrendFilter, TrendsEngine as ITrendsEngine } from '../types';
/**
 * TrendsEngine - AI-powered technology and education trends analysis
 *
 * Features:
 * - Trend analysis with filtering
 * - Market signal detection
 * - Trend comparison
 * - Trajectory prediction
 * - Industry report generation
 * - Educational trend tracking
 */
export declare class TrendsEngine implements ITrendsEngine {
    private config;
    private trendDatabase;
    private categoryMetrics;
    private database?;
    constructor(config: TrendsEngineConfig);
    private initializeTrendData;
    private initializeCategories;
    analyzeTrends(filter?: TrendFilter): Promise<TrendAnalysis[]>;
    getTrendCategories(): Promise<TrendCategory[]>;
    detectMarketSignals(trendId: string): Promise<TrendMarketSignal[]>;
    compareTrends(trendId1: string, trendId2: string): Promise<TrendComparison>;
    private generateCompetitiveAnalysis;
    predictTrendTrajectory(trendId: string, horizon: '3months' | '6months' | '1year' | '2years'): Promise<TrendPrediction>;
    private identifyRiskFactors;
    private identifyOpportunities;
    private generateRecommendations;
    generateIndustryReport(industry: string): Promise<IndustryTrendReport>;
    searchTrends(query: string): Promise<TrendAnalysis[]>;
    getTrendingNow(): Promise<TrendAnalysis[]>;
    getEmergingTrends(): Promise<TrendAnalysis[]>;
    getEducationalTrends(): Promise<TrendAnalysis[]>;
    recordInteraction(userId: string, trendId: string, interactionType: 'view' | 'share' | 'save' | 'analyze'): Promise<void>;
    /**
     * Add trends to the database (for extension)
     */
    addTrends(trends: TrendAnalysis[]): void;
    /**
     * Add categories (for extension)
     */
    addCategories(categories: TrendCategory[]): void;
}
/**
 * Factory function to create a TrendsEngine instance
 */
export declare function createTrendsEngine(config: TrendsEngineConfig): TrendsEngine;
//# sourceMappingURL=trends-engine.d.ts.map