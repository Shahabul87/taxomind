"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Star,
  Users,
  Clock,
  BookOpen,
  Award,
  TrendingUp,
  Trophy,
  Sparkles,
  Flame,
  CheckCircle2,
  Heart,
  ArrowRight,
  Brain,
  Target,
  Zap,
  Route,
  Code2,
  GraduationCap,
  Filter,
  SlidersHorizontal,
  X
} from "lucide-react";

// Import new Coursera-style components
import { CoursesNavbarResizable } from "@/components/layout/CoursesNavbarResizable";
import { EnhancedHero } from "./EnhancedHero";
import { EnhancedCourseCard } from "./enhanced-course-card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ensureHttpsUrl, getFallbackImageUrl } from "@/lib/cloudinary-utils";

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

// Professional Stats Bar
const ProfessionalStatsBar = ({ stats, isLoading }: { stats: any; isLoading: boolean }) => {
  const statsData = [
    {
      icon: BookOpen,
      label: "Total Courses",
      value: stats.totalCourses,
      gradient: "from-purple-500 to-indigo-600"
    },
    {
      icon: TrendingUp,
      label: "New This Week",
      value: stats.newCoursesThisWeek,
      gradient: "from-emerald-500 to-teal-600"
    },
    {
      icon: Users,
      label: "Active Learners",
      value: `${stats.activeLearners.toLocaleString()}+`,
      gradient: "from-blue-500 to-cyan-600"
    },
    {
      icon: Star,
      label: "Avg. Rating",
      value: stats.averageRating.toFixed(1),
      gradient: "from-amber-500 to-orange-600"
    },
    {
      icon: Trophy,
      label: "Completion Rate",
      value: `${stats.completionRate}%`,
      gradient: "from-pink-500 to-rose-600"
    }
  ];

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 border-y border-slate-200/50 dark:border-slate-700/50">
      <div className="container mx-auto px-4 py-6 sm:py-8 md:py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
          {statsData.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <Card className="text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-md hover:shadow-xl transition-all duration-300 p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl">
                <div className={cn("w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto mb-2 sm:mb-3 rounded-lg sm:rounded-xl bg-gradient-to-br shadow-lg flex items-center justify-center", stat.gradient)}>
                  <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                </div>
                {isLoading ? (
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-400 animate-pulse">--</div>
                ) : (
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-1">
                    {stat.value}
                  </div>
                )}
                <div className="text-[10px] sm:text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400">
                  {stat.label}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Professional Filter Sidebar
const ProfessionalFilterSidebar = ({
  filterOptions,
  selectedCategories,
  setSelectedCategories,
  selectedPriceRange,
  setSelectedPriceRange,
  selectedDifficulties,
  setSelectedDifficulties,
  onClearAll,
  activeFiltersCount
}: any) => {
  return (
    <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg rounded-3xl overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
              <Filter className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Filters</h3>
            {activeFiltersCount > 0 && (
              <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Clear All
          </Button>
        </div>

        <div className="space-y-6">
          {/* Categories */}
          <div>
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-3">
              Categories
            </h4>
            <div className="space-y-2.5">
              {filterOptions.categories.map((category: any) => (
                <label
                  key={category.id}
                  className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories([...selectedCategories, category.id]);
                      } else {
                        setSelectedCategories(selectedCategories.filter((c: string) => c !== category.id));
                      }
                    }}
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {category.name}
                  </span>
                  <Badge variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                    {category.count}
                  </Badge>
                </label>
              ))}
            </div>
          </div>

          <Separator className="bg-slate-200 dark:bg-slate-700" />

          {/* Price Range */}
          <div>
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-3">
              Price Range
            </h4>
            <div className="space-y-2.5">
              {filterOptions.priceRanges.map((range: any) => (
                <label
                  key={range.label}
                  className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <input
                    type="radio"
                    name="priceRange"
                    checked={selectedPriceRange?.min === range.min && selectedPriceRange?.max === range.max}
                    onChange={() => setSelectedPriceRange({ min: range.min, max: range.max })}
                    className="text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {range.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <Separator className="bg-slate-200 dark:bg-slate-700" />

          {/* Difficulty */}
          <div>
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-3">
              Difficulty Level
            </h4>
            <div className="space-y-2.5">
              {filterOptions.difficulties.map((diff: any) => (
                <label
                  key={diff.value}
                  className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedDifficulties.includes(diff.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDifficulties([...selectedDifficulties, diff.value]);
                      } else {
                        setSelectedDifficulties(selectedDifficulties.filter((d: string) => d !== diff.value));
                      }
                    }}
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {diff.label}
                  </span>
                  <Badge variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                    {diff.count}
                  </Badge>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Main Professional Courses Page Component
export function ProfessionalCoursesPage({
  initialCourses,
  filterOptions,
  totalCourses,
  userId,
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
  onClearFilters
}: {
  initialCourses: CourseData[];
  filterOptions: FilterOptions;
  totalCourses: number;
  userId?: string;
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

  // Update courses when initialCourses changes (from search/filter in parent)
  useEffect(() => {
    setCourses(initialCourses);
    // Scroll to top when courses update (pagination/search)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [initialCourses]);

  // Fetch platform statistics
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setStatsLoading(true);
        const response = await fetch('/api/courses/statistics');
        const result = await response.json();

        if (result.success && result.data) {
          setStatistics(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch statistics:', error);
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
    console.log('[ProfessionalCoursesPage] Category toggled:', categoryId);
    if (onCategoriesChange) {
      const newCategories = selectedCategories.includes(categoryId)
        ? selectedCategories.filter(id => id !== categoryId)
        : [...selectedCategories, categoryId];
      console.log('[ProfessionalCoursesPage] New categories:', newCategories);
      onCategoriesChange(newCategories);
    } else {
      console.warn('[ProfessionalCoursesPage] onCategoriesChange is not defined!');
    }
  };

  const handleDifficultyToggle = (difficulty: string) => {
    console.log('[ProfessionalCoursesPage] Difficulty toggled:', difficulty);
    if (onDifficultiesChange) {
      const newDifficulties = selectedDifficulties.includes(difficulty)
        ? selectedDifficulties.filter(d => d !== difficulty)
        : [...selectedDifficulties, difficulty];
      console.log('[ProfessionalCoursesPage] New difficulties:', newDifficulties);
      onDifficultiesChange(newDifficulties);
    } else {
      console.warn('[ProfessionalCoursesPage] onDifficultiesChange is not defined!');
    }
  };

  const clearAllFilters = () => {
    console.log('[ProfessionalCoursesPage] Clearing all filters');
    if (onClearFilters) {
      onClearFilters();
    } else {
      console.warn('[ProfessionalCoursesPage] onClearFilters is not defined!');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
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
      />

      {/* Enhanced Hero Section */}
      <EnhancedHero
        statistics={{
          totalCourses: statistics?.publishedCourses || totalCourses,
          totalEnrollments: statistics?.activeLearners || 0,
          averageRating: statistics?.averageRating || 0
        }}
      />

      {/* Professional Stats Bar */}
      <ProfessionalStatsBar
        stats={{
          totalCourses: statistics?.publishedCourses || totalCourses,
          newCoursesThisWeek: statistics?.newCoursesThisWeek || 0,
          activeLearners: statistics?.activeLearners || 0,
          averageRating: statistics?.averageRating || 0,
          completionRate: statistics?.completionRate || 0
        }}
        isLoading={statsLoading}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Quick Action Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 sm:gap-3 mb-8 sm:mb-10"
        >
          {[
            { icon: Brain, label: "AI Recommendations", color: "from-purple-500 to-pink-600" },
            { icon: Route, label: "Learning Paths", color: "from-blue-500 to-cyan-600" },
            { icon: Zap, label: "Quick Start", color: "from-amber-500 to-orange-600" },
            { icon: Target, label: "Career Goals", color: "from-emerald-500 to-teal-600" }
          ].map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="group bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-xs sm:text-sm px-2.5 sm:px-3 md:px-4 h-9 sm:h-10"
            >
              <div className={cn("p-1 sm:p-1.5 rounded-lg bg-gradient-to-br mr-1.5 sm:mr-2", action.color)}>
                <action.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white" />
              </div>
              <span className="whitespace-nowrap text-[11px] sm:text-xs md:text-sm">{action.label}</span>
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 ml-1.5 sm:ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          ))}
        </motion.div>

        {/* Most Trending Courses Section */}
        <div className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-6">
            Most Trending Courses
          </h2>

          {/* Two Column Layout with List Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {courses.slice(0, 6).map((course, index) => {
              // Use secure HTTPS URL with fallback
              const secureImageUrl = ensureHttpsUrl(course.imageUrl) || getFallbackImageUrl('course');

              return (
                <Link key={course.id} href={`/courses/${course.id}`} className="block group">
                  <Card className="overflow-hidden border-0 bg-white dark:bg-slate-800 shadow-md hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-0">
                      <div className="flex gap-2 sm:gap-3 md:gap-4 h-full">
                        {/* Course Image */}
                        <div className="relative w-32 sm:w-36 md:w-40 flex-shrink-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600">
                          <Image
                            src={secureImageUrl}
                            alt={course.title}
                            fill
                            sizes="(max-width: 640px) 128px, (max-width: 768px) 144px, 160px"
                            className="object-cover h-full"
                            onError={(e) => {
                              e.currentTarget.src = getFallbackImageUrl('course');
                            }}
                          />

                        {/* Badge Overlay */}
                        {course.badges?.[0] && (
                          <div className="absolute top-2 left-2">
                            <Badge
                              className={cn(
                                "backdrop-blur-md shadow-md font-medium px-2 py-0.5 text-xs",
                                course.badges[0] === "Hot" && "bg-gradient-to-r from-orange-500 to-red-500 text-white border-0",
                                course.badges[0] === "New" && "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0",
                                course.badges[0] === "Bestseller" && "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
                              )}
                            >
                              {course.badges[0]}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Course Info */}
                      <div className="flex-1 py-2 pr-2 sm:py-3 sm:pr-3 md:py-4 md:pr-4 min-w-0">
                        {/* Title */}
                        <h3 className="font-bold text-xs sm:text-sm md:text-base mb-1 sm:mb-2 line-clamp-2 sm:line-clamp-1 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {course.title}
                        </h3>

                        {/* Description */}
                        {course.description && (
                          <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 line-clamp-1 sm:line-clamp-2 mb-1 sm:mb-2 leading-relaxed hidden sm:block">
                            {course.description}
                          </p>
                        )}

                        {/* Instructor */}
                        <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                          {course.instructor?.avatar ? (
                            <div className="relative w-4 h-4 sm:w-5 sm:h-5 rounded-full overflow-hidden flex-shrink-0">
                              <Image
                                src={ensureHttpsUrl(course.instructor.avatar) || getFallbackImageUrl('user')}
                                alt={course.instructor.name}
                                fill
                                sizes="20px"
                                className="object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = getFallbackImageUrl('user');
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-[8px] sm:text-[10px] font-bold">
                                {course.instructor?.name?.charAt(0).toUpperCase() || course.category.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 font-medium truncate">
                            {course.instructor?.name || course.category.name}
                          </span>
                        </div>

                        {/* Type Badge and Stats Row */}
                        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-wrap">
                          <Badge variant="outline" className="text-[10px] sm:text-xs border-slate-200 dark:border-slate-700 px-1.5 py-0.5">
                            {course.difficulty || "Beginner"}
                          </Badge>

                          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 text-[10px] sm:text-xs">
                            <div className="flex items-center gap-0.5 sm:gap-1">
                              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {course.rating?.toFixed(1)}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5 sm:gap-1 text-slate-600 dark:text-slate-400">
                              <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                              <span>{course.enrolledCount?.toLocaleString()}</span>
                            </div>
                            {course.duration && (
                              <div className="flex items-center gap-0.5 sm:gap-1 text-slate-600 dark:text-slate-400 hidden sm:flex">
                                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                                <span>{course.duration}h</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              );
            })}
          </div>
        </div>

        {/* All Courses Grid */}
        <div data-results-section>
          <div className="flex items-center justify-between mb-6 gap-3">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
              All Courses
            </h2>
            <div className="flex items-center gap-3">
              {/* Mobile Filter Button */}
              <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="lg:hidden bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-md"
                  >
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Filters</span>
                    {activeFiltersCount > 0 && (
                      <Badge className="ml-2 bg-blue-600 text-white text-xs px-1.5 py-0.5 min-w-[20px] h-5">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Filter className="w-5 h-5" />
                      Filter Courses
                    </SheetTitle>
                    <SheetDescription>
                      Refine your course search with filters
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <ProfessionalFilterSidebar
                      filterOptions={filterOptions}
                      selectedCategories={selectedCategories}
                      setSelectedCategories={onCategoriesChange || (() => {})}
                      selectedPriceRange={selectedPriceRange}
                      setSelectedPriceRange={onPriceRangeChange || (() => {})}
                      selectedDifficulties={selectedDifficulties}
                      setSelectedDifficulties={onDifficultiesChange || (() => {})}
                      onClearAll={clearAllFilters}
                      activeFiltersCount={activeFiltersCount}
                    />

                    {/* Apply Filters Button for Mobile */}
                    <div className="sticky bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 mt-6 -mx-6 -mb-6">
                      <Button
                        onClick={() => setIsMobileFilterOpen(false)}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                      >
                        View {totalCourses} Course{totalCourses !== 1 ? 's' : ''}
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 hidden sm:block">
                Showing {((currentPage - 1) * 12) + 1}-{Math.min(currentPage * 12, totalCourses)} of {totalCourses} courses
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="h-96 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-slate-600 dark:text-slate-400">No courses found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {courses.map((course, index) => (
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
            <div className="mt-12 flex items-center justify-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm text-xs sm:text-sm px-3 sm:px-4 h-9 sm:h-10 min-w-[44px]"
              >
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </Button>

              <div className="flex gap-1 sm:gap-2">
                {(() => {
                  const pages = [];
                  // Show fewer pages on mobile (3) vs desktop (5)
                  const showPages = typeof window !== 'undefined' && window.innerWidth < 640 ? 3 : 5;
                  let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
                  let endPage = Math.min(totalPages, startPage + showPages - 1);

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
                          "min-w-[32px] h-8 px-2 text-xs md:text-sm md:min-w-[40px] md:h-9 md:px-3",
                          1 === currentPage
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                            : "bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm"
                        )}
                      >
                        1
                      </Button>
                    );
                    if (startPage > 2) {
                      pages.push(<span key="ellipsis1" className="px-1 text-xs md:text-sm">...</span>);
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
                          "min-w-[32px] h-8 px-2 text-xs md:text-sm md:min-w-[40px] md:h-9 md:px-3",
                          i === currentPage
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                            : "bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm"
                        )}
                      >
                        {i}
                      </Button>
                    );
                  }

                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pages.push(<span key="ellipsis2" className="px-1 text-xs md:text-sm">...</span>);
                    }
                    pages.push(
                      <Button
                        key={totalPages}
                        variant={totalPages === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(totalPages)}
                        disabled={isLoading}
                        className={cn(
                          "min-w-[32px] h-8 px-2 text-xs md:text-sm md:min-w-[40px] md:h-9 md:px-3",
                          totalPages === currentPage
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
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
                className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm text-xs sm:text-sm px-3 sm:px-4 h-9 sm:h-10 min-w-[44px]"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
