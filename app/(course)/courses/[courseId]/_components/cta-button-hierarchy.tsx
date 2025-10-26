"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Loader2, Heart, Play } from 'lucide-react';
import { toast } from 'sonner';

import { Course } from '@prisma/client';

interface CTAButtonHierarchyProps {
  course: Course;
  userId?: string;
  isEnrolled?: boolean;
}

export const CTAButtonHierarchy = ({
  course,
  userId,
  isEnrolled = false,
}: CTAButtonHierarchyProps): JSX.Element => {
  const [isLoading, setIsLoading] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const router = useRouter();

  const handleEnroll = async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics:click', { detail: { id: isEnrolled ? 'cta-go-to-course' : 'cta-enroll-now', courseId: course.id, price: course.price ?? null } }));
    }
    try {
      if (!userId) {
        router.push(`/auth/login?callbackUrl=/courses/${course.id}`);
        return;
      }

      setIsLoading(true);

      if (!course.price || course.price === 0) {
        await axios.post(`/api/courses/${course.id}/enroll`);
        toast.success('Successfully enrolled in the course!');
        router.refresh();
        router.push(`/courses/${course.id}/success?success=1`);
      } else {
        const response = await axios.post<{ url?: string }>(
          `/api/courses/${course.id}/checkout`
        );
        const checkoutUrl = response.data?.url;
        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        }
      }
    } catch (error: unknown) {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWishlist = async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics:click', { detail: { id: 'cta-wishlist', courseId: course.id } }));
    }
    if (!userId) {
      router.push(`/auth/login?callbackUrl=/courses/${course.id}`);
      return;
    }

    try {
      // TODO: Implement wishlist API endpoint
      setIsWishlisted(!isWishlisted);
      toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
    } catch (error: unknown) {
      toast.error('Failed to update wishlist');
    }
  };

  const handlePreview = (): void => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics:click', { detail: { id: 'cta-preview', courseId: course.id } }));
    }
    // TODO: Implement preview video functionality
    toast.info('Preview feature coming soon!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-2"
    >
      {isEnrolled ? (
        <button
          data-analytics-id="cta-go-to-course"
          className="w-full relative px-5 py-3 md:py-3.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold text-base md:text-lg transition-all duration-200 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          onClick={() => {
            router.push(`/courses/${course.id}/learn`);
          }}
          disabled={isLoading}
        >
          <span className="flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Go to Course
                <span className="text-white/90">✓ Enrolled</span>
              </>
            )}
          </span>
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <motion.button
            data-analytics-id="cta-enroll-now"
            className="flex-1 relative px-5 py-3 md:py-3.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold text-base md:text-lg transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-purple-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              handleEnroll().catch((error: unknown) => {
                console.error('Enrollment failed:', error);
              });
            }}
            disabled={isLoading}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <span className="flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Enroll Now'
              )}
            </span>
          </motion.button>

          <motion.button
            data-analytics-id="cta-wishlist"
            title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={isWishlisted}
            onClick={() => {
              handleWishlist().catch((error: unknown) => {
                console.error('Wishlist failed:', error);
              });
            }}
            className={`inline-flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-lg border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-pink-500 ${
              isWishlisted
                ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 shadow-md'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-pink-400 dark:hover:border-pink-500 hover:shadow-md'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Heart className={`w-5 h-5 transition-all ${isWishlisted ? 'fill-current' : ''}`} aria-hidden="true" />
            <span className="sr-only">{isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}</span>
          </motion.button>

          <motion.button
            data-analytics-id="cta-preview"
            title="Preview course"
            aria-label="Preview course video"
            onClick={handlePreview}
            className="inline-flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Play className="w-5 h-5" aria-hidden="true" />
            <span className="sr-only">Preview course video</span>
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};
