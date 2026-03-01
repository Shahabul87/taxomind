'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { logger } from '@/lib/logger';

interface RealTimeMetrics {
  timestamp: Date;
  activeUsers: number;
  totalInteractions: number;
  avgEngagementScore: number;
  completionRate: number;
  currentVideosWatching: number;
  strugglingStudents: number;
  topPerformers: number;
  systemLoad: number;
}

interface StudentActivity {
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  currentActivity: string;
  engagementScore: number;
  timeSpent: number;
  lastSeen: Date;
  status: 'active' | 'idle' | 'struggling';
  progress: number;
}

interface ContentAlert {
  id: string;
  type: 'struggle' | 'dropout' | 'engagement' | 'technical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedStudents: number;
  courseId: string;
  contentId: string;
  timestamp: Date;
  resolved: boolean;
}

interface UseRealTimeAnalyticsOptions {
  courseId?: string;
  refreshInterval?: number;
  autoRefresh?: boolean;
  enableWebSocket?: boolean;
}

export function useRealTimeAnalytics(options: UseRealTimeAnalyticsOptions = {}) {
  const {
    courseId,
    refreshInterval = 5000,
    autoRefresh = true,
    enableWebSocket = false
  } = options;

  const { data: session } = useSession();

  // State
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<RealTimeMetrics[]>([]);
  const [studentActivities, setStudentActivities] = useState<StudentActivity[]>([]);
  const [alerts, setAlerts] = useState<ContentAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const refreshTimer = useRef<NodeJS.Timeout>();
  const wsRef = useRef<WebSocket | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Fetch real-time metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/analytics/real-time/metrics?${courseId ? `courseId=${courseId}&` : ''}timeRange=1h`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.status}`);
      }

      const data = await response.json();
      const newMetrics: RealTimeMetrics = {
        ...data,
        timestamp: new Date(data.timestamp)
      };

      setMetrics(newMetrics);
      
      // Add to history
      setMetricsHistory(prev => {
        const updated = [...prev, newMetrics];
        return updated.slice(-50); // Keep last 50 data points
      });

      setError(null);
      retryCount.current = 0;
      setIsConnected(true);
    } catch (err) {
      logger.error('Failed to fetch metrics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      retryCount.current++;
      if (retryCount.current >= maxRetries) {
        setIsConnected(false);
      }
    }
  }, [courseId]);

  // Fetch student activities
  const fetchStudentActivities = useCallback(async () => {
    if (!session?.user) return;

    try {
      const response = await fetch(
        `/api/analytics/real-time/activities?${courseId ? `courseId=${courseId}` : ''}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.status}`);
      }

      const data = await response.json();
      setStudentActivities(data.activities || []);
    } catch (err) {
      logger.error('Failed to fetch student activities:', err);
    }
  }, [courseId, session]);

  // Fetch content alerts
  const fetchAlerts = useCallback(async () => {
    if (!session?.user) return;

    try {
      const response = await fetch(
        `/api/analytics/real-time/alerts?${courseId ? `courseId=${courseId}` : ''}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch alerts: ${response.status}`);
      }

      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      logger.error('Failed to fetch alerts:', err);
    }
  }, [courseId, session]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchMetrics(),
        fetchStudentActivities(),
        fetchAlerts()
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchMetrics, fetchStudentActivities, fetchAlerts]);

  // Start auto refresh
  const startAutoRefresh = useCallback(() => {
    if (refreshTimer.current) {
      clearInterval(refreshTimer.current);
    }

    refreshTimer.current = setInterval(() => {
      if (isConnected || retryCount.current < maxRetries) {
        refreshAll();
      }
    }, refreshInterval);
  }, [refreshAll, refreshInterval, isConnected]);

  // Stop auto refresh
  const stopAutoRefresh = useCallback(() => {
    if (refreshTimer.current) {
      clearInterval(refreshTimer.current);
      refreshTimer.current = undefined;
    }
  }, []);

  // WebSocket connection (for future implementation)
  const initializeWebSocket = useCallback(() => {
    if (!enableWebSocket || !session?.user) return;

    try {
      // In a real implementation, this would connect to a WebSocket server

      // Example WebSocket setup:
      // const ws = new WebSocket(`ws://localhost:3001/analytics?courseId=${courseId}`);
      // wsRef.current = ws;
      
      // ws.onopen = () => {
      //   console.log('WebSocket connected');
      //   setIsConnected(true);
      // };
      
      // ws.onmessage = (event) => {
      //   const data = JSON.parse(event.data);
      //   handleWebSocketMessage(data);
      // };
      
      // ws.onclose = () => {
      //   console.log('WebSocket disconnected');
      //   setIsConnected(false);
      // };
      
      // ws.onerror = (error) => {
      //   logger.error('WebSocket error:', error);
      //   setError('WebSocket connection failed');
      // };
    } catch (err) {
      logger.error('Failed to initialize WebSocket:', err);
    }
  }, [enableWebSocket, session]);

  // Resolve alert
  const resolveAlert = useCallback(async (alertId: string) => {
    try {
      const response = await fetch(
        `/api/analytics/real-time/alerts/${alertId}/resolve`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new Error('Failed to resolve alert');
      }

      // Update local state
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId ? { ...alert, resolved: true } : alert
        )
      );

      return true;
    } catch (err) {
      logger.error('Failed to resolve alert:', err);
      return false;
    }
  }, []);

  // Get metrics trends
  const getMetricsTrends = useCallback(() => {
    if (metricsHistory.length < 2) {
      return {
        activeUsers: 'stable',
        engagement: 'stable',
        completionRate: 'stable'
      };
    }

    const current = metricsHistory[metricsHistory.length - 1];
    const previous = metricsHistory[metricsHistory.length - 2];

    const getTrend = (curr: number, prev: number) => {
      const diff = curr - prev;
      const threshold = Math.abs(prev * 0.1); // 10% threshold
      
      if (Math.abs(diff) < threshold) return 'stable';
      return diff > 0 ? 'up' : 'down';
    };

    return {
      activeUsers: getTrend(current.activeUsers, previous.activeUsers),
      engagement: getTrend(current.avgEngagementScore, previous.avgEngagementScore),
      completionRate: getTrend(current.completionRate, previous.completionRate)
    };
  }, [metricsHistory]);

  // Get critical alerts count
  const getCriticalAlertsCount = useCallback(() => {
    return alerts.filter(alert => 
      alert.severity === 'critical' && !alert.resolved
    ).length;
  }, [alerts]);

  // Initialize
  useEffect(() => {
    refreshAll();

    if (enableWebSocket) {
      initializeWebSocket();
    }

    // Capture ref value for cleanup
    const currentWs = wsRef.current;

    return () => {
      stopAutoRefresh();
      if (currentWs) {
        currentWs.close();
      }
    };
  }, [refreshAll, initializeWebSocket, enableWebSocket, stopAutoRefresh]);

  // Auto refresh effect
  useEffect(() => {
    if (autoRefresh) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }

    return () => stopAutoRefresh();
  }, [autoRefresh, startAutoRefresh, stopAutoRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    // Capture ref value for cleanup
    const currentWs = wsRef.current;

    return () => {
      stopAutoRefresh();
      if (currentWs) {
        currentWs.close();
      }
    };
  }, [stopAutoRefresh]);

  return {
    // Data
    metrics,
    metricsHistory,
    studentActivities,
    alerts,
    
    // Status
    isConnected,
    loading,
    error,
    
    // Actions
    refreshAll,
    resolveAlert,
    
    // Computed values
    trends: getMetricsTrends(),
    criticalAlertsCount: getCriticalAlertsCount(),
    
    // Control
    startAutoRefresh,
    stopAutoRefresh
  };
}

// Specialized hook for student metrics only
export function useStudentMetrics(courseId?: string) {
  const { data: session } = useSession();
  
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;

    const fetchMetrics = async () => {
      try {
        const response = await fetch(
          `/api/analytics/events?type=student${courseId ? `&courseId=${courseId}` : ''}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error: any) {
        logger.error('Failed to fetch student metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [courseId, session]);

  return { metrics, loading };
}

// Specialized hook for course analytics
export function useCourseAnalytics(courseId: string) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(
          `/api/analytics/events?type=course&courseId=${courseId}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        }
      } catch (error: any) {
        logger.error('Failed to fetch course analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [courseId]);

  return { analytics, loading };
}

// Hook for engagement score with trend
export function useEngagementScore(courseId?: string) {
  const [score, setScore] = useState(0);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');
  const { metrics } = useStudentMetrics(courseId);

  useEffect(() => {
    if (metrics?.engagementScore) {
      const newScore = metrics.engagementScore;
      
      if (newScore > score) setTrend('up');
      else if (newScore < score) setTrend('down');
      else setTrend('stable');
      
      setScore(newScore);
    }
  }, [metrics, score]);

  return { score, trend };
}

// Hook for real-time leaderboard
export function useLeaderboard(courseId?: string) {
  const [leaderboard, setLeaderboard] = useState<Array<{
    userId: string;
    score: number;
    rank: number;
  }>>([]);

  const { analytics } = useCourseAnalytics(courseId || '');

  useEffect(() => {
    if (analytics?.leaderboard) {
      const rankedLeaderboard = analytics.leaderboard.map((item: any, index: number) => ({
        ...item,
        rank: index + 1
      }));
      setLeaderboard(rankedLeaderboard);
    }
  }, [analytics]);

  return leaderboard;
}