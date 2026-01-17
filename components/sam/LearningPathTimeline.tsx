'use client';

/**
 * LearningPathTimeline Component
 *
 * Displays a chronological timeline view of learning path progress.
 * Shows completed, current, and upcoming milestones with estimated completion.
 *
 * Features:
 * - Visual timeline with status indicators
 * - Milestone-based progress tracking
 * - Estimated completion dates
 * - Interactive navigation to concepts
 * - Adaptive pacing recommendations
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  CircleDot,
  ArrowRight,
  Target,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Zap,
  Award,
  Star,
  Flag,
  MapPin,
  Route,
  Milestone,
} from 'lucide-react';
import { format, formatDistanceToNow, addDays, isPast, isToday, isFuture } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

type MilestoneStatus = 'completed' | 'current' | 'upcoming' | 'locked';
type MilestoneType = 'concept' | 'skill' | 'chapter' | 'checkpoint' | 'assessment';

interface TimelineMilestone {
  id: string;
  name: string;
  type: MilestoneType;
  description?: string;
  status: MilestoneStatus;
  completedAt?: string;
  estimatedDate?: string;
  masteryLevel: number;
  targetMastery: number;
  order: number;
  isOptional?: boolean;
  rewards?: {
    xp: number;
    badges?: string[];
  };
}

interface LearningPathTimelineData {
  pathId: string;
  pathName: string;
  courseId?: string;
  courseName?: string;
  milestones: TimelineMilestone[];
  progress: {
    completedCount: number;
    totalCount: number;
    completionPercentage: number;
    currentMilestoneIndex: number;
    estimatedCompletionDate?: string;
    averagePacePerDay: number;
    daysRemaining: number;
  };
  stats: {
    totalXpEarned: number;
    badgesEarned: number;
    currentStreak: number;
    bestStreak: number;
    totalTimeSpent: number; // minutes
  };
  pacing: {
    status: 'ahead' | 'on_track' | 'behind';
    daysAheadOrBehind: number;
    recommendation?: string;
  };
}

interface LearningPathTimelineProps {
  pathId?: string;
  courseId?: string;
  onMilestoneClick?: (milestoneId: string) => void;
  showStats?: boolean;
  showPacing?: boolean;
  compact?: boolean;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_CONFIG = {
  completed: {
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500',
    lightBg: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500',
    icon: CheckCircle2,
    label: 'Completed',
  },
  current: {
    color: 'text-blue-500',
    bgColor: 'bg-blue-500',
    lightBg: 'bg-blue-500/10',
    borderColor: 'border-blue-500',
    icon: CircleDot,
    label: 'In Progress',
  },
  upcoming: {
    color: 'text-gray-400',
    bgColor: 'bg-gray-300',
    lightBg: 'bg-gray-500/10',
    borderColor: 'border-gray-300',
    icon: Circle,
    label: 'Upcoming',
  },
  locked: {
    color: 'text-gray-300',
    bgColor: 'bg-gray-200',
    lightBg: 'bg-gray-200/50',
    borderColor: 'border-gray-200',
    icon: Circle,
    label: 'Locked',
  },
};

const TYPE_ICONS: Record<MilestoneType, typeof Star> = {
  concept: Target,
  skill: Zap,
  chapter: Flag,
  checkpoint: MapPin,
  assessment: Award,
};

const PACING_CONFIG = {
  ahead: {
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    icon: TrendingUp,
    label: 'Ahead of Schedule',
  },
  on_track: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    icon: Target,
    label: 'On Track',
  },
  behind: {
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    icon: AlertCircle,
    label: 'Behind Schedule',
  },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function PathStats({ stats, progress }: { stats: LearningPathTimelineData['stats']; progress: LearningPathTimelineData['progress'] }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      <div className="text-center p-3 rounded-lg bg-muted/50">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="text-lg font-bold">{stats.totalXpEarned}</span>
        </div>
        <span className="text-xs text-muted-foreground">XP Earned</span>
      </div>
      <div className="text-center p-3 rounded-lg bg-muted/50">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Award className="h-4 w-4 text-purple-500" />
          <span className="text-lg font-bold">{stats.badgesEarned}</span>
        </div>
        <span className="text-xs text-muted-foreground">Badges</span>
      </div>
      <div className="text-center p-3 rounded-lg bg-muted/50">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Zap className="h-4 w-4 text-orange-500" />
          <span className="text-lg font-bold">{stats.currentStreak}</span>
        </div>
        <span className="text-xs text-muted-foreground">Day Streak</span>
      </div>
      <div className="text-center p-3 rounded-lg bg-muted/50">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Clock className="h-4 w-4 text-blue-500" />
          <span className="text-lg font-bold">{Math.round(stats.totalTimeSpent / 60)}</span>
        </div>
        <span className="text-xs text-muted-foreground">Hours</span>
      </div>
    </div>
  );
}

function PacingIndicator({ pacing }: { pacing: LearningPathTimelineData['pacing'] }) {
  const config = PACING_CONFIG[pacing.status];
  const Icon = config.icon;

  return (
    <div className={cn('p-3 rounded-lg border', config.bgColor, config.borderColor)}>
      <div className="flex items-center gap-3">
        <Icon className={cn('h-5 w-5', config.color)} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={cn('font-medium text-sm', config.color)}>{config.label}</span>
            {pacing.daysAheadOrBehind !== 0 && (
              <Badge variant="outline" className={cn('text-xs', config.color)}>
                {pacing.daysAheadOrBehind > 0 ? '+' : ''}{pacing.daysAheadOrBehind} days
              </Badge>
            )}
          </div>
          {pacing.recommendation && (
            <p className="text-xs text-muted-foreground mt-1">{pacing.recommendation}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function TimelineMilestoneCard({
  milestone,
  isFirst,
  isLast,
  onClick,
  compact,
}: {
  milestone: TimelineMilestone;
  isFirst: boolean;
  isLast: boolean;
  onClick?: () => void;
  compact?: boolean;
}) {
  const statusConfig = STATUS_CONFIG[milestone.status];
  const StatusIcon = statusConfig.icon;
  const TypeIcon = TYPE_ICONS[milestone.type];

  const estimatedDate = milestone.estimatedDate ? new Date(milestone.estimatedDate) : null;
  const completedDate = milestone.completedAt ? new Date(milestone.completedAt) : null;

  return (
    <div className="flex gap-4">
      {/* Timeline line and dot */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'w-4 h-4 rounded-full border-2 z-10 transition-all',
            statusConfig.borderColor,
            milestone.status === 'completed' || milestone.status === 'current'
              ? statusConfig.bgColor
              : 'bg-background'
          )}
        >
          {milestone.status === 'current' && (
            <div className="w-2 h-2 bg-white rounded-full m-0.5 animate-pulse" />
          )}
        </div>
        {!isLast && (
          <div
            className={cn(
              'w-0.5 flex-1 my-1',
              milestone.status === 'completed' ? 'bg-emerald-500' : 'bg-border'
            )}
          />
        )}
      </div>

      {/* Milestone content */}
      <div
        className={cn(
          'flex-1 pb-6 cursor-pointer group',
          isLast && 'pb-0'
        )}
        onClick={onClick}
      >
        <div
          className={cn(
            'p-3 rounded-lg border transition-all hover:shadow-md',
            statusConfig.lightBg,
            statusConfig.borderColor.replace('border-', 'border-'),
            milestone.status === 'locked' && 'opacity-50'
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                statusConfig.lightBg
              )}
            >
              <TypeIcon className={cn('h-4 w-4', statusConfig.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{milestone.name}</span>
                <Badge variant="outline" className="text-xs capitalize">
                  {milestone.type}
                </Badge>
                {milestone.isOptional && (
                  <Badge variant="secondary" className="text-xs">Optional</Badge>
                )}
              </div>

              {!compact && milestone.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {milestone.description}
                </p>
              )}

              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <StatusIcon className={cn('h-3 w-3', statusConfig.color)} />
                <span className={cn('text-xs', statusConfig.color)}>{statusConfig.label}</span>

                {milestone.masteryLevel > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {milestone.masteryLevel}% mastery
                  </span>
                )}

                {completedDate && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {format(completedDate, 'MMM d, yyyy')}
                  </span>
                )}

                {!completedDate && estimatedDate && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {isToday(estimatedDate)
                      ? 'Today'
                      : isPast(estimatedDate)
                        ? `Overdue (${formatDistanceToNow(estimatedDate, { addSuffix: true })})`
                        : format(estimatedDate, 'MMM d')}
                  </span>
                )}
              </div>

              {/* Rewards preview */}
              {!compact && milestone.rewards && (milestone.rewards.xp > 0 || (milestone.rewards.badges?.length ?? 0) > 0) && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-dashed">
                  {milestone.rewards.xp > 0 && (
                    <Badge variant="outline" className="text-xs">
                      <Star className="h-3 w-3 mr-1 text-yellow-500" />
                      +{milestone.rewards.xp} XP
                    </Badge>
                  )}
                  {milestone.rewards.badges?.map((badge) => (
                    <Badge key={badge} variant="outline" className="text-xs">
                      <Award className="h-3 w-3 mr-1 text-purple-500" />
                      {badge}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LearningPathTimeline({
  pathId,
  courseId,
  onMilestoneClick,
  showStats = true,
  showPacing = true,
  compact = false,
  className,
}: LearningPathTimelineProps) {
  const [timelineData, setTimelineData] = useState<LearningPathTimelineData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch timeline data
  const fetchTimelineData = useCallback(async () => {
    if (!pathId && !courseId) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (pathId) params.append('pathId', pathId);
      if (courseId) params.append('courseId', courseId);

      const response = await fetch(`/api/sam/learning-path/timeline?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch timeline data');
      }

      const result = await response.json();
      if (result.success) {
        setTimelineData(result.data);
      } else {
        throw new Error(result.error ?? 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timeline');
    } finally {
      setIsLoading(false);
    }
  }, [pathId, courseId]);

  useEffect(() => {
    fetchTimelineData();
  }, [fetchTimelineData]);

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            <Skeleton className="h-6 w-48" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Timeline</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchTimelineData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!timelineData || (!pathId && !courseId)) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" />
            <CardTitle>Learning Path Timeline</CardTitle>
          </div>
          <CardDescription>
            Track your progress through the learning path
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Milestone className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground text-center">
            No learning path selected. Enroll in a course to see your timeline.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Route className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">{timelineData.pathName}</CardTitle>
              {timelineData.courseName && (
                <CardDescription>{timelineData.courseName}</CardDescription>
              )}
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={fetchTimelineData}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Progress overview */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">
              {timelineData.progress.completedCount}/{timelineData.progress.totalCount} milestones
            </span>
          </div>
          <Progress value={timelineData.progress.completionPercentage} className="h-2" />
          {timelineData.progress.estimatedCompletionDate && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Estimated completion: {format(new Date(timelineData.progress.estimatedCompletionDate), 'MMMM d, yyyy')}
              ({timelineData.progress.daysRemaining} days remaining)
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats */}
        {showStats && !compact && (
          <PathStats stats={timelineData.stats} progress={timelineData.progress} />
        )}

        {/* Pacing indicator */}
        {showPacing && !compact && <PacingIndicator pacing={timelineData.pacing} />}

        {/* Timeline */}
        <div className="space-y-0">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Milestone className="h-4 w-4" />
            Milestones
          </h4>
          <ScrollArea className={cn('pr-4', compact ? 'h-48' : 'h-80')}>
            <div className="space-y-0">
              {timelineData.milestones.map((milestone, idx) => (
                <TimelineMilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  isFirst={idx === 0}
                  isLast={idx === timelineData.milestones.length - 1}
                  onClick={() => onMilestoneClick?.(milestone.id)}
                  compact={compact}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

export default LearningPathTimeline;
