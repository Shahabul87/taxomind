'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Calendar,
  Brain,
  TrendingUp,
  Download,
  RefreshCw,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { StudyHeatmap } from './StudyHeatmap';
import { CourseProgressAnalytics } from './CourseProgressAnalytics';
import { SAMInsights } from './SAMInsights';
import { cn } from '@/lib/utils';

export interface LearningAnalyticsDashboardProps {
  className?: string;
  defaultTab?: 'overview' | 'progress' | 'insights' | 'heatmap';
  onExport?: () => void;
  onRefresh?: () => void;
}

type TimeRange = 'week' | 'month' | 'quarter' | 'year';

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
];

// Quick Stats Card Component
function QuickStatCard({
  icon: Icon,
  label,
  value,
  change,
  changeType,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 rounded-xl bg-white/70 p-4 shadow-sm backdrop-blur-sm dark:bg-slate-800/70"
    >
      <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', color)}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
          {change && (
            <span
              className={cn(
                'text-xs font-medium',
                changeType === 'positive' && 'text-emerald-600',
                changeType === 'negative' && 'text-red-500',
                changeType === 'neutral' && 'text-slate-500'
              )}
            >
              {change}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function LearningAnalyticsDashboard({
  className,
  defaultTab = 'overview',
  onExport,
  onRefresh,
}: LearningAnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh?.();
    // Simulate refresh delay
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Demo quick stats - in production, these would come from API
  const quickStats = {
    totalHours: 47.5,
    hoursChange: '+12%',
    lessonsCompleted: 34,
    lessonsChange: '+8',
    currentStreak: 23,
    streakChange: '+5',
    averageScore: 87,
    scoreChange: '+3%',
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
            <BarChart3 className="h-6 w-6 text-indigo-500" />
            Learning Analytics
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track your progress and gain insights into your learning journey
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Range Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                {TIME_RANGE_OPTIONS.find((o) => o.value === timeRange)?.label}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {TIME_RANGE_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setTimeRange(option.value)}
                  className={cn(timeRange === option.value && 'bg-slate-100 dark:bg-slate-800')}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          </Button>

          {/* Export Button */}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <QuickStatCard
          icon={Calendar}
          label="Study Hours"
          value={`${quickStats.totalHours}h`}
          change={quickStats.hoursChange}
          changeType="positive"
          color="bg-blue-500"
        />
        <QuickStatCard
          icon={BarChart3}
          label="Lessons Completed"
          value={quickStats.lessonsCompleted}
          change={quickStats.lessonsChange}
          changeType="positive"
          color="bg-emerald-500"
        />
        <QuickStatCard
          icon={TrendingUp}
          label="Day Streak"
          value={quickStats.currentStreak}
          change={quickStats.streakChange}
          changeType="positive"
          color="bg-orange-500"
        />
        <QuickStatCard
          icon={Brain}
          label="Avg Quiz Score"
          value={`${quickStats.averageScore}%`}
          change={quickStats.scoreChange}
          changeType="positive"
          color="bg-purple-500"
        />
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="mb-4 grid w-full grid-cols-4 bg-slate-100/80 dark:bg-slate-800/80">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="progress" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Progress</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Insights</span>
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Shows summary of all sections */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* SAM Insights Summary */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <SAMInsights compact />
            </motion.div>

            {/* Course Progress Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <CourseProgressAnalytics compact />
            </motion.div>
          </div>

          {/* Heatmap Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <StudyHeatmap compact />
          </motion.div>

          {/* Recent Achievements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="text-xl">🏆</span>
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  >
                    🔥 7-Day Streak
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  >
                    ✅ 50 Lessons
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  >
                    📚 3 Courses Started
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                  >
                    🎯 Perfect Quiz Score
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Progress Tab - Full Course Progress View */}
        <TabsContent value="progress">
          <CourseProgressAnalytics />
        </TabsContent>

        {/* Insights Tab - Full SAM Insights View */}
        <TabsContent value="insights">
          <SAMInsights />
        </TabsContent>

        {/* Heatmap Tab - Full Study Activity View */}
        <TabsContent value="heatmap">
          <StudyHeatmap showStats />
        </TabsContent>
      </Tabs>
    </div>
  );
}
