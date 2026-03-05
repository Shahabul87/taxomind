"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Course } from '@prisma/client';

interface CourseRequirementsProps {
  course: Course;
}

export const CourseRequirements = ({ course }: CourseRequirementsProps): JSX.Element => {
  // Parse prerequisites from course data or use defaults
  const requirements = course.prerequisites
    ? course.prerequisites.split('\n').filter(Boolean)
    : [
        'Basic understanding of programming concepts',
        'Willingness to learn and practice',
        'A computer with internet connection'
      ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="bg-white dark:bg-gray-800/50 border-2 border-amber-100 dark:border-amber-900/30 rounded-2xl p-4 md:p-5 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
          <AlertCircle className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Requirements</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">What you need before starting</p>
        </div>
      </div>

      {/* Requirements List */}
      <div className="space-y-2">
        {requirements.map((requirement: string, index: number) => (
          <motion.div
            key={`req-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            className="flex items-start gap-2"
          >
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-3 h-3 text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words word-break-anywhere text-balance">
              {requirement}
            </p>
          </motion.div>
        ))}
      </div>

      {/* No Prerequisites Message */}
      {requirements.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            No prerequisites required! This course is beginner-friendly.
          </p>
        </div>
      )}
    </motion.div>
  );
};
