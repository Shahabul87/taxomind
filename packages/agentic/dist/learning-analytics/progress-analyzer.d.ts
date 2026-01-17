/**
 * @sam-ai/agentic - Progress Analyzer
 * Analyzes learning progress, identifies trends, and detects learning gaps
 */
import { LearningSession, LearningSessionStore, TopicProgress, TopicProgressStore, LearningGap, LearningGapStore, ProgressSnapshot, ProgressTrend, ProgressReport, MasteryLevel, TimePeriod, AnalyticsLogger, LearningSessionInput } from './types';
/**
 * In-memory implementation of LearningSessionStore
 */
export declare class InMemoryLearningSessionStore implements LearningSessionStore {
    private sessions;
    create(session: Omit<LearningSession, 'id'>): Promise<LearningSession>;
    get(id: string): Promise<LearningSession | null>;
    getByUser(userId: string, limit?: number): Promise<LearningSession[]>;
    getByUserAndTopic(userId: string, topicId: string): Promise<LearningSession[]>;
    getByPeriod(userId: string, start: Date, end: Date): Promise<LearningSession[]>;
    update(id: string, updates: Partial<LearningSession>): Promise<LearningSession>;
}
/**
 * In-memory implementation of TopicProgressStore
 */
export declare class InMemoryTopicProgressStore implements TopicProgressStore {
    private progress;
    private getKey;
    get(userId: string, topicId: string): Promise<TopicProgress | null>;
    getByUser(userId: string): Promise<TopicProgress[]>;
    upsert(progress: TopicProgress): Promise<TopicProgress>;
    getByMasteryLevel(userId: string, level: MasteryLevel): Promise<TopicProgress[]>;
}
/**
 * In-memory implementation of LearningGapStore
 */
export declare class InMemoryLearningGapStore implements LearningGapStore {
    private gaps;
    create(gap: Omit<LearningGap, 'id'>): Promise<LearningGap>;
    get(id: string): Promise<LearningGap | null>;
    getByUser(userId: string, includeResolved?: boolean): Promise<LearningGap[]>;
    resolve(id: string): Promise<LearningGap>;
    getBySeverity(userId: string, severity: LearningGap['severity']): Promise<LearningGap[]>;
}
/**
 * Configuration for ProgressAnalyzer
 */
export interface ProgressAnalyzerConfig {
    sessionStore?: LearningSessionStore;
    progressStore?: TopicProgressStore;
    gapStore?: LearningGapStore;
    logger?: AnalyticsLogger;
    masteryThresholds?: Partial<Record<MasteryLevel, number>>;
    gapDetectionThreshold?: number;
    trendWindowDays?: number;
}
/**
 * Progress Analyzer
 * Analyzes learning progress, trends, and identifies gaps
 */
export declare class ProgressAnalyzer {
    private sessionStore;
    private progressStore;
    private gapStore;
    private logger;
    private masteryThresholds;
    private gapDetectionThreshold;
    constructor(config?: ProgressAnalyzerConfig);
    /**
     * Record a learning session
     */
    recordSession(input: LearningSessionInput): Promise<LearningSession>;
    /**
     * End a learning session
     */
    endSession(sessionId: string): Promise<LearningSession>;
    /**
     * Get topic progress for a user
     */
    getTopicProgress(userId: string, topicId: string): Promise<TopicProgress | null>;
    /**
     * Get all topic progress for a user
     */
    getAllProgress(userId: string): Promise<TopicProgress[]>;
    /**
     * Detect learning gaps for a user
     */
    detectGaps(userId: string): Promise<LearningGap[]>;
    /**
     * Get learning gaps for a user
     */
    getGaps(userId: string, includeResolved?: boolean): Promise<LearningGap[]>;
    /**
     * Resolve a learning gap
     */
    resolveGap(gapId: string): Promise<LearningGap>;
    /**
     * Analyze progress trends
     */
    analyzeTrends(userId: string, period?: TimePeriod): Promise<ProgressTrend[]>;
    /**
     * Generate a progress report
     */
    generateReport(userId: string, period?: TimePeriod): Promise<ProgressReport>;
    /**
     * Get a progress snapshot
     */
    getSnapshot(userId: string, period?: TimePeriod): Promise<ProgressSnapshot>;
    private updateTopicProgress;
    private calculateMasteryScore;
    private scoreToLevel;
    private determineTrend;
    private calculateSessionAccuracy;
    private calculateVariance;
    private calculateTrendScore;
    private analyzeConceptGap;
    private generateGapActions;
    private calculateTrend;
    private generateTrendInsight;
    private getPeriodDays;
    private calculateSummary;
    private calculateStreak;
    private calculateLongestStreak;
    private calculateEngagement;
    private calculateProductivity;
    private detectAchievements;
    private generateRecommendations;
}
/**
 * Create a new ProgressAnalyzer instance
 */
export declare function createProgressAnalyzer(config?: ProgressAnalyzerConfig): ProgressAnalyzer;
//# sourceMappingURL=progress-analyzer.d.ts.map