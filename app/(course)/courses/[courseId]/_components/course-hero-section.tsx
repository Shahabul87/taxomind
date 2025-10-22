"use client";

import React from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';

import { Course } from '@prisma/client';
import { cleanHtmlContent } from '../utils/html-utils';
import { HeroBreadcrumb } from './hero-breadcrumb';
import { HeroBadgeSystem } from './hero-badge-system';
import { InstructorMiniProfile } from './instructor-mini-profile';
import { HeroStatsEnhanced } from './hero-stats-enhanced';

interface CourseHeroSectionProps {
  course: Course & {
    category?: { name: string } | null;
    user?: {
      id: string;
      name: string | null;
      image: string | null;
    } | null;
    reviews?: {
      id: string;
      rating: number;
      createdAt: Date;
    }[];
    _count?: {
      enrollments?: number;
      Enrollment?: number;
    };
  };
}

export const CourseHeroSection = ({ course }: CourseHeroSectionProps): JSX.Element => {
  const prefersReducedMotion = useReducedMotion();
  // Calculate average rating
  const averageRating = course.reviews?.length
    ? (course.reviews.reduce((acc, review) => acc + review.rating, 0) / course.reviews.length).toFixed(1)
    : "0.0";

  // Get total reviews count
  const totalReviews = course.reviews?.length ?? 0;

  // Get total enrollments (check both possible count fields)
  const totalEnrollments = course._count?.Enrollment ?? course._count?.enrollments ?? 0;

  // Format last updated date
  const lastUpdated = new Date(course.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Format last updated for badge (Month Year)
  const lastUpdatedBadge = new Date(course.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  });

  // Check course age for "Hot & New" badge
  const courseAge = Date.now() - new Date(course.createdAt).getTime();
  const isHotAndNew = courseAge < 30 * 24 * 60 * 60 * 1000; // Less than 30 days

  // Check if highest rated (rating > 4.7)
  const isHighestRated = Number.parseFloat(averageRating) > 4.7;

  // Check if bestseller (placeholder logic - would need actual category stats)
  const isBestseller = totalEnrollments > 100 && Number.parseFloat(averageRating) > 4.5;

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Courses', href: '/courses' },
    ...(course.category ? [{ label: course.category.name, href: `/courses?category=${course.category.name}` }] : []),
    { label: cleanHtmlContent(course.title), href: '#' },
  ];

  // Calculate total hours (placeholder - totalDuration field doesn't exist in schema yet)
  const totalHours = undefined;

  // Get difficulty level (placeholder - difficulty field doesn't exist in schema yet)
  const difficultyLevel = 'All Levels';

  // Ensure image URL uses HTTPS for Next.js Image component
  const secureImageUrl = course.imageUrl?.replace(/^http:\/\//i, 'https://') ?? '/default-course.jpg';

  return (
    <section
      className="relative w-full min-h-[360px] sm:min-h-[440px] md:min-h-[560px] lg:min-h-[60vh] xl:min-h-[70vh]"
      aria-label="Course overview hero"
    >
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0">
        <Image
          src={secureImageUrl}
          alt={course.title}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70 dark:from-black/60 dark:via-gray-900/50 dark:to-gray-900" />
      </div>

      {/* Course Info Overlay */}
      <div className="absolute inset-0 flex items-end pt-safe-4 pb-safe-12 md:pb-safe-16">
        <motion.div
          className="container mx-auto px-4 sm:px-6 md:px-8 max-w-7xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.6 }}
        >
          {/* Breadcrumb Navigation */}
          <HeroBreadcrumb items={breadcrumbItems} />

          {/* Badge System */}
          <HeroBadgeSystem
            badges={{
              isBestseller,
              isHotAndNew,
              isHighestRated,
              lastUpdated: lastUpdatedBadge,
            }}
          />

          {/* Enhanced Category Badge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.2 }}
            className="inline-flex items-center mb-4 max-w-full"
          >
            <span className="
              px-4 py-2
              rounded-full
              bg-slate-800/80 dark:bg-white/10
              backdrop-blur-sm md:backdrop-blur-md
              border border-slate-700/50 dark:border-white/20
              text-white
              font-medium
              shadow-lg
              shadow-slate-900/30 dark:shadow-purple-500/20
              flex items-center gap-2 truncate max-w-full
            ">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              {course.category?.name ?? 'Category not specified'}
            </span>
          </motion.div>

          {/* Course Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.3 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 max-w-screen-md md:max-w-4xl leading-tight break-words word-break-anywhere hyphens-auto text-balance"
          >
            {cleanHtmlContent(course.title)}
          </motion.h1>

          {/* Instructor Mini Profile */}
          {course.user && (
            <InstructorMiniProfile
              instructor={course.user}
              instructorRating={undefined}
              linkToProfile={true}
            />
          )}

          {/* Enhanced Course Stats */}
          <HeroStatsEnhanced
            stats={{
              averageRating,
              totalReviews,
              totalEnrollments,
              lastUpdated,
              totalHours,
              difficultyLevel: String(difficultyLevel),
              language: 'English',
              hasCertificate: true,
            }}
          />
        </motion.div>
      </div>
    </section>
  );
}; 
