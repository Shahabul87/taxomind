"use client";

import React, { useMemo } from 'react';

import Image from 'next/image';

import { Course } from '@prisma/client';
import { motion } from 'framer-motion';
import {
  Star,
  Users,
  Clock,
  BarChart3 as BarChart,
  Calendar,
  Award,
  BookOpen,
  Briefcase,
  ChevronRight,
} from 'lucide-react';

import { CourseSocialMediaShare } from '../course-social-media-sharing';

import { PricingDisplay } from './pricing-display';
import { UrgencyTimer } from './urgency-timer';
import { CTAButtonHierarchy } from './cta-button-hierarchy';
import { CourseIncludesList } from './course-includes-list';
import { TrustBadges } from './trust-badges';

interface CourseInfoCardProps {
  course: Course & {
    // existing optional enrichments
    totalHours?: number;
    totalResources?: number;
    totalExercises?: number;
    dealEndDate?: Date | null;
    spotsRemaining?: number | null;
    // commonly included on page
    category?: { name: string } | null;
    reviews?: { id: string; rating: number; createdAt: Date }[];
    chapters?: { id: string }[];
    _count?: { enrollments?: number; Enrollment?: number; chapters?: number };
    whatYouWillLearn?: string[];
  };
  userId?: string;
  isEnrolled?: boolean;
}

export const CourseInfoCard = ({ course, userId, isEnrolled = false }: CourseInfoCardProps): JSX.Element => {
  // Ensure image URL uses HTTPS for Next.js Image component
  const secureImageUrl = course.imageUrl?.replace(/^http:\/\//i, 'https://') ?? '/default-course.jpg';

  // Derived values
  const totalHours = useMemo(() => (course.totalDuration ? Math.floor(course.totalDuration / 60) : undefined), [course.totalDuration]);
  const totalChapters = course._count?.chapters ?? course.chapters?.length ?? undefined;
  const enrollments = course._count?.Enrollment ?? course._count?.enrollments ?? course.activeLearners ?? 0 as any;

  const { averageRating, reviewsCount } = useMemo(() => {
    if (typeof (course as any).averageRating === 'number') {
      return { averageRating: (course as any).averageRating as number, reviewsCount: course.reviews?.length ?? 0 };
    }
    const count = course.reviews?.length ?? 0;
    if (!count) return { averageRating: undefined, reviewsCount: 0 };
    const sum = course.reviews!.reduce((acc, r) => acc + (r.rating || 0), 0);
    return { averageRating: Number((sum / count).toFixed(1)), reviewsCount: count };
  }, [course]);

  const lastUpdated = useMemo(() => new Date(course.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }), [course.updatedAt]);

  const skills = ((course as any).whatYouWillLearn ?? []).filter(Boolean).slice(0, 6) as string[];

  return (
    <motion.div
      id="enroll-card"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6 }}
      className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 h-fit sticky top-20 md:top-24"
    >
      <div className="space-y-6">
        {/* Course Cover with metrics overlay */}
        <div className="relative rounded-xl overflow-hidden">
          <div className="aspect-video relative">
            <Image
              src={secureImageUrl}
              alt={course.title}
              fill
              sizes="(min-width: 1024px) 33vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-2 left-3 right-3 flex flex-wrap items-center gap-2">
            {/* Rating */}
            {typeof averageRating === 'number' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 dark:bg-gray-900/80 text-gray-900 dark:text-gray-100 text-xs font-semibold shadow">
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                {averageRating.toFixed(1)}{reviewsCount ? ` (${reviewsCount})` : ''}
              </span>
            )}
            {/* Enrollments */}
            {enrollments > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 dark:bg-gray-900/80 text-gray-900 dark:text-gray-100 text-xs font-medium shadow">
                <Users className="w-3.5 h-3.5" />
                {Number(enrollments).toLocaleString()} enrolled
              </span>
            )}
            {/* Difficulty */}
            {(course as any).difficulty && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 dark:bg-gray-900/80 text-gray-900 dark:text-gray-100 text-xs font-medium shadow">
                <BarChart className="w-3.5 h-3.5" />
                {(course as any).difficulty}
              </span>
            )}
          </div>
        </div>

        {/* Pricing */}
        <PricingDisplay currentPrice={(course as any).price} originalPrice={(course as any).originalPrice} />

        {/* Urgency Signals */}
        <UrgencyTimer dealEndDate={(course as any).dealEndDate} spotsRemaining={(course as any).spotsRemaining} showFlashSale={false} />

        {/* Primary CTAs */}
        <CTAButtonHierarchy course={course as any} userId={userId} isEnrolled={isEnrolled} />

        {/* Key Facts */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">Quick facts</h3>
          <div className="grid grid-cols-2 gap-3 text-[13px] text-gray-700 dark:text-gray-300">
            {totalHours !== undefined && (
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500" /><span>{totalHours}h total</span></div>
            )}
            {totalChapters !== undefined && (
              <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-500" /><span>{totalChapters} chapters</span></div>
            )}
            {(course as any).difficulty && (
              <div className="flex items-center gap-2"><BarChart className="w-4 h-4 text-purple-500" /><span>{(course as any).difficulty}</span></div>
            )}
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-emerald-600" /><span>Updated {lastUpdated}</span></div>
            {(course as any).category?.name && (
              <div className="flex items-center gap-2"><Award className="w-4 h-4 text-amber-600" /><span>{(course as any).category.name}</span></div>
            )}
            <div className="flex items-center gap-2"><Award className="w-4 h-4 text-emerald-600" /><span>Certificate included</span></div>
          </div>
        </div>

        {/* Skills You'll Gain */}
        {skills.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-900 dark:text-gray-100">Skills you&apos;ll gain</h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((s, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* What’s Included (delivery + resources) */}
        <CourseIncludesList
          totalHours={totalHours}
          totalResources={(course as any).totalResources}
          totalExercises={(course as any).totalExercises}
          hasLifetimeAccess={true}
          hasMobileAccess={true}
          hasCertificate={true}
          hasMoneyBackGuarantee={true}
        />

        {/* Prerequisites (summary) */}
        {(course as any).prerequisites && (
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-3 text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">Prerequisites: </span>
            <span className="line-clamp-2">{(course as any).prerequisites}</span>
          </div>
        )}

        {/* Trust & Policies */}
        <TrustBadges />

        {/* For Teams (Enterprise) */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-md p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">For teams</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Upskill your team with group licensing and analytics.</div>
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 hover:underline"
                onClick={() => {
                  // route hint: replace with actual route when available
                  window.location.href = '/become-instructor';
                }}
              >
                Learn about enterprise <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Social Share */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <CourseSocialMediaShare courseTitle={course.title} />
        </div>
      </div>
    </motion.div>
  );
}; 
