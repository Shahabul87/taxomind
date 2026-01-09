'use client';

import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  Clock,
  Flame,
  Trophy,
  Target,
  CheckCircle,
  BarChart,
  Lightbulb,
  Coffee,
  X,
  Check,
  ExternalLink,
  Loader2,
  Inbox,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLearningNotifications } from '@/hooks/use-learning-notifications';
import { getNotificationDisplayConfig } from '@/types/learning-notifications';
import type { LearningNotification } from '@/types/learning-notifications';
import type { LearningAlertType } from '@prisma/client';
import { cn } from '@/lib/utils';

interface NotificationsListProps {
  maxHeight?: number;
  onNotificationClick?: (notification: LearningNotification) => void;
  className?: string;
}

// Icon mapping for notification types
const NOTIFICATION_ICONS: Record<LearningAlertType, React.ElementType> = {
  REMINDER: Bell,
  DEADLINE: Clock,
  STREAK_WARNING: Flame,
  STREAK_ACHIEVEMENT: Trophy,
  GOAL_PROGRESS: Target,
  GOAL_COMPLETED: CheckCircle,
  WEEKLY_SUMMARY: BarChart,
  STUDY_SUGGESTION: Lightbulb,
  BREAK_REMINDER: Coffee,
};

function NotificationItem({
  notification,
  onMarkAsRead,
  onDismiss,
  onClick,
}: {
  notification: LearningNotification;
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onClick?: (notification: LearningNotification) => void;
}) {
  const config = getNotificationDisplayConfig(notification.type);
  const Icon = NOTIFICATION_ICONS[notification.type] || Bell;

  const handleClick = useCallback(() => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
    onClick?.(notification);
  }, [notification, onMarkAsRead, onClick]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        'group relative rounded-lg border p-3 transition-all hover:shadow-sm',
        notification.read
          ? 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
          : cn(config.bgColor, config.borderColor),
        'cursor-pointer'
      )}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <span className="absolute -left-1 top-3 h-2 w-2 rounded-full bg-blue-500" />
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            notification.read
              ? 'bg-slate-100 dark:bg-slate-800'
              : config.bgColor
          )}
        >
          <Icon
            className={cn(
              'h-4 w-4',
              notification.read
                ? 'text-slate-500 dark:text-slate-400'
                : config.textColor
            )}
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={cn(
                'text-sm font-medium leading-tight',
                notification.read
                  ? 'text-slate-700 dark:text-slate-300'
                  : 'text-slate-900 dark:text-white'
              )}
            >
              {notification.title}
            </h4>
            <Badge
              variant={notification.read ? 'outline' : config.badgeVariant}
              className="shrink-0 text-xs"
            >
              {notification.type.replace('_', ' ')}
            </Badge>
          </div>

          <p
            className={cn(
              'mt-1 line-clamp-2 text-xs',
              notification.read
                ? 'text-slate-500 dark:text-slate-400'
                : 'text-slate-600 dark:text-slate-300'
            )}
          >
            {notification.message}
          </p>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
              })}
            </span>

            {notification.actionUrl && notification.actionLabel && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = notification.actionUrl!;
                }}
              >
                {notification.actionLabel}
                <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {!notification.read && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
              title="Mark as read"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-400 hover:text-red-500"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(notification.id);
            }}
            title="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function NotificationsList({
  maxHeight = 400,
  onNotificationClick,
  className,
}: NotificationsListProps) {
  const {
    notifications,
    counts,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    dismiss,
  } = useLearningNotifications({ limit: 20 });

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        <span className="ml-2 text-sm text-slate-500">Loading notifications...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('py-8 text-center', className)}>
        <X className="mx-auto h-8 w-8 text-red-500" />
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className={cn('py-8 text-center', className)}>
        <Inbox className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
        <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-400">
          All caught up!
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          No new notifications at the moment
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      {counts.unread > 0 && (
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            {counts.unread} unread notification{counts.unread !== 1 ? 's' : ''}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsRead()}
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            <Check className="mr-1 h-3 w-3" />
            Mark all as read
          </Button>
        </div>
      )}

      {/* Notifications List */}
      <ScrollArea style={{ maxHeight: `${maxHeight}px` }}>
        <div className="space-y-2 pr-4">
          <AnimatePresence mode="popLayout">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDismiss={dismiss}
                onClick={onNotificationClick}
              />
            ))}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}
