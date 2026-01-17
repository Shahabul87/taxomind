'use client';

/**
 * TrendAnalysisChart Component
 *
 * Displays learning velocity and progress trends with bar charts
 * and directional indicators.
 */

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TrendAnalysisChartProps, TrendMetric, TrendDirection } from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const TREND_CONFIG: Record<
  TrendDirection,
  { icon: typeof TrendingUp; color: string; bgColor: string; label: string }
> = {
  improving: {
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-500/10',
    label: 'Improving',
  },
  stable: {
    icon: Minus,
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    label: 'Stable',
  },
  declining: {
    icon: TrendingDown,
    color: 'text-red-600',
    bgColor: 'bg-red-500/10',
    label: 'Declining',
  },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function MiniBarChart({ dataPoints, direction }: { dataPoints: TrendMetric['dataPoints']; direction: TrendDirection }) {
  if (!dataPoints || dataPoints.length === 0) return null;

  const maxValue = Math.max(...dataPoints.map((d) => d.value), 1);
  const minValue = Math.min(...dataPoints.map((d) => d.value));
  const range = maxValue - minValue || 1;

  const barColor = direction === 'improving' ? 'bg-green-500' : direction === 'declining' ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div className="flex h-16 items-end gap-1">
      {dataPoints.map((point, i) => {
        const height = ((point.value - minValue) / range) * 100;
        const isLatest = i === dataPoints.length - 1;

        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center"
          >
            <div
              className={cn(
                'w-full rounded-t transition-all',
                isLatest ? barColor : 'bg-muted',
                isLatest && 'opacity-100',
                !isLatest && 'opacity-60'
              )}
              style={{ height: `${Math.max(height, 10)}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

function MetricCard({
  metric,
  isSelected,
  onClick,
}: {
  metric: TrendMetric;
  isSelected: boolean;
  onClick: () => void;
}) {
  const config = TREND_CONFIG[metric.direction];
  const TrendIcon = config.icon;
  const changeText = metric.changePercent > 0 ? `+${metric.changePercent}%` : `${metric.changePercent}%`;

  return (
    <div
      className={cn(
        'rounded-lg border p-3 cursor-pointer transition-all',
        isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span className="text-sm font-medium">{metric.name}</span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-2xl font-bold">
              {metric.currentValue}
              {metric.unit && <span className="text-sm font-normal">{metric.unit}</span>}
            </span>
            <TrendIcon className={cn('h-4 w-4', config.color)} />
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn('text-xs', config.color)}
        >
          {changeText}
        </Badge>
      </div>
      <MiniBarChart dataPoints={metric.dataPoints} direction={metric.direction} />
    </div>
  );
}

function InsightCard({
  insight,
}: {
  insight: {
    id: string;
    type: 'positive' | 'negative' | 'neutral';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  };
}) {
  const typeConfig = {
    positive: { color: 'text-green-600', bgColor: 'bg-green-500/10 border-green-500/30' },
    negative: { color: 'text-red-600', bgColor: 'bg-red-500/10 border-red-500/30' },
    neutral: { color: 'text-blue-600', bgColor: 'bg-blue-500/10 border-blue-500/30' },
  };

  const config = typeConfig[insight.type];

  return (
    <div className={cn('rounded-lg border p-3', config.bgColor)}>
      <div className="flex items-start gap-2">
        <Lightbulb className={cn('h-4 w-4 mt-0.5 shrink-0', config.color)} />
        <div>
          <span className={cn('text-sm font-medium', config.color)}>
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

export function TrendAnalysisChart({
  trends,
  className,
}: TrendAnalysisChartProps) {
  const [selectedMetricId, setSelectedMetricId] = useState<string>(
    trends.metrics[0]?.id ?? ''
  );

  const selectedMetric = trends.metrics.find((m) => m.id === selectedMetricId);
  const overallConfig = TREND_CONFIG[trends.overallDirection];
  const OverallIcon = overallConfig.icon;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Trend Analysis</CardTitle>
              <CardDescription>
                Learning velocity and progress trends
              </CardDescription>
            </div>
          </div>
          <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full', overallConfig.bgColor)}>
            <OverallIcon className={cn('h-4 w-4', overallConfig.color)} />
            <span className={cn('text-sm font-medium', overallConfig.color)}>
              {overallConfig.label}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4">
        {/* Period Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm text-muted-foreground">Period:</span>
          <Badge variant="secondary" className="capitalize text-xs">
            {trends.period}
          </Badge>
        </div>

        {/* Summary Stats - Responsive grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="rounded-lg bg-muted/50 p-2 sm:p-3">
            <div className="flex items-center gap-1 sm:gap-2 mb-1">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Learning Velocity</span>
            </div>
            <span className="text-base sm:text-lg font-bold">
              {trends.learningVelocity.toFixed(1)}
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground ml-1">topics/week</span>
          </div>
          <div className="rounded-lg bg-muted/50 p-2 sm:p-3">
            <div className="flex items-center gap-1 sm:gap-2 mb-1">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              <span className="text-[10px] sm:text-xs text-muted-foreground">Gap Closure Rate</span>
            </div>
            <span className="text-base sm:text-lg font-bold">{trends.gapClosureRate}</span>
            <span className="text-[10px] sm:text-xs text-muted-foreground ml-1">gaps/week</span>
          </div>
        </div>

        {/* Metric Cards - Responsive grid with better breakpoints */}
        <div className="grid grid-cols-1 gap-2 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trends.metrics.map((metric) => (
            <MetricCard
              key={metric.id}
              metric={metric}
              isSelected={metric.id === selectedMetricId}
              onClick={() => setSelectedMetricId(metric.id)}
            />
          ))}
        </div>

        {/* Selected Metric Detail */}
        {selectedMetric && (
          <div className="rounded-lg border p-3 sm:p-4">
            <h4 className="text-xs sm:text-sm font-medium mb-1">{selectedMetric.name}</h4>
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3">
              {selectedMetric.description}
            </p>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm">
              <div>
                <span className="text-muted-foreground">Previous: </span>
                <span className="font-medium">
                  {selectedMetric.previousValue}
                  {selectedMetric.unit}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Current: </span>
                <span className="font-bold">
                  {selectedMetric.currentValue}
                  {selectedMetric.unit}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Insights - Responsive grid on larger screens */}
        {trends.insights.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs sm:text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
              Key Insights
            </h4>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {trends.insights.slice(0, 3).map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TrendAnalysisChart;
