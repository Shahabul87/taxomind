'use client';

/**
 * StudyActivityHeatmap Component
 *
 * A GitHub-style activity calendar showing study consistency
 * over the past 4 weeks.
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SubGoalData } from '@/lib/sam/study-plan-metrics';

interface StudyActivityHeatmapProps {
  subGoals: SubGoalData[];
  startDate?: string | Date;
  className?: string;
}

interface DayActivity {
  date: Date;
  hours: number;
  taskCount: number;
  isToday: boolean;
  isFuture: boolean;
}

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export function StudyActivityHeatmap({
  subGoals,
  startDate,
  className,
}: StudyActivityHeatmapProps) {
  // Calculate activity data for the last 4 weeks
  const activityData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get completed tasks with dates
    const completedTasks = subGoals.filter(
      (sg) => sg.status === 'completed' && sg.completedAt
    );

    // Create a map of date -> activity
    const activityMap = new Map<string, { hours: number; taskCount: number }>();

    completedTasks.forEach((task) => {
      const date = new Date(task.completedAt!);
      const dateKey = date.toISOString().split('T')[0];
      const existing = activityMap.get(dateKey) || { hours: 0, taskCount: 0 };
      activityMap.set(dateKey, {
        hours: existing.hours + (task.estimatedMinutes || 0) / 60,
        taskCount: existing.taskCount + 1,
      });
    });

    // Generate 4 weeks of data (28 days)
    const weeks: DayActivity[][] = [];
    const startOfPlan = startDate ? new Date(startDate) : new Date();
    startOfPlan.setHours(0, 0, 0, 0);

    // Find the Monday of the week containing startDate
    const dayOfWeek = startOfPlan.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const firstMonday = new Date(startOfPlan);
    firstMonday.setDate(firstMonday.getDate() + mondayOffset);

    for (let week = 0; week < 4; week++) {
      const weekData: DayActivity[] = [];

      for (let day = 0; day < 7; day++) {
        const date = new Date(firstMonday);
        date.setDate(firstMonday.getDate() + week * 7 + day);
        const dateKey = date.toISOString().split('T')[0];
        const activity = activityMap.get(dateKey) || { hours: 0, taskCount: 0 };

        weekData.push({
          date,
          hours: activity.hours,
          taskCount: activity.taskCount,
          isToday: date.getTime() === today.getTime(),
          isFuture: date > today,
        });
      }

      weeks.push(weekData);
    }

    return weeks;
  }, [subGoals, startDate]);

  // Get intensity level (0-4) based on hours
  const getIntensity = (hours: number, isFuture: boolean): number => {
    if (isFuture) return -1; // Future days
    if (hours === 0) return 0;
    if (hours < 1) return 1;
    if (hours < 2) return 2;
    if (hours < 3) return 3;
    return 4;
  };

  // Get color class based on intensity
  const getColorClass = (intensity: number, isToday: boolean): string => {
    if (intensity === -1) return 'bg-slate-50 dark:bg-slate-800/50';
    if (isToday) {
      return intensity === 0
        ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-400'
        : 'bg-blue-500 ring-2 ring-blue-400';
    }

    switch (intensity) {
      case 0:
        return 'bg-slate-100 dark:bg-slate-800';
      case 1:
        return 'bg-emerald-200 dark:bg-emerald-900/50';
      case 2:
        return 'bg-emerald-400 dark:bg-emerald-700';
      case 3:
        return 'bg-emerald-500 dark:bg-emerald-600';
      case 4:
        return 'bg-emerald-600 dark:bg-emerald-500';
      default:
        return 'bg-slate-100 dark:bg-slate-800';
    }
  };

  return (
    <div className={cn('', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Study Activity
        </span>
      </div>

      {/* Day labels */}
      <div className="flex gap-1 mb-1 ml-12">
        {DAYS.map((day) => (
          <div
            key={day}
            className="w-6 h-4 text-[10px] text-center text-slate-400 dark:text-slate-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="space-y-1">
        {activityData.map((week, weekIndex) => (
          <div key={weekIndex} className="flex items-center gap-1">
            {/* Week label */}
            <div className="w-10 text-[10px] text-slate-400 dark:text-slate-500 text-right pr-2">
              {weekIndex === 0 && 'Week 1'}
              {weekIndex === 1 && 'Week 2'}
              {weekIndex === 2 && 'Week 3'}
              {weekIndex === 3 && 'Week 4'}
            </div>

            {/* Day cells */}
            {week.map((day, dayIndex) => {
              const intensity = getIntensity(day.hours, day.isFuture);
              return (
                <motion.div
                  key={dayIndex}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: (weekIndex * 7 + dayIndex) * 0.02 }}
                  className={cn(
                    'w-6 h-6 rounded-sm cursor-default transition-colors',
                    getColorClass(intensity, day.isToday)
                  )}
                  title={`${day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${day.hours.toFixed(1)}h, ${day.taskCount} tasks`}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-2">
        <span className="text-[10px] text-slate-400">Less</span>
        <div className="flex gap-0.5">
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn('w-3 h-3 rounded-sm', getColorClass(level, false))}
            />
          ))}
        </div>
        <span className="text-[10px] text-slate-400">More</span>
      </div>
    </div>
  );
}

export default StudyActivityHeatmap;
