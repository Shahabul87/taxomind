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
  Network,
  MessageSquare,
  Shield,
  Gauge,
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
import { BehaviorPredictions } from './BehaviorPredictions';
import { GoalsProgress } from './GoalsProgress';
import { ProactiveInterventions } from './ProactiveInterventions';
import { KnowledgeGraphBrowser } from '@/components/sam/KnowledgeGraphBrowser';
import { ConfidenceCalibrationWidget } from '@/components/sam/ConfidenceCalibrationWidget';
import { QualityScoreDashboard } from '@/components/sam/QualityScoreDashboard';
import { ConversationTimeline } from '@/components/sam/ConversationTimeline';
import { cn } from '@/lib/utils';
import { useLearningAnalytics, formatStudyTime } from './hooks/useLearningAnalytics';

export interface LearningAnalyticsDashboardProps {
  className?: string;
  defaultTab?: 'overview' | 'progress' | 'insights' | 'heatmap' | 'exams' | 'knowledge' | 'quality' | 'conversations';
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
      className="flex items-center gap-2 sm:gap-3 md:gap-4 rounded-xl bg-white/70 p-3 sm:p-4 shadow-sm backdrop-blur-sm dark:bg-slate-800/70"
    >
      <div className={cn('flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl flex-shrink-0', color)}>
        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">{label}</p>
        <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate">{value}</p>
          {change && (
            <span
              className={cn(
                'text-xs font-medium whitespace-nowrap',
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
    <div className={cn('space-y-4 sm:space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-500 flex-shrink-0" />
            <span className="truncate">Learning Analytics</span>
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Track your progress and gain insights into your learning journey
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Time Range Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{TIME_RANGE_OPTIONS.find((o) => o.value === timeRange)?.label}</span>
                <span className="sm:hidden">{TIME_RANGE_OPTIONS.find((o) => o.value === timeRange)?.label.split(' ')[0]}</span>
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
            className="flex-shrink-0"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', isRefreshing && 'animate-spin')} />
            <span className="hidden sm:inline ml-2">Refresh</span>
          </Button>

          {/* Export Button */}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport} className="flex-shrink-0">
              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {isLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-2 sm:gap-3 md:gap-4 rounded-xl bg-white/70 p-3 sm:p-4 shadow-sm backdrop-blur-sm dark:bg-slate-800/70 animate-pulse"
              >
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="h-3 sm:h-4 w-20 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-5 sm:h-6 w-16 rounded bg-slate-200 dark:bg-slate-700" />
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
        <div className="mb-3 sm:mb-4 overflow-x-auto scrollbar-hide">
          <TabsList className="inline-flex min-w-max sm:min-w-full bg-slate-100/80 dark:bg-slate-800/80 px-2 sm:px-1">
            <TabsTrigger value="overview" className="gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm flex-shrink-0">
              <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="exams" className="gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm flex-shrink-0">
              <ClipboardCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Exams</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm flex-shrink-0">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Progress</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm flex-shrink-0">
              <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Insights</span>
            </TabsTrigger>
            <TabsTrigger value="quality" className="gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm flex-shrink-0">
              <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Quality</span>
            </TabsTrigger>
            <TabsTrigger value="conversations" className="gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm flex-shrink-0">
              <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm flex-shrink-0">
              <Network className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Knowledge</span>
            </TabsTrigger>
            <TabsTrigger value="heatmap" className="gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm flex-shrink-0">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab - Shows summary of all sections */}
        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          {/* Top Row: 2 columns */}
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            {/* SAM Insights Summary */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <SAMInsights compact />
            </motion.div>

            {/* Behavior Predictions - Learning Health Monitor */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <BehaviorPredictions compact />
            </motion.div>
          </div>

          {/* Second Row: 2 columns */}
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <ExamAnalytics compact />
            </motion.div>
          </div>

          {/* Third Row: Goals Progress and Proactive Interventions */}
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GoalsProgress compact />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
            >
              <ProactiveInterventions compact />
            </motion.div>
          </div>

          {/* Heatmap Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
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
              <CardHeader className="pb-2 sm:pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 flex-shrink-0" />
                  <span>Recent Achievements</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                {isLoading ? (
                  <div className="flex flex-wrap gap-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-6 w-20 sm:w-24 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
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
                          className={cn('text-xs sm:text-sm', rarityColors[achievement.rarity])}
                        >
                          {iconMap[achievement.iconType]} <span className="truncate max-w-[120px] sm:max-w-none">{achievement.title}</span>
                        </Badge>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 sm:py-6">
                    <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      Complete lessons and exams to earn achievements!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Confidence Calibration - Compact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <ConfidenceCalibrationWidget compact showRecommendations={false} />
          </motion.div>
        </TabsContent>

        {/* Progress Tab - Full Course Progress View */}
        <TabsContent value="progress">
          <CourseProgressAnalytics />
        </TabsContent>

        {/* Insights Tab - Full SAM Insights View */}
        <TabsContent value="insights" className="space-y-4 sm:space-y-6">
          <SAMInsights />
          <ConfidenceCalibrationWidget showRecommendations />
        </TabsContent>

        {/* Heatmap Tab - Full Study Activity View */}
        <TabsContent value="heatmap">
          <StudyHeatmap showStats />
        </TabsContent>

        {/* Exams Tab - Full Exam Analytics View */}
        <TabsContent value="exams">
          <ExamAnalytics />
        </TabsContent>

        {/* Knowledge Tab - Knowledge Graph Browser */}
        <TabsContent value="knowledge">
          <KnowledgeGraphBrowser
            showSearch
            showStats
            height="700px"
          />
        </TabsContent>

        {/* Quality Tab - Content Quality Validation */}
        <TabsContent value="quality">
          <div className="space-y-4 sm:space-y-6">
            <div className="rounded-lg border border-slate-200/50 bg-white/70 p-3 sm:p-4 md:p-6 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
              <div className="mb-3 sm:mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500 flex-shrink-0" />
                <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white">Content Quality Validator</h3>
              </div>
              <p className="mb-3 sm:mb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Validate educational content through SAM&apos;s quality gates to ensure accuracy, completeness, and pedagogical effectiveness.
              </p>
              <QualityScoreDashboard />
            </div>
          </div>
        </TabsContent>

        {/* Conversations Tab - SAM Conversation History */}
        <TabsContent value="conversations">
          <div className="space-y-3 sm:space-y-4">
            <div className="rounded-lg border border-slate-200/50 bg-white/70 p-3 sm:p-4 md:p-6 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
              <div className="mb-3 sm:mb-4 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
                <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-white">SAM Conversation History</h3>
              </div>
              <p className="mb-3 sm:mb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Review your learning conversations with SAM, organized by course and topic. Track key insights and learning moments.
              </p>
            </div>
            <ConversationTimeline
              showSearch
              showFilters
              maxSessions={20}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
