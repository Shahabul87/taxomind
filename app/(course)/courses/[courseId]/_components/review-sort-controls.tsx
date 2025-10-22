"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { SortAsc, Clock, Star, TrendingUp } from 'lucide-react';

export type SortOption = 'recent' | 'highest' | 'lowest' | 'helpful';

interface ReviewSortControlsProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  reviewCount: number;
}

export const ReviewSortControls = ({
  sortBy,
  onSortChange,
  reviewCount,
}: ReviewSortControlsProps): JSX.Element => {
  const sortOptions: Array<{
    id: SortOption;
    label: string;
    icon: React.ReactNode;
    description: string;
  }> = [
    {
      id: 'recent',
      label: 'Most Recent',
      icon: <Clock className="w-4 h-4" />,
      description: 'Latest reviews first',
    },
    {
      id: 'highest',
      label: 'Highest Rated',
      icon: <Star className="w-4 h-4" />,
      description: '5 stars first',
    },
    {
      id: 'lowest',
      label: 'Lowest Rated',
      icon: <Star className="w-4 h-4" />,
      description: '1 star first',
    },
    {
      id: 'helpful',
      label: 'Most Helpful',
      icon: <TrendingUp className="w-4 h-4" />,
      description: 'Top voted reviews',
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 md:gap-3">
        {/* Sort Label */}
        <div className="flex items-center gap-2">
          <SortAsc className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Sort by:
          </span>
        </div>

        {/* Sort Options */}
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Sort reviews">
          {sortOptions.map((option) => {
            const isActive = sortBy === option.id;
            return (
              <motion.button
                key={option.id}
                onClick={() => onSortChange(option.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  group relative flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium
                  transition-all duration-200
                  ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }
                `}
                role="radio"
                aria-checked={isActive}
                title={option.description}
              >
                <span className={isActive ? 'text-white' : ''} aria-hidden="true">{option.icon}</span>
                <span>{option.label}</span>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {option.description}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Review Count */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing <span className="font-semibold text-gray-900 dark:text-white">{reviewCount}</span>{' '}
          {reviewCount === 1 ? 'review' : 'reviews'}
        </p>
      </div>
    </div>
  );
};
