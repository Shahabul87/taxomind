'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Trophy,
  Search,
  CheckCircle2,
  Zap,
  TrendingUp,
  Calendar,
  Plus,
  Award,
  GraduationCap,
  BookMarked,
  Grid3x3,
  LayoutList,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
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
import type { EnrolledCourse, CreatedCourse, CourseFilters } from './types';

const ITEMS_PER_PAGE = 12;

interface LearningStats {
  currentStreak: number;
  longestStreak: number;
  learningTimeDisplay: string;
  enrollmentsThisMonth: number;
}

interface MyCoursesDashboardProps {
  enrolledCourses: EnrolledCourse[];
  createdCourses: CreatedCourse[];
  enrolledCoursesError: string | null;
  createdCoursesError: string | null;
  user: { id?: string; name?: string | null; image?: string | null; email?: string | null };
  learningStats?: LearningStats;
}

export const MyCoursesDashboardEnterprise = ({
  enrolledCourses = [],
  createdCourses = [],
  enrolledCoursesError,
  createdCoursesError,
  user,
  learningStats,
}: MyCoursesDashboardProps) => {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<'enrolled' | 'created'>('enrolled');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<CourseFilters>({
    category: 'all',
    progress: 'all',
    sortBy: 'recent',
    status: 'all',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset page when tab, search, or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [tab, searchQuery, filters]);

  const safeEnrolledCourses = useMemo(
    () => (Array.isArray(enrolledCourses) ? enrolledCourses : []),
    [enrolledCourses]
  );
  const safeCreatedCourses = useMemo(
    () => (Array.isArray(createdCourses) ? createdCourses : []),
    [createdCourses]
  );

  // Derive unique categories from actual course data
  const availableCategories = useMemo(() => {
    const courses = tab === 'enrolled' ? safeEnrolledCourses : safeCreatedCourses;
    const names = new Set<string>();
    for (const course of courses) {
      if (course?.category?.name) {
        names.add(course.category.name);
      }
    }
    return Array.from(names).sort();
  }, [tab, safeEnrolledCourses, safeCreatedCourses]);

  // Filter and sort enrolled courses
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
          if (filters.progress === 'completed' && completionPercentage < 100) return false;
          if (
            filters.progress === 'in-progress' &&
            (completionPercentage === 0 || completionPercentage === 100)
          ) {
            return false;
          }
          if (filters.progress === 'not-started' && completionPercentage > 0) return false;
          return true;
        } catch (error: unknown) {
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
          if (filters.sortBy === 'title') return (a?.title || '').localeCompare(b?.title || '');
          if (filters.sortBy === 'progress') {
            return (b?.completionPercentage || 0) - (a?.completionPercentage || 0);
          }
          if (filters.sortBy === 'rating') return (b?.averageRating || 0) - (a?.averageRating || 0);
          return 0;
        } catch (error: unknown) {
          logger.warn('Error sorting enrolled courses:', error);
          return 0;
        }
      });
  }, [safeEnrolledCourses, searchQuery, filters]);

  // Filter and sort created courses
  const filteredCreatedCourses = useMemo(() => {
    return safeCreatedCourses
      .filter((course) => {
        try {
          const title = course?.title || '';
          if (searchQuery && !title.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
          }
          const categoryName = course?.category?.name || '';
          if (filters.category !== 'all' && categoryName !== filters.category) return false;
          if (filters.status === 'published' && !course.isPublished) return false;
          if (filters.status === 'draft' && course.isPublished) return false;
          return true;
        } catch (error: unknown) {
          logger.warn('Error filtering created course:', error);
          return false;
        }
      })
      .sort((a, b) => {
        try {
          if (filters.sortBy === 'recent') {
            return new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime();
          }
          if (filters.sortBy === 'title') return (a?.title || '').localeCompare(b?.title || '');
          if (filters.sortBy === 'students') {
            return (b?.totalEnrolled || 0) - (a?.totalEnrolled || 0);
          }
          if (filters.sortBy === 'rating') return (b?.averageRating || 0) - (a?.averageRating || 0);
          return 0;
        } catch (error: unknown) {
          logger.warn('Error sorting created courses:', error);
          return 0;
        }
      });
  }, [safeCreatedCourses, searchQuery, filters]);

  // Pagination
  const activeCourses = tab === 'enrolled' ? filteredEnrolledCourses : filteredCreatedCourses;
  const totalPages = Math.ceil(activeCourses.length / ITEMS_PER_PAGE);
  const paginatedCourses = activeCourses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Calculate dashboard stats
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

    const publishedCount = safeCreatedCourses.filter((c) => c?.isPublished).length;
    const draftCount = totalCreatedCourses - publishedCount;

    return {
      totalEnrolledCourses,
      completedCourses,
      inProgressCourses,
      totalCreatedCourses,
      totalStudents,
      avgCompletionRate,
      learningStreak: learningStats?.currentStreak ?? 0,
      publishedCount,
      draftCount,
    };
  }, [safeEnrolledCourses, safeCreatedCourses, learningStats]);

  // Adaptive grid
  const getGridCols = (count: number) => {
    if (viewMode === 'list') return 'grid-cols-1';
    if (count <= 2) return 'grid-cols-1 sm:grid-cols-2';
    if (count <= 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const totalForCurrentTab =
    tab === 'enrolled' ? safeEnrolledCourses.length : safeCreatedCourses.length;
  const filteredCount = activeCourses.length;
  const hasActiveFilters =
    searchQuery !== '' ||
    filters.category !== 'all' ||
    filters.progress !== 'all' ||
    filters.status !== 'all';

  return (
    <div className="w-full min-h-screen pb-6 pt-2 sm:pt-3 md:pt-4 space-y-4 sm:space-y-5 md:space-y-6">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 shadow-lg"
      >
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-300/10 rounded-full blur-3xl translate-y-1/2 translate-x-1/2" />
        </div>

        <div className="relative z-10 px-4 sm:px-5 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-5">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl sm:text-2xl font-bold text-white border-2 border-white/30 shadow-lg">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-emerald-500 rounded-full border-2 border-blue-600 dark:border-blue-700 shadow-md" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-white/80 font-medium mb-0.5">
                    Welcome back,
                  </p>
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white truncate">
                    {user?.name || 'Learner'}
                  </h1>
                </div>
              </div>
              <p className="text-sm sm:text-base text-white/90 max-w-2xl leading-relaxed">
                Continue your learning journey and track your progress across all courses
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 sm:gap-3 w-full sm:w-auto">
              <Link href="/courses" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-white hover:bg-white/90 text-indigo-600 font-semibold shadow-lg hover:shadow-xl transition-all h-9 sm:h-10 text-sm">
                  <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                  Explore Courses
                </Button>
              </Link>
              <Link href="/teacher/create" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-white/20 hover:bg-white/30 text-white font-semibold backdrop-blur-sm border border-white/30 shadow-lg hover:shadow-xl transition-all h-9 sm:h-10 text-sm">
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                  Create Course
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 md:gap-4"
        role="region"
        aria-label="Learning statistics"
      >
        <motion.div variants={itemVariants}>
          <CourseStats
            title="Enrolled"
            value={stats.totalEnrolledCourses}
            icon={<BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />}
            subtitle={
              learningStats?.enrollmentsThisMonth
                ? `+${learningStats.enrollmentsThisMonth} this month`
                : 'This month'
            }
            color="blue"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <CourseStats
            title="Completed"
            value={stats.completedCourses}
            icon={
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
            }
            subtitle={`${stats.avgCompletionRate}% avg completion`}
            color="emerald"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <CourseStats
            title="In Progress"
            value={stats.inProgressCourses}
            icon={
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
            }
            subtitle={stats.inProgressCourses > 0 ? 'Keep going!' : 'Start a course'}
            color="orange"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <CourseStats
            title="Created"
            value={stats.totalCreatedCourses}
            icon={
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
            }
            subtitle={
              stats.publishedCount > 0
                ? `${stats.publishedCount} published, ${stats.draftCount} draft`
                : stats.totalStudents > 0
                  ? `${stats.totalStudents} students`
                  : 'No students yet'
            }
            color="purple"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <CourseStats
            title="Streak"
            value={`${stats.learningStreak}d`}
            icon={<Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />}
            subtitle={
              learningStats?.longestStreak
                ? `Best: ${learningStats.longestStreak}d`
                : 'Start a streak!'
            }
            color="amber"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <CourseStats
            title="This Month"
            value={learningStats?.learningTimeDisplay ?? '0h'}
            icon={
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
            }
            subtitle="Learning time"
            color="indigo"
          />
        </motion.div>
      </motion.div>

      {/* Main Content Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        {/* Header: Tabs + Search */}
        <div className="border-b border-slate-200 dark:border-slate-700">
          <div className="p-3 sm:p-4 lg:p-5 space-y-3 sm:space-y-4">
            {/* Tabs */}
            {mounted ? (
              <Tabs
                value={tab}
                onValueChange={(v) => setTab(v as 'enrolled' | 'created')}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <TabsTrigger
                    value="enrolled"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-all rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 font-semibold text-xs sm:text-sm"
                  >
                    <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline">Enrolled Courses</span>
                    <span className="sm:hidden">Enrolled</span>
                    <Badge className="ml-1.5 sm:ml-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-none text-[10px] sm:text-xs px-1.5 hover:bg-slate-200">
                      {stats.totalEnrolledCourses}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="created"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-all rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 font-semibold text-xs sm:text-sm"
                  >
                    <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline">Created Courses</span>
                    <span className="sm:hidden">Created</span>
                    <Badge className="ml-1.5 sm:ml-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-none text-[10px] sm:text-xs px-1.5 hover:bg-slate-200">
                      {stats.totalCreatedCourses}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            ) : (
              <div className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 h-[42px] sm:h-[46px]">
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm rounded-lg px-3 sm:px-4 py-2 font-semibold text-xs sm:text-sm">
                  <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Enrolled Courses</span>
                  <Badge className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-none text-[10px] sm:text-xs px-1.5 hover:bg-slate-200">
                    {stats.totalEnrolledCourses}
                  </Badge>
                </div>
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-slate-500 dark:text-slate-400 rounded-lg px-3 sm:px-4 py-2 font-semibold text-xs sm:text-sm">
                  <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Created Courses</span>
                  <Badge className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-none text-[10px] sm:text-xs px-1.5 hover:bg-slate-200">
                    {stats.totalCreatedCourses}
                  </Badge>
                </div>
              </div>
            )}

            {/* Search + Filter + View Toggle */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search courses"
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                />
                <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setFilterOpen(!filterOpen)}
                aria-label="Toggle filters"
                aria-expanded={filterOpen}
                className={cn(
                  'rounded-xl h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 border-slate-200 dark:border-slate-700 relative',
                  filterOpen &&
                    'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400'
                )}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white dark:border-slate-800" />
                )}
              </Button>

              <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  className={cn(
                    'rounded-lg h-8 w-8 sm:h-9 sm:w-9',
                    viewMode === 'grid' &&
                      'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm hover:bg-white dark:hover:bg-slate-800'
                  )}
                >
                  <Grid3x3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  className={cn(
                    'rounded-lg h-8 w-8 sm:h-9 sm:w-9',
                    viewMode === 'list' &&
                      'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm hover:bg-white dark:hover:bg-slate-800'
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
                  categories={availableCategories}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Courses Content */}
        <div className="p-4 sm:p-5 lg:p-6">
          {/* Result count */}
          {(hasActiveFilters || activeCourses.length > 0) && (
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {hasActiveFilters ? (
                  <>
                    Showing <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredCount}</span> of{' '}
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{totalForCurrentTab}</span> courses
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{totalForCurrentTab}</span>{' '}
                    {totalForCurrentTab === 1 ? 'course' : 'courses'}
                  </>
                )}
              </p>
              {tab === 'created' && stats.totalCreatedCourses > 0 && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {stats.publishedCount} published
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    {stats.draftCount} draft
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Enrolled Courses Tab */}
          {tab === 'enrolled' && (
            <>
              {enrolledCoursesError && (
                <div className="mb-4 p-3 sm:p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
                  <strong>Error:</strong> {enrolledCoursesError}
                </div>
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
                <>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className={cn('grid gap-4 sm:gap-5', getGridCols(paginatedCourses.length))}
                  >
                    {paginatedCourses.map((course, index) => (
                      <motion.div
                        key={course?.id || index}
                        variants={itemVariants}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                      >
                        <CourseCard course={course} type="enrolled" />
                      </motion.div>
                    ))}
                  </motion.div>
                  {totalPages > 1 && (
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              )}
            </>
          )}

          {/* Created Courses Tab */}
          {tab === 'created' && (
            <>
              {createdCoursesError && (
                <div className="mb-4 p-3 sm:p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
                  <strong>Error:</strong> {createdCoursesError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-5">
                <Link href="/my-courses/analytics" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-sm hover:shadow-md transition-all h-9 sm:h-10 text-sm">
                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                    View Analytics
                  </Button>
                </Link>
                <Link href="/teacher/create" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm hover:shadow-md transition-all h-9 sm:h-10 text-sm">
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                    Create New Course
                  </Button>
                </Link>
              </div>

              {filteredCreatedCourses.length === 0 ? (
                <EmptyState
                  title="No created courses yet"
                  description="Share your knowledge with the world by creating your first course"
                  icon={<GraduationCap className="w-12 h-12 text-slate-400" />}
                  actionLink="/teacher/create"
                  actionText="Create Course"
                />
              ) : (
                <>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className={cn('grid gap-4 sm:gap-5', getGridCols(paginatedCourses.length))}
                  >
                    {paginatedCourses.map((course, index) => (
                      <motion.div
                        key={course?.id || index}
                        variants={itemVariants}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                      >
                        <CourseCard course={course} type="created" />
                      </motion.div>
                    ))}
                  </motion.div>
                  {totalPages > 1 && (
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

/** Pagination controls */
function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-slate-200 dark:border-slate-700">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-lg h-8 w-8 sm:h-9 sm:w-9 border-slate-200 dark:border-slate-700 disabled:opacity-40"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </Button>

      {getPageNumbers().map((page, idx) =>
        page === 'ellipsis' ? (
          <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 text-sm">
            ...
          </span>
        ) : (
          <Button
            key={page}
            variant={currentPage === page ? 'default' : 'outline'}
            size="icon"
            onClick={() => onPageChange(page)}
            className={cn(
              'rounded-lg h-8 w-8 sm:h-9 sm:w-9 text-xs sm:text-sm font-medium',
              currentPage === page
                ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            )}
          >
            {page}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-lg h-8 w-8 sm:h-9 sm:w-9 border-slate-200 dark:border-slate-700 disabled:opacity-40"
        aria-label="Next page"
      >
        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </Button>
    </div>
  );
}
