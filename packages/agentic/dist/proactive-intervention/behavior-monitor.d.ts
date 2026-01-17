/**
 * @sam-ai/agentic - Behavior Monitor
 * Tracks user behavior, detects patterns, and suggests interventions
 */
import { BehaviorEvent, BehaviorEventStore, BehaviorEventType, BehaviorPattern, PatternStore, PatternType, BehaviorAnomaly, ChurnPrediction, StrugglePrediction, Intervention, InterventionStore, InterventionResult, InterventionCheckResult, EventQueryOptions, ProactiveLogger } from './types';
/**
 * In-memory implementation of BehaviorEventStore
 */
export declare class InMemoryBehaviorEventStore implements BehaviorEventStore {
    private events;
    add(event: Omit<BehaviorEvent, 'id' | 'processed' | 'processedAt'>): Promise<BehaviorEvent>;
    addBatch(events: Array<Omit<BehaviorEvent, 'id' | 'processed' | 'processedAt'>>): Promise<BehaviorEvent[]>;
    get(id: string): Promise<BehaviorEvent | null>;
    getByUser(userId: string, options?: EventQueryOptions): Promise<BehaviorEvent[]>;
    getBySession(sessionId: string): Promise<BehaviorEvent[]>;
    getUnprocessed(limit: number): Promise<BehaviorEvent[]>;
    markProcessed(ids: string[]): Promise<void>;
    count(userId: string, type?: BehaviorEventType, since?: Date): Promise<number>;
}
/**
 * In-memory implementation of PatternStore
 */
export declare class InMemoryPatternStore implements PatternStore {
    private patterns;
    get(id: string): Promise<BehaviorPattern | null>;
    getByUser(userId: string): Promise<BehaviorPattern[]>;
    getByType(userId: string, type: PatternType): Promise<BehaviorPattern[]>;
    create(pattern: Omit<BehaviorPattern, 'id'>): Promise<BehaviorPattern>;
    update(id: string, updates: Partial<BehaviorPattern>): Promise<BehaviorPattern>;
    delete(id: string): Promise<boolean>;
    recordOccurrence(id: string): Promise<void>;
}
/**
 * In-memory implementation of InterventionStore
 */
export declare class InMemoryInterventionStore implements InterventionStore {
    private interventions;
    private userInterventions;
    get(id: string): Promise<Intervention | null>;
    getByUser(userId: string, pending?: boolean): Promise<Intervention[]>;
    create(intervention: Omit<Intervention, 'id' | 'createdAt'>, userId?: string): Promise<Intervention>;
    update(id: string, updates: Partial<Intervention>): Promise<Intervention>;
    recordResult(id: string, result: InterventionResult): Promise<void>;
    getHistory(userId: string, limit?: number): Promise<Intervention[]>;
    setUserIntervention(userId: string, interventionId: string): void;
}
/**
 * Configuration for BehaviorMonitor
 */
export interface BehaviorMonitorConfig {
    eventStore?: BehaviorEventStore;
    patternStore?: PatternStore;
    interventionStore?: InterventionStore;
    logger?: ProactiveLogger;
    patternDetectionThreshold?: number;
    churnPredictionWindow?: number;
    frustrationThreshold?: number;
}
/**
 * Behavior Monitor
 * Tracks events, detects patterns, and suggests interventions
 */
export declare class BehaviorMonitor {
    private eventStore;
    private patternStore;
    private interventionStore;
    private logger;
    private patternDetectionThreshold;
    private churnPredictionWindow;
    private frustrationThreshold;
    constructor(config?: BehaviorMonitorConfig);
    /**
     * Track a behavior event
     */
    trackEvent(event: Omit<BehaviorEvent, 'id' | 'processed' | 'processedAt'>): Promise<BehaviorEvent>;
    /**
     * Track multiple events at once
     */
    trackEvents(events: Array<Omit<BehaviorEvent, 'id' | 'processed' | 'processedAt'>>): Promise<BehaviorEvent[]>;
    /**
     * Detect patterns in user behavior
     */
    detectPatterns(userId: string): Promise<BehaviorPattern[]>;
    /**
     * Detect anomalies in user behavior
     */
    detectAnomalies(userId: string): Promise<BehaviorAnomaly[]>;
    /**
     * Predict churn risk for a user
     */
    predictChurn(userId: string): Promise<ChurnPrediction>;
    /**
     * Predict struggle areas for a user
     */
    predictStruggle(userId: string): Promise<StrugglePrediction>;
    /**
     * Suggest interventions based on patterns
     */
    suggestInterventions(patterns: BehaviorPattern[]): Promise<Intervention[]>;
    /**
     * Get behavior events for a user
     */
    getEvents(userId: string, options?: EventQueryOptions): Promise<BehaviorEvent[]>;
    /**
     * Get events for a session
     */
    getSessionEvents(sessionId: string): Promise<BehaviorEvent[]>;
    /**
     * Get patterns for a user
     */
    getPatterns(userId: string): Promise<BehaviorPattern[]>;
    /**
     * Get pending interventions for a user
     */
    getPendingInterventions(userId: string): Promise<Intervention[]>;
    /**
     * Execute an intervention
     */
    executeIntervention(interventionId: string): Promise<Intervention>;
    /**
     * Record intervention result
     */
    recordInterventionResult(interventionId: string, result: InterventionResult): Promise<void>;
    /**
     * Check for interventions based on recent events
     * Call this after recording events to evaluate if any interventions should be triggered
     */
    checkInterventions(userId: string): Promise<InterventionCheckResult>;
    /**
     * Map anomaly type to intervention type
     */
    private mapAnomalyToInterventionType;
    /**
     * Map pattern type to intervention type
     */
    private mapPatternToInterventionType;
    /**
     * Create an intervention for an anomaly
     */
    private createInterventionForAnomaly;
    /**
     * Create an intervention for a user
     */
    createIntervention(userId: string, intervention: Omit<Intervention, 'id' | 'createdAt'>): Promise<Intervention>;
    private processEmotionalSignals;
    private detectTimePreference;
    private detectLearningHabit;
    private detectStrugglePatterns;
    private detectSuccessPattern;
    private createInterventionForPattern;
}
/**
 * Create a new BehaviorMonitor instance
 */
export declare function createBehaviorMonitor(config?: BehaviorMonitorConfig): BehaviorMonitor;
//# sourceMappingURL=behavior-monitor.d.ts.map