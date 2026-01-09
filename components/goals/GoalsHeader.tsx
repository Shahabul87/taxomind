'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Sparkles,
  Target,
  BookOpen,
  GraduationCap,
  FileText,
  Clock,
  CheckSquare,
  ChevronDown,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface QuickActionHandlers {
  onCreateStudyPlan?: () => void;
  onCreateCoursePlan?: () => void;
  onCreateBlogPlan?: () => void;
  onScheduleSession?: () => void;
  onAddTodo?: () => void;
  onSetGoal?: () => void;
}

interface GoalsHeaderProps {
  onCreateClick: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterStatus: string;
  onFilterChange: (status: 'all' | 'active' | 'completed' | 'paused' | 'draft') => void;
  sortBy: string;
  onSortChange: (sort: 'newest' | 'oldest' | 'priority' | 'progress' | 'deadline') => void;
  quickActionHandlers?: QuickActionHandlers;
}

interface QuickAction {
  icon: React.ElementType;
  label: string;
  description: string;
  gradient: string;
  hoverGradient: string;
  onClick: () => void;
  isPrimary?: boolean;
}

export function GoalsHeader({
  onCreateClick,
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterChange,
  sortBy,
  onSortChange,
  quickActionHandlers,
}: GoalsHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Quick action items - same pattern as smart-header
  const quickActions: QuickAction[] = [
    {
      icon: Target,
      label: 'Set Goal',
      description: 'Track your learning progress',
      gradient: 'from-orange-500 to-red-500',
      hoverGradient: 'hover:from-orange-50 hover:to-red-50 dark:hover:from-orange-950/30 dark:hover:to-red-950/30',
      isPrimary: true,
      onClick: () => {
        setIsDropdownOpen(false);
        if (quickActionHandlers?.onSetGoal) {
          quickActionHandlers.onSetGoal();
        } else {
          onCreateClick();
        }
      },
    },
    {
      icon: BookOpen,
      label: 'Study Plan',
      description: 'AI-powered learning schedule',
      gradient: 'from-blue-500 to-indigo-500',
      hoverGradient: 'hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950/30 dark:hover:to-indigo-950/30',
      onClick: () => {
        setIsDropdownOpen(false);
        quickActionHandlers?.onCreateStudyPlan?.();
      },
    },
    {
      icon: GraduationCap,
      label: 'Course Plan',
      description: 'Plan your course structure',
      gradient: 'from-indigo-500 to-violet-500',
      hoverGradient: 'hover:from-indigo-50 hover:to-violet-50 dark:hover:from-indigo-950/30 dark:hover:to-violet-950/30',
      onClick: () => {
        setIsDropdownOpen(false);
        quickActionHandlers?.onCreateCoursePlan?.();
      },
    },
    {
      icon: FileText,
      label: 'Blog Plan',
      description: 'Organize your blog content',
      gradient: 'from-cyan-500 to-blue-500',
      hoverGradient: 'hover:from-cyan-50 hover:to-blue-50 dark:hover:from-cyan-950/30 dark:hover:to-blue-950/30',
      onClick: () => {
        setIsDropdownOpen(false);
        quickActionHandlers?.onCreateBlogPlan?.();
      },
    },
    {
      icon: Clock,
      label: 'Schedule Session',
      description: 'Sync with Google Calendar',
      gradient: 'from-emerald-500 to-teal-500',
      hoverGradient: 'hover:from-emerald-50 hover:to-teal-50 dark:hover:from-emerald-950/30 dark:hover:to-teal-950/30',
      onClick: () => {
        setIsDropdownOpen(false);
        quickActionHandlers?.onScheduleSession?.();
      },
    },
    {
      icon: CheckSquare,
      label: 'Add Todo',
      description: 'Quick task management',
      gradient: 'from-purple-500 to-pink-500',
      hoverGradient: 'hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-950/30 dark:hover:to-pink-950/30',
      onClick: () => {
        setIsDropdownOpen(false);
        quickActionHandlers?.onAddTodo?.();
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
              <Target className="w-6 h-6 text-white" />
            </div>
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
              AI-Powered Goals
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-slate-900 via-violet-900 to-indigo-900 dark:from-white dark:via-violet-200 dark:to-indigo-200 bg-clip-text text-transparent">
              Learning Goals
            </span>
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-xl">
            Set ambitious learning objectives and let SAM guide you to mastery with personalized study plans.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative"
          ref={dropdownRef}
        >
          {/* Create Goal Dropdown Button */}
          <Button
            size="lg"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="group relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-300"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <Plus className="w-5 h-5 mr-2" />
            Create
            <ChevronDown className={cn("w-4 h-4 ml-2 transition-transform", isDropdownOpen && "rotate-180")} />
          </Button>

          {/* Custom Dropdown Menu */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-800 shadow-xl z-50 overflow-hidden"
              >
                <div className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Quick Create
                    </h3>
                    <button
                      onClick={() => setIsDropdownOpen(false)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4 text-slate-400" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    {quickActions.map((action, index) => {
                      const Icon = action.icon;
                      return (
                        <React.Fragment key={action.label}>
                          {index === 1 && (
                            <div className="my-2 border-t border-slate-200 dark:border-slate-700" />
                          )}
                          <motion.button
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={action.onClick}
                            className={cn(
                              'w-full flex items-center gap-3 p-3 rounded-lg',
                              'transition-all duration-200',
                              'hover:bg-gradient-to-r',
                              action.hoverGradient
                            )}
                          >
                            <div className={cn('p-2 rounded-lg bg-gradient-to-br text-white', action.gradient)}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 text-left">
                              <div className="font-medium text-slate-900 dark:text-white text-sm">
                                {action.label}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {action.description}
                              </div>
                            </div>
                            {action.isPrimary && (
                              <Sparkles className="w-4 h-4 text-orange-500" />
                            )}
                          </motion.button>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search goals..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
          />
        </div>

        {/* Filter by Status */}
        <Select value={filterStatus} onValueChange={onFilterChange}>
          <SelectTrigger className="w-full sm:w-[160px] bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-full sm:w-[160px] bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="progress">Progress</SelectItem>
            <SelectItem value="deadline">Deadline</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>
    </div>
  );
}
