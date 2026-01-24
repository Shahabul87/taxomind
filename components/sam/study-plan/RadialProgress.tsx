'use client';

/**
 * RadialProgress Component
 *
 * A circular progress gauge showing overall completion with
 * nested rings for different metrics.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckSquare, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RadialProgressProps {
  percentage: number;
  tasksCompleted: number;
  tasksTotal: number;
  hoursCompleted: number;
  streak: number;
  className?: string;
}

export function RadialProgress({
  percentage,
  tasksCompleted,
  tasksTotal,
  hoursCompleted,
  streak,
  className,
}: RadialProgressProps) {
  // SVG parameters
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Inner ring parameters
  const innerRadius = radius - 20;
  const innerCircumference = 2 * Math.PI * innerRadius;
  const taskPercentage = tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0;
  const innerStrokeDashoffset = innerCircumference - (taskPercentage / 100) * innerCircumference;

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {/* Circular Progress */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background circle - outer */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-200 dark:text-slate-700"
          />

          {/* Progress circle - outer (overall progress) */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />

          {/* Background circle - inner */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={innerRadius}
            fill="none"
            stroke="currentColor"
            strokeWidth={8}
            className="text-slate-100 dark:text-slate-800"
          />

          {/* Progress circle - inner (task progress) */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={innerRadius}
            fill="none"
            stroke="url(#taskGradient)"
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={innerCircumference}
            initial={{ strokeDashoffset: innerCircumference }}
            animate={{ strokeDashoffset: innerStrokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          />

          {/* Gradients */}
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
            <linearGradient id="taskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-3xl font-bold text-slate-900 dark:text-white"
          >
            {Math.round(percentage)}%
          </motion.span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {tasksCompleted}/{tasksTotal}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-center gap-4 mt-3">
        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
          <Clock className="w-3.5 h-3.5 text-blue-500" />
          <span className="font-medium">{hoursCompleted}h</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
          <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
          <span className="font-medium">{tasksCompleted}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
          <Flame className="w-3.5 h-3.5 text-orange-500" />
          <span className="font-medium">{streak}d</span>
        </div>
      </div>
    </div>
  );
}

export default RadialProgress;
