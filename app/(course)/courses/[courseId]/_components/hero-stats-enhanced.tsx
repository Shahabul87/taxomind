"use client";

import React from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Star, User, Clock, Award, Globe, BarChart } from 'lucide-react';

interface HeroStatsEnhancedProps {
  stats: {
    averageRating: string;
    totalReviews: number;
    totalEnrollments: number;
    lastUpdated: string;
    totalHours?: number;
    difficultyLevel?: string;
    language?: string;
    hasCertificate?: boolean;
  };
}

export const HeroStatsEnhanced = ({ stats }: HeroStatsEnhancedProps): JSX.Element => {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: prefersReducedMotion ? 0 : 0.45, duration: prefersReducedMotion ? 0 : 0.4 }}
      className="space-y-4"
    >
      {/* Primary Stats Row - Rating & Students */}
      <div className="flex flex-wrap items-center gap-6">
        {/* Rating - Primary Emphasis or New Course Badge */}
        {stats.totalReviews > 0 && Number.parseFloat(stats.averageRating) > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((star: number) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(Number.parseFloat(stats.averageRating))
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-400 dark:text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-2xl font-bold text-white">
              {stats.averageRating}
            </span>
            <Link
              href="#reviews"
              className="text-white/80 hover:text-white underline-offset-2 hover:underline text-sm"
              aria-label="View reviews"
            >
              ({stats.totalReviews.toLocaleString()} {stats.totalReviews === 1 ? 'rating' : 'ratings'})
            </Link>
            <span className="sr-only">
              Average rating {stats.averageRating} out of 5 based on {stats.totalReviews.toLocaleString()} {stats.totalReviews === 1 ? 'rating' : 'ratings'}
            </span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/50 dark:border-purple-400/50 backdrop-blur-sm">
            <Star className="w-5 h-5 text-blue-400 dark:text-blue-300" />
            <span className="text-white font-semibold text-lg">New Course</span>
          </div>
        )}

        {/* Students - Secondary Emphasis */}
        <div className="flex items-center gap-2">
          <User className="text-purple-600 dark:text-purple-400 w-5 h-5" />
          <span className="text-white text-lg font-semibold">
            {stats.totalEnrollments.toLocaleString()}
          </span>
          <span className="text-white/70 text-sm">
            {stats.totalEnrollments === 1 ? 'student' : 'students'}
          </span>
        </div>

        {/* Certificate Badge */}
        {stats.hasCertificate && (
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-600/20 dark:bg-emerald-500/20 border border-emerald-600/50 dark:border-emerald-400/50 rounded-full backdrop-blur-sm">
            <Award className="text-emerald-700 dark:text-emerald-300 w-4 h-4" />
            <span className="text-emerald-800 dark:text-emerald-100 text-sm font-medium">
              Certificate of Completion
            </span>
          </div>
        )}
      </div>

      {/* Secondary Stats Row - Course Details */}
      <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
        {/* Total Hours */}
        {stats.totalHours !== undefined && stats.totalHours > 0 && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>
              {stats.totalHours} {stats.totalHours === 1 ? 'hour' : 'hours'} total
            </span>
          </div>
        )}

        {/* Difficulty Level */}
        {stats.difficultyLevel && (
          <div className="flex items-center gap-1.5">
            <BarChart className="w-4 h-4 text-indigo-400" />
            <span>{stats.difficultyLevel}</span>
          </div>
        )}

        {/* Language */}
        {stats.language && (
          <div className="flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>{stats.language}</span>
          </div>
        )}

        {/* Last Updated - Tertiary */}
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-gray-400" />
          <span className="text-white/60">Last updated {stats.lastUpdated}</span>
        </div>
      </div>
    </motion.div>
  );
};
