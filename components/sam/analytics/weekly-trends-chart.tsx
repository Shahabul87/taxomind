'use client';

/**
 * WeeklyTrendsChart Component
 *
 * Visualizes weekly learning patterns, study time distribution,
 * and performance trends over time.
 *
 * Features:
 * - Weekly study time heatmap
 * - Performance trends by day of week
 * - Activity distribution visualization
 * - Week-over-week comparison
 */

import React, { useMemo } from 'react';
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  Flame,
  BookOpen,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface DailyData {
  date: string;
  dayOfWeek: string;
  studyMinutes: number;
  sessionsCompleted: number;
  questionsAnswered: number;
  accuracy: number;
  topicsStudied: number;
}

export interface WeeklyComparison {
  week: string;
  startDate: string;
  endDate: string;
  totalStudyTime: number;
  avgAccuracy: number;
  sessionsCompleted: number;
  topicsCompleted: number;
  streak: number;
}

export interface HourlyActivity {
  hour: number;
  activity: number;
  label: string;
}

export interface WeeklyTrendsChartProps {
  dailyData?: DailyData[];
  weeklyComparison?: WeeklyComparison[];
  hourlyActivity?: HourlyActivity[];
  currentWeekGoal?: number;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  hour: i,
  label: i === 0 ? '12am' : i === 12 ? '12pm' : i < 12 ? `${i}am` : `${i - 12}pm`,
}));

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateSampleDailyData(weeks: number = 4): DailyData[] {
  const data: DailyData[] = [];
  const today = new Date();

  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayOfWeek = DAYS_OF_WEEK[date.getDay()];

    // Generate realistic patterns (less activity on weekends)
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseMinutes = isWeekend ? 30 : 60;
    const randomVariation = Math.random() * 40 - 20;

    data.push({
      date: date.toISOString().split('T')[0],
      dayOfWeek,
      studyMinutes: Math.max(0, Math.round(baseMinutes + randomVariation)),
      sessionsCompleted: Math.floor(Math.random() * 3) + 1,
      questionsAnswered: Math.floor(Math.random() * 20) + 5,
      accuracy: Math.round(70 + Math.random() * 25),
      topicsStudied: Math.floor(Math.random() * 4) + 1,
    });
  }

  return data;
}

function generateSampleWeeklyData(weeks: number = 8): WeeklyComparison[] {
  const data: WeeklyComparison[] = [];
  const today = new Date();

  for (let w = weeks - 1; w >= 0; w--) {
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - w * 7 - today.getDay());
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    data.push({
      week: `Week ${weeks - w}`,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalStudyTime: Math.round(200 + Math.random() * 150 + w * 10), // Trend up over time
      avgAccuracy: Math.round(72 + Math.random() * 15 + w * 1.5),
      sessionsCompleted: Math.floor(10 + Math.random() * 8),
      topicsCompleted: Math.floor(5 + Math.random() * 5),
      streak: Math.floor(Math.random() * 7),
    });
  }

  return data;
}

function generateHourlyActivity(): HourlyActivity[] {
  return HOURS.map(({ hour, label }) => ({
    hour,
    label,
    // Peak hours around 9-11am and 7-9pm
    activity:
      hour >= 9 && hour <= 11
        ? 60 + Math.random() * 30
        : hour >= 19 && hour <= 21
        ? 50 + Math.random() * 30
        : hour >= 6 && hour <= 22
        ? 20 + Math.random() * 20
        : Math.random() * 10,
  }));
}

function getActivityColor(value: number): string {
  if (value >= 70) return '#22c55e'; // green-500
  if (value >= 50) return '#3b82f6'; // blue-500
  if (value >= 30) return '#f59e0b'; // amber-500
  if (value >= 10) return '#94a3b8'; // slate-400
  return '#e2e8f0'; // slate-200
}

function formatMinutes(minutes: number): string {
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
  }>;
  label?: string;
}

function DailyTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload as DailyData | undefined;
  if (!data) return null;

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[200px]">
      <p className="font-medium text-sm mb-2">
        {data.dayOfWeek}, {label}
      </p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Study Time</span>
          <span className="font-medium">{formatMinutes(data.studyMinutes)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Sessions</span>
          <span className="font-medium">{data.sessionsCompleted}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Questions</span>
          <span className="font-medium">{data.questionsAnswered}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Accuracy</span>
          <span className="font-medium">{data.accuracy}%</span>
        </div>
      </div>
    </div>
  );
}

function WeeklyTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload as WeeklyComparison | undefined;
  if (!data) return null;

  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[200px]">
      <p className="font-medium text-sm mb-1">{label}</p>
      <p className="text-xs text-muted-foreground mb-2">
        {data.startDate} - {data.endDate}
      </p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Time</span>
          <span className="font-medium">{formatMinutes(data.totalStudyTime)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Avg Accuracy</span>
          <span className="font-medium">{data.avgAccuracy}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Sessions</span>
          <span className="font-medium">{data.sessionsCompleted}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Streak</span>
          <span className="font-medium">{data.streak} days</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ActivityHeatmap({ hourlyActivity }: { hourlyActivity: HourlyActivity[] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {hourlyActivity.map((hour) => (
          <div
            key={hour.hour}
            className="flex flex-col items-center gap-1"
            title={`${hour.label}: ${Math.round(hour.activity)}% activity`}
          >
            <div
              className="w-6 h-8 rounded-sm transition-colors"
              style={{ backgroundColor: getActivityColor(hour.activity) }}
            />
            <span className="text-[10px] text-muted-foreground">{hour.label}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          {[10, 30, 50, 70, 90].map((level) => (
            <div
              key={level}
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: getActivityColor(level) }}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}

function TrendIndicator({
  current,
  previous,
  label,
  format = 'number',
}: {
  current: number;
  previous: number;
  label: string;
  format?: 'number' | 'percent' | 'time';
}) {
  const change = current - previous;
  const percentChange = previous > 0 ? (change / previous) * 100 : 0;
  const isPositive = change > 0;
  const isNeutral = change === 0;

  const formatValue = (val: number) => {
    switch (format) {
      case 'percent':
        return `${val}%`;
      case 'time':
        return formatMinutes(val);
      default:
        return val.toString();
    }
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium">{formatValue(current)}</span>
        {!isNeutral && (
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              isPositive ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'
            )}
          >
            {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {Math.abs(percentChange).toFixed(0)}%
          </Badge>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function WeeklyTrendsChart({
  dailyData,
  weeklyComparison,
  hourlyActivity,
  currentWeekGoal = 300,
  className,
}: WeeklyTrendsChartProps) {
  // Generate sample data if not provided
  const chartDailyData = useMemo(() => dailyData ?? generateSampleDailyData(), [dailyData]);

  const chartWeeklyData = useMemo(
    () => weeklyComparison ?? generateSampleWeeklyData(),
    [weeklyComparison]
  );

  const chartHourlyActivity = useMemo(
    () => hourlyActivity ?? generateHourlyActivity(),
    [hourlyActivity]
  );

  // Calculate insights
  const insights = useMemo(() => {
    const currentWeek = chartWeeklyData[chartWeeklyData.length - 1];
    const previousWeek = chartWeeklyData[chartWeeklyData.length - 2];

    const thisWeekDays = chartDailyData.slice(-7);
    const totalMinutesThisWeek = thisWeekDays.reduce((sum, d) => sum + d.studyMinutes, 0);
    const avgAccuracyThisWeek =
      thisWeekDays.reduce((sum, d) => sum + d.accuracy, 0) / thisWeekDays.length;
    const sessionsThisWeek = thisWeekDays.reduce((sum, d) => sum + d.sessionsCompleted, 0);
    const questionsThisWeek = thisWeekDays.reduce((sum, d) => sum + d.questionsAnswered, 0);

    // Find most productive day
    const dayTotals = DAYS_OF_WEEK.map((day) => ({
      day,
      total: chartDailyData.filter((d) => d.dayOfWeek === day).reduce((sum, d) => sum + d.studyMinutes, 0),
    }));
    const mostProductiveDay = dayTotals.sort((a, b) => b.total - a.total)[0];

    // Find peak hours
    const peakHour = chartHourlyActivity.sort((a, b) => b.activity - a.activity)[0];

    return {
      currentWeek,
      previousWeek,
      totalMinutesThisWeek,
      avgAccuracyThisWeek,
      sessionsThisWeek,
      questionsThisWeek,
      mostProductiveDay,
      peakHour,
      goalProgress: (totalMinutesThisWeek / currentWeekGoal) * 100,
    };
  }, [chartDailyData, chartWeeklyData, chartHourlyActivity, currentWeekGoal]);

  // Aggregate daily data by day of week for pattern analysis
  const dayOfWeekPattern = useMemo(() => {
    return DAYS_OF_WEEK.map((day) => {
      const dayData = chartDailyData.filter((d) => d.dayOfWeek === day);
      return {
        day,
        avgMinutes: dayData.reduce((sum, d) => sum + d.studyMinutes, 0) / Math.max(dayData.length, 1),
        avgAccuracy: dayData.reduce((sum, d) => sum + d.accuracy, 0) / Math.max(dayData.length, 1),
        avgSessions: dayData.reduce((sum, d) => sum + d.sessionsCompleted, 0) / Math.max(dayData.length, 1),
      };
    });
  }, [chartDailyData]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">
                  {formatMinutes(insights.totalMinutesThisWeek)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Target className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Goal Progress</p>
                <p className="text-2xl font-bold">{Math.min(100, insights.goalProgress).toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Activity className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Accuracy</p>
                <p className="text-2xl font-bold">{insights.avgAccuracyThisWeek.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Peak Day</p>
                <p className="text-2xl font-bold">{insights.mostProductiveDay?.day}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily" className="gap-2">
            <Calendar className="w-4 h-4" />
            Daily View
          </TabsTrigger>
          <TabsTrigger value="weekly" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Weekly Trends
          </TabsTrigger>
          <TabsTrigger value="patterns" className="gap-2">
            <Activity className="w-4 h-4" />
            Patterns
          </TabsTrigger>
        </TabsList>

        {/* Daily View */}
        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Daily Study Time
              </CardTitle>
              <CardDescription>Your study activity over the past weeks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartDailyData.slice(-14)}>
                    <defs>
                      <linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis yAxisId="left" className="text-xs" />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} className="text-xs" />
                    <Tooltip content={<DailyTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="studyMinutes"
                      name="Study Time (min)"
                      stroke="#3b82f6"
                      fill="url(#studyGradient)"
                      strokeWidth={2}
                      yAxisId="left"
                    />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      name="Accuracy (%)"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      yAxisId="right"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weekly Trends */}
        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Week-over-Week Progress
              </CardTitle>
              <CardDescription>Your learning trends across weeks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartWeeklyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="week" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip content={<WeeklyTooltip />} />
                    <Legend />
                    <Bar dataKey="totalStudyTime" name="Study Time (min)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avgAccuracy" name="Avg Accuracy (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Week Comparison */}
              {insights.previousWeek && (
                <div className="mt-4 pt-4 border-t space-y-2">
                  <h4 className="font-medium text-sm">Compared to Last Week</h4>
                  <TrendIndicator
                    current={insights.currentWeek?.totalStudyTime ?? 0}
                    previous={insights.previousWeek.totalStudyTime}
                    label="Study Time"
                    format="time"
                  />
                  <TrendIndicator
                    current={insights.currentWeek?.avgAccuracy ?? 0}
                    previous={insights.previousWeek.avgAccuracy}
                    label="Accuracy"
                    format="percent"
                  />
                  <TrendIndicator
                    current={insights.currentWeek?.sessionsCompleted ?? 0}
                    previous={insights.previousWeek.sessionsCompleted}
                    label="Sessions"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patterns */}
        <TabsContent value="patterns" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Day of Week Pattern */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Day of Week Pattern
                </CardTitle>
                <CardDescription>Your typical study pattern by day</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dayOfWeekPattern}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="day" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="avgMinutes" name="Avg Minutes" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                        {dayOfWeekPattern.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.day === insights.mostProductiveDay?.day ? '#10b981' : '#3b82f6'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Hourly Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Peak Study Hours
                </CardTitle>
                <CardDescription>When you&apos;re most active during the day</CardDescription>
              </CardHeader>
              <CardContent>
                <ActivityHeatmap hourlyActivity={chartHourlyActivity} />
                <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-sm">
                    <span className="font-medium">Your peak hour:</span>{' '}
                    <span className="text-primary">{insights.peakHour?.label}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Schedule challenging tasks during this time for optimal performance
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default WeeklyTrendsChart;
