"use client";

import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Star } from 'lucide-react';

interface InteractiveRatingStarsProps {
  rating: number;
  totalReviews: number;
  /**
   * Show animated fill on hover
   */
  interactive?: boolean;
  /**
   * Size of stars
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Show rating number
   */
  showNumber?: boolean;
  /**
   * Show review count
   */
  showCount?: boolean;
  /**
   * Link to reviews section
   */
  linkToReviews?: boolean;
  className?: string;
}

/**
 * Interactive rating stars with hover animations
 * Fill animation inspired by premium platforms
 */
export const InteractiveRatingStars = ({
  rating,
  totalReviews,
  interactive = true,
  size = 'md',
  showNumber = true,
  showCount = true,
  linkToReviews = true,
  className = '',
}: InteractiveRatingStarsProps): JSX.Element => {
  const prefersReducedMotion = useReducedMotion();
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const textSizeClasses = {
    sm: 'text-base',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const countSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const starSize = sizeClasses[size];
  const textSize = textSizeClasses[size];
  const countSize = countSizeClasses[size];

  const roundedRating = Math.round(rating);
  const displayRating = rating > 0 ? rating.toFixed(1) : '0.0';

  const renderStar = (index: number) => {
    const position = index + 1;
    const isFullyFilled = position <= roundedRating;
    const isHovered = hoveredStar !== null && position <= hoveredStar;
    const shouldFill = isFullyFilled || isHovered;

    return (
      <motion.div
        key={index}
        className="relative cursor-pointer"
        onMouseEnter={() => interactive && !prefersReducedMotion && setHoveredStar(position)}
        onMouseLeave={() => interactive && !prefersReducedMotion && setHoveredStar(null)}
        whileHover={
          interactive && !prefersReducedMotion
            ? { scale: 1.15, rotate: 15 }
            : undefined
        }
        transition={{ duration: 0.2 }}
      >
        <Star
          className={`${starSize} transition-all duration-200 ${
            shouldFill
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-white/30 fill-transparent'
          }`}
          aria-hidden="true"
        />

        {/* Tooltip on hover showing decimal rating */}
        {interactive && isHovered && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: -8 }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900/95 backdrop-blur-md text-white text-xs rounded-md whitespace-nowrap border border-white/10"
          >
            {displayRating} stars
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900/95" />
          </motion.div>
        )}
      </motion.div>
    );
  };

  const content = (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Stars */}
      <div className="flex items-center gap-1" aria-hidden="true">
        {[0, 1, 2, 3, 4].map(renderStar)}
      </div>

      {/* Rating Number */}
      {showNumber && (
        <motion.span
          className={`${textSize} font-bold text-white`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          {displayRating}
        </motion.span>
      )}

      {/* Review Count */}
      {showCount && totalReviews > 0 && (
        <motion.span
          className={`${countSize} text-white/70 hover:text-white transition-colors`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          ({totalReviews.toLocaleString()}{' '}
          {totalReviews === 1 ? 'rating' : 'ratings'})
        </motion.span>
      )}

      {/* Screen reader text */}
      <span className="sr-only">
        Average rating {displayRating} out of 5 based on{' '}
        {totalReviews.toLocaleString()}{' '}
        {totalReviews === 1 ? 'rating' : 'ratings'}
      </span>
    </div>
  );

  if (linkToReviews && totalReviews > 0) {
    return (
      <a
        href="#reviews"
        className="inline-block no-underline hover:opacity-90 transition-opacity"
        aria-label="View course reviews"
      >
        {content}
      </a>
    );
  }

  return content;
};

/**
 * New Course Badge - shown when no ratings exist
 */
export const NewCourseBadge = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }): JSX.Element => {
  const prefersReducedMotion = useReducedMotion();

  const sizeClasses = {
    sm: { badge: 'px-3 py-1.5', icon: 'w-4 h-4', text: 'text-sm' },
    md: { badge: 'px-4 py-2', icon: 'w-5 h-5', text: 'text-base' },
    lg: { badge: 'px-5 py-2.5', icon: 'w-6 h-6', text: 'text-lg' },
  };

  const classes = sizeClasses[size];

  return (
    <motion.div
      className={`inline-flex items-center gap-2 ${classes.badge} rounded-full bg-white/10 border border-white/20 backdrop-blur-md`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <Star className={`${classes.icon} text-blue-400`} aria-hidden="true" />
      <span className={`text-white font-semibold ${classes.text}`}>New Course</span>
    </motion.div>
  );
};
