import { useState, useEffect, useCallback } from "react";

export interface Notification {
  id: string;
  type:
    | "ACTIVITY_DUE"
    | "ACTIVITY_GRADED"
    | "ACTIVITY_COMPLETED"
    | "DEADLINE_APPROACHING"
    | "DEADLINE_MISSED"
    | "ACHIEVEMENT_UNLOCKED"
    | "STREAK_MILESTONE"
    | "COURSE_UPDATE"
    | "REMINDER"
    | "SYSTEM";
  category: "DONE" | "MISSED" | "UPCOMING" | "ACHIEVEMENT";
  title: string;
  description?: string;
  read: boolean;
  readAt?: Date;
  actionable: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface UseNotificationsOptions {
  category?: "DONE" | "MISSED" | "UPCOMING" | "ACHIEVEMENT";
  timeRange?: "24h" | "7d" | "30d" | "all";
  read?: boolean;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState({
    done: 0,
    missed: 0,
    upcoming: 0,
    achievements: 0,
    unread: 0,
  });

  // Destructure options to avoid object reference issues
  const { category, timeRange, read } = options;

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: "50",
        ...(category && { category }),
        ...(timeRange && { timeRange }),
        ...(read !== undefined && {
          read: read.toString(),
        }),
      });

      const response = await fetch(
        `/api/dashboard/notifications?${params.toString()}`
      );

      if (!response.ok) throw new Error("Failed to fetch notifications");

      const result = await response.json();

      if (result.success) {
        const newNotifications = result.data.map(
          (notification: Notification) => ({
            ...notification,
            readAt: notification.readAt
              ? new Date(notification.readAt)
              : undefined,
            expiresAt: notification.expiresAt
              ? new Date(notification.expiresAt)
              : undefined,
            createdAt: new Date(notification.createdAt),
            updatedAt: new Date(notification.updatedAt),
          })
        );

        setNotifications(newNotifications);

        if (result.metadata?.counts) {
          setCounts(result.metadata.counts);
        }
      } else {
        throw new Error(
          result.error?.message || "Failed to fetch notifications"
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [category, timeRange, read]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/dashboard/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });

      if (!response.ok) throw new Error("Failed to mark as read");

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, read: true, readAt: new Date() }
            : notification
        )
      );

      setCounts((prev) => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1),
      }));

      return true;
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      return false;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/dashboard/notifications/mark-all-read",
        {
          method: "PATCH",
        }
      );

      if (!response.ok) throw new Error("Failed to mark all as read");

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          read: true,
          readAt: new Date(),
        }))
      );

      setCounts((prev) => ({ ...prev, unread: 0 }));

      return true;
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      return false;
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/dashboard/notifications/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete notification");

      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== id)
      );

      return true;
    } catch (err) {
      console.error("Failed to delete notification:", err);
      return false;
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard/notifications/clear-all", {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to clear notifications");

      setNotifications((prev) => prev.filter((n) => !n.read));

      return true;
    } catch (err) {
      console.error("Failed to clear notifications:", err);
      return false;
    }
  }, []);

  return {
    notifications,
    isLoading,
    error,
    counts,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };
}
