"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star } from 'lucide-react';
import type { Course } from '@prisma/client';
import { useRouter } from 'next/navigation';

interface StickyMiniHeaderProps {
  course: Course & {
    reviews?: { id: string; rating: number }[];
    _count?: { Enrollment?: number; enrollments?: number };
  };
  isEnrolled?: boolean;
}

export const StickyMiniHeader: React.FC<StickyMiniHeaderProps> = ({ course, isEnrolled = false }) => {
  const [visible, setVisible] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const onScroll = () => {
      const threshold = 140;
      setVisible(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Compute quick stats
  const averageRating = course.reviews?.length
    ? (course.reviews.reduce((acc, r) => acc + r.rating, 0) / course.reviews.length).toFixed(1)
    : '0.0';
  const totalReviews = course.reviews?.length ?? 0;

  const handleEnrollClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const el = document.getElementById('enroll-card');
    if (el) {
      const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
      return;
    }

    // Fallback: navigate to checkout if enroll card is not available on page
    try {
      if (course?.id) {
        router.push(`/courses/${course.id}/checkout`);
      }
    } catch {}
  };

  // Hide the mini header if enrolled
  const shouldShow = visible && !isEnrolled;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="hidden md:block fixed left-0 right-0 z-[45] sticky-mini-header top-0"
        >
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm md:backdrop-blur-md supports-[backdrop-filter]:backdrop-blur-sm md:supports-[backdrop-filter]:backdrop-blur-md shadow-lg px-3 py-2">
              {/* Title + Rating */}
              <div className="flex items-center min-w-0 gap-3">
                <div className="truncate font-semibold text-slate-900 dark:text-white max-w-[50vw] md:max-w-[40vw]">
                  {course.title}
                </div>
                <div className="hidden md:flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="font-semibold text-slate-900 dark:text-white">{averageRating}</span>
                  <span className="text-slate-600 dark:text-slate-400">({totalReviews.toLocaleString()})</span>
                </div>
              </div>

              {/* CTA */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEnrollClick}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 active:bg-purple-800 transition-colors"
                >
                  Enroll Now
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
