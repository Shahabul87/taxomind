"use client";

import React from 'react';
import { Course, Chapter } from '@prisma/client';
import { CourseHeroSection } from './course-hero-section';
import { CourseDescription } from './course-description';
import { CourseLearningObjectives } from './course-learning-objectives';
import { CourseInfoCard } from './course-info-card';

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

export const CourseLayout = ({ course, userId, isEnrolled = false }: CourseLayoutProps) => {
  return (
    <div className="min-h-screen bg-white/10 dark:bg-gradient-to-b dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <CourseHeroSection course={course} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
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
    </div>
  );
}; 