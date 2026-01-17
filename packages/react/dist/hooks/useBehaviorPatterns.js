/**
 * @sam-ai/react - useBehaviorPatterns Hook
 * Hook for detecting and retrieving user behavior patterns
 */
'use client';
import { useState, useEffect, useCallback } from 'react';
// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================
export function useBehaviorPatterns(options = {}) {
    const { autoFetch = true, refreshInterval } = options;
    const [patterns, setPatterns] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDetecting, setIsDetecting] = useState(false);
    const [error, setError] = useState(null);
    // Fetch patterns from server
    const fetchPatterns = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/sam/agentic/behavior/patterns');
            if (!response.ok) {
                throw new Error('Failed to fetch behavior patterns');
            }
            const result = await response.json();
            if (result.success) {
                setPatterns(result.data.patterns);
            }
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'));
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    // Trigger pattern detection
    const detectPatterns = useCallback(async () => {
        setIsDetecting(true);
        setError(null);
        try {
            const response = await fetch('/api/sam/agentic/behavior/patterns', {
                method: 'POST',
            });
            if (!response.ok) {
                throw new Error('Failed to detect behavior patterns');
            }
            const result = await response.json();
            if (result.success) {
                const detectedPatterns = result.data.patterns;
                setPatterns(detectedPatterns);
                return detectedPatterns;
            }
            return [];
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error('Unknown error');
            setError(error);
            throw error;
        }
        finally {
            setIsDetecting(false);
        }
    }, []);
    // Refresh patterns
    const refresh = useCallback(async () => {
        await fetchPatterns();
    }, [fetchPatterns]);
    // Initial fetch
    useEffect(() => {
        if (autoFetch) {
            fetchPatterns();
        }
    }, [autoFetch, fetchPatterns]);
    // Auto-refresh interval
    useEffect(() => {
        if (!refreshInterval)
            return;
        const intervalId = setInterval(() => {
            fetchPatterns();
        }, refreshInterval);
        return () => clearInterval(intervalId);
    }, [refreshInterval, fetchPatterns]);
    return {
        patterns,
        isLoading,
        isDetecting,
        error,
        refresh,
        detectPatterns,
    };
}
