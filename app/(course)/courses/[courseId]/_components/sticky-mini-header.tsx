"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Loader2, ChevronLeft } from 'lucide-react';
import type { Course } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';

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
  const [scrollDirection, setScrollDirection] = React.useState<'up' | 'down' | 'idle'>('idle');
  const [lastScrollY, setLastScrollY] = React.useState(0);
  const router = useRouter();

  React.useEffect(() => {
    const threshold = 140;
    const scrollThreshold = 10; // Minimum scroll distance to trigger direction change

    const onScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDiff = currentScrollY - lastScrollY;

      // Determine scroll direction with threshold to avoid jitter
      if (Math.abs(scrollDiff) > scrollThreshold) {
        if (scrollDiff > 0) {
          setScrollDirection('down');
        } else {
          setScrollDirection('up');
        }
        setLastScrollY(currentScrollY);
      }

      // Desktop: always show when past threshold
      // Mobile: show when scrolling UP and past threshold, or at very top
      const isPastThreshold = currentScrollY > threshold;
      const isMobile = window.innerWidth < 768;

      if (isMobile) {
        // On mobile: show when scrolling up OR when near top
        setVisible(isPastThreshold && (scrollDirection === 'up' || currentScrollY < threshold + 50));
      } else {
        // On desktop: always show when past threshold
        setVisible(isPastThreshold);
      }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [lastScrollY, scrollDirection]);

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
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed left-0 right-0 z-[45] sticky-mini-header top-0"
        >
          {/* Mobile Header */}
          <div className="md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-700/50 shadow-lg">
            <div className="flex items-center justify-between gap-2 px-3 py-2.5 safe-area-inset">
              {/* Back Button + Logo */}
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
                    <span>•</span>
                    <span>{totalReviews} reviews</span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={handleEnrollClick}
                disabled={isLoading}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold hover:from-purple-700 hover:to-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
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
                {/* Title + Rating */}
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

                {/* CTA */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleEnrollClick}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold hover:from-purple-700 hover:to-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
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
