/**
 * @sam-ai/react - useRecommendations Hook
 * Hook for fetching personalized learning recommendations
 */
export type RecommendationType = 'content' | 'practice' | 'review' | 'assessment' | 'break' | 'goal';
export type RecommendationPriority = 'low' | 'medium' | 'high';
export interface LearningRecommendation {
    id: string;
    type: RecommendationType;
    title: string;
    description: string;
    reason: string;
    priority: RecommendationPriority;
    estimatedMinutes: number;
    targetUrl?: string;
    metadata?: {
        resourceId?: string;
        difficulty?: string;
        confidence?: number;
    };
}
export interface RecommendationContext {
    availableTime: number;
    currentGoals: string[];
    recentTopics: string[];
}
export interface UseRecommendationsOptions {
    /** Available time in minutes (5-480) */
    availableTime?: number;
    /** Max recommendations to fetch (1-20) */
    limit?: number;
    /** Filter by recommendation types */
    types?: RecommendationType[];
    /** Enable auto-fetch on mount */
    autoFetch?: boolean;
    /** Auto-refresh interval (ms) */
    refreshInterval?: number;
}
export interface UseRecommendationsReturn {
    /** List of recommendations */
    recommendations: LearningRecommendation[];
    /** Total estimated time for all recommendations */
    totalEstimatedTime: number;
    /** When recommendations were generated */
    generatedAt: string | null;
    /** Context used for generating recommendations */
    context: RecommendationContext | null;
    /** Loading state */
    isLoading: boolean;
    /** Error state */
    error: Error | null;
    /** Refresh recommendations */
    refresh: () => Promise<void>;
    /** Fetch with custom options */
    fetchRecommendations: (options?: {
        time?: number;
        limit?: number;
        types?: RecommendationType[];
    }) => Promise<void>;
}
export declare function useRecommendations(options?: UseRecommendationsOptions): UseRecommendationsReturn;
//# sourceMappingURL=useRecommendations.d.ts.map