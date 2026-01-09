/**
 * @sam-ai/react - useRecommendations Hook
 * Hook for fetching personalized learning recommendations
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type RecommendationType =
  | 'content'
  | 'practice'
  | 'review'
  | 'assessment'
  | 'break'
  | 'goal';

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

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useRecommendations(
  options: UseRecommendationsOptions = {}
): UseRecommendationsReturn {
  const {
    availableTime = 60,
    limit = 5,
    types,
    autoFetch = true,
    refreshInterval,
  } = options;

  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([]);
  const [totalEstimatedTime, setTotalEstimatedTime] = useState(0);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [context, setContext] = useState<RecommendationContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Use ref to store types array for stable comparison
  const typesRef = useRef(types);
  typesRef.current = types;

  // Fetch recommendations - stable callback
  const fetchRecommendations = useCallback(
    async (fetchOptions?: {
      time?: number;
      limit?: number;
      types?: RecommendationType[];
    }) => {
      setIsLoading(true);
      setError(null);

      const time = fetchOptions?.time ?? availableTime;
      const fetchLimit = fetchOptions?.limit ?? limit;
      const fetchTypes = fetchOptions?.types ?? typesRef.current;

      try {
        const params = new URLSearchParams();
        params.set('time', String(time));
        params.set('limit', String(fetchLimit));
        if (fetchTypes?.length) {
          params.set('types', fetchTypes.join(','));
        }

        const response = await fetch(
          `/api/sam/agentic/recommendations?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch recommendations');
        }

        const result = await response.json();

        if (result.success) {
          const { data } = result;
          setRecommendations(data.recommendations);
          setTotalEstimatedTime(data.totalEstimatedTime);
          setGeneratedAt(data.generatedAt);
          setContext(data.context);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    },
    [availableTime, limit]
  );

  // Refresh recommendations
  const refresh = useCallback(async () => {
    await fetchRecommendations();
  }, [fetchRecommendations]);

  // Initial fetch - runs when autoFetch changes or fetchRecommendations is recreated
  useEffect(() => {
    if (autoFetch) {
      fetchRecommendations();
    }
  }, [autoFetch, fetchRecommendations]);

  // Auto-refresh interval
  useEffect(() => {
    if (!refreshInterval) return;

    const intervalId = setInterval(() => {
      fetchRecommendations();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, fetchRecommendations]);

  return {
    recommendations,
    totalEstimatedTime,
    generatedAt,
    context,
    isLoading,
    error,
    refresh,
    fetchRecommendations,
  };
}
