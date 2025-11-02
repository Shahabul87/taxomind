"use client";

import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Play,
  Star,
  Users,
  Clock,
  Award,
  TrendingUp,
  CheckCircle2,
  Globe,
  BookOpen,
  Zap,
  Shield,
  Sparkles
} from 'lucide-react';

import { Course } from '@prisma/client';
import { cleanHtmlContent } from '../utils/html-utils';
import { getCategoryPalette } from '@/theme_color/color-utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CourseHeroProfessionalProps {
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
      chapters?: number;
    };
    totalDuration?: number | null;
    difficulty?: string | null;
    previewVideoUrl?: string | null;
    imageUrl?: string | null;
  };
  onEnroll?: () => void;
  isEnrolled?: boolean;
  userId?: string | null;
}

export const CourseHeroProfessional = ({
  course,
  onEnroll,
  isEnrolled = false,
  userId
}: CourseHeroProfessionalProps): JSX.Element => {
  const prefersReducedMotion = useReducedMotion();
  const palette = getCategoryPalette(course.category?.name);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [activeStudents, setActiveStudents] = useState(0);

  // Calculate metrics
  const averageRating = course.reviews?.length
    ? Number((course.reviews.reduce((acc, review) => acc + review.rating, 0) / course.reviews.length).toFixed(1))
    : 0;

  const totalReviews = course.reviews?.length ?? 0;
  const totalEnrollments = course._count?.Enrollment ?? course._count?.enrollments ?? 0;
  const totalChapters = course._count?.chapters ?? 0;

  const totalHours = course.totalDuration && course.totalDuration > 0
    ? Math.floor(course.totalDuration / 60)
    : 0;

  const difficultyLevel = course.difficulty ?? 'All Levels';

  // Simulate active students
  useEffect(() => {
    const baseActive = Math.floor(totalEnrollments * 0.15); // 15% of total
    const variation = Math.floor(Math.random() * 20) - 10; // ±10 variation
    setActiveStudents(Math.max(1, baseActive + variation));

    const interval = setInterval(() => {
      const variation = Math.floor(Math.random() * 10) - 5; // ±5 variation
      setActiveStudents(prev => Math.max(1, baseActive + variation));
    }, 5000);

    return () => clearInterval(interval);
  }, [totalEnrollments]);

  // Format numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  // Check badges
  const courseAge = Date.now() - new Date(course.createdAt).getTime();
  const isNew = courseAge < 30 * 24 * 60 * 60 * 1000; // Less than 30 days
  const isBestseller = totalEnrollments > 100 && averageRating > 4.5;
  const isTopRated = averageRating >= 4.7;

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Professional Background Pattern */}
      <div className="absolute inset-0">
        {/* Subtle gradient mesh */}
        <div className="absolute inset-0 opacity-30">
          <div
            className="absolute top-0 -left-1/4 w-1/2 h-full blur-3xl"
            style={{
              background: `radial-gradient(ellipse at center, ${palette.primary}20, transparent 70%)`
            }}
          />
          <div
            className="absolute bottom-0 -right-1/4 w-1/2 h-full blur-3xl"
            style={{
              background: `radial-gradient(ellipse at center, ${palette.secondary}15, transparent 70%)`
            }}
          />
        </div>

        {/* Professional grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Main Content Container */}
      <div className="relative container mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[600px] lg:min-h-[700px] py-12 lg:py-20">

          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.6 }}
            className="space-y-6"
          >
            {/* Category & Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium">
                {course.category?.name ?? 'Professional Development'}
              </span>

              {isBestseller && (
                <motion.span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-200 text-sm font-semibold"
                  whileHover={{ scale: 1.05 }}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Bestseller
                </motion.span>
              )}

              {isTopRated && (
                <motion.span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-200 text-sm font-semibold"
                  whileHover={{ scale: 1.05 }}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Top Rated
                </motion.span>
              )}

              {isNew && (
                <motion.span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-200 text-sm font-semibold"
                  whileHover={{ scale: 1.05 }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  New
                </motion.span>
              )}
            </div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
            >
              {cleanHtmlContent(course.title)}
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.2 }}
              className="text-lg text-gray-300 leading-relaxed max-w-2xl"
            >
              {cleanHtmlContent(course.description ?? 'Master the skills needed to excel in your career with this comprehensive course.')}
            </motion.p>

            {/* Key Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.3 }}
              className="flex flex-wrap items-center gap-6 text-white"
            >
              {averageRating > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-lg">{averageRating}</span>
                  </div>
                  <span className="text-gray-400">({formatNumber(totalReviews)} reviews)</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="font-semibold">{formatNumber(totalEnrollments)}</span>
                <span className="text-gray-400">students</span>
              </div>

              {totalHours > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold">{totalHours}h</span>
                  <span className="text-gray-400">total</span>
                </div>
              )}
            </motion.div>

            {/* Instructor Info */}
            {course.user && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: prefersReducedMotion ? 0 : 0.4 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
              >
                <div className="relative">
                  <Image
                    src={course.user.image ?? '/placeholder-avatar.png'}
                    alt={course.user.name ?? 'Instructor'}
                    width={56}
                    height={56}
                    className="rounded-full ring-2 ring-white/20"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Created by</div>
                  <div className="font-semibold text-white">{course.user.name ?? 'Expert Instructor'}</div>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.5 }}
              className="flex flex-wrap items-center gap-4"
            >
              {!isEnrolled ? (
                <Button
                  onClick={onEnroll}
                  size="lg"
                  className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-500/25"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Enroll Now
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-xl shadow-emerald-500/25"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Continue Learning
                </Button>
              )}

              {course.previewVideoUrl && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setIsVideoPlaying(true)}
                  className="px-6 py-6 text-lg border-white/20 text-white hover:bg-white/10"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Watch Preview
                </Button>
              )}
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.6 }}
              className="flex flex-wrap items-center gap-6 pt-4 border-t border-white/10 text-sm text-gray-400"
            >
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Certificate of completion</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                <span>English</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-emerald-400 font-medium">{activeStudents} learning now</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Video/Image Preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.6 }}
            className="relative lg:pl-8"
          >
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl">
              {/* Video Preview Card */}
              <div className="absolute inset-0">
                {course.imageUrl ? (
                  <Image
                    src={course.imageUrl}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center">
                    <BookOpen className="w-20 h-20 text-white/20" />
                  </div>
                )}

                {/* Overlay with play button */}
                {course.previewVideoUrl && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px] transition-all hover:bg-black/50">
                    <motion.button
                      onClick={() => setIsVideoPlaying(true)}
                      className="w-20 h-20 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Play className="w-8 h-8 text-slate-900 ml-1" fill="currentColor" />
                    </motion.button>
                  </div>
                )}
              </div>

              {/* Course Stats Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="grid grid-cols-3 gap-4 text-white">
                  <div>
                    <div className="text-2xl font-bold">{totalChapters}</div>
                    <div className="text-sm text-gray-300">Chapters</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{totalHours}h</div>
                    <div className="text-sm text-gray-300">Duration</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{difficultyLevel}</div>
                    <div className="text-sm text-gray-300">Level</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Stats Cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.8 }}
              className="absolute -bottom-4 -left-4 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl"
            >
              <div className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{averageRating}</div>
                  <div className="text-xs text-gray-300">Rating</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.9 }}
              className="absolute -top-4 -right-4 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl"
            >
              <div className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{formatNumber(totalEnrollments)}</div>
                  <div className="text-xs text-gray-300">Enrolled</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {isVideoPlaying && course.previewVideoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setIsVideoPlaying(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative w-full max-w-4xl aspect-video rounded-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                src={course.previewVideoUrl}
                className="w-full h-full"
                allowFullScreen
              />
              <button
                onClick={() => setIsVideoPlaying(false)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                ×
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};