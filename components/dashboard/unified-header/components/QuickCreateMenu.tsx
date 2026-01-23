'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  X,
  BookOpen,
  GraduationCap,
  FileText,
  Clock,
  CheckSquare,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QuickActionHandlers {
  onCreateStudyPlan: () => void;
  onCreateCoursePlan: () => void;
  onCreateBlogPlan: () => void;
  onScheduleSession: () => void;
  onAddTodo: () => void;
  onSetGoal: () => void;
}

interface QuickCreateMenuProps {
  handlers?: QuickActionHandlers;
  className?: string;
}

interface QuickAction {
  icon: React.ElementType;
  label: string;
  description: string;
  gradient: string;
  onClick: () => void;
}

export function QuickCreateMenu({ handlers, className }: QuickCreateMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const quickActions: QuickAction[] = [
    {
      icon: BookOpen,
      label: 'Create Study Plan',
      description: 'AI-powered learning schedule',
      gradient: 'from-blue-500 to-indigo-500',
      onClick: () => {
        setIsOpen(false);
        handlers?.onCreateStudyPlan();
      },
    },
    {
      icon: GraduationCap,
      label: 'Create Course Plan',
      description: 'Plan your course structure',
      gradient: 'from-indigo-500 to-violet-500',
      onClick: () => {
        setIsOpen(false);
        handlers?.onCreateCoursePlan();
      },
    },
    {
      icon: FileText,
      label: 'Create Blog Plan',
      description: 'Organize your blog content',
      gradient: 'from-cyan-500 to-blue-500',
      onClick: () => {
        setIsOpen(false);
        handlers?.onCreateBlogPlan();
      },
    },
    {
      icon: Clock,
      label: 'Schedule Session',
      description: 'Sync with Google Calendar',
      gradient: 'from-emerald-500 to-teal-500',
      onClick: () => {
        setIsOpen(false);
        handlers?.onScheduleSession();
      },
    },
    {
      icon: CheckSquare,
      label: 'Add Todo',
      description: 'Quick task management',
      gradient: 'from-purple-500 to-pink-500',
      onClick: () => {
        setIsOpen(false);
        handlers?.onAddTodo();
      },
    },
    {
      icon: Target,
      label: 'Set Goal',
      description: 'Track your progress',
      gradient: 'from-orange-500 to-red-500',
      onClick: () => {
        setIsOpen(false);
        handlers?.onSetGoal();
      },
    },
  ];

  return (
    <div className={cn('relative', className)}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'p-2 rounded-lg transition-all duration-200',
          'bg-gradient-to-r from-blue-500 to-indigo-500',
          'hover:from-blue-600 hover:to-indigo-600',
          'text-white shadow-md shadow-blue-500/25',
          'border border-blue-400/50'
        )}
        aria-label="Quick Create"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <Plus className="h-4 w-4" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-20 sm:top-auto mt-0 sm:mt-2 w-auto sm:w-80 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm shadow-xl z-50"
              role="menu"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Quick Create
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <motion.button
                        key={action.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={action.onClick}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-xl',
                          'bg-slate-50 dark:bg-slate-700/50',
                          'hover:bg-slate-100 dark:hover:bg-slate-700',
                          'transition-all duration-200',
                          'border border-transparent hover:border-slate-200 dark:hover:border-slate-600'
                        )}
                        role="menuitem"
                      >
                        <div
                          className={cn(
                            'p-2 rounded-lg bg-gradient-to-r',
                            action.gradient
                          )}
                        >
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {action.label}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {action.description}
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
