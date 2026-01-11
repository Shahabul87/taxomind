'use client';

/**
 * SAM Review Schedule Calendar
 *
 * Displays upcoming spaced repetition reviews in a calendar format.
 * Uses the useSpacedRepetition hook for data and integrates with SAM&apos;s
 * memory system for intelligent review scheduling.
 *
 * Features:
 * - Monthly calendar view with review counts per day
 * - Priority-based color coding (urgent, high, medium, low)
 * - Today&apos;s reviews quick access panel
 * - Stats overview (streak, pending, retention)
 * - Compact and full view modes
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Brain,
  Flame,
  Target,
  RefreshCw,
  Loader2,
  CalendarDays,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  useSpacedRepetition,
  useReviewStats,
  type ReviewEntry,
  type ReviewPriority,
  type CalendarDay,
} from '@/hooks/use-spaced-repetition';

// ============================================================================
// TYPES
// ============================================================================

interface ReviewScheduleCalendarProps {
  className?: string;
  compact?: boolean;
  showStats?: boolean;
  showTodayPanel?: boolean;
  onReviewClick?: (review: ReviewEntry) => void;
  onDayClick?: (date: Date, reviews: ReviewEntry[]) => void;
}

interface DayData {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  reviews: ReviewEntry[];
  count: number;
  priority: ReviewPriority | null;
  calendarData?: CalendarDay;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PRIORITY_COLORS: Record<ReviewPriority, { bg: string; border: string; text: string }> = {
  urgent: {
    bg: 'bg-red-500/20',
    border: 'border-red-500',
    text: 'text-red-600 dark:text-red-400',
  },
  high: {
    bg: 'bg-orange-500/20',
    border: 'border-orange-500',
    text: 'text-orange-600 dark:text-orange-400',
  },
  medium: {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500',
    text: 'text-yellow-600 dark:text-yellow-400',
  },
  low: {
    bg: 'bg-green-500/20',
    border: 'border-green-500',
    text: 'text-green-600 dark:text-green-400',
  },
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getHighestPriority(reviews: ReviewEntry[]): ReviewPriority | null {
  if (reviews.length === 0) return null;

  const priorities: ReviewPriority[] = ['urgent', 'high', 'medium', 'low'];
  for (const priority of priorities) {
    if (reviews.some((r) => r.priority === priority)) {
      return priority;
    }
  }
  return 'low';
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function CalendarDayCell({
  day,
  onClick,
}: {
  day: DayData;
  onClick?: (date: Date, reviews: ReviewEntry[]) => void;
}) {
  const hasReviews = day.count > 0;
  const priorityColors = day.priority ? PRIORITY_COLORS[day.priority] : null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            whileHover={day.isCurrentMonth ? { scale: 1.05 } : undefined}
            whileTap={day.isCurrentMonth && hasReviews ? { scale: 0.95 } : undefined}
            onClick={() => day.isCurrentMonth && onClick?.(day.date, day.reviews)}
            className={cn(
              'relative flex h-10 w-10 flex-col items-center justify-center rounded-lg text-sm transition-all',
              !day.isCurrentMonth && 'opacity-30',
              day.isCurrentMonth && !hasReviews && 'hover:bg-slate-100 dark:hover:bg-slate-800',
              day.isToday && 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900',
              hasReviews && priorityColors?.bg,
              hasReviews && 'cursor-pointer border-l-2',
              hasReviews && priorityColors?.border
            )}
            disabled={!day.isCurrentMonth}
          >
            <span
              className={cn(
                'font-medium',
                day.isToday && 'text-blue-600 dark:text-blue-400',
                hasReviews && priorityColors?.text
              )}
            >
              {day.dayOfMonth}
            </span>
            {hasReviews && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {day.count}
              </span>
            )}
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <p className="font-semibold">{formatDate(day.date)}</p>
            {hasReviews ? (
              <>
                <p>
                  {day.count} review{day.count > 1 ? 's' : ''} scheduled
                </p>
                {day.priority && (
                  <p className="capitalize">Priority: {day.priority}</p>
                )}
                {day.reviews.slice(0, 3).map((r) => (
                  <p key={r.id} className="text-slate-400">
                    • {r.conceptName ?? r.conceptId}
                  </p>
                ))}
                {day.reviews.length > 3 && (
                  <p className="text-slate-400">
                    +{day.reviews.length - 3} more
                  </p>
                )}
              </>
            ) : (
              <p className="text-slate-400">No reviews scheduled</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function TodayReviewPanel({
  reviews,
  onReviewClick,
}: {
  reviews: ReviewEntry[];
  onReviewClick?: (review: ReviewEntry) => void;
}) {
  if (reviews.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 p-4 dark:from-emerald-950/30 dark:to-teal-950/30"
      >
        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
          All caught up!
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          No reviews due today
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-semibold">
          <CalendarDays className="h-4 w-4 text-blue-500" />
          Today&apos;s Reviews
        </h4>
        <Badge variant="secondary">{reviews.length}</Badge>
      </div>
      <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
        {reviews.map((review, index) => (
          <motion.button
            key={review.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onReviewClick?.(review)}
            className={cn(
              'w-full rounded-lg border p-2 text-left transition-all hover:shadow-sm',
              'bg-white dark:bg-slate-800',
              'border-slate-200 dark:border-slate-700',
              'hover:border-blue-300 dark:hover:border-blue-700'
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                  {review.conceptName ?? review.conceptId}
                </p>
                {review.courseTitle && (
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {review.courseTitle}
                  </p>
                )}
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'shrink-0 text-[10px]',
                  PRIORITY_COLORS[review.priority].text
                )}
              >
                {review.priority}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-3 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Brain className="h-3 w-3" />
                {Math.round(review.retentionEstimate)}% retention
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Rep #{review.repetitions}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function StatsOverview({
  stats,
  loading,
}: {
  stats: ReturnType<typeof useReviewStats>;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
        className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500">
          <AlertTriangle className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            {stats.overdueCount}
          </p>
          <p className="text-[10px] text-slate-500">Overdue</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
          <Target className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            {stats.dueTodayCount}
          </p>
          <p className="text-[10px] text-slate-500">Due Today</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
          <Flame className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            {stats.stats?.streakDays ?? 0}
          </p>
          <p className="text-[10px] text-slate-500">Day Streak</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500">
          <Brain className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            {Math.round(stats.averageRetention)}%
          </p>
          <p className="text-[10px] text-slate-500">Retention</p>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ReviewScheduleCalendar({
  className,
  compact = false,
  showStats = true,
  showTodayPanel = true,
  onReviewClick,
  onDayClick,
}: ReviewScheduleCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data, loading, error, refresh, getReviewsForDate, isStale } = useSpacedRepetition({
    status: 'all',
    limit: 100, // Get enough reviews to populate calendar
  });

  const reviewStats = useReviewStats();

  // Navigate months
  const handlePrevMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }, [currentMonth]);

  const handleNextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }, [currentMonth]);

  const handleToday = useCallback(() => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  }, [today]);

  // Generate calendar days
  const calendarDays = useMemo((): DayData[] => {
    const days: DayData[] = [];
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const dayOfMonth = prevMonthDays - i;
      const date = new Date(currentYear, currentMonth - 1, dayOfMonth);
      const reviews = getReviewsForDate(date);
      days.push({
        date,
        dayOfMonth,
        isCurrentMonth: false,
        isToday: false,
        reviews,
        count: reviews.length,
        priority: getHighestPriority(reviews),
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const reviews = getReviewsForDate(date);
      days.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: true,
        isToday: isSameDay(date, today),
        reviews,
        count: reviews.length,
        priority: getHighestPriority(reviews),
      });
    }

    // Next month days (fill remaining cells)
    const totalCells = Math.ceil(days.length / 7) * 7;
    let nextMonthDay = 1;
    while (days.length < totalCells) {
      const date = new Date(currentYear, currentMonth + 1, nextMonthDay);
      const reviews = getReviewsForDate(date);
      days.push({
        date,
        dayOfMonth: nextMonthDay,
        isCurrentMonth: false,
        isToday: false,
        reviews,
        count: reviews.length,
        priority: getHighestPriority(reviews),
      });
      nextMonthDay++;
    }

    return days;
  }, [currentYear, currentMonth, today, getReviewsForDate]);

  // Today&apos;s reviews
  const todaysReviews = useMemo(() => {
    return getReviewsForDate(today);
  }, [today, getReviewsForDate]);

  // Handle day click
  const handleDayClick = useCallback(
    (date: Date, reviews: ReviewEntry[]) => {
      setSelectedDate(date);
      onDayClick?.(date, reviews);
    },
    [onDayClick]
  );

  // Compact view
  if (compact) {
    return (
      <Card className={cn('border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-purple-500" />
            Review Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {reviewStats.overdueCount}
                    </span>
                    <span className="text-xs text-slate-500">overdue</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {reviewStats.dueTodayCount}
                    </span>
                    <span className="text-xs text-slate-500">today</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-xs">
                  View All
                </Button>
              </div>
              <Progress
                value={
                  reviewStats.totalPending > 0
                    ? ((reviewStats.totalPending - reviewStats.overdueCount) / reviewStats.totalPending) * 100
                    : 100
                }
                className="h-2"
              />
              <p className="text-xs text-slate-500">
                {reviewStats.totalPending} reviews pending
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full view
  return (
    <Card className={cn('border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-purple-500" />
            Review Schedule
          </CardTitle>
          <div className="flex items-center gap-2">
            {isStale && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => refresh()}
                    >
                      <RefreshCw className="h-4 w-4 text-amber-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Data may be outdated. Click to refresh.</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={handleToday}
            >
              Today
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8">
            <AlertTriangle className="h-8 w-8 text-red-400" />
            <p className="text-sm text-red-500">{error}</p>
            <Button variant="outline" size="sm" onClick={() => refresh()}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            {showStats && (
              <StatsOverview stats={reviewStats} loading={loading} />
            )}

            {/* Calendar Navigation */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              ) : (
                <div className="min-w-[280px]">
                  {/* Weekday headers */}
                  <div className="mb-2 grid grid-cols-7 gap-1">
                    {WEEKDAYS.map((day) => (
                      <div
                        key={day}
                        className="flex h-8 items-center justify-center text-xs font-medium text-slate-500 dark:text-slate-400"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar days */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => (
                      <CalendarDayCell
                        key={`${day.date.toISOString()}-${index}`}
                        day={day}
                        onClick={handleDayClick}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
              {Object.entries(PRIORITY_COLORS).map(([priority, colors]) => (
                <div key={priority} className="flex items-center gap-1">
                  <div
                    className={cn('h-3 w-3 rounded border-l-2', colors.bg, colors.border)}
                  />
                  <span className="capitalize">{priority}</span>
                </div>
              ))}
            </div>

            {/* Today&apos;s Reviews Panel */}
            {showTodayPanel && (
              <TodayReviewPanel
                reviews={todaysReviews}
                onReviewClick={onReviewClick}
              />
            )}

            {/* Selected Date Reviews */}
            <AnimatePresence>
              {selectedDate && !isSameDay(selectedDate, today) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-2 text-sm font-semibold">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      {formatDate(selectedDate)}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => setSelectedDate(null)}
                    >
                      Clear
                    </Button>
                  </div>
                  {getReviewsForDate(selectedDate).length > 0 ? (
                    <div className="max-h-32 space-y-1 overflow-y-auto">
                      {getReviewsForDate(selectedDate).map((review) => (
                        <button
                          key={review.id}
                          onClick={() => onReviewClick?.(review)}
                          className="flex w-full items-center justify-between rounded p-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <span className="truncate">
                            {review.conceptName ?? review.conceptId}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn('text-[10px]', PRIORITY_COLORS[review.priority].text)}
                          >
                            {review.priority}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-sm text-slate-400">
                      No reviews scheduled
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default ReviewScheduleCalendar;
