import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  LearningNotification,
  NotificationFilters,
  NotificationCounts,
  CreateNotificationInput,
  UpdateNotificationInput,
} from "@/types/learning-notifications";
import type { LearningAlertType } from "@prisma/client";

interface UseLearningNotificationsOptions {
  filters?: NotificationFilters;
  page?: number;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
}

interface UseLearningNotificationsReturn {
  notifications: LearningNotification[];
  counts: NotificationCounts;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  isLoading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  dismiss: (id: string) => Promise<boolean>;
  createNotification: (data: CreateNotificationInput) => Promise<LearningNotification | null>;
  deleteNotification: (id: string) => Promise<boolean>;
  setPage: (page: number) => void;
  setFilters: (filters: NotificationFilters) => void;
  refresh: () => void;
}

/**
 * Hook for managing learning notifications
 */
export function useLearningNotifications(
  options: UseLearningNotificationsOptions = {}
): UseLearningNotificationsReturn {
  const {
    filters: initialFilters = {},
    page: initialPage = 1,
    limit = 10,
    autoRefresh = true,
    refreshInterval = 60000, // 1 minute default
  } = options;

  const [notifications, setNotifications] = useState<LearningNotification[]>([]);
  const [counts, setCounts] = useState<NotificationCounts>({
    total: 0,
    unread: 0,
    byType: {} as Record<LearningAlertType, number>,
  });
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFiltersState] = useState<NotificationFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Build query string from filters
  const queryString = useMemo(() => {
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
    });

    if (filters.type) params.set("type", filters.type);
    if (filters.read !== undefined) params.set("read", String(filters.read));
    if (filters.dismissed !== undefined) params.set("dismissed", String(filters.dismissed));
    if (filters.timeRange) params.set("timeRange", filters.timeRange);

    return params.toString();
  }, [pagination.page, pagination.limit, filters]);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/dashboard/learning-notifications?${queryString}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const result = await response.json();

      if (result.success) {
        // Transform dates from strings to Date objects
        const transformedNotifications = (result.data || []).map(
          (n: LearningNotification) => ({
            ...n,
            createdAt: new Date(n.createdAt),
            updatedAt: new Date(n.updatedAt),
            readAt: n.readAt ? new Date(n.readAt) : null,
            dismissedAt: n.dismissedAt ? new Date(n.dismissedAt) : null,
            scheduledFor: n.scheduledFor ? new Date(n.scheduledFor) : null,
            expiresAt: n.expiresAt ? new Date(n.expiresAt) : null,
            deliveredAt: n.deliveredAt ? new Date(n.deliveredAt) : null,
          })
        );

        setNotifications(transformedNotifications);

        if (result.metadata?.counts) {
          setCounts(result.metadata.counts);
        }

        if (result.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: result.pagination.total,
            totalPages: Math.ceil(result.pagination.total / prev.limit),
          }));
        }
      } else {
        throw new Error(result.error?.message || "Failed to fetch");
      }
    } catch (err) {
      console.error("[useLearningNotifications]", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [queryString]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchNotifications]);

  const markAsRead = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `/api/dashboard/learning-notifications/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ read: true }),
        }
      );

      if (!response.ok) throw new Error("Failed to mark as read");

      const result = await response.json();
      if (result.success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, read: true, readAt: new Date() } : n
          )
        );
        setCounts((prev) => ({
          ...prev,
          unread: Math.max(0, prev.unread - 1),
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.error("[markAsRead]", err);
      return false;
    }
  }, []);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(
        "/api/dashboard/learning-notifications/mark-all-read",
        { method: "POST" }
      );

      if (!response.ok) throw new Error("Failed to mark all as read");

      const result = await response.json();
      if (result.success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            !n.read ? { ...n, read: true, readAt: new Date() } : n
          )
        );
        setCounts((prev) => ({ ...prev, unread: 0 }));
        return true;
      }
      return false;
    } catch (err) {
      console.error("[markAllAsRead]", err);
      return false;
    }
  }, []);

  const dismiss = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `/api/dashboard/learning-notifications/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dismissed: true }),
        }
      );

      if (!response.ok) throw new Error("Failed to dismiss");

      const result = await response.json();
      if (result.success) {
        // Remove from local state
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setCounts((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.error("[dismiss]", err);
      return false;
    }
  }, []);

  const createNotification = useCallback(
    async (data: CreateNotificationInput): Promise<LearningNotification | null> => {
      try {
        const response = await fetch("/api/dashboard/learning-notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error("Failed to create notification");

        const result = await response.json();
        if (result.success && result.data) {
          // Refresh to get updated list
          fetchNotifications();
          return result.data;
        }
        return null;
      } catch (err) {
        console.error("[createNotification]", err);
        return null;
      }
    },
    [fetchNotifications]
  );

  const deleteNotification = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `/api/dashboard/learning-notifications/${id}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete");

      const result = await response.json();
      if (result.success) {
        // Remove from local state
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        setCounts((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.error("[deleteNotification]", err);
      return false;
    }
  }, []);

  const setPage = useCallback((newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  const setFilters = useCallback((newFilters: NotificationFilters) => {
    setFiltersState(newFilters);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  const refresh = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    counts,
    pagination,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    dismiss,
    createNotification,
    deleteNotification,
    setPage,
    setFilters,
    refresh,
  };
}

/**
 * Lightweight hook for just getting unread notification count
 * Useful for notification badges
 *
 * Features:
 * - Auto-refresh with configurable interval
 * - Configurable poll intervals
 */
export function useUnreadNotificationCount(options?: {
  /** Poll interval in ms. Default: 30000 (30 sec) */
  pollInterval?: number;
}): {
  count: number;
  isLoading: boolean;
  refresh: () => void;
} {
  const { pollInterval = 30000 } = options ?? {};

  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        "/api/dashboard/learning-notifications?page=1&limit=1"
      );

      if (response.ok) {
        const result = await response.json();
        if (result.metadata?.counts?.unread !== undefined) {
          setCount(result.metadata.counts.unread);
        }
      }
    } catch (err) {
      console.error("[useUnreadNotificationCount]", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, pollInterval);
    return () => clearInterval(interval);
  }, [fetchCount, pollInterval]);

  return { count, isLoading, refresh: fetchCount };
}
