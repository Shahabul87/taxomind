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
  ClipboardCheck,
  Loader2,
  Flame,
  Trophy,
  BookOpen,
  Target,
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
import { ExamAnalytics } from './ExamAnalytics';
import { cn } from '@/lib/utils';
import { useLearningAnalytics, formatStudyTime } from './hooks/useLearningAnalytics';

export interface LearningAnalyticsDashboardProps {
  className?: string;
  defaultTab?: 'overview' | 'progress' | 'insights' | 'heatmap' | 'exams';
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

  // Map TimeRange to useLearningAnalytics timeframe
  const timeframeMap: Record<TimeRange, 'week' | 'month' | 'semester' | 'all'> = {
    week: 'week',
    month: 'month',
    quarter: 'semester',
    year: 'all',
  };

  const { data, isLoading, refetch } = useLearningAnalytics(timeframeMap[timeRange]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    await onRefresh?.();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Calculate quick stats from real data
  const totalStudyMinutes = data?.overview.totalStudyTime ?? 0;
  const totalHours = Math.round(totalStudyMinutes / 60 * 10) / 10;

  const quickStats = {
    totalHours,
    hoursChange: totalHours > 0 ? `${formatStudyTime(totalStudyMinutes)}` : '-',
    lessonsCompleted: data?.overview.activeCourses ?? 0,
    lessonsChange: data ? `${data.overview.completedCourses} done` : '-',
    currentStreak: data?.overview.currentStreak ?? 0,
    streakChange: data?.overview.currentStreak ? `${data.overview.currentStreak} days` : '-',
    averageScore: data?.overview.averageScore ?? 0,
    scoreChange: data?.overview.totalExamsCompleted ? `${data.overview.totalExamsCompleted} exams` : '-',
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
        {isLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-xl bg-white/70 p-4 shadow-sm backdrop-blur-sm dark:bg-slate-800/70 animate-pulse"
              >
                <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-slate-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-6 w-16 rounded bg-slate-200 dark:bg-slate-700" />
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <QuickStatCard
              icon={Calendar}
              label="Study Hours"
              value={quickStats.totalHours > 0 ? `${quickStats.totalHours}h` : '0h'}
              change={quickStats.hoursChange}
              changeType={quickStats.totalHours > 0 ? 'positive' : 'neutral'}
              color="bg-blue-500"
            />
            <QuickStatCard
              icon={BookOpen}
              label="Active Courses"
              value={quickStats.lessonsCompleted}
              change={quickStats.lessonsChange}
              changeType={quickStats.lessonsCompleted > 0 ? 'positive' : 'neutral'}
              color="bg-emerald-500"
            />
            <QuickStatCard
              icon={Flame}
              label="Day Streak"
              value={quickStats.currentStreak}
              change={quickStats.streakChange}
              changeType={quickStats.currentStreak > 0 ? 'positive' : 'neutral'}
              color="bg-orange-500"
            />
            <QuickStatCard
              icon={Target}
              label="Avg Quiz Score"
              value={quickStats.averageScore > 0 ? `${quickStats.averageScore}%` : '-'}
              change={quickStats.scoreChange}
              changeType={quickStats.averageScore >= 70 ? 'positive' : quickStats.averageScore > 0 ? 'neutral' : 'neutral'}
              color="bg-purple-500"
            />
          </>
        )}
      </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="mb-4 grid w-full grid-cols-5 bg-slate-100/80 dark:bg-slate-800/80">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="exams" className="gap-2">
            <ClipboardCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Exams</span>
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
          <div className="grid gap-6 lg:grid-cols-3">
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <CourseProgressAnalytics compact />
            </motion.div>

            {/* Exam Analytics Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <ExamAnalytics compact />
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
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex flex-wrap gap-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-6 w-24 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    ))}
                  </div>
                ) : data?.achievements && data.achievements.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {data.achievements.slice(0, 6).map((achievement) => {
                      const rarityColors = {
                        common: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
                        rare: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                        epic: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                        legendary: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                      };
                      const iconMap = {
                        streak: '🔥',
                        completion: '✅',
                        score: '🎯',
                        time: '⏱️',
                        cognitive: '🧠',
                      };
                      return (
                        <Badge
                          key={achievement.id}
                          variant="secondary"
                          className={rarityColors[achievement.rarity]}
                        >
                          {iconMap[achievement.iconType]} {achievement.title}
                        </Badge>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Trophy className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Complete lessons and exams to earn achievements!
                    </p>
                  </div>
                )}
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

        {/* Exams Tab - Full Exam Analytics View */}
        <TabsContent value="exams">
          <ExamAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
