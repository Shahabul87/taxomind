'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion, useInView } from 'framer-motion';
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

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.01 : 0.6,
      },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  };

  return (
    <div className="relative bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-12 sm:pt-24 sm:pb-16">
        {/* Subtle animated background pattern */}
        <div className="absolute inset-0 opacity-30" aria-hidden="true">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 dark:bg-blue-900/20 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-3xl animate-pulse" />
          <div className="absolute top-40 right-20 w-96 h-96 bg-indigo-200 dark:bg-indigo-900/20 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Heading */}
          <motion.div
            className="mb-12 text-center"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-blue-200/50 dark:border-blue-500/30 shadow-sm mb-4">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {sortedCourses.length} Courses Available
              </span>
            </div>

            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight text-slate-900 dark:text-white mb-4">
              <span className="block">Featured</span>
              <span className="block bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                Learning Paths
              </span>
            </h2>
            <p className="mt-4 text-base sm:text-lg md:text-xl leading-relaxed text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Discover and explore our curated collection of courses
            </p>
          </motion.div>

        </div>
      </section>

      {/* Main Content Section */}
      <section ref={sectionRef} className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 lg:pb-24">
        {/* Controls Bar */}
        <div className="mb-8 space-y-4">
          {/* Category Select and Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Left side controls */}
            <div className="flex gap-3 items-center flex-wrap">
              {/* Category Select */}
              <Select value={activeCategory} onValueChange={(value) => setActiveCategory(value as CategoryKey)}>
                <SelectTrigger className="w-52 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
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

              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-48 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
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
            </div>

            {/* Right side - View Mode Toggle */}
            <div className="flex gap-3 items-center">
              <div className="hidden md:flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className="rounded-none border-x border-slate-200 dark:border-slate-700"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'compact' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('compact')}
                  className="rounded-l-none"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Results Info */}
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              {sortedCourses.length} {sortedCourses.length === 1 ? 'Course' : 'Courses'}
            </h3>
            {activeCategory !== 'all' && (
              <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                {CATEGORIES.find(c => c.key === activeCategory)?.label}
              </Badge>
            )}
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
                      'grid gap-6',
                      viewMode === 'grid' && 'sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
                      viewMode === 'list' && 'grid-cols-1',
                      viewMode === 'compact' && 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                    )}
                    variants={staggerContainer}
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
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
                          imageUrl={course.imageUrl || ""}
                          chaptersLength={course.chapters?.length || 0}
                          price={course.price || 0}
                          category={course?.category?.name || "General"}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="col-span-full">
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg rounded-3xl p-12 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                      </div>
                      <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
                        No courses found matching your criteria
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                        Try adjusting your category or sort filters
                      </p>
                      {activeCategory !== 'all' && (
                        <Button
                          variant="outline"
                          className="mt-6"
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
                    className="mt-8 flex justify-center"
                    variants={fadeInUp}
                    initial="hidden"
                    animate={isInView ? 'visible' : 'hidden'}
                    transition={{ delay: 0.6 }}
                  >
                    <Link
                      href="/courses"
                      className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold"
                    >
                      View All {sortedCourses.length} Courses
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
