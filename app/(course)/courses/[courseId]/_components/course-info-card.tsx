"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';

import Image from 'next/image';

import { motion, useReducedMotion } from 'framer-motion';
import {
  Clock,
  Calendar,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { throttle } from 'lodash';

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

  // Collapsible sections state
  const [isIncludesExpanded, setIsIncludesExpanded] = useState(true);
  const [isPrerequisitesExpanded, setIsPrerequisitesExpanded] = useState(false);

  // Ensure image URL uses HTTPS for Next.js Image component
  const secureImageUrl = course.imageUrl?.replace(/^http:\/\//i, 'https://') ?? '/default-course.jpg';

  // Derived values with proper error handling
  const totalHours = useMemo(() => {
    if (course.totalDuration && course.totalDuration > 0) {
      return Math.floor(course.totalDuration / 60);
    }
    return course.totalHours ?? undefined;
  }, [course.totalDuration, course.totalHours]);

  const totalChapters = useMemo(() => {
    return course._count?.chapters ?? course.chapters?.length ?? undefined;
  }, [course._count?.chapters, course.chapters?.length]);

  const enrollments = useMemo(() => {
    return course._count?.Enrollment ?? course._count?.enrollments ?? course.activeLearners ?? 0;
  }, [course._count?.Enrollment, course._count?.enrollments, course.activeLearners]);

  const { averageRating, reviewsCount } = useMemo(() => {
    if (typeof course.averageRating === 'number' && course.averageRating > 0) {
      return {
        averageRating: course.averageRating,
        reviewsCount: course.reviews?.length ?? 0
      };
    }
    const reviews = course.reviews ?? [];
    const count = reviews.length;
    if (count === 0) {
      return { averageRating: undefined, reviewsCount: 0 };
    }
    const sum = reviews.reduce((acc, r) => acc + (r.rating ?? 0), 0);
    return {
      averageRating: Number((sum / count).toFixed(1)),
      reviewsCount: count
    };
  }, [course.averageRating, course.reviews]);

  const lastUpdated = useMemo(() => {
    try {
      return new Date(course.updatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
      });
    } catch {
      return 'Recently';
    }
  }, [course.updatedAt]);

  // Throttled analytics handler for better performance
  const handleIntersection = useMemo(
    () => throttle((entries: IntersectionObserverEntry[]) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          if (!impressionFiredRef.current) {
            impressionFiredRef.current = true;
            window.dispatchEvent(
              new CustomEvent('analytics:impression', {
                detail: {
                  id: 'course-info-card',
                  courseId: course.id,
                  price: course.price ?? null,
                  originalPrice: course.originalPrice ?? null,
                  currency: course.currency ?? null
                }
              })
            );
          }
          if (viewStartRef.current === null) {
            viewStartRef.current = performance.now();
          }
        } else {
          if (viewStartRef.current !== null) {
            const delta = performance.now() - viewStartRef.current;
            accumulatedMsRef.current += delta;
            viewStartRef.current = null;
            window.dispatchEvent(
              new CustomEvent('analytics:viewtime', {
                detail: {
                  id: 'course-info-card',
                  courseId: course.id,
                  ms: Math.round(accumulatedMsRef.current)
                }
              })
            );
          }
        }
      }
    }, 250),
    [course.id, course.price, course.originalPrice, course.currency]
  );

  // Fire a one-time impression when the card enters viewport
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof window === 'undefined') return;

    const io = new IntersectionObserver(handleIntersection, { threshold: 0.25 });
    io.observe(el);

    return () => {
      io.disconnect();
      if (viewStartRef.current !== null) {
        const delta = performance.now() - viewStartRef.current;
        const total = accumulatedMsRef.current + delta;
        window.dispatchEvent(
          new CustomEvent('analytics:viewtime', {
            detail: {
              id: 'course-info-card',
              courseId: course.id,
              ms: Math.round(total)
            }
          })
        );
        viewStartRef.current = null;
      }
    };
  }, [handleIntersection, course.id]);

  // Smart animation variants
  const containerVariants = useMemo(() => ({
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
  } as const), [prefersReducedMotion]);

  const itemVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0 },
  } as const), []);

  return (
    <motion.div
      id="enroll-card"
      ref={rootRef}
      initial={prefersReducedMotion ? 'show' : 'hidden'}
      animate="show"
      variants={containerVariants}
      whileHover={prefersReducedMotion ? undefined : { y: -2 }}
      aria-labelledby="course-info-card-title"
      className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 h-fit lg:sticky"
      style={{ top: 'var(--sticky-offset, 4rem)' }}
    >
      <h2 id="course-info-card-title" className="sr-only">Course enrollment and purchase options</h2>
      <motion.div className="space-y-4 sm:space-y-6" variants={containerVariants}>
        {/* Course Cover - Simplified (removed redundant overlay badges) */}
        <motion.div className="relative rounded-xl overflow-hidden" variants={itemVariants}>
          <motion.div
            className="aspect-video relative"
            whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
            transition={{ duration: 0.25 }}
          >
            <Image
              src={secureImageUrl}
              alt={course.title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover"
              priority={false}
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
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

        {/* Key Facts - Improved responsive grid */}
        <motion.div variants={itemVariants} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-5">
          <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">Quick facts</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-gray-300">
            {totalHours !== undefined && totalHours > 0 && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" aria-hidden="true" />
                <span>{totalHours}h total</span>
              </div>
            )}
            {totalChapters !== undefined && totalChapters > 0 && (
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500 flex-shrink-0" aria-hidden="true" />
                <span>{totalChapters} {totalChapters === 1 ? 'chapter' : 'chapters'}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" aria-hidden="true" />
              <span>Updated {lastUpdated}</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600 flex-shrink-0" aria-hidden="true" />
              <span>Certificate included</span>
            </div>
          </div>
        </motion.div>

        {/* What's Included (collapsible for mobile) */}
        <motion.div variants={itemVariants} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <button
            onClick={() => setIsIncludesExpanded(!isIncludesExpanded)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-expanded={isIncludesExpanded}
            aria-controls="course-includes-content"
          >
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">This course includes</h3>
            {isIncludesExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
            )}
          </button>
          {isIncludesExpanded && (
            <motion.div
              id="course-includes-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-4 border-t border-gray-200 dark:border-gray-700"
            >
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
          )}
        </motion.div>

        {/* Prerequisites (collapsible) */}
        {course.prerequisites && (
          <motion.div variants={itemVariants} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setIsPrerequisitesExpanded(!isPrerequisitesExpanded)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-expanded={isPrerequisitesExpanded}
              aria-controls="prerequisites-content"
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Prerequisites</h3>
              {isPrerequisitesExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
              )}
            </button>
            {isPrerequisitesExpanded && (
              <motion.div
                id="prerequisites-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
              >
                {course.prerequisites}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Trust & Policies */}
        <motion.div variants={itemVariants}>
          <TrustBadges averageRating={averageRating} reviewsCount={reviewsCount} />
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
