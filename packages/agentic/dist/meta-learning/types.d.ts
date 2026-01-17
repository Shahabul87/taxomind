/**
 * @sam-ai/agentic - Meta-Learning Types
 * Types for meta-learning analytics, pattern recognition, and system optimization
 */
import { z } from 'zod';
/**
 * Learning pattern categories
 */
export declare const PatternCategory: {
    readonly TEACHING_STRATEGY: "teaching_strategy";
    readonly STUDENT_BEHAVIOR: "student_behavior";
    readonly CONTENT_EFFECTIVENESS: "content_effectiveness";
    readonly ENGAGEMENT_PATTERN: "engagement_pattern";
    readonly ERROR_PATTERN: "error_pattern";
    readonly SUCCESS_PATTERN: "success_pattern";
    readonly INTERACTION_STYLE: "interaction_style";
};
export type PatternCategory = (typeof PatternCategory)[keyof typeof PatternCategory];
/**
 * Pattern confidence levels
 */
export declare const PatternConfidence: {
    readonly HIGH: "high";
    readonly MEDIUM: "medium";
    readonly LOW: "low";
    readonly EMERGING: "emerging";
};
export type PatternConfidence = (typeof PatternConfidence)[keyof typeof PatternConfidence];
/**
 * Identified learning pattern
 */
export interface LearningPattern {
    id: string;
    category: PatternCategory;
    name: string;
    description: string;
    confidence: PatternConfidence;
    confidenceScore: number;
    occurrenceCount: number;
    sampleSize: number;
    significanceLevel: number;
    contexts: PatternContext[];
    triggers: string[];
    outcomes: PatternOutcome[];
    successRate: number;
    avgImpact: number;
    consistency: number;
    firstObserved: Date;
    lastObserved: Date;
    trend: 'increasing' | 'stable' | 'decreasing';
}
/**
 * Pattern context - when/where pattern occurs
 */
export interface PatternContext {
    dimension: string;
    value: string;
    frequency: number;
    correlation: number;
}
/**
 * Pattern outcome - what happens when pattern is applied
 */
export interface PatternOutcome {
    metric: string;
    avgChange: number;
    stdDev: number;
    sampleCount: number;
}
/**
 * Insight types
 */
export declare const InsightType: {
    readonly OPTIMIZATION: "optimization";
    readonly WARNING: "warning";
    readonly RECOMMENDATION: "recommendation";
    readonly TREND: "trend";
    readonly ANOMALY: "anomaly";
    readonly CORRELATION: "correlation";
    readonly PREDICTION: "prediction";
};
export type InsightType = (typeof InsightType)[keyof typeof InsightType];
/**
 * Insight priority
 */
export declare const InsightPriority: {
    readonly CRITICAL: "critical";
    readonly HIGH: "high";
    readonly MEDIUM: "medium";
    readonly LOW: "low";
    readonly INFO: "info";
};
export type InsightPriority = (typeof InsightPriority)[keyof typeof InsightPriority];
/**
 * Meta-learning insight
 */
export interface MetaLearningInsight {
    id: string;
    type: InsightType;
    priority: InsightPriority;
    title: string;
    description: string;
    evidence: string[];
    recommendations: InsightRecommendation[];
    confidence: number;
    expectedImpact: number;
    affectedAreas: string[];
    timeframe: 'immediate' | 'short_term' | 'long_term';
    generatedAt: Date;
    validUntil?: Date;
}
/**
 * Recommendation from insight
 */
export interface InsightRecommendation {
    id: string;
    action: string;
    rationale: string;
    priority: number;
    effort: 'low' | 'medium' | 'high';
    expectedOutcome: string;
    metrics?: string[];
}
/**
 * Teaching/learning strategy
 */
export interface LearningStrategy {
    id: string;
    name: string;
    description: string;
    effectivenessScore: number;
    successRate: number;
    engagementImpact: number;
    bestFor: StrategyCondition[];
    notRecommendedFor: StrategyCondition[];
    usageCount: number;
    lastUsed: Date;
    trend: 'increasing' | 'stable' | 'decreasing';
    avgOutcome: number;
    stdDevOutcome: number;
}
/**
 * Condition for strategy applicability
 */
export interface StrategyCondition {
    dimension: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
    value: string | number | string[];
    weight: number;
}
/**
 * Time period for analytics
 */
export declare const AnalyticsPeriod: {
    readonly HOUR: "hour";
    readonly DAY: "day";
    readonly WEEK: "week";
    readonly MONTH: "month";
    readonly QUARTER: "quarter";
    readonly ALL_TIME: "all_time";
};
export type AnalyticsPeriod = (typeof AnalyticsPeriod)[keyof typeof AnalyticsPeriod];
/**
 * Meta-learning analytics summary
 */
export interface MetaLearningAnalytics {
    id: string;
    userId?: string;
    period: AnalyticsPeriod;
    periodStart: Date;
    periodEnd: Date;
    patternsIdentified: number;
    highConfidencePatterns: number;
    newPatterns: number;
    patternsByCategory: Record<PatternCategory, number>;
    strategiesEvaluated: number;
    topStrategies: StrategyRanking[];
    underperformingStrategies: StrategyRanking[];
    overallEffectiveness: number;
    improvementFromBaseline: number;
    calibrationAccuracy: number;
    insightsGenerated: number;
    criticalInsights: number;
    actionableRecommendations: number;
    effectivenessTrend: TrendData;
    engagementTrend: TrendData;
    errorRateTrend: TrendData;
    generatedAt: Date;
}
/**
 * Strategy ranking
 */
export interface StrategyRanking {
    strategyId: string;
    strategyName: string;
    score: number;
    usageCount: number;
    trend: 'up' | 'stable' | 'down';
}
/**
 * Trend data
 */
export interface TrendData {
    direction: 'improving' | 'stable' | 'declining';
    changeRate: number;
    dataPoints: TrendPoint[];
    forecast?: number;
    confidence: number;
}
/**
 * Single trend data point
 */
export interface TrendPoint {
    timestamp: Date;
    value: number;
}
/**
 * Learning event for tracking
 */
export interface LearningEvent {
    id: string;
    userId: string;
    sessionId: string;
    eventType: LearningEventType;
    timestamp: Date;
    courseId?: string;
    sectionId?: string;
    topic?: string;
    duration?: number;
    outcome?: 'success' | 'partial' | 'failure';
    confidence?: number;
    strategyId?: string;
    strategyApplied?: string;
    responseQuality?: number;
    studentSatisfaction?: number;
    metadata: Record<string, unknown>;
}
/**
 * Learning event types
 */
export declare const LearningEventType: {
    readonly QUESTION_ASKED: "question_asked";
    readonly EXPLANATION_PROVIDED: "explanation_provided";
    readonly HINT_GIVEN: "hint_given";
    readonly FEEDBACK_DELIVERED: "feedback_delivered";
    readonly ASSESSMENT_COMPLETED: "assessment_completed";
    readonly CONCEPT_INTRODUCED: "concept_introduced";
    readonly PRACTICE_SESSION: "practice_session";
    readonly REVIEW_SESSION: "review_session";
    readonly ERROR_CORRECTION: "error_correction";
    readonly STRATEGY_APPLIED: "strategy_applied";
};
export type LearningEventType = (typeof LearningEventType)[keyof typeof LearningEventType];
/**
 * Learning pattern store
 */
export interface LearningPatternStore {
    get(id: string): Promise<LearningPattern | null>;
    getByCategory(category: PatternCategory): Promise<LearningPattern[]>;
    getHighConfidence(minConfidence?: number): Promise<LearningPattern[]>;
    create(pattern: Omit<LearningPattern, 'id'>): Promise<LearningPattern>;
    update(id: string, updates: Partial<LearningPattern>): Promise<LearningPattern>;
    getRecent(limit?: number): Promise<LearningPattern[]>;
}
/**
 * Meta-learning insight store
 */
export interface MetaLearningInsightStore {
    get(id: string): Promise<MetaLearningInsight | null>;
    getByType(type: InsightType): Promise<MetaLearningInsight[]>;
    getByPriority(priority: InsightPriority): Promise<MetaLearningInsight[]>;
    getActive(): Promise<MetaLearningInsight[]>;
    create(insight: Omit<MetaLearningInsight, 'id'>): Promise<MetaLearningInsight>;
    markProcessed(id: string): Promise<void>;
}
/**
 * Learning strategy store
 */
export interface LearningStrategyStore {
    get(id: string): Promise<LearningStrategy | null>;
    getAll(): Promise<LearningStrategy[]>;
    getTopPerforming(limit?: number): Promise<LearningStrategy[]>;
    create(strategy: Omit<LearningStrategy, 'id'>): Promise<LearningStrategy>;
    update(id: string, updates: Partial<LearningStrategy>): Promise<LearningStrategy>;
    recordUsage(id: string, outcome: number): Promise<void>;
}
/**
 * Learning event store
 */
export interface LearningEventStore {
    get(id: string): Promise<LearningEvent | null>;
    getByUser(userId: string, since?: Date): Promise<LearningEvent[]>;
    getBySession(sessionId: string): Promise<LearningEvent[]>;
    create(event: Omit<LearningEvent, 'id'>): Promise<LearningEvent>;
    getStats(userId?: string, period?: AnalyticsPeriod): Promise<EventStats>;
}
/**
 * Event statistics
 */
export interface EventStats {
    totalEvents: number;
    eventsByType: Record<LearningEventType, number>;
    avgDuration: number;
    successRate: number;
    avgQuality: number;
}
export interface MetaLearningLogger {
    debug(message: string, meta?: Record<string, unknown>): void;
    info(message: string, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
    error(message: string, meta?: Record<string, unknown>): void;
}
export declare const LearningEventSchema: z.ZodObject<{
    userId: z.ZodString;
    sessionId: z.ZodString;
    eventType: z.ZodEnum<["question_asked", "explanation_provided", "hint_given", "feedback_delivered", "assessment_completed", "concept_introduced", "practice_session", "review_session", "error_correction", "strategy_applied"]>;
    courseId: z.ZodOptional<z.ZodString>;
    sectionId: z.ZodOptional<z.ZodString>;
    topic: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodNumber>;
    outcome: z.ZodOptional<z.ZodEnum<["success", "partial", "failure"]>>;
    confidence: z.ZodOptional<z.ZodNumber>;
    strategyId: z.ZodOptional<z.ZodString>;
    strategyApplied: z.ZodOptional<z.ZodString>;
    responseQuality: z.ZodOptional<z.ZodNumber>;
    studentSatisfaction: z.ZodOptional<z.ZodNumber>;
    metadata: z.ZodDefault<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    metadata: Record<string, unknown>;
    sessionId: string;
    eventType: "question_asked" | "explanation_provided" | "hint_given" | "feedback_delivered" | "assessment_completed" | "concept_introduced" | "practice_session" | "review_session" | "error_correction" | "strategy_applied";
    courseId?: string | undefined;
    sectionId?: string | undefined;
    confidence?: number | undefined;
    duration?: number | undefined;
    topic?: string | undefined;
    outcome?: "success" | "partial" | "failure" | undefined;
    strategyId?: string | undefined;
    strategyApplied?: string | undefined;
    responseQuality?: number | undefined;
    studentSatisfaction?: number | undefined;
}, {
    userId: string;
    sessionId: string;
    eventType: "question_asked" | "explanation_provided" | "hint_given" | "feedback_delivered" | "assessment_completed" | "concept_introduced" | "practice_session" | "review_session" | "error_correction" | "strategy_applied";
    courseId?: string | undefined;
    sectionId?: string | undefined;
    confidence?: number | undefined;
    metadata?: Record<string, unknown> | undefined;
    duration?: number | undefined;
    topic?: string | undefined;
    outcome?: "success" | "partial" | "failure" | undefined;
    strategyId?: string | undefined;
    strategyApplied?: string | undefined;
    responseQuality?: number | undefined;
    studentSatisfaction?: number | undefined;
}>;
export declare const GetInsightsSchema: z.ZodObject<{
    userId: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["optimization", "warning", "recommendation", "trend", "anomaly", "correlation", "prediction"]>>;
    priority: z.ZodOptional<z.ZodEnum<["critical", "high", "medium", "low", "info"]>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    activeOnly: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    activeOnly: boolean;
    type?: "warning" | "recommendation" | "optimization" | "trend" | "anomaly" | "correlation" | "prediction" | undefined;
    userId?: string | undefined;
    priority?: "low" | "medium" | "high" | "critical" | "info" | undefined;
}, {
    type?: "warning" | "recommendation" | "optimization" | "trend" | "anomaly" | "correlation" | "prediction" | undefined;
    userId?: string | undefined;
    priority?: "low" | "medium" | "high" | "critical" | "info" | undefined;
    limit?: number | undefined;
    activeOnly?: boolean | undefined;
}>;
export declare const GetAnalyticsSchema: z.ZodObject<{
    userId: z.ZodOptional<z.ZodString>;
    period: z.ZodDefault<z.ZodOptional<z.ZodEnum<["hour", "day", "week", "month", "quarter", "all_time"]>>>;
    includePatterns: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeStrategies: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    includeTrends: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    period: "day" | "hour" | "all_time" | "week" | "month" | "quarter";
    includePatterns: boolean;
    includeStrategies: boolean;
    includeTrends: boolean;
    userId?: string | undefined;
}, {
    userId?: string | undefined;
    period?: "day" | "hour" | "all_time" | "week" | "month" | "quarter" | undefined;
    includePatterns?: boolean | undefined;
    includeStrategies?: boolean | undefined;
    includeTrends?: boolean | undefined;
}>;
//# sourceMappingURL=types.d.ts.map