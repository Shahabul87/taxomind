"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';
import type { Course } from '@prisma/client';
import { useEnrollAction } from '../_hooks/use-enroll-action';
import { Z_LAYERS } from '../_config/z-layers';

interface MobileEnrollBarProps {
  course: Course & {
    isFree?: boolean;
  };
  isEnrolled?: boolean;
  userId?: string;
}

export const MobileEnrollBar: React.FC<MobileEnrollBarProps> = ({ course, isEnrolled = false, userId }) => {
  const { handleEnroll, isLoading } = useEnrollAction({
    courseId: course.id,
    price: course.price ?? null,
    isFree: course.isFree,
    userId,
  });

  if (isEnrolled) return null;

  const price = course.price ?? 0;
  const original = course.originalPrice ?? undefined;

  return (
    <div className={`md:hidden fixed bottom-0 left-0 right-0 ${Z_LAYERS.mobileEnrollBar}`}>
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
            onClick={handleEnroll}
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
