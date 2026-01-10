"use client";

import { motion } from "framer-motion";
import {
  Search,
  Clock,
  RefreshCw,
  Bell,
  Filter,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface NewsCategory {
  name: string;
  value: string;
}

interface ImportanceOption {
  value: string;
  label: string;
}

interface AINewsFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedImportance: string;
  onImportanceChange: (importance: string) => void;
  categories: NewsCategory[];
  importanceOptions: ImportanceOption[];
  lastUpdated: Date;
  isAutoRefresh: boolean;
  onAutoRefreshToggle: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export function AINewsFilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedImportance,
  onImportanceChange,
  categories,
  importanceOptions,
  lastUpdated,
  isAutoRefresh,
  onAutoRefreshToggle,
  onRefresh,
  isLoading
}: AINewsFilterBarProps) {

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 py-4"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">

          {/* Search and Filters */}
          <div className="flex flex-1 flex-col sm:flex-row gap-3 max-w-3xl">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search news, topics, or sources..."
                className="w-full h-11 pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            {/* Category Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 px-4 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl justify-between min-w-[160px] text-slate-700 dark:text-slate-300"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium">
                      {selectedCategory === 'all' ? 'All Categories' : selectedCategory}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg">
                <DropdownMenuItem
                  onClick={() => onCategoryChange('all')}
                  className={cn(
                    "cursor-pointer rounded-lg",
                    selectedCategory === 'all' && "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  )}
                >
                  All Categories
                </DropdownMenuItem>
                {categories.map((category) => (
                  <DropdownMenuItem
                    key={category.value}
                    onClick={() => onCategoryChange(category.name)}
                    className={cn(
                      "cursor-pointer rounded-lg",
                      selectedCategory === category.name && "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    )}
                  >
                    {category.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Importance Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 px-4 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl justify-between min-w-[150px] text-slate-700 dark:text-slate-300"
                >
                  <span className="text-sm font-medium">
                    {importanceOptions.find(o => o.value === selectedImportance)?.label || 'All Importance'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[180px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg">
                {importanceOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => onImportanceChange(option.value)}
                    className={cn(
                      "cursor-pointer rounded-lg",
                      selectedImportance === option.value && "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    )}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Last Updated */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <Clock className="w-4 h-4" />
              <span>{formatTimeAgo(lastUpdated)}</span>
            </div>

            {/* Auto-refresh Toggle */}
            <button
              onClick={onAutoRefreshToggle}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border",
                isAutoRefresh
                  ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              )}
            >
              <span className={cn(
                "w-2 h-2 rounded-full",
                isAutoRefresh ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              )} />
              <span>Auto</span>
            </button>

            {/* Refresh Button */}
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="h-10 px-4 bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl font-medium"
            >
              <RefreshCw className={cn(
                "w-4 h-4 mr-2",
                isLoading && "animate-spin"
              )} />
              {isLoading ? "Loading..." : "Refresh"}
            </Button>

            {/* Alerts Button */}
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-4 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
            >
              <Bell className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
