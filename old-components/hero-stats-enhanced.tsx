"use client";

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { User, Clock, Award, Globe, BarChart, MessageSquare } from 'lucide-react';
import { InteractiveRatingStars, NewCourseBadge } from './interactive-rating-stars';
import { AnimatedStatCard } from './animated-stat-counter';
import { colorPalette } from '../utils/design-tokens';
import { Button } from '@/components/ui/button';

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
  isEnrolled?: boolean;
  onEnroll?: () => void;
}

export const HeroStatsEnhanced = ({ stats, isEnrolled, onEnroll }: HeroStatsEnhancedProps): JSX.Element => {
  const prefersReducedMotion = useReducedMotion();
  const rating = Number.parseFloat(stats.averageRating);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: prefersReducedMotion ? 0 : 0.45, duration: prefersReducedMotion ? 0 : 0.4 }}
      className="space-y-6"
    >
      {/* Primary Stats Row - Rating & Animated Students */}
      <div className="flex flex-wrap items-center gap-8">
        {/* Interactive Rating Stars or Enroll Now Button */}
        {stats.totalReviews > 0 && rating > 0 ? (
          <InteractiveRatingStars
            rating={rating}
            totalReviews={stats.totalReviews}
            interactive={true}
            size="md"
            showNumber={true}
            showCount={true}
            linkToReviews={true}
          />
        ) : !isEnrolled && onEnroll ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              onClick={onEnroll}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              Enroll Now
            </Button>
          </motion.div>
        ) : (
          <NewCourseBadge size="md" />
        )}

        {/* Animated Student Count */}
        <AnimatedStatCard
          icon={<User className="w-6 h-6" />}
          value={stats.totalEnrollments}
          label={stats.totalEnrollments === 1 ? 'student' : 'students'}
          suffix=""
          accentColor={colorPalette.accent.success}
          delay={0.2}
        />

        {/* Animated Reviews Count */}
        <AnimatedStatCard
          icon={<MessageSquare className="w-6 h-6" />}
          value={stats.totalReviews}
          label={stats.totalReviews === 1 ? 'review' : 'reviews'}
          suffix=""
          accentColor={colorPalette.accent.info}
          delay={0.25}
        />

        {/* Certificate Badge with animation */}
        {stats.hasCertificate && (
          <motion.div
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-400/40 rounded-full backdrop-blur-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
            transition={{ delay: 0.3, duration: 0.2 }}
          >
            <Award className="text-emerald-300 w-4 h-4" aria-hidden="true" />
            <span className="text-emerald-100 text-sm font-medium">
              Certificate of Completion
            </span>
          </motion.div>
        )}
      </div>

      {/* Secondary Stats Row - Course Details with staggered animation */}
      <motion.div
        className="flex flex-wrap items-center gap-4 text-white/70 text-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: prefersReducedMotion ? 0 : 0.5 }}
      >
        {/* Total Hours */}
        {stats.totalHours !== undefined && stats.totalHours > 0 && (
          <motion.div
            className="flex items-center gap-1.5 group cursor-default"
            whileHover={prefersReducedMotion ? undefined : { x: 2 }}
            transition={{ duration: 0.2 }}
          >
            <Clock className="w-4 h-4 text-blue-300 group-hover:text-blue-200 transition-colors" aria-hidden="true" />
            <span className="group-hover:text-white transition-colors">
              {stats.totalHours} {stats.totalHours === 1 ? 'hour' : 'hours'} total
            </span>
          </motion.div>
        )}

        {/* Difficulty Level */}
        {stats.difficultyLevel && (
          <motion.div
            className="flex items-center gap-1.5 group cursor-default"
            whileHover={prefersReducedMotion ? undefined : { x: 2 }}
            transition={{ duration: 0.2 }}
          >
            <BarChart className="w-4 h-4 text-indigo-300 group-hover:text-indigo-200 transition-colors" aria-hidden="true" />
            <span className="group-hover:text-white transition-colors">{stats.difficultyLevel}</span>
          </motion.div>
        )}

        {/* Language */}
        {stats.language && (
          <motion.div
            className="flex items-center gap-1.5 group cursor-default"
            whileHover={prefersReducedMotion ? undefined : { x: 2 }}
            transition={{ duration: 0.2 }}
          >
            <Globe className="w-4 h-4 text-cyan-300 group-hover:text-cyan-200 transition-colors" aria-hidden="true" />
            <span className="group-hover:text-white transition-colors">{stats.language}</span>
          </motion.div>
        )}

        {/* Last Updated - Tertiary */}
        <motion.div
          className="flex items-center gap-1.5 group cursor-default"
          whileHover={prefersReducedMotion ? undefined : { x: 2 }}
          transition={{ duration: 0.2 }}
        >
          <Clock className="w-4 h-4 text-white/40 group-hover:text-white/50 transition-colors" aria-hidden="true" />
          <span className="text-white/50 group-hover:text-white/60 transition-colors">Last updated {stats.lastUpdated}</span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
