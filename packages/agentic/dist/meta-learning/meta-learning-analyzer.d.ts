/**
 * @sam-ai/agentic - Meta-Learning Analyzer
 *
 * Analyzes learning patterns, generates insights, and optimizes teaching strategies.
 * Provides meta-level analysis of the AI tutoring system&apos;s effectiveness.
 *
 * Features:
 * - Pattern recognition across learning events
 * - Strategy effectiveness analysis
 * - Insight generation for system optimization
 * - Trend analysis and forecasting
 */
import type { LearningPattern, PatternCategory, MetaLearningInsight, InsightType, InsightPriority, LearningStrategy, MetaLearningAnalytics, AnalyticsPeriod, LearningEvent, LearningPatternStore, MetaLearningInsightStore, LearningStrategyStore, LearningEventStore, MetaLearningLogger } from './types';
export interface MetaLearningAnalyzerConfig {
    /** Minimum events needed for pattern detection */
    minEventsForPattern?: number;
    /** Confidence threshold for pattern recognition */
    patternConfidenceThreshold?: number;
    /** Minimum sample size for statistical significance */
    minSampleSize?: number;
    /** Logger */
    logger?: MetaLearningLogger;
    /** Stores */
    patternStore?: LearningPatternStore;
    insightStore?: MetaLearningInsightStore;
    strategyStore?: LearningStrategyStore;
    eventStore?: LearningEventStore;
}
export declare class InMemoryLearningPatternStore implements LearningPatternStore {
    private patterns;
    private idCounter;
    get(id: string): Promise<LearningPattern | null>;
    getByCategory(category: PatternCategory): Promise<LearningPattern[]>;
    getHighConfidence(minConfidence?: number): Promise<LearningPattern[]>;
    create(pattern: Omit<LearningPattern, 'id'>): Promise<LearningPattern>;
    update(id: string, updates: Partial<LearningPattern>): Promise<LearningPattern>;
    getRecent(limit?: number): Promise<LearningPattern[]>;
}
export declare class InMemoryMetaLearningInsightStore implements MetaLearningInsightStore {
    private insights;
    private processed;
    private idCounter;
    get(id: string): Promise<MetaLearningInsight | null>;
    getByType(type: InsightType): Promise<MetaLearningInsight[]>;
    getByPriority(priority: InsightPriority): Promise<MetaLearningInsight[]>;
    getActive(): Promise<MetaLearningInsight[]>;
    create(insight: Omit<MetaLearningInsight, 'id'>): Promise<MetaLearningInsight>;
    markProcessed(id: string): Promise<void>;
}
export declare class InMemoryLearningStrategyStore implements LearningStrategyStore {
    private strategies;
    private usageHistory;
    private idCounter;
    get(id: string): Promise<LearningStrategy | null>;
    getAll(): Promise<LearningStrategy[]>;
    getTopPerforming(limit?: number): Promise<LearningStrategy[]>;
    create(strategy: Omit<LearningStrategy, 'id'>): Promise<LearningStrategy>;
    update(id: string, updates: Partial<LearningStrategy>): Promise<LearningStrategy>;
    recordUsage(id: string, outcome: number): Promise<void>;
}
export declare class InMemoryLearningEventStore implements LearningEventStore {
    private events;
    private idCounter;
    get(id: string): Promise<LearningEvent | null>;
    getByUser(userId: string, since?: Date): Promise<LearningEvent[]>;
    getBySession(sessionId: string): Promise<LearningEvent[]>;
    create(event: Omit<LearningEvent, 'id'>): Promise<LearningEvent>;
    getStats(userId?: string, period?: AnalyticsPeriod): Promise<{
        totalEvents: number;
        eventsByType: Record<string, number>;
        avgDuration: number;
        successRate: number;
        avgQuality: number;
    }>;
    private getPeriodStart;
}
export declare class MetaLearningAnalyzer {
    private readonly config;
    private readonly logger?;
    private readonly patternStore;
    private readonly insightStore;
    private readonly strategyStore;
    private readonly eventStore;
    constructor(config?: MetaLearningAnalyzerConfig);
    /**
     * Record a learning event
     */
    recordEvent(event: Omit<LearningEvent, 'id'>): Promise<LearningEvent>;
    /**
     * Analyze events and detect patterns
     */
    detectPatterns(userId?: string, since?: Date): Promise<LearningPattern[]>;
    /**
     * Generate insights from patterns and analytics
     */
    generateInsights(userId?: string): Promise<MetaLearningInsight[]>;
    /**
     * Get comprehensive analytics
     */
    getAnalytics(userId?: string, period?: AnalyticsPeriod): Promise<MetaLearningAnalytics>;
    /**
     * Get active insights
     */
    getActiveInsights(type?: InsightType, priority?: InsightPriority, limit?: number): Promise<MetaLearningInsight[]>;
    /**
     * Register a new strategy
     */
    registerStrategy(strategy: Omit<LearningStrategy, 'id'>): Promise<LearningStrategy>;
    /**
     * Record strategy usage and outcome
     */
    recordStrategyUsage(strategyId: string, outcome: number): Promise<void>;
    private getAllEvents;
    private analyzeStrategyPatterns;
    private analyzeOutcomePatterns;
    private analyzeEngagementPatterns;
    private generateOptimizationInsights;
    private generateWarningInsights;
    private generateTrendInsights;
    private calculateOverallEffectiveness;
    private calculateImprovementFromBaseline;
    private generateStrategyRankings;
    private calculateTrend;
    private getPeriodStart;
    private calculateConfidence;
    private getConfidenceLevel;
    private calculateSignificance;
    private extractContexts;
    private calculateConsistency;
}
/**
 * Create a meta-learning analyzer
 */
export declare function createMetaLearningAnalyzer(config?: MetaLearningAnalyzerConfig): MetaLearningAnalyzer;
//# sourceMappingURL=meta-learning-analyzer.d.ts.map