'use client';

/**
 * PlanProgressTracker
 *
 * Detailed progress view for learning plans.
 * Shows step-by-step progress with timeline visualization.
 *
 * Features:
 * - Visual timeline of steps
 * - Progress statistics
 * - Step completion tracking
 * - Daily activity calendar
 * - Milestone celebrations
 */

import { useState, useMemo } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  CheckCircle,
  Circle,
  Clock,
  Calendar,
  TrendingUp,
  Target,
  Zap,
  Award,
  ChevronRight,
  ChevronDown,
  Play,
  SkipForward,
  Flag as FlagIcon,
  BarChart3,
  Flame,
} from 'lucide-react';
import type { Plan, PlanStep } from '@sam-ai/react';

// ============================================================================
// TYPES
// ============================================================================

interface PlanProgressTrackerProps {
  className?: string;
  /** The plan to track */
  plan: Plan;
  /** Associated goal title */
  goalTitle?: string;
  /** Callback when step is marked complete */
  onStepComplete?: (stepId: string) => Promise<void>;
  /** Callback when step is skipped */
  onStepSkip?: (stepId: string) => Promise<void>;
  /** Callback when step is started */
  onStepStart?: (stepId: string) => Promise<void>;
  /** Show calendar view */
  showCalendar?: boolean;
  /** Show stats section */
  showStats?: boolean;
}

interface DayActivity {
  date: string;
  stepsCompleted: number;
  minutesStudied: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STEP_STATUS_CONFIG: Record<
  PlanStep['status'],
  {
    icon: typeof Circle;
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  pending: {
    icon: Circle,
    label: 'Pending',
    color: 'text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
  in_progress: {
    icon: Play,
    label: 'In Progress',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
  },
  completed: {
    icon: CheckCircle,
    label: 'Completed',
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
  },
  skipped: {
    icon: SkipForward,
    label: 'Skipped',
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
  },
};

const MILESTONES = [
  { percentage: 25, label: 'Quarter way!', icon: Zap },
  { percentage: 50, label: 'Halfway there!', icon: FlagIcon },
  { percentage: 75, label: 'Almost done!', icon: TrendingUp },
  { percentage: 100, label: 'Completed!', icon: Award },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function generateActivityData(plan: Plan): DayActivity[] {
  const activities: Record<string, DayActivity> = {};

  plan.steps.forEach((step) => {
    if (step.completedAt) {
      const dateKey = new Date(step.completedAt).toDateString();
      if (!activities[dateKey]) {
        activities[dateKey] = {
          date: step.completedAt,
          stepsCompleted: 0,
          minutesStudied: 0,
        };
      }
      activities[dateKey].stepsCompleted++;
      activities[dateKey].minutesStudied += step.estimatedMinutes;
    }
  });

  return Object.values(activities).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function StepTimelineItem({
  step,
  isLast,
  onComplete,
  onSkip,
  onStart,
}: {
  step: PlanStep;
  isLast: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
  onStart?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(step.status === 'in_progress');
  const config = STEP_STATUS_CONFIG[step.status];
  const Icon = config.icon;

  return (
    <div className="relative pl-8">
      {/* Timeline line */}
      {!isLast && (
        <div
          className={cn(
            'absolute left-3 top-8 bottom-0 w-0.5',
            step.status === 'completed'
              ? 'bg-green-500'
              : 'bg-gray-200 dark:bg-gray-700'
          )}
        />
      )}

      {/* Timeline dot */}
      <div
        className={cn(
          'absolute left-0 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white dark:bg-gray-900',
          step.status === 'completed' && 'border-green-500 bg-green-50',
          step.status === 'in_progress' && 'border-blue-500 bg-blue-50',
          step.status === 'pending' && 'border-gray-300',
          step.status === 'skipped' && 'border-amber-500 bg-amber-50'
        )}
      >
        <Icon className={cn('h-3 w-3', config.color)} />
      </div>

      {/* Content */}
      <div className="pb-6">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'w-full text-left p-3 rounded-lg border transition-colors',
            step.status === 'in_progress' && 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20',
            step.status === 'completed' && 'border-green-200 dark:border-green-800',
            step.status === 'pending' && 'hover:bg-gray-50 dark:hover:bg-gray-800',
            step.status === 'skipped' && 'opacity-60'
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-sm font-medium',
                    step.status === 'completed' && 'line-through text-gray-500'
                  )}
                >
                  {step.title}
                </span>
                {step.status === 'in_progress' && (
                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                    Current
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{formatDuration(step.estimatedMinutes)}</span>
                {step.scheduledDate && (
                  <>
                    <span className="text-gray-300">|</span>
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(step.scheduledDate)}</span>
                  </>
                )}
              </div>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-3">
                  {step.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {step.description}
                    </p>
                  )}

                  {step.completedAt && (
                    <div className="text-xs text-green-600">
                      Completed on {formatDate(step.completedAt)} at {formatTime(step.completedAt)}
                    </div>
                  )}

                  {/* Actions for pending/in-progress steps */}
                  {(step.status === 'pending' || step.status === 'in_progress') && (
                    <div
                      className="flex items-center gap-2 pt-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {step.status === 'pending' && onStart && (
                        <Button size="sm" variant="outline" onClick={onStart}>
                          <Play className="h-3 w-3 mr-1" />
                          Start
                        </Button>
                      )}
                      {step.status === 'in_progress' && onComplete && (
                        <Button size="sm" onClick={onComplete}>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Mark Complete
                        </Button>
                      )}
                      {(step.status === 'pending' || step.status === 'in_progress') && onSkip && (
                        <Button size="sm" variant="ghost" onClick={onSkip}>
                          <SkipForward className="h-3 w-3 mr-1" />
                          Skip
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );
}

function MilestoneIndicator({ progress }: { progress: number }) {
  const currentMilestone = MILESTONES.find((m) => progress >= m.percentage);
  const nextMilestone = MILESTONES.find((m) => progress < m.percentage);

  if (!currentMilestone && !nextMilestone) return null;

  return (
    <div className="flex items-center gap-4">
      {MILESTONES.map((milestone) => {
        const isReached = progress >= milestone.percentage;
        const MilestoneIcon = milestone.icon;

        return (
          <TooltipProvider key={milestone.percentage}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'flex items-center justify-center h-8 w-8 rounded-full border-2 transition-colors',
                    isReached
                      ? 'bg-green-50 border-green-500'
                      : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                  )}
                >
                  <MilestoneIcon
                    className={cn(
                      'h-4 w-4',
                      isReached ? 'text-green-500' : 'text-gray-400'
                    )}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {milestone.percentage}% - {milestone.label}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}

function ActivityCalendar({ activities }: { activities: DayActivity[] }) {
  return (
    <div className="space-y-2">
      {activities.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No activity yet</p>
        </div>
      ) : (
        activities.map((day) => (
          <div
            key={day.date}
            className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-900"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle className="h-3 w-3 text-green-600" />
              </div>
              <span className="text-sm">{formatDate(day.date)}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>{day.stepsCompleted} steps</span>
              <span>{formatDuration(day.minutesStudied)}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PlanProgressTracker({
  className,
  plan,
  goalTitle,
  onStepComplete,
  onStepSkip,
  onStepStart,
  showCalendar = true,
  showStats = true,
}: PlanProgressTrackerProps) {
  const [activeTab, setActiveTab] = useState<'steps' | 'activity'>('steps');

  // Computed values
  const stats = useMemo(() => {
    const completed = plan.steps.filter((s) => s.status === 'completed').length;
    const skipped = plan.steps.filter((s) => s.status === 'skipped').length;
    const remaining = plan.steps.filter(
      (s) => s.status === 'pending' || s.status === 'in_progress'
    ).length;
    const totalMinutes = plan.steps.reduce((acc, s) => acc + s.estimatedMinutes, 0);
    const completedMinutes = plan.steps
      .filter((s) => s.status === 'completed')
      .reduce((acc, s) => acc + s.estimatedMinutes, 0);

    return { completed, skipped, remaining, totalMinutes, completedMinutes };
  }, [plan.steps]);

  const activities = useMemo(() => generateActivityData(plan), [plan]);

  const streak = useMemo(() => {
    let count = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < activities.length; i++) {
      const activityDate = new Date(activities[i].date);
      activityDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);

      if (activityDate.getTime() === expectedDate.getTime()) {
        count++;
      } else {
        break;
      }
    }

    return count;
  }, [activities]);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              {goalTitle || 'Plan Progress'}
            </CardTitle>
            <CardDescription>
              {stats.completed} of {plan.steps.length} steps completed
            </CardDescription>
          </div>
          {streak > 0 && (
            <Badge variant="outline" className="gap-1">
              <Flame className="h-3 w-3 text-orange-500" />
              {streak} day streak
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress bar with milestones */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {formatDuration(stats.completedMinutes)} / {formatDuration(stats.totalMinutes)}
            </span>
            <span className="font-semibold">{plan.progress}%</span>
          </div>
          <Progress value={plan.progress} className="h-3" />
          <MilestoneIndicator progress={plan.progress} />
        </div>

        {/* Stats row */}
        {showStats && (
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <div className="text-lg font-semibold text-green-600">{stats.completed}</div>
              <div className="text-xs text-gray-500">Done</div>
            </div>
            <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <div className="text-lg font-semibold text-blue-600">{stats.remaining}</div>
              <div className="text-xs text-gray-500">Left</div>
            </div>
            <div className="text-center p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
              <div className="text-lg font-semibold text-amber-600">{stats.skipped}</div>
              <div className="text-xs text-gray-500">Skipped</div>
            </div>
            <div className="text-center p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
              <div className="text-lg font-semibold text-purple-600">{streak}</div>
              <div className="text-xs text-gray-500">Streak</div>
            </div>
          </div>
        )}

        {/* Tabs for steps/activity */}
        {showCalendar ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'steps' | 'activity')}>
            <TabsList className="w-full">
              <TabsTrigger value="steps" className="flex-1">Steps</TabsTrigger>
              <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="steps" className="mt-3">
              <ScrollArea className="h-[300px] pr-4">
                <div>
                  {plan.steps.map((step, index) => (
                    <StepTimelineItem
                      key={step.id}
                      step={step}
                      isLast={index === plan.steps.length - 1}
                      onComplete={() => onStepComplete?.(step.id)}
                      onSkip={() => onStepSkip?.(step.id)}
                      onStart={() => onStepStart?.(step.id)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="activity" className="mt-3">
              <ScrollArea className="h-[300px]">
                <ActivityCalendar activities={activities} />
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div>
              {plan.steps.map((step, index) => (
                <StepTimelineItem
                  key={step.id}
                  step={step}
                  isLast={index === plan.steps.length - 1}
                  onComplete={() => onStepComplete?.(step.id)}
                  onSkip={() => onStepSkip?.(step.id)}
                  onStart={() => onStepStart?.(step.id)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default PlanProgressTracker;
