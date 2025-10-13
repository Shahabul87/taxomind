# Enterprise Course Catalog - Implementation Guide

## 📋 Overview

This guide provides step-by-step instructions for implementing the enterprise course catalog system that transforms Taxomind into a world-class learning marketplace.

## 🎯 What You Have Now

I've created the complete architecture foundation:

1. **Architecture Document** (`ENTERPRISE_COURSE_CATALOG_ARCHITECTURE.md`)
   - Complete system architecture
   - Component hierarchy
   - Data models
   - API specifications
   - Performance requirements
   - Implementation phases

2. **TypeScript Types** (`types/enterprise-course-catalog.ts`)
   - 40+ interfaces and types
   - Complete type safety
   - Type guards and utilities
   - API response types
   - Component prop types

3. **State Management** (`stores/course-catalog-store.ts`)
   - Zustand store with persistence
   - Complete filter state management
   - 30+ actions for all filters
   - Selectors for optimization
   - Filter presets

## 📦 Required Dependencies

Add these to your `package.json`:

```bash
npm install zustand @tanstack/react-query @tanstack/react-virtual
npm install framer-motion
npm install react-intersection-observer
npm install algoliasearch react-instantsearch-dom  # For search
npm install date-fns  # For date formatting
npm install clsx tailwind-merge  # For className utilities
```

## 🏗️ Implementation Steps

### Phase 1: Core Infrastructure (Week 1)

#### Step 1.1: Install Dependencies
```bash
npm install zustand @tanstack/react-query @tanstack/react-virtual framer-motion
```

#### Step 1.2: Setup React Query Provider

**File**: `app/layout.tsx`

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

#### Step 1.3: Create API Routes

**File**: `app/api/courses/enterprise/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { FilterState, EnterpriseCourse } from '@/types/enterprise-course-catalog';

export async function POST(request: NextRequest) {
  try {
    const filters: FilterState = await request.json();

    // Build Prisma query based on filters
    const where = buildWhereClause(filters);
    const orderBy = buildOrderByClause(filters.sortBy);

    const [courses, total] = await Promise.all([
      db.course.findMany({
        where,
        orderBy,
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
        include: {
          category: true,
          user: true,
          chapters: { select: { id: true } },
          reviews: { select: { rating: true } },
          _count: {
            select: {
              Enrollment: true,
              Purchase: true,
            },
          },
        },
      }),
      db.course.count({ where }),
    ]);

    // Transform to EnterpriseCourse format
    const enterpriseCourses = courses.map(transformToEnterpriseCourse);

    return NextResponse.json({
      success: true,
      courses: enterpriseCourses,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      hasMore: total > filters.page * filters.pageSize,
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch courses',
        },
      },
      { status: 500 }
    );
  }
}

function buildWhereClause(filters: FilterState) {
  const where: any = { isPublished: true };

  // Search query
  if (filters.searchQuery.trim()) {
    where.OR = [
      { title: { contains: filters.searchQuery, mode: 'insensitive' } },
      { description: { contains: filters.searchQuery, mode: 'insensitive' } },
    ];
  }

  // Categories
  if (filters.selectedCategories.length > 0) {
    where.categoryId = { in: filters.selectedCategories };
  }

  // Price range
  if (filters.freeOnly) {
    where.price = 0;
  } else if (filters.priceRange.min > 0 || filters.priceRange.max < 1000) {
    where.price = {
      gte: filters.priceRange.min,
      lte: filters.priceRange.max,
    };
  }

  return where;
}

function buildOrderByClause(sortBy: string) {
  switch (sortBy) {
    case 'newest':
      return { createdAt: 'desc' };
    case 'price-asc':
      return { price: 'asc' };
    case 'price-desc':
      return { price: 'desc' };
    default:
      return { createdAt: 'desc' };
  }
}

function transformToEnterpriseCourse(course: any): EnterpriseCourse {
  // Transform Prisma course to EnterpriseCourse format
  // This is where you map database fields to the enterprise structure
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    cleanDescription: course.cleanDescription,
    imageUrl: course.imageUrl,
    price: course.price,
    isPublished: course.isPublished,
    isFeatured: course.isFeatured,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    // ... add all other required fields
  };
}
```

#### Step 1.4: Create Custom Hooks

**File**: `hooks/use-courses.ts`

```typescript
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useCourseCatalogStore, selectFilters } from '@/stores/course-catalog-store';
import type { EnterpriseCourse, CoursesApiResponse } from '@/types/enterprise-course-catalog';

export const useCourses = () => {
  const filters = useCourseCatalogStore(selectFilters);

  return useInfiniteQuery({
    queryKey: ['courses', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetch('/api/courses/enterprise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...filters, page: pageParam }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      return response.json() as Promise<CoursesApiResponse>;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined;
    },
  });
};
```

### Phase 2: Enhanced Course Cards (Week 2)

#### Step 2.1: Create Enhanced Course Card Component

**File**: `components/courses/enhanced-course-card.tsx`

```typescript
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Star,
  Clock,
  Users,
  BookOpen,
  Award,
  ShoppingCart,
  Heart,
  Play,
} from 'lucide-react';
import type { EnterpriseCourse, EnhancedCourseCardProps } from '@/types/enterprise-course-catalog';

export const EnhancedCourseCard = ({
  course,
  viewMode,
  position,
  onCardClick,
  onPreviewClick,
  onAddToCart,
  onAddToWishlist,
}: EnhancedCourseCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (viewMode === 'grid') {
    return <GridCourseCard {...arguments} />;
  } else if (viewMode === 'list') {
    return <ListCourseCard {...arguments} />;
  } else {
    return <CompactCourseCard {...arguments} />;
  }
};

const GridCourseCard = ({ course }: { course: EnterpriseCourse }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={`/courses/${course.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.3 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 shadow-md hover:shadow-2xl transition-all duration-300 h-[450px]"
      >
        {/* Thumbnail Section */}
        <div className="relative h-48 overflow-hidden">
          <Image
            src={course.imageUrl || '/placeholder.svg'}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {course.badges.map((badge) => (
              <span
                key={badge}
                className="px-2 py-1 text-xs font-semibold bg-purple-600 text-white rounded-full"
              >
                {badge}
              </span>
            ))}
          </div>

          {/* Price Tag */}
          <div className="absolute top-3 right-3">
            <div className="bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full">
              {course.pricing.discount ? (
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-sm">
                    ${course.pricing.current}
                  </span>
                  <span className="text-gray-300 line-through text-xs">
                    ${course.pricing.original}
                  </span>
                </div>
              ) : (
                <span className="text-white font-bold text-sm">
                  ${course.pricing.current}
                </span>
              )}
            </div>
          </div>

          {/* Video Preview on Hover */}
          {isHovered && course.preview.videoUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/90 flex items-center justify-center"
            >
              <button
                onClick={(e) => {
                  e.preventDefault();
                  // Open video preview modal
                }}
                className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <Play className="w-8 h-8 text-white" />
              </button>
            </motion.div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 flex flex-col h-[calc(450px-192px)]">
          {/* Category */}
          {course.category && (
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">
              {course.category.name}
            </span>
          )}

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {course.title}
          </h3>

          {/* Instructor */}
          <div className="flex items-center gap-2 mb-3">
            <Image
              src={course.instructor.image || '/default-avatar.png'}
              alt={course.instructor.name}
              width={24}
              height={24}
              className="rounded-full"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {course.instructor.name}
            </span>
            {course.instructor.verified && (
              <Award className="w-4 h-4 text-blue-500" />
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {course.ratings.average.toFixed(1)}
            </span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(course.ratings.average)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">
              ({course.ratings.count})
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 mb-4">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{course.metadata.duration.formatted}</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              <span>{course.content.lecturesCount} lectures</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{course.enrollments.total} students</span>
            </div>
            <div className="flex items-center gap-1">
              <Award className="w-3 h-3" />
              <span>{course.metadata.level}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-auto flex gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                onAddToCart?.(course.id);
              }}
              className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Add to Cart</span>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                onAddToWishlist?.(course.id);
              }}
              className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Heart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

// Create similar components for List and Compact views
const ListCourseCard = ({ course }: { course: EnterpriseCourse }) => {
  // Horizontal layout with expanded info
  return <div>List View Card</div>;
};

const CompactCourseCard = ({ course }: { course: EnterpriseCourse }) => {
  // Minimal card for dense grid
  return <div>Compact View Card</div>;
};
```

### Phase 3: Filter Sidebar (Week 3)

#### Step 3.1: Create Filter Sidebar Component

**File**: `components/courses/filter-sidebar.tsx`

```typescript
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { useCourseCatalogStore } from '@/stores/course-catalog-store';
import type { FilterSidebarProps } from '@/types/enterprise-course-catalog';

export const FilterSidebar = ({
  filters,
  onFilterChange,
  onReset,
  facets,
  isLoading,
}: FilterSidebarProps) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="w-14 h-14 rounded-full bg-purple-600 text-white shadow-lg flex items-center justify-center"
        >
          <SlidersHorizontal className="w-6 h-6" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-80 h-screen sticky top-0 overflow-y-auto bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
        <FilterContent
          filters={filters}
          onFilterChange={onFilterChange}
          onReset={onReset}
          facets={facets}
          isLoading={isLoading}
        />
      </aside>

      {/* Mobile Sidebar (Slide-out) */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <h2 className="text-lg font-bold">Filters</h2>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FilterContent
                filters={filters}
                onFilterChange={onFilterChange}
                onReset={onReset}
                facets={facets}
                isLoading={isLoading}
                onClose={() => setIsMobileOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const FilterContent = ({
  filters,
  onFilterChange,
  onReset,
  facets,
  isLoading,
  onClose,
}: FilterSidebarProps & { onClose?: () => void }) => {
  return (
    <div className="p-6 space-y-6">
      {/* Reset Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Active Filters
        </h3>
        <button
          onClick={onReset}
          className="text-sm text-purple-600 hover:text-purple-700"
        >
          Reset All
        </button>
      </div>

      {/* Categories Filter */}
      <CollapsibleFilterSection title="Categories">
        <div className="space-y-2">
          {facets?.categories.map((category) => (
            <label key={category.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.selectedCategories.includes(category.id)}
                onChange={() => {
                  const newCategories = filters.selectedCategories.includes(category.id)
                    ? filters.selectedCategories.filter((id) => id !== category.id)
                    : [...filters.selectedCategories, category.id];
                  onFilterChange({ selectedCategories: newCategories });
                }}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {category.name}
              </span>
              <span className="ml-auto text-xs text-gray-500">
                ({category.count})
              </span>
            </label>
          ))}
        </div>
      </CollapsibleFilterSection>

      {/* Price Range Filter */}
      <CollapsibleFilterSection title="Price">
        <div className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.freeOnly}
              onChange={(e) => onFilterChange({ freeOnly: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Free Courses Only
            </span>
          </label>

          {!filters.freeOnly && (
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span>${filters.priceRange.min}</span>
                <span>${filters.priceRange.max}</span>
              </div>
              {/* Add dual range slider component here */}
            </div>
          )}
        </div>
      </CollapsibleFilterSection>

      {/* Add more filter sections: Level, Duration, Rating, etc. */}
    </div>
  );
};

const CollapsibleFilterSection = ({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2"
      >
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {title}
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
```

## 🚀 Next Steps

After implementing the core components above, you should:

1. **Create the main page** that brings everything together
2. **Implement search functionality** (Algolia integration)
3. **Add recommendation engine** (AI-powered)
4. **Build learning paths** display
5. **Add social proof** components
6. **Implement analytics** tracking
7. **Optimize performance** (virtual scrolling, lazy loading)
8. **Add SEO** (structured data, meta tags)

## 📚 Additional Resources

- Review `ENTERPRISE_COURSE_CATALOG_ARCHITECTURE.md` for complete specifications
- Check `types/enterprise-course-catalog.ts` for all type definitions
- Use `stores/course-catalog-store.ts` for state management
- Follow the 8-week implementation timeline in the architecture doc

## ✅ Testing Checklist

- [ ] All filters work correctly
- [ ] Search returns relevant results
- [ ] Cards display properly in all view modes
- [ ] Mobile responsive on all screen sizes
- [ ] Performance meets budget (LCP < 2.5s)
- [ ] Accessibility passes WCAG 2.1 AA
- [ ] Analytics tracking works
- [ ] SEO meta tags are correct

## 🎯 Success Metrics

Once implemented, monitor these KPIs:
- Course discovery time < 30 seconds
- Filter usage rate > 60%
- Course preview engagement > 40%
- Add-to-cart conversion > 15%
- Search refinement rate < 20%

---

**Implementation Status**: Foundation Complete ✅
**Next Phase**: Build Components and Integrate
**Estimated Time**: 6-8 weeks for complete implementation
