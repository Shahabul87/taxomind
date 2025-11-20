'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Trophy,
  Search,
  Filter,
  CheckCircle2,
  Zap,
  TrendingUp,
  Calendar,
  BarChart3,
  Plus,
  Target,
  Award,
  Clock,
  GraduationCap,
  Users,
  Star,
  ArrowUpRight,
  Sparkles,
  Flame,
  Crown,
  BookMarked,
  ChevronRight,
  Grid3x3,
  LayoutList,
  SlidersHorizontal,
} from 'lucide-react';
import { logger } from '@/lib/logger';

import { CourseCard } from './course-card';
import { EmptyState } from './empty-state';
import { CoursesFilterMenu } from './courses-filter-menu';
import { CourseStats } from './course-stats';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MyCoursesDashboardProps {
  enrolledCourses: any[];
  createdCourses: any[];
  enrolledCoursesError: string | null;
  createdCoursesError: string | null;
  user: any;
}

export const MyCoursesDashboardEnterprise = ({
  enrolledCourses = [],
  createdCourses = [],
  enrolledCoursesError,
  createdCoursesError,
  user,
}: MyCoursesDashboardProps) => {
  const [tab, setTab] = useState<'enrolled' | 'created'>('enrolled');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    category: 'all',
    progress: 'all',
    sortBy: 'recent',
  });

  // Safe data processing - wrap in useMemo to prevent recreating on every render
  const safeEnrolledCourses = useMemo(
    () => (Array.isArray(enrolledCourses) ? enrolledCourses : []),
    [enrolledCourses]
  );
  const safeCreatedCourses = useMemo(
    () => (Array.isArray(createdCourses) ? createdCourses : []),
    [createdCourses]
  );

  // Filter and sort courses
  const filteredEnrolledCourses = useMemo(() => {
    return safeEnrolledCourses
      .filter((course) => {
        try {
          const title = course?.title || '';
          if (searchQuery && !title.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
          }

          const categoryName = course?.category?.name || '';
          if (filters.category !== 'all' && categoryName !== filters.category) {
            return false;
          }

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
  }, [safeEnrolledCourses, searchQuery, filters]);

  const filteredCreatedCourses = useMemo(() => {
    return safeCreatedCourses
      .filter((course) => {
        try {
          const title = course?.title || '';
          if (searchQuery && !title.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
          }

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
  }, [safeCreatedCourses, searchQuery, filters]);

  // Calculate stats
  const stats = useMemo(() => {
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

    const avgCompletionRate =
      totalEnrolledCourses > 0
        ? Math.round(
            safeEnrolledCourses.reduce(
              (acc, course) => acc + (course?.completionPercentage || 0),
              0
            ) / totalEnrolledCourses
          )
        : 0;

    const learningStreak = 7; // Mock data

    return {
      totalEnrolledCourses,
      completedCourses,
      inProgressCourses,
      totalCreatedCourses,
      totalStudents,
      avgCompletionRate,
      learningStreak,
    };
  }, [safeEnrolledCourses, safeCreatedCourses]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  return (
    <div className="w-full min-h-screen pb-6 pt-2 sm:pt-3 md:pt-4">
      {/* Enhanced Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative mb-4 sm:mb-5 md:mb-6 overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-500 dark:from-blue-600 dark:to-indigo-600 shadow-xl"
      >
        {/* Static Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-300/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-blue-300/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <div className="relative z-10 px-3 sm:px-4 md:px-5 lg:px-6 py-4 sm:py-6 md:py-7 lg:py-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6 lg:gap-8">
            {/* User Info & Greeting */}
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl sm:text-2xl lg:text-3xl font-bold text-white border-2 border-white/30 shadow-lg">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-emerald-500 rounded-full border-2 sm:border-4 border-blue-500 dark:border-blue-600 shadow-md"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm md:text-base text-white/80 font-medium mb-0.5 sm:mb-1">
                    Welcome back,
                  </p>
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white truncate">
                    {user?.name || 'Learner'}
                  </h1>
                </div>
              </div>
              <p className="text-sm sm:text-base md:text-lg text-white/90 max-w-2xl leading-relaxed mb-4 sm:mb-6">
                Continue your learning journey and track your progress across all courses
              </p>

              {/* Quick Stats Pills */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                  <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-orange-300 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-white whitespace-nowrap">
                    {stats.learningStreak} day streak
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                  <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-300 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-white whitespace-nowrap">
                    {stats.completedCourses} completed
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                  <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-amber-300 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-white whitespace-nowrap">
                    {stats.avgCompletionRate}% avg progress
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 sm:gap-3 w-full sm:w-auto lg:w-auto">
              <Link href="/courses" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-white hover:bg-white/90 text-indigo-600 font-semibold shadow-lg hover:shadow-xl transition-all h-9 sm:h-10 text-sm sm:text-base">
                  <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                  Explore Courses
                </Button>
              </Link>
              <Link href="/teacher/courses/create" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white font-semibold backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl transition-all h-9 sm:h-10 text-sm sm:text-base">
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                  Create Course
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative Border */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 mb-4 sm:mb-5 md:mb-6"
      >
        <motion.div variants={itemVariants}>
          <CourseStats
            title="Total Enrolled"
            value={stats.totalEnrolledCourses}
            icon={<BookOpen className="w-5 h-5 text-blue-500" />}
            change="+3 this month"
            positive={true}
            color="blue"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <CourseStats
            title="Completed"
            value={stats.completedCourses}
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            change={`${stats.avgCompletionRate}% avg`}
            positive={true}
            color="green"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <CourseStats
            title="In Progress"
            value={stats.inProgressCourses}
            icon={<TrendingUp className="w-5 h-5 text-orange-500" />}
            change="Keep going!"
            positive={true}
            color="orange"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <CourseStats
            title="Created"
            value={stats.totalCreatedCourses}
            icon={<Award className="w-5 h-5 text-purple-500" />}
            change={`${stats.totalStudents} students`}
            positive={stats.totalCreatedCourses > 0}
            color="purple"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <CourseStats
            title="Learning Streak"
            value={`${stats.learningStreak}d`}
            icon={<Zap className="w-5 h-5 text-amber-500" />}
            change="Personal best!"
            positive={true}
            color="amber"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <CourseStats
            title="This Month"
            value="24h"
            icon={<Calendar className="w-5 h-5 text-indigo-500" />}
            change="Learning time"
            positive={true}
            color="indigo"
          />
        </motion.div>
      </motion.div>

      {/* Analytics Banner for Creators */}
      <AnimatePresence>
        {stats.totalCreatedCourses > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-4 sm:mb-5 md:mb-6"
          >
            <Link href="/my-courses/analytics">
              <div className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 p-4 sm:p-5 md:p-6 lg:p-8 hover:shadow-2xl transition-all duration-300 cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>

                <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-5 md:gap-6">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">Course Creator Analytics</h3>
                      <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm text-xs sm:text-sm">
                        Premium
                      </Badge>
                    </div>
                    <p className="text-white/90 mb-3 sm:mb-4 text-sm sm:text-base md:text-lg leading-relaxed">
                      Track your impact! See how <strong>{stats.totalStudents}</strong> learners are
                      engaging with your <strong>{stats.totalCreatedCourses}</strong>{' '}
                      {stats.totalCreatedCourses === 1 ? 'course' : 'courses'}.
                    </p>
                    <div className="flex items-center text-white font-medium group-hover:gap-3 gap-2 transition-all text-sm sm:text-base">
                      View Detailed Analytics
                      <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </div>
                  </div>

                  <div className="hidden lg:block p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                    <BarChart3 className="w-16 h-16 text-white/60" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-3xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 overflow-hidden"
      >
        {/* Enhanced Header with Tabs */}
        <div className="border-b border-slate-200/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm">
          <div className="p-3 sm:p-4 lg:p-5">
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Tabs */}
              <Tabs
                value={tab}
                onValueChange={(v) => setTab(v as any)}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 rounded-lg sm:rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                  <TabsTrigger
                    value="enrolled"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 rounded-md sm:rounded-lg px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 font-semibold text-xs sm:text-sm"
                  >
                    <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    <span className="hidden xs:inline sm:hidden">Enrolled</span>
                    <span className="hidden sm:inline">Enrolled Courses</span>
                    <Badge className="ml-1.5 sm:ml-2 bg-white/20 text-current border-none text-[10px] sm:text-xs px-1 sm:px-1.5">
                      {stats.totalEnrolledCourses}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="created"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 rounded-md sm:rounded-lg px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 font-semibold text-xs sm:text-sm"
                  >
                    <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    <span className="hidden xs:inline sm:hidden">Created</span>
                    <span className="hidden sm:inline">My Courses</span>
                    <Badge className="ml-1.5 sm:ml-2 bg-white/20 text-current border-none text-[10px] sm:text-xs px-1 sm:px-1.5">
                      {stats.totalCreatedCourses}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Search, Filter, View Controls */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-lg sm:rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all shadow-sm"
                  />
                  <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setFilterOpen(!filterOpen)}
                  className={cn(
                    'rounded-lg sm:rounded-xl transition-all bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-sm h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0',
                    filterOpen &&
                      'bg-blue-100/80 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
                  )}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>

                <div className="hidden sm:flex items-center gap-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-1 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'rounded-md sm:rounded-lg h-8 w-8 sm:h-9 sm:w-9',
                      viewMode === 'grid' &&
                        'bg-blue-500 text-white dark:bg-blue-600 shadow-md hover:bg-blue-600 dark:hover:bg-blue-700'
                    )}
                  >
                    <Grid3x3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'rounded-md sm:rounded-lg h-8 w-8 sm:h-9 sm:w-9',
                      viewMode === 'list' &&
                        'bg-blue-500 text-white dark:bg-blue-600 shadow-md hover:bg-blue-600 dark:hover:bg-blue-700'
                    )}
                  >
                    <LayoutList className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Filter Panel */}
            <AnimatePresence>
              {filterOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <CoursesFilterMenu
                    filters={filters}
                    setFilters={setFilters}
                    onClose={() => setFilterOpen(false)}
                    activeTab={tab}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Courses Content */}
        <div className="p-4 sm:p-5 lg:p-6">
          {/* Enrolled Courses */}
          {tab === 'enrolled' && (
            <>
              {enrolledCoursesError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50/80 dark:bg-red-950/20 backdrop-blur-sm border border-red-200/50 dark:border-red-800/50 rounded-xl text-red-600 dark:text-red-400 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Error:</span> {enrolledCoursesError}
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
                  icon={<BookMarked className="w-12 h-12 text-slate-400" />}
                  actionLink="/courses"
                  actionText="Browse Courses"
                />
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className={cn(
                    'grid gap-3 sm:gap-4 md:gap-5',
                    viewMode === 'grid'
                      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
                      : 'grid-cols-1'
                  )}
                >
                  {filteredEnrolledCourses.map((course, index) => (
                    <motion.div
                      key={course?.id || index}
                      variants={itemVariants}
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    >
                      <CourseCard course={course} type="enrolled" />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </>
          )}

          {/* Created Courses */}
          {tab === 'created' && (
            <>
              {createdCoursesError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50/80 dark:bg-red-950/20 backdrop-blur-sm border border-red-200/50 dark:border-red-800/50 rounded-xl text-red-600 dark:text-red-400 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Error:</span> {createdCoursesError}
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                  <Link href="/my-courses/analytics" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all h-9 sm:h-10 text-sm sm:text-base">
                      <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                      View Analytics
                    </Button>
                  </Link>
                  <Link href="/teacher/courses/create" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg transition-all h-9 sm:h-10 text-sm sm:text-base">
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                      Create New Course
                    </Button>
                  </Link>
                </div>
              </div>

              {filteredCreatedCourses.length === 0 ? (
                <EmptyState
                  title="You haven't created any courses yet"
                  description="Share your knowledge with the world by creating your first course"
                  icon={<GraduationCap className="w-12 h-12 text-slate-400" />}
                  actionLink="/teacher/courses/create"
                  actionText="Create Course"
                />
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className={cn(
                    'grid gap-3 sm:gap-4 md:gap-5',
                    viewMode === 'grid'
                      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
                      : 'grid-cols-1'
                  )}
                >
                  {filteredCreatedCourses.map((course, index) => (
                    <motion.div
                      key={course?.id || index}
                      variants={itemVariants}
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    >
                      <CourseCard course={course} type="created" />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
