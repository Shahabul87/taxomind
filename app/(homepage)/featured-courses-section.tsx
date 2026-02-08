'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion, useInView } from '@/components/lazy-motion';
import Link from 'next/link';
import { CourseCardHome } from "@/components/course-card-home";
import {
  BookOpen,
  GraduationCap,
  Code,
  Briefcase,
  ArrowRight,
  Sparkles,
  Grid3X3,
  List,
  LayoutGrid
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Helper function to extract text from HTML
const extractTextFromHtml = (html: string | null): string => {
  if (!html) return '';
  return html.replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
};

type CourseCategory = {
  name: string;
} | null;

type CourseWithProgressWithCategory = {
  id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  price?: number | null;
  isPublished: boolean;
  isFeatured: boolean;
  category: CourseCategory;
  chapters: { id: string }[];
  cleanDescription?: string;
  averageRating?: number | null;
  enrollmentCount?: number;
  createdAt: Date;
  updatedAt: Date;
};

interface FeaturedCoursesProps {
  courses: CourseWithProgressWithCategory[];
}

type CategoryKey = 'all' | 'programming' | 'design' | 'business' | 'other';
type ViewMode = 'grid' | 'list' | 'compact';
type SortOption = 'featured' | 'newest' | 'popular' | 'price-low' | 'price-high';

const CATEGORIES = [
  { key: 'all' as CategoryKey, label: 'All Courses', icon: BookOpen, gradient: 'from-blue-500 to-indigo-500' },
  { key: 'programming' as CategoryKey, label: 'Programming', icon: Code, gradient: 'from-emerald-500 to-teal-500' },
  { key: 'design' as CategoryKey, label: 'Design', icon: GraduationCap, gradient: 'from-purple-500 to-pink-500' },
  { key: 'business' as CategoryKey, label: 'Business', icon: Briefcase, gradient: 'from-orange-500 to-red-500' },
];

export const FeaturedCoursesSection = ({ courses }: FeaturedCoursesProps) => {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-50px' });

  // Process courses to ensure cleanDescription
  const processedCourses = courses.map(course => {
    let description = course.cleanDescription;
    if (!description && course.description) {
      description = extractTextFromHtml(course.description);
    }
    return {
      ...course,
      processedDescription: description || "No description available"
    };
  });

  // Filter courses by category
  const filteredCourses = activeCategory === 'all'
    ? processedCourses
    : processedCourses.filter(course => {
        const categoryName = course.category?.name?.toLowerCase() || '';
        if (activeCategory === 'programming') return categoryName.includes('programming') || categoryName.includes('code') || categoryName.includes('development');
        if (activeCategory === 'design') return categoryName.includes('design') || categoryName.includes('ui') || categoryName.includes('ux');
        if (activeCategory === 'business') return categoryName.includes('business') || categoryName.includes('management');
        return false;
      });

  // Apply sorting
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'price-low':
        return (a.price || 0) - (b.price || 0);
      case 'price-high':
        return (b.price || 0) - (a.price || 0);
      case 'popular':
        return b.chapters.length - a.chapters.length;
      default:
        return 0;
    }
  });

  // Clear all filters
  const clearFilters = () => {
    setActiveCategory('all');
    setSortBy('featured');
  };

  // Simplified animation variants for better performance
  const fadeInUp = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.25,
        ease: "easeOut" as const,
      },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.03,
      },
    },
  };

  return (
    <div className="relative bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      {/* Hero Section — tighter spacing, no gap between heading and controls */}
      <section className="relative overflow-hidden pt-12 pb-4 sm:pt-20 sm:pb-6 md:pt-24 md:pb-8">
        {/* Subtle animated background pattern */}
        <div className="absolute inset-0 opacity-20 sm:opacity-30" aria-hidden="true">
          <div className="absolute top-20 left-4 sm:left-10 w-48 h-48 sm:w-72 sm:h-72 bg-blue-200 dark:bg-blue-900/20 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-2xl sm:blur-3xl motion-safe:animate-pulse motion-reduce:animate-none" />
          <div className="absolute top-40 right-4 sm:right-20 w-64 h-64 sm:w-96 sm:h-96 bg-indigo-200 dark:bg-indigo-900/20 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-2xl sm:blur-3xl motion-safe:animate-pulse motion-reduce:animate-none" style={{ animationDelay: '1s' }} />
        </div>

        <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Heading — left-aligned, single line */}
          <motion.div
            className="mb-6 sm:mb-8"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            style={{ willChange: 'transform, opacity' }}
          >
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              {/* Left — title block */}
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-500/30 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                    {sortedCourses.length} Courses Available
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Featured{' '}
                  <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                    Learning Paths
                  </span>
                </h2>
                <p className="mt-1.5 text-sm sm:text-base text-slate-500 dark:text-slate-400">
                  Discover and explore our curated collection of courses
                </p>
              </div>

              {/* Right — Browse all link */}
              <Link
                href="/courses"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors group whitespace-nowrap"
              >
                Browse all courses
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content Section */}
      <section ref={sectionRef} className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 md:pb-20 lg:pb-24">
        {/* Controls Bar — single row: filters left, count + view toggle right */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
            {/* Left — Filters */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
              <Select value={activeCategory} onValueChange={(value) => setActiveCategory(value as CategoryKey)}>
                <SelectTrigger
                  className="w-full sm:w-48 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10"
                  aria-label="Browse categories"
                >
                  <SelectValue placeholder="Browse Categories" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => {
                    const Icon = category.icon;
                    return (
                      <SelectItem key={category.key} value={category.key}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{category.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger
                  className="w-full sm:w-44 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10"
                  aria-label="Sort courses by"
                >
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>

              {activeCategory !== 'all' && (
                <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs sm:text-sm self-center">
                  {CATEGORIES.find(c => c.key === activeCategory)?.label}
                </Badge>
              )}
            </div>

            {/* Right — Count + View Toggle */}
            <div className="flex items-center gap-3 justify-between sm:justify-end">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                {sortedCourses.length} {sortedCourses.length === 1 ? 'Course' : 'Courses'}
              </span>
              <div className="hidden md:flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none h-9 w-9"
                  aria-label="Grid view"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className="rounded-none border-x border-slate-200 dark:border-slate-700 h-9 w-9"
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'compact' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('compact')}
                  className="rounded-l-none h-9 w-9"
                  aria-label="Compact view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Course Cards Grid (Full Width) */}
        <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeCategory}-${sortBy}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: shouldReduceMotion ? 0.01 : 0.3 }}
              >
                {sortedCourses.length > 0 ? (
                  <motion.div
                    className={cn(
                      'grid gap-4 sm:gap-5 md:gap-6',
                      viewMode === 'grid' && 'grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
                      viewMode === 'list' && 'grid-cols-1',
                      viewMode === 'compact' && 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                    )}
                    variants={staggerContainer}
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                    style={{ willChange: 'opacity' }}
                  >
                    {sortedCourses.slice(0, 12).map((course, index) => (
                      <motion.div
                        key={course.id}
                        variants={fadeInUp}
                        transition={{ delay: index * 0.05 }}
                      >
                        <CourseCardHome
                          id={course.id}
                          title={course.title}
                          cleanDescription={course.processedDescription}
                          imageUrl={course.imageUrl ?? ""}
                          chaptersLength={course.chapters?.length || 0}
                          price={course.price || 0}
                          category={course?.category?.name || "General"}
                          priority={index < 4}
                          rating={course.averageRating}
                          enrollmentCount={course.enrollmentCount ?? 0}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="col-span-full">
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 text-center">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400 dark:text-slate-500" />
                      </div>
                      <p className="text-base sm:text-lg font-medium text-slate-600 dark:text-slate-400">
                        No courses found matching your criteria
                      </p>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500 mt-2">
                        Try adjusting your category or sort filters
                      </p>
                      {activeCategory !== 'all' && (
                        <Button
                          variant="outline"
                          className="mt-4 sm:mt-6 text-sm"
                          onClick={clearFilters}
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* View All CTA */}
                {sortedCourses.length > 12 && (
                  <motion.div
                    className="mt-6 sm:mt-8 flex justify-center px-4"
                    variants={fadeInUp}
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                    transition={{ delay: 0.6 }}
                  >
                    <Link
                      href="/courses"
                      className="group inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold text-sm sm:text-base"
                    >
                      View All {sortedCourses.length} Courses
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
        </div>
      </section>
    </div>
  );
};
