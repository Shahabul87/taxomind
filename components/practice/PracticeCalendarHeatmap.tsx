'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Calendar, Loader2 } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface HeatmapDay {
  date: string;
  totalRawHours: number;
  totalQualityHours: number;
  sessionsCount: number;
  avgQualityMultiplier: number;
  intensity?: number;
  color?: string;
}

interface HeatmapData {
  heatmap: HeatmapDay[];
  yearlyStats: {
    totalRawHours: number;
    totalQualityHours: number;
    totalSessions: number;
    activeDays: number;
    avgHoursPerActiveDay: number;
  };
  streaks: {
    current: number;
    longest: number;
  };
  metadata: {
    year: number;
    totalDays: number;
    activeDays: number;
    maxHoursInDay: number;
  };
}

interface PracticeCalendarHeatmapProps {
  year?: number;
  onDayClick?: (date: string, data: HeatmapDay) => void;
  className?: string;
}

// Color scale for GitHub-style heatmap
const INTENSITY_COLORS = [
  'bg-muted',                    // No activity
  'bg-green-200 dark:bg-green-900',  // Level 1
  'bg-green-300 dark:bg-green-700',  // Level 2
  'bg-green-500 dark:bg-green-500',  // Level 3
  'bg-green-700 dark:bg-green-300',  // Level 4
];

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ============================================================================
// COMPONENT
// ============================================================================

export function PracticeCalendarHeatmap({
  year: initialYear,
  onDayClick,
  className,
}: PracticeCalendarHeatmapProps) {
  const [year, setYear] = useState<number>(initialYear ?? new Date().getFullYear());
  const [data, setData] = useState<HeatmapData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch heatmap data
  useEffect(() => {
    const fetchHeatmapData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/sam/practice/heatmap?year=${year}`);
        const result = await response.json();

        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Error fetching heatmap data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHeatmapData();
  }, [year]);

  // Generate calendar grid
  const calendarGrid = useMemo(() => {
    if (!data) return [];

    // Create a map of date -> heatmap data
    const dateMap = new Map<string, HeatmapDay>();
    data.heatmap.forEach((day) => {
      dateMap.set(day.date.split('T')[0], day);
    });

    // Generate all weeks for the year
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    // Adjust start to first Sunday
    const firstSunday = new Date(startDate);
    firstSunday.setDate(startDate.getDate() - startDate.getDay());

    // Generate weeks
    const weeks: (HeatmapDay | null)[][] = [];
    let currentDate = new Date(firstSunday);

    while (currentDate <= endDate || weeks.length < 53) {
      const week: (HeatmapDay | null)[] = [];

      for (let i = 0; i < 7; i++) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const isInYear = currentDate.getFullYear() === year;

        if (isInYear) {
          const dayData = dateMap.get(dateStr) ?? {
            date: dateStr,
            totalRawHours: 0,
            totalQualityHours: 0,
            sessionsCount: 0,
            avgQualityMultiplier: 0,
            intensity: 0,
          };
          week.push(dayData);
        } else {
          week.push(null);
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      weeks.push(week);

      if (currentDate.getFullYear() > year && currentDate.getDay() === 0) {
        break;
      }
    }

    return weeks;
  }, [data, year]);

  // Calculate month labels positions
  const monthLabels = useMemo(() => {
    const labels: { month: string; position: number }[] = [];
    let currentMonth = -1;

    calendarGrid.forEach((week, weekIndex) => {
      const firstValidDay = week.find((day) => day !== null);
      if (firstValidDay) {
        const date = new Date(firstValidDay.date);
        const month = date.getMonth();
        if (month !== currentMonth) {
          labels.push({ month: MONTHS[month], position: weekIndex });
          currentMonth = month;
        }
      }
    });

    return labels;
  }, [calendarGrid]);

  // Year options (last 5 years)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, []);

  if (isLoading) {
    return (
      <Card className={cn('bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg', className)}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 dark:text-purple-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg', className)}>
      <CardHeader className="pb-3 sm:pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            <div className="p-1.5 sm:p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-base sm:text-xl">Practice Activity</span>
          </CardTitle>
          <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v, 10))}>
            <SelectTrigger className="w-full sm:w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {/* Stats Summary */}
        {data && (
          <div className="flex flex-wrap gap-3 sm:gap-4 mb-3 sm:mb-4 text-xs sm:text-sm">
            <div>
              <span className="font-medium">{data.yearlyStats.totalQualityHours.toFixed(1)}</span>
              <span className="text-muted-foreground ml-1">quality hours</span>
            </div>
            <div>
              <span className="font-medium">{data.metadata.activeDays}</span>
              <span className="text-muted-foreground ml-1">days active</span>
            </div>
            <div>
              <span className="font-medium">{data.streaks.longest}</span>
              <span className="text-muted-foreground ml-1">best streak</span>
            </div>
          </div>
        )}

        {/* Calendar Grid */}
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <TooltipProvider>
            <div className="inline-block min-w-full sm:min-w-0">
              {/* Month Labels */}
              <div className="flex mb-1 ml-6 sm:ml-8">
                {monthLabels.map(({ month, position }, index) => (
                  <div
                    key={`${month}-${index}`}
                    className="text-xs text-muted-foreground"
                    style={{
                      marginLeft: index === 0 ? position * 12 : (position - monthLabels[index - 1].position) * 12 - 24,
                      width: 24,
                    }}
                  >
                    {month}
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="flex">
                {/* Day Labels */}
                <div className="flex flex-col mr-0.5 sm:mr-1 justify-between py-0.5">
                  {DAYS.map((day, index) => (
                    <div
                      key={day}
                      className="text-xs text-muted-foreground h-[10px] flex items-center"
                      style={{ visibility: index % 2 === 1 ? 'visible' : 'hidden' }}
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Weeks */}
                <div className="flex gap-0.5">
                  {calendarGrid.map((week, weekIndex) => (
                    <div key={weekIndex} className="flex flex-col gap-0.5">
                      {week.map((day, dayIndex) => (
                        <Tooltip key={`${weekIndex}-${dayIndex}`}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'w-[10px] h-[10px] sm:w-[11px] sm:h-[11px] rounded-sm cursor-pointer transition-colors',
                                day
                                  ? INTENSITY_COLORS[day.intensity ?? 0]
                                  : 'bg-transparent',
                                day && 'hover:ring-1 hover:ring-foreground/20'
                              )}
                              onClick={() => {
                                if (day) {
                                  onDayClick?.(day.date, day);
                                }
                              }}
                            />
                          </TooltipTrigger>
                          {day && (
                            <TooltipContent>
                              <div className="text-xs">
                                <p className="font-medium">
                                  {new Date(day.date).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </p>
                                {day.totalQualityHours > 0 ? (
                                  <>
                                    <p>{day.totalQualityHours.toFixed(2)} quality hours</p>
                                    <p>{day.sessionsCount} session(s)</p>
                                  </>
                                ) : (
                                  <p className="text-muted-foreground">No practice</p>
                                )}
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-1 mt-3 justify-end">
                <span className="text-xs text-muted-foreground mr-1">Less</span>
                {INTENSITY_COLORS.map((color, index) => (
                  <div
                    key={index}
                    className={cn('w-[10px] h-[10px] rounded-sm', color)}
                  />
                ))}
                <span className="text-xs text-muted-foreground ml-1">More</span>
              </div>
            </div>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
