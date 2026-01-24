'use client';

/**
 * ScheduledSessionsList Component
 *
 * Displays upcoming scheduled study sessions.
 */

import React from 'react';
import {
  Clock,
  CalendarClock,
  Play,
  MoreHorizontal,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, isToday, isTomorrow, differenceInMinutes } from 'date-fns';
import type { ScheduledSession } from './StudySessionScheduler';

interface ScheduledSessionsListProps {
  sessions: ScheduledSession[];
  onStartSession?: (session: ScheduledSession) => void;
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
}: ScheduledSessionsListProps) {
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
                  <h4 className="font-medium text-slate-900 dark:text-white truncate">
                    {session.title}
                  </h4>
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
                <div className="flex items-center gap-2">
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
