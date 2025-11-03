"use client";

import React, { useEffect, useRef, useState } from 'react';

import { Course, Chapter } from '@prisma/client';

import { CourseDescription } from './course-description';
import { CourseHeroSection } from './course-hero-section';
import { CourseInfoCardProfessional as CourseInfoCard } from './course-info-card-professional';
import { CourseLearningObjectives } from './course-learning-objectives';
import { StickyMiniHeader } from './sticky-mini-header';
import { MobileEnrollBar } from './mobile-enroll-bar';

interface CourseLayoutProps {
  course: Course & { 
    category?: { name: string } | null;
    reviews?: {
      id: string;
      rating: number;
      createdAt: Date;
    }[];
    chapters?: Chapter[];
    _count?: {
      enrollments: number;
    };
    whatYouWillLearn?: string[];
  };
  userId?: string;
  isEnrolled?: boolean;
}

export const CourseLayout = ({ course, userId, isEnrolled = false }: CourseLayoutProps): JSX.Element => {
  // Compute dynamic sticky offset for the info card
  useEffect(() => {
    const docEl = document.documentElement;
    const lastOffsetRef = { current: 0 } as { current: number };
    const baseMin = 72; // base sticky offset to minimize initial jump
    const updateStickyOffset = (): void => {
      const miniEl = document.querySelector('.sticky-mini-header') as HTMLElement | null;
      const miniBottom = miniEl ? Math.max(0, miniEl.getBoundingClientRect().bottom) : 0;
      // add cushion and enforce minimum for stability
      const next = Math.max(baseMin, Math.ceil(miniBottom + 8));
      if (Math.abs(next - lastOffsetRef.current) > 6) {
        lastOffsetRef.current = next;
        docEl.style.setProperty('--sticky-offset', `${next}px`);
      }
    };

    updateStickyOffset();
    const onScroll = () => updateStickyOffset();
    const onResize = () => updateStickyOffset();
    window.addEventListener('resize', onResize, { passive: true } as any);
    window.addEventListener('scroll', onScroll, { passive: true } as any);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      document.documentElement.style.removeProperty('--sticky-offset');
    };
  }, []);

  // Track when hero is fully scrolled past to switch overlay → sticky
  const [isPastHero, setIsPastHero] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        // If sentinel is below top (not visible), we've passed the hero
        setIsPastHero(!e.isIntersecting && e.boundingClientRect.top < 0);
      }
    }, { threshold: 0.01 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      {/* Skip to main content for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-3 focus:py-2 focus:rounded-md focus:bg-white focus:text-blue-700 focus:shadow-md dark:focus:bg-gray-900 dark:focus:text-blue-300"
      >
        Skip to main content
      </a>
      {/* Sticky mini header after scrolling past hero */}
      <StickyMiniHeader course={course} isEnrolled={isEnrolled} />
      {/* Original Hero Section - Full width, no overlay */}
      <div className="relative">
        <CourseHeroSection course={course} userId={userId} isEnrolled={isEnrolled} />
        {/* Sentinel at the end of hero to toggle states */}
        <div ref={sentinelRef} aria-hidden="true" className="absolute -bottom-1 left-0 right-0 h-1" />
      </div>

      {/* Main Content */}
      <div id="main-content" role="main" className="container mx-auto px-4 py-12 pb-24 pb-safe-24">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column - Course Details */}
          <div className="md:col-span-2 space-y-8">
            {/* Course Description */}
            <CourseDescription course={course} />

            {/* Learning Objectives */}
            <CourseLearningObjectives course={course} />
          </div>

          {/* Right Column - Sticky Info Card (shown after passing hero; hidden while overlay is visible) */}
          <div className="md:relative">
            <div className={`${isPastHero ? 'block' : 'hidden'}`} aria-hidden={!isPastHero}>
              <CourseInfoCard 
                course={course}
                userId={userId}
                isEnrolled={isEnrolled}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Mobile bottom enroll bar */}
      <MobileEnrollBar course={course} isEnrolled={isEnrolled} />
    </div>
  );
};
