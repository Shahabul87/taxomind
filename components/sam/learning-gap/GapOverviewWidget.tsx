'use client';

/**
 * GapOverviewWidget Component
 *
 * Visual summary of learning gaps by severity with donut chart
 * and gap cards for quick overview.
 */

import React from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronRight,
  Target,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { GapOverviewWidgetProps, LearningGapData, GapSeverity } from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const SEVERITY_CONFIG: Record<
  GapSeverity,
  { icon: typeof AlertTriangle; color: string; bgColor: string; label: string }
> = {
  critical: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-500/10 border-red-500/30',
    label: 'Critical',
  },
  moderate: {
    icon: AlertCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-500/10 border-yellow-500/30',
    label: 'Moderate',
  },
  minor: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
    label: 'Minor',
  },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function DonutChart({
  critical,
  moderate,
  minor,
}: {
  critical: number;
  moderate: number;
  minor: number;
}) {
  const total = critical + moderate + minor;
  if (total === 0) {
    return (
      <div className="relative flex h-32 w-32 items-center justify-center">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-muted/20"
          />
        </svg>
        <div className="absolute text-center">
          <span className="text-2xl font-bold">0</span>
          <p className="text-xs text-muted-foreground">gaps</p>
        </div>
      </div>
    );
  }

  const criticalPct = (critical / total) * 100;
  const moderatePct = (moderate / total) * 100;
  const minorPct = (minor / total) * 100;

  // Calculate stroke-dasharray and stroke-dashoffset for each segment
  const circumference = 2 * Math.PI * 40;
  const criticalDash = (criticalPct / 100) * circumference;
  const moderateDash = (moderatePct / 100) * circumference;
  const minorDash = (minorPct / 100) * circumference;

  const criticalOffset = 0;
  const moderateOffset = -criticalDash;
  const minorOffset = -(criticalDash + moderateDash);

  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="12"
          className="text-muted/20"
        />
        {/* Minor (blue) */}
        {minor > 0 && (
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="12"
            strokeDasharray={`${minorDash} ${circumference}`}
            strokeDashoffset={minorOffset}
            strokeLinecap="round"
          />
        )}
        {/* Moderate (yellow) */}
        {moderate > 0 && (
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#eab308"
            strokeWidth="12"
            strokeDasharray={`${moderateDash} ${circumference}`}
            strokeDashoffset={moderateOffset}
            strokeLinecap="round"
          />
        )}
        {/* Critical (red) */}
        {critical > 0 && (
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#ef4444"
            strokeWidth="12"
            strokeDasharray={`${criticalDash} ${circumference}`}
            strokeDashoffset={criticalOffset}
            strokeLinecap="round"
          />
        )}
      </svg>
      <div className="absolute text-center">
        <span className="text-2xl font-bold">{total}</span>
        <p className="text-xs text-muted-foreground">gaps</p>
      </div>
    </div>
  );
}

function SeverityLegend({
  critical,
  moderate,
  minor,
}: {
  critical: number;
  moderate: number;
  minor: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span className="text-sm">Critical</span>
        </div>
        <span className="font-semibold">{critical}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
          <span className="text-sm">Moderate</span>
        </div>
        <span className="font-semibold">{moderate}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="text-sm">Minor</span>
        </div>
        <span className="font-semibold">{minor}</span>
      </div>
    </div>
  );
}

function GapCard({
  gap,
  onClick,
}: {
  gap: LearningGapData;
  onClick?: () => void;
}) {
  const config = SEVERITY_CONFIG[gap.severity];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-lg cursor-pointer bg-white dark:bg-slate-800',
        gap.severity === 'critical' && 'border-red-300 dark:border-red-700 hover:border-red-400 dark:hover:border-red-600',
        gap.severity === 'moderate' && 'border-yellow-300 dark:border-yellow-700 hover:border-yellow-400 dark:hover:border-yellow-600',
        gap.severity === 'minor' && 'border-blue-300 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-600'
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5 p-1.5 rounded-lg', config.bgColor)}>
          <Icon className={cn('h-4 w-4', config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-sm truncate text-slate-900 dark:text-white">{gap.skillName}</span>
            <Badge variant="outline" className="shrink-0 text-xs capitalize font-semibold border-2">
              {config.label}
            </Badge>
          </div>
          {gap.topicName && (
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate mb-3">
              {gap.topicName}
            </p>
          )}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600 dark:text-slate-300">Current</span>
              <span className="font-bold text-slate-900 dark:text-white">{Math.round(gap.masteryLevel)}%</span>
            </div>
            <Progress
              value={gap.masteryLevel}
              className="h-2 bg-slate-200 dark:bg-slate-700"
            />
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600 dark:text-slate-300">Target</span>
              <span className="font-bold text-slate-900 dark:text-white">{Math.round(gap.targetMasteryLevel)}%</span>
            </div>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-400 dark:text-slate-500 shrink-0 mt-1" />
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GapOverviewWidget({
  gaps,
  summary,
  onGapClick,
  className,
}: GapOverviewWidgetProps) {
  // Get active gaps sorted by severity
  const activeGaps = gaps
    .filter((g) => g.status === 'active')
    .sort((a, b) => {
      const severityOrder = { critical: 0, moderate: 1, minor: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    })
    .slice(0, 5);

  const hasGaps = summary.total > 0;

  return (
    <Card className={cn('bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg', className)}>
      <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-red-100 dark:bg-red-900/30 p-2.5">
            <Target className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Gap Overview</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300 font-medium">
              Knowledge gaps requiring attention
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-6 pt-6">
        {/* Summary Section - Stack on mobile, side by side on larger screens */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between sm:gap-6">
          <DonutChart
            critical={summary.critical}
            moderate={summary.moderate}
            minor={summary.minor}
          />
          <SeverityLegend
            critical={summary.critical}
            moderate={summary.moderate}
            minor={summary.minor}
          />
        </div>

        {/* Stats Row - Responsive grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="rounded-lg bg-green-500/10 p-2 sm:p-3 text-center">
            <span className="text-base sm:text-lg font-bold text-green-600">
              {summary.resolvedThisWeek}
            </span>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Resolved this week</p>
          </div>
          <div className="rounded-lg bg-orange-500/10 p-2 sm:p-3 text-center">
            <span className="text-base sm:text-lg font-bold text-orange-600">
              {summary.newThisWeek}
            </span>
            <p className="text-[10px] sm:text-xs text-muted-foreground">New this week</p>
          </div>
        </div>

        {/* Gap Cards - Responsive grid for larger screens */}
        {hasGaps ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Priority Gaps
            </h4>
            <div className="grid gap-2 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              {activeGaps.map((gap) => (
                <GapCard
                  key={gap.id}
                  gap={gap}
                  onClick={() => onGapClick?.(gap)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-green-500/10 p-4 sm:p-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-green-500/20">
              <Target className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <h4 className="font-semibold text-green-700">No Active Gaps!</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Great job! You&apos;ve addressed all your knowledge gaps.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default GapOverviewWidget;
