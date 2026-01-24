'use client';

/**
 * PaceProjection Component
 *
 * A timeline visualization showing current position relative to
 * start and target dates, with pace projection.
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Rocket,
  Target,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScheduleStatus } from '@/lib/sam/study-plan-metrics';

interface PaceProjectionProps {
  startDate: Date | null;
  targetDate: Date | null;
  estimatedCompletion: Date | null;
  daysAhead: number;
  scheduleStatus: ScheduleStatus;
  completionRate: number;
  className?: string;
}

export function PaceProjection({
  startDate,
  targetDate,
  estimatedCompletion,
  daysAhead,
  scheduleStatus,
  completionRate,
  className,
}: PaceProjectionProps) {
  if (!startDate || !targetDate) return null;

  const today = new Date();
  const totalDays = Math.ceil(
    (targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysElapsed = Math.ceil(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const progressPosition = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));

  // Format dates
  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Status config
  const statusConfig = {
    ahead: {
      color: 'emerald',
      icon: <TrendingUp className="w-4 h-4" />,
      text: `${Math.abs(daysAhead)} days ahead!`,
      subtext: 'Excellent pace',
      bgClass: 'from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20',
      borderClass: 'border-emerald-200 dark:border-emerald-800',
      textClass: 'text-emerald-700 dark:text-emerald-300',
    },
    'on-track': {
      color: 'blue',
      icon: <Minus className="w-4 h-4" />,
      text: 'On track',
      subtext: 'Good progress',
      bgClass: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
      borderClass: 'border-blue-200 dark:border-blue-800',
      textClass: 'text-blue-700 dark:text-blue-300',
    },
    behind: {
      color: 'amber',
      icon: <TrendingDown className="w-4 h-4" />,
      text: `${Math.abs(daysAhead)} days behind`,
      subtext: 'Catch up needed',
      bgClass: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
      borderClass: 'border-amber-200 dark:border-amber-800',
      textClass: 'text-amber-700 dark:text-amber-300',
    },
    'at-risk': {
      color: 'red',
      icon: <TrendingDown className="w-4 h-4" />,
      text: 'At risk',
      subtext: 'Action needed',
      bgClass: 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20',
      borderClass: 'border-red-200 dark:border-red-800',
      textClass: 'text-red-700 dark:text-red-300',
    },
  };

  const config = statusConfig[scheduleStatus];

  return (
    <div className={cn('', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Rocket className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Pace & Projection
          </span>
        </div>
        <div
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
            config.bgClass,
            config.textClass
          )}
        >
          {config.icon}
          {config.text}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative mb-4">
        {/* Track */}
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          {/* Progress fill */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
          />
        </div>

        {/* Position marker (where you are) */}
        <motion.div
          initial={{ left: 0 }}
          animate={{ left: `${progressPosition}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
          style={{ left: `${progressPosition}%` }}
        >
          <div className="relative">
            <div className="w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-500 shadow-lg flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            {/* Pulse animation */}
            <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-30" />
          </div>
        </motion.div>

        {/* Start marker */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2">
          <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        {/* Target marker */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2">
          <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
            <Target className="w-2.5 h-2.5 text-white" />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="flex justify-between text-[10px] mb-4">
        <div className="text-slate-500 dark:text-slate-400">
          <div className="font-medium">Start</div>
          <div>{formatDate(startDate)}</div>
        </div>
        <div className="text-center text-blue-600 dark:text-blue-400">
          <div className="font-medium">You are here</div>
          <div>{formatDate(today)}</div>
        </div>
        <div className="text-right text-slate-500 dark:text-slate-400">
          <div className="font-medium">Target</div>
          <div>{formatDate(targetDate)}</div>
        </div>
      </div>

      {/* Projection box */}
      <div
        className={cn(
          'p-3 rounded-lg border bg-gradient-to-r',
          config.bgClass,
          config.borderClass
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className={cn('w-4 h-4', config.textClass)} />
            <div>
              <div className={cn('text-sm font-medium', config.textClass)}>
                {scheduleStatus === 'ahead' && (
                  <>Completing {formatDate(estimatedCompletion || targetDate)}</>
                )}
                {scheduleStatus === 'on-track' && (
                  <>On track for {formatDate(targetDate)}</>
                )}
                {scheduleStatus === 'behind' && (
                  <>Est. completion: {formatDate(estimatedCompletion || targetDate)}</>
                )}
                {scheduleStatus === 'at-risk' && (
                  <>May miss target date</>
                )}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                {config.subtext}
              </div>
            </div>
          </div>

          {scheduleStatus === 'ahead' && (
            <div className="text-2xl">🚀</div>
          )}
          {scheduleStatus === 'on-track' && (
            <div className="text-2xl">👍</div>
          )}
          {scheduleStatus === 'behind' && (
            <div className="text-2xl">⚡</div>
          )}
          {scheduleStatus === 'at-risk' && (
            <div className="text-2xl">⚠️</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaceProjection;
