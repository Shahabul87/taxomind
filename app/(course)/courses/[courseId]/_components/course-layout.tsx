"use client";

import { Course, Chapter } from '@prisma/client';

import { CourseHeroSection } from './course-hero-section';
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
  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Skip to main content for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-3 focus:py-2 focus:rounded-md focus:bg-white focus:text-blue-700 focus:shadow-md dark:focus:bg-gray-900 dark:focus:text-blue-300"
      >
        Skip to main content
      </a>
      {/* Original Hero Section - Full width, no overlay */}
      <div className="relative">
        <CourseHeroSection course={course} userId={userId} isEnrolled={isEnrolled} />
      </div>

      {/* Main Content - TEMPORARILY HIDDEN */}
      {/* <div id="main-content" role="main" className="container mx-auto px-4 py-12 pb-24 pb-safe-24">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <CourseDescription course={course} />
            <CourseLearningObjectives course={course} />
          </div>
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
      </div> */}
      {/* Mobile bottom enroll bar */}
      <MobileEnrollBar course={course} isEnrolled={isEnrolled} />
    </div>
  );
};
