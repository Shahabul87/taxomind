'use client';

import React from 'react';
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
} from 'lucide-react';
import { motion } from 'framer-motion';
import { QuickCreateDropdown } from '@/components/dashboard/quick-create-dropdown';

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
  /** Optional handlers for quick action dropdown */
  quickActionHandlers?: QuickActionHandlers;
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
          className="flex items-center gap-2"
        >
          {/* Quick Create Dropdown */}
          {quickActionHandlers && (
            <QuickCreateDropdown
              handlers={quickActionHandlers}
              variant="icon"
              position="right"
            />
          )}

          {/* Primary Create Goal Button */}
          <Button
            onClick={onCreateClick}
            size="lg"
            className="group relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all duration-300"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <Plus className="w-5 h-5 mr-2" />
            Create Goal
            <Sparkles className="w-4 h-4 ml-2 opacity-70" />
          </Button>
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
