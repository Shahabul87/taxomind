'use client';

/**
 * PlanControlPanel
 *
 * Control panel for managing learning plan execution.
 * Provides start, pause, resume, and status controls.
 *
 * Features:
 * - Plan status display
 * - Start/pause/resume actions
 * - Progress overview
 * - Quick step navigation
 * - Time tracking
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Target,
  ChevronRight,
  Loader2,
  Flag,
  TrendingUp,
  AlertTriangle,
  ListChecks,
} from 'lucide-react';
import type { Plan, PlanStep } from '@sam-ai/react';

// ============================================================================
// TYPES
// ============================================================================

interface PlanControlPanelProps {
  className?: string;
  /** The plan to control */
  plan: Plan;
  /** Associated goal title */
  goalTitle?: string;
  /** Callback when plan is started */
  onStart?: () => Promise<void>;
  /** Callback when plan is paused */
  onPause?: () => Promise<void>;
  /** Callback when plan is resumed */
  onResume?: () => Promise<void>;
  /** Callback when step is clicked */
  onStepClick?: (step: PlanStep) => void;
  /** Compact display mode */
  compact?: boolean;
  /** Show step list */
  showSteps?: boolean;
}

type PlanStatus = Plan['status'];

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_CONFIG: Record<
  PlanStatus,
  {
    icon: typeof Play;
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  draft: {
    icon: Flag,
    label: 'Draft',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900',
  },
  active: {
    icon: Play,
    label: 'Active',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
  },
  paused: {
    icon: Pause,
    label: 'Paused',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
  },
  completed: {
    icon: CheckCircle,
    label: 'Completed',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
  },
  abandoned: {
    icon: XCircle,
    label: 'Abandoned',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
  },
};

const STEP_STATUS_COLORS: Record<PlanStep['status'], string> = {
  pending: 'bg-gray-200 dark:bg-gray-700',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  skipped: 'bg-amber-500',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function getNextStep(steps: PlanStep[]): PlanStep | null {
  const inProgress = steps.find((s) => s.status === 'in_progress');
  if (inProgress) return inProgress;
  return steps.find((s) => s.status === 'pending') ?? null;
}

function getRemainingTime(steps: PlanStep[]): number {
  return steps
    .filter((s) => s.status === 'pending' || s.status === 'in_progress')
    .reduce((acc, s) => acc + s.estimatedMinutes, 0);
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function StepItem({
  step,
  isNext,
  onClick,
}: {
  step: PlanStep;
  isNext: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors',
        isNext
          ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800',
        step.status === 'completed' && 'opacity-60'
      )}
    >
      <div
        className={cn(
          'h-3 w-3 rounded-full shrink-0',
          STEP_STATUS_COLORS[step.status]
        )}
      />
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            'text-sm font-medium truncate',
            step.status === 'completed' && 'line-through'
          )}
        >
          {step.title}
        </div>
        <div className="text-xs text-gray-500">
          {formatDuration(step.estimatedMinutes)}
        </div>
      </div>
      {isNext && (
        <Badge variant="outline" className="shrink-0 text-xs">
          Next
        </Badge>
      )}
      {step.status === 'completed' && (
        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
      )}
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PlanControlPanel({
  className,
  plan,
  goalTitle,
  onStart,
  onPause,
  onResume,
  onStepClick,
  compact = false,
  showSteps = true,
}: PlanControlPanelProps) {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'start' | 'pause' | null>(null);

  const statusConfig = STATUS_CONFIG[plan.status] || STATUS_CONFIG.draft;
  const StatusIcon = statusConfig.icon;

  // Computed values
  const nextStep = useMemo(() => getNextStep(plan.steps), [plan.steps]);
  const remainingTime = useMemo(() => getRemainingTime(plan.steps), [plan.steps]);
  const completedSteps = useMemo(
    () => plan.steps.filter((s) => s.status === 'completed').length,
    [plan.steps]
  );

  // Handlers
  const handleStart = useCallback(async () => {
    setIsLoading(true);
    await onStart?.();
    setIsLoading(false);
    setConfirmAction(null);
  }, [onStart]);

  const handlePause = useCallback(async () => {
    setIsLoading(true);
    await onPause?.();
    setIsLoading(false);
    setConfirmAction(null);
  }, [onPause]);

  const handleResume = useCallback(async () => {
    setIsLoading(true);
    await onResume?.();
    setIsLoading(false);
  }, [onResume]);

  // Determine primary action
  const primaryAction = useMemo(() => {
    switch (plan.status) {
      case 'draft':
        return { label: 'Start Plan', action: () => setConfirmAction('start'), icon: Play };
      case 'active':
        return { label: 'Pause', action: () => setConfirmAction('pause'), icon: Pause };
      case 'paused':
        return { label: 'Resume', action: handleResume, icon: RotateCcw };
      default:
        return null;
    }
  }, [plan.status, handleResume]);

  // Compact mode
  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border',
          className
        )}
      >
        <div className={cn('p-2 rounded-full', statusConfig.bgColor)}>
          <StatusIcon className={cn('h-4 w-4', statusConfig.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">
            {goalTitle || 'Learning Plan'}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{completedSteps}/{plan.steps.length} steps</span>
            <span className="text-gray-300">|</span>
            <span>{formatDuration(remainingTime)} left</span>
          </div>
        </div>

        <Progress value={plan.progress} className="w-20 h-2" />

        {primaryAction && (
          <Button
            size="sm"
            variant={plan.status === 'active' ? 'outline' : 'default'}
            onClick={primaryAction.action}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <primaryAction.icon className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={cn('p-2 rounded-full shrink-0', statusConfig.bgColor)}>
                <ListChecks className={cn('h-5 w-5', statusConfig.color)} />
              </div>
              <div>
                <CardTitle className="text-base">
                  {goalTitle || 'Learning Plan'}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className={cn('text-xs', statusConfig.color, statusConfig.bgColor)}
                  >
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {plan.dailyMinutes}m/day
                  </span>
                </div>
              </div>
            </div>

            {/* Primary action */}
            {primaryAction && (
              <Button
                variant={plan.status === 'active' ? 'outline' : 'default'}
                size="sm"
                onClick={primaryAction.action}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <primaryAction.icon className="h-4 w-4 mr-2" />
                )}
                {primaryAction.label}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Overall Progress</span>
              <span className="font-medium">{plan.progress}%</span>
            </div>
            <Progress value={plan.progress} className="h-2" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="text-lg font-semibold">
                {completedSteps}/{plan.steps.length}
              </div>
              <div className="text-xs text-gray-500">Steps</div>
            </div>
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="text-lg font-semibold">
                {formatDuration(remainingTime)}
              </div>
              <div className="text-xs text-gray-500">Remaining</div>
            </div>
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="text-lg font-semibold">
                {plan.estimatedEndDate ? formatDate(plan.estimatedEndDate) : '-'}
              </div>
              <div className="text-xs text-gray-500">Target</div>
            </div>
          </div>

          {/* Next step highlight */}
          {nextStep && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                <Target className="h-4 w-4" />
                Next Up
              </div>
              <div className="text-sm">{nextStep.title}</div>
              <div className="flex items-center gap-2 mt-1 text-xs text-blue-600 dark:text-blue-400">
                <Clock className="h-3 w-3" />
                {formatDuration(nextStep.estimatedMinutes)}
                {nextStep.scheduledDate && (
                  <>
                    <span className="text-blue-300">|</span>
                    <Calendar className="h-3 w-3" />
                    {formatDate(nextStep.scheduledDate)}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Steps list */}
          {showSteps && plan.steps.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                All Steps
              </div>
              <div className="space-y-1 max-h-[200px] overflow-y-auto">
                {plan.steps.map((step) => (
                  <StepItem
                    key={step.id}
                    step={step}
                    isNext={step.id === nextStep?.id}
                    onClick={() => onStepClick?.(step)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Started: {formatDate(plan.startDate)}
            </div>
            {plan.estimatedEndDate && (
              <div className="flex items-center gap-1">
                <Flag className="h-3 w-3" />
                Target: {formatDate(plan.estimatedEndDate)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation dialogs */}
      <AlertDialog
        open={confirmAction === 'start'}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Learning Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;re about to start your learning plan. SAM will track your progress
              and send you reminders to stay on track.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStart} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Start Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirmAction === 'pause'}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pause Learning Plan?</AlertDialogTitle>
            <AlertDialogDescription>
              Pausing will stop progress tracking and reminders. You can resume
              anytime without losing your progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePause}
              disabled={isLoading}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Pause className="h-4 w-4 mr-2" />
              )}
              Pause Plan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default PlanControlPanel;
