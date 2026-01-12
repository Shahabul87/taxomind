'use client';

/**
 * StudyStatusBadge
 *
 * Shows what the user is currently studying.
 * Used in headers and profile sections.
 *
 * Features:
 * - Current course/topic display
 * - Study duration timer
 * - Quick status actions
 * - Animated transitions
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Clock,
  Pause,
  Play,
  Coffee,
  Target,
  Timer,
  Zap,
  ChevronDown,
} from 'lucide-react';
import type { PresenceStatus } from '@sam-ai/agentic';

// ============================================================================
// TYPES
// ============================================================================

interface StudyStatusBadgeProps {
  className?: string;
  /** Current study status */
  status?: PresenceStatus;
  /** What user is currently studying */
  currentActivity?: {
    type: 'course' | 'topic' | 'practice' | 'review';
    id: string;
    title: string;
    progress?: number;
  };
  /** When study session started */
  sessionStartedAt?: Date;
  /** Daily study goal in minutes */
  dailyGoalMinutes?: number;
  /** Today's study time in minutes */
  todayStudyMinutes?: number;
  /** Callback for status change */
  onStatusChange?: (status: PresenceStatus) => void;
  /** Callback for break request */
  onTakeBreak?: () => void;
  /** Compact mode */
  compact?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ACTIVITY_ICONS = {
  course: BookOpen,
  topic: Target,
  practice: Zap,
  review: Timer,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

function formatStudyTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function StudyStatusBadge({
  className,
  status = 'online',
  currentActivity,
  sessionStartedAt,
  dailyGoalMinutes = 60,
  todayStudyMinutes = 0,
  onStatusChange,
  onTakeBreak,
  compact = false,
}: StudyStatusBadgeProps) {
  // State
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Update session duration every second
  useEffect(() => {
    if (!sessionStartedAt || status !== 'studying') {
      return;
    }

    const updateDuration = () => {
      setSessionDuration(Date.now() - sessionStartedAt.getTime());
    };

    updateDuration();
    const interval = setInterval(updateDuration, 1000);

    return () => clearInterval(interval);
  }, [sessionStartedAt, status]);

  // Calculate goal progress
  const goalProgress = useMemo(() => {
    return Math.min((todayStudyMinutes / dailyGoalMinutes) * 100, 100);
  }, [todayStudyMinutes, dailyGoalMinutes]);

  const isStudying = status === 'studying';
  const isOnBreak = status === 'on_break';
  const ActivityIcon = currentActivity
    ? ACTIVITY_ICONS[currentActivity.type]
    : BookOpen;

  // Not studying - show simple badge
  if (!isStudying && !isOnBreak) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn('gap-1.5 cursor-default', className)}
            >
              <BookOpen className="h-3 w-3 text-gray-400" />
              Not studying
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">
              Today: {formatStudyTime(todayStudyMinutes)} / {formatStudyTime(dailyGoalMinutes)}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // On break
  if (isOnBreak) {
    return (
      <Badge
        variant="outline"
        className={cn(
          'gap-1.5 bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
          className
        )}
      >
        <Coffee className="h-3 w-3" />
        On Break
        {onStatusChange && (
          <button
            onClick={() => onStatusChange('studying')}
            className="ml-1 hover:opacity-70"
          >
            <Play className="h-3 w-3" />
          </button>
        )}
      </Badge>
    );
  }

  // Compact mode
  if (compact) {
    return (
      <Badge
        variant="outline"
        className={cn(
          'gap-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
          className
        )}
      >
        <ActivityIcon className="h-3 w-3" />
        <AnimatePresence mode="wait">
          <motion.span
            key={sessionDuration}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="tabular-nums"
          >
            {formatDuration(sessionDuration)}
          </motion.span>
        </AnimatePresence>
      </Badge>
    );
  }

  // Full mode with popover
  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <button className={cn('focus:outline-none', className)}>
          <Badge
            variant="outline"
            className={cn(
              'gap-1.5 cursor-pointer transition-colors',
              'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
              'hover:bg-blue-100 dark:hover:bg-blue-950/50'
            )}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            <ActivityIcon className="h-3 w-3" />
            <span className="truncate max-w-[120px]">
              {currentActivity?.title || 'Studying'}
            </span>
            <span className="tabular-nums text-blue-500">
              {formatDuration(sessionDuration)}
            </span>
            <ChevronDown className="h-3 w-3" />
          </Badge>
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-64 p-3" align="end">
        <div className="space-y-3">
          {/* Current activity */}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-950/30">
              <ActivityIcon className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {currentActivity?.title || 'Study Session'}
              </div>
              <div className="text-xs text-gray-500">
                {currentActivity?.type || 'general'}
              </div>
            </div>
          </div>

          {/* Activity progress */}
          {currentActivity?.progress !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Progress</span>
                <span className="font-medium">{currentActivity.progress}%</span>
              </div>
              <Progress value={currentActivity.progress} className="h-1.5" />
            </div>
          )}

          {/* Session timer */}
          <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <Clock className="h-4 w-4 text-gray-500" />
            <div className="flex-1">
              <div className="text-xs text-gray-500">This session</div>
              <div className="text-sm font-medium tabular-nums">
                {formatDuration(sessionDuration)}
              </div>
            </div>
          </div>

          {/* Daily goal */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Daily Goal</span>
              <span className="font-medium">
                {formatStudyTime(todayStudyMinutes)} / {formatStudyTime(dailyGoalMinutes)}
              </span>
            </div>
            <Progress value={goalProgress} className="h-1.5" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {onTakeBreak && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onTakeBreak();
                  setIsPopoverOpen(false);
                }}
                className="flex-1"
              >
                <Coffee className="h-3.5 w-3.5 mr-1" />
                Take Break
              </Button>
            )}
            {onStatusChange && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onStatusChange('online');
                  setIsPopoverOpen(false);
                }}
                className="flex-1"
              >
                <Pause className="h-3.5 w-3.5 mr-1" />
                End Session
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default StudyStatusBadge;
