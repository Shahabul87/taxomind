'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Flame,
  Clock,
  Target,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Info,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { QuickStatCard } from './QuickStatCard';
import {
  HEATMAP_INTENSITY_LEVELS,
  type PracticeHeatmapProps,
  type HeatmapDay,
  type HeatmapResponse,
} from './types';

// ============================================================================
// HEATMAP CELL
// ============================================================================

interface HeatmapCellProps {
  day: HeatmapDay;
  onClick?: (day: HeatmapDay) => void;
}

function HeatmapCell({ day, onClick }: HeatmapCellProps) {
  // Safe defaults for day data
  const intensity = day.intensity ?? 0;
  const totalQualityHours = day.totalQualityHours ?? 0;
  const totalRawHours = day.totalRawHours ?? 0;
  const totalSessions = day.totalSessions ?? 0;
  const avgMultiplier = day.avgMultiplier ?? 0;

  const levelConfig = HEATMAP_INTENSITY_LEVELS[intensity as keyof typeof HEATMAP_INTENSITY_LEVELS] ?? HEATMAP_INTENSITY_LEVELS[0];
  const date = new Date(day.date);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const formatHours = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${hours.toFixed(1)}h`;
  };

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
            aria-label={`${formattedDate}: ${totalQualityHours > 0 ? formatHours(totalQualityHours) : 'No activity'}`}
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <p className="font-semibold">{formattedDate}</p>
            {totalQualityHours > 0 ? (
              <>
                <p>Quality Hours: {formatHours(totalQualityHours)}</p>
                <p>Raw Hours: {formatHours(totalRawHours)}</p>
                <p>Sessions: {totalSessions}</p>
                <p>Avg Multiplier: {avgMultiplier.toFixed(2)}x</p>
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

// ============================================================================
// CONSTANTS
// ============================================================================

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PracticeHeatmap({
  year: initialYear,
  onDayClick,
  showStats = true,
  compact = false,
  className,
}: PracticeHeatmapProps) {
  const [year, setYear] = useState(initialYear ?? new Date().getFullYear());
  const [data, setData] = useState<HeatmapResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch heatmap data
  const fetchHeatmap = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/sam/practice/heatmap?year=${year}`);
      if (!response.ok) {
        throw new Error('Failed to fetch heatmap data');
      }
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch heatmap';
      setError(message);
      console.error('[PracticeHeatmap] fetchHeatmap error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchHeatmap();
  }, [fetchHeatmap]);

  // Generate heatmap grid structure
  const { weeks, monthLabels } = useMemo(() => {
    if (!data) {
      return { weeks: [], monthLabels: [] };
    }

    // Create a map of date -> day data
    const dayMap = new Map(data.heatmap.map((d) => [d.date, d]));

    // Generate all days for the year
    const allDays: (HeatmapDay | null)[] = [];
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    const startDayOfWeek = startDate.getDay();

    // Add padding for days before Jan 1
    for (let i = 0; i < startDayOfWeek; i++) {
      allDays.push(null);
    }

    // Add all days of the year
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateKey = current.toISOString().split('T')[0];
      const dayData = dayMap.get(dateKey);
      allDays.push(
        dayData || {
          date: dateKey,
          totalRawHours: 0,
          totalQualityHours: 0,
          totalSessions: 0,
          avgMultiplier: 0,
          intensity: 0,
          color: '#ebedf0',
        }
      );
      current.setDate(current.getDate() + 1);
    }

    // Group into weeks
    const weeksResult: (HeatmapDay | null)[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weeksResult.push(allDays.slice(i, i + 7));
    }

    // Calculate month labels
    const labels: { month: string; weekIndex: number }[] = [];
    let currentMonth = -1;

    weeksResult.forEach((week, weekIndex) => {
      for (const day of week) {
        if (day) {
          const monthNum = new Date(day.date).getMonth();
          if (monthNum !== currentMonth) {
            labels.push({
              month: MONTH_NAMES[monthNum],
              weekIndex,
            });
            currentMonth = monthNum;
          }
          break;
        }
      }
    });

    return { weeks: weeksResult, monthLabels: labels };
  }, [data, year]);

  // Safe defaults for stats data
  const yearlyStats = {
    totalQualityHours: data?.yearlyStats?.totalQualityHours ?? 0,
    totalRawHours: data?.yearlyStats?.totalRawHours ?? 0,
    totalSessions: data?.yearlyStats?.totalSessions ?? 0,
    activeDays: data?.yearlyStats?.activeDays ?? 0,
    avgDailyHours: data?.yearlyStats?.avgDailyHours ?? 0,
  };

  const streaks = {
    current: data?.streaks?.current ?? 0,
    longest: data?.streaks?.longest ?? 0,
  };

  // Compact view
  if (compact) {
    return (
      <Card className={cn('border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-emerald-500" />
            Practice Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : data ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {streaks.current}
                  </span>
                  <span className="text-xs text-slate-500">day streak</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {yearlyStats.totalQualityHours.toFixed(0)}
                  </span>
                  <span className="text-xs text-slate-500">hours</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-xs">
                View Full
              </Button>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No data available</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-emerald-500" />
            Practice Activity - {year}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setYear(year - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setYear(year + 1)}
              disabled={year >= new Date().getFullYear()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 ml-2" onClick={fetchHeatmap}>
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchHeatmap}>
              Retry
            </Button>
          </div>
        ) : (
          <>
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
                        HEATMAP_INTENSITY_LEVELS[level as keyof typeof HEATMAP_INTENSITY_LEVELS].color
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
                          Intensity based on quality practice hours per day
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            {showStats && data && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <QuickStatCard
                  icon={Clock}
                  label="Quality Hours"
                  value={yearlyStats.totalQualityHours.toFixed(0)}
                  subValue={`${yearlyStats.totalRawHours.toFixed(0)} raw hours`}
                  color="bg-blue-500"
                />
                <QuickStatCard
                  icon={Flame}
                  label="Current Streak"
                  value={`${streaks.current} days`}
                  subValue={`Longest: ${streaks.longest} days`}
                  color="bg-orange-500"
                />
                <QuickStatCard
                  icon={Target}
                  label="Total Sessions"
                  value={yearlyStats.totalSessions}
                  subValue={`${yearlyStats.activeDays} active days`}
                  color="bg-emerald-500"
                />
                <QuickStatCard
                  icon={Trophy}
                  label="Daily Average"
                  value={`${yearlyStats.avgDailyHours.toFixed(1)}h`}
                  subValue={`Across ${yearlyStats.activeDays} days`}
                  color="bg-purple-500"
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default PracticeHeatmap;
