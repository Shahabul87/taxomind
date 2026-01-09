'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  Target,
  Plus,
  Sparkles,
  Search,
  BookOpen,
  TrendingUp,
  Award,
} from 'lucide-react';

interface GoalsEmptyStateProps {
  hasGoals: boolean;
  onCreateClick: () => void;
}

export function GoalsEmptyState({ hasGoals, onCreateClick }: GoalsEmptyStateProps) {
  if (hasGoals) {
    // No results from filter/search
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-4"
      >
        <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
          <Search className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          No matching goals
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-center max-w-sm">
          Try adjusting your filters or search query to find what you&apos;re looking for.
        </p>
      </motion.div>
    );
  }

  // No goals at all - show onboarding
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950/50 border border-violet-100 dark:border-slate-700 p-8 sm:p-12"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center text-center">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="relative mb-6"
        >
          <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
            <Target className="w-10 h-10 text-white" />
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
            className="absolute -top-2 -right-2 p-1.5 rounded-lg bg-amber-400 shadow-lg"
          >
            <Sparkles className="w-4 h-4 text-amber-900" />
          </motion.div>
        </motion.div>

        {/* Title & Description */}
        <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">
          Set Your First Learning Goal
        </h3>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mb-8">
          Goals help you stay focused and motivated. SAM will create personalized study plans
          and track your progress along the way.
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 w-full max-w-2xl">
          {[
            {
              icon: BookOpen,
              title: 'Course-Linked',
              description: 'Connect goals to your courses',
            },
            {
              icon: TrendingUp,
              title: 'Track Progress',
              description: 'Visualize your journey',
            },
            {
              icon: Award,
              title: 'Mastery Levels',
              description: 'From novice to expert',
            },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="flex flex-col items-center p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50"
            >
              <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30 mb-2">
                <feature.icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <p className="font-medium text-slate-900 dark:text-white text-sm">{feature.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Button
            onClick={onCreateClick}
            size="lg"
            className="group relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-300 px-8"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Goal
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
