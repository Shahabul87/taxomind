'use client';

/**
 * ScheduledSessionsList Component
 *
 * Displays upcoming scheduled study sessions with notification controls.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  Clock,
  CalendarClock,
  Play,
  MoreHorizontal,
  Bell,
  BellOff,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { format, isToday, isTomorrow, differenceInMinutes } from 'date-fns';
import { toast } from 'sonner';
import type { ScheduledSession } from './StudySessionScheduler';

interface ScheduledSessionsListProps {
  sessions: ScheduledSession[];
  onStartSession?: (session: ScheduledSession) => void;
  onSessionUpdate?: (session: ScheduledSession) => void;
}

// Format date for display
const formatSessionDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  if (isToday(date)) {
    return `Today, ${format(date, 'h:mm a')}`;
  }
  if (isTomorrow(date)) {
    return `Tomorrow, ${format(date, 'h:mm a')}`;
  }
  return format(date, 'EEE, MMM d, h:mm a');
};

// Get time until session
const getTimeUntil = (dateStr: string): string | null => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMinutes = differenceInMinutes(date, now);

  if (diffMinutes < 0) return null;
  if (diffMinutes === 0) return 'Starting now';
  if (diffMinutes < 60) return `In ${diffMinutes} min`;
  if (diffMinutes < 120) return 'In 1 hour';
  if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60);
    return `In ${hours} hours`;
  }
  return null;
};

// Format duration
const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export function ScheduledSessionsList({
  sessions,
  onStartSession,
  onSessionUpdate,
}: ScheduledSessionsListProps) {
  const [loadingNotify, setLoadingNotify] = useState<string | null>(null);
  const togglingRef = useRef<Set<string>>(new Set());

  // Toggle notification for a session
  const handleToggleNotify = useCallback(
    async (session: ScheduledSession) => {
      // Prevent double-clicks
      if (togglingRef.current.has(session.id)) return;
      togglingRef.current.add(session.id);

      setLoadingNotify(session.id);

      try {
        const newEnabled = !session.notifyEnabled;

        const response = await fetch(
          `/api/dashboard/sessions/${session.id}/notify`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              enabled: newEnabled,
              minutesBefore: session.notifyMinutesBefore ?? 15,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to update notification');
        }

        // Update session in parent
        if (onSessionUpdate) {
          onSessionUpdate({
            ...session,
            notifyEnabled: newEnabled,
            notifyMinutesBefore: data.data?.notifyMinutesBefore ?? 15,
          });
        }

        toast.success(
          newEnabled
            ? `Reminder set for ${session.notifyMinutesBefore ?? 15} min before`
            : 'Reminder removed'
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to update notification';
        toast.error(message);
      } finally {
        setLoadingNotify(null);
        togglingRef.current.delete(session.id);
      }
    },
    [onSessionUpdate]
  );

  if (sessions.length === 0) {
    return null;
  }

  // Sort sessions by start time
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return (
    <Card className="border-0 shadow-lg bg-white dark:bg-slate-900">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          Upcoming Sessions
          <Badge
            variant="secondary"
            className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
          >
            {sessions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {sortedSessions.map((session) => {
            const timeUntil = getTimeUntil(session.startTime);
            const isStartingSoon = timeUntil && !timeUntil.includes('hour');
            const isLoadingThis = loadingNotify === session.id;
            const isPastSession = new Date(session.startTime) <= new Date();

            return (
              <div
                key={session.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border transition-all duration-200',
                  isStartingSoon
                    ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                )}
              >
                {/* Time indicator */}
                <div
                  className={cn(
                    'flex flex-col items-center justify-center min-w-[60px] p-2 rounded-lg',
                    isStartingSoon
                      ? 'bg-teal-100 dark:bg-teal-900/50'
                      : 'bg-white dark:bg-slate-900'
                  )}
                >
                  <Clock
                    className={cn(
                      'w-4 h-4 mb-1',
                      isStartingSoon
                        ? 'text-teal-600 dark:text-teal-400'
                        : 'text-slate-500 dark:text-slate-400'
                    )}
                  />
                  <span
                    className={cn(
                      'text-xs font-medium',
                      isStartingSoon
                        ? 'text-teal-700 dark:text-teal-300'
                        : 'text-slate-600 dark:text-slate-400'
                    )}
                  >
                    {formatDuration(session.duration)}
                  </span>
                </div>

                {/* Session info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-slate-900 dark:text-white truncate">
                      {session.title}
                    </h4>
                    {session.notifyEnabled && (
                      <Bell className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {formatSessionDate(session.startTime)}
                    </span>
                    {timeUntil && (
                      <Badge
                        className={cn(
                          'text-xs',
                          isStartingSoon
                            ? 'bg-teal-600 text-white'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        )}
                      >
                        {timeUntil}
                      </Badge>
                    )}
                  </div>
                  {session.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                      {session.notes}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  {/* Notify Me Button */}
                  {!isPastSession && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={isLoadingThis}
                            onClick={() => handleToggleNotify(session)}
                            className={cn(
                              'h-8 w-8 transition-colors',
                              session.notifyEnabled
                                ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                                : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                            )}
                          >
                            {isLoadingThis ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : session.notifyEnabled ? (
                              <Bell className="w-4 h-4" />
                            ) : (
                              <BellOff className="w-4 h-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {session.notifyEnabled
                            ? `Reminder on (${session.notifyMinutesBefore ?? 15} min before)`
                            : 'Click to enable reminder'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {/* Start Button */}
                  {isStartingSoon && onStartSession && (
                    <Button
                      size="sm"
                      onClick={() => onStartSession(session)}
                      className="bg-teal-600 hover:bg-teal-700 text-white"
                    >
                      <Play className="w-3.5 h-3.5 mr-1" />
                      Start
                    </Button>
                  )}

                  {/* More Options */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default ScheduledSessionsList;
