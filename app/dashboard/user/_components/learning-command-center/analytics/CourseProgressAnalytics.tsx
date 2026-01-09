'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  BookOpen,
  Target,
  AlertTriangle,
  AlertCircle,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  CourseProgressAnalyticsResponse,
  CourseProgressData,
  VelocityMetrics,
  PROGRESS_STATUS_CONFIG,
  formatStudyTime,
  CourseProgressAnalyticsProps,
} from '@/types/learning-analytics';
import { cn } from '@/lib/utils';

// Demo data generator
function generateDemoCourseProgress(): CourseProgressAnalyticsResponse {
  const courses: CourseProgressData[] = [
    {
      courseId: '1',
      courseTitle: 'Advanced React Patterns',
      currentProgress: 85,
      plannedProgress: 75,
      targetDate: '2025-01-20',
      startDate: '2024-11-15',
      status: 'ahead',
      progressDelta: 10,
      isOverdue: false,
      lastActivityDate: new Date().toISOString(),
      totalTimeSpent: 1240,
      averageSessionLength: 45,
      lessonsCompleted: 34,
      totalLessons: 40,
    },
    {
      courseId: '2',
      courseTitle: 'TypeScript Mastery',
      currentProgress: 45,
      plannedProgress: 50,
      targetDate: '2025-01-28',
      startDate: '2024-12-01',
      status: 'behind',
      progressDelta: -5,
      isOverdue: false,
      lastActivityDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      totalTimeSpent: 680,
      averageSessionLength: 38,
      lessonsCompleted: 18,
      totalLessons: 40,
      quizScore: 72,
    },
    {
      courseId: '3',
      courseTitle: 'Node.js Fundamentals',
      currentProgress: 20,
      plannedProgress: 20,
      targetDate: '2025-02-15',
      startDate: '2024-12-20',
      status: 'on_track',
      progressDelta: 0,
      isOverdue: false,
      lastActivityDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      totalTimeSpent: 320,
      averageSessionLength: 40,
      lessonsCompleted: 8,
      totalLessons: 40,
      quizScore: 88,
    },
    {
      courseId: '4',
      courseTitle: 'AWS Cloud Practitioner',
      currentProgress: 15,
      plannedProgress: 35,
      targetDate: '2025-01-10',
      startDate: '2024-11-01',
      status: 'at_risk',
      progressDelta: -20,
      isOverdue: true,
      lastActivityDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      totalTimeSpent: 180,
      averageSessionLength: 30,
      lessonsCompleted: 6,
      totalLessons: 40,
    },
  ];

  const velocity: VelocityMetrics = {
    lessonsPerWeek: 12,
    lessonsPerWeekAvg: 10,
    quizzesPerWeek: 4,
    quizzesPerWeekAvg: 3,
    studyHoursPerWeek: 14,
    studyHoursPerWeekAvg: 12,
    weeklyTrend: 'increasing',
    velocityScore: 78,
  };

  return {
    courses,
    velocity,
    summary: {
      totalCourses: 4,
      completedCourses: 0,
      inProgressCourses: 4,
      averageProgress: 41,
      coursesAhead: 1,
      coursesOnTrack: 1,
      coursesBehind: 1,
      coursesAtRisk: 1,
    },
  };
}

const StatusIcon = {
  ahead: TrendingUp,
  on_track: Check,
  behind: AlertTriangle,
  at_risk: AlertCircle,
};

function CourseCard({ course }: { course: CourseProgressData }) {
  const statusConfig = PROGRESS_STATUS_CONFIG[course.status];
  const Icon = StatusIcon[course.status];

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No target';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50"
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900 dark:text-white">
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
            {course.targetDate && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Target: {formatDate(course.targetDate)}
              </span>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {course.currentProgress}% Complete
          </span>
          <span
            className={cn(
              'text-xs font-medium',
              course.progressDelta >= 0 ? 'text-emerald-600' : 'text-amber-600'
            )}
          >
            {course.progressDelta >= 0 ? '+' : ''}
            {course.progressDelta}% vs planned
          </span>
        </div>

        <div className="relative h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
          {/* Planned progress indicator */}
          <div
            className="absolute top-0 h-full border-r-2 border-dashed border-slate-400 dark:border-slate-500"
            style={{ left: `${course.plannedProgress}%` }}
          />
          {/* Actual progress */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${course.currentProgress}%` }}
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

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Planned: {course.plannedProgress}%
          </span>
          <span>
            {course.lessonsCompleted}/{course.totalLessons} lessons
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-3 flex items-center gap-4 border-t border-slate-100 pt-3 dark:border-slate-700">
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {formatStudyTime(course.totalTimeSpent)}
          </span>
        </div>
        {course.quizScore !== undefined && (
          <div className="flex items-center gap-1">
            <Target className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Quiz: {course.quizScore}%
            </span>
          </div>
        )}
        {course.lastActivityDate && (
          <div className="flex items-center gap-1 text-xs text-slate-400">
            Last active:{' '}
            {new Date(course.lastActivityDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function VelocityCard({ velocity }: { velocity: VelocityMetrics }) {
  const TrendIcon = velocity.weeklyTrend === 'increasing'
    ? TrendingUp
    : velocity.weeklyTrend === 'decreasing'
    ? TrendingDown
    : Minus;

  const trendColor = velocity.weeklyTrend === 'increasing'
    ? 'text-emerald-500'
    : velocity.weeklyTrend === 'decreasing'
    ? 'text-red-500'
    : 'text-slate-500';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 dark:border-slate-700 dark:from-slate-800 dark:to-slate-800/50"
    >
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold text-slate-900 dark:text-white">
          Completion Velocity
        </h4>
        <div className={cn('flex items-center gap-1', trendColor)}>
          <TrendIcon className="h-4 w-4" />
          <span className="text-xs font-medium capitalize">
            {velocity.weeklyTrend}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Velocity Score */}
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
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - velocity.velocityScore / 100)}`}
                className={cn(
                  velocity.velocityScore >= 70
                    ? 'text-emerald-500'
                    : velocity.velocityScore >= 40
                    ? 'text-amber-500'
                    : 'text-red-500'
                )}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-slate-900 dark:text-white">
              {velocity.velocityScore}
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

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-700/50">
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {velocity.lessonsPerWeek}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Lessons/week
            </p>
            <p className="text-xs text-slate-400">
              Avg: {velocity.lessonsPerWeekAvg}
            </p>
          </div>
          <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-700/50">
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {velocity.quizzesPerWeek}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quizzes/week
            </p>
            <p className="text-xs text-slate-400">
              Avg: {velocity.quizzesPerWeekAvg}
            </p>
          </div>
          <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-700/50">
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {velocity.studyHoursPerWeek}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hours/week
            </p>
            <p className="text-xs text-slate-400">
              Avg: {velocity.studyHoursPerWeekAvg}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function CourseProgressAnalytics({
  maxCourses = 5,
  showVelocity = true,
}: CourseProgressAnalyticsProps) {
  // In a real app, this would be fetched from the API
  const data = generateDemoCourseProgress();

  const displayCourses = data.courses.slice(0, maxCourses);

  return (
    <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Course Progress Overview
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Summary badges */}
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              {data.summary.coursesAhead} ahead
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {data.summary.coursesOnTrack} on track
            </Badge>
            {data.summary.coursesBehind + data.summary.coursesAtRisk > 0 && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                {data.summary.coursesBehind + data.summary.coursesAtRisk} need attention
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

            {data.courses.length > maxCourses && (
              <Button variant="ghost" className="w-full text-slate-500">
                View all {data.courses.length} courses
              </Button>
            )}
          </div>

          {/* Velocity Card */}
          {showVelocity && (
            <div className="space-y-3">
              <VelocityCard velocity={data.velocity} />

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
                      {data.summary.averageProgress}%
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Average Progress
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {data.summary.inProgressCourses}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Active Courses
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
