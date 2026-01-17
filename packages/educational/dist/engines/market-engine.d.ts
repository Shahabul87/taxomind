/**
 * Market Engine - Portable Version
 *
 * Market analysis for online courses:
 * - Market value assessment
 * - Pricing analysis and recommendations
 * - Competition analysis
 * - Branding and positioning
 * - Trend analysis
 */
import type { MarketEngineConfig, MarketAnalysisType, MarketAnalysisResponse, CompetitorAnalysis, MarketEngine as IMarketEngine } from '../types';
export declare class MarketEngine implements IMarketEngine {
    private config;
    private dbAdapter?;
    private cacheDurationHours;
    constructor(config?: MarketEngineConfig);
    analyzeCourse(courseId: string, analysisType?: MarketAnalysisType, includeRecommendations?: boolean): Promise<MarketAnalysisResponse>;
    private performAnalysis;
    private assessMarketValue;
    private calculateDemandScore;
    private calculateCompetitionScore;
    private calculateUniquenessScore;
    private calculateTimingScore;
    private analyzePricing;
    private generateValueProposition;
    private analyzeCompetition;
    private identifyCompetitors;
    private identifyMarketGaps;
    private identifyDifferentiators;
    private analyzeBranding;
    private calculateBrandingScore;
    private identifyBrandingStrengths;
    private identifyBrandingImprovements;
    private identifyTargetAudience;
    private analyzeTrends;
    private assessMarketGrowth;
    private calculateTopicRelevance;
    private generateFutureProjection;
    private identifyEmergingTopics;
    private generateRecommendations;
    private calculateAverageRating;
    private storeAnalysis;
    private determineMarketPosition;
    private parseStoredAnalysis;
    findCompetitors(courseId: string): Promise<CompetitorAnalysis[]>;
    analyzeCompetitor(courseId: string, competitorData: Partial<CompetitorAnalysis>): Promise<void>;
}
/**
 * Factory function to create a MarketEngine instance
 */
export declare function createMarketEngine(config?: MarketEngineConfig): MarketEngine;
//# sourceMappingURL=market-engine.d.ts.map