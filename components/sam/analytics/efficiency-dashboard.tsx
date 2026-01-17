'use client';

/**
 * EfficiencyDashboard Component
 *
 * Comprehensive dashboard for learning efficiency metrics.
 * Analyzes time spent vs outcomes to optimize learning strategies.
 *
 * Features:
 * - Time-to-mastery analysis
 * - Learning velocity metrics
 * - Efficiency ratios
 * - Optimal study patterns
 * - ROI on learning time
 */

import React, { useMemo } from 'react';
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  ComposedChart,
  Area,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  Brain,
  Timer,
  Activity,
  BarChart3,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface EfficiencyMetric {
  date: string;
  studyMinutes: number;
  masteryGained: number;
  questionsCompleted: number;
  accuracy: number;
  focusScore: number;
}

export interface TopicEfficiency {
  topicId: string;
  topicName: string;
  timeSpent: number;
  masteryGained: number;
  efficiency: number; // mastery per hour
  recommendedTime: number;
  status: 'efficient' | 'average' | 'inefficient';
}

export interface StudySession {
  id: string;
  startTime: Date;
  duration: number;
  masteryGained: number;
  topicsStudied: string[];
  focusScore: number;
}

export interface EfficiencyDashboardProps {
  metrics?: EfficiencyMetric[];
  topicEfficiency?: TopicEfficiency[];
  recentSessions?: StudySession[];
  weeklyGoal?: number;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const EFFICIENCY_THRESHOLDS = {
  excellent: 15, // mastery points per hour
  good: 10,
  average: 5,
  poor: 0,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateSampleMetrics(days: number = 30): EfficiencyMetric[] {
  const data: EfficiencyMetric[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const studyMinutes = Math.floor(30 + Math.random() * 90);
    const efficiency = 8 + Math.random() * 10; // mastery per hour
    const masteryGained = (studyMinutes / 60) * efficiency;

    data.push({
      date: date.toISOString().split('T')[0],
      studyMinutes,
      masteryGained: Math.round(masteryGained * 10) / 10,
      questionsCompleted: Math.floor(10 + Math.random() * 30),
      accuracy: Math.round(70 + Math.random() * 25),
      focusScore: Math.round(60 + Math.random() * 35),
    });
  }

  return data;
}

function generateSampleTopicEfficiency(): TopicEfficiency[] {
  const topics = [
    'JavaScript Basics',
    'React Hooks',
    'TypeScript Types',
    'CSS Flexbox',
    'Node.js APIs',
    'SQL Queries',
    'Git Commands',
    'Testing Fundamentals',
  ];

  return topics.map((topic, index) => {
    const timeSpent = Math.floor(1 + Math.random() * 10);
    const efficiency = 5 + Math.random() * 15;
    const masteryGained = timeSpent * efficiency;

    return {
      topicId: `topic-${index}`,
      topicName: topic,
      timeSpent,
      masteryGained: Math.round(masteryGained),
      efficiency: Math.round(efficiency * 10) / 10,
      recommendedTime: Math.round(timeSpent * (1 + Math.random() * 0.5)),
      status:
        efficiency >= EFFICIENCY_THRESHOLDS.excellent
          ? 'efficient'
          : efficiency >= EFFICIENCY_THRESHOLDS.good
          ? 'average'
          : 'inefficient',
    };
  });
}

function getEfficiencyColor(efficiency: number): string {
  if (efficiency >= EFFICIENCY_THRESHOLDS.excellent) return '#22c55e';
  if (efficiency >= EFFICIENCY_THRESHOLDS.good) return '#3b82f6';
  if (efficiency >= EFFICIENCY_THRESHOLDS.average) return '#f59e0b';
  return '#ef4444';
}

function getEfficiencyLabel(efficiency: number): string {
  if (efficiency >= EFFICIENCY_THRESHOLDS.excellent) return 'Excellent';
  if (efficiency >= EFFICIENCY_THRESHOLDS.good) return 'Good';
  if (efficiency >= EFFICIENCY_THRESHOLDS.average) return 'Average';
  return 'Needs Improvement';
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
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
    payload?: EfficiencyMetric;
  }>;
  label?: string;
}

function EfficiencyTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  const efficiency = data.studyMinutes > 0
    ? (data.masteryGained / (data.studyMinutes / 60)).toFixed(1)
    : '0';

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[200px]">
      <p className="font-medium text-sm mb-2">{label}</p>
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Study Time</span>
          <span className="font-medium">{formatTime(data.studyMinutes)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Mastery Gained</span>
          <span className="font-medium text-green-600">+{data.masteryGained.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Efficiency</span>
          <span className="font-medium" style={{ color: getEfficiencyColor(parseFloat(efficiency)) }}>
            {efficiency}/hr
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Accuracy</span>
          <span className="font-medium">{data.accuracy}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Focus Score</span>
          <span className="font-medium">{data.focusScore}%</span>
        </div>
      </div>
    </div>
  );
}

function TopicTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: TopicEfficiency }> }) {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[180px]">
      <p className="font-medium text-sm mb-2">{data.topicName}</p>
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Time Spent</span>
          <span className="font-medium">{data.timeSpent}h</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Mastery Gained</span>
          <span className="font-medium text-green-600">+{data.masteryGained}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Efficiency</span>
          <span className="font-medium" style={{ color: getEfficiencyColor(data.efficiency) }}>
            {data.efficiency}/hr
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function EfficiencyGauge({ value, label }: { value: number; label: string }) {
  const color = getEfficiencyColor(value);
  const percentage = Math.min(100, (value / 20) * 100);

  return (
    <div className="text-center">
      <div className="relative inline-flex items-center justify-center">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted"
          />
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${percentage * 2.51} 251`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold" style={{ color }}>
            {value.toFixed(1)}
          </span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-2">{label}</p>
      <p className="text-xs font-medium" style={{ color }}>
        {getEfficiencyLabel(value)}
      </p>
    </div>
  );
}

function InsightCard({
  icon: Icon,
  title,
  value,
  description,
  trend,
  color = 'blue',
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  description: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'amber' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    amber: 'bg-amber-500/10 text-amber-500',
    purple: 'bg-purple-500/10 text-purple-500',
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border">
      <div className={cn('p-2 rounded-lg', colorClasses[color])}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{title}</span>
          {trend && (
            trend === 'up' ? (
              <TrendingUp className="w-3 h-3 text-green-500" />
            ) : trend === 'down' ? (
              <TrendingDown className="w-3 h-3 text-red-500" />
            ) : null
          )}
        </div>
        <p className="text-lg font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function TopicEfficiencyBar({ topic }: { topic: TopicEfficiency }) {
  const statusColors = {
    efficient: 'bg-green-500',
    average: 'bg-blue-500',
    inefficient: 'bg-amber-500',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium truncate">{topic.topicName}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{topic.efficiency}/hr</span>
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              topic.status === 'efficient' && 'text-green-600 border-green-300',
              topic.status === 'average' && 'text-blue-600 border-blue-300',
              topic.status === 'inefficient' && 'text-amber-600 border-amber-300'
            )}
          >
            {topic.status}
          </Badge>
        </div>
      </div>
      <div className="flex gap-1 h-2">
        <div
          className={cn('rounded-l-full', statusColors[topic.status])}
          style={{ width: `${Math.min(100, (topic.efficiency / 20) * 100)}%` }}
        />
        <div className="flex-1 bg-muted rounded-r-full" />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{topic.timeSpent}h spent</span>
        <span>+{topic.masteryGained}% mastery</span>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EfficiencyDashboard({
  metrics,
  topicEfficiency,
  recentSessions = [],
  weeklyGoal = 300,
  className,
}: EfficiencyDashboardProps) {
  // Generate sample data if not provided
  const chartMetrics = useMemo(() => metrics ?? generateSampleMetrics(), [metrics]);
  const chartTopicEfficiency = useMemo(
    () => topicEfficiency ?? generateSampleTopicEfficiency(),
    [topicEfficiency]
  );

  // Calculate insights
  const insights = useMemo(() => {
    const totalMinutes = chartMetrics.reduce((sum, m) => sum + m.studyMinutes, 0);
    const totalMastery = chartMetrics.reduce((sum, m) => sum + m.masteryGained, 0);
    const avgAccuracy = chartMetrics.reduce((sum, m) => sum + m.accuracy, 0) / chartMetrics.length;
    const avgFocus = chartMetrics.reduce((sum, m) => sum + m.focusScore, 0) / chartMetrics.length;

    const overallEfficiency = totalMinutes > 0 ? totalMastery / (totalMinutes / 60) : 0;

    // Weekly stats
    const last7Days = chartMetrics.slice(-7);
    const weeklyMinutes = last7Days.reduce((sum, m) => sum + m.studyMinutes, 0);
    const weeklyMastery = last7Days.reduce((sum, m) => sum + m.masteryGained, 0);
    const weeklyEfficiency = weeklyMinutes > 0 ? weeklyMastery / (weeklyMinutes / 60) : 0;

    // Find best day
    const bestDay = chartMetrics.reduce((best, current) => {
      const currentEff = current.studyMinutes > 0
        ? current.masteryGained / (current.studyMinutes / 60)
        : 0;
      const bestEff = best.studyMinutes > 0 ? best.masteryGained / (best.studyMinutes / 60) : 0;
      return currentEff > bestEff ? current : best;
    });

    // Optimal study duration (mock calculation)
    const optimalDuration = 45; // minutes

    return {
      totalMinutes,
      totalMastery,
      avgAccuracy,
      avgFocus,
      overallEfficiency,
      weeklyMinutes,
      weeklyMastery,
      weeklyEfficiency,
      bestDay,
      optimalDuration,
      weeklyGoalProgress: (weeklyMinutes / weeklyGoal) * 100,
    };
  }, [chartMetrics, weeklyGoal]);

  // Prepare scatter data for time vs mastery
  const scatterData = useMemo(() => {
    return chartMetrics.map((m) => ({
      ...m,
      efficiency: m.studyMinutes > 0 ? m.masteryGained / (m.studyMinutes / 60) : 0,
    }));
  }, [chartMetrics]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Efficiency Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1">
          <CardContent className="pt-6 flex items-center justify-center">
            <EfficiencyGauge value={insights.overallEfficiency} label="Overall Efficiency" />
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InsightCard
                icon={Clock}
                title="Total Time"
                value={formatTime(insights.totalMinutes)}
                description="Across all sessions"
                color="blue"
              />
              <InsightCard
                icon={TrendingUp}
                title="Mastery Gained"
                value={`+${insights.totalMastery.toFixed(1)}%`}
                description="Total improvement"
                trend="up"
                color="green"
              />
              <InsightCard
                icon={Target}
                title="Avg Accuracy"
                value={`${insights.avgAccuracy.toFixed(0)}%`}
                description="Question accuracy"
                color="purple"
              />
              <InsightCard
                icon={Brain}
                title="Focus Score"
                value={`${insights.avgFocus.toFixed(0)}%`}
                description="Average focus level"
                color="amber"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Efficiency Over Time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Learning Efficiency Over Time
          </CardTitle>
          <CardDescription>
            Track how effectively you&apos;re converting study time into mastery
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartMetrics.slice(-14)}>
                <defs>
                  <linearGradient id="efficiencyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis yAxisId="left" className="text-xs" />
                <YAxis yAxisId="right" orientation="right" className="text-xs" />
                <Tooltip content={<EfficiencyTooltip />} />
                <Legend />
                <ReferenceLine
                  yAxisId="left"
                  y={EFFICIENCY_THRESHOLDS.good * 60}
                  stroke="#10b981"
                  strokeDasharray="5 5"
                  label="Target"
                />
                <Bar
                  yAxisId="left"
                  dataKey="studyMinutes"
                  name="Study Time (min)"
                  fill="#94a3b8"
                  radius={[4, 4, 0, 0]}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="masteryGained"
                  name="Mastery Gained"
                  stroke="#3b82f6"
                  fill="url(#efficiencyGradient)"
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Time vs Mastery Scatter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Time vs Mastery Analysis
            </CardTitle>
            <CardDescription>
              Each point represents a study session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="studyMinutes"
                    name="Study Time"
                    unit=" min"
                    className="text-xs"
                  />
                  <YAxis
                    dataKey="masteryGained"
                    name="Mastery"
                    unit="%"
                    className="text-xs"
                  />
                  <ZAxis dataKey="focusScore" range={[50, 200]} name="Focus" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Sessions" data={scatterData} fill="#3b82f6">
                    {scatterData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getEfficiencyColor(entry.efficiency)}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Bubble size indicates focus score. Colors show efficiency levels.</p>
            </div>
          </CardContent>
        </Card>

        {/* Topic Efficiency */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Efficiency by Topic
            </CardTitle>
            <CardDescription>
              Mastery gain per hour for each topic
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
              {chartTopicEfficiency
                .sort((a, b) => b.efficiency - a.efficiency)
                .map((topic) => (
                  <TopicEfficiencyBar key={topic.topicId} topic={topic} />
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Efficiency Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {insights.overallEfficiency >= EFFICIENCY_THRESHOLDS.good ? (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-300">
                    Great efficiency!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You&apos;re gaining {insights.overallEfficiency.toFixed(1)} mastery points per hour.
                    This is above average performance.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-700 dark:text-amber-300">
                    Room for improvement
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your current efficiency is {insights.overallEfficiency.toFixed(1)}/hr.
                    Try shorter, more focused sessions to improve.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Timer className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-blue-700 dark:text-blue-300">
                  Optimal session length
                </p>
                <p className="text-sm text-muted-foreground">
                  Based on your patterns, {insights.optimalDuration}-minute sessions tend to yield
                  the best efficiency. Consider using the Pomodoro technique.
                </p>
              </div>
            </div>

            {chartTopicEfficiency.filter((t) => t.status === 'inefficient').length > 0 && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 md:col-span-2">
                <Target className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <p className="font-medium text-purple-700 dark:text-purple-300">
                    Focus on these topics
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {chartTopicEfficiency
                      .filter((t) => t.status === 'inefficient')
                      .map((t) => t.topicName)
                      .join(', ')}{' '}
                    have lower efficiency. Consider breaking these into smaller learning chunks or
                    using different study methods.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default EfficiencyDashboard;
