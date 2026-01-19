"use client";

/**
 * NotificationsWidget
 *
 * Dashboard widget for managing SAM AI notifications.
 * Uses the useNotifications hook from @sam-ai/react package.
 *
 * Displays check-ins, interventions, milestones, and recommendations.
 */

import { useState, useCallback } from "react";
import { useNotifications } from "@sam-ai/react";
import type { SAMNotification, NotificationFeedback } from "@sam-ai/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Bell,
  BellRing,
  Trophy,
  Sparkles,
  Target,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Trash2,
  Check,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface NotificationsWidgetProps {
  compact?: boolean;
  maxVisible?: number;
  refreshInterval?: number;
  className?: string;
}

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  SAM_CHECK_IN: MessageSquare,
  SAM_INTERVENTION: AlertCircle,
  SAM_MILESTONE: Trophy,
  SAM_RECOMMENDATION: Sparkles,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  SAM_CHECK_IN: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20",
  SAM_INTERVENTION: "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20",
  SAM_MILESTONE: "border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20",
  SAM_RECOMMENDATION: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20",
};

const NOTIFICATION_ICON_COLORS: Record<string, string> = {
  SAM_CHECK_IN: "text-blue-500",
  SAM_INTERVENTION: "text-orange-500",
  SAM_MILESTONE: "text-purple-500",
  SAM_RECOMMENDATION: "text-green-500",
};

function NotificationCard({
  notification,
  compact,
  onMarkAsRead,
  onDismiss,
  onNavigate,
}: {
  notification: SAMNotification;
  compact?: boolean;
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string, feedback?: NotificationFeedback) => void;
  onNavigate: (link: string) => void;
}) {
  const [showFeedback, setShowFeedback] = useState(false);
  const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
  const colorClass = NOTIFICATION_COLORS[notification.type] || "border-gray-200 bg-gray-50";
  const iconColorClass = NOTIFICATION_ICON_COLORS[notification.type] || "text-gray-500";

  const handleFeedback = useCallback(
    (feedback: NotificationFeedback) => {
      onDismiss(notification.id, feedback);
      setShowFeedback(false);
    },
    [notification.id, onDismiss]
  );

  return (
    <div
      className={cn(
        "relative p-3 rounded-lg border transition-all",
        colorClass,
        !notification.read && "ring-2 ring-primary/20"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm", iconColorClass)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={cn("font-medium text-sm truncate", !notification.read && "font-semibold")}>
              {notification.title}
            </h4>
            {!notification.read && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                New
              </Badge>
            )}
          </div>
          {!compact && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {notification.body}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
            {notification.link && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => onNavigate(notification.link!)}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          {!notification.read && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => onMarkAsRead(notification.id)}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mark as read</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setShowFeedback(!showFeedback)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Dismiss</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Feedback options */}
      {showFeedback && (
        <div className="mt-2 pt-2 border-t flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Was this helpful?</span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => handleFeedback("helpful")}
            >
              <ThumbsUp className="h-3 w-3 mr-1" />
              Yes
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => handleFeedback("not_helpful")}
            >
              <ThumbsDown className="h-3 w-3 mr-1" />
              No
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground"
              onClick={() => handleFeedback("too_frequent")}
            >
              Too frequent
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function NotificationsWidget({
  compact = false,
  maxVisible = 5,
  refreshInterval = 60000,
  className = "",
}: NotificationsWidgetProps) {
  const [expanded, setExpanded] = useState(false);

  const {
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
  } = useNotifications({
    limit: maxVisible,
    refreshInterval,
  });

  const handleMarkAsRead = useCallback(
    async (id: string) => {
      try {
        await markAsRead([id]);
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    },
    [markAsRead]
  );

  const handleDismiss = useCallback(
    async (id: string, feedback?: NotificationFeedback) => {
      try {
        await dismiss(id, feedback);
      } catch (err) {
        console.error("Failed to dismiss notification:", err);
      }
    },
    [dismiss]
  );

  const handleNavigate = useCallback((link: string) => {
    window.location.href = link;
  }, []);

  const handleClearRead = useCallback(async () => {
    try {
      await clearRead();
    } catch (err) {
      console.error("Failed to clear read notifications:", err);
    }
  }, [clearRead]);

  const visibleNotifications = expanded ? notifications : notifications.slice(0, maxVisible);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              {unreadCount > 0 ? (
                <BellRing className="h-5 w-5 text-primary" />
              ) : (
                <Bell className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Notifications</CardTitle>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {notifications.some((n) => n.read) && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={handleClearRead}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Clear read notifications</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => refresh()}
                    disabled={isLoading}
                  >
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
            <p className="text-sm text-muted-foreground">Failed to load notifications</p>
            <Button variant="ghost" size="sm" onClick={() => refresh()} className="mt-2">
              Try again
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
            <p className="text-sm font-medium">All caught up!</p>
            <p className="text-xs text-muted-foreground mt-1">
              No new notifications at the moment
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className={cn("pr-4", expanded ? "max-h-96" : "max-h-64")}>
              <div className="space-y-3">
                {visibleNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    compact={compact}
                    onMarkAsRead={handleMarkAsRead}
                    onDismiss={handleDismiss}
                    onNavigate={handleNavigate}
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Expand/Collapse and Load More */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <div className="text-xs text-muted-foreground">
                Showing {visibleNotifications.length} of {total}
              </div>
              <div className="flex gap-2">
                {notifications.length > maxVisible && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setExpanded(!expanded)}
                  >
                    {expanded ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Show more
                      </>
                    )}
                  </Button>
                )}
                {hasMore && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => loadMore()}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "Load more"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default NotificationsWidget;
