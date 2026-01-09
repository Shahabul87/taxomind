'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Zap,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

interface GoalsStatsProps {
  stats: {
    total: number;
    active: number;
    completed: number;
    avgProgress: number;
  };
}

export function GoalsStats({ stats }: GoalsStatsProps) {
  const statItems = [
    {
      label: 'Total Goals',
      value: stats.total,
      icon: Target,
      color: 'from-slate-500 to-slate-600',
      bgColor: 'bg-slate-100 dark:bg-slate-800',
      textColor: 'text-slate-600 dark:text-slate-300',
    },
    {
      label: 'Active',
      value: stats.active,
      icon: Zap,
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      textColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Completed',
      value: stats.completed,
      icon: CheckCircle2,
      color: 'from-emerald-500 to-green-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Avg Progress',
      value: `${stats.avgProgress}%`,
      icon: TrendingUp,
      color: 'from-violet-500 to-indigo-500',
      bgColor: 'bg-violet-50 dark:bg-violet-900/20',
      textColor: 'text-violet-600 dark:text-violet-400',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-8"
    >
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
          className="group relative overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 p-4 sm:p-5 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300"
        >
          {/* Gradient overlay on hover */}
          <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

          <div className="relative flex items-center gap-3 sm:gap-4">
            <div className={`p-2.5 sm:p-3 rounded-xl ${item.bgColor} transition-transform duration-300 group-hover:scale-110`}>
              <item.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${item.textColor}`} />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                {item.label}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {item.value}
              </p>
            </div>
          </div>

          {/* Decorative corner */}
          <div className={`absolute -bottom-4 -right-4 w-16 h-16 bg-gradient-to-br ${item.color} opacity-5 rounded-full blur-xl`} />
        </motion.div>
      ))}
    </motion.div>
  );
}
