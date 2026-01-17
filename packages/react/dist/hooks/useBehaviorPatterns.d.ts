/**
 * @sam-ai/react - useBehaviorPatterns Hook
 * Hook for detecting and retrieving user behavior patterns
 */
export type PatternType = 'STRUGGLE' | 'ENGAGEMENT_DROP' | 'LEARNING_STYLE' | 'TIME_PREFERENCE' | 'TOPIC_AFFINITY' | 'PACE' | 'RETENTION';
export interface BehaviorPattern {
    id: string;
    userId: string;
    type: PatternType;
    name: string;
    description: string;
    confidence: number;
    frequency: number;
    firstDetected: string;
    lastDetected: string;
    metadata?: Record<string, unknown>;
}
export interface UseBehaviorPatternsOptions {
    /** Enable auto-fetch on mount */
    autoFetch?: boolean;
    /** Auto-refresh interval (ms) */
    refreshInterval?: number;
}
export interface UseBehaviorPatternsReturn {
    /** Detected behavior patterns */
    patterns: BehaviorPattern[];
    /** Loading state */
    isLoading: boolean;
    /** Detection in progress */
    isDetecting: boolean;
    /** Error state */
    error: Error | null;
    /** Refresh patterns from server */
    refresh: () => Promise<void>;
    /** Trigger pattern detection */
    detectPatterns: () => Promise<BehaviorPattern[]>;
}
export declare function useBehaviorPatterns(options?: UseBehaviorPatternsOptions): UseBehaviorPatternsReturn;
//# sourceMappingURL=useBehaviorPatterns.d.ts.map