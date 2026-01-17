'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePracticeReviews } from '@/hooks/use-practice-reviews';

// ============================================================================
// TYPES
// ============================================================================

interface SpacedRepetitionWidgetProps {
  onStartReview?: () => void;
  showRecommendations?: boolean;
  compact?: boolean;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SpacedRepetitionWidget({
  onStartReview,
  showRecommendations = true,
  compact = false,
  className,
}: SpacedRepetitionWidgetProps) {
  const { data, loading, error, refresh } = usePracticeReviews();

  if (loading) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="py-8 text-center text-muted-foreground">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Unable to load review data</p>
          <Button variant="ghost" size="sm" onClick={refresh} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { stats, reviews, recommendedPractice } = data;
  const hasOverdue = stats.overdueReviews > 0;
  const hasDueToday = stats.dueTodayReviews > 0;

  if (compact) {
    return (
      <Card className={cn('', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center',
                  hasOverdue
                    ? 'bg-red-100 text-red-600 dark:bg-red-950'
                    : hasDueToday
                      ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-950'
                      : 'bg-green-100 text-green-600 dark:bg-green-950'
                )}
              >
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-sm">
                  {hasOverdue
                    ? `${stats.overdueReviews} overdue reviews`
                    : hasDueToday
                      ? `${stats.dueTodayReviews} reviews due today`
                      : 'All caught up!'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.averageRetention.toFixed(0)}% retention
                </p>
              </div>
            </div>
            {(hasOverdue || hasDueToday) && onStartReview && (
              <Button size="sm" onClick={onStartReview}>
                Review
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Spaced Repetition
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Review concepts for optimal retention
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Cards */}
        <div className="grid grid-cols-3 gap-3">
          <StatusCard
            label="Overdue"
            value={stats.overdueReviews}
            icon={AlertCircle}
            color={stats.overdueReviews > 0 ? 'text-red-500' : 'text-muted-foreground'}
          />
          <StatusCard
            label="Due Today"
            value={stats.dueTodayReviews}
            icon={Clock}
            color={stats.dueTodayReviews > 0 ? 'text-yellow-500' : 'text-muted-foreground'}
          />
          <StatusCard
            label="Mastered"
            value={stats.conceptsMastered}
            icon={CheckCircle2}
            color="text-green-500"
          />
        </div>

        {/* Retention */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Average Retention</span>
            <span className="font-medium">{stats.averageRetention.toFixed(0)}%</span>
          </div>
          <Progress
            value={stats.averageRetention}
            className={cn(
              'h-2',
              stats.averageRetention >= 80
                ? '[&>div]:bg-green-500'
                : stats.averageRetention >= 60
                  ? '[&>div]:bg-yellow-500'
                  : '[&>div]:bg-red-500'
            )}
          />
        </div>

        {/* Next Reviews */}
        {reviews.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Upcoming Reviews</h4>
            <div className="space-y-2">
              {reviews.slice(0, 3).map((review) => (
                <div
                  key={review.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {review.conceptName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {review.isOverdue
                        ? 'Overdue'
                        : review.daysUntilReview === 0
                          ? 'Due today'
                          : `Due in ${review.daysUntilReview} days`}
                    </p>
                  </div>
                  <Badge
                    variant={
                      review.retentionEstimate >= 80
                        ? 'default'
                        : review.retentionEstimate >= 60
                          ? 'secondary'
                          : 'destructive'
                    }
                    className="ml-2"
                  >
                    {review.retentionEstimate.toFixed(0)}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Practice Recommendations */}
        {showRecommendations && recommendedPractice.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Recommended Practice
            </h4>
            <div className="space-y-2">
              {recommendedPractice.slice(0, 3).map((rec) => (
                <div
                  key={rec.skillId}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{rec.skillName}</p>
                    <p className="text-xs text-muted-foreground">{rec.reason}</p>
                  </div>
                  <Badge
                    variant={
                      rec.urgency === 'high'
                        ? 'destructive'
                        : rec.urgency === 'medium'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {rec.urgency}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        {(hasOverdue || hasDueToday) && onStartReview && (
          <Button className="w-full" onClick={onStartReview}>
            <Brain className="h-4 w-4 mr-2" />
            Start Review Session
            <Badge variant="secondary" className="ml-2">
              {stats.overdueReviews + stats.dueTodayReviews}
            </Badge>
          </Button>
        )}

        {/* All caught up state */}
        {!hasOverdue && !hasDueToday && (
          <div className="text-center py-4">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm font-medium">All caught up!</p>
            <p className="text-xs text-muted-foreground">
              {stats.nextOptimalReviewTime
                ? `Next review: ${new Date(stats.nextOptimalReviewTime).toLocaleDateString()}`
                : 'No upcoming reviews'}
            </p>
          </div>
        )}

        {/* Practice Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Current Streak</p>
            <p className="text-lg font-medium">{stats.currentStreak} days</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Practice</p>
            <p className="text-lg font-medium">{stats.totalPracticeHours.toFixed(1)}h</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

interface StatusCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}

function StatusCard({ label, value, icon: Icon, color }: StatusCardProps) {
  return (
    <div className="text-center p-3 rounded-lg bg-muted/50">
      <Icon className={cn('h-5 w-5 mx-auto mb-1', color)} />
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default SpacedRepetitionWidget;
