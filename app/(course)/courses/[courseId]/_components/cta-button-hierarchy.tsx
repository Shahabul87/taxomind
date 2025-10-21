"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Loader2, Heart, Gift, Play } from 'lucide-react';
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

  const handleGift = (): void => {
    // TODO: Implement gift course functionality
    toast.info('Gift course feature coming soon!');
  };

  const handlePreview = (): void => {
    // TODO: Implement preview video functionality
    toast.info('Preview feature coming soon!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-3"
    >
      {/* Primary CTA - Enroll Now */}
      {isEnrolled ? (
        <button
          className="w-full group relative px-6 py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-green-500/25"
          onClick={() => {
            router.push(`/courses/${course.id}/learn`);
          }}
          disabled={isLoading}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
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
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-600/50 to-emerald-600/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      ) : (
        <button
          className="w-full group relative px-6 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-purple-500/25"
          onClick={() => {
            handleEnroll().catch((error: unknown) => {
              console.error('Enrollment failed:', error);
            });
          }}
          disabled={isLoading}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              'Enroll Now'
            )}
          </span>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/50 to-blue-600/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      )}

      {/* Secondary CTAs */}
      {!isEnrolled && (
        <div className="grid grid-cols-2 gap-3">
          {/* Add to Wishlist */}
          <button
            onClick={() => {
              handleWishlist().catch((error: unknown) => {
                console.error('Wishlist failed:', error);
              });
            }}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 font-semibold text-sm transition-all duration-200 ${
              isWishlisted
                ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            <Heart
              className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`}
            />
            <span>Wishlist</span>
          </button>

          {/* Preview Course */}
          <button
            onClick={handlePreview}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 font-semibold text-sm transition-all duration-200"
          >
            <Play className="w-4 h-4" />
            <span>Preview</span>
          </button>
        </div>
      )}

      {/* Tertiary CTA - Gift This Course */}
      {!isEnrolled && (
        <button
          onClick={handleGift}
          className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium transition-colors"
        >
          <Gift className="w-4 h-4" />
          <span>Gift this course</span>
        </button>
      )}
    </motion.div>
  );
};
