/**
 * @sam-ai/educational - Analytics Engine
 *
 * Comprehensive analytics engine for tracking learning metrics, content insights,
 * behavior patterns, and personalized insights.
 */
import type { AnalyticsEngineConfig, ComprehensiveAnalytics, AnalyticsOptions, AnalyticsSessionData, AnalyticsEngine as IAnalyticsEngine } from '../types';
export declare class AnalyticsEngine implements IAnalyticsEngine {
    private config;
    private database?;
    constructor(config: AnalyticsEngineConfig);
    /**
     * Get comprehensive analytics for a user
     */
    getComprehensiveAnalytics(userId: string, options?: AnalyticsOptions): Promise<ComprehensiveAnalytics>;
    /**
     * Record an analytics session
     */
    recordAnalyticsSession(userId: string, sessionData: AnalyticsSessionData): Promise<void>;
    private getDefaultAnalytics;
    private calculateLearningMetrics;
    private calculateContentInsights;
    private analyzeBehaviorPatterns;
    private generatePersonalizedInsights;
    private calculateTrends;
    private calculateContentQuality;
    private calculateEngagementScore;
    private calculateRecencyScore;
    private calculateFrequencyScore;
    private calculateDiversityScore;
    private mapInteractionToFeature;
    private extractMilestones;
    private predictNextMilestone;
    private estimateTimeToNextLevel;
}
/**
 * Factory function to create an AnalyticsEngine instance
 */
export declare function createAnalyticsEngine(config: AnalyticsEngineConfig): AnalyticsEngine;
//# sourceMappingURL=analytics-engine.d.ts.map