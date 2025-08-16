"use client";

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { AiFillStar, AiOutlineClockCircle, AiOutlineUser } from 'react-icons/ai';
import { Course } from '@prisma/client';
import { cleanHtmlContent } from '../utils/html-utils';

interface CourseHeroSectionProps {
  course: Course & { 
    category?: { name: string } | null;
    reviews?: {
      id: string;
      rating: number;
      createdAt: Date;
    }[];
    _count?: {
      enrollments: number;
    };
  };
}

export const CourseHeroSection = ({ course }: CourseHeroSectionProps) => {
  // Calculate average rating
  const averageRating = course.reviews?.length 
    ? (course.reviews.reduce((acc, review) => acc + review.rating, 0) / course.reviews.length).toFixed(1)
    : "0.0";

  // Get total reviews count
  const totalReviews = course.reviews?.length || 0;

  // Get total enrollments
  const totalEnrollments = course._count?.enrollments || 0;

  // Format last updated date
  const lastUpdated = new Date(course.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="relative h-[60vh] w-full">
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0">
        <Image
          src={course.imageUrl || '/default-course.jpg'}
          alt={course.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-gray-900/50 to-white dark:to-gray-900" />
      </div>

      {/* Course Info Overlay */}
      <div className="absolute inset-0 flex items-center">
        <motion.div 
          className="container mx-auto px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Enhanced Category Badge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center"
          >
            <span className="
              px-4 py-2 
              rounded-full 
              bg-white/10 
              backdrop-blur-md 
              border border-white/20
              text-white 
              font-medium
              shadow-lg
              shadow-purple-500/20
              flex items-center gap-2
            ">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              {course.category?.name || 'Category not specified'}
            </span>
          </motion.div>

          {/* Course Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-6xl font-bold text-white mb-6 max-w-4xl leading-tight"
          >
            {cleanHtmlContent(course.title)}
          </motion.h1>

          {/* Course Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-6 text-white/90"
          >
            <div className="flex items-center gap-2">
              <AiFillStar className="text-yellow-500 text-2xl" />
              <span className="text-2xl font-semibold">{averageRating}</span>
              <span className="text-white/70">
                ({totalReviews} {totalReviews === 1 ? 'rating' : 'ratings'})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AiOutlineUser className="text-purple-400 text-xl" />
              <span>
                {totalEnrollments.toLocaleString()} {totalEnrollments === 1 ? 'student' : 'students'} enrolled
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AiOutlineClockCircle className="text-blue-400 text-xl" />
              <span>Last updated {lastUpdated}</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}; 