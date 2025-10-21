"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { User, BookOpen, Users, Star, Award, Play } from 'lucide-react';
import { Course } from '@prisma/client';

interface InstructorProfileTabProps {
  course: Course & {
    user?: {
      id: string;
      name: string | null;
      image: string | null;
      bio?: string | null;
    } | null;
  };
}

export const InstructorProfileTab = ({ course }: InstructorProfileTabProps): JSX.Element => {
  const instructor = course.user;

  // Placeholder stats - TODO: fetch real stats from database
  const stats = [
    { icon: BookOpen, label: 'Courses', value: '12', color: 'text-blue-600 dark:text-blue-400' },
    {
      icon: Users,
      label: 'Students',
      value: '45,000+',
      color: 'text-green-600 dark:text-green-400',
    },
    { icon: Star, label: 'Rating', value: '4.8', color: 'text-amber-600 dark:text-amber-400' },
    {
      icon: Award,
      label: 'Reviews',
      value: '8,500',
      color: 'text-purple-600 dark:text-purple-400',
    },
  ];

  if (!instructor) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center"
      >
        <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600 dark:text-gray-400">Instructor information not available</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Instructor Header Card */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          {/* Profile Image */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="relative flex-shrink-0"
          >
            <div className="relative w-32 h-32 rounded-2xl overflow-hidden ring-4 ring-blue-100 dark:ring-blue-900/30 shadow-lg">
              {instructor.image ? (
                <Image
                  src={instructor.image}
                  alt={instructor.name || 'Instructor'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <User className="w-16 h-16 text-white" />
                </div>
              )}
            </div>
            {/* Verified Badge */}
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-gray-800 shadow-md">
              <Award className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
          </motion.div>

          {/* Instructor Info */}
          <div className="flex-1">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2"
            >
              {instructor.name || 'Anonymous Instructor'}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-gray-600 dark:text-gray-400 mb-4"
            >
              Professional Instructor & Course Creator
            </motion.p>

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                >
                  <stat.icon className={`w-5 h-5 ${stat.color}`} strokeWidth={2} />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* About Instructor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl p-6 md:p-8"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          About the Instructor
        </h3>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {instructor.bio ||
              `${instructor.name || 'This instructor'} is a professional educator with years of experience in creating high-quality educational content. Their courses are designed to help students achieve their learning goals through clear explanations, practical examples, and engaging teaching methods.`}
          </p>
        </div>
      </motion.div>

      {/* Other Courses by Instructor - Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl p-6 md:p-8"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Play className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          Other Courses by {instructor.name || 'This Instructor'}
        </h3>
        <div className="text-center py-8">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            More courses by this instructor coming soon
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};
