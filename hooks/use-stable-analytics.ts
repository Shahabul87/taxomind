import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { measureAsync } from '@/lib/performance-monitor';
import { getCachedOrFetch, invalidateCache } from '@/lib/cache-utils';
import {
  AnalyticsData,
  PerformanceData,
  PulseData,
  fetchStableAnalytics,
  fetchStablePerformance,
  fetchStablePulse
} from '@/lib/stable-analytics-data';

/**
 * Hook for fetching and managing analytics data with stable state management.
 *
 * Features:
 * - Automatic data fetching on mount and parameter changes
 * - Stale-while-revalidate caching (5 minute TTL)
 * - Performance monitoring with automatic logging
 * - Loading and error state management
 * - Manual refresh capability
 * - Cleanup on unmount
 *
 * @param period - Time period for analytics (DAILY, WEEKLY, MONTHLY)
 * @param course - Optional course ID to filter analytics
 * @returns Object containing data, loading state, error state, and refresh function
 *
 * @example
 * ```tsx
 * const { data, loading, error, refreshAnalytics } = useStableAnalytics('WEEKLY', 'course-123');
 * ```
 */
export function useStableAnalytics(period: 'DAILY' | 'WEEKLY' | 'MONTHLY', course?: string) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate cache key
  const cacheKey = `analytics:${period}:${course || 'all'}`;

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use cache with stale-while-revalidate and performance monitoring
        const result = await getCachedOrFetch(
          cacheKey,
          () => measureAsync(
            'analytics.fetch',
            () => fetchStableAnalytics(period, course),
            { period, course: course || 'all' }
          ),
          { ttl: 300000, staleWhileRevalidate: true } // 5 minute TTL
        );

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load analytics data');
          logger.error('[ANALYTICS_HOOK] Error:', err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [period, course, cacheKey]); // Include cacheKey for consistency

  // Stable refresh function with cache invalidation
  const refreshAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Invalidate cache to force fresh fetch
      invalidateCache(cacheKey);

      const result = await measureAsync(
        'analytics.refresh',
        () => fetchStableAnalytics(period, course),
        { period, course: course || 'all', manual: true }
      );

      setData(result);
    } catch (err) {
      setError('Failed to load analytics data');
      logger.error('[ANALYTICS_HOOK] Refresh error:', err);
    } finally {
      setLoading(false);
    }
  }, [period, course, cacheKey]);

  return {
    data,
    loading,
    error,
    refreshAnalytics
  };
}

/**
 * Hook for fetching and managing performance metrics data.
 *
 * Features:
 * - Automatic data fetching on mount and parameter changes
 * - Loading and error state management
 * - Manual refresh capability
 * - Cleanup on unmount
 *
 * @param period - Time period for metrics (DAILY, WEEKLY, MONTHLY)
 * @param days - Number of days to include in the analysis
 * @returns Object containing data, loading state, error state, and refresh function
 *
 * @example
 * ```tsx
 * const { data, loading, error, refreshPerformance } = useStablePerformanceMetrics('WEEKLY', 30);
 * ```
 */
export function useStablePerformanceMetrics(period: 'DAILY' | 'WEEKLY' | 'MONTHLY', days: number) {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchStablePerformance(period, days);

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load performance data');
          logger.error('Performance error:', err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [period, days]); // Only depend on actual values

  // Stable refresh function that doesn't change on every render
  const refreshPerformance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchStablePerformance(period, days);
      setData(result);
    } catch (err) {
      setError('Failed to load performance data');
      logger.error('Performance error:', err);
    } finally {
      setLoading(false);
    }
  }, [period, days]);

  return {
    data,
    loading,
    error,
    refreshPerformance
  };
}

/**
 * Polling intervals based on user activity and page visibility
 */
const POLLING_INTERVALS = {
  ACTIVE: 300000,      // 5 minutes when user is active
  INACTIVE: 600000,    // 10 minutes when user inactive (no activity for 1 minute)
  BACKGROUND: 900000,  // 15 minutes when tab is hidden
} as const;

const ACTIVITY_TIMEOUT = 60000; // Consider inactive after 1 minute of no activity

/**
 * Hook for fetching and managing real-time pulse data with intelligent polling.
 *
 * Features:
 * - Activity-based polling (adjusts based on user interaction)
 * - Page Visibility API integration (slows down when tab hidden)
 * - Initial load with loading state
 * - Background refresh without loading state
 * - Automatic cleanup on unmount
 * - Manual refresh capability
 * - Performance optimized (reduces server load and battery usage)
 *
 * Polling Strategy:
 * - Active user: Every 5 minutes
 * - Inactive user (1+ min no activity): Every 10 minutes
 * - Hidden tab: Every 15 minutes
 *
 * @returns Object containing pulse data, loading state, error state, and refresh function
 *
 * @example
 * ```tsx
 * const { pulse, loading, error, refreshPulse } = useStableRealtimePulse();
 * ```
 */
export function useStableRealtimePulse() {
  const [pulse, setPulse] = useState<PulseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUserActive, setIsUserActive] = useState(true);
  const [isPageVisible, setIsPageVisible] = useState(true);

  useEffect(() => {
    let mounted = true;
    let intervalId: NodeJS.Timeout;
    let activityTimeout: NodeJS.Timeout;

    const fetchData = async (isRefresh = false) => {
      try {
        const startTime = performance.now();

        // Only show loading on initial load, not on refreshes
        if (!isRefresh && mounted) {
          setLoading(true);
        }

        if (mounted) {
          setError(null);
        }

        const result = await fetchStablePulse();

        if (mounted) {
          setPulse(result);

          // Log performance for monitoring
          const duration = performance.now() - startTime;
          logger.info('[PULSE_HOOK] Data fetched', {
            duration: `${duration.toFixed(2)}ms`,
            isRefresh,
            isActive: isUserActive,
            isVisible: isPageVisible,
          });
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to load pulse data');
          logger.error('[PULSE_HOOK] Error:', err);
        }
      } finally {
        if (!isRefresh && mounted) {
          setLoading(false);
        }
      }
    };

    /**
     * Determine polling interval based on user activity and page visibility
     */
    const getPollingInterval = (): number => {
      if (!isPageVisible) {
        return POLLING_INTERVALS.BACKGROUND;
      }
      return isUserActive ? POLLING_INTERVALS.ACTIVE : POLLING_INTERVALS.INACTIVE;
    };

    /**
     * Handle user activity - reset activity timeout
     */
    const handleActivity = () => {
      if (!isUserActive) {
        setIsUserActive(true);
      }

      // Clear existing timeout
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }

      // Set new timeout to mark as inactive
      activityTimeout = setTimeout(() => {
        if (mounted) {
          setIsUserActive(false);
          logger.info('[PULSE_HOOK] User marked as inactive');
        }
      }, ACTIVITY_TIMEOUT);
    };

    /**
     * Handle page visibility changes
     */
    const handleVisibilityChange = () => {
      if (mounted) {
        const isVisible = document.visibilityState === 'visible';
        setIsPageVisible(isVisible);

        logger.info('[PULSE_HOOK] Page visibility changed', {
          visible: isVisible,
          nextInterval: getPollingInterval(),
        });

        // If page becomes visible, fetch fresh data
        if (isVisible) {
          fetchData(true);
        }
      }
    };

    /**
     * Set up polling with dynamic interval
     */
    const setupPolling = () => {
      if (intervalId) {
        clearInterval(intervalId);
      }

      const interval = getPollingInterval();
      intervalId = setInterval(() => {
        if (mounted) {
          fetchData(true);
        }
      }, interval);

      logger.info('[PULSE_HOOK] Polling configured', {
        interval: `${interval / 1000}s`,
        isActive: isUserActive,
        isVisible: isPageVisible,
      });
    };

    // Initialize data and set up listeners
    const initialize = async () => {
      if (!mounted) return;

      // Initial data fetch
      await fetchData(false);

      // Set up activity listeners
      if (typeof window !== 'undefined') {
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('click', handleActivity);
        window.addEventListener('scroll', handleActivity);
        document.addEventListener('visibilitychange', handleVisibilityChange);
      }

      // Set up polling
      setupPolling();
    };

    initialize();

    // Re-setup polling when activity or visibility changes
    return () => {
      mounted = false;

      if (intervalId) {
        clearInterval(intervalId);
      }

      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }

      if (typeof window !== 'undefined') {
        window.removeEventListener('mousemove', handleActivity);
        window.removeEventListener('keydown', handleActivity);
        window.removeEventListener('click', handleActivity);
        window.removeEventListener('scroll', handleActivity);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [isUserActive, isPageVisible]); // Re-run when activity or visibility changes

  // Stable refresh function
  const refreshPulse = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchStablePulse();
      setPulse(result);
    } catch (err) {
      setError('Failed to load pulse data');
      logger.error('[PULSE_HOOK] Manual refresh error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    pulse,
    loading,
    error,
    refreshPulse,
    isUserActive,
    isPageVisible,
  };
}
