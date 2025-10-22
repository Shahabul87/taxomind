"use client";

import React, { useEffect, useRef, useState } from 'react';

import { Course, Chapter } from '@prisma/client';

import { CourseDescription } from './course-description';
import { CourseHeroSection } from './course-hero-section';
import { CourseInfoCard } from './course-info-card';
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
  // Hide global header on scroll down (course page only) and let tabs stick to top
  const [headerHidden, setHeaderHidden] = useState(false);
  const lastYRef = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const scrollingDown = y > lastYRef.current;
      const nearTop = y < 80;
      if (nearTop) {
        setHeaderHidden(false);
      } else if (scrollingDown && y > 140) {
        setHeaderHidden(true);
      } else {
        setHeaderHidden(false);
      }
      lastYRef.current = y;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    // Toggle class for global CSS hooks
    if (headerHidden) root.classList.add('course-header-hidden');
    else root.classList.remove('course-header-hidden');

    // Smoothly translate the primary header out of view (header has aria-label="Primary")
    const headerEl = document.querySelector('header[aria-label="Primary"]') as HTMLElement | null;
    if (headerEl) {
      headerEl.style.transition = 'transform 200ms ease';
      headerEl.style.transform = headerHidden ? 'translateY(-100%)' : 'translateY(0)';
    }

    return () => {
      root.classList.remove('course-header-hidden');
      if (headerEl) headerEl.style.transform = 'translateY(0)';
    };
  }, [headerHidden]);

  // Compute dynamic sticky offset for the info card to avoid overlapping headers
  useEffect(() => {
    const updateStickyOffset = (): void => {
      const docEl = document.documentElement;
      const headerEl = document.querySelector('header[aria-label="Primary"]') as HTMLElement | null;
      const miniEl = document.querySelector('.sticky-mini-header') as HTMLElement | null;
      const headerHeight = headerEl?.offsetHeight ?? 96; // fallback ~6rem
      // mini header is fixed at top-16; compute its bottom relative to viewport
      const miniBottom = miniEl ? Math.max(0, miniEl.getBoundingClientRect().bottom) : 0;
      const offset = Math.max(headerHeight, miniBottom) + 8; // add small cushion
      docEl.style.setProperty('--sticky-offset', `${Math.ceil(offset)}px`);
      // expose header height for mini header top positioning
      docEl.style.setProperty('--mini-top', `${Math.ceil(headerHeight)}px`);
    };

    updateStickyOffset();
    window.addEventListener('resize', updateStickyOffset, { passive: true } as any);
    window.addEventListener('scroll', updateStickyOffset, { passive: true } as any);
    return () => {
      window.removeEventListener('resize', updateStickyOffset);
      window.removeEventListener('scroll', updateStickyOffset);
      document.documentElement.style.removeProperty('--sticky-offset');
      document.documentElement.style.removeProperty('--mini-top');
    };
  }, []);

  return (
    <div className="min-h-screen bg-white/10 dark:bg-gradient-to-b dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Skip to main content for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-3 focus:py-2 focus:rounded-md focus:bg-white focus:text-blue-700 focus:shadow-md dark:focus:bg-gray-900 dark:focus:text-blue-300"
      >
        Skip to main content
      </a>
      {/* Sticky mini header after scrolling past hero */}
      <StickyMiniHeader course={course} isEnrolled={isEnrolled} />
      {/* Hero Section */}
      <CourseHeroSection course={course} />

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

          {/* Right Column - Course Info Card */}
          <div className="md:relative md:-mt-24 lg:-mt-32 xl:-mt-40 2xl:-mt-48 md:z-10">
            <CourseInfoCard 
              course={course}
              userId={userId}
              isEnrolled={isEnrolled}
            />
          </div>
        </div>
      </div>
      {/* Mobile bottom enroll bar */}
      <MobileEnrollBar course={course} isEnrolled={isEnrolled} />
    </div>
  );
};
