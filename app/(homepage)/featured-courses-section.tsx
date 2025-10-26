'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { CourseCardHome } from "@/components/course-card-home";
import { BookOpen, GraduationCap, Code, Briefcase } from 'lucide-react';

// Helper function to extract text from HTML
const extractTextFromHtml = (html: string | null): string => {
  if (!html) return '';
  // Remove HTML tags
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

const CATEGORIES = [
  { key: 'all' as CategoryKey, label: 'All Courses', icon: <BookOpen className="h-5 w-5" /> },
  { key: 'programming' as CategoryKey, label: 'Programming', icon: <Code className="h-5 w-5" /> },
  { key: 'design' as CategoryKey, label: 'Design', icon: <GraduationCap className="h-5 w-5" /> },
  { key: 'business' as CategoryKey, label: 'Business', icon: <Briefcase className="h-5 w-5" /> },
];

export const FeaturedCoursesSection = ({ courses }: FeaturedCoursesProps) => {
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');

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

  return (
    <section className="relative overflow-hidden py-20 bg-background" aria-labelledby="featured-courses-heading">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        {/* Section Heading */}
        <div className="mb-16 text-center">
          <h2
            id="featured-courses-heading"
            className="relative inline-block text-[clamp(2rem,5vw,3.75rem)] font-bold tracking-tight text-foreground"
          >
            <span
              className="absolute inset-x-0 bottom-2 -z-10 h-4 bg-lime-500/20"
              aria-hidden="true"
            />
            Featured Courses
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Explore our most popular courses and start learning today
          </p>
        </div>

        {/* Main Content Grid - 4 columns: 1 for categories, 3 for course cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Left Column: Category List (1/4 width) */}
          <div className="lg:col-span-1">
            <div>
              <h3 className="mb-6 text-xl font-semibold text-foreground">Browse by Category</h3>

              {/* Category list with hover effects */}
              <ul className="space-y-3">
                {CATEGORIES.map((category) => {
                  const isActive = activeCategory === category.key;
                  return (
                    <li key={category.key}>
                      <button
                        onClick={() => setActiveCategory(category.key)}
                        className={`w-full group flex items-center gap-3 rounded-lg py-2 pr-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                          isActive
                            ? 'bg-surface-muted'
                            : 'hover:bg-surface-muted'
                        }`}
                      >
                        {/* Icon */}
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center transition-colors ${
                            isActive
                              ? 'text-brand'
                              : 'text-muted-foreground'
                          }`}
                          aria-hidden="true"
                        >
                          {category.icon}
                        </span>

                        {/* Label */}
                        <span className={`text-sm font-medium transition-colors ${
                          isActive
                            ? 'text-brand'
                            : 'text-foreground group-hover:text-brand'
                        }`}>
                          {category.label}
                        </span>

                        {/* Active indicator */}
                        {isActive && (
                          <motion.div
                            className="ml-auto h-2 w-2 rounded-full bg-brand"
                            layoutId="categoryActiveIndicator"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* Course count info */}
              <div className="mt-6 text-sm text-muted-foreground">
                Showing {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} in {CATEGORIES.find(c => c.key === activeCategory)?.label}
              </div>
            </div>
          </div>

          {/* Right Column: Course Cards Grid (3/4 width) */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                <div className="grid gap-5 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {filteredCourses.length > 0 ? (
                    filteredCourses.slice(0, 6).map((course) => (
                      <CourseCardHome
                        key={course.id}
                        id={course.id}
                        title={course.title}
                        cleanDescription={course.processedDescription}
                        imageUrl={course.imageUrl || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgICAgPGRlZnM+CiAgICAgICAgPGxpbmVhckdyYWRpZW50IGlkPSJncmFkMSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojNjM2NkYxO3N0b3Atb3BhY2l0eToxIiAvPgogICAgICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojQTg1NUY3O3N0b3Atb3BhY2l0eToxIiAvPgogICAgICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICAgIDwvZGVmcz4KICAgICAgPHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI0NTAiIGZpbGw9InVybCgjZ3JhZDEpIi8+CiAgICAgIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9InN5c3RlbS11aSIgZm9udC1zaXplPSI0MCIgZm9udC13ZWlnaHQ9ImJvbGQiPgogICAgICAgIENvdXJzZQogICAgICA8L3RleHQ+CiAgICA8L3N2Zz4="}
                        chaptersLength={course.chapters?.length || 0}
                        price={course.price || 0}
                        category={course?.category?.name || "General"}
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <p className="text-muted-foreground">No courses found in this category.</p>
                    </div>
                  )}
                </div>

                {/* View All CTA (similar to CTA pill in hero-three) */}
                {filteredCourses.length > 6 && (
                  <div className="mt-6">
                    <Link
                      href="/courses"
                      className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand/90 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      View All {filteredCourses.length} Courses
                    </Link>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}; 
