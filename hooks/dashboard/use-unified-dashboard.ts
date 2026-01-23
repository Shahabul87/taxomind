'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useUnifiedDashboardContext } from '@/lib/contexts/unified-dashboard-context';

/**
 * Hook for accessing the unified dashboard state and actions
 *
 * This hook provides a convenient interface for:
 * - Dashboard overview data (goals summary, notifications, streak, activity)
 * - Tab navigation
 * - Refresh functionality
 *
 * @example
 * ```tsx
 * const { overview, isLoading, refreshDashboard } = useUnifiedDashboard();
 *
 * return (
 *   <div>
 *     <p>Current streak: {overview?.streak.currentStreak}</p>
 *     <p>Pending todos: {overview?.todos.pending}</p>
 *     <button onClick={refreshDashboard}>Refresh</button>
 *   </div>
 * );
 * ```
 */
export function useUnifiedDashboard() {
  const context = useUnifiedDashboardContext();
  const { state, fetchOverview, refreshDashboard, setActiveTab, setAnalyticsSubTab } = context;

  return {
    // Overview data
    overview: state.overview,

    // Navigation
    activeTab: state.activeTab,
    activeAnalyticsSubTab: state.activeAnalyticsSubTab,
    setActiveTab,
    setAnalyticsSubTab,

    // Loading states
    isLoading: state.loadingStates.overview,
    isRefreshing: state.isRefreshing,

    // Errors
    error: state.errors.overview,

    // Actions
    fetchOverview,
    refreshDashboard,

    // Quick access to common data
    streak: state.overview?.streak ?? null,
    todos: state.overview?.todos ?? null,
    recentActivity: state.overview?.activity ?? null,
    goalsCount: state.overview?.goals.total ?? 0,
    unreadNotifications: state.overview?.notifications.unreadCount ?? 0,
  };
}

/**
 * Hook for auto-refreshing dashboard data at intervals
 *
 * @param intervalMs - Refresh interval in milliseconds (default: 5 minutes)
 * @param enabled - Whether auto-refresh is enabled (default: true)
 *
 * @example
 * ```tsx
 * // Refresh every 2 minutes
 * useAutoRefreshDashboard(120000);
 * ```
 */
export function useAutoRefreshDashboard(intervalMs = 300000, enabled = true) {
  const { refreshDashboard, isRefreshing } = useUnifiedDashboard();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      if (!isRefreshing) {
        refreshDashboard();
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, intervalMs, isRefreshing, refreshDashboard]);
}

/**
 * Hook for dashboard quick stats
 * Provides computed values for common dashboard metrics
 */
export function useDashboardQuickStats() {
  const { overview, isLoading } = useUnifiedDashboard();

  const stats = {
    // Streak
    currentStreak: overview?.streak.currentStreak ?? 0,
    longestStreak: overview?.streak.longestStreak ?? 0,
    hasStreakToday: overview?.streak.lastActivityDate
      ? new Date(overview.streak.lastActivityDate).toDateString() === new Date().toDateString()
      : false,

    // Goals
    totalGoals: overview?.goals.total ?? 0,
    activeGoals: overview?.goals.byStatus.active ?? 0,
    completedGoals: overview?.goals.byStatus.completed ?? 0,

    // Todos
    pendingTodos: overview?.todos.pending ?? 0,
    overdueTodos: overview?.todos.overdue ?? 0,
    completedToday: overview?.todos.completedToday ?? 0,

    // Notifications
    unreadCount: overview?.notifications.unreadCount ?? 0,

    // Activity (last 7 days)
    studyMinutes: overview?.activity.last7Days.studyMinutes ?? 0,
    studyHours: Math.round(((overview?.activity.last7Days.studyMinutes ?? 0) / 60) * 10) / 10,
    activitiesCount: overview?.activity.last7Days.activitiesCount ?? 0,
  };

  return {
    stats,
    isLoading,
  };
}
