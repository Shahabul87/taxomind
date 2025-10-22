"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Target, CheckCircle2 } from 'lucide-react';
import { Course } from '@prisma/client';

interface CourseTargetAudienceProps {
  course: Course;
}

export const CourseTargetAudience = ({ course }: CourseTargetAudienceProps): JSX.Element => {
  // TODO: Add targetAudience field to Course model
  // For now, using placeholder data based on course level and category
  const audiences = (course as any).targetAudience
    ? (course as any).targetAudience.split('\n').filter(Boolean)
    : [
        'Beginners who want to learn the fundamentals',
        'Intermediate learners looking to deepen their knowledge',
        'Professionals seeking to update their skills',
        'Anyone interested in the subject matter',
      ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 }}
      className="bg-white dark:bg-gray-800/50 border-2 border-purple-100 dark:border-purple-900/30 rounded-2xl p-4 md:p-5 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg">
          <Target className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Who This Course Is For
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Perfect for these learners
          </p>
        </div>
      </div>

      {/* Audience List */}
      <div className="space-y-2">
        {audiences.map((audience: string, index: number) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            className="flex items-start gap-2 group"
          >
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <CheckCircle2
                  className="w-3 h-3 text-purple-600 dark:text-purple-400"
                  strokeWidth={2.5}
                />
              </div>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words word-break-anywhere text-balance">
              {audience}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Additional Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <Users className="w-3 h-3" />
          <span>
            This course is designed to accommodate learners at various skill levels
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};
