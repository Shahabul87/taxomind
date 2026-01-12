'use client';

/**
 * ActiveLearnersWidget
 *
 * Shows currently active learners in the same course/topic.
 * Enables social learning features and peer awareness.
 *
 * Features:
 * - Real-time active learner count
 * - Avatar stack of active users
 * - Topic/course filtering
 * - Activity breakdown
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Users,
  BookOpen,
  Coffee,
  Clock,
  RefreshCw,
  Loader2,
  Circle,
  ChevronRight,
} from 'lucide-react';
import { PresenceIndicator } from './PresenceIndicator';
import type { PresenceStatus } from '@sam-ai/agentic';

// ============================================================================
// TYPES
// ============================================================================

interface ActiveLearnersWidgetProps {
  className?: string;
  /** Course ID to filter by */
  courseId?: string;
  /** Topic ID to filter by */
  topicId?: string;
  /** Maximum learners to show */
  maxVisible?: number;
  /** Show activity breakdown */
  showBreakdown?: boolean;
  /** Auto-refresh interval (ms) */
  refreshInterval?: number;
  /** Compact mode */
  compact?: boolean;
  /** Callback when learner is clicked */
  onLearnerClick?: (learner: ActiveLearner) => void;
}

interface ActiveLearner {
  id: string;
  name: string;
  avatar?: string;
  status: PresenceStatus;
  currentActivity?: string;
  lastActivityAt: string;
}

interface LearnerStats {
  total: number;
  studying: number;
  idle: number;
  onBreak: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  return `${diffHours}h ago`;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function AvatarStack({
  learners,
  max = 5,
  onMoreClick,
}: {
  learners: ActiveLearner[];
  max?: number;
  onMoreClick?: () => void;
}) {
  const visible = learners.slice(0, max);
  const remaining = learners.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((learner) => (
        <TooltipProvider key={learner.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <Avatar className="h-8 w-8 border-2 border-white dark:border-gray-900">
                  <AvatarImage src={learner.avatar} alt={learner.name} />
                  <AvatarFallback className="text-xs">
                    {getInitials(learner.name)}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={cn(
                    'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900',
                    learner.status === 'studying' && 'bg-blue-500',
                    learner.status === 'online' && 'bg-green-500',
                    learner.status === 'idle' && 'bg-amber-500',
                    learner.status === 'on_break' && 'bg-orange-500',
                    (learner.status === 'away' || learner.status === 'offline') &&
                      'bg-gray-400'
                  )}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <div className="font-medium">{learner.name}</div>
                {learner.currentActivity && (
                  <div className="text-xs text-gray-500">
                    {learner.currentActivity}
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
      {remaining > 0 && (
        <button
          onClick={onMoreClick}
          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white dark:border-gray-900 bg-gray-100 dark:bg-gray-800 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          +{remaining}
        </button>
      )}
    </div>
  );
}

function LearnerRow({
  learner,
  onClick,
}: {
  learner: ActiveLearner;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
    >
      <div className="relative">
        <Avatar className="h-9 w-9">
          <AvatarImage src={learner.avatar} alt={learner.name} />
          <AvatarFallback className="text-xs">
            {getInitials(learner.name)}
          </AvatarFallback>
        </Avatar>
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900',
            learner.status === 'studying' && 'bg-blue-500',
            learner.status === 'online' && 'bg-green-500',
            learner.status === 'idle' && 'bg-amber-500',
            learner.status === 'on_break' && 'bg-orange-500',
            (learner.status === 'away' || learner.status === 'offline') &&
              'bg-gray-400'
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{learner.name}</span>
        </div>
        <div className="text-xs text-gray-500 truncate">
          {learner.currentActivity || 'Online'}
        </div>
      </div>
      <div className="text-xs text-gray-400">
        {formatTimeAgo(learner.lastActivityAt)}
      </div>
    </button>
  );
}

function StatsBar({ stats }: { stats: LearnerStats }) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <div className="flex items-center gap-1.5">
        <BookOpen className="h-3.5 w-3.5 text-blue-500" />
        <span className="text-gray-600 dark:text-gray-400">
          {stats.studying} studying
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5 text-amber-500" />
        <span className="text-gray-600 dark:text-gray-400">
          {stats.idle} idle
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Coffee className="h-3.5 w-3.5 text-orange-500" />
        <span className="text-gray-600 dark:text-gray-400">
          {stats.onBreak} on break
        </span>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
        <Users className="h-5 w-5 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No other learners active right now
      </p>
      <p className="text-xs text-gray-400 mt-1">
        Be the first to start studying!
      </p>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ActiveLearnersWidget({
  className,
  courseId,
  topicId,
  maxVisible = 5,
  showBreakdown = true,
  refreshInterval = 30000,
  compact = false,
  onLearnerClick,
}: ActiveLearnersWidgetProps) {
  // State
  const [learners, setLearners] = useState<ActiveLearner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // Fetch active learners
  const fetchLearners = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (courseId) params.set('courseId', courseId);
      if (topicId) params.set('topicId', topicId);

      const response = await fetch(
        `/api/sam/realtime/presence?${params.toString()}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.users) {
          setLearners(data.data.users);
        }
      }
    } catch (error) {
      console.error('[ActiveLearnersWidget] Failed to fetch learners:', error);
    } finally {
      setIsLoading(false);
    }
  }, [courseId, topicId]);

  // Initial fetch and polling
  useEffect(() => {
    fetchLearners();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchLearners, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchLearners, refreshInterval]);

  // Calculate stats
  const stats: LearnerStats = useMemo(() => {
    return {
      total: learners.length,
      studying: learners.filter((l) => l.status === 'studying').length,
      idle: learners.filter((l) => l.status === 'idle').length,
      onBreak: learners.filter((l) => l.status === 'on_break').length,
    };
  }, [learners]);

  const hasLearners = learners.length > 0;

  // Compact mode
  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {isLoading ? (
          <Skeleton className="h-6 w-20" />
        ) : hasLearners ? (
          <>
            <AvatarStack
              learners={learners}
              max={3}
              onMoreClick={() => setShowAll(true)}
            />
            <Badge variant="outline" className="text-xs">
              {stats.total} active
            </Badge>
          </>
        ) : (
          <Badge variant="outline" className="text-xs text-gray-500">
            <Users className="h-3 w-3 mr-1" />
            No learners online
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-base">Active Learners</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {hasLearners && (
              <Badge variant="outline" className="text-xs">
                {stats.total} online
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={fetchLearners}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
        {!compact && (
          <CardDescription>
            See who else is learning right now
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading ? (
          <LoadingState />
        ) : hasLearners ? (
          <div className="space-y-3">
            {/* Stats */}
            {showBreakdown && <StatsBar stats={stats} />}

            {/* Avatar stack or full list */}
            {showAll ? (
              <ScrollArea className="h-[200px]">
                <div className="space-y-1 pr-2">
                  {learners.map((learner) => (
                    <LearnerRow
                      key={learner.id}
                      learner={learner}
                      onClick={() => onLearnerClick?.(learner)}
                    />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-between">
                <AvatarStack
                  learners={learners}
                  max={maxVisible}
                  onMoreClick={() => setShowAll(true)}
                />
                {learners.length > maxVisible && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAll(true)}
                    className="text-xs"
                  >
                    View all
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            )}

            {/* Collapse button */}
            {showAll && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(false)}
                className="w-full text-xs"
              >
                Show less
              </Button>
            )}
          </div>
        ) : (
          <EmptyState />
        )}
      </CardContent>
    </Card>
  );
}

export default ActiveLearnersWidget;
