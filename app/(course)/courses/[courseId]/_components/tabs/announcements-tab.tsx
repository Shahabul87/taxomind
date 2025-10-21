"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Megaphone } from 'lucide-react';

interface AnnouncementsTabProps {
  courseId: string;
}

export const AnnouncementsTab = ({ courseId }: AnnouncementsTabProps): JSX.Element => {
  // TODO: Implement announcements functionality in Phase 2
  // This is a placeholder component for Phase 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl p-12"
    >
      <div className="text-center max-w-md mx-auto">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
          className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl"
        >
          <Megaphone className="w-10 h-10 text-white" strokeWidth={2.5} />
        </motion.div>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-gray-900 dark:text-white mb-3"
        >
          Announcements Coming Soon
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-gray-600 dark:text-gray-400 mb-8"
        >
          Stay tuned for important updates, news, and announcements from your instructor.
          This feature will be available soon!
        </motion.p>

        {/* Feature List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-left"
        >
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <p className="font-semibold text-gray-900 dark:text-white">
              What to expect:
            </p>
          </div>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              Course updates and new content notifications
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              Important deadlines and schedule changes
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              Tips and recommendations from the instructor
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              Special offers and bonus materials
            </li>
          </ul>
        </motion.div>
      </div>
    </motion.div>
  );
};
