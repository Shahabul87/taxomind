"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Course, Chapter } from '@prisma/client';

import { CourseDescription } from '../course-description';
import { CourseLearningObjectives } from '../course-learning-objectives';
import { CourseRequirements } from './course-requirements';
import { CourseHighlights } from './course-highlights';
import { CourseTargetAudience } from './course-target-audience';

interface OverviewTabProps {
  course: Course & {
    chapters?: Chapter[];
    category?: { name: string } | null;
  };
}

export const OverviewTab = ({ course }: OverviewTabProps): JSX.Element => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Course Highlights - Quick Stats */}
      <CourseHighlights course={course} />

      {/* About This Course */}
      <CourseDescription course={course} />

      {/* What You&apos;ll Learn */}
      <CourseLearningObjectives course={course} />

      {/* Course Requirements */}
      <CourseRequirements course={course} />

      {/* Who This Course Is For */}
      <CourseTargetAudience course={course} />
    </motion.div>
  );
};
