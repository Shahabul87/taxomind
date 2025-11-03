"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Course, Chapter } from '@prisma/client';
import {
  TrendingUp,
  Target,
  CheckCircle2,
  Sparkles,
  Award,
  Users,
  BookOpen,
  Star
} from 'lucide-react';

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
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-12 pb-12"
    >
      {/* Enterprise Stats Dashboard */}
      <motion.div variants={itemVariants}>
        <CourseHighlights course={course} />
      </motion.div>

      {/* Key Value Proposition Section */}
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 border border-blue-100 dark:border-slate-700 rounded-2xl p-8 shadow-lg"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <Target className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            What Makes This Course Stand Out
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex items-start gap-4 p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Industry-Relevant Content</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Built with real-world applications and current industry standards</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Career Growth</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Skills that directly impact your professional advancement</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Expert Instruction</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Learn from professionals with proven track records</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Certification</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Earn a recognized certificate upon completion</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* About This Course */}
      <motion.div variants={itemVariants}>
        <CourseDescription course={course} />
      </motion.div>

      {/* What You&apos;ll Learn */}
      <motion.div variants={itemVariants}>
        <CourseLearningObjectives course={course} />
      </motion.div>

      {/* Skills You&apos;ll Gain */}
      <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Skills You&apos;ll Gain
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {['Problem Solving', 'Critical Thinking', 'Technical Expertise', 'Practical Application', 'Best Practices', 'Industry Standards'].map((skill, index) => (
            <motion.span
              key={skill}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              className="px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 border border-blue-200 dark:border-blue-800 rounded-full text-sm font-medium text-gray-900 dark:text-white"
            >
              {skill}
            </motion.span>
          ))}
        </div>
      </motion.div>

      {/* Course Requirements */}
      <motion.div variants={itemVariants}>
        <CourseRequirements course={course} />
      </motion.div>

      {/* Who This Course Is For */}
      <motion.div variants={itemVariants}>
        <CourseTargetAudience course={course} />
      </motion.div>

      {/* Social Proof Section */}
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-8"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
          <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
          <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
          <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
          <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
        </div>
        <p className="text-center text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Join Thousands of Successful Students
        </p>
        <p className="text-center text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Our courses have helped professionals worldwide advance their careers and master new skills. Start your learning journey today.
        </p>
      </motion.div>
    </motion.div>
  );
};
