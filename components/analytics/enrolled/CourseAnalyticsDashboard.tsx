'use client';

/**
 * CourseAnalyticsDashboard
 *
 * Main container for the redesigned student analytics page.
 * Provides a clean, course-centric view of learning progress.
 *
 * Features:
 * - 3 tabs: Overview, Course Details, AI Insights
 * - Time range filtering
 * - Auto-refresh capability
 * - Responsive design
 */

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  BookOpen,
  Target,
  TrendingUp,
  RefreshCw,
  Download,
  Calendar,
  BarChart3,
  Brain,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  useEnrolledCourseAnalytics,
  formatStudyTime,
  type TimeRange,
} from '@/hooks/use-enrolled-course-analytics';
import { MetricCard, CompactMetric } from '../enterprise/MetricCard';
import { EmptyState } from '../enterprise/EmptyState';
import { EnrolledCoursesGrid } from './EnrolledCoursesGrid';
import { CourseDetailPanel } from './CourseDetailPanel';
import { AIInsightsPanel } from './AIInsightsPanel';

// ============================================================================
// TYPES
// ============================================================================

interface CourseAnalyticsDashboardProps {
  /** Initial tab to display */
  defaultTab?: 'overview' | 'courses' | 'insights';
  /** Enable auto-refresh (in milliseconds, 0 = disabled) */
  refreshInterval?: number;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="flex gap-2">
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>

      {/* Metrics skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-lg" />
    </div>
  );
}

// ============================================================================
// ERROR STATE
// ============================================================================

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20">
      <CardContent className="py-12">
        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Failed to Load Analytics
          </h3>
          <p className="text-sm text-red-600 dark:text-red-400 mb-4 max-w-md">
            {message}
          </p>
          <Button variant="outline" onClick={onRetry} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// OVERVIEW TAB CONTENT
// ============================================================================

interface OverviewTabProps {
  courses: ReturnType<typeof useEnrolledCourseAnalytics>['courses'];
  summary: ReturnType<typeof useEnrolledCourseAnalytics>['summary'];
  onSelectCourse: (courseId: string) => void;
}

function OverviewTab({ courses, summary, onSelectCourse }: OverviewTabProps) {
  const hasData = summary.totalCourses > 0;

  if (!hasData) {
    return (
      <EmptyState
        icon={<BookOpen className="w-full h-full" />}
        title="Start Your Learning Journey"
        description="Enroll in courses to track your progress, study time, and receive personalized AI insights."
        action={{
          label: 'Browse Courses',
          href: '/search',
        }}
        size="lg"
        className="min-h-[400px]"
      />
    );
  }

  // Calculate additional metrics
  const avgStudyTimePerCourse = summary.totalCourses > 0
    ? Math.round(summary.totalStudyTimeMinutes / summary.totalCourses)
    : 0;

  const completionRate = summary.totalCourses > 0
    ? Math.round((summary.completedCourses / summary.totalCourses) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <section aria-labelledby="overview-metrics">
        <h2 id="overview-metrics" className="sr-only">Overview Metrics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Study Time"
            value={formatStudyTime(summary.totalStudyTimeMinutes)}
            subtitle="All-time learning"
            icon={<Clock className="w-full h-full" />}
            variant="primary"
          />

          <MetricCard
            label="Overall Progress"
            value={summary.averageProgress}
            unit="%"
            subtitle={`${summary.completedCourses} of ${summary.totalCourses} completed`}
            icon={<Target className="w-full h-full" />}
            variant="success"
            progress={summary.averageProgress}
          />

          <MetricCard
            label="Learning Streak"
            value={summary.currentStreak}
            unit=" days"
            subtitle="Keep it up!"
            icon={<TrendingUp className="w-full h-full" />}
            variant="warning"
          />

          <MetricCard
            label="Health Score"
            value={summary.overallHealthScore}
            unit="%"
            subtitle="Learning consistency"
            icon={<BarChart3 className="w-full h-full" />}
            variant="accent"
            progress={summary.overallHealthScore}
          />
        </div>
      </section>

      {/* Quick Stats */}
      <section aria-labelledby="quick-stats">
        <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              Quick Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <CompactMetric
                label="Active Courses"
                value={summary.totalCourses - summary.completedCourses}
                variant="primary"
              />
              <CompactMetric
                label="Completion Rate"
                value={completionRate}
                unit="%"
                variant="success"
              />
              <CompactMetric
                label="Avg Time/Course"
                value={formatStudyTime(avgStudyTimePerCourse)}
                variant="accent"
              />
              <CompactMetric
                label="Completed"
                value={summary.completedCourses}
                variant="success"
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Course Preview Grid */}
      {courses.length > 0 && (
        <section aria-labelledby="course-preview">
          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                  <div className="p-2 bg-violet-50 dark:bg-violet-900/30 rounded-lg">
                    <BookOpen className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  Your Courses
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-violet-600 dark:text-violet-400"
                  onClick={() => {
                    // Navigate to courses tab
                    const tabTrigger = document.querySelector('[data-tab="courses"]');
                    if (tabTrigger instanceof HTMLElement) {
                      tabTrigger.click();
                    }
                  }}
                >
                  View All →
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.slice(0, 3).map((course) => (
                  <motion.div
                    key={course.courseId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 cursor-pointer transition-all hover:shadow-md"
                    onClick={() => onSelectCourse(course.courseId)}
                  >
                    <h4 className="font-medium text-slate-800 dark:text-slate-200 truncate mb-2">
                      {course.title}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Target className="w-3.5 h-3.5" />
                        {course.progress.overall}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatStudyTime(course.timeSpent.totalMinutes)}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full transition-all"
                        style={{ width: `${course.progress.overall}%` }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CourseAnalyticsDashboard({
  defaultTab = 'overview',
  refreshInterval = 0,
  className,
}: CourseAnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  const {
    courses,
    summary,
    isLoading,
    error,
    refetch,
    selectedCourse,
    selectCourse,
    isStale,
  } = useEnrolledCourseAnalytics({
    timeRange,
    refreshInterval,
    enabled: true,
  });

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleTimeRangeChange = useCallback((value: string) => {
    setTimeRange(value as TimeRange);
  }, []);

  const handleSelectCourse = useCallback((courseId: string) => {
    selectCourse(courseId);
    setActiveTab('courses');
  }, [selectCourse]);

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn('p-4 sm:p-6', className)}>
        <DashboardSkeleton />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={cn('p-4 sm:p-6', className)}>
        <ErrorState message={error} onRetry={handleRefresh} />
      </div>
    );
  }

  return (
    <div className={cn('p-4 sm:p-6', className)}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Learning Analytics
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Track your progress and get personalized insights
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Time Range Selector */}
            <Select value={timeRange} onValueChange={handleTimeRangeChange}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              className={cn(isStale && 'border-amber-300 text-amber-600')}
              title={isStale ? 'Data may be stale - click to refresh' : 'Refresh data'}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>

            {/* Export Button (placeholder) */}
            <Button variant="outline" size="icon" title="Export analytics">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="courses" data-tab="courses" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Courses</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              <span className="hidden sm:inline">AI Insights</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewTab
              courses={courses}
              summary={summary}
              onSelectCourse={handleSelectCourse}
            />
          </TabsContent>

          <TabsContent value="courses" className="mt-6">
            {selectedCourse ? (
              <CourseDetailPanel
                course={selectedCourse}
                onBack={() => selectCourse(null)}
              />
            ) : (
              <EnrolledCoursesGrid
                courses={courses}
                onSelectCourse={handleSelectCourse}
              />
            )}
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <AIInsightsPanel courses={courses} summary={summary} />
          </TabsContent>
        </Tabs>

        {/* Stale data indicator */}
        {isStale && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-4 right-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2 shadow-lg"
          >
            <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
              <Sparkles className="w-4 h-4" />
              <span>Data may be outdated</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="text-amber-700 dark:text-amber-300 hover:text-amber-800"
              >
                Refresh
              </Button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default CourseAnalyticsDashboard;
