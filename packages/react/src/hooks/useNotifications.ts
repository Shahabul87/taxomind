/**
 * @sam-ai/react - useNotifications Hook
 * Hook for managing SAM notifications
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type NotificationType =
  | 'SAM_CHECK_IN'
  | 'SAM_INTERVENTION'
  | 'SAM_MILESTONE'
  | 'SAM_RECOMMENDATION';

export type NotificationFeedback =
  | 'helpful'
  | 'not_helpful'
  | 'too_frequent'
  | 'irrelevant';

export interface SAMNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface UseNotificationsOptions {
  /** Filter by notification type */
  type?: NotificationType;
  /** Only fetch unread notifications */
  unreadOnly?: boolean;
  /** Max notifications to fetch */
  limit?: number;
  /** Enable auto-refresh interval (ms) */
  refreshInterval?: number;
  /** Disable auto-fetch on mount */
  disabled?: boolean;
}

export interface UseNotificationsReturn {
  /** List of notifications */
  notifications: SAMNotification[];
  /** Total notification count */
  total: number;
  /** Unread notification count */
  unreadCount: number;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Refresh notifications */
  refresh: () => Promise<void>;
  /** Mark notifications as read */
  markAsRead: (notificationIds: string[]) => Promise<void>;
  /** Dismiss notification with optional feedback */
  dismiss: (notificationId: string, feedback?: NotificationFeedback) => Promise<void>;
  /** Clear all read notifications */
  clearRead: () => Promise<void>;
  /** Load more notifications */
  loadMore: () => Promise<void>;
  /** Whether more notifications are available */
  hasMore: boolean;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useNotifications(
  options: UseNotificationsOptions = {}
): UseNotificationsReturn {
  const {
    type,
    unreadOnly = false,
    limit = 20,
    refreshInterval,
    disabled = false,
  } = options;

  const [notifications, setNotifications] = useState<SAMNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Use ref to track current offset without causing re-renders
  const offsetRef = useRef(0);

  // Fetch notifications - stable callback that reads offset from ref
  const fetchNotifications = useCallback(
    async (reset = true) => {
      if (disabled) return;

      setIsLoading(true);
      setError(null);

      const currentOffset = reset ? 0 : offsetRef.current;

      try {
        const params = new URLSearchParams();
        if (type) params.set('type', type);
        if (unreadOnly) params.set('unreadOnly', 'true');
        params.set('limit', String(limit));
        params.set('offset', String(currentOffset));

        const response = await fetch(
          `/api/sam/agentic/notifications?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }

        const result = await response.json();

        if (result.success) {
          const { data } = result;
          if (reset) {
            setNotifications(data.notifications);
            offsetRef.current = limit;
          } else {
            setNotifications((prev) => [...prev, ...data.notifications]);
            offsetRef.current = currentOffset + limit;
          }
          setTotal(data.pagination.total);
          setUnreadCount(data.unreadCount);
          setHasMore(data.pagination.hasMore);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    },
    [type, unreadOnly, limit, disabled]
  );

  // Mark notifications as read
  const markAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/sam/agentic/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notifications as read');
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          notificationIds.includes(n.id) ? { ...n, read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - notificationIds.length));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    }
  }, []);

  // Dismiss notification with feedback
  const dismiss = useCallback(
    async (notificationId: string, feedback?: NotificationFeedback) => {
      try {
        const response = await fetch('/api/sam/agentic/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId, feedback }),
        });

        if (!response.ok) {
          throw new Error('Failed to dismiss notification');
        }

        // Remove from local state
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        setTotal((prev) => prev - 1);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        throw err;
      }
    },
    []
  );

  // Clear all read notifications - use ref to access current unreadCount
  const unreadCountRef = useRef(unreadCount);
  unreadCountRef.current = unreadCount;

  const clearRead = useCallback(async () => {
    try {
      const response = await fetch('/api/sam/agentic/notifications', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to clear notifications');
      }

      // Remove read notifications from local state
      setNotifications((prev) => prev.filter((n) => !n.read));
      setTotal(unreadCountRef.current);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    }
  }, []);

  // Load more notifications - use ref to access current state
  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;
  const hasMoreRef = useRef(hasMore);
  hasMoreRef.current = hasMore;

  const loadMore = useCallback(async () => {
    if (!hasMoreRef.current || isLoadingRef.current) return;
    await fetchNotifications(false);
  }, [fetchNotifications]);

  // Refresh notifications
  const refresh = useCallback(async () => {
    await fetchNotifications(true);
  }, [fetchNotifications]);

  // Initial fetch - fetchNotifications is now stable
  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  // Auto-refresh interval
  useEffect(() => {
    if (!refreshInterval || disabled) return;

    const intervalId = setInterval(() => {
      fetchNotifications(true);
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, disabled, fetchNotifications]);

  return {
    notifications,
    total,
    unreadCount,
    isLoading,
    error,
    refresh,
    markAsRead,
    dismiss,
    clearRead,
    loadMore,
    hasMore,
  };
}
