'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useUnifiedDashboardContext, type Notification } from '@/lib/contexts/unified-dashboard-context';

/**
 * Hook for managing notifications in the unified dashboard
 *
 * This hook provides:
 * - Notifications list with pagination
 * - Read/unread management
 * - Filtering by type
 * - Real-time unread count
 *
 * @example
 * ```tsx
 * const { notifications, unreadCount, markAsRead, markAllAsRead } = useUnifiedNotifications();
 *
 * return (
 *   <div>
 *     <Badge count={unreadCount} />
 *     {notifications.map(n => (
 *       <NotificationItem
 *         key={n.id}
 *         notification={n}
 *         onClick={() => markAsRead(n.id)}
 *       />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useUnifiedNotifications() {
  const context = useUnifiedDashboardContext();
  const {
    state,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = context;

  const initialFetchRef = useRef(false);

  // Fetch notifications on mount
  useEffect(() => {
    if (!initialFetchRef.current) {
      initialFetchRef.current = true;
      fetchNotifications({ reset: true });
    }
  }, [fetchNotifications]);

  // Load more notifications (pagination)
  const loadMore = useCallback(() => {
    if (state.notificationsPagination.hasMore && !state.loadingStates.notifications) {
      fetchNotifications({ page: state.notificationsPagination.page + 1 });
    }
  }, [fetchNotifications, state.notificationsPagination, state.loadingStates.notifications]);

  // Computed values
  const unreadCount = useMemo(
    () => state.notifications.filter((n) => !n.read).length,
    [state.notifications]
  );

  const unreadNotifications = useMemo(
    () => state.notifications.filter((n) => !n.read),
    [state.notifications]
  );

  const readNotifications = useMemo(
    () => state.notifications.filter((n) => n.read),
    [state.notifications]
  );

  // Group by type
  const notificationsByType = useMemo(() => {
    const grouped: Record<string, Notification[]> = {};

    for (const notification of state.notifications) {
      const type = notification.type;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(notification);
    }

    return grouped;
  }, [state.notifications]);

  return {
    // Notifications data
    notifications: state.notifications,
    unreadNotifications,
    readNotifications,
    notificationsByType,

    // Counts
    unreadCount,
    totalCount: state.notificationsPagination.total,

    // Pagination
    pagination: state.notificationsPagination,
    hasMore: state.notificationsPagination.hasMore,
    loadMore,

    // Loading and errors
    isLoading: state.loadingStates.notifications,
    error: state.errors.notifications,

    // Actions
    markAsRead: markNotificationRead,
    markAllAsRead: markAllNotificationsRead,
    refresh: () => fetchNotifications({ reset: true }),
  };
}

/**
 * Hook for notification badge count
 * Lightweight hook that only returns the unread count
 */
export function useNotificationBadge() {
  const { unreadCount, isLoading, refresh } = useUnifiedNotifications();

  return {
    count: unreadCount,
    isLoading,
    refresh,
  };
}

/**
 * Hook for recent notifications (e.g., for dropdown)
 * Returns only the most recent N notifications
 */
export function useRecentNotifications(limit = 5) {
  const { notifications, unreadCount, markAsRead, isLoading } = useUnifiedNotifications();

  const recentNotifications = useMemo(
    () => notifications.slice(0, limit),
    [notifications, limit]
  );

  return {
    notifications: recentNotifications,
    unreadCount,
    markAsRead,
    isLoading,
  };
}

/**
 * Hook for notifications of a specific type
 */
export function useNotificationsByType(type: string) {
  const { notificationsByType, markAsRead, isLoading } = useUnifiedNotifications();

  const notifications = useMemo(
    () => notificationsByType[type] ?? [],
    [notificationsByType, type]
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  return {
    notifications,
    unreadCount,
    markAsRead,
    isLoading,
  };
}

/**
 * Hook for auto-polling notifications
 * Useful for real-time notification updates
 *
 * @param intervalMs - Polling interval in milliseconds (default: 30 seconds)
 * @param enabled - Whether polling is enabled (default: true)
 */
export function useNotificationPolling(intervalMs = 30000, enabled = true) {
  const { refresh, isLoading } = useUnifiedNotifications();
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
      if (!isLoading) {
        refresh();
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, intervalMs, isLoading, refresh]);
}
