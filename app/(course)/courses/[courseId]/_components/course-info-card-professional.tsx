"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Calendar,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Users,
  Star,
  Shield,
  Zap,
  TrendingUp,
  CheckCircle2,
  Gift,
  Sparkles,
  Heart,
  Globe,
  Smartphone,
  FileText,
  Video,
  Download,
  Infinity,
  ShieldCheck,
  Trophy,
  Target,
  GraduationCap,
  Briefcase,
  Code2,
  Layers3,
  Cpu,
} from 'lucide-react';
import throttle from 'lodash/throttle';
import { cn } from '@/lib/utils';

import { CourseSocialMediaShare } from '../course-social-media-sharing';
import { PricingDisplay } from './pricing-display';
import { UrgencyTimer } from './urgency-timer';
import { CTAButtonHierarchy } from './cta-button-hierarchy';
import { TrustIndicators } from './trust-indicators';
import type { CourseWithMeta } from './types';

interface CourseInfoCardProfessionalProps {
  course: CourseWithMeta;
  userId?: string;
  isEnrolled?: boolean;
  disableAnalytics?: boolean;
  variant?: 'default' | 'overlay';
}

// Professional color system for light/dark modes
const colorSystem = {
  light: {
    primary: 'from-blue-500 to-indigo-600',
    secondary: 'from-purple-500 to-pink-500',
    success: 'from-emerald-500 to-teal-600',
    warning: 'from-amber-500 to-orange-600',
    gradient: 'bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50',
    cardBg: 'bg-white/95',
    cardBorder: 'border-gray-200/60',
    glassBg: 'bg-white/80 backdrop-blur-xl',
    neomorphShadow: 'shadow-[0_8px_30px_rgb(0,0,0,0.08)]',
    innerShadow: 'shadow-[inset_0_2px_4px_0_rgb(0,0,0,0.03)]',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-600',
    textMuted: 'text-gray-500',
    iconColor: 'text-gray-400',
    hoverBg: 'hover:bg-gray-50/80',
    activeBg: 'active:bg-gray-100/80',
  },
  dark: {
    primary: 'from-blue-400 to-indigo-500',
    secondary: 'from-purple-400 to-pink-400',
    success: 'from-emerald-400 to-teal-500',
    warning: 'from-amber-400 to-orange-500',
    gradient: 'bg-gradient-to-br from-blue-950/30 via-indigo-950/20 to-purple-950/30',
    cardBg: 'bg-gray-900/95',
    cardBorder: 'border-gray-700/60',
    glassBg: 'bg-gray-800/80 backdrop-blur-xl',
    neomorphShadow: 'shadow-[0_8px_30px_rgb(0,0,0,0.3)]',
    innerShadow: 'shadow-[inset_0_2px_4px_0_rgb(255,255,255,0.03)]',
    textPrimary: 'text-gray-100',
    textSecondary: 'text-gray-300',
    textMuted: 'text-gray-400',
    iconColor: 'text-gray-500',
    hoverBg: 'hover:bg-gray-800/80',
    activeBg: 'active:bg-gray-700/80',
  },
};

// Enhanced feature item component
const FeatureItem = ({ icon: Icon, label, value, gradient, delay = 0 }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  gradient: string;
  delay?: number;
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: prefersReducedMotion ? 0 : delay, duration: 0.3 }}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.05, y: -2 }}
      className="group relative"
    >
      <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-lg blur-xl"
           style={{ backgroundImage: `linear-gradient(to right, ${gradient})` }} />
      <div className="relative flex items-center gap-3 p-3 rounded-lg bg-white/5 dark:bg-gray-800/30 backdrop-blur-sm
                      border border-gray-200/20 dark:border-gray-700/30 group-hover:border-gray-300/40 dark:group-hover:border-gray-600/40
                      transition-all duration-300">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
      </div>
    </motion.div>
  );
};

// Enhanced include item with better visual hierarchy
const IncludeItem = ({ icon: Icon, text, isPro = false }: {
  icon: React.ElementType;
  text: string;
  isPro?: boolean;
}) => {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      className="flex items-start gap-3 group"
    >
      <div className={cn(
        "mt-0.5 p-1.5 rounded-lg transition-all duration-300",
        isPro
          ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg group-hover:shadow-amber-500/30"
          : "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md group-hover:shadow-emerald-500/20"
      )}>
        <Icon className="w-3.5 h-3.5 text-white" />
      </div>
      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
        {text}
        {isPro && (
          <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
                           bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm">
            <Sparkles className="w-3 h-3" />
            PRO
          </span>
        )}
      </span>
    </motion.div>
  );
};

export const CourseInfoCardProfessional = ({
  course,
  userId,
  isEnrolled = false,
  disableAnalytics = false,
  variant = 'default'
}: CourseInfoCardProfessionalProps): JSX.Element => {
  const prefersReducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isIncludesExpanded, setIsIncludesExpanded] = useState(true);
  const [isPrerequisitesExpanded, setIsPrerequisitesExpanded] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'includes' | 'instructor'>('overview');

  // Ensure image URL uses HTTPS
  const secureImageUrl = course.imageUrl?.replace(/^http:\/\//i, 'https://') ?? '/default-course.jpg';

  // Derived values
  const totalHours = useMemo(() => {
    if (course.totalDuration && course.totalDuration > 0) {
      return Math.floor(course.totalDuration / 60);
    }
    return course.totalHours ?? 0;
  }, [course.totalDuration, course.totalHours]);

  const totalChapters = course._count?.chapters ?? course.chapters?.length ?? 0;
  const enrollments = course._count?.Enrollment ?? course._count?.enrollments ?? course.activeLearners ?? 0;

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
      return { averageRating: 0, reviewsCount: 0 };
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
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Recently';
    }
  }, [course.updatedAt]);

  const isOverlay = variant === 'overlay';

  return (
    <motion.div
      ref={rootRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "relative max-w-[440px] w-full",
        !isOverlay && "lg:sticky lg:top-20"
      )}
    >
      {/* Premium Glass Card Container */}
      <div className="relative">
        {/* Gradient Background Blur */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10
                        dark:from-blue-400/5 dark:via-purple-400/5 dark:to-pink-400/5
                        blur-3xl rounded-3xl" />

        {/* Main Card */}
        <motion.div
          whileHover={prefersReducedMotion ? undefined : { y: -4 }}
          className={cn(
            "relative overflow-hidden rounded-3xl",
            "bg-white/90 dark:bg-gray-900/90",
            "backdrop-blur-2xl backdrop-saturate-150",
            "border border-gray-200/50 dark:border-gray-700/50",
            "shadow-2xl dark:shadow-[0_20px_70px_-15px_rgba(0,0,0,0.5)]",
            "transition-all duration-500"
          )}
        >
          {/* Premium Header Section */}
          <div className="relative overflow-hidden">
            {/* Course Cover Image */}
            <div className="relative h-52 overflow-hidden">
              <Image
                src={secureImageUrl}
                alt={course.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 440px"
                priority
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

              {/* Floating Badges */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                {course.isFeatured && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold shadow-lg flex items-center gap-1"
                  >
                    <Trophy className="w-3 h-3" />
                    FEATURED
                  </motion.div>
                )}
                {enrollments > 1000 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 text-white text-xs font-bold shadow-lg flex items-center gap-1"
                  >
                    <TrendingUp className="w-3 h-3" />
                    BESTSELLER
                  </motion.div>
                )}
              </div>

              {/* Rating Badge */}
              {averageRating > 0 && (
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-white font-bold">{averageRating}</span>
                    <span className="text-white/80 text-sm">({reviewsCount} reviews)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Premium Pricing Section */}
            <div className="p-6 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/30 dark:to-purple-950/30">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <PricingDisplay
                  currentPrice={course.price ?? null}
                  originalPrice={course.originalPrice ?? null}
                  currency={course.currency ?? undefined}
                />
              </motion.div>

              {/* Urgency Timer */}
              {(course.dealEndDate || course.spotsRemaining) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4"
                >
                  <UrgencyTimer
                    dealEndDate={course.dealEndDate ?? null}
                    spotsRemaining={course.spotsRemaining ?? null}
                  />
                </motion.div>
              )}

              {/* Enhanced CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6"
              >
                <CTAButtonHierarchy
                  course={course}
                  userId={userId}
                  isEnrolled={isEnrolled}
                />
              </motion.div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 pt-2">
            <div className="flex gap-1 p-1 bg-gray-100/80 dark:bg-gray-800/80 rounded-xl">
              {(['overview', 'includes', 'instructor'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-300",
                    selectedTab === tab
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-md"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  )}
                >
                  {tab === 'overview' && 'Overview'}
                  {tab === 'includes' && 'Includes'}
                  {tab === 'instructor' && 'Instructor'}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {selectedTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <FeatureItem
                      icon={Clock}
                      label="Duration"
                      value={`${totalHours}h total`}
                      gradient="from-blue-400 to-cyan-500"
                      delay={0.1}
                    />
                    <FeatureItem
                      icon={BookOpen}
                      label="Content"
                      value={`${totalChapters} chapters`}
                      gradient="from-purple-400 to-pink-500"
                      delay={0.2}
                    />
                    <FeatureItem
                      icon={Users}
                      label="Students"
                      value={enrollments.toLocaleString()}
                      gradient="from-emerald-400 to-teal-500"
                      delay={0.3}
                    />
                    <FeatureItem
                      icon={Calendar}
                      label="Updated"
                      value={lastUpdated}
                      gradient="from-amber-400 to-orange-500"
                      delay={0.4}
                    />
                  </div>

                  {/* Trust Indicators */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="pt-4"
                  >
                    <TrustIndicators
                      successRate={94}
                      moneyBackDays={30}
                      totalStudents={enrollments}
                      rating={averageRating}
                      isVerifiedInstructor={true}
                    />
                  </motion.div>
                </motion.div>
              )}

              {selectedTab === 'includes' && (
                <motion.div
                  key="includes"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="space-y-3">
                    <IncludeItem icon={Video} text={`${totalHours} hours on-demand video`} />
                    <IncludeItem icon={FileText} text={`${course.totalResources ?? 0} downloadable resources`} />
                    <IncludeItem icon={Code2} text={`${course.totalExercises ?? 0} coding exercises`} />
                    <IncludeItem icon={Smartphone} text="Access on mobile and TV" />
                    <IncludeItem icon={Infinity} text="Full lifetime access" />
                    <IncludeItem icon={GraduationCap} text="Certificate of completion" />
                    <IncludeItem icon={ShieldCheck} text="30-day money-back guarantee" isPro />
                    <IncludeItem icon={Briefcase} text="Career guidance & job assistance" isPro />
                  </div>
                </motion.div>
              )}

              {selectedTab === 'instructor' && (
                <motion.div
                  key="instructor"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-50/50 to-purple-50/50
                                  dark:from-blue-950/20 dark:to-purple-950/20 border border-gray-200/30 dark:border-gray-700/30">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                      <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">Expert Instructor</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Industry professional with 10+ years experience</p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <Shield className="w-4 h-4 text-blue-500" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Verified</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="w-4 h-4 text-amber-500" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Top Rated</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Prerequisites Section */}
          {course.prerequisites && (
            <div className="px-6 pb-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/30 dark:border-amber-800/30 overflow-hidden"
              >
                <button
                  onClick={() => setIsPrerequisitesExpanded(!isPrerequisitesExpanded)}
                  className="w-full flex items-center justify-between p-4 hover:bg-amber-100/30 dark:hover:bg-amber-900/20 transition-colors"
                  aria-expanded={isPrerequisitesExpanded}
                >
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <span className="font-medium text-gray-900 dark:text-gray-100">Prerequisites</span>
                  </div>
                  {isPrerequisitesExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                <AnimatePresence>
                  {isPrerequisitesExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-4 pb-4 text-sm text-gray-700 dark:text-gray-300"
                    >
                      {course.prerequisites}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          )}

          {/* Social Sharing Footer */}
          <div className="px-6 pb-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="pt-4 border-t border-gray-200/30 dark:border-gray-700/30"
            >
              <CourseSocialMediaShare courseTitle={course.title} />
            </motion.div>
          </div>

          {/* Premium Badge */}
          <div className="absolute -top-2 -right-2">
            <motion.div
              animate={{ rotate: [0, 5, -5, 5, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-red-500
                         shadow-xl flex items-center justify-center"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};