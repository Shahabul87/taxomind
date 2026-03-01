'use client';

/**
 * NotificationInbox Component
 *
 * Displays active notifications with filtering, search, and bulk actions.
 * Features a distinctive command-center aesthetic with status indicators.
 *
 * @module components/sam/notification-center/NotificationInbox
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Bell,
  MessageSquare,
  AlertCircle,
  Trophy,
  Sparkles,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  ChevronDown,
  Clock,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  RefreshCw,
  Inbox as InboxIcon,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@sam-ai/react';
import { formatDistanceToNow } from 'date-fns';

// Notification type configuration
const NOTIFICATION_CONFIG: Record<
  string,
  {
    icon: React.ElementType;
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
  }
> = {
  SAM_CHECK_IN: {
    icon: MessageSquare,
    label: 'Check-in',
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
  },
  SAM_INTERVENTION: {
    icon: AlertCircle,
    label: 'Intervention',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  SAM_MILESTONE: {
    icon: Trophy,
    label: 'Milestone',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  SAM_RECOMMENDATION: {
    icon: Sparkles,
    label: 'Recommendation',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
  },
};

// Feedback options
const FEEDBACK_OPTIONS = [
  { value: 'helpful', label: 'Helpful', icon: ThumbsUp },
  { value: 'not_helpful', label: 'Not helpful', icon: ThumbsDown },
  { value: 'too_frequent', label: 'Too frequent', icon: Clock },
  { value: 'irrelevant', label: 'Irrelevant', icon: X },
] as const;

interface NotificationInboxProps {
  className?: string;
  maxHeight?: string;
  showHeader?: boolean;
  onNotificationClick?: (notification: unknown) => void;
}

interface SAMNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string | Date;
  metadata?: Record<string, unknown>;
}

export function NotificationInbox({
  className,
  maxHeight = '500px',
  showHeader = true,
  onNotificationClick,
}: NotificationInboxProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const storeNotifications = useNotifications(s => s.notifications);
  const notifications = useMemo(() => storeNotifications ?? [], [storeNotifications]);
  const unreadCount = useNotifications(s => s.unreadCount) ?? 0;
  const isLoading = useNotifications(s => s.isLoading);
  const markAsRead = useNotifications(s => s.markAsRead);
  const dismiss = useNotifications(s => s.dismiss);
  const clearRead = useNotifications(s => s.clearRead);
  const refresh = useNotifications(s => s.refresh);

  // Memoized filtered notifications
  const filteredNotifications = useMemo(() => {
    let result = notifications as unknown as SAMNotification[];

    // Apply type filter
    if (activeFilter) {
      result = result.filter((n: SAMNotification) => n.type === activeFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (n: SAMNotification) =>
          n.title?.toLowerCase().includes(query) ||
          n.message?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [notifications, activeFilter, searchQuery]);

  // Handlers
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refresh?.();
    setTimeout(() => setIsRefreshing(false), 500);
  }, [refresh]);

  const handleMarkAllRead = useCallback(async () => {
    const unreadIds = (notifications as unknown as SAMNotification[])
      .filter((n: SAMNotification) => !n.isRead)
      .map((n: SAMNotification) => n.id);
    if (unreadIds.length > 0) {
      await markAsRead?.(unreadIds);
    }
  }, [notifications, markAsRead]);

  const handleDismiss = useCallback(
    async (id: string, _feedback: string) => {
      await dismiss?.(id);
    },
    [dismiss]
  );

  const handleClearRead = useCallback(async () => {
    await clearRead?.();
  }, [clearRead]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const readCount = (notifications as unknown as SAMNotification[]).filter(
    (n: SAMNotification) => n.isRead
  ).length;

  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl border border-zinc-800/60 bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 shadow-2xl backdrop-blur-xl',
        className
      )}
    >
      {showHeader && (
        <div className="flex items-center justify-between border-b border-zinc-800/60 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                <Bell className="h-5 w-5 text-white" />
              </div>
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </motion.span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
                Notifications
              </h2>
              <p className="text-xs text-zinc-500">
                {unreadCount} unread
                {readCount > 0 && ` \u00B7 ${readCount} read`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="h-9 w-9 text-zinc-400 hover:text-zinc-100"
                  >
                    <RefreshCw
                      className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Refresh</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-zinc-400 hover:text-zinc-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 border-zinc-800 bg-zinc-900"
              >
                <DropdownMenuItem
                  onClick={handleMarkAllRead}
                  disabled={unreadCount === 0}
                  className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
                >
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Mark all as read
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem
                  onClick={handleClearRead}
                  disabled={readCount === 0}
                  className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear read notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-3 border-b border-zinc-800/40 px-5 py-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            ref={searchInputRef}
            placeholder="Search notifications... (\u2318K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 border-zinc-800/60 bg-zinc-900/50 pl-9 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:ring-indigo-500/20"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-9 gap-2 border-zinc-800/60 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100',
                activeFilter && 'border-indigo-500/50 bg-indigo-500/10'
              )}
            >
              <Filter className="h-3.5 w-3.5" />
              {activeFilter
                ? NOTIFICATION_CONFIG[activeFilter]?.label
                : 'All types'}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 border-zinc-800 bg-zinc-900"
          >
            <DropdownMenuItem
              onClick={() => setActiveFilter(null)}
              className={cn(
                'text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100',
                !activeFilter && 'bg-zinc-800/50'
              )}
            >
              All types
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            {Object.entries(NOTIFICATION_CONFIG).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <DropdownMenuItem
                  key={type}
                  onClick={() => setActiveFilter(type)}
                  className={cn(
                    'text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100',
                    activeFilter === type && 'bg-zinc-800/50'
                  )}
                >
                  <Icon className={cn('mr-2 h-4 w-4', config.color)} />
                  {config.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Notification List */}
      <ScrollArea style={{ maxHeight }} className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <RefreshCw className="mb-3 h-8 w-8 animate-spin" />
              <p className="text-sm">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/50">
                <InboxIcon className="h-8 w-8" />
              </div>
              <p className="mb-1 text-sm font-medium text-zinc-400">
                {searchQuery || activeFilter
                  ? 'No matching notifications'
                  : 'All caught up!'}
              </p>
              <p className="text-xs">
                {searchQuery || activeFilter
                  ? 'Try adjusting your filters'
                  : 'You have no new notifications'}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map(
                (notification: SAMNotification, index: number) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    index={index}
                    onMarkRead={() => markAsRead?.([notification.id])}
                    onDismiss={(feedback) =>
                      handleDismiss(notification.id, feedback)
                    }
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead?.([notification.id]);
                      }
                      onNotificationClick?.(notification);
                    }}
                  />
                )
              )}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Individual notification item component
interface NotificationItemProps {
  notification: SAMNotification;
  index: number;
  onMarkRead: () => void;
  onDismiss: (feedback: string) => void;
  onClick: () => void;
}

function NotificationItem({
  notification,
  index,
  onMarkRead,
  onDismiss,
  onClick,
}: NotificationItemProps) {
  const config = NOTIFICATION_CONFIG[notification.type] || {
    icon: Bell,
    label: 'Notification',
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-500/10',
    borderColor: 'border-zinc-500/30',
  };
  const Icon = config.icon;

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      className={cn(
        'group relative mb-2 cursor-pointer rounded-xl border p-4 transition-all duration-200',
        notification.isRead
          ? 'border-zinc-800/40 bg-zinc-900/30 hover:bg-zinc-800/30'
          : cn(
              'border-l-2 bg-zinc-900/60 hover:bg-zinc-800/50',
              config.borderColor
            )
      )}
      onClick={onClick}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div
          className={cn(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
            config.bgColor
          )}
        >
          <Icon className={cn('h-5 w-5', config.color)} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <h4
                className={cn(
                  'text-sm font-medium',
                  notification.isRead ? 'text-zinc-400' : 'text-zinc-100'
                )}
              >
                {notification.title}
              </h4>
              {!notification.isRead && (
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
              )}
            </div>
            <Badge
              variant="outline"
              className={cn(
                'shrink-0 border-zinc-700/50 px-2 py-0 text-[10px]',
                config.color
              )}
            >
              {config.label}
            </Badge>
          </div>

          <p
            className={cn(
              'line-clamp-2 text-sm',
              notification.isRead ? 'text-zinc-500' : 'text-zinc-400'
            )}
          >
            {notification.message}
          </p>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-zinc-600">{timeAgo}</span>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {!notification.isRead && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkRead();
                        }}
                        className="h-7 w-7 text-zinc-500 hover:text-zinc-100"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Mark as read</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <DropdownMenu>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => e.stopPropagation()}
                          className="h-7 w-7 text-zinc-500 hover:text-zinc-100"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top">Dismiss</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DropdownMenuContent
                  align="end"
                  className="w-40 border-zinc-800 bg-zinc-900"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="px-2 py-1.5 text-xs text-zinc-500">
                    Dismiss as...
                  </p>
                  {FEEDBACK_OPTIONS.map((option) => {
                    const FeedbackIcon = option.icon;
                    return (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => onDismiss(option.value)}
                        className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100"
                      >
                        <FeedbackIcon className="mr-2 h-3.5 w-3.5" />
                        {option.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default NotificationInbox;
