"use client";

import React, { useEffect, useMemo, useRef } from 'react';

import Image from 'next/image';

import { motion, useReducedMotion } from 'framer-motion';
import {
  Star,
  Users,
  Clock,
  BarChart3 as BarChart,
  Calendar,
  Award,
  BookOpen,
} from 'lucide-react';

import { CourseSocialMediaShare } from '../course-social-media-sharing';

import { PricingDisplay } from './pricing-display';
import { UrgencyTimer } from './urgency-timer';
import { CTAButtonHierarchy } from './cta-button-hierarchy';
import { CourseIncludesList } from './course-includes-list';
import { TrustBadges } from './trust-badges';
import type { CourseWithMeta } from './types';

interface CourseInfoCardProps {
  course: CourseWithMeta;
  userId?: string;
  isEnrolled?: boolean;
}

export const CourseInfoCard = ({ course, userId, isEnrolled = false }: CourseInfoCardProps): JSX.Element => {
  const prefersReducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const impressionFiredRef = useRef(false);
  const viewStartRef = useRef<number | null>(null);
  const accumulatedMsRef = useRef<number>(0);
  // Ensure image URL uses HTTPS for Next.js Image component
  const secureImageUrl = course.imageUrl?.replace(/^http:\/\//i, 'https://') ?? '/default-course.jpg';

  // Derived values
  const totalHours = useMemo(() => (course.totalDuration ? Math.floor((course.totalDuration || 0) / 60) : course.totalHours ?? undefined), [course.totalDuration, course.totalHours]);
  const totalChapters = course._count?.chapters ?? course.chapters?.length ?? undefined;
  const enrollments = (course._count?.Enrollment ?? course._count?.enrollments ?? course.activeLearners ?? 0) || 0;

  const { averageRating, reviewsCount } = useMemo(() => {
    if (typeof course.averageRating === 'number') {
      return { averageRating: course.averageRating as number, reviewsCount: course.reviews?.length ?? 0 };
    }
    const count = course.reviews?.length ?? 0;
    if (!count) return { averageRating: undefined, reviewsCount: 0 };
    const sum = course.reviews!.reduce((acc, r) => acc + (r.rating || 0), 0);
    return { averageRating: Number((sum / count).toFixed(1)), reviewsCount: count };
  }, [course]);

  const lastUpdated = useMemo(() => new Date(course.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }), [course.updatedAt]);

  // Removed Skills section per request

  // Fire a one-time impression when the card enters viewport
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof window === 'undefined') return;
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          if (!impressionFiredRef.current) {
            impressionFiredRef.current = true;
            window.dispatchEvent(new CustomEvent('analytics:impression', { detail: { id: 'course-info-card', courseId: course.id, price: course.price ?? null, originalPrice: course.originalPrice ?? null, currency: course.currency ?? null } }));
          }
          if (viewStartRef.current == null) {
            viewStartRef.current = performance.now();
          }
        } else {
          if (viewStartRef.current != null) {
            const delta = performance.now() - viewStartRef.current;
            accumulatedMsRef.current += delta;
            viewStartRef.current = null;
            window.dispatchEvent(new CustomEvent('analytics:viewtime', { detail: { id: 'course-info-card', courseId: course.id, ms: Math.round(accumulatedMsRef.current) } }));
          }
        }
      }
    }, { threshold: 0.25 });
    io.observe(el);
    return () => {
      io.disconnect();
      if (viewStartRef.current != null) {
        const delta = performance.now() - viewStartRef.current;
        const total = accumulatedMsRef.current + delta;
        window.dispatchEvent(new CustomEvent('analytics:viewtime', { detail: { id: 'course-info-card', courseId: course.id, ms: Math.round(total) } }));
        viewStartRef.current = null;
      }
    };
  }, []);

  // Smart animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'tween',
        ease: 'easeOut',
        staggerChildren: prefersReducedMotion ? 0 : 0.06,
        delayChildren: prefersReducedMotion ? 0 : 0.15,
      },
    },
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0 },
  } as const;

  return (
    <motion.div
      id="enroll-card"
      ref={rootRef}
      initial={prefersReducedMotion ? 'show' : 'hidden'}
      animate="show"
      variants={containerVariants}
      whileHover={prefersReducedMotion ? undefined : { y: -2 }}
      aria-labelledby="course-info-card-title"
      className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 h-fit md:sticky"
      style={{ top: 'var(--sticky-offset, 6rem)' }}
    >
      <h2 id="course-info-card-title" className="sr-only">Course enrollment and purchase options</h2>
      <motion.div className="space-y-6" variants={containerVariants}>
        {/* Course Cover with metrics overlay */}
        <motion.div className="relative rounded-xl overflow-hidden" variants={itemVariants}>
          <motion.div className="aspect-video relative" whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }} transition={{ duration: 0.25 }}>
            <Image
              src={secureImageUrl}
              alt={course.title}
              fill
              sizes="(min-width: 768px) 33vw, 100vw"
              className="object-cover"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-2 left-3 right-3 flex flex-wrap items-center gap-2">
            {/* Rating */}
            {typeof averageRating === 'number' && (
              <motion.span variants={itemVariants} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 dark:bg-gray-900/80 text-gray-900 dark:text-gray-100 text-xs font-semibold shadow">
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                {averageRating.toFixed(1)}{reviewsCount ? ` (${reviewsCount})` : ''}
              </motion.span>
            )}
            {/* Enrollments */}
            {enrollments > 0 && (
              <motion.span variants={itemVariants} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 dark:bg-gray-900/80 text-gray-900 dark:text-gray-100 text-xs font-medium shadow">
                <Users className="w-3.5 h-3.5" />
                {Number(enrollments).toLocaleString()} enrolled
              </motion.span>
            )}
            {/* Difficulty */}
            {course.difficulty && (
              <motion.span variants={itemVariants} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 dark:bg-gray-900/80 text-gray-900 dark:text-gray-100 text-xs font-medium shadow">
                <BarChart className="w-3.5 h-3.5" />
                {course.difficulty}
              </motion.span>
            )}
          </div>
        </motion.div>

        {/* Pricing */}
        <motion.div variants={itemVariants}>
          <PricingDisplay currentPrice={course.price ?? null} originalPrice={course.originalPrice ?? null} currency={course.currency ?? undefined} compact />
        </motion.div>

        {/* Urgency Signals */}
        <motion.div variants={itemVariants}>
          <UrgencyTimer dealEndDate={course.dealEndDate ?? null} spotsRemaining={course.spotsRemaining ?? null} showFlashSale={false} />
        </motion.div>

        {/* Primary CTAs */}
        <motion.div variants={itemVariants} whileHover={prefersReducedMotion ? undefined : { scale: 1.01 }} transition={{ duration: 0.15 }}>
          <CTAButtonHierarchy course={course} userId={userId} isEnrolled={isEnrolled} />
        </motion.div>

        {/* Key Facts */}
        <motion.div variants={itemVariants} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-5">
          <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">Quick facts</h3>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-3.5 text-sm md:text-base text-gray-700 dark:text-gray-300">
            {totalHours !== undefined && (
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500" aria-hidden="true" /><span>{totalHours}h total</span></div>
            )}
            {totalChapters !== undefined && (
              <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-500" aria-hidden="true" /><span>{totalChapters} chapters</span></div>
            )}
            {course.difficulty && (
              <div className="flex items-center gap-2"><BarChart className="w-4 h-4 text-purple-500" aria-hidden="true" /><span className="break-words word-break-anywhere">{course.difficulty}</span></div>
            )}
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-emerald-600" aria-hidden="true" /><span>Updated {lastUpdated}</span></div>
            {course.category?.name && (
              <div className="flex items-center gap-2"><Award className="w-4 h-4 text-amber-600" aria-hidden="true" /><span className="break-words word-break-anywhere text-balance">{course.category.name}</span></div>
            )}
            <div className="flex items-center gap-2"><Award className="w-4 h-4 text-emerald-600" aria-hidden="true" /><span>Certificate included</span></div>
          </div>
        </motion.div>

        {/* Skills section intentionally removed */}

        {/* What’s Included (delivery + resources) */}
        <motion.div variants={itemVariants}>
          <CourseIncludesList
            totalHours={totalHours}
            totalResources={course.totalResources ?? undefined}
            totalExercises={course.totalExercises ?? undefined}
            hasLifetimeAccess={true}
            hasMobileAccess={true}
            hasCertificate={true}
            hasMoneyBackGuarantee={true}
          />
        </motion.div>

        {/* Prerequisites (summary) */}
        {course.prerequisites && (
          <motion.div variants={itemVariants} className="rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-3 text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">Prerequisites: </span>
            <span className="line-clamp-2">{course.prerequisites}</span>
          </motion.div>
        )}

        {/* Trust & Policies */}
        <motion.div variants={itemVariants}>
          <TrustBadges />
        </motion.div>

        {/* For teams section removed as requested */}

        {/* Social Share */}
        <motion.div variants={itemVariants} className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <CourseSocialMediaShare courseTitle={course.title} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
