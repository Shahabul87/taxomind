"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter, X, Calendar, Clock, User, Tag,
  TrendingUp, Star, BarChart, Check, ChevronDown,
  Save, RefreshCw, Search
} from 'lucide-react';

interface FilterOptions {
  dateRange?: 'today' | 'week' | 'month' | 'year' | 'all';
  authors?: string[];
  tags?: string[];
  readingTime?: 'quick' | 'medium' | 'long';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  sortBy?: 'latest' | 'popular' | 'trending' | 'mostCommented';
}

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableAuthors?: string[];
  availableTags?: string[];
  variant?: 'slide' | 'dropdown' | 'inline';
}

export function FilterPanel({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  availableAuthors = [],
  availableTags = [],
  variant = 'slide'
}: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);
  const [expandedSections, setExpandedSections] = useState<string[]>(['dateRange', 'sortBy']);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedFilters, setSavedFilters] = useState<FilterOptions[]>([]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    if (variant === 'slide') {
      onClose();
    }
  };

  const resetFilters = () => {
    const defaultFilters: FilterOptions = {
      dateRange: 'all',
      sortBy: 'latest'
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const saveCurrentFilters = () => {
    setSavedFilters(prev => [...prev, { ...localFilters }]);
  };

  const loadSavedFilter = (savedFilter: FilterOptions) => {
    setLocalFilters(savedFilter);
    onFiltersChange(savedFilter);
  };

  // Count active filters
  const baseCount = Object.keys(localFilters).filter(
    key => localFilters[key as keyof FilterOptions] !== undefined
  ).length;
  const activeFilterCount = baseCount;

  if (variant === 'inline') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Filter className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
              {activeFilterCount > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activeFilterCount} active
                </p>
              )}
            </div>
          </div>

          <button
            onClick={resetFilters}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Reset all
          </button>
        </div>

        {/* Quick Filters */}
        <div className="space-y-4">
          {/* Sort By */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort:</span>
            {['latest', 'popular', 'trending', 'mostCommented'].map((sort) => (
              <button
                key={sort}
                onClick={() => setLocalFilters({ ...localFilters, sortBy: sort as any })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  localFilters.sortBy === sort
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {sort === 'mostCommented' ? 'Most Discussed' :
                 sort.charAt(0).toUpperCase() + sort.slice(1)}
              </button>
            ))}
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Time:</span>
            {['today', 'week', 'month', 'year', 'all'].map((range) => (
              <button
                key={range}
                onClick={() => setLocalFilters({ ...localFilters, dateRange: range as any })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  localFilters.dateRange === range
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {range === 'all' ? 'All Time' :
                 range === 'week' ? 'This Week' :
                 range === 'month' ? 'This Month' :
                 range === 'year' ? 'This Year' :
                 'Today'}
              </button>
            ))}
          </div>

          {/* Reading Time */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Length:</span>
            {['quick', 'medium', 'long'].map((time) => (
              <button
                key={time}
                onClick={() => setLocalFilters({ ...localFilters, readingTime: time as any })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  localFilters.readingTime === time
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Clock className="w-3 h-3 inline mr-1" />
                {time === 'quick' ? '< 5 min' :
                 time === 'medium' ? '5-15 min' :
                 '> 15 min'}
              </button>
            ))}
          </div>
        </div>

        {/* Apply Button */}
        <div className="mt-6 flex gap-2">
          <button
            onClick={applyFilters}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            Apply Filters
          </button>
          <button
            onClick={saveCurrentFilters}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Save className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Slide Panel Variant
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                    <Filter className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Advanced Filters</h2>
                    {activeFilterCount > 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {activeFilterCount} filters active
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Search within filters */}
              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search filters..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            {/* Filter Sections */}
            <div className="p-6 space-y-6">
              

              {/* Date Range */}
              <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
                <button
                  onClick={() => toggleSection('dateRange')}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">Date Range</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${
                    expandedSections.includes('dateRange') ? 'rotate-180' : ''
                  }`} />
                </button>

                <AnimatePresence>
                  {expandedSections.includes('dateRange') && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {['today', 'week', 'month', 'year', 'all'].map((range) => (
                          <button
                            key={range}
                            onClick={() => setLocalFilters({ ...localFilters, dateRange: range as any })}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              localFilters.dateRange === range
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            {range === 'all' ? 'All Time' :
                             range.charAt(0).toUpperCase() + range.slice(1)}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Difficulty */}
              <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
                <button
                  onClick={() => toggleSection('difficulty')}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <BarChart className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">Difficulty</span>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${
                    expandedSections.includes('difficulty') ? 'rotate-180' : ''
                  }`} />
                </button>

                <AnimatePresence>
                  {expandedSections.includes('difficulty') && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 space-y-2">
                        {['beginner', 'intermediate', 'advanced'].map((level) => (
                          <button
                            key={level}
                            onClick={() => setLocalFilters({ ...localFilters, difficulty: level as any })}
                            className={`w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-all ${
                              localFilters.difficulty === level
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                              {localFilters.difficulty === level && <Check className="w-4 h-4" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            {/* Tags */}
            {availableTags.length > 0 && (
              <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map((tag) => {
                      const isSelected = localFilters.tags?.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => {
                            const currentTags = localFilters.tags || [];
                            const newTags = isSelected
                              ? currentTags.filter(t => t !== tag)
                              : [...currentTags, tag];
                            setLocalFilters({ ...localFilters, tags: newTags });
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                        >
                          {tag}
                          {isSelected && <Check className="w-3 h-3 inline ml-1" />}
                        </button>
                      );
                    })}
                  </div>
              </div>
            )}

            {/* Authors */}
            {availableAuthors.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">Authors</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableAuthors.map((author) => {
                    const isSelected = localFilters.authors?.includes(author);
                    return (
                      <button
                        key={author}
                        onClick={() => {
                          const currentAuthors = localFilters.authors || [];
                          const newAuthors = isSelected
                            ? currentAuthors.filter(a => a !== author)
                            : [...currentAuthors, author];
                          setLocalFilters({ ...localFilters, authors: newAuthors });
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {author}
                        {isSelected && <Check className="w-3 h-3 inline ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-6">
              <div className="flex gap-3">
                <button
                  onClick={resetFilters}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 inline mr-2" />
                  Reset
                </button>
                <button
                  onClick={applyFilters}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
