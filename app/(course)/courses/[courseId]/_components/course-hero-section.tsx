"use client";

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

import { Course } from '@prisma/client';
import { cleanHtmlContent } from '../utils/html-utils';
import { getCategoryPalette } from '../utils/color-utils';
import { HeroBreadcrumb } from './hero-breadcrumb';
import { HeroBadgeSystem } from './hero-badge-system';
import { InstructorShowcaseEnhanced } from './instructor-showcase-enhanced';
import { HeroStatsEnhanced } from './hero-stats-enhanced';
import { DynamicBackground } from './dynamic-background';
import { TrustIndicatorsCompact } from './trust-indicators';
import { CourseInfoCardProfessional as CourseInfoCard } from './course-info-card-professional';

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
    totalDuration?: number | null;
    difficulty?: string | null;
    previewVideoUrl?: string | null;
  };
  userId?: string;
  isEnrolled?: boolean;
}

export const CourseHeroSection = ({ course, userId, isEnrolled = false }: CourseHeroSectionProps): JSX.Element => {
  const prefersReducedMotion = useReducedMotion();
  const palette = getCategoryPalette(course.category?.name);
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

  // Calculate total hours from totalDuration (in minutes)
  const totalHours = course.totalDuration && course.totalDuration > 0
    ? Math.floor(course.totalDuration / 60)
    : undefined;

  // Get difficulty level from course data
  const difficultyLevel = course.difficulty ?? 'All Levels';

  return (
    <section
      className="relative w-full min-h-[380px] sm:min-h-[480px] md:min-h-[540px] lg:min-h-[600px] overflow-hidden"
      aria-label="Course overview hero"
      style={{
        // Expose palette for children via CSS variables
        ['--hero-primary' as any]: palette.primary,
        ['--hero-secondary' as any]: palette.secondary,
        ['--hero-glow' as any]: palette.glow,
        ['--hero-subtle' as any]: palette.subtle,
      }}
    >
      {/* Dynamic Background System with parallax and animations */}
      <DynamicBackground
        palette={palette}
        enableParallax={true}
        showMesh={true}
        showGrid={true}
        showNoise={true}
      />

      {/* Course Info Content */}
      <div className="relative flex items-center min-h-[inherit] py-12 md:py-16 lg:py-20">
        <motion.div
          className="container mx-auto px-4 md:px-6 lg:px-8"
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

          {/* Smart tagline + Category Badge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.2 }}
            className="inline-flex items-center mb-4 max-w-full"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white font-medium flex items-center gap-2 truncate">
                <div className="w-2 h-2 rounded-full animate-pulse"
                     style={{ backgroundColor: 'var(--hero-secondary)' }} />
                {course.category?.name ?? 'Category not specified'}
              </span>
              <span className="px-3 py-1.5 rounded-full bg-black/20 border border-white/10 text-white/80 text-sm">
                Learn smarter — estimated {totalHours ? `${totalHours}h` : 'time'} guided journey
              </span>
            </div>
          </motion.div>

          {/* Course Title - Enhanced Typography */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.3 }}
            className="
              text-3xl sm:text-4xl md:text-5xl lg:text-6xl
              font-bold
              text-white
              mb-6
              max-w-screen-md md:max-w-4xl
              leading-tight
              tracking-tight
              break-words
              text-balance
            "
            style={{
              textTransform: 'none',
            }}
          >
            {cleanHtmlContent(course.title)}
          </motion.h1>

          {/* Subtitle / short description for context */}
          {course.description && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.35 }}
              className="text-white/80 max-w-screen-md md:max-w-3xl mb-5 clamp-2"
            >
              {cleanHtmlContent(course.description)}
            </motion.p>
          )}

          {/* CTA is handled by the overlay CourseInfoCard on desktop */}

          {/* Enhanced Instructor Showcase with stats and interactions */}
          {course.user && (
            <InstructorShowcaseEnhanced
              instructor={{
                id: course.user.id,
                name: course.user.name,
                image: course.user.image,
                bio: null,
              }}
              stats={{
                rating: Number.parseFloat(averageRating),
                totalReviews,
                totalStudents: totalEnrollments,
                totalCourses: undefined,
              }}
              showQuickBio={false}
              showMessageButton={false}
              showVerifiedBadge={true}
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
              language: (course as any)?.language ?? undefined,
              hasCertificate: true,
            }}
          />

          {/* Compact trust indicators (mobile-first reassurance) */}
          <div className="mt-4 block lg:hidden">
            <TrustIndicatorsCompact />
          </div>
        </motion.div>
      </div>

      {/* Desktop overlay: Course info card anchored within hero */}
      <div className="absolute inset-0 hidden md:block pointer-events-none">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 h-full relative">
          <div className="absolute right-4 md:right-6 lg:right-8 top-28 md:top-24 lg:top-28 w-[360px] lg:w-[400px] pointer-events-auto">
            <CourseInfoCard course={course as any} userId={userId} isEnrolled={isEnrolled} variant="overlay" />
          </div>
        </div>
      </div>
    </section>
  );
};
