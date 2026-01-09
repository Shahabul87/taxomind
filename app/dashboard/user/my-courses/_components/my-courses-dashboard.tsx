'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Clock,
  BookOpen,
  Users,
  Star,
  BarChart,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Award,
  Zap,
  Trophy,
  TrendingUp,
  Calendar,
  Target,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { logger } from '@/lib/logger';

import { CourseCard } from './course-card';
import { EmptyState } from './empty-state';
import { CoursesFilterMenu } from './courses-filter-menu';
import { CourseStats } from './course-stats';

interface MyCoursesDashboardProps {
  enrolledCourses: any[];
  createdCourses: any[];
  enrolledCoursesError: string | null;
  createdCoursesError: string | null;
  user: any;
}

export const MyCoursesDashboard = ({
  enrolledCourses = [],
  createdCourses = [],
  enrolledCoursesError,
  createdCoursesError,
  user,
}: MyCoursesDashboardProps) => {
  const [tab, setTab] = useState<'enrolled' | 'created'>('enrolled');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    progress: 'all',
    sortBy: 'recent',
  });

  // Safe data processing with error protection
  const safeEnrolledCourses = Array.isArray(enrolledCourses) ? enrolledCourses : [];
  const safeCreatedCourses = Array.isArray(createdCourses) ? createdCourses : [];

  // Filter courses based on search and filter settings
  const filteredEnrolledCourses = safeEnrolledCourses
    .filter((course) => {
      try {
        // Search filter with safe string access
        const title = course?.title || '';
        if (searchQuery && !title.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }

        // Category filter with safe access
        const categoryName = course?.category?.name || '';
        if (filters.category !== 'all' && categoryName !== filters.category) {
          return false;
        }

        // Progress filter with safe number access
        const completionPercentage = course?.completionPercentage || 0;
        if (filters.progress === 'completed' && completionPercentage < 100) {
          return false;
        }
        if (
          filters.progress === 'in-progress' &&
          (completionPercentage === 0 || completionPercentage === 100)
        ) {
          return false;
        }
        if (filters.progress === 'not-started' && completionPercentage > 0) {
          return false;
        }

        return true;
      } catch (error: any) {
        logger.warn('Error filtering enrolled course:', error);
        return false;
      }
    })
    .sort((a, b) => {
      try {
        // Sort based on filter with safe access
        if (filters.sortBy === 'recent') {
          const dateA = new Date(a?.enrolledAt || a?.createdAt || 0).getTime();
          const dateB = new Date(b?.enrolledAt || b?.createdAt || 0).getTime();
          return dateB - dateA;
        }
        if (filters.sortBy === 'title') {
          return (a?.title || '').localeCompare(b?.title || '');
        }
        if (filters.sortBy === 'progress') {
          return (b?.completionPercentage || 0) - (a?.completionPercentage || 0);
        }
        if (filters.sortBy === 'rating') {
          return (b?.averageRating || 0) - (a?.averageRating || 0);
        }
        return 0;
      } catch (error: any) {
        logger.warn('Error sorting enrolled courses:', error);
        return 0;
      }
    });

  const filteredCreatedCourses = safeCreatedCourses
    .filter((course) => {
      try {
        // Search filter with safe string access
        const title = course?.title || '';
        if (searchQuery && !title.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }

        // Category filter with safe access
        const categoryName = course?.category?.name || '';
        if (filters.category !== 'all' && categoryName !== filters.category) {
          return false;
        }

        return true;
      } catch (error: any) {
        logger.warn('Error filtering created course:', error);
        return false;
      }
    })
    .sort((a, b) => {
      try {
        // Sort based on filter with safe access
        if (filters.sortBy === 'recent') {
          const dateA = new Date(a?.createdAt || 0).getTime();
          const dateB = new Date(b?.createdAt || 0).getTime();
          return dateB - dateA;
        }
        if (filters.sortBy === 'title') {
          return (a?.title || '').localeCompare(b?.title || '');
        }
        if (filters.sortBy === 'students') {
          return (b?.totalEnrolled || 0) - (a?.totalEnrolled || 0);
        }
        if (filters.sortBy === 'rating') {
          return (b?.averageRating || 0) - (a?.averageRating || 0);
        }
        return 0;
      } catch (error: any) {
        logger.warn('Error sorting created courses:', error);
        return 0;
      }
    });

  // Calculate dashboard stats with safe access
  const totalEnrolledCourses = safeEnrolledCourses.length;
  const completedCourses = safeEnrolledCourses.filter(
    (c) => (c?.completionPercentage || 0) === 100
  ).length;
  const inProgressCourses = safeEnrolledCourses.filter((c) => {
    const progress = c?.completionPercentage || 0;
    return progress > 0 && progress < 100;
  }).length;
  const totalCreatedCourses = safeCreatedCourses.length;
  const totalStudents = safeCreatedCourses.reduce(
    (acc, course) => acc + (course?.totalEnrolled || 0),
    0
  );

  // Calculate average completion rate
  const avgCompletionRate =
    totalEnrolledCourses > 0
      ? Math.round(
          safeEnrolledCourses.reduce(
            (acc, course) => acc + (course?.completionPercentage || 0),
            0
          ) / totalEnrolledCourses
        )
      : 0;

  // Calculate learning streak (mock data for now)
  const learningStreak = 7;

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="w-full py-4 sm:py-6 lg:py-8">
      {/* Header Section with Hero Design - Responsive */}
      <div className="relative py-8 sm:py-12 lg:py-16 mb-6 sm:mb-8 overflow-hidden rounded-2xl sm:rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/90 via-purple-900/90 to-indigo-900/90"></div>

        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-30"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-30"></div>
        <div className="absolute -top-40 -right-20 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-20"></div>
        <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-20"></div>

        <div className="relative z-10 max-w-6xl mx-auto text-center px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center mb-4 gap-3 sm:gap-0"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center sm:mr-4 flex-shrink-0">
              <span className="text-xl sm:text-2xl font-bold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-sm sm:text-lg text-gray-300">Welcome back,</h2>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                {user?.name || 'Learner'}
              </h1>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg text-gray-300 max-w-3xl mx-auto px-2"
          >
            Track your progress, manage your courses, and continue your educational adventure all in
            one place.
          </motion.p>

          {/* Quick Stats in Header - Responsive Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto"
          >
            <div className="text-center p-3 sm:p-0">
              <div className="text-xl sm:text-2xl font-bold text-white">{totalEnrolledCourses}</div>
              <div className="text-xs sm:text-sm text-gray-300">Enrolled</div>
            </div>
            <div className="text-center p-3 sm:p-0">
              <div className="text-xl sm:text-2xl font-bold text-green-400">{completedCourses}</div>
              <div className="text-xs sm:text-sm text-gray-300">Completed</div>
            </div>
            <div className="text-center p-3 sm:p-0">
              <div className="text-xl sm:text-2xl font-bold text-purple-400">
                {totalCreatedCourses}
              </div>
              <div className="text-xs sm:text-sm text-gray-300">Created</div>
            </div>
            <div className="text-center p-3 sm:p-0">
              <div className="text-xl sm:text-2xl font-bold text-amber-400">{learningStreak}d</div>
              <div className="text-xs sm:text-sm text-gray-300">Streak</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Enhanced Stats Overview Cards - Responsive Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-5 mb-6 sm:mb-8 lg:mb-10"
      >
        <CourseStats
          title="Enrolled Courses"
          value={totalEnrolledCourses}
          icon={<BookOpen className="w-5 h-5 text-blue-400" />}
          change="+3 this month"
          positive={true}
          color="blue"
        />

        <CourseStats
          title="Completed Courses"
          value={completedCourses}
          icon={<CheckCircle2 className="w-5 h-5 text-green-400" />}
          change={`${avgCompletionRate}% avg completion`}
          positive={true}
          color="green"
        />

        <CourseStats
          title="Created Courses"
          value={totalCreatedCourses}
          icon={<Award className="w-5 h-5 text-purple-400" />}
          change={
            totalCreatedCourses > 0 ? `${totalStudents} total students` : 'Create your first course'
          }
          positive={totalCreatedCourses > 0}
          color="purple"
        />

        <CourseStats
          title="Learning Streak"
          value={`${learningStreak} days`}
          icon={<Zap className="w-5 h-5 text-amber-400" />}
          change="Personal best!"
          positive={true}
          color="amber"
        />

        <CourseStats
          title="In Progress"
          value={inProgressCourses}
          icon={<TrendingUp className="w-5 h-5 text-orange-400" />}
          change="Keep going!"
          positive={true}
          color="orange"
        />

        <CourseStats
          title="This Month"
          value="24h"
          icon={<Calendar className="w-5 h-5 text-indigo-400" />}
          change="Learning time"
          positive={true}
          color="indigo"
        />
      </motion.div>

      {/* Analytics Promotion Banner for Course Creators - Responsive */}
      {totalCreatedCourses > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-6 sm:mb-8"
        >
          <Link href="/my-courses/analytics">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-4 sm:p-6 text-white cursor-pointer hover:shadow-xl transition-shadow">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-24 -translate-x-24"></div>

              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 mr-2 flex-shrink-0" />
                    <h3 className="text-lg sm:text-xl font-bold">Course Creator Analytics</h3>
                  </div>
                  <p className="text-white/90 mb-3 sm:mb-4 text-sm sm:text-base">
                    Track your impact! See how {totalStudents} learners are engaging with your{' '}
                    {totalCreatedCourses} courses.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                    <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full whitespace-nowrap">
                      {totalStudents} Total Students
                    </span>
                    <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full whitespace-nowrap">
                      View Detailed Analytics →
                    </span>
                  </div>
                </div>

                <div className="hidden lg:block flex-shrink-0">
                  <div className="w-32 h-32 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-16 h-16 text-white/50" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      {/* Main Content Area - Responsive */}
      <div className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden shadow-xl">
        {/* Tab Navigation - Responsive */}
        <div className="flex flex-col sm:flex-row border-b border-gray-200/50 dark:border-gray-800/50">
          <div className="flex flex-1">
            <button
              onClick={() => setTab('enrolled')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-4 font-medium text-xs sm:text-sm flex items-center justify-center sm:justify-start transition-all duration-200 ${
                tab === 'enrolled'
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-500 bg-purple-50/50 dark:bg-purple-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline sm:inline">Enrolled</span>
              <span className="xs:hidden sm:hidden">Enrolled</span>
              <span
                className={`ml-1 sm:ml-2 py-0.5 px-1.5 sm:px-2 rounded-full text-xs ${
                  tab === 'enrolled'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {totalEnrolledCourses}
              </span>
            </button>

            <button
              onClick={() => setTab('created')}
              className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-4 font-medium text-xs sm:text-sm flex items-center justify-center sm:justify-start transition-all duration-200 ${
                tab === 'created'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline sm:inline">Created</span>
              <span className="xs:hidden sm:hidden">Created</span>
              <span
                className={`ml-1 sm:ml-2 py-0.5 px-1.5 sm:px-2 rounded-full text-xs ${
                  tab === 'created'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {totalCreatedCourses}
              </span>
            </button>
          </div>

          {/* Search & Filter - Responsive */}
          <div className="flex items-center gap-2 p-3 sm:p-0 sm:pr-4 border-t sm:border-t-0 border-gray-200/50 dark:border-gray-800/50">
            <div className="relative flex-1 sm:flex-none">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search courses"
                className="pl-9 pr-3 sm:pl-10 sm:pr-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-lg text-xs sm:text-sm text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent w-full sm:w-48 lg:w-64 transition-all duration-200"
              />
              <Search className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>

            <button
              onClick={() => setFilterOpen(!filterOpen)}
              aria-label="Toggle course filters"
              aria-expanded={filterOpen}
              className={`p-2 border rounded-lg transition-all duration-200 flex-shrink-0 ${
                filterOpen
                  ? 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800/50 dark:border-gray-700/50 dark:text-gray-400 dark:hover:bg-gray-700/50'
              }`}
            >
              <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>

        {/* Filter Dropdown */}
        {filterOpen && (
          <CoursesFilterMenu
            filters={filters}
            setFilters={setFilters}
            onClose={() => setFilterOpen(false)}
            activeTab={tab}
          />
        )}

        {/* Courses Grid - Full Width */}
        <div className="p-6">
          {tab === 'enrolled' && (
            <>
              {enrolledCoursesError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 mb-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg text-red-700 dark:text-red-400"
                >
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    {enrolledCoursesError}
                  </div>
                </motion.div>
              )}

              {filteredEnrolledCourses.length === 0 ? (
                <EmptyState
                  title="No enrolled courses found"
                  description={
                    searchQuery
                      ? 'Try adjusting your search or filters'
                      : 'Explore our course catalog to start your learning journey'
                  }
                  icon={<BookOpen className="w-10 h-10 text-gray-500" />}
                  actionLink="/teacher/courses"
                  actionText="All Courses"
                />
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
                >
                  {filteredEnrolledCourses.map((course, index) => (
                    <motion.div
                      key={course?.id || index}
                      variants={variants}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    >
                      <CourseCard course={course} type="enrolled" />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </>
          )}

          {tab === 'created' && (
            <>
              {createdCoursesError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 mb-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg text-red-700 dark:text-red-400"
                >
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    {createdCoursesError}
                  </div>
                </motion.div>
              )}

              <div className="flex justify-between mb-6">
                <Link href="/my-courses/analytics">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium text-sm hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg hover:shadow-xl"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Course Analytics
                  </motion.button>
                </Link>

                <Link href="/teacher/courses/create">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-sm hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg hover:shadow-xl"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Course
                  </motion.button>
                </Link>
              </div>

              {filteredCreatedCourses.length === 0 ? (
                <EmptyState
                  title="You haven't created any courses yet"
                  description="Share your knowledge with the world by creating your first course"
                  icon={<Award className="w-10 h-10 text-gray-500" />}
                  actionLink="/teacher/courses/create"
                  actionText="Create Course"
                />
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
                >
                  {filteredCreatedCourses.map((course, index) => (
                    <motion.div
                      key={course?.id || index}
                      variants={variants}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    >
                      <CourseCard course={course} type="created" />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
