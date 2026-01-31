'use client';

/**
 * RetentionCurveChart Component
 *
 * Visualizes memory retention over time using the Ebbinghaus forgetting curve model.
 * Shows actual retention vs optimal retention with spaced repetition.
 *
 * Features:
 * - Forgetting curve visualization
 * - Comparison of actual vs optimal retention
 * - Review timing indicators
 * - Retention strength by topic
 */

import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, TrendingDown, TrendingUp, Clock, Target, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface RetentionDataPoint {
  day: number;
  actualRetention: number;
  optimalRetention: number;
  withoutReview: number;
  reviewOccurred?: boolean;
}

export interface TopicRetention {
  topicId: string;
  topicName: string;
  currentRetention: number;
  lastReviewedAt: Date;
  nextReviewAt: Date;
  reviewCount: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface RetentionCurveChartProps {
  retentionData?: RetentionDataPoint[];
  topicRetention?: TopicRetention[];
  averageRetention?: number;
  optimalReviewInterval?: number;
  className?: string;
  showCurveComparison?: boolean;
  showTopicBreakdown?: boolean;
  days?: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generates Ebbinghaus forgetting curve data
 * R = e^(-t/S) where S is memory strength
 */
function generateForgettingCurve(
  days: number,
  initialStrength: number = 100,
  decayRate: number = 0.3,
  reviews: number[] = []
): RetentionDataPoint[] {
  const data: RetentionDataPoint[] = [];
  let currentStrength = initialStrength;
  let optimalStrength = initialStrength;

  for (let day = 0; day <= days; day++) {
    // Without any review - pure forgetting curve
    const withoutReview = initialStrength * Math.exp(-decayRate * day);

    // Check if review occurred
    const reviewOccurred = reviews.includes(day);
    if (reviewOccurred) {
      currentStrength = Math.min(100, currentStrength * 1.3); // 30% boost on review
      optimalStrength = Math.min(100, optimalStrength * 1.4);
    }

    data.push({
      day,
      actualRetention: Math.max(0, Math.min(100, currentStrength)),
      optimalRetention: Math.max(0, Math.min(100, optimalStrength)),
      withoutReview: Math.max(0, Math.min(100, withoutReview)),
      reviewOccurred,
    });

    // Apply decay for next day
    currentStrength *= 1 - decayRate * 0.15;
    optimalStrength *= 1 - decayRate * 0.1;
  }

  return data;
}

function getRetentionColor(retention: number): string {
  if (retention >= 80) return 'text-green-500';
  if (retention >= 60) return 'text-yellow-500';
  if (retention >= 40) return 'text-orange-500';
  return 'text-red-500';
}

function getRetentionBgColor(retention: number): string {
  if (retention >= 80) return 'bg-green-500';
  if (retention >= 60) return 'bg-yellow-500';
  if (retention >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

function getTrendIcon(trend: 'improving' | 'stable' | 'declining') {
  switch (trend) {
    case 'improving':
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    case 'declining':
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    default:
      return <Clock className="w-4 h-4 text-yellow-500" />;
  }
}

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[180px]">
      <p className="font-medium text-sm mb-2">Day {label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center justify-between gap-4 text-sm">
          <span className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">
              {entry.dataKey === 'actualRetention'
                ? 'Actual'
                : entry.dataKey === 'optimalRetention'
                ? 'Optimal'
                : 'No Review'}
            </span>
          </span>
          <span className="font-medium">{entry.value.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RetentionCurveChart({
  retentionData,
  topicRetention = [],
  averageRetention = 75,
  optimalReviewInterval = 7,
  className,
  showCurveComparison = true,
  showTopicBreakdown = true,
  days = 30,
}: RetentionCurveChartProps) {
  // Generate demo data if not provided
  const isUsingDemoData = !retentionData?.length;
  const chartData = useMemo(() => {
    if (retentionData?.length) return retentionData;

    // Generate sample data with reviews at optimal intervals
    const reviewDays = [1, 3, 7, 14, 21];
    return generateForgettingCurve(days, 100, 0.25, reviewDays);
  }, [retentionData, days]);

  // Calculate retention insights
  const insights = useMemo(() => {
    const finalActual = chartData[chartData.length - 1]?.actualRetention ?? 0;
    const finalOptimal = chartData[chartData.length - 1]?.optimalRetention ?? 0;
    const finalWithoutReview = chartData[chartData.length - 1]?.withoutReview ?? 0;
    const retentionGain = finalActual - finalWithoutReview;
    const reviewCount = chartData.filter((d) => d.reviewOccurred).length;

    return {
      finalActual,
      finalOptimal,
      finalWithoutReview,
      retentionGain,
      reviewCount,
      efficiencyScore: Math.round((finalActual / finalOptimal) * 100),
    };
  }, [chartData]);

  return (
    <div className={cn('space-y-6', className)}>
      {isUsingDemoData && (
        <div className="flex justify-end">
          <Badge variant="outline" className="text-xs text-muted-foreground">Sample Data</Badge>
        </div>
      )}
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Retention</p>
                <p className={cn('text-2xl font-bold', getRetentionColor(averageRetention))}>
                  {averageRetention.toFixed(0)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Retention Gain</p>
                <p className="text-2xl font-bold text-green-500">
                  +{insights.retentionGain.toFixed(0)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Efficiency</p>
                <p className="text-2xl font-bold text-blue-500">
                  {insights.efficiencyScore}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Clock className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Optimal Interval</p>
                <p className="text-2xl font-bold text-purple-500">
                  {optimalReviewInterval}d
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Retention Curve */}
      {showCurveComparison && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Memory Retention Over Time
            </CardTitle>
            <CardDescription>
              Comparison of retention with and without spaced repetition reviews
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="optimalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="noReviewGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="day"
                    tickFormatter={(value) => `Day ${value}`}
                    className="text-xs"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    className="text-xs"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="3 3" label="Target" />
                  <Area
                    type="monotone"
                    dataKey="withoutReview"
                    name="Without Review"
                    stroke="#ef4444"
                    fill="url(#noReviewGradient)"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                  <Area
                    type="monotone"
                    dataKey="actualRetention"
                    name="With Reviews"
                    stroke="#10b981"
                    fill="url(#actualGradient)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="optimalRetention"
                    name="Optimal Schedule"
                    stroke="#3b82f6"
                    fill="url(#optimalGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Legend Explanation */}
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-1 rounded bg-red-500 mt-1.5" />
                  <div>
                    <p className="font-medium">Without Review</p>
                    <p className="text-muted-foreground text-xs">
                      Natural forgetting curve (Ebbinghaus)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-1 rounded bg-green-500 mt-1.5" />
                  <div>
                    <p className="font-medium">With Reviews</p>
                    <p className="text-muted-foreground text-xs">
                      Your actual retention with current reviews
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-1 rounded bg-blue-500 mt-1.5" />
                  <div>
                    <p className="font-medium">Optimal Schedule</p>
                    <p className="text-muted-foreground text-xs">
                      Maximum retention with perfect timing
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Topic-wise Retention Breakdown */}
      {showTopicBreakdown && topicRetention.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Retention by Topic
            </CardTitle>
            <CardDescription>
              Memory strength across different learning topics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topicRetention.map((topic) => (
                <div key={topic.topicId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{topic.topicName}</span>
                      {getTrendIcon(topic.trend)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('font-bold', getRetentionColor(topic.currentRetention))}>
                        {topic.currentRetention.toFixed(0)}%
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {topic.reviewCount} reviews
                      </Badge>
                    </div>
                  </div>
                  <Progress
                    value={topic.currentRetention}
                    className={cn(
                      'h-2',
                      topic.currentRetention >= 80 && '[&>div]:bg-green-500',
                      topic.currentRetention >= 60 &&
                        topic.currentRetention < 80 &&
                        '[&>div]:bg-yellow-500',
                      topic.currentRetention >= 40 &&
                        topic.currentRetention < 60 &&
                        '[&>div]:bg-orange-500',
                      topic.currentRetention < 40 && '[&>div]:bg-red-500'
                    )}
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Last reviewed: {new Date(topic.lastReviewedAt).toLocaleDateString()}</span>
                    <span>
                      Next review: {new Date(topic.nextReviewAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Retention Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Retention Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.efficiencyScore < 80 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-700 dark:text-yellow-300">
                    Review timing could be improved
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your retention efficiency is at {insights.efficiencyScore}%. Consider reviewing
                    closer to the optimal intervals for better memory consolidation.
                  </p>
                </div>
              </div>
            )}

            {insights.retentionGain > 30 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <TrendingUp className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-300">
                    Spaced repetition is working!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your reviews have boosted retention by {insights.retentionGain.toFixed(0)}%
                    compared to not reviewing. Keep up the great work!
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Brain className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-blue-700 dark:text-blue-300">
                  Recommended Review Schedule
                </p>
                <p className="text-sm text-muted-foreground">
                  Based on your learning patterns, optimal review intervals are: Day 1, Day 3, Day
                  7, Day 14, then every {optimalReviewInterval} days.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RetentionCurveChart;
