'use client';

/**
 * ComparisonView Component
 *
 * Peer/target comparison with horizontal bar comparisons
 * and percentile indicators.
 */

import React from 'react';
import {
  Users,
  Target,
  TrendingUp,
  TrendingDown,
  Award,
  AlertCircle,
  Lightbulb,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { ComparisonViewProps, ComparisonMetric, ComparisonInsight } from './types';

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function PercentileGauge({ percentile }: { percentile: number }) {
  // Determine the color based on percentile
  const getColor = () => {
    if (percentile >= 75) return 'text-green-600';
    if (percentile >= 50) return 'text-blue-600';
    if (percentile >= 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBgColor = () => {
    if (percentile >= 75) return 'bg-green-500';
    if (percentile >= 50) return 'bg-blue-500';
    if (percentile >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/20"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={`${(percentile / 100) * 251.2} 251.2`}
          strokeLinecap="round"
          className={getBgColor()}
        />
      </svg>
      <div className="absolute text-center">
        <span className={cn('text-lg sm:text-xl font-bold', getColor())}>{percentile}</span>
        <p className="text-xs text-muted-foreground">percentile</p>
      </div>
    </div>
  );
}

function ComparisonBar({ metric }: { metric: ComparisonMetric }) {
  const maxValue = Math.max(metric.userValue, metric.peerAverage, metric.targetValue) * 1.2 || 1;

  const userPct = Math.max(0, Math.min(100, (metric.userValue / maxValue) * 100));
  const peerPct = Math.max(0, Math.min(100, (metric.peerAverage / maxValue) * 100));
  const targetPct = Math.max(0, Math.min(100, (metric.targetValue / maxValue) * 100));

  const isAboveAvg = metric.userValue >= metric.peerAverage;
  const isAboveTarget = metric.userValue >= metric.targetValue;

  const barColor = isAboveTarget ? 'bg-green-500' : isAboveAvg ? 'bg-blue-500' : 'bg-amber-500';

  return (
    <div className="space-y-3">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2">
        <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">{metric.name}</span>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <span className="text-[10px] sm:text-xs text-muted-foreground">
            {metric.percentile}th percentile
          </span>
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] font-medium shrink-0',
              isAboveAvg
                ? 'border-green-500/50 bg-green-500/10 text-green-600'
                : 'border-amber-500/50 bg-amber-500/10 text-amber-600'
            )}
          >
            {isAboveAvg ? 'Above Avg' : 'Below Avg'}
          </Badge>
        </div>
      </div>

      {/* Bar Container */}
      <div className="relative">
        {/* Background Track */}
        <div className="h-5 sm:h-6 rounded-md bg-slate-100 dark:bg-slate-700/50 overflow-hidden">
          {/* User Value Bar */}
          <div
            className={cn(
              'h-full rounded-md transition-all duration-500',
              barColor
            )}
            style={{ width: `${Math.max(userPct, 2)}%` }}
          />
        </div>

        {/* Target Marker */}
        <div
          className="absolute top-0 h-5 sm:h-6 w-0.5 bg-emerald-600 dark:bg-emerald-400"
          style={{ left: `${targetPct}%` }}
        />

        {/* Peer Average Marker */}
        <div
          className="absolute top-0 h-5 sm:h-6 w-0.5 bg-yellow-500"
          style={{ left: `${peerPct}%` }}
        />

        {/* User Value Label - Outside bar for visibility */}
        <div
          className="absolute top-0 h-5 sm:h-6 flex items-center"
          style={{ left: `${Math.max(userPct, 2) + 1}%` }}
        >
          <span className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
            {metric.userValue}{metric.unit}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-[10px] sm:text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-yellow-500 shrink-0" />
          <span className="truncate">Peer Avg: {metric.peerAverage}{metric.unit}</span>
        </span>
        <span className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0" />
          <span className="truncate">Target: {metric.targetValue}{metric.unit}</span>
        </span>
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: ComparisonInsight }) {
  const config = {
    strength: {
      icon: Award,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10 border-green-500/30',
    },
    weakness: {
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-500/10 border-red-500/30',
    },
    opportunity: {
      icon: Lightbulb,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-500/10 border-yellow-500/30',
    },
  };

  const cfg = config[insight.type];
  const Icon = cfg.icon;

  return (
    <div className={cn('rounded-lg border p-3', cfg.bgColor)}>
      <div className="flex items-start gap-2">
        <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', cfg.color)} />
        <div>
          <span className={cn('text-sm font-medium', cfg.color)}>
            {insight.title}
          </span>
          <p className="text-xs text-muted-foreground mt-0.5">
            {insight.description}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ComparisonView({
  comparison,
  className,
}: ComparisonViewProps) {
  return (
    <Card className={cn('bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg', className)}>
      <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
        {/* Responsive header - stack on mobile */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="rounded-xl bg-indigo-100 dark:bg-indigo-900/30 p-2 sm:p-2.5">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-xl font-bold text-slate-900 dark:text-white">Peer Comparison</CardTitle>
              <CardDescription className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">
                How you compare to {comparison.peerGroupSize.toLocaleString()} peers
              </CardDescription>
            </div>
          </div>
          <div className="self-center sm:self-auto">
            <PercentileGauge percentile={comparison.overallPercentile} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4 md:space-y-6 pt-4 sm:pt-6 p-4 sm:p-6">
        {/* Peer Group Info */}
        <div className="rounded-lg bg-muted/30 p-2 sm:p-3">
          <p className="text-xs sm:text-sm text-muted-foreground">
            {comparison.peerGroupDescription}
          </p>
        </div>

        {/* Metrics Comparison - Responsive spacing */}
        <div className="space-y-2.5 sm:space-y-3 md:space-y-4">
          {comparison.metrics.map((metric) => (
            <ComparisonBar key={metric.id} metric={metric} />
          ))}
        </div>

        {/* Strength & Improvement Areas - Stack on mobile */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Strengths */}
          <div className="space-y-2 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
            <h4 className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              Strengths
            </h4>
            {comparison.strengthAreas.length > 0 ? (
              <ul className="space-y-1">
                {comparison.strengthAreas.map((area, i) => (
                  <li
                    key={i}
                    className="text-[10px] sm:text-xs flex items-center gap-1 text-green-600"
                  >
                    <ChevronRight className="h-3 w-3 shrink-0" />
                    {area}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[10px] sm:text-xs text-muted-foreground">Keep improving!</p>
            )}
          </div>

          {/* Improvement Areas */}
          <div className="space-y-2 p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
            <h4 className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <Target className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
              Focus Areas
            </h4>
            {comparison.improvementAreas.length > 0 ? (
              <ul className="space-y-1">
                {comparison.improvementAreas.map((area, i) => (
                  <li
                    key={i}
                    className="text-[10px] sm:text-xs flex items-center gap-1 text-orange-600"
                  >
                    <ChevronRight className="h-3 w-3 shrink-0" />
                    {area}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[10px] sm:text-xs text-muted-foreground">Great progress!</p>
            )}
          </div>
        </div>

        {/* Insights - Responsive grid */}
        {comparison.insights.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
              Insights
            </h4>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {comparison.insights.slice(0, 3).map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ComparisonView;
