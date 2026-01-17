/**
 * @sam-ai/react - useRecommendations Hook
 * Hook for fetching personalized learning recommendations
 */
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================
export function useRecommendations(options = {}) {
    const { availableTime = 60, limit = 5, types, autoFetch = true, refreshInterval, } = options;
    const [recommendations, setRecommendations] = useState([]);
    const [totalEstimatedTime, setTotalEstimatedTime] = useState(0);
    const [generatedAt, setGeneratedAt] = useState(null);
    const [context, setContext] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    // Use ref to store types array for stable comparison
    const typesRef = useRef(types);
    typesRef.current = types;
    // Fetch recommendations - stable callback
    const fetchRecommendations = useCallback(async (fetchOptions) => {
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
            const response = await fetch(`/api/sam/agentic/recommendations?${params.toString()}`);
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
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
        }
        finally {
            setIsLoading(false);
        }
    }, [availableTime, limit]);
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
        if (!refreshInterval)
            return;
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
