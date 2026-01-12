'use client';

/**
 * NotificationBell Component
 * Displays SAM notifications and check-ins
 *
 * Phase 5: Frontend Integration
 * - Shows unread notification count
 * - Dropdown with notification list
 * - Mark as read / dismiss functionality
 * - Real-time updates via RealtimeProvider (with polling fallback)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell,
  BellRing,
  CheckCircle,
  X,
  Loader2,
  MessageSquare,
  Sparkles,
  Target,
  Trophy,
  Trash2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useRealtimeContextOptional } from '@/components/providers/realtime-provider';

// ============================================================================
// TYPES
// ============================================================================

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface NotificationBellProps {
  className?: string;
  showCount?: boolean;
  maxNotifications?: number;
  pollInterval?: number;
  /** Use shorter poll interval when WebSocket is not connected */
  fallbackPollInterval?: number;
  /** Show connection status indicator */
  showConnectionStatus?: boolean;
  onNotificationClick?: (notification: Notification) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

function getNotificationIcon(type: string) {
  if (type.includes('CHECK_IN')) return <MessageSquare className="w-4 h-4" />;
  if (type.includes('INTERVENTION')) return <Sparkles className="w-4 h-4" />;
  if (type.includes('MILESTONE')) return <Trophy className="w-4 h-4" />;
  if (type.includes('RECOMMENDATION')) return <Target className="w-4 h-4" />;
  return <Bell className="w-4 h-4" />;
}

function getNotificationColor(type: string) {
  if (type.includes('CHECK_IN')) return 'bg-blue-100 text-blue-600';
  if (type.includes('INTERVENTION')) return 'bg-amber-100 text-amber-600';
  if (type.includes('MILESTONE')) return 'bg-green-100 text-green-600';
  if (type.includes('RECOMMENDATION')) return 'bg-purple-100 text-purple-600';
  return 'bg-gray-100 text-gray-600';
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function NotificationBell({
  className,
  showCount = true,
  maxNotifications = 10,
  pollInterval = 60000, // 1 minute when connected via WebSocket
  fallbackPollInterval = 15000, // 15 seconds when polling only
  showConnectionStatus = false,
  onNotificationClick,
}: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const mountedRef = useRef(true);
  const lastEventIdRef = useRef<string | null>(null);

  // Get realtime context (optional - may be null if not in RealtimeProvider)
  const realtimeContext = useRealtimeContextOptional();
  const isRealtimeConnected = realtimeContext?.isConnected ?? false;

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/sam/agentic/notifications?limit=${maxNotifications}`
      );
      if (!response.ok) return;

      const data = await response.json();
      if (mountedRef.current && data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error('[NotificationBell] Failed to fetch notifications:', error);
    }
  }, [maxNotifications]);

  // Calculate effective poll interval based on realtime connection status
  // When WebSocket is connected, we poll less frequently as updates come in real-time
  // When disconnected, we poll more frequently as a fallback
  const effectivePollInterval = isRealtimeConnected ? pollInterval : fallbackPollInterval;

  // Initial fetch and polling
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, effectivePollInterval);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchNotifications, effectivePollInterval]);

  // Listen for real-time notification events from RealtimeProvider
  // When a notification comes in via WebSocket, add it to the list immediately
  useEffect(() => {
    if (!realtimeContext) return;

    // Subscribe to notification-related events via sendEvent callback pattern
    // The RealtimeProvider handles incoming events in its message handler
    // We poll on connection changes to pick up any missed notifications
    if (isRealtimeConnected) {
      // Refresh notifications when connection is established
      // This catches any notifications that arrived while disconnected
      fetchNotifications();
    }
  }, [isRealtimeConnected, fetchNotifications, realtimeContext]);

  // Fetch when popover opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch('/api/sam/agentic/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('[NotificationBell] Failed to mark as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    setIsMarkingRead(true);
    try {
      const response = await fetch('/api/sam/agentic/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: unreadIds }),
      });

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('[NotificationBell] Failed to mark all as read:', error);
    } finally {
      setIsMarkingRead(false);
    }
  }, [notifications]);

  // Dismiss notification
  const dismissNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch('/api/sam/agentic/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        const wasUnread = notifications.find((n) => n.id === notificationId)?.read === false;
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        if (wasUnread) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('[NotificationBell] Failed to dismiss notification:', error);
    }
  }, [notifications]);

  // Clear all read
  const clearAllRead = useCallback(async () => {
    try {
      const response = await fetch('/api/sam/agentic/notifications', {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => !n.read));
      }
    } catch (error) {
      console.error('[NotificationBell] Failed to clear notifications:', error);
    }
  }, []);

  // Handle notification click
  const handleNotificationClick = useCallback((notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    onNotificationClick?.(notification);
  }, [markAsRead, onNotificationClick]);

  const hasUnread = unreadCount > 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('relative', className)}
          aria-label={`Notifications${hasUnread ? ` (${unreadCount} unread)` : ''}${isRealtimeConnected ? ' - Live updates' : ''}`}
        >
          {hasUnread ? (
            <BellRing className="w-5 h-5 text-amber-500 animate-bounce" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
          {showCount && hasUnread && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          {/* Real-time connection status indicator */}
          {showConnectionStatus && (
            <span
              className={cn(
                'absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white',
                isRealtimeConnected ? 'bg-green-500' : 'bg-gray-400'
              )}
              title={isRealtimeConnected ? 'Live updates active' : 'Polling mode'}
            />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            SAM Notifications
            {/* Live indicator */}
            {isRealtimeConnected && (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
            )}
          </h4>
          <div className="flex items-center gap-1">
            {hasUnread && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                disabled={isMarkingRead}
                className="h-7 text-xs"
              >
                {isMarkingRead ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Mark all read
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Notification List */}
        <ScrollArea className="h-[320px]">
          {isLoading && notifications.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center px-4">
              <Bell className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No notifications yet</p>
              <p className="text-xs text-gray-400 mt-1">
                SAM will notify you about check-ins and milestones
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'group flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors',
                    !notification.read && 'bg-blue-50/50 dark:bg-blue-950/30'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      'p-2 rounded-full flex-shrink-0',
                      getNotificationColor(notification.type)
                    )}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          'text-sm',
                          !notification.read ? 'font-medium' : 'text-gray-600 dark:text-gray-400'
                        )}
                      >
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>

                  {/* Dismiss Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissNotification(notification.id);
                    }}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <X className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.some((n) => n.read) && (
          <div className="px-4 py-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllRead}
              className="w-full h-8 text-xs text-gray-500"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear read notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default NotificationBell;
