'use client';

/**
 * useLearningGaps Hook
 *
 * Custom hook for fetching and managing learning gap dashboard data.
 * Provides loading states, error handling, and refresh capability.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { LearningGapDashboardData } from './types';

interface UseLearningGapsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

interface UseLearningGapsReturn {
  data: LearningGapDashboardData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLearningGaps(
  options: UseLearningGapsOptions = {}
): UseLearningGapsReturn {
  const { autoRefresh = false, refreshInterval = 300000 } = options; // 5 min default

  const [data, setData] = useState<LearningGapDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/sam/learning-gap');

      if (!res.ok) {
        throw new Error('Failed to fetch learning gap data');
      }

      const result = await res.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.error ?? 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchData,
  };
}

export default useLearningGaps;
