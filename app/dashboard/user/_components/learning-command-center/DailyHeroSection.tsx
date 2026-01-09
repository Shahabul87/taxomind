'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Flame,
  Clock,
  Target,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { DailyAgenda } from './types';

interface DailyHeroSectionProps {
  agenda: DailyAgenda;
  userName: string;
  onDateChange?: (date: Date) => void;
}

export function DailyHeroSection({ agenda, userName, onDateChange }: DailyHeroSectionProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Get stats from either new or legacy format
  const stats = agenda.stats || agenda.summary;
  const streak = agenda.streak || { currentStreak: 0, current: 0, atRisk: false };
  const weeklyProgress = agenda.weeklyProgress || stats?.weeklyProgress;

  // Calculate derived values with fallbacks
  const streakCount = streak.currentStreak || streak.current || 0;
  const streakAtRisk = streak.atRisk || false;
  const totalActivities = stats?.totalActivities || 0;
  const plannedMinutes = stats?.totalPlannedMinutes || (stats?.plannedHours ? stats.plannedHours * 60 : 0);
  const completedMinutes = stats?.totalCompletedMinutes || (stats?.completedHours ? stats.completedHours * 60 : 0);
  const completionRate = stats?.completionRate || 0;

  // Weekly progress values
  const weeklyGoalHours = weeklyProgress?.goalHours || weeklyProgress?.target || 20;
  const weeklyCompletedHours = weeklyProgress?.hoursCompleted || weeklyProgress?.current || 0;
  const weeklyPercent = weeklyProgress?.percentComplete || weeklyProgress?.percentage || 0;

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 1);
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 1);
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    onDateChange?.(today);
  };

  const formatMinutesToHours = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const getProgressColor = (percent: number): string => {
    if (percent >= 80) return 'text-emerald-500';
    if (percent >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="absolute right-1/4 top-1/2 h-32 w-32 rounded-full bg-cyan-500/5 blur-2xl" />
        </div>

        <CardContent className="relative p-6 sm:p-8">
          {/* Date Navigation Row */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevDay}
                  className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </motion.div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-indigo-300" />
                <div className="flex flex-col">
                  <span className="text-xl font-semibold text-white sm:text-2xl">
                    {formatDate(selectedDate)}
                  </span>
                  {isToday(selectedDate) && (
                    <Badge
                      variant="secondary"
                      className="mt-1 w-fit bg-emerald-500/20 text-emerald-300"
                    >
                      Today
                    </Badge>
                  )}
                </div>
              </div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextDay}
                  className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </motion.div>

              {!isToday(selectedDate) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToday}
                    className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                  >
                    Go to Today
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Streak Badge */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2"
            >
              <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 px-4 py-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Flame className="h-5 w-5 text-orange-400" />
                </motion.div>
                <span className="text-lg font-bold text-orange-300">
                  {streakCount}
                </span>
                <span className="text-sm text-orange-300/80">day streak</span>
              </div>
              {streakAtRisk && (
                <Badge variant="destructive" className="animate-pulse">
                  At Risk!
                </Badge>
              )}
            </motion.div>
          </div>

          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-300" />
              <p className="text-lg text-slate-200 sm:text-xl">
                {agenda.greeting}
              </p>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              You have{' '}
              <span className="font-semibold text-white">
                {totalActivities} learning activities
              </span>{' '}
              planned for today.
            </p>
          </motion.div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {/* Hours Planned */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl bg-white/5 p-4 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {formatMinutesToHours(plannedMinutes)}
                  </p>
                  <p className="text-xs text-slate-400">Planned</p>
                </div>
              </div>
            </motion.div>

            {/* Hours Completed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl bg-white/5 p-4 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                  <Target className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {formatMinutesToHours(completedMinutes)}
                  </p>
                  <p className="text-xs text-slate-400">Done</p>
                </div>
              </div>
            </motion.div>

            {/* Completion Rate */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-xl bg-white/5 p-4 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20">
                  <TrendingUp className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${getProgressColor(completionRate)}`}>
                    {completionRate}%
                  </p>
                  <p className="text-xs text-slate-400">Complete</p>
                </div>
              </div>
            </motion.div>

            {/* Weekly Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="col-span-2 rounded-xl bg-white/5 p-4 backdrop-blur-sm sm:col-span-1"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Weekly Goal</span>
                  <span className="text-sm font-medium text-white">
                    {weeklyCompletedHours}h / {weeklyGoalHours}h
                  </span>
                </div>
                <Progress
                  value={weeklyPercent}
                  className="h-2 bg-white/10"
                />
                <p className="text-xs text-slate-400">
                  {(weeklyGoalHours - weeklyCompletedHours).toFixed(1)}h remaining
                </p>
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
