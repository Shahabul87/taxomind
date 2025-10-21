"use client";

import React, { useState } from 'react';

import { Course } from '@prisma/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

import { cleanHtmlContent } from '../utils/html-utils';

interface CourseLearningObjectivesProps {
  course: Course & {
    whatYouWillLearn?: string[];
  };
}

export const CourseLearningObjectives = ({ course }: CourseLearningObjectivesProps): JSX.Element => {
  const [showAllObjectives, setShowAllObjectives] = useState(false);

  const allObjectives = course.whatYouWillLearn && course.whatYouWillLearn.length > 0
    ? course.whatYouWillLearn
    : ['Comprehensive curriculum', 'Practical exercises', 'Real-world projects', 'Industry best practices', 'Expert guidance', 'Hands-on projects'];

  const initialObjectives = allObjectives.slice(0, 6);
  const additionalObjectives = allObjectives.slice(6);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="bg-gradient-to-br from-emerald-50/80 via-teal-50/60 to-cyan-50/80 dark:from-slate-800/80 dark:via-slate-700/60 dark:to-emerald-900/20 border border-emerald-100/50 dark:border-slate-600/30 p-6 md:p-8 rounded-2xl shadow-sm backdrop-blur-sm"
      data-section="what-youll-learn"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">What You&apos;ll Learn</h2>
      </div>
      
      <div className="space-y-4">
        {/* Always visible first 6 objectives */}
        <div className="grid md:grid-cols-2 gap-4">
          {initialObjectives.map((item, index) => (
            <div 
              key={`initial-${item.slice(0, 20).replace(/\s+/g, '-')}`}
              className="flex items-start gap-4 p-4 bg-white/60 dark:bg-slate-700/30 rounded-xl border border-emerald-100/30 dark:border-slate-600/20 hover:bg-white/80 dark:hover:bg-slate-700/50 transition-all duration-200"
            >
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                  <Check className="text-emerald-600 dark:text-emerald-400 text-sm" />
                </div>
              </div>
              <span className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {cleanHtmlContent(item)}
              </span>
            </div>
          ))}
        </div>

        {/* Expandable additional objectives */}
        {additionalObjectives.length > 0 && (
          <AnimatePresence>
            {showAllObjectives && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ 
                  duration: 0.5,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                className="overflow-hidden"
              >
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  {additionalObjectives.map((item, index) => (
                    <motion.div 
                      key={`additional-${item.slice(0, 20).replace(/\s+/g, '-')}`}
                      className="flex items-start gap-4 p-4 bg-white/60 dark:bg-slate-700/30 rounded-xl border border-emerald-100/30 dark:border-slate-600/20 hover:bg-white/80 dark:hover:bg-slate-700/50 transition-all duration-200"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        duration: 0.4,
                        delay: index * 0.03,
                        ease: [0.25, 0.46, 0.45, 0.94]
                      }}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                          <Check className="text-emerald-600 dark:text-emerald-400 text-sm" />
                        </div>
                      </div>
                      <span className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {cleanHtmlContent(item)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
      
      {additionalObjectives.length > 0 && (
        <div className="mt-6 pt-4 border-t border-emerald-100/50 dark:border-slate-600/30">
          <motion.button
            onClick={() => {

              setShowAllObjectives(!showAllObjectives);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-slate-700 hover:bg-emerald-200 dark:hover:bg-slate-600 text-emerald-700 dark:text-emerald-400 rounded-lg font-medium transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {showAllObjectives ? (
              <>
                <span>Show Less</span>
                <svg className="w-4 h-4 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            ) : (
              <>
                <span>Show {additionalObjectives.length} More Learning Objectives</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}; 