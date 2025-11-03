"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';

import { Course } from '@prisma/client';
import { cleanHtmlContent } from '../utils/html-utils';
import { getCategoryPalette } from '@/theme_color/color-utils';
import { HeroBreadcrumb } from './hero-breadcrumb';
import { InstructorShowcaseEnhanced } from './instructor-showcase-enhanced';
import { HeroStatsEnhanced } from './hero-stats-enhanced';
import { DynamicBackground } from './dynamic-background';
import { TrustIndicatorsCompact } from './trust-indicators';
import { CourseInfoCardProfessional as CourseInfoCard } from './course-info-card-professional';
import { toast } from 'sonner';

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
  const router = useRouter();
  const palette = getCategoryPalette(course.category?.name);

  const handleEnroll = () => {
    if (!userId) {
      toast.error('Please sign in to enroll in this course');
      router.push('/auth/login');
      return;
    }

    // Navigate to the enrollment or checkout page
    router.push(`/courses/${course.id}/checkout`);
  };
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
      className="relative w-full overflow-hidden"
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
      <div className="relative flex items-center py-12 md:py-16 lg:py-20">
        <motion.div
          className="container mx-auto px-4 md:px-6 lg:px-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.6 }}
        >
          {/* Breadcrumb Navigation */}
          <HeroBreadcrumb items={breadcrumbItems} />

          {/* Course Title - Enhanced Typography */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.3 }}
            className="
              text-3xl sm:text-4xl md:text-5xl lg:text-6xl
              font-bold
              text-white
              capitalize
              mb-6
              max-w-screen-md md:max-w-4xl
              leading-tight
              tracking-tight
              break-words
              text-balance
            "
          >
            {cleanHtmlContent(course.title)}
          </motion.h1>

          {/* Subtitle / short description for context */}
          {course.description && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.35 }}
              className="text-white/90 max-w-screen-md md:max-w-3xl mb-5 clamp-2"
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
              linkToProfile={false}
              isEnrolled={isEnrolled}
              onEnroll={handleEnroll}
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
            isEnrolled={isEnrolled}
            onEnroll={handleEnroll}
          />

          {/* Compact trust indicators (mobile-first reassurance) */}
          <div className="mt-4 block lg:hidden">
            <TrustIndicatorsCompact />
          </div>
        </motion.div>
      </div>

      {/* Desktop overlay: Course info card anchored within hero - TEMPORARILY HIDDEN */}
      {/* <div className="absolute inset-0 hidden md:block pointer-events-none">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 h-full relative">
          <div className="absolute right-4 md:right-6 lg:right-8 top-28 md:top-24 lg:top-28 w-[360px] lg:w-[400px] pointer-events-auto">
            <CourseInfoCard course={course as any} userId={userId} isEnrolled={isEnrolled} variant="overlay" />
          </div>
        </div>
      </div> */}
    </section>
  );
};
