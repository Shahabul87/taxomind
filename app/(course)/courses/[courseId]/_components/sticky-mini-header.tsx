"use client";

import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Loader2, ChevronLeft } from 'lucide-react';
import type { Course } from '@prisma/client';
import Link from 'next/link';
import Image from 'next/image';
import { useEnrollAction } from '../_hooks/use-enroll-action';
import { Z_LAYERS } from '../_config/z-layers';

interface StickyMiniHeaderProps {
  course: Course & {
    reviews?: { id: string; rating: number }[];
    _count?: { Enrollment?: number; enrollments?: number };
    isFree?: boolean;
  };
  isEnrolled?: boolean;
  userId?: string;
}

export const StickyMiniHeader: React.FC<StickyMiniHeaderProps> = ({ course, isEnrolled = false, userId }) => {
  const [visible, setVisible] = useState(false);
  const lastScrollYRef = useRef(0);
  const scrollDirectionRef = useRef<'up' | 'down' | 'idle'>('idle');
  const isMobileRef = useRef(false);

  const { handleEnroll, isLoading } = useEnrollAction({
    courseId: course.id,
    price: course.price ?? null,
    isFree: course.isFree,
    userId,
  });

  // Track viewport size via matchMedia
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    isMobileRef.current = mql.matches;
    const handler = (e: MediaQueryListEvent) => { isMobileRef.current = e.matches; };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // Scroll listener — registered once
  useEffect(() => {
    const threshold = 140;
    const scrollThreshold = 10;

    const onScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDiff = currentScrollY - lastScrollYRef.current;

      if (Math.abs(scrollDiff) > scrollThreshold) {
        scrollDirectionRef.current = scrollDiff > 0 ? 'down' : 'up';
        lastScrollYRef.current = currentScrollY;
      }

      const isPastThreshold = currentScrollY > threshold;

      if (isMobileRef.current) {
        setVisible(isPastThreshold && (scrollDirectionRef.current === 'up' || currentScrollY < threshold + 50));
      } else {
        setVisible(isPastThreshold);
      }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const averageRating = course.reviews?.length
    ? (course.reviews.reduce((acc, r) => acc + r.rating, 0) / course.reviews.length).toFixed(1)
    : '0.0';
  const totalReviews = course.reviews?.length ?? 0;

  const shouldShow = visible && !isEnrolled;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`fixed left-0 right-0 ${Z_LAYERS.stickyMiniHeader} sticky-mini-header top-0`}
        >
          {/* Mobile Header */}
          <div className="md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-700/50 shadow-lg">
            <div className="flex items-center justify-between gap-2 px-3 py-2.5 safe-area-inset">
              <div className="flex items-center gap-2 min-w-0">
                <Link
                  href="/courses"
                  className="flex-shrink-0 p-1.5 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Back to courses"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </Link>
                <Link href="/" className="flex-shrink-0">
                  <Image
                    src="/taxomind-logo.png"
                    alt="Taxomind"
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {course.title}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span>{averageRating}</span>
                    <span>&bull;</span>
                    <span>{totalReviews} reviews</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleEnroll}
                disabled={isLoading}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold hover:from-purple-700 hover:to-indigo-700 active:scale-95 transition-[background,transform,opacity] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  'Enroll'
                )}
              </button>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:block">
            <div className="container mx-auto px-4 max-w-7xl pt-2">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg px-4 py-2.5">
                <div className="flex items-center min-w-0 gap-3">
                  <Link href="/" className="flex-shrink-0">
                    <Image
                      src="/taxomind-logo.png"
                      alt="Taxomind"
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  </Link>
                  <div className="truncate font-semibold text-slate-900 dark:text-white max-w-[40vw]">
                    {course.title}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-semibold text-slate-900 dark:text-white">{averageRating}</span>
                    <span className="text-slate-600 dark:text-slate-400">({totalReviews.toLocaleString()})</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleEnroll}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 active:scale-95 transition-[background,transform,opacity] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Enroll Now'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
