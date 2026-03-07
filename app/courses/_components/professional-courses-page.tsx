"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Star,
  Users,
  Flame,
  Filter,
  SlidersHorizontal,
  GraduationCap,
} from "lucide-react";

import { CoursesNavbarResizable } from "@/components/layout/CoursesNavbarResizable";
import { EnhancedHero } from "./BrutalistHero";
import { EnhancedCourseCard } from "./enhanced-course-card";
import { AIRecommendations } from "./ai-recommendations";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ensureHttpsUrl, getFallbackImageUrl } from "@/lib/cloudinary-utils";
import { HomeFooter } from "@/app/(homepage)/HomeFooter";
import { logger } from "@/lib/logger";

interface CourseData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  category: { id: string; name: string };
  chaptersCount: number;
  lessonsCount?: number;
  duration?: number;
  difficulty?: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  instructor?: {
    id: string;
    name: string;
    avatar?: string;
  };
  rating?: number;
  reviewsCount?: number;
  enrolledCount?: number;
  hasCertificate?: boolean;
  hasExercises?: boolean;
  badges?: Array<"New" | "Bestseller" | "Hot" | "Updated" | "Featured">;
  progress?: number | null;
  isEnrolled?: boolean;
  isWishlisted?: boolean;
}

interface FilterOptions {
  categories: Array<{ id: string; name: string; count: number }>;
  priceRanges: Array<{ label: string; min: number; max: number }>;
  difficulties: Array<{ value: string; label: string; count: number }>;
}

interface PlatformStatistics {
  totalCourses: number;
  publishedCourses: number;
  newCoursesThisWeek: number;
  activeLearners: number;
  totalLearners: number;
  averageRating: number;
  completionRate: number;
}

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string | null;
}

// Desktop Filter Sidebar
const DesktopFilterSidebar = ({
  filterOptions,
  selectedCategories,
  setSelectedCategories,
  selectedPriceRange,
  setSelectedPriceRange,
  selectedDifficulties,
  setSelectedDifficulties,
  onClearAll,
  activeFiltersCount,
}: {
  filterOptions: FilterOptions;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  selectedPriceRange: { min: number; max: number } | null;
  setSelectedPriceRange: (range: { min: number; max: number } | null) => void;
  selectedDifficulties: string[];
  setSelectedDifficulties: (difficulties: string[]) => void;
  onClearAll: () => void;
  activeFiltersCount: number;
}) => {
  return (
    <div className="sticky top-24 space-y-6">
      <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden">
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg shadow-md">
                <Filter className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Filters</h3>
              {activeFiltersCount > 0 && (
                <Badge className="bg-gradient-to-r from-violet-500 to-indigo-600 text-white border-0 text-xs px-2 py-0.5">
                  {activeFiltersCount}
                </Badge>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs h-8"
              >
                Clear All
              </Button>
            )}
          </div>

          <div className="space-y-5">
            {/* Categories */}
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Categories
              </h4>
              <div className="space-y-1">
                {filterOptions.categories.filter((c) => c.count > 0).map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center gap-2.5 cursor-pointer group p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([...selectedCategories, category.id]);
                        } else {
                          setSelectedCategories(selectedCategories.filter((c) => c !== category.id));
                        }
                      }}
                      className="rounded border-slate-300 dark:border-slate-600 text-violet-600 focus:ring-violet-500 w-4 h-4"
                    />
                    <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors capitalize">
                      {category.name}
                    </span>
                    <span className="text-xs text-slate-400 tabular-nums">
                      {category.count}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <Separator className="bg-slate-200 dark:bg-slate-700" />

            {/* Price Range */}
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Price
              </h4>
              <div className="space-y-1">
                {filterOptions.priceRanges.map((range) => (
                  <label
                    key={range.label}
                    className="flex items-center gap-2.5 cursor-pointer group p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <input
                      type="radio"
                      name="priceRange"
                      checked={selectedPriceRange?.min === range.min && selectedPriceRange?.max === range.max}
                      onChange={() => setSelectedPriceRange({ min: range.min, max: range.max })}
                      className="text-violet-600 focus:ring-violet-500 border-slate-300 dark:border-slate-600 w-4 h-4"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {range.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <Separator className="bg-slate-200 dark:bg-slate-700" />

            {/* Difficulty */}
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Level
              </h4>
              <div className="space-y-1">
                {filterOptions.difficulties.filter((d) => d.count > 0).map((diff) => (
                  <label
                    key={diff.value}
                    className="flex items-center gap-2.5 cursor-pointer group p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDifficulties.includes(diff.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDifficulties([...selectedDifficulties, diff.value]);
                        } else {
                          setSelectedDifficulties(selectedDifficulties.filter((d) => d !== diff.value));
                        }
                      }}
                      className="rounded border-slate-300 dark:border-slate-600 text-violet-600 focus:ring-violet-500 w-4 h-4"
                    />
                    <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {diff.label}
                    </span>
                    <span className="text-xs text-slate-400 tabular-nums">
                      {diff.count}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Trending Course Card - larger, more visual
const TrendingCourseCard = ({
  course,
  rank,
}: {
  course: CourseData;
  rank: number;
}) => {
  const secureImageUrl = ensureHttpsUrl(course.imageUrl) || getFallbackImageUrl("course");

  return (
    <Link href={`/courses/${course.id}`} className="block group">
      <Card className="overflow-hidden border-0 bg-white dark:bg-slate-800 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl">
        <CardContent className="p-0">
          {/* Image */}
          <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600">
            <Image
              src={secureImageUrl}
              alt={course.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.src = getFallbackImageUrl("course");
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Rank badge */}
            <div className="absolute top-3 left-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg",
                  rank === 1 && "bg-gradient-to-br from-amber-400 to-yellow-500 text-amber-900",
                  rank === 2 && "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-700",
                  rank === 3 && "bg-gradient-to-br from-amber-600 to-orange-700 text-white",
                  rank > 3 && "bg-white/90 text-slate-700"
                )}
              >
                {rank}
              </div>
            </div>

            {/* Price badge */}
            <div className="absolute top-3 right-3">
              <Badge className="bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border-0 backdrop-blur-sm font-semibold text-xs shadow-md">
                {course.price === 0 ? "Free" : `$${course.price}`}
              </Badge>
            </div>

            {/* Bottom info on image */}
            <div className="absolute bottom-3 left-3 right-3">
              <h3 className="text-white font-bold text-base sm:text-lg leading-tight line-clamp-2 drop-shadow-md">
                {course.title}
              </h3>
            </div>
          </div>

          {/* Card body */}
          <div className="p-4">
            {/* Instructor */}
            <div className="flex items-center gap-2 mb-3">
              {course.instructor?.avatar ? (
                <div className="relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-violet-200 dark:ring-violet-800">
                  <Image
                    src={ensureHttpsUrl(course.instructor.avatar) || getFallbackImageUrl("user")}
                    alt={course.instructor.name}
                    fill
                    sizes="24px"
                    className="object-cover"
                    onError={(e) => {
                      e.currentTarget.src = getFallbackImageUrl("user");
                    }}
                  />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-[10px] font-bold">
                    {course.instructor?.name?.charAt(0).toUpperCase() || "?"}
                  </span>
                </div>
              )}
              <span className="text-sm text-slate-600 dark:text-slate-400 font-medium truncate">
                {course.instructor?.name || "Unknown Instructor"}
              </span>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <Badge variant="outline" className="text-xs border-slate-200 dark:border-slate-700">
                {course.difficulty || "Beginner"}
              </Badge>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {(course.rating || 0).toFixed(1)}
                </span>
              </div>
              {(course.enrolledCount || 0) > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>{course.enrolledCount?.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

// Main Professional Courses Page Component
export function ProfessionalCoursesPage({
  initialCourses,
  filterOptions,
  totalCourses,
  userId,
  user,
  searchQuery = "",
  onSearchChange,
  isLoading = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  selectedCategories = [],
  onCategoriesChange,
  selectedPriceRange,
  onPriceRangeChange,
  selectedDifficulties = [],
  onDifficultiesChange,
  onClearFilters,
}: {
  initialCourses: CourseData[];
  filterOptions: FilterOptions;
  totalCourses: number;
  userId?: string;
  user?: UserData;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  isLoading?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  selectedCategories?: string[];
  onCategoriesChange?: (categories: string[]) => void;
  selectedPriceRange?: { min: number; max: number } | null;
  onPriceRangeChange?: (range: { min: number; max: number } | null) => void;
  selectedDifficulties?: string[];
  onDifficultiesChange?: (difficulties: string[]) => void;
  onClearFilters?: () => void;
}) {
  const [courses, setCourses] = useState(initialCourses);
  const [statistics, setStatistics] = useState<PlatformStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => {
    setCourses(initialCourses);
  }, [initialCourses]);

  // Fetch platform statistics
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setStatsLoading(true);
        const response = await fetch("/api/courses/statistics");
        const result = await response.json();

        if (result.success && result.data) {
          setStatistics(result.data);
        }
      } catch (error) {
        logger.error("Failed to fetch statistics:", error);
        setStatistics({
          totalCourses,
          publishedCourses: totalCourses,
          newCoursesThisWeek: 0,
          activeLearners: 0,
          totalLearners: 0,
          averageRating: 0,
          completionRate: 0,
        });
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStatistics();
  }, [totalCourses]);

  const handleCategoryToggle = (categoryId: string) => {
    if (onCategoriesChange) {
      const newCategories = selectedCategories.includes(categoryId)
        ? selectedCategories.filter((id) => id !== categoryId)
        : [...selectedCategories, categoryId];
      onCategoriesChange(newCategories);
    }
  };

  const handleDifficultyToggle = (difficulty: string) => {
    if (onDifficultiesChange) {
      const newDifficulties = selectedDifficulties.includes(difficulty)
        ? selectedDifficulties.filter((d) => d !== difficulty)
        : [...selectedDifficulties, difficulty];
      onDifficultiesChange(newDifficulties);
    }
  };

  const clearAllFilters = () => {
    if (onClearFilters) {
      onClearFilters();
    }
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategories.length > 0) count += selectedCategories.length;
    if (selectedPriceRange) count++;
    if (selectedDifficulties.length > 0) count += selectedDifficulties.length;
    return count;
  }, [selectedCategories, selectedPriceRange, selectedDifficulties]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Navbar */}
      <CoursesNavbarResizable
        activeFiltersCount={activeFiltersCount}
        filterOptions={filterOptions}
        selectedCategories={selectedCategories}
        onCategoryToggle={handleCategoryToggle}
        selectedPriceRange={selectedPriceRange}
        onPriceRangeChange={onPriceRangeChange}
        selectedDifficulties={selectedDifficulties}
        onDifficultyToggle={handleDifficultyToggle}
        onClearAll={clearAllFilters}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        userId={userId}
        user={user}
      />

      {/* Hero Section - passes real categories for quick-nav */}
      <EnhancedHero
        statistics={{
          totalCourses: statistics?.publishedCourses || totalCourses,
          totalEnrollments: statistics?.activeLearners || 0,
          averageRating: statistics?.averageRating || 0,
        }}
        userId={userId}
        categories={filterOptions.categories}
      />

      {/* Main Content */}
      <div id="main-content" className="container mx-auto px-4 sm:px-6 py-10 sm:py-14">

        {/* SAM AI-Powered Recommendations Section */}
        {userId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-10 sm:mb-14"
          >
            <Card className="border-0 bg-gradient-to-br from-white/90 via-purple-50/30 to-pink-50/30 dark:from-slate-800/90 dark:via-slate-800/80 dark:to-slate-700/80 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden">
              <CardContent className="p-5 sm:p-6 md:p-8">
                <AIRecommendations userId={userId} className="w-full" />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Most Trending Courses */}
        {courses.length > 0 && (
          <div className="mb-10 sm:mb-14">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/25">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Most Trending
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.slice(0, 3).map((course, index) => (
                <TrendingCourseCard
                  key={course.id}
                  course={course}
                  rank={index + 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Courses with Desktop Filter Sidebar */}
        <div data-results-section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              All Courses
            </h2>
            <div className="flex items-center gap-3">
              {/* Mobile Filter Button */}
              <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="lg:hidden bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-md h-9 text-xs sm:text-sm"
                  >
                    <SlidersHorizontal className="w-4 h-4 mr-1.5" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge className="ml-1.5 bg-violet-600 text-white text-[10px] px-1.5 py-0.5">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[380px] overflow-y-auto p-5">
                  <SheetHeader className="mb-5">
                    <SheetTitle className="flex items-center gap-2">
                      <Filter className="w-5 h-5" />
                      Filter Courses
                    </SheetTitle>
                    <SheetDescription>
                      Refine your course search
                    </SheetDescription>
                  </SheetHeader>
                  <DesktopFilterSidebar
                    filterOptions={filterOptions}
                    selectedCategories={selectedCategories}
                    setSelectedCategories={onCategoriesChange || (() => {})}
                    selectedPriceRange={selectedPriceRange ?? null}
                    setSelectedPriceRange={onPriceRangeChange || (() => {})}
                    selectedDifficulties={selectedDifficulties}
                    setSelectedDifficulties={onDifficultiesChange || (() => {})}
                    onClearAll={clearAllFilters}
                    activeFiltersCount={activeFiltersCount}
                  />
                  <div className="sticky bottom-0 left-0 right-0 pt-4 pb-2 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 mt-6 -mx-5 px-5">
                    <Button
                      onClick={() => setIsMobileFilterOpen(false)}
                      className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg h-11"
                    >
                      Show {totalCourses} Course{totalCourses !== 1 ? "s" : ""}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
                {totalCourses} {totalCourses === 1 ? "course" : "courses"} available
              </span>
            </div>
          </div>

          {/* Two-column layout: filters + grid */}
          <div className="flex gap-8">
            {/* Desktop Filter Sidebar */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <DesktopFilterSidebar
                filterOptions={filterOptions}
                selectedCategories={selectedCategories}
                setSelectedCategories={onCategoriesChange || (() => {})}
                selectedPriceRange={selectedPriceRange ?? null}
                setSelectedPriceRange={onPriceRangeChange || (() => {})}
                selectedDifficulties={selectedDifficulties}
                setSelectedDifficulties={onDifficultiesChange || (() => {})}
                onClearAll={clearAllFilters}
                activeFiltersCount={activeFiltersCount}
              />
            </div>

            {/* Course Grid */}
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {[...Array(9)].map((_, i) => (
                    <div
                      key={i}
                      className="h-80 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-xl"
                    />
                  ))}
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-20">
                  <GraduationCap className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">
                    No courses found
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-500 mb-6">
                    Try adjusting your filters or search terms
                  </p>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="outline"
                      onClick={clearAllFilters}
                      className="text-sm"
                    >
                      Clear All Filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {courses.map((course) => (
                    <EnhancedCourseCard
                      key={course.id}
                      id={course.id}
                      title={course.title}
                      description={course.description}
                      imageUrl={course.imageUrl}
                      chaptersLength={course.chaptersCount}
                      lessonsCount={course.lessonsCount}
                      price={course.price}
                      originalPrice={course.originalPrice}
                      category={course.category.name}
                      difficulty={course.difficulty}
                      duration={course.duration}
                      enrolledCount={course.enrolledCount}
                      rating={course.rating || 0}
                      reviewsCount={course.reviewsCount}
                      instructor={course.instructor}
                      hasCertificate={course.hasCertificate}
                      hasExercises={course.hasExercises}
                      badges={course.badges}
                      progress={course.progress}
                      isEnrolled={course.isEnrolled}
                      isWishlisted={course.isWishlisted}
                      viewMode="grid"
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && onPageChange && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                    className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm text-sm px-4 h-10"
                  >
                    Previous
                  </Button>

                  <div className="flex gap-1">
                    {(() => {
                      const pages = [];
                      const showPages = 5;
                      let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
                      const endPage = Math.min(totalPages, startPage + showPages - 1);

                      if (endPage - startPage < showPages - 1) {
                        startPage = Math.max(1, endPage - showPages + 1);
                      }

                      if (startPage > 1) {
                        pages.push(
                          <Button
                            key={1}
                            variant={1 === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => onPageChange(1)}
                            disabled={isLoading}
                            className={cn(
                              "min-w-[36px] h-9 px-3 text-sm",
                              1 === currentPage
                                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                                : "bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm"
                            )}
                          >
                            1
                          </Button>
                        );
                        if (startPage > 2) {
                          pages.push(
                            <span key="e1" className="px-1 text-sm text-slate-400">
                              ...
                            </span>
                          );
                        }
                      }

                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <Button
                            key={i}
                            variant={i === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => onPageChange(i)}
                            disabled={isLoading}
                            className={cn(
                              "min-w-[36px] h-9 px-3 text-sm",
                              i === currentPage
                                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                                : "bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm"
                            )}
                          >
                            {i}
                          </Button>
                        );
                      }

                      if (endPage < totalPages) {
                        if (endPage < totalPages - 1) {
                          pages.push(
                            <span key="e2" className="px-1 text-sm text-slate-400">
                              ...
                            </span>
                          );
                        }
                        pages.push(
                          <Button
                            key={totalPages}
                            variant={totalPages === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => onPageChange(totalPages)}
                            disabled={isLoading}
                            className={cn(
                              "min-w-[36px] h-9 px-3 text-sm",
                              totalPages === currentPage
                                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                                : "bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm"
                            )}
                          >
                            {totalPages}
                          </Button>
                        );
                      }

                      return pages;
                    })()}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                    className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm text-sm px-4 h-10"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <HomeFooter />
    </div>
  );
}
