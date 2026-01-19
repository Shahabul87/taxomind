'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuickStatCardProps } from './types';

export function QuickStatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color = 'bg-blue-500',
  trend,
  trendValue,
}: QuickStatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50"
    >
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', color)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-lg font-bold text-slate-900 dark:text-white truncate">
            {value}
          </p>
          {trend && (
            <div
              className={cn(
                'flex items-center gap-0.5 text-xs font-medium',
                trend === 'up' && 'text-green-600 dark:text-green-400',
                trend === 'down' && 'text-red-600 dark:text-red-400',
                trend === 'neutral' && 'text-slate-500'
              )}
            >
              {trend === 'up' && <TrendingUp className="h-3 w-3" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3" />}
              {trend === 'neutral' && <Minus className="h-3 w-3" />}
              {trendValue && <span>{trendValue}</span>}
            </div>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{label}</p>
        {subValue && (
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{subValue}</p>
        )}
      </div>
    </motion.div>
  );
}

export default QuickStatCard;
