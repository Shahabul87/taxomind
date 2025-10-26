"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { Star, Award, BookOpen, Users, MessageCircle, Check } from 'lucide-react';

interface InstructorShowcaseEnhancedProps {
  instructor: {
    id: string;
    name: string | null;
    image: string | null;
    bio?: string | null;
  };
  stats?: {
    rating?: number;
    totalCourses?: number;
    totalStudents?: number;
    totalReviews?: number;
  };
  showQuickBio?: boolean;
  showMessageButton?: boolean;
  showVerifiedBadge?: boolean;
  linkToProfile?: boolean;
}

/**
 * Enhanced instructor showcase with hover interactions
 * Modern design inspired by MasterClass and Coursera
 */
export const InstructorShowcaseEnhanced = ({
  instructor,
  stats,
  showQuickBio = true,
  showMessageButton = false,
  showVerifiedBadge = true,
  linkToProfile = true,
}: InstructorShowcaseEnhancedProps): JSX.Element => {
  const prefersReducedMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  const [showBioTooltip, setShowBioTooltip] = useState(false);

  const instructorName = instructor.name ?? 'Anonymous Instructor';
  const instructorImage = instructor.image ?? '/default-avatar.png';
  const instructorBio = instructor.bio ?? 'Experienced educator passionate about teaching.';

  const InstructorContent = (
    <motion.div
      className="flex items-start gap-4 group"
      onHoverStart={() => {
        if (!prefersReducedMotion) {
          setIsHovered(true);
        }
      }}
      onHoverEnd={() => {
        setIsHovered(false);
        setShowBioTooltip(false);
      }}
      whileHover={prefersReducedMotion ? undefined : { x: 4 }}
      transition={{ duration: 0.2 }}
    >
      {/* Instructor Avatar with hover zoom */}
      <div className="relative flex-shrink-0">
        <motion.div
          className="relative w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden ring-2 ring-white/20 group-hover:ring-white/40 transition-all duration-300"
          whileHover={prefersReducedMotion ? undefined : { scale: 1.1 }}
          transition={{ duration: 0.3 }}
        >
          <Image
            src={instructorImage}
            alt={instructorName}
            fill
            className="object-cover"
            sizes="80px"
          />
        </motion.div>

        {/* Verified badge with animation */}
        {showVerifiedBadge && (
          <motion.div
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-slate-950"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.2, rotate: 10 }}
          >
            <Check className="w-4 h-4 text-white" aria-hidden="true" />
            <span className="sr-only">Verified instructor</span>
          </motion.div>
        )}
      </div>

      {/* Instructor Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-white/60">Instructor</span>
              {showVerifiedBadge && (
                <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full border border-blue-400/30">
                  Verified
                </span>
              )}
            </div>

            <h3 className="text-xl md:text-2xl font-bold text-white mb-1 group-hover:text-blue-300 transition-colors truncate">
              {instructorName}
            </h3>

            {/* Quick Bio Trigger */}
            {showQuickBio && instructor.bio && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setShowBioTooltip(!showBioTooltip);
                  }}
                  className="text-sm text-white/70 hover:text-white underline-offset-2 hover:underline transition-colors"
                  aria-label="Show instructor bio"
                >
                  View bio
                </button>

                {/* Bio Tooltip */}
                {showBioTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-10 mt-2 p-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 max-w-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                      {instructorBio}
                    </p>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setShowBioTooltip(false);
                      }}
                      className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Close
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Message Button */}
          {showMessageButton && (
            <motion.button
              whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
              className="flex-shrink-0 p-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors"
              aria-label="Message instructor"
            >
              <MessageCircle className="w-5 h-5 text-white" />
            </motion.button>
          )}
        </div>

        {/* Instructor Stats */}
        {stats && (
          <motion.div
            className="flex flex-wrap items-center gap-4 mt-3 text-sm text-white/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {stats.rating !== undefined && stats.rating > 0 && (
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" aria-hidden="true" />
                <span className="font-semibold text-white">{stats.rating.toFixed(1)}</span>
                {stats.totalReviews !== undefined && stats.totalReviews > 0 && (
                  <span className="text-white/60">
                    ({stats.totalReviews.toLocaleString()})
                  </span>
                )}
              </div>
            )}

            {stats.totalCourses !== undefined && stats.totalCourses > 0 && (
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-400" aria-hidden="true" />
                <span>
                  {stats.totalCourses} {stats.totalCourses === 1 ? 'course' : 'courses'}
                </span>
              </div>
            )}

            {stats.totalStudents !== undefined && stats.totalStudents > 0 && (
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-400" aria-hidden="true" />
                <span>{stats.totalStudents.toLocaleString()} students</span>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );

  if (linkToProfile) {
    return (
      <Link
        href={`/instructor/${instructor.id}`}
        className="block no-underline"
        aria-label={`View ${instructorName}&apos;s profile`}
      >
        {InstructorContent}
      </Link>
    );
  }

  return <div>{InstructorContent}</div>;
};
