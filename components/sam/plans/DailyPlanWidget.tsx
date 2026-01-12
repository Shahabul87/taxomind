'use client';

/**
 * DailyPlanWidget
 *
 * Today's focus widget for learning plans.
 * Shows what to work on today and tracks daily progress.
 *
 * Features:
 * - Today's steps highlight
 * - Daily time goal
 * - Quick progress tracking
 * - Session timer
 * - Motivation messages
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Clock,
  CheckCircle,
  Circle,
  Play,
  Pause,
  RotateCcw,
  Target,
  Sparkles,
  Sun,
  Flame,
  Coffee,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import type { Plan, PlanStep } from '@sam-ai/react';

// ============================================================================
// TYPES
// ============================================================================

interface DailyPlanWidgetProps {
  className?: string;
  /** Active plans */
  plans?: Plan[];
  /** Daily study goal in minutes */
  dailyGoalMinutes?: number;
  /** Today's completed study minutes */
  todayStudyMinutes?: number;
  /** Current streak days */
  streakDays?: number;
  /** Callback when step is started */
  onStepStart?: (planId: string, stepId: string) => Promise<void>;
  /** Callback when step is completed */
  onStepComplete?: (planId: string, stepId: string) => Promise<void>;
  /** Callback for taking a break */
  onTakeBreak?: () => void;
  /** Compact display mode */
  compact?: boolean;
}

interface TodayStep {
  planId: string;
  planTitle: string;
  step: PlanStep;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MOTIVATIONAL_MESSAGES = [
  'Every step counts!',
  'You&apos;re making progress!',
  'Keep up the great work!',
  'Learning is a journey!',
  'Stay focused, stay curious!',
];

const TIME_OF_DAY_GREETINGS = {
  morning: { greeting: 'Good morning', icon: Sun, time: [5, 12] },
  afternoon: { greeting: 'Good afternoon', icon: Sun, time: [12, 17] },
  evening: { greeting: 'Good evening', icon: Sparkles, time: [17, 21] },
  night: { greeting: 'Night owl mode', icon: Sparkles, time: [21, 5] },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getTimeOfDay(): keyof typeof TIME_OF_DAY_GREETINGS {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function getTodaySteps(plans: Plan[]): TodayStep[] {
  // Safety check: return empty array if plans is undefined or not an array
  if (!plans || !Array.isArray(plans)) {
    return [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const steps: TodayStep[] = [];

  plans.forEach((plan) => {
    if (plan.status !== 'active') return;
    if (!plan.steps || !Array.isArray(plan.steps)) return;

    // Find in-progress or today's scheduled steps
    plan.steps.forEach((step) => {
      if (step.status === 'in_progress') {
        steps.push({ planId: plan.id, planTitle: '', step });
      } else if (step.status === 'pending' && step.scheduledDate) {
        const scheduledDate = new Date(step.scheduledDate);
        scheduledDate.setHours(0, 0, 0, 0);
        if (scheduledDate.getTime() === today.getTime()) {
          steps.push({ planId: plan.id, planTitle: '', step });
        }
      }
    });

    // If no scheduled steps, get next pending step
    if (!steps.some((s) => s.planId === plan.id)) {
      const nextStep = plan.steps.find((s) => s.status === 'pending');
      if (nextStep) {
        steps.push({ planId: plan.id, planTitle: '', step: nextStep });
      }
    }
  });

  // Sort: in_progress first, then by estimated minutes (shorter first)
  return steps.sort((a, b) => {
    if (a.step.status === 'in_progress' && b.step.status !== 'in_progress') return -1;
    if (b.step.status === 'in_progress' && a.step.status !== 'in_progress') return 1;
    return a.step.estimatedMinutes - b.step.estimatedMinutes;
  });
}

function getRandomMessage(): string {
  return MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function StepCard({
  todayStep,
  isActive,
  onStart,
  onComplete,
}: {
  todayStep: TodayStep;
  isActive: boolean;
  onStart?: () => void;
  onComplete?: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: 'start' | 'complete') => {
    setIsLoading(true);
    if (action === 'start') {
      await onStart?.();
    } else {
      await onComplete?.();
    }
    setIsLoading(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border transition-colors',
        isActive
          ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
      )}
    >
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full shrink-0',
          isActive ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'
        )}
      >
        {isActive ? (
          <Play className="h-4 w-4 text-blue-600" />
        ) : (
          <Circle className="h-4 w-4 text-gray-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{todayStep.step.title}</div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>{formatDuration(todayStep.step.estimatedMinutes)}</span>
          {isActive && (
            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
              In Progress
            </Badge>
          )}
        </div>
      </div>

      {isActive ? (
        <Button
          size="sm"
          onClick={() => handleAction('complete')}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-1" />
              Done
            </>
          )}
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAction('start')}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Start
              <ChevronRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      )}
    </motion.div>
  );
}

function SessionTimer({
  isRunning,
  onPause,
  onResume,
  onReset,
}: {
  isRunning: boolean;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
}) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div className="flex items-center gap-2">
      <div className="text-2xl font-mono font-semibold tabular-nums">
        {formatTimer(seconds)}
      </div>
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={isRunning ? onPause : onResume}
              >
                {isRunning ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isRunning ? 'Pause' : 'Resume'}</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => {
                  setSeconds(0);
                  onReset();
                }}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reset Timer</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DailyPlanWidget({
  className,
  plans = [],
  dailyGoalMinutes = 60,
  todayStudyMinutes = 0,
  streakDays = 0,
  onStepStart,
  onStepComplete,
  onTakeBreak,
  compact = false,
}: DailyPlanWidgetProps) {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [motivationalMessage] = useState(getRandomMessage);

  const timeOfDay = getTimeOfDay();
  const greeting = TIME_OF_DAY_GREETINGS[timeOfDay];
  const GreetingIcon = greeting.icon;

  // Get today's steps from all active plans
  const todaySteps = useMemo(() => getTodaySteps(plans), [plans]);

  // Calculate progress
  const goalProgress = useMemo(
    () => Math.min((todayStudyMinutes / dailyGoalMinutes) * 100, 100),
    [todayStudyMinutes, dailyGoalMinutes]
  );

  // Handlers
  const handleStepStart = useCallback(
    async (planId: string, stepId: string) => {
      await onStepStart?.(planId, stepId);
      setIsTimerRunning(true);
    },
    [onStepStart]
  );

  const handleStepComplete = useCallback(
    async (planId: string, stepId: string) => {
      await onStepComplete?.(planId, stepId);
      setIsTimerRunning(false);
    },
    [onStepComplete]
  );

  const activeStep = todaySteps.find((s) => s.step.status === 'in_progress');

  // Compact mode
  if (compact) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-950/30">
                <Target className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-sm font-medium">
                  Today&apos;s Goal: {formatDuration(dailyGoalMinutes)}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDuration(todayStudyMinutes)} completed
                </div>
              </div>
            </div>
            <Progress value={goalProgress} className="w-24 h-2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GreetingIcon className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base">{greeting.greeting}!</CardTitle>
          </div>
          {streakDays > 0 && (
            <Badge variant="outline" className="gap-1">
              <Flame className="h-3 w-3 text-orange-500" />
              {streakDays} day streak
            </Badge>
          )}
        </div>
        <CardDescription>{motivationalMessage}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Daily goal progress */}
        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Daily Goal</span>
            </div>
            <span className="text-sm text-gray-500">
              {formatDuration(todayStudyMinutes)} / {formatDuration(dailyGoalMinutes)}
            </span>
          </div>
          <Progress value={goalProgress} className="h-2" />
          {goalProgress >= 100 && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Goal achieved! Great job!
            </div>
          )}
        </div>

        {/* Session timer (if active) */}
        {activeStep && (
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <div>
              <div className="text-sm font-medium">Current Session</div>
              <div className="text-xs text-gray-500 truncate max-w-[150px]">
                {activeStep.step.title}
              </div>
            </div>
            <SessionTimer
              isRunning={isTimerRunning}
              onPause={() => setIsTimerRunning(false)}
              onResume={() => setIsTimerRunning(true)}
              onReset={() => setIsTimerRunning(false)}
            />
          </div>
        )}

        {/* Today's steps */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="h-4 w-4 text-gray-500" />
            Today&apos;s Focus ({todaySteps.length} items)
          </div>

          <AnimatePresence>
            {todaySteps.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active plans for today</p>
                <p className="text-xs">Start a plan to see your daily tasks</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todaySteps.slice(0, 3).map((todayStep) => (
                  <StepCard
                    key={`${todayStep.planId}-${todayStep.step.id}`}
                    todayStep={todayStep}
                    isActive={todayStep.step.status === 'in_progress'}
                    onStart={() => handleStepStart(todayStep.planId, todayStep.step.id)}
                    onComplete={() => handleStepComplete(todayStep.planId, todayStep.step.id)}
                  />
                ))}
                {todaySteps.length > 3 && (
                  <div className="text-center text-xs text-gray-500">
                    +{todaySteps.length - 3} more items
                  </div>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Take a break button */}
        {onTakeBreak && (
          <Button
            variant="outline"
            size="sm"
            onClick={onTakeBreak}
            className="w-full"
          >
            <Coffee className="h-4 w-4 mr-2" />
            Take a Break
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default DailyPlanWidget;
