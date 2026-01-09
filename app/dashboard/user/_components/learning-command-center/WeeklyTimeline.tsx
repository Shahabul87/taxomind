'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  ChevronRight,
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { WeeklyTimelineDay } from './types';

interface WeeklyTimelineProps {
  days: WeeklyTimelineDay[];
  onViewDetails?: () => void;
  showDetailedView?: boolean;
}

export function WeeklyTimeline({ days, onViewDetails, showDetailedView = false }: WeeklyTimelineProps) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'bars' | 'stacked'>('bars');

  const totalPlanned = days.reduce((sum, d) => sum + d.plannedHours, 0);
  const totalActual = days.reduce((sum, d) => sum + d.actualHours, 0);
  const totalRemaining = Math.max(0, totalPlanned - totalActual);
  const variance = totalActual - totalPlanned;
  const completionRate = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0;

  // Calculate max hours for scaling bars
  const maxHours = Math.max(...days.map((d) => Math.max(d.plannedHours, d.actualHours)), 1);

  const getBarHeight = (hours: number): number => {
    if (maxHours === 0) return 0;
    return (hours / maxHours) * 100;
  };

  const getDayStatus = (day: WeeklyTimelineDay): { status: string; color: string; icon: React.ElementType } => {
    const isPast = new Date(day.date) < new Date() && !day.isToday;
    const completion = day.plannedHours > 0 ? (day.actualHours / day.plannedHours) * 100 : 0;

    if (day.plannedHours === 0) {
      return { status: 'No Plan', color: 'text-slate-400', icon: Calendar };
    }
    if (completion >= 100) {
      return { status: 'Completed', color: 'text-emerald-500', icon: CheckCircle2 };
    }
    if (isPast && completion < 100) {
      return { status: 'Missed', color: 'text-red-500', icon: AlertCircle };
    }
    if (day.isToday) {
      return { status: 'In Progress', color: 'text-indigo-500', icon: Clock };
    }
    return { status: 'Upcoming', color: 'text-slate-500', icon: Target };
  };

  const getVarianceStatus = (): { color: string; icon: React.ElementType; label: string } => {
    if (variance > 0) {
      return { color: 'text-emerald-600', icon: TrendingUp, label: 'ahead' };
    } else if (variance < 0) {
      return { color: 'text-amber-600', icon: TrendingDown, label: 'behind' };
    }
    return { color: 'text-slate-600', icon: Calendar, label: 'on track' };
  };

  const varianceStatus = getVarianceStatus();
  const VarianceIcon = varianceStatus.icon;

  return (
    <TooltipProvider>
      <Card className="border-slate-200/50 bg-white/70 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-800/70">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              Planned vs Accomplished
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
                <button
                  onClick={() => setViewMode('bars')}
                  className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                    viewMode === 'bars'
                      ? 'bg-indigo-500 text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Bars
                </button>
                <button
                  onClick={() => setViewMode('stacked')}
                  className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                    viewMode === 'stacked'
                      ? 'bg-indigo-500 text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Stacked
                </button>
              </div>
              <Button variant="ghost" size="sm" onClick={onViewDetails}>
                Details
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Enhanced Summary stats */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 rounded-lg bg-slate-100/80 px-3 py-1.5 dark:bg-slate-700/50">
                  <div className="h-3 w-3 rounded-sm bg-slate-400 dark:bg-slate-500" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {totalPlanned}h
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">planned</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total hours planned for this week</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 rounded-lg bg-emerald-100/80 px-3 py-1.5 dark:bg-emerald-900/30">
                  <div className="h-3 w-3 rounded-sm bg-emerald-500" />
                  <span className="font-medium text-emerald-700 dark:text-emerald-400">
                    {totalActual}h
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-500">completed</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total hours actually completed</p>
              </TooltipContent>
            </Tooltip>

            {totalRemaining > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 rounded-lg bg-amber-100/80 px-3 py-1.5 dark:bg-amber-900/30">
                    <div className="h-3 w-3 rounded-sm bg-amber-400" />
                    <span className="font-medium text-amber-700 dark:text-amber-400">
                      {totalRemaining.toFixed(1)}h
                    </span>
                    <span className="text-amber-600 dark:text-amber-500">remaining</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Hours remaining to meet your goal</p>
                </TooltipContent>
              </Tooltip>
            )}

            <Badge
              variant="secondary"
              className={`ml-auto ${
                variance >= 0
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              }`}
            >
              <VarianceIcon className="mr-1 h-3 w-3" />
              {variance >= 0 ? '+' : ''}{variance.toFixed(1)}h {varianceStatus.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {/* Bar Chart */}
          <div className="flex items-end justify-between gap-2 py-4">
            <AnimatePresence mode="wait">
              {days.map((day, index) => {
                const dayStatus = getDayStatus(day);
                const StatusIcon = dayStatus.icon;
                const remaining = Math.max(0, day.plannedHours - day.actualHours);

                return (
                  <Tooltip key={day.dayName}>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="group flex flex-1 flex-col items-center gap-2"
                        onMouseEnter={() => setHoveredDay(day.dayName)}
                        onMouseLeave={() => setHoveredDay(null)}
                      >
                        {/* Bars Container */}
                        <div className="relative flex h-32 w-full items-end justify-center gap-1">
                          {viewMode === 'bars' ? (
                            <>
                              {/* Planned Bar */}
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${getBarHeight(day.plannedHours)}%` }}
                                transition={{ duration: 0.5, delay: index * 0.05 }}
                                className={`w-4 rounded-t-sm transition-all ${
                                  day.isToday
                                    ? 'bg-indigo-200 dark:bg-indigo-800'
                                    : 'bg-slate-300 dark:bg-slate-600'
                                } ${hoveredDay === day.dayName ? 'opacity-100' : 'opacity-80'}`}
                              />

                              {/* Actual Bar */}
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${getBarHeight(day.actualHours)}%` }}
                                transition={{ duration: 0.5, delay: index * 0.05 + 0.2 }}
                                className={`w-4 rounded-t-sm transition-all ${
                                  day.actualHours >= day.plannedHours
                                    ? 'bg-emerald-500'
                                    : day.isToday
                                      ? 'bg-indigo-500'
                                      : 'bg-amber-500'
                                } ${hoveredDay === day.dayName ? 'shadow-lg' : ''}`}
                              />
                            </>
                          ) : (
                            /* Stacked View */
                            <div className="relative h-full w-8 overflow-hidden rounded-t-sm">
                              {/* Planned Background */}
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${getBarHeight(day.plannedHours)}%` }}
                                transition={{ duration: 0.5, delay: index * 0.05 }}
                                className={`absolute bottom-0 w-full ${
                                  day.isToday
                                    ? 'bg-indigo-100 dark:bg-indigo-900/50'
                                    : 'bg-slate-200 dark:bg-slate-700'
                                }`}
                              />
                              {/* Completed Overlay */}
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${getBarHeight(day.actualHours)}%` }}
                                transition={{ duration: 0.5, delay: index * 0.05 + 0.2 }}
                                className={`absolute bottom-0 w-full ${
                                  day.actualHours >= day.plannedHours
                                    ? 'bg-emerald-500'
                                    : day.isToday
                                      ? 'bg-indigo-500'
                                      : 'bg-amber-500'
                                }`}
                              />
                              {/* Remaining indicator */}
                              {remaining > 0 && day.actualHours > 0 && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                                >
                                  <div className="h-1 w-1 rounded-full bg-white/80" />
                                </motion.div>
                              )}
                            </div>
                          )}

                          {/* Hover label */}
                          <AnimatePresence>
                            {hoveredDay === day.dayName && day.actualHours > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-2 py-1 text-xs font-medium text-white shadow-lg"
                              >
                                {day.actualHours}h / {day.plannedHours}h
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Day Label */}
                        <div className="flex flex-col items-center">
                          <span
                            className={`text-xs font-medium transition-colors ${
                              day.isToday
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : hoveredDay === day.dayName
                                  ? 'text-slate-800 dark:text-slate-200'
                                  : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {day.dayName}
                          </span>
                          {day.isToday && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500"
                            />
                          )}
                        </div>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`h-4 w-4 ${dayStatus.color}`} />
                          <span className="font-medium">{dayStatus.status}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          <div>Planned: {day.plannedHours}h</div>
                          <div>Completed: {day.actualHours}h</div>
                          {remaining > 0 && (
                            <div className="text-amber-600 dark:text-amber-400">
                              Remaining: {remaining.toFixed(1)}h
                            </div>
                          )}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Enhanced Legend */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 border-t border-slate-200 pt-4 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-slate-300 dark:bg-slate-600" />
              <span className="text-xs text-slate-500">Planned</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-emerald-500" />
              <span className="text-xs text-slate-500">Goal Met</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-amber-500" />
              <span className="text-xs text-slate-500">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-indigo-500" />
              <span className="text-xs text-slate-500">Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-red-400" />
              <span className="text-xs text-slate-500">Missed</span>
            </div>
          </div>

          {/* Weekly Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-4 rounded-xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-4 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Weekly Completion Rate
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                    {completionRate}%
                  </p>
                  {variance !== 0 && (
                    <span
                      className={`text-sm font-medium ${
                        variance >= 0 ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {variance >= 0 ? '+' : ''}{variance.toFixed(1)}h
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="flex items-center justify-end gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {totalActual}h completed
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Target className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs text-slate-500">
                    {totalPlanned}h planned
                  </span>
                </div>
                {totalRemaining > 0 && (
                  <div className="flex items-center justify-end gap-2">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-xs text-amber-600 dark:text-amber-400">
                      {totalRemaining.toFixed(1)}h remaining
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Segmented Progress bar */}
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="flex h-full">
                {/* Completed segment */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min((totalActual / Math.max(totalPlanned, totalActual)) * 100, 100)}%`
                  }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full ${
                    completionRate >= 100
                      ? 'bg-emerald-500'
                      : completionRate >= 75
                        ? 'bg-indigo-500'
                        : completionRate >= 50
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                  }`}
                />
                {/* Remaining segment (if over target) */}
                {totalActual > totalPlanned && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${((totalActual - totalPlanned) / totalActual) * 100}%`,
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                    className="h-full bg-emerald-300 dark:bg-emerald-700"
                  />
                )}
              </div>
            </div>

            {/* Motivational message */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400"
            >
              {completionRate >= 100
                ? '🎉 Excellent! You&apos;ve exceeded your weekly goal!'
                : completionRate >= 75
                  ? '💪 Great progress! Keep up the momentum!'
                  : completionRate >= 50
                    ? '📈 Good start! You&apos;re halfway there!'
                    : totalActual > 0
                      ? '🚀 Keep going! Every hour counts!'
                      : '✨ Ready to start your learning journey this week?'}
            </motion.p>
          </motion.div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
