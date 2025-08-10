"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Course } from '@prisma/client';
import { parseHtmlContent } from '../utils/html-utils';
import { cn } from '@/lib/utils';

interface CourseDescriptionProps {
  course: Course;
}

export const CourseDescription = ({ course }: CourseDescriptionProps) => {
  const [showFullDescription, setShowFullDescription] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/80 dark:from-slate-800/80 dark:via-slate-700/60 dark:to-slate-800/80 border border-blue-100/50 dark:border-slate-600/30 p-6 md:p-8 rounded-2xl shadow-sm backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">About This Course</h2>
      </div>
      
      <div className="space-y-6">
        {course.description ? (
          <div 
            className={cn(
              "prose prose-slate dark:prose-invert max-w-none",
              "prose-headings:text-slate-800 dark:prose-headings:text-slate-200",
              "prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg",
              "prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed",
              "prose-strong:text-slate-800 dark:prose-strong:text-slate-200",
              "prose-em:text-slate-600 dark:prose-em:text-slate-400",
              "prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline",
              "prose-blockquote:border-l-blue-500 prose-blockquote:bg-blue-50/50 dark:prose-blockquote:bg-slate-700/30",
              "prose-code:text-blue-600 dark:prose-code:text-blue-400 prose-code:bg-blue-50 dark:prose-code:bg-slate-700",
              "prose-ul:space-y-2 prose-ol:space-y-2",
              "prose-li:text-slate-700 dark:prose-li:text-slate-300",
              "prose-li:marker:text-blue-500",
              "transition-all duration-300",
              !showFullDescription && "overflow-hidden"
            )}
            style={{
              maxHeight: showFullDescription ? 'none' : '200px',
              maskImage: !showFullDescription ? 'linear-gradient(to bottom, black 70%, transparent 100%)' : 'none',
              WebkitMaskImage: !showFullDescription ? 'linear-gradient(to bottom, black 70%, transparent 100%)' : 'none',
            }}
          >
            {parseHtmlContent(course.description)}
          </div>
        ) : (
          <div className="text-slate-600 dark:text-slate-400 italic bg-slate-100/50 dark:bg-slate-700/30 p-4 rounded-lg border border-slate-200/50 dark:border-slate-600/30">
            <p>No detailed description available for this course yet. The course content and learning materials will provide comprehensive information once you enroll.</p>
          </div>
        )}
        
        {course.description && course.description.length > 200 && (
          <motion.button
            onClick={() => {

              setShowFullDescription(!showFullDescription);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-slate-700 hover:bg-blue-200 dark:hover:bg-slate-600 text-blue-700 dark:text-blue-400 rounded-lg font-medium transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {showFullDescription ? (
              <>
                <span>Show Less</span>
                <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            ) : (
              <>
                <span>Show More</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}; 