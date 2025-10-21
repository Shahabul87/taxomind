"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, BarChart3, Globe, Award, Users, BookOpen } from 'lucide-react';
import { Course, Chapter } from '@prisma/client';

interface CourseHighlightsProps {
  course: Course & {
    chapters?: Chapter[];
    category?: { name: string } | null;
  };
}

export const CourseHighlights = ({ course }: CourseHighlightsProps): JSX.Element => {
  // Calculate total duration from chapters
  const totalHours = course.chapters?.reduce((acc, chapter) => {
    // Assuming each chapter has estimated duration
    return acc + 2; // Default 2 hours per chapter as placeholder
  }, 0) || 0;

  const highlights = [
    {
      icon: Clock,
      label: 'Duration',
      value: `${totalHours} hours`,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      icon: BarChart3,
      label: 'Level',
      value: 'All Levels', // TODO: Add level field to Course model
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      icon: BookOpen,
      label: 'Chapters',
      value: `${course.chapters?.length || 0} chapters`,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      icon: Globe,
      label: 'Language',
      value: 'English',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      icon: Award,
      label: 'Certificate',
      value: 'Yes',
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      icon: Users,
      label: 'Enrolled',
      value: `${(course as any)._count?.Enrollment || 0} students`,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-100 dark:bg-pink-900/30',
      iconColor: 'text-pink-600 dark:text-pink-400',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-2xl p-6 md:p-8 shadow-sm"
    >
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Course Highlights
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Quick overview of what this course offers
        </p>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {highlights.map((highlight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index, duration: 0.2 }}
            className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-all duration-300"
          >
            {/* Background gradient on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${highlight.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

            {/* Icon */}
            <div className={`${highlight.bgColor} w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
              <highlight.icon className={`w-6 h-6 ${highlight.iconColor}`} strokeWidth={2.5} />
            </div>

            {/* Label */}
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
              {highlight.label}
            </p>

            {/* Value */}
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {highlight.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Category Badge */}
      {course.category && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 flex items-center gap-2"
        >
          <span className="text-sm text-gray-600 dark:text-gray-400">Category:</span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md">
            {course.category.name}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
};
