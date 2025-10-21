"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { CourseReview } from './course-reviews';

interface ReviewRatingHistogramProps {
  reviews: CourseReview[];
  onFilterChange: (rating: number | null) => void;
  selectedFilter: number | null;
}

export const ReviewRatingHistogram = ({
  reviews,
  onFilterChange,
  selectedFilter,
}: ReviewRatingHistogramProps): JSX.Element => {
  // Calculate rating distribution
  const ratingCounts = [0, 0, 0, 0, 0]; // Index 0 = 1 star, Index 4 = 5 stars
  reviews.forEach((review) => {
    if (review.rating >= 1 && review.rating <= 5) {
      ratingCounts[review.rating - 1]++;
    }
  });

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / totalReviews
    : 0;

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl p-6 mb-6">
      {/* Overall Rating */}
      <div className="flex items-start gap-8 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(averageRating)
                    ? 'text-amber-500 dark:text-amber-400 fill-current'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
          </p>
        </div>

        {/* Rating Bars */}
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = ratingCounts[rating - 1];
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            const isSelected = selectedFilter === rating;

            return (
              <motion.button
                key={rating}
                onClick={() => onFilterChange(isSelected ? null : rating)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-3 group ${
                  isSelected ? 'opacity-100' : 'opacity-100 hover:opacity-80'
                } transition-opacity`}
              >
                {/* Star Label */}
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {rating}
                  </span>
                  <Star className="w-4 h-4 text-amber-500 dark:text-amber-400 fill-current" />
                </div>

                {/* Progress Bar */}
                <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, delay: (5 - rating) * 0.1 }}
                    className={`h-full rounded-full ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                        : 'bg-gradient-to-r from-amber-400 to-amber-500'
                    } group-hover:from-amber-500 group-hover:to-orange-500 transition-all`}
                  />
                </div>

                {/* Count */}
                <div className="w-12 text-right">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {count}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Filter Info */}
      {selectedFilter && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2"
        >
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-600 dark:text-amber-400 fill-current" />
            <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
              Showing {selectedFilter}-star reviews
            </span>
          </div>
          <button
            onClick={() => onFilterChange(null)}
            className="text-sm text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 font-medium transition-colors"
          >
            Clear filter
          </button>
        </motion.div>
      )}

      {/* All Reviews Button */}
      {!selectedFilter && totalReviews > 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Click on a rating to filter reviews
          </p>
        </div>
      )}
    </div>
  );
};
