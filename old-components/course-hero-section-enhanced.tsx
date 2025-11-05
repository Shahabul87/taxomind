"use client";

import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import dynamic from 'next/dynamic';

import { Course } from '@prisma/client';
import { cleanHtmlContent } from '../utils/html-utils';
import { getCategoryPalette } from '@/theme_color/color-utils';
import { HeroBreadcrumb } from './hero-breadcrumb';
import { HeroBadgeSystem } from './hero-badge-system';
import { InstructorMiniProfile } from './instructor-mini-profile';
import { AnimatedCounter, AnimatedRatingCounter } from './animated-counter';
import { LiveEnrollmentTicker, EnrollmentSurge } from './live-enrollment-ticker';
import { CoursePreviewModal } from './course-preview-modal';
import { TrustIndicatorsCompact } from './trust-indicators';
import {
  Clock,
  Users,
  Globe,
  BarChart,
  Award,
  Sparkles,
  TrendingUp
} from 'lucide-react';

// Lazy load heavy components
const HeroStatsEnhanced = dynamic(() => import('./hero-stats-enhanced').then(mod => ({ default: mod.HeroStatsEnhanced })), {
  ssr: true,
  loading: () => <div className="h-20 animate-pulse bg-white/5 rounded-lg" />
});

interface CourseHeroSectionEnhancedProps {
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
}

export const CourseHeroSectionEnhanced = ({ course }: CourseHeroSectionEnhancedProps): JSX.Element => {
  const prefersReducedMotion = useReducedMotion();
  const palette = getCategoryPalette(course.category?.name);
  const { scrollY } = useScroll();

  // Parallax transforms
  const backgroundY = useTransform(scrollY, [0, 500], [0, 150]);
  const contentY = useTransform(scrollY, [0, 300], [0, -30]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.8]);

  // Calculate metrics
  const averageRating = course.reviews?.length
    ? Number((course.reviews.reduce((acc, review) => acc + review.rating, 0) / course.reviews.length).toFixed(1))
    : 0;

  const totalReviews = course.reviews?.length ?? 0;
  const totalEnrollments = course._count?.Enrollment ?? course._count?.enrollments ?? 0;

  const lastUpdated = new Date(course.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const lastUpdatedBadge = new Date(course.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  });

  const courseAge = Date.now() - new Date(course.createdAt).getTime();
  const isHotAndNew = courseAge < 30 * 24 * 60 * 60 * 1000;
  const isHighestRated = averageRating > 4.7;
  const isBestseller = totalEnrollments > 100 && averageRating > 4.5;

  const breadcrumbItems = [
    { label: 'Courses', href: '/courses' },
    ...(course.category ? [{ label: course.category.name, href: `/courses?category=${course.category.name}` }] : []),
    { label: cleanHtmlContent(course.title), href: '#' },
  ];

  const totalHours = course.totalDuration && course.totalDuration > 0
    ? Math.floor(course.totalDuration / 60)
    : undefined;

  const difficultyLevel = course.difficulty ?? 'All Levels';

  // Dynamic background animation
  const [gradientRotation, setGradientRotation] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      setGradientRotation(prev => (prev + 1) % 360);
    }, 50);

    return () => clearInterval(interval);
  }, [prefersReducedMotion]);

  return (
    <section
      className="relative w-full min-h-[480px] sm:min-h-[540px] md:min-h-[600px] lg:min-h-[650px] overflow-hidden"
      aria-label="Course overview hero"
      style={{
        ['--hero-primary' as any]: palette.primary,
        ['--hero-secondary' as any]: palette.secondary,
        ['--hero-glow' as any]: palette.glow,
        ['--hero-subtle' as any]: palette.subtle,
      }}
    >
      {/* Enhanced Multi-layer Background */}
      <motion.div
        className="absolute inset-0"
        style={{ y: prefersReducedMotion ? 0 : backgroundY }}
      >
        {/* Base gradient with animation */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />

        {/* Animated mesh gradient */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute -top-32 -left-32 w-[40rem] h-[40rem] rounded-full blur-3xl opacity-40"
            style={{
              background: `radial-gradient(closest-side, var(--hero-primary), transparent 70%)`,
              rotate: gradientRotation
            }}
            animate={prefersReducedMotion ? {} : {
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div
            className="absolute top-1/3 -right-20 w-[32rem] h-[32rem] rounded-full blur-3xl opacity-35"
            style={{
              background: `radial-gradient(closest-side, var(--hero-secondary), transparent 70%)`,
              rotate: -gradientRotation
            }}
            animate={prefersReducedMotion ? {} : {
              scale: [1.2, 1, 1.2],
              x: [0, -30, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div
            className="absolute bottom-0 left-1/3 w-[35rem] h-[35rem] rounded-full blur-3xl opacity-30"
            style={{
              background: `radial-gradient(closest-side, var(--hero-glow), transparent 70%)`,
            }}
            animate={prefersReducedMotion ? {} : {
              scale: [1, 1.1, 1],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>

        {/* Glass morphism layer */}
        <div className="absolute inset-0 backdrop-blur-[2px] bg-white/[0.01]" />

        {/* Enhanced grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px),
              linear-gradient(rgba(255,255,255,.03) 2px, transparent 2px),
              linear-gradient(90deg, rgba(255,255,255,.03) 2px, transparent 2px)
            `,
            backgroundSize: '48px 48px, 48px 48px, 96px 96px, 96px 96px',
          }}
        />

        {/* Noise texture for depth */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' /%3E%3C/svg%3E")`,
          }}
        />

        {/* Gradient fade edges */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-slate-950/50 to-transparent" />
      </motion.div>

      {/* Enhanced Course Content */}
      <motion.div
        className="relative flex items-center min-h-[inherit] py-16 md:py-20 lg:py-24"
        style={{
          y: prefersReducedMotion ? 0 : contentY,
          opacity: prefersReducedMotion ? 1 : opacity
        }}
      >
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <HeroBreadcrumb items={breadcrumbItems} />

          {/* Badge System with Live Ticker */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <HeroBadgeSystem
              badges={{
                isBestseller,
                isHotAndNew,
                isHighestRated,
                lastUpdated: lastUpdatedBadge,
              }}
            />
            <LiveEnrollmentTicker
              initialEnrollments={totalEnrollments}
              courseId={course.id}
            />
          </div>

          {/* Enhanced Category Badge with Animation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.2 }}
            className="inline-flex items-center mb-6 max-w-full"
          >
            <div className="flex flex-wrap items-center gap-3">
              <motion.span
                className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-medium flex items-center gap-2"
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
              >
                <motion.div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: 'var(--hero-secondary)' }}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [1, 0.7, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                {course.category?.name ?? 'Category'}
              </motion.span>

              <motion.span
                className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-white/20 text-white/90 text-sm backdrop-blur-md"
                whileHover={{ scale: 1.05 }}
              >
                <Sparkles className="inline w-4 h-4 mr-1.5 text-yellow-400" />
                Learn smarter — {totalHours ? `${totalHours}h` : 'structured'} journey
              </motion.span>

              <EnrollmentSurge />
            </div>
          </motion.div>

          {/* Enhanced Typography with Fluid Scaling */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.3 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 max-w-screen-lg leading-[1.1] tracking-tight"
            style={{
              fontSize: 'clamp(2.5rem, 5vw + 1rem, 5.5rem)',
              textShadow: '0 2px 20px rgba(0,0,0,0.5)',
            }}
          >
            {cleanHtmlContent(course.title)}
          </motion.h1>

          {/* Instructor with Preview Button */}
          <div className="flex flex-wrap items-center gap-6 mb-8">
            {course.user && (
              <InstructorMiniProfile
                instructor={course.user}
                instructorRating={undefined}
                linkToProfile={true}
              />
            )}

            <CoursePreviewModal
              courseTitle={course.title}
              previewVideoUrl={course.previewVideoUrl ?? undefined}
              courseDuration={course.totalDuration ?? 0}
              totalChapters={0}
              totalStudents={totalEnrollments}
              courseHighlights={[
                "Master core concepts and fundamentals",
                "Build real-world projects",
                "Learn industry best practices",
                "Get lifetime access to course content"
              ]}
            />
          </div>

          {/* Enhanced Stats with Animations */}
          <div className="space-y-6">
            {/* Primary Stats with Animated Counters */}
            <div className="flex flex-wrap items-center gap-6">
              {totalReviews > 0 && averageRating > 0 ? (
                <AnimatedRatingCounter
                  rating={averageRating}
                  totalReviews={totalReviews}
                />
              ) : (
                <motion.div
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/40 backdrop-blur-md"
                  whileHover={{ scale: 1.05 }}
                >
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-semibold text-lg">New Course</span>
                </motion.div>
              )}

              {/* Animated Student Counter */}
              <motion.div
                className="flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
              >
                <Users className="text-purple-400 w-5 h-5" />
                <AnimatedCounter
                  end={totalEnrollments}
                  className="text-white text-lg font-semibold"
                  suffix={` ${totalEnrollments === 1 ? 'student' : 'students'}`}
                />
              </motion.div>

              {/* Certificate Badge */}
              <motion.div
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-400/40 rounded-full backdrop-blur-md"
                whileHover={{ scale: 1.05, backgroundColor: "rgba(16, 185, 129, 0.25)" }}
              >
                <Award className="text-emerald-300 w-4 h-4" />
                <span className="text-emerald-100 text-sm font-medium">
                  Certificate of Completion
                </span>
              </motion.div>
            </div>

            {/* Secondary Stats */}
            <div className="flex flex-wrap items-center gap-5 text-white/80 text-sm">
              {totalHours !== undefined && totalHours > 0 && (
                <motion.div
                  className="flex items-center gap-1.5"
                  whileHover={{ scale: 1.05, color: "rgba(255,255,255,1)" }}
                >
                  <Clock className="w-4 h-4 text-blue-300" />
                  <span>{totalHours} {totalHours === 1 ? 'hour' : 'hours'} total</span>
                </motion.div>
              )}

              {difficultyLevel && (
                <motion.div
                  className="flex items-center gap-1.5"
                  whileHover={{ scale: 1.05, color: "rgba(255,255,255,1)" }}
                >
                  <BarChart className="w-4 h-4 text-indigo-300" />
                  <span>{difficultyLevel}</span>
                </motion.div>
              )}

              <motion.div
                className="flex items-center gap-1.5"
                whileHover={{ scale: 1.05, color: "rgba(255,255,255,1)" }}
              >
                <Globe className="w-4 h-4 text-cyan-300" />
                <span>English</span>
              </motion.div>

              <div className="flex items-center gap-1.5 text-white/60">
                <Clock className="w-4 h-4 text-white/40" />
                <span className="text-white/50">Updated {lastUpdated}</span>
              </div>
            </div>

            {/* Trust Indicators for Mobile */}
            <div className="block lg:hidden">
              <TrustIndicatorsCompact />
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};