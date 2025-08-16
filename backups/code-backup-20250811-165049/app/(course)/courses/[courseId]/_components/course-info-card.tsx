"use client";

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Course } from '@prisma/client';
import { CourseEnrollButton } from './course-enroll-button';
import { CourseFeaturesList } from './course-features-list';
import { CourseSocialMediaShare } from '../course-social-media-sharing';

interface CourseInfoCardProps {
  course: Course;
  userId?: string;
  isEnrolled?: boolean;
  features?: string[];
}

export const CourseInfoCard = ({ course, userId, isEnrolled = false, features }: CourseInfoCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.7 }}
      className="bg-gray-50/80 dark:bg-gray-800/50 p-6 rounded-xl backdrop-blur-sm h-fit sticky top-4"
    >
      <div className="space-y-6">
        {/* Course Image */}
        <div className="aspect-video relative rounded-lg overflow-hidden">
          <Image
            src={course.imageUrl || '/default-course.jpg'}
            alt={course.title}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        {/* Enroll Button */}
        <CourseEnrollButton 
          course={course}
          userId={userId}
          isEnrolled={isEnrolled}
        />

        {/* Course Features */}
        <CourseFeaturesList features={features} />

        {/* Social Share */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <CourseSocialMediaShare courseTitle={course.title} />
        </div>
      </div>
    </motion.div>
  );
}; 