"use client";

import { useState, useEffect, useCallback } from "react";
import type { SyncSettings, GoogleCalendar, CalendarIntegration } from "@/types/google-calendar";

interface CalendarStatusResponse {
  connected: boolean;
  integration: CalendarIntegration | null;
  calendars: GoogleCalendar[];
  recentSyncs: Array<{
    id: string;
    syncType: string;
    status: string;
    eventsCreated: number;
    eventsUpdated: number;
    eventsDeleted: number;
    eventsFailed: number;
    startedAt: string;
    completedAt: string;
    durationMs: number;
    errorMessage?: string;
  }>;
}

interface SyncResult {
  success: boolean;
  stats?: {
    eventsCreated: number;
    eventsUpdated: number;
    eventsDeleted: number;
    eventsFailed: number;
  };
  durationMs?: number;
  errors?: Array<{ entityId: string; entityType: string; error: string }>;
  error?: string;
}

interface UseCalendarSyncOptions {
  autoFetch?: boolean;
  refreshInterval?: number;
}

export function useCalendarSync(options: UseCalendarSyncOptions = {}) {
  const { autoFetch = true, refreshInterval } = options;

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CalendarStatusResponse | null>(null);

  // Fetch calendar status
  const fetchStatus = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/calendar/status");
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error?.message || "Failed to fetch calendar status");
      }
    } catch (err) {
      setError("Failed to fetch calendar status");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchStatus();
    }
  }, [autoFetch, fetchStatus]);

  // Optional refresh interval
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(fetchStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, fetchStatus]);

  // Connect to Google Calendar
  const connect = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch("/api/calendar/auth");
      const result = await response.json();

      if (result.success && result.data?.authUrl) {
        return result.data.authUrl;
      } else {
        throw new Error(result.error?.message || "Failed to get auth URL");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
      return null;
    }
  }, []);

  // Disconnect from Google Calendar
  const disconnect = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/calendar/status", {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        setData(null);
        return true;
      } else {
        throw new Error(result.error?.message || "Failed to disconnect");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
      return false;
    }
  }, []);

  // Trigger sync
  const sync = useCallback(
    async (options: {
      syncType?: "full" | "incremental" | "specific";
      entityTypes?: string[];
      entityIds?: string[];
      dateRange?: { start?: string; end?: string };
    } = {}): Promise<SyncResult> => {
      setSyncing(true);
      try {
        const response = await fetch("/api/calendar/learning-sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            syncType: options.syncType || "incremental",
            entityTypes: options.entityTypes,
            entityIds: options.entityIds,
            dateRange: options.dateRange,
          }),
        });
        const result = await response.json();

        if (result.success) {
          // Refresh status after sync
          await fetchStatus();
          return {
            success: true,
            stats: result.data.stats,
            durationMs: result.data.durationMs,
            errors: result.data.errors,
          };
        } else {
          return {
            success: false,
            error: result.error?.message || "Sync failed",
          };
        }
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : "Sync failed",
        };
      } finally {
        setSyncing(false);
      }
    },
    [fetchStatus]
  );

  // Update settings
  const updateSettings = useCallback(
    async (settings: Partial<SyncSettings>): Promise<boolean> => {
      setSavingSettings(true);
      try {
        const response = await fetch("/api/calendar/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        });
        const result = await response.json();

        if (result.success) {
          // Refresh status to get updated settings
          await fetchStatus();
          return true;
        } else {
          throw new Error(result.error?.message || "Failed to update settings");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update settings");
        return false;
      } finally {
        setSavingSettings(false);
      }
    },
    [fetchStatus]
  );

  return {
    // State
    loading,
    syncing,
    savingSettings,
    error,

    // Data
    connected: data?.connected ?? false,
    integration: data?.integration ?? null,
    calendars: data?.calendars ?? [],
    recentSyncs: data?.recentSyncs ?? [],
    settings: data?.integration?.settings ?? null,

    // Actions
    fetchStatus,
    connect,
    disconnect,
    sync,
    updateSettings,
  };
}
