import { useState, useEffect } from 'react';
import { 
  AnalyticsData, 
  PerformanceData, 
  PulseData,
  fetchStableAnalytics,
  fetchStablePerformance,
  fetchStablePulse
} from '@/lib/stable-analytics-data';

export function useStableAnalytics(period: 'DAILY' | 'WEEKLY' | 'MONTHLY', course?: string) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchStableAnalytics(period, course);
      setData(result);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period, course]);

  return {
    data,
    loading,
    error,
    refreshAnalytics: fetchData
  };
}

export function useStablePerformanceMetrics(period: 'DAILY' | 'WEEKLY' | 'MONTHLY', days: number) {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchStablePerformance(period, days);
      setData(result);
    } catch (err) {
      setError('Failed to load performance data');
      console.error('Performance error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period, days]);

  return {
    data,
    loading,
    error,
    refreshPerformance: fetchData
  };
}

export function useStableRealtimePulse() {
  const [pulse, setPulse] = useState<PulseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (isRefresh = false) => {
    try {
      // Only show loading on initial load, not on refreshes
      if (!isRefresh) {
        setLoading(true);
      }
      setError(null);
      const result = await fetchStablePulse();
      setPulse(result);
    } catch (err) {
      setError('Failed to load pulse data');
      console.error('Pulse error:', err);
    } finally {
      if (!isRefresh) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let mounted = true;
    let intervalId: NodeJS.Timeout;

    const initializeData = async () => {
      if (mounted) {
        await fetchData(false);
        
        // Set up interval for background updates (less aggressive)
        intervalId = setInterval(() => {
          if (mounted) {
            fetchData(true); // Background refresh without loading state
          }
        }, 120000); // Every 2 minutes instead of 1 minute
      }
    };

    initializeData();
    
    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []); // No dependencies to prevent re-initialization

  return {
    pulse,
    loading,
    error,
    refreshPulse: () => fetchData(false)
  };
}