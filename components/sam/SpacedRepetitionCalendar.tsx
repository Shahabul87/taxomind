'use client';

/**
 * SpacedRepetitionCalendar Component
 *
 * A beautiful calendar-based view for managing spaced repetition reviews.
 * Uses the SM-2 algorithm for optimal memory retention scheduling.
 *
 * Features:
 * - Visual calendar with review density heatmap
 * - Priority-based color coding (urgent, high, medium, low)
 * - Quick review submission with score input
 * - Statistics dashboard
 * - Responsive design
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Brain,
  Clock,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Star,
  Sparkles,
  BookOpen,
  RotateCcw,
  Flame,
  Trophy,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  useSpacedRepetition,
  type ReviewEntry,
  type ReviewPriority,
  type ReviewStatus,
} from '@/hooks/use-spaced-repetition';

// ============================================================================
// TYPES
// ============================================================================

interface SpacedRepetitionCalendarProps {
  className?: string;
  compact?: boolean;
  showStats?: boolean;
  showCalendar?: boolean;
  showReviewList?: boolean;
  maxReviews?: number;
  onReviewComplete?: (conceptId: string, score: number) => void;
}

interface CalendarDayProps {
  date: Date;
  reviews: ReviewEntry[];
  isToday: boolean;
  isSelected: boolean;
  isCurrentMonth: boolean;
  onClick: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PRIORITY_COLORS: Record<ReviewPriority, { bg: string; text: string; border: string }> = {
  urgent: {
    bg: 'bg-red-500/20 dark:bg-red-500/30',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-500/50',
  },
  high: {
    bg: 'bg-orange-500/20 dark:bg-orange-500/30',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-500/50',
  },
  medium: {
    bg: 'bg-blue-500/20 dark:bg-blue-500/30',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-500/50',
  },
  low: {
    bg: 'bg-slate-500/10 dark:bg-slate-500/20',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-400/30',
  },
};

const SCORE_LABELS = [
  { score: 0, label: 'Complete Blackout', emoji: '😰', color: 'bg-red-500' },
  { score: 1, label: 'Incorrect', emoji: '😟', color: 'bg-red-400' },
  { score: 2, label: 'Incorrect, Easy to Recall', emoji: '😐', color: 'bg-orange-400' },
  { score: 3, label: 'Correct with Difficulty', emoji: '🙂', color: 'bg-yellow-400' },
  { score: 4, label: 'Correct with Hesitation', emoji: '😊', color: 'bg-green-400' },
  { score: 5, label: 'Perfect Recall', emoji: '🎉', color: 'bg-green-500' },
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Add days from previous month to fill first week
  const startDay = firstDay.getDay();
  for (let i = startDay - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }

  // Add all days of current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  // Add days from next month to fill last week
  const remainingDays = 42 - days.length; // 6 weeks * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function PriorityBadge({ priority }: { priority: ReviewPriority }) {
  const colors = PRIORITY_COLORS[priority];
  const icons: Record<ReviewPriority, React.ReactNode> = {
    urgent: <AlertTriangle className="w-3 h-3" />,
    high: <Flame className="w-3 h-3" />,
    medium: <Clock className="w-3 h-3" />,
    low: <CheckCircle2 className="w-3 h-3" />,
  };

  return (
    <Badge className={cn('text-xs gap-1', colors.bg, colors.text)}>
      {icons[priority]}
      {priority}
    </Badge>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}) {
  const colorClasses = {
    blue: 'from-blue-500/10 to-blue-600/5 border-blue-500/20',
    green: 'from-green-500/10 to-green-600/5 border-green-500/20',
    orange: 'from-orange-500/10 to-orange-600/5 border-orange-500/20',
    red: 'from-red-500/10 to-red-600/5 border-red-500/20',
    purple: 'from-purple-500/10 to-purple-600/5 border-purple-500/20',
  };

  const iconColors = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    orange: 'text-orange-500',
    red: 'text-red-500',
    purple: 'text-purple-500',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border bg-gradient-to-br p-4',
        colorClasses[color]
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={cn('p-2 rounded-lg bg-background/50', iconColors[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && (
        <div className="absolute bottom-2 right-2">
          <TrendingUp
            className={cn(
              'w-4 h-4',
              trend === 'up' && 'text-green-500',
              trend === 'down' && 'text-red-500 rotate-180',
              trend === 'neutral' && 'text-muted-foreground rotate-90'
            )}
          />
        </div>
      )}
    </div>
  );
}

function CalendarDay({ date, reviews, isToday, isSelected, isCurrentMonth, onClick }: CalendarDayProps) {
  const hasReviews = reviews.length > 0;
  const highestPriority = reviews.reduce<ReviewPriority>((highest, review) => {
    const priorityOrder: Record<ReviewPriority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
    return priorityOrder[review.priority] > priorityOrder[highest] ? review.priority : highest;
  }, 'low');

  const priorityColors = hasReviews ? PRIORITY_COLORS[highestPriority] : null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              'relative w-full aspect-square p-1 rounded-lg transition-all duration-200',
              'hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50',
              isSelected && 'ring-2 ring-primary bg-primary/10',
              isToday && !isSelected && 'ring-2 ring-primary/50',
              !isCurrentMonth && 'opacity-40'
            )}
          >
            <span
              className={cn(
                'text-sm font-medium',
                isToday && 'text-primary font-bold',
                !isCurrentMonth && 'text-muted-foreground'
              )}
            >
              {date.getDate()}
            </span>

            {hasReviews && (
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                {reviews.length <= 3 ? (
                  reviews.map((_, i) => (
                    <div
                      key={i}
                      className={cn('w-1.5 h-1.5 rounded-full', priorityColors?.bg || 'bg-muted')}
                    />
                  ))
                ) : (
                  <>
                    <div className={cn('w-1.5 h-1.5 rounded-full', priorityColors?.bg)} />
                    <div className={cn('w-1.5 h-1.5 rounded-full', priorityColors?.bg)} />
                    <span className={cn('text-[10px] font-bold', priorityColors?.text)}>
                      +{reviews.length - 2}
                    </span>
                  </>
                )}
              </div>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-medium">{formatDate(date)}</p>
          {hasReviews ? (
            <p className="text-sm text-muted-foreground">
              {reviews.length} review{reviews.length !== 1 ? 's' : ''} scheduled
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No reviews scheduled</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ReviewCard({
  review,
  onStartReview,
}: {
  review: ReviewEntry;
  onStartReview: (review: ReviewEntry) => void;
}) {
  const colors = PRIORITY_COLORS[review.priority];

  return (
    <div
      className={cn(
        'group relative p-4 rounded-xl border transition-all duration-200',
        'hover:shadow-md hover:border-primary/30',
        colors.border,
        review.isOverdue && 'animate-pulse-subtle'
      )}
    >
      {/* Priority Indicator */}
      <div className={cn('absolute top-0 left-0 w-1 h-full rounded-l-xl', colors.bg)} />

      <div className="flex items-start justify-between gap-4 ml-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium truncate">{review.conceptName}</h4>
            <PriorityBadge priority={review.priority} />
          </div>

          {review.courseTitle && (
            <p className="text-sm text-muted-foreground truncate">{review.courseTitle}</p>
          )}

          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <RotateCcw className="w-3 h-3" />
              {review.repetitions} reviews
            </span>
            <span className="flex items-center gap-1">
              <Brain className="w-3 h-3" />
              {Math.round(review.retentionEstimate)}% retention
            </span>
            {review.isOverdue && (
              <span className="flex items-center gap-1 text-red-500">
                <AlertTriangle className="w-3 h-3" />
                {Math.abs(review.daysUntilReview)} days overdue
              </span>
            )}
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => onStartReview(review)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Sparkles className="w-4 h-4 mr-1" />
          Review
        </Button>
      </div>

      {/* Retention Progress */}
      <div className="mt-3 ml-2">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">Memory Strength</span>
          <span className="font-medium">{Math.round(review.retentionEstimate)}%</span>
        </div>
        <Progress
          value={review.retentionEstimate}
          className={cn(
            'h-1.5',
            review.retentionEstimate < 30 && '[&>div]:bg-red-500',
            review.retentionEstimate >= 30 && review.retentionEstimate < 70 && '[&>div]:bg-orange-500',
            review.retentionEstimate >= 70 && '[&>div]:bg-green-500'
          )}
        />
      </div>
    </div>
  );
}

function ReviewModal({
  review,
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  review: ReviewEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (score: number) => void;
  submitting: boolean;
}) {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);

  const handleSubmit = () => {
    if (selectedScore !== null) {
      onSubmit(selectedScore);
      setSelectedScore(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Review: {review?.conceptName}
          </DialogTitle>
          <DialogDescription>
            Rate how well you remembered this concept. Your rating helps optimize your learning
            schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="grid grid-cols-2 gap-2">
            {SCORE_LABELS.map(({ score, label, emoji, color }) => (
              <button
                key={score}
                onClick={() => setSelectedScore(score)}
                className={cn(
                  'p-3 rounded-xl border-2 transition-all duration-200',
                  'hover:scale-105 active:scale-95',
                  selectedScore === score
                    ? 'border-primary bg-primary/10 shadow-lg'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{emoji}</span>
                  <div className="text-left">
                    <div className="font-medium text-sm">{score}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                </div>
                <div className={cn('h-1 rounded-full mt-2', color)} />
              </button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={selectedScore === null || submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Submit Review
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SpacedRepetitionCalendar({
  className,
  compact = false,
  showStats = true,
  showCalendar = true,
  showReviewList = true,
  maxReviews = 10,
  onReviewComplete,
}: SpacedRepetitionCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [activeReview, setActiveReview] = useState<ReviewEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data, loading, error, refresh, submitReview, status, setStatus } = useSpacedRepetition({
    status: 'week',
    limit: maxReviews,
    refreshInterval: 5 * 60 * 1000, // 5 minutes
  });

  // Calendar days
  const calendarDays = useMemo(
    () => getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth()),
    [currentMonth]
  );

  const today = new Date();

  // Reviews for selected date
  const selectedDateReviews = useMemo(() => {
    if (!data?.reviews) return [];
    return data.reviews.filter((r) => isSameDay(new Date(r.nextReviewDate), selectedDate));
  }, [data?.reviews, selectedDate]);

  // Navigation handlers
  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  }, []);

  // Review handlers
  const handleStartReview = useCallback((review: ReviewEntry) => {
    setActiveReview(review);
    setReviewModalOpen(true);
  }, []);

  const handleSubmitReview = useCallback(
    async (score: number) => {
      if (!activeReview) return;

      setSubmitting(true);
      try {
        const result = await submitReview(activeReview.conceptId, score);
        setSuccessMessage(result.message);
        onReviewComplete?.(activeReview.conceptId, score);
        setReviewModalOpen(false);
        setActiveReview(null);

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        console.error('Failed to submit review:', err);
      } finally {
        setSubmitting(false);
      }
    },
    [activeReview, submitReview, onReviewComplete]
  );

  // Get reviews for calendar day
  const getReviewsForDay = useCallback(
    (date: Date): ReviewEntry[] => {
      if (!data?.reviews) return [];
      return data.reviews.filter((r) => isSameDay(new Date(r.nextReviewDate), date));
    },
    [data?.reviews]
  );

  // Loading state
  if (loading && !data) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader>
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="h-4 w-32 bg-muted rounded mt-2" />
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('border-red-200 dark:border-red-800', className)}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <XCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="font-medium text-lg mb-2">Failed to Load Reviews</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={refresh} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = data?.stats;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-300 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Stats Section */}
      {showStats && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Due Today"
            value={stats.dueTodayCount}
            subtitle={stats.dueTodayCount === 0 ? 'All caught up!' : 'reviews pending'}
            icon={CalendarIcon}
            color={stats.dueTodayCount > 0 ? 'orange' : 'green'}
          />
          <StatCard
            title="Overdue"
            value={stats.overdueCount}
            subtitle={stats.overdueCount > 0 ? 'need attention' : 'great job!'}
            icon={AlertTriangle}
            color={stats.overdueCount > 0 ? 'red' : 'green'}
          />
          <StatCard
            title="This Week"
            value={stats.dueThisWeekCount}
            subtitle="total reviews"
            icon={Target}
            color="blue"
          />
          <StatCard
            title="Avg Retention"
            value={`${Math.round(stats.averageRetention)}%`}
            subtitle="memory strength"
            icon={Brain}
            color={stats.averageRetention >= 70 ? 'green' : 'orange'}
            trend={stats.averageRetention >= 70 ? 'up' : 'down'}
          />
        </div>
      )}

      <div className={cn('grid gap-6', showCalendar && showReviewList && 'lg:grid-cols-2')}>
        {/* Calendar Section */}
        {showCalendar && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <h3 className="font-semibold text-lg">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-2">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, index) => (
                  <CalendarDay
                    key={index}
                    date={date}
                    reviews={getReviewsForDay(date)}
                    isToday={isSameDay(date, today)}
                    isSelected={isSameDay(date, selectedDate)}
                    isCurrentMonth={date.getMonth() === currentMonth.getMonth()}
                    onClick={() => setSelectedDate(date)}
                  />
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t">
                {Object.entries(PRIORITY_COLORS).map(([priority, colors]) => (
                  <div key={priority} className="flex items-center gap-1.5 text-xs">
                    <div className={cn('w-3 h-3 rounded-full', colors.bg)} />
                    <span className="capitalize text-muted-foreground">{priority}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews List Section */}
        {showReviewList && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    {isSameDay(selectedDate, today)
                      ? "Today's Reviews"
                      : `Reviews for ${selectedDate.toLocaleDateString()}`}
                  </CardTitle>
                  <CardDescription>
                    {selectedDateReviews.length} review
                    {selectedDateReviews.length !== 1 ? 's' : ''} scheduled
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={refresh}>
                  <RotateCcw className={cn('w-4 h-4', loading && 'animate-spin')} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {selectedDateReviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                    <Trophy className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="font-medium text-lg mb-2">No Reviews Scheduled</h3>
                  <p className="text-sm text-muted-foreground">
                    {isSameDay(selectedDate, today)
                      ? 'Great job! You&apos;re all caught up for today.'
                      : 'No reviews scheduled for this date.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {selectedDateReviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      onStartReview={handleStartReview}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Review Modal */}
      <ReviewModal
        review={activeReview}
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        onSubmit={handleSubmitReview}
        submitting={submitting}
      />
    </div>
  );
}

// ============================================================================
// COMPACT VERSION
// ============================================================================

export function SpacedRepetitionWidget({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { data, loading } = useSpacedRepetition({
    status: 'today',
    limit: 5,
  });

  if (loading && !data) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardContent className="pt-6">
          <div className="h-20 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const overdueCount = data?.stats.overdueCount ?? 0;
  const todayCount = data?.stats.dueTodayCount ?? 0;
  const totalPending = overdueCount + todayCount;

  return (
    <>
      <Card
        className={cn('cursor-pointer hover:shadow-md transition-shadow', className)}
        onClick={() => setIsOpen(true)}
      >
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  totalPending > 0 ? 'bg-orange-500/10' : 'bg-green-500/10'
                )}
              >
                <Brain
                  className={cn('w-6 h-6', totalPending > 0 ? 'text-orange-500' : 'text-green-500')}
                />
              </div>
              <div>
                <h3 className="font-semibold">Spaced Repetition</h3>
                <p className="text-sm text-muted-foreground">
                  {totalPending > 0
                    ? `${totalPending} review${totalPending !== 1 ? 's' : ''} pending`
                    : 'All caught up!'}
                </p>
              </div>
            </div>
            {overdueCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="w-3 h-3" />
                {overdueCount} overdue
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Spaced Repetition Calendar
            </DialogTitle>
            <DialogDescription>
              Review your concepts at optimal intervals for maximum retention
            </DialogDescription>
          </DialogHeader>
          <SpacedRepetitionCalendar
            showStats={true}
            showCalendar={true}
            showReviewList={true}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export default SpacedRepetitionCalendar;
