'use client';

/**
 * ScheduleStatusBanner Component
 *
 * A banner displaying the current schedule status with
 * target date, estimated completion, and days ahead/behind.
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StudyPlanMetrics } from '@/lib/sam/study-plan-metrics';

// ============================================================================
// TYPES
// ============================================================================

interface ScheduleStatusBannerProps {
  metrics: StudyPlanMetrics;
  targetDate?: Date | null;
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ScheduleStatusBanner({
  metrics,
  targetDate,
  className,
}: ScheduleStatusBannerProps) {
  const { scheduleStatus, daysAhead, estimatedCompletion, completionRate } = metrics;

  // If plan is complete, show success banner
  if (completionRate === 100) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex items-center gap-3 p-3 rounded-xl',
          'bg-emerald-50 dark:bg-emerald-950/30',
          'border border-emerald-200 dark:border-emerald-800',
          className
        )}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-emerald-700 dark:text-emerald-300">
            Study Plan Completed!
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            Congratulations on completing your study plan
          </p>
        </div>
      </motion.div>
    );
  }

  // Status-specific configurations
  const statusConfig = {
    ahead: {
      icon: <TrendingUp className="w-5 h-5" />,
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      containerBg: 'bg-emerald-50 dark:bg-emerald-950/30',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      primaryText: 'text-emerald-700 dark:text-emerald-300',
      secondaryText: 'text-emerald-600 dark:text-emerald-400',
      message: `${daysAhead} ${daysAhead === 1 ? 'day' : 'days'} ahead of schedule`,
    },
    'on-track': {
      icon: <Target className="w-5 h-5" />,
      iconBg: 'bg-blue-100 dark:bg-blue-900/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
      containerBg: 'bg-blue-50 dark:bg-blue-950/30',
      borderColor: 'border-blue-200 dark:border-blue-800',
      primaryText: 'text-blue-700 dark:text-blue-300',
      secondaryText: 'text-blue-600 dark:text-blue-400',
      message: 'On track to complete on time',
    },
    behind: {
      icon: <Clock className="w-5 h-5" />,
      iconBg: 'bg-amber-100 dark:bg-amber-900/50',
      iconColor: 'text-amber-600 dark:text-amber-400',
      containerBg: 'bg-amber-50 dark:bg-amber-950/30',
      borderColor: 'border-amber-200 dark:border-amber-800',
      primaryText: 'text-amber-700 dark:text-amber-300',
      secondaryText: 'text-amber-600 dark:text-amber-400',
      message: `${Math.abs(daysAhead)} ${Math.abs(daysAhead) === 1 ? 'day' : 'days'} behind schedule`,
    },
    'at-risk': {
      icon: <AlertTriangle className="w-5 h-5" />,
      iconBg: 'bg-red-100 dark:bg-red-900/50',
      iconColor: 'text-red-600 dark:text-red-400',
      containerBg: 'bg-red-50 dark:bg-red-950/30',
      borderColor: 'border-red-200 dark:border-red-800',
      primaryText: 'text-red-700 dark:text-red-300',
      secondaryText: 'text-red-600 dark:text-red-400',
      message: 'May not complete by target date',
    },
  };

  const config = statusConfig[scheduleStatus];

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl',
        config.containerBg,
        'border',
        config.borderColor,
        className
      )}
    >
      {/* Status icon */}
      <div className={cn('flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0', config.iconBg)}>
        <span className={config.iconColor}>{config.icon}</span>
      </div>

      {/* Status message */}
      <div className="flex-1 min-w-0">
        <p className={cn('font-semibold text-sm', config.primaryText)}>{config.message}</p>
        <p className={cn('text-xs', config.secondaryText)}>
          {scheduleStatus === 'behind' || scheduleStatus === 'at-risk'
            ? 'Consider adjusting your schedule'
            : 'Keep up the great work!'}
        </p>
      </div>

      {/* Date info */}
      <div className="flex items-center gap-4 text-xs flex-shrink-0">
        {targetDate && (
          <div className="flex items-center gap-1.5">
            <Target className={cn('w-3.5 h-3.5', config.iconColor)} />
            <span className={config.secondaryText}>
              Target: {targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        )}
        {estimatedCompletion && (
          <div className="flex items-center gap-1.5">
            <Calendar className={cn('w-3.5 h-3.5', config.iconColor)} />
            <span className={config.secondaryText}>
              Est: {estimatedCompletion.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default ScheduleStatusBanner;
