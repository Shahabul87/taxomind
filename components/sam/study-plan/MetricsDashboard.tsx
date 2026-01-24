'use client';

/**
 * MetricsDashboard Component
 *
 * Displays 4 key metric cards for study plan progress:
 * - Time completed/remaining
 * - Tasks completed/total
 * - Schedule status (on track/ahead/behind)
 * - Study streak
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckSquare, Calendar, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StudyPlanMetrics } from '@/lib/sam/study-plan-metrics';
import { formatHours } from '@/lib/sam/study-plan-metrics';

// ============================================================================
// TYPES
// ============================================================================

interface MetricsDashboardProps {
  metrics: StudyPlanMetrics;
  className?: string;
  compact?: boolean;
}

interface MetricCardProps {
  icon: React.ReactNode;
  iconBgColor: string;
  primary: string;
  secondary: string;
  accentColor: string;
  delay?: number;
}

// ============================================================================
// METRIC CARD COMPONENT
// ============================================================================

function MetricCard({
  icon,
  iconBgColor,
  primary,
  secondary,
  accentColor,
  delay = 0,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.2 }}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border',
        'bg-white dark:bg-slate-800',
        'border-slate-200 dark:border-slate-700'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0',
          iconBgColor
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('font-bold text-sm truncate', accentColor)}>{primary}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{secondary}</p>
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MetricsDashboard({ metrics, className, compact = false }: MetricsDashboardProps) {
  const {
    hoursCompleted,
    hoursRemaining,
    tasksCompleted,
    tasksTotal,
    completionRate,
    currentWeek,
    totalWeeks,
    scheduleStatus,
    daysAhead,
    currentStreak,
    bestStreak,
  } = metrics;

  // Determine schedule display
  const getScheduleDisplay = () => {
    switch (scheduleStatus) {
      case 'ahead':
        return {
          primary: `${daysAhead} days ahead`,
          secondary: `Week ${currentWeek}/${totalWeeks}`,
          iconBgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          accentColor: 'text-emerald-700 dark:text-emerald-400',
        };
      case 'behind':
        return {
          primary: `${Math.abs(daysAhead)} days behind`,
          secondary: `Week ${currentWeek}/${totalWeeks}`,
          iconBgColor: 'bg-amber-100 dark:bg-amber-900/30',
          iconColor: 'text-amber-600 dark:text-amber-400',
          accentColor: 'text-amber-700 dark:text-amber-400',
        };
      case 'at-risk':
        return {
          primary: 'At risk',
          secondary: `Week ${currentWeek}/${totalWeeks}`,
          iconBgColor: 'bg-red-100 dark:bg-red-900/30',
          iconColor: 'text-red-600 dark:text-red-400',
          accentColor: 'text-red-700 dark:text-red-400',
        };
      default:
        return {
          primary: 'On track',
          secondary: `Week ${currentWeek}/${totalWeeks}`,
          iconBgColor: 'bg-blue-100 dark:bg-blue-900/30',
          iconColor: 'text-blue-600 dark:text-blue-400',
          accentColor: 'text-blue-700 dark:text-blue-400',
        };
    }
  };

  const scheduleDisplay = getScheduleDisplay();

  // Metric cards configuration
  const metricCards = [
    {
      icon: <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      iconBgColor: 'bg-blue-100 dark:bg-blue-900/30',
      primary: `${formatHours(hoursCompleted)} done`,
      secondary: `${formatHours(hoursRemaining)} left`,
      accentColor: 'text-blue-700 dark:text-blue-400',
    },
    {
      icon: <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      iconBgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      primary: `${tasksCompleted}/${tasksTotal} tasks`,
      secondary: `${completionRate}% done`,
      accentColor: 'text-emerald-700 dark:text-emerald-400',
    },
    {
      icon: <Calendar className={cn('w-5 h-5', scheduleDisplay.iconColor)} />,
      iconBgColor: scheduleDisplay.iconBgColor,
      primary: scheduleDisplay.primary,
      secondary: scheduleDisplay.secondary,
      accentColor: scheduleDisplay.accentColor,
    },
    {
      icon: <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
      iconBgColor: 'bg-orange-100 dark:bg-orange-900/30',
      primary: currentStreak > 0 ? `${currentStreak} day streak` : 'No streak',
      secondary: bestStreak > 0 ? `Best: ${bestStreak} days` : 'Start today!',
      accentColor: 'text-orange-700 dark:text-orange-400',
    },
  ];

  return (
    <div
      className={cn(
        'grid gap-3',
        compact ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4',
        className
      )}
    >
      {metricCards.map((card, index) => (
        <MetricCard
          key={index}
          icon={card.icon}
          iconBgColor={card.iconBgColor}
          primary={card.primary}
          secondary={card.secondary}
          accentColor={card.accentColor}
          delay={index * 0.05}
        />
      ))}
    </div>
  );
}

export default MetricsDashboard;
