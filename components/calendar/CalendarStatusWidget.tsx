"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Check,
  RefreshCcw,
  AlertCircle,
  ChevronRight,
  Clock,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { toast } from "sonner";

interface CalendarStatusData {
  connected: boolean;
  integration: {
    id: string;
    googleEmail: string;
    selectedCalendarName?: string;
    status: string;
    lastSyncAt?: string;
    syncErrorCount: number;
  } | null;
}

interface CalendarStatusWidgetProps {
  className?: string;
  compact?: boolean;
}

export function CalendarStatusWidget({ className, compact = false }: CalendarStatusWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [data, setData] = useState<CalendarStatusData | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/calendar/status");
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch calendar status:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/calendar/learning-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ syncType: "incremental" }),
      });
      const result = await response.json();

      if (result.success) {
        const stats = result.data.stats;
        toast.success(
          `Synced: ${stats.eventsCreated + stats.eventsUpdated} events`
        );
        fetchStatus();
      } else {
        toast.error(result.error?.message || "Sync failed");
      }
    } catch (error) {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className={cn("animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl h-20", className)} />
    );
  }

  // Not connected - show connect prompt
  if (!data?.connected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "p-4 rounded-xl",
          "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20",
          "border border-blue-200/50 dark:border-blue-700/50",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white text-sm">
                Connect Google Calendar
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Sync your learning schedule
              </p>
            </div>
          </div>
          <Link href="/settings?tab=calendar">
            <Button size="sm" variant="outline" className="h-8">
              Connect
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  // Connected - show status
  const integration = data.integration;
  const isError = integration?.status === "ERROR" || integration?.status === "EXPIRED";
  const isSyncing = integration?.status === "SYNCING" || syncing;

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg",
          "bg-white/80 dark:bg-slate-800/80",
          "border border-slate-200/50 dark:border-slate-700/50",
          className
        )}
      >
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            isError ? "bg-red-500" : isSyncing ? "bg-blue-500 animate-pulse" : "bg-green-500"
          )}
        />
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {integration?.selectedCalendarName || "Google Calendar"}
        </span>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="ml-auto p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
        >
          <RefreshCcw className={cn("h-3 w-3 text-slate-500", syncing && "animate-spin")} />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-xl",
        isError
          ? "bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200/50 dark:border-red-700/50"
          : "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200/50 dark:border-green-700/50",
        "border",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              isError
                ? "bg-gradient-to-br from-red-500 to-orange-500"
                : "bg-gradient-to-br from-green-500 to-emerald-600"
            )}
          >
            {isError ? (
              <AlertCircle className="h-5 w-5 text-white" />
            ) : (
              <Check className="h-5 w-5 text-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-slate-900 dark:text-white text-sm">
                {integration?.selectedCalendarName || "Google Calendar"}
              </h4>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] h-5",
                  isError
                    ? "border-red-500 text-red-600"
                    : isSyncing
                    ? "border-blue-500 text-blue-600"
                    : "border-green-500 text-green-600"
                )}
              >
                {isError ? (
                  <>
                    <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
                    Error
                  </>
                ) : isSyncing ? (
                  <>
                    <RefreshCcw className="h-2.5 w-2.5 mr-0.5 animate-spin" />
                    Syncing
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                    Connected
                  </>
                )}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Clock className="h-3 w-3" />
              {integration?.lastSyncAt ? (
                <span>Last sync: {formatRelativeTime(new Date(integration.lastSyncAt))}</span>
              ) : (
                <span>Not synced yet</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={syncing}
            className="h-8"
          >
            <RefreshCcw className={cn("h-3 w-3", syncing && "animate-spin")} />
            <span className="ml-1.5">{syncing ? "Syncing..." : "Sync"}</span>
          </Button>
          <Link href="/settings?tab=calendar">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
