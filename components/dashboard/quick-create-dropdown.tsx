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

export interface QuickAction {
  icon: React.ElementType;
  label: string;
  description: string;
  gradient: string;
  onClick: () => void;
}

export interface QuickCreateDropdownProps {
  /** Handler callbacks for each quick action */
  handlers: {
    onCreateStudyPlan?: () => void;
    onCreateCoursePlan?: () => void;
    onCreateBlogPlan?: () => void;
    onScheduleSession?: () => void;
    onAddTodo?: () => void;
    onSetGoal?: () => void;
  };
  /** Visual variant of the trigger button */
  variant?: 'default' | 'icon' | 'minimal';
  /** Additional className for the trigger button */
  className?: string;
  /** Position of dropdown relative to trigger */
  position?: 'left' | 'right';
  /** Whether to show as full-width on mobile */
  mobileFullWidth?: boolean;
}

/**
 * QuickCreateDropdown - A reusable dropdown component for quick actions
 *
 * Features:
 * - 6 quick action items with gradient icons
 * - Animated dropdown with staggered item animations
 * - Responsive design (full-width on mobile, fixed width on desktop)
 * - Multiple visual variants
 *
 * @example
 * ```tsx
 * <QuickCreateDropdown
 *   handlers={{
 *     onCreateStudyPlan: () => setShowStudyPlanModal(true),
 *     onSetGoal: () => setShowGoalDialog(true),
 *   }}
 *   variant="icon"
 * />
 * ```
 */
export function QuickCreateDropdown({
  handlers,
  variant = 'default',
  className,
  position = 'right',
  mobileFullWidth = true,
}: QuickCreateDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Define quick actions with their handlers
  const quickActions: QuickAction[] = [
    {
      icon: BookOpen,
      label: 'Create Study Plan',
      description: 'AI-powered learning schedule',
      gradient: 'from-blue-500 to-indigo-500',
      onClick: () => {
        setIsOpen(false);
        handlers.onCreateStudyPlan?.();
      },
    },
    {
      icon: GraduationCap,
      label: 'Create Course Plan',
      description: 'Plan your course structure',
      gradient: 'from-indigo-500 to-violet-500',
      onClick: () => {
        setIsOpen(false);
        handlers.onCreateCoursePlan?.();
      },
    },
    {
      icon: FileText,
      label: 'Create Blog Plan',
      description: 'Organize your blog content',
      gradient: 'from-cyan-500 to-blue-500',
      onClick: () => {
        setIsOpen(false);
        handlers.onCreateBlogPlan?.();
      },
    },
    {
      icon: Clock,
      label: 'Schedule Session',
      description: 'Sync with Google Calendar',
      gradient: 'from-emerald-500 to-teal-500',
      onClick: () => {
        setIsOpen(false);
        handlers.onScheduleSession?.();
      },
    },
    {
      icon: CheckSquare,
      label: 'Add Todo',
      description: 'Quick task management',
      gradient: 'from-purple-500 to-pink-500',
      onClick: () => {
        setIsOpen(false);
        handlers.onAddTodo?.();
      },
    },
    {
      icon: Target,
      label: 'Set Goal',
      description: 'Track your progress',
      gradient: 'from-orange-500 to-red-500',
      onClick: () => {
        setIsOpen(false);
        handlers.onSetGoal?.();
      },
    },
  ];

  // Filter out actions without handlers
  const availableActions = quickActions.filter((action) => {
    const handlerKey = `on${action.label.replace(/\s/g, '')}` as keyof typeof handlers;
    // Check if handler exists by matching action label to handler name
    if (action.label === 'Create Study Plan') return !!handlers.onCreateStudyPlan;
    if (action.label === 'Create Course Plan') return !!handlers.onCreateCoursePlan;
    if (action.label === 'Create Blog Plan') return !!handlers.onCreateBlogPlan;
    if (action.label === 'Schedule Session') return !!handlers.onScheduleSession;
    if (action.label === 'Add Todo') return !!handlers.onAddTodo;
    if (action.label === 'Set Goal') return !!handlers.onSetGoal;
    return false;
  });

  // If no handlers provided, don&apos;t render
  if (availableActions.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'transition-all duration-200',
          variant === 'default' && [
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-blue-50 dark:bg-blue-500/10',
            'hover:bg-blue-100 dark:hover:bg-blue-500/20',
            'text-blue-600 dark:text-blue-400',
            'font-medium text-sm',
          ],
          variant === 'icon' && [
            'p-2 rounded-lg',
            'bg-blue-50 dark:bg-blue-500/10',
            'hover:bg-blue-100 dark:hover:bg-blue-500/20',
            'text-blue-600 dark:text-blue-400',
          ],
          variant === 'minimal' && [
            'p-2 rounded-lg',
            'hover:bg-slate-100 dark:hover:bg-slate-700',
            'text-slate-600 dark:text-slate-400',
          ],
          className
        )}
        aria-label="Quick Create"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <Plus className="h-5 w-5" />
        {variant === 'default' && <span>Create</span>}
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for closing on mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 sm:hidden"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'z-50',
                mobileFullWidth
                  ? 'fixed left-4 right-4 top-20 sm:absolute sm:left-auto sm:top-auto mt-0 sm:mt-2 w-auto sm:w-80'
                  : 'absolute mt-2 w-80',
                position === 'left' && 'sm:left-0 sm:right-auto',
                position === 'right' && 'sm:right-0 sm:left-auto',
                'rounded-2xl',
                'border border-slate-200/50 dark:border-slate-700/50',
                'bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm',
                'shadow-xl'
              )}
              role="menu"
              aria-orientation="vertical"
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Quick Create
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                  </button>
                </div>

                {/* Action Items */}
                <div className="space-y-2">
                  {availableActions.map((action, index) => {
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

/**
 * Default quick action handlers configuration
 * Use this as a template for implementing handlers
 */
export const defaultQuickActionHandlers = {
  onCreateStudyPlan: undefined as (() => void) | undefined,
  onCreateCoursePlan: undefined as (() => void) | undefined,
  onCreateBlogPlan: undefined as (() => void) | undefined,
  onScheduleSession: undefined as (() => void) | undefined,
  onAddTodo: undefined as (() => void) | undefined,
  onSetGoal: undefined as (() => void) | undefined,
};
