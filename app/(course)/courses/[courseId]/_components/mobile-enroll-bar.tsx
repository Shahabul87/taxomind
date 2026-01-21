"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Course } from '@prisma/client';

interface MobileEnrollBarProps {
  course: Course & {
    isFree?: boolean;
  };
  isEnrolled?: boolean;
}

export const MobileEnrollBar: React.FC<MobileEnrollBarProps> = ({ course, isEnrolled = false }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
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

  if (isEnrolled) return null;

  const price = course.price ?? 0;
  const original = course.originalPrice ?? undefined;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-7xl px-4 py-3 pb-safe-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm supports-[backdrop-filter]:backdrop-blur-sm border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              ${price}
            </span>
            {original && original > price && (
              <span className="text-sm text-slate-500 line-through">${original}</span>
            )}
          </div>
          <button
            onClick={handleClick}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold shadow-sm active:bg-purple-800 hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Enroll'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
