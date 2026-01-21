"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Loader2 } from 'lucide-react';
import type { Course } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface StickyMiniHeaderProps {
  course: Course & {
    reviews?: { id: string; rating: number }[];
    _count?: { Enrollment?: number; enrollments?: number };
    isFree?: boolean;
  };
  isEnrolled?: boolean;
}

export const StickyMiniHeader: React.FC<StickyMiniHeaderProps> = ({ course, isEnrolled = false }) => {
  const [visible, setVisible] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
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

  const handleEnrollClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (isLoading) return;
    setIsLoading(true);

    // Check if course is free
    const isFree = course.isFree === true || (course.price ?? 0) === 0;

    if (isFree) {
      // Free course - enroll directly via API
      try {
        toast.loading('Enrolling you in the course...');

        const response = await fetch(`/api/courses/${course.id}/enroll`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          toast.dismiss();
          toast.success('Successfully enrolled! Redirecting to course...');
          setTimeout(() => {
            router.push(`/courses/${course.id}/learn`);
            router.refresh();
          }, 1500);
        } else {
          toast.dismiss();
          toast.error(data.error?.message || 'Failed to enroll');
        }
      } catch (error) {
        toast.dismiss();
        toast.error('An error occurred. Please try again.');
        console.error('[ENROLL_ERROR]', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Paid course - create Stripe checkout session
      try {
        toast.loading('Redirecting to checkout...');

        const response = await fetch(`/api/courses/${course.id}/checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();
        const checkoutUrl = result.data?.url || result.url;

        if (response.ok && checkoutUrl) {
          toast.dismiss();
          window.location.href = checkoutUrl;
        } else {
          toast.dismiss();
          toast.error(result.error?.message || 'Failed to create checkout session. Please try again.');
          setIsLoading(false);
        }
      } catch (error) {
        toast.dismiss();
        toast.error('An error occurred. Please try again.');
        console.error('[CHECKOUT_ERROR]', error);
        setIsLoading(false);
      }
    }
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
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 active:bg-purple-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        </motion.div>
      )}
    </AnimatePresence>
  );
};
