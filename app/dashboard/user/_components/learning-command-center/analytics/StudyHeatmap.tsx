'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Flame,
  Clock,
  BookOpen,
  Target,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Info,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  HeatmapResponse,
  HeatmapDay,
  HeatmapStats,
  HEATMAP_LEVELS,
  formatStudyTime,
  StudyHeatmapProps,
} from '@/types/learning-analytics';
import { cn } from '@/lib/utils';
import { useLearningAnalytics } from './hooks/useLearningAnalytics';

// Generate empty heatmap data for visualization
function generateEmptyHeatmapData(year: number): HeatmapResponse {
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const months = [];

  for (let month = 0; month < 12; month++) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: HeatmapDay[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toISOString().split('T')[0];

      days.push({
        date: dateKey,
        count: 0,
        level: 0,
        details: undefined,
      });
    }

    // Organize into weeks
    const weeks: { weekNumber: number; days: HeatmapDay[] }[] = [];
    let currentWeek: HeatmapDay[] = [];
    let weekNumber = 1;

    for (const day of days) {
      const dayOfWeek = new Date(day.date).getDay();

      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push({ weekNumber, days: currentWeek });
        currentWeek = [];
        weekNumber++;
      }

      currentWeek.push(day);
    }

    if (currentWeek.length > 0) {
      weeks.push({ weekNumber, days: currentWeek });
    }

    months.push({
      month,
      year,
      label: MONTH_NAMES[month],
      weeks,
    });
  }

  const stats: HeatmapStats = {
    totalStudyHours: 0,
    activeDays: 0,
    currentStreak: 0,
    longestStreak: 0,
    averageDailyMinutes: 0,
    mostActiveDay: '-',
    bestStudyTime: '-',
    totalLessonsCompleted: 0,
    totalQuizzesCompleted: 0,
  };

  return { months, stats, year };
}

function HeatmapCell({
  day,
  onClick,
}: {
  day: HeatmapDay;
  onClick?: (day: HeatmapDay) => void;
}) {
  const levelConfig = HEATMAP_LEVELS[day.level];
  const date = new Date(day.date);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={() => onClick?.(day)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              'h-3 w-3 rounded-sm transition-all',
              levelConfig.color,
              onClick && 'cursor-pointer hover:ring-2 hover:ring-slate-400'
            )}
            aria-label={`${formattedDate}: ${day.count > 0 ? formatStudyTime(day.count) : 'No activity'}`}
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <p className="font-semibold">{formattedDate}</p>
            {day.details ? (
              <>
                <p>Study time: {formatStudyTime(day.details.studyMinutes)}</p>
                <p>Lessons: {day.details.lessonsCompleted}</p>
                <p>Quizzes: {day.details.quizzesCompleted}</p>
              </>
            ) : (
              <p className="text-slate-400">No activity</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function StatsCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 sm:gap-3 rounded-lg bg-slate-50 p-2 sm:p-3 dark:bg-slate-800/50"
    >
      <div className={cn('flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg shrink-0', color)}>
        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{label}</p>
        {subValue && (
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{subValue}</p>
        )}
      </div>
    </motion.div>
  );
}

export function StudyHeatmap({
  year: initialYear,
  onDayClick,
  showStats = true,
  compact = false,
}: StudyHeatmapProps) {
  const [year, setYear] = useState(initialYear ?? new Date().getFullYear());
  const { data: analyticsData, isLoading } = useLearningAnalytics('all');

  // Use empty heatmap data with stats from real API data
  const data = useMemo(() => {
    const heatmapData = generateEmptyHeatmapData(year);

    // Update stats with real data if available
    if (analyticsData) {
      heatmapData.stats = {
        totalStudyHours: Math.round(analyticsData.overview.totalStudyTime / 60),
        activeDays: analyticsData.overview.activeCourses > 0 ? analyticsData.courseProgress.length : 0,
        currentStreak: analyticsData.overview.currentStreak,
        longestStreak: analyticsData.overview.currentStreak, // API doesn't provide longest
        averageDailyMinutes: analyticsData.learningPatterns.averageSessionLength,
        mostActiveDay: analyticsData.learningPatterns.mostActiveDay || '-',
        bestStudyTime: analyticsData.learningPatterns.preferredStudyTime || '-',
        totalLessonsCompleted: analyticsData.courseProgress.reduce((sum, c) => sum + c.completedSections, 0),
        totalQuizzesCompleted: analyticsData.overview.totalExamsCompleted,
      };
    }

    return heatmapData;
  }, [year, analyticsData]);

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get all days flattened for the grid
  const allDays = useMemo(() => {
    const days: (HeatmapDay | null)[] = [];
    const startDate = new Date(year, 0, 1);
    const startDayOfWeek = startDate.getDay();

    // Add padding for days before Jan 1
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days from all months
    for (const month of data.months) {
      for (const week of month.weeks) {
        for (const day of week.days) {
          days.push(day);
        }
      }
    }

    return days;
  }, [data.months, year]);

  // Group days into weeks (columns)
  const weeks = useMemo(() => {
    const result: (HeatmapDay | null)[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      result.push(allDays.slice(i, i + 7));
    }
    return result;
  }, [allDays]);

  // Get month labels positioned correctly
  const monthLabels = useMemo(() => {
    const labels: { month: string; weekIndex: number }[] = [];
    let currentMonth = -1;

    weeks.forEach((week, weekIndex) => {
      for (const day of week) {
        if (day) {
          const monthNum = new Date(day.date).getMonth();
          if (monthNum !== currentMonth) {
            labels.push({
              month: data.months[monthNum]?.label ?? '',
              weekIndex,
            });
            currentMonth = monthNum;
          }
          break;
        }
      }
    });

    return labels;
  }, [weeks, data.months]);

  if (compact) {
    return (
      <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70 h-full">
        <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 shrink-0" />
            Study Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-4 sm:py-6">
              <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-emerald-500" />
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-3 sm:p-4 dark:from-emerald-950/30 dark:to-teal-950/30">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30 shrink-0">
                    <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                      {data.stats.currentStreak}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">day streak</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30 shrink-0">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                      {data.stats.totalStudyHours}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">hours</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                View Full Activity
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
      <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 shrink-0" />
            <span className="truncate">Study Activity - {year}</span>
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8"
              onClick={() => setYear(year - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8"
              onClick={() => setYear(year + 1)}
              disabled={year >= new Date().getFullYear()}
            >
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
        {/* Heatmap Grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[750px]">
            {/* Month labels */}
            <div className="mb-1 flex pl-8">
              {monthLabels.map((label, index) => (
                <div
                  key={index}
                  className="text-xs text-slate-500 dark:text-slate-400"
                  style={{
                    marginLeft: index === 0 ? `${label.weekIndex * 14}px` : undefined,
                    width: `${14 * (monthLabels[index + 1]?.weekIndex ?? weeks.length - label.weekIndex)}px`,
                  }}
                >
                  {label.month}
                </div>
              ))}
            </div>

            {/* Grid with day labels */}
            <div className="flex">
              {/* Day labels */}
              <div className="flex flex-col gap-0.5 pr-2">
                {DAY_LABELS.map((label, index) => (
                  <div
                    key={label}
                    className="flex h-3 items-center text-xs text-slate-500 dark:text-slate-400"
                    style={{ visibility: index % 2 === 1 ? 'visible' : 'hidden' }}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Heatmap cells */}
              <div className="flex gap-0.5">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-0.5">
                    {Array.from({ length: 7 }).map((_, dayIndex) => {
                      const day = week[dayIndex];
                      if (!day) {
                        return (
                          <div
                            key={`empty-${weekIndex}-${dayIndex}`}
                            className="h-3 w-3"
                          />
                        );
                      }
                      return (
                        <HeatmapCell
                          key={day.date}
                          day={day}
                          onClick={onDayClick}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-3 flex items-center justify-end gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Less</span>
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={cn(
                    'h-3 w-3 rounded-sm',
                    HEATMAP_LEVELS[level as keyof typeof HEATMAP_LEVELS].color
                  )}
                />
              ))}
              <span>More</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      0 min = No activity, &lt;30 min = Light, &lt;60 min = Moderate,
                      &lt;120 min = Good, 120+ min = High
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {showStats && (
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
            <StatsCard
              icon={Clock}
              label="Total Hours"
              value={data.stats.totalStudyHours}
              subValue={`Avg ${data.stats.averageDailyMinutes} min/day`}
              color="bg-blue-500"
            />
            <StatsCard
              icon={Flame}
              label="Current Streak"
              value={`${data.stats.currentStreak} days`}
              subValue={`Longest: ${data.stats.longestStreak} days`}
              color="bg-orange-500"
            />
            <StatsCard
              icon={BookOpen}
              label="Lessons"
              value={data.stats.totalLessonsCompleted}
              subValue={`${data.stats.totalQuizzesCompleted} quizzes`}
              color="bg-emerald-500"
            />
            <StatsCard
              icon={Target}
              label="Active Days"
              value={data.stats.activeDays}
              subValue={`Best: ${data.stats.mostActiveDay}`}
              color="bg-purple-500"
            />
          </div>
        )}

        {/* Best Study Time */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 p-2.5 sm:p-3 dark:from-emerald-950/30 dark:to-teal-950/30"
        >
          <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 shrink-0" />
          <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 text-center">
            Your peak productivity time is{' '}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {data.stats.bestStudyTime}
            </span>
          </span>
        </motion.div>
      </CardContent>
    </Card>
  );
}
