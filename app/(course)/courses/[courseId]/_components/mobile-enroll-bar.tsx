"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import type { Course } from '@prisma/client';

interface MobileEnrollBarProps {
  course: Course;
  isEnrolled?: boolean;
}

export const MobileEnrollBar: React.FC<MobileEnrollBarProps> = ({ course, isEnrolled = false }) => {
  const router = useRouter();
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const el = document.getElementById('enroll-card');
    if (el) {
      const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
      return;
    }

    // Fallback: if enroll card is not present in DOM, navigate to checkout
    try {
      if (course?.id) {
        router.push(`/courses/${course.id}/checkout`);
      }
    } catch {}
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
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold shadow-sm active:bg-purple-800 hover:bg-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          >
            Enroll
          </button>
        </div>
      </div>
    </div>
  );
};
