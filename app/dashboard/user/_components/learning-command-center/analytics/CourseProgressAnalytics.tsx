'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Target,
  AlertTriangle,
  AlertCircle,
  Check,
  ExternalLink,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLearningAnalytics, formatStudyTime } from './hooks/useLearningAnalytics';
import Link from 'next/link';

export interface CourseProgressAnalyticsProps {
  compact?: boolean;
  maxCourses?: number;
  showVelocity?: boolean;
}

type ProgressStatus = 'ahead' | 'on_track' | 'behind' | 'at_risk';

const STATUS_CONFIG: Record<ProgressStatus, { label: string; color: string; bgColor: string }> = {
  ahead: {
    label: 'Ahead',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
  },
  on_track: {
    label: 'On Track',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
  },
  behind: {
    label: 'Behind',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/30',
  },
  at_risk: {
    label: 'At Risk',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/30',
  },
};

const StatusIcon = {
  ahead: TrendingUp,
  on_track: Check,
  behind: AlertTriangle,
  at_risk: AlertCircle,
};

interface CourseProgressItem {
  courseId: string;
  courseTitle: string;
  progress: number;
  status: ProgressStatus;
  completedSections: number;
  totalSections: number;
  averageScore: number;
  lastActivity: string;
}

function getStatus(progress: number, avgProgress: number): ProgressStatus {
  const diff = progress - avgProgress;
  if (diff >= 20) return 'ahead';
  if (diff >= -10) return 'on_track';
  if (diff >= -30) return 'behind';
  return 'at_risk';
}

function CourseCard({ course }: { course: CourseProgressItem }) {
  const statusConfig = STATUS_CONFIG[course.status];
  const Icon = StatusIcon[course.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50"
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-slate-900 dark:text-white truncate">
            {course.courseTitle}
          </h4>
          <div className="mt-1 flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn('text-xs', statusConfig.color, statusConfig.bgColor)}
            >
              <Icon className="mr-1 h-3 w-3" />
              {statusConfig.label}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {Math.round(course.progress)}% Complete
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {course.completedSections}/{course.totalSections} sections
          </span>
        </div>

        <div className="relative h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${course.progress}%` }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={cn(
              'h-full rounded-full',
              course.status === 'ahead' && 'bg-emerald-500',
              course.status === 'on_track' && 'bg-blue-500',
              course.status === 'behind' && 'bg-amber-500',
              course.status === 'at_risk' && 'bg-red-500'
            )}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-3 flex items-center gap-4 border-t border-slate-100 pt-3 dark:border-slate-700">
        {course.averageScore > 0 && (
          <div className="flex items-center gap-1">
            <Target className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {Math.round(course.averageScore)}% avg
            </span>
          </div>
        )}
        {course.lastActivity && (
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            {new Date(course.lastActivity).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function CompactCourseCard({ course }: { course: CourseProgressItem }) {
  const statusConfig = STATUS_CONFIG[course.status];
  const Icon = StatusIcon[course.status];

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
          {course.courseTitle}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                course.status === 'ahead' && 'bg-emerald-500',
                course.status === 'on_track' && 'bg-blue-500',
                course.status === 'behind' && 'bg-amber-500',
                course.status === 'at_risk' && 'bg-red-500'
              )}
              style={{ width: `${course.progress}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-10 text-right">
            {Math.round(course.progress)}%
          </span>
        </div>
      </div>
      <Badge
        variant="outline"
        className={cn('text-xs flex-shrink-0', statusConfig.color, statusConfig.bgColor)}
      >
        <Icon className="h-3 w-3" />
      </Badge>
    </div>
  );
}

function LoadingState({ compact }: { compact?: boolean }) {
  return (
    <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
      <CardContent className={cn('flex items-center justify-center', compact ? 'p-6' : 'p-12')}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-sm text-slate-500">Loading progress...</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ compact }: { compact?: boolean }) {
  return (
    <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
      <CardContent className={cn('flex flex-col items-center justify-center text-center', compact ? 'p-6' : 'p-12')}>
        <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
        <h3 className="font-semibold text-slate-900 dark:text-white">No Courses Yet</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
          Enroll in courses to track your learning progress.
        </p>
        <Link href="/courses">
          <Button variant="outline" size="sm" className="mt-4">
            Browse Courses
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export function CourseProgressAnalytics({
  compact = false,
  maxCourses = 5,
  showVelocity = true,
}: CourseProgressAnalyticsProps) {
  const { data, isLoading, error } = useLearningAnalytics('month');

  if (isLoading) {
    return <LoadingState compact={compact} />;
  }

  if (error || !data || data.courseProgress.length === 0) {
    return <EmptyState compact={compact} />;
  }

  // Transform API data
  const avgProgress = data.overview.averageProgress;
  const courses: CourseProgressItem[] = data.courseProgress.map(course => ({
    courseId: course.courseId,
    courseTitle: course.courseTitle,
    progress: course.progress,
    status: getStatus(course.progress, avgProgress),
    completedSections: course.completedSections,
    totalSections: course.totalSections,
    averageScore: course.averageScore,
    lastActivity: course.lastActivity,
  }));

  const displayCourses = courses.slice(0, compact ? 3 : maxCourses);

  // Calculate summary stats
  const coursesAhead = courses.filter(c => c.status === 'ahead').length;
  const coursesOnTrack = courses.filter(c => c.status === 'on_track').length;
  const coursesNeedAttention = courses.filter(c => c.status === 'behind' || c.status === 'at_risk').length;

  // Compact view for Overview grid
  if (compact) {
    return (
      <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70 h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Course Progress
            </CardTitle>
          </div>
          {/* Summary badges */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {coursesAhead > 0 && (
              <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                {coursesAhead} ahead
              </Badge>
            )}
            {coursesOnTrack > 0 && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {coursesOnTrack} on track
              </Badge>
            )}
            {coursesNeedAttention > 0 && (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {coursesNeedAttention} need attention
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {displayCourses.map((course, index) => (
            <motion.div
              key={course.courseId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <CompactCourseCard course={course} />
            </motion.div>
          ))}

          {/* Summary */}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Average Progress</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {Math.round(avgProgress)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-slate-600 dark:text-slate-400">Active Courses</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {data.overview.activeCourses}
              </span>
            </div>
          </div>

          {courses.length > 3 && (
            <Button variant="ghost" size="sm" className="w-full text-slate-500">
              View all {courses.length} courses
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full view
  return (
    <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Course Progress Overview
          </CardTitle>
          <div className="flex items-center gap-2">
            {coursesAhead > 0 && (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                {coursesAhead} ahead
              </Badge>
            )}
            {coursesOnTrack > 0 && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {coursesOnTrack} on track
              </Badge>
            )}
            {coursesNeedAttention > 0 && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {coursesNeedAttention} need attention
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className={cn('grid gap-4', showVelocity ? 'lg:grid-cols-3' : '')}>
          {/* Course Cards */}
          <div className={cn('space-y-3', showVelocity ? 'lg:col-span-2' : '')}>
            {displayCourses.map((course, index) => (
              <motion.div
                key={course.courseId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <CourseCard course={course} />
              </motion.div>
            ))}

            {courses.length > maxCourses && (
              <Button variant="ghost" className="w-full text-slate-500">
                View all {courses.length} courses
              </Button>
            )}
          </div>

          {/* Summary Stats */}
          {showVelocity && (
            <div className="space-y-3">
              {/* Learning Velocity */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 dark:border-slate-700 dark:from-slate-800 dark:to-slate-800/50"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    Learning Velocity
                  </h4>
                  <div className="flex items-center gap-1 text-emerald-500">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-medium">Active</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-16 w-16">
                      <svg className="h-16 w-16 -rotate-90 transform">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-slate-200 dark:text-slate-700"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 28}`}
                          strokeDashoffset={`${2 * Math.PI * 28 * (1 - data.learningPatterns.learningVelocity)}`}
                          className="text-blue-500"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-slate-900 dark:text-white">
                        {Math.round(data.learningPatterns.learningVelocity * 100)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Velocity Score
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Based on your learning pace
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-700/50">
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {data.overview.activeCourses}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Active courses
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-700/50">
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {data.overview.totalExamsCompleted}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Exams completed
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Summary Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4 dark:from-blue-950/30 dark:to-indigo-950/30"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {Math.round(avgProgress)}%
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Average Progress
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {data.overview.completedCourses}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Completed
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
