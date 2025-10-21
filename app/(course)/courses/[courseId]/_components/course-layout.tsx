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

  return (
    <div className="min-h-screen bg-white/10 dark:bg-gradient-to-b dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Sticky mini header after scrolling past hero */}
      <StickyMiniHeader course={course} isEnrolled={isEnrolled} />
      {/* Hero Section */}
      <CourseHeroSection course={course} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 pb-24">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column - Course Details */}
          <div className="md:col-span-2 space-y-8">
            {/* Course Description */}
            <CourseDescription course={course} />

            {/* Learning Objectives */}
            <CourseLearningObjectives course={course} />
          </div>

          {/* Right Column - Course Info Card */}
          <CourseInfoCard 
            course={course}
            userId={userId}
            isEnrolled={isEnrolled}
          />
        </div>
      </div>
      {/* Mobile bottom enroll bar */}
      <MobileEnrollBar course={course} isEnrolled={isEnrolled} />
    </div>
  );
};
