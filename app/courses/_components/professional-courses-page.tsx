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
  Filter
} from "lucide-react";

// Import new Coursera-style components
import { CoursesNavbarResizable } from "@/components/layout/CoursesNavbarResizable";
import { HeroCarousel } from "@/components/hero/HeroCarousel";
import { QuickActions } from "@/components/sections/QuickActions";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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

// Professional Course Card with Analytics Color System
const ProfessionalCourseCard = ({ course, isPriority = false }: { course: CourseData; isPriority?: boolean }) => {
  const secureImageUrl = course.imageUrl?.replace(/^http:\/\//i, 'https://') || null;
  const secureInstructorAvatar = course.instructor?.avatar?.replace(/^http:\/\//i, 'https://');

  return (
    <Link href={`/courses/${course.id}`} className="block group h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        whileHover={{ y: -6 }}
        className="h-full"
      >
        <Card className="h-full flex flex-col overflow-hidden border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 rounded-3xl">
          {/* Image Section */}
          <div className="relative h-52 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
            {secureImageUrl && (
              <Image
                src={secureImageUrl}
                alt={course.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                priority={isPriority}
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Top Badges Row */}
            <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
              <div className="flex gap-2 flex-wrap">
                {course.badges?.slice(0, 2).map((badge, index) => (
                  <Badge
                    key={index}
                    className={cn(
                      "backdrop-blur-md shadow-md font-medium px-2.5 py-0.5",
                      badge === "Hot" && "bg-gradient-to-r from-orange-500 to-red-500 text-white border-0",
                      badge === "New" && "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0",
                      badge === "Bestseller" && "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
                    )}
                  >
                    {badge === "Hot" && <Flame className="w-3 h-3 mr-1" />}
                    {badge === "New" && <Sparkles className="w-3 h-3 mr-1" />}
                    {badge === "Bestseller" && <Trophy className="w-3 h-3 mr-1" />}
                    {badge}
                  </Badge>
                ))}
              </div>

              {/* Price Badge */}
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl px-3 py-1.5 shadow-lg">
                {course.price === 0 ? (
                  <span className="text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    FREE
                  </span>
                ) : (
                  <div className="flex items-baseline gap-1.5">
                    {course.originalPrice && (
                      <span className="text-xs text-muted-foreground line-through">
                        ${course.originalPrice}
                      </span>
                    )}
                    <span className="text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      ${course.price}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Category */}
            <div className="absolute bottom-4 left-4">
              <Badge className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md text-slate-700 dark:text-slate-300 border-slate-200/50 dark:border-slate-700/50 shadow-md">
                {course.category.name}
              </Badge>
            </div>
          </div>

          <CardContent className="p-6 flex-1 flex flex-col">
            {/* Instructor */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-500 shadow-md">
                {secureInstructorAvatar ? (
                  <Image
                    src={secureInstructorAvatar}
                    alt={course.instructor?.name || "Instructor"}
                    fill
                    sizes="36px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                    {course.instructor?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate">
                  {course.instructor?.name}
                </p>
              </div>
              {course.isEnrolled && (
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 shadow-md px-2 py-0.5">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Enrolled
                </Badge>
              )}
            </div>

            {/* Title */}
            <h3 className="font-bold text-lg mb-3 line-clamp-2 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {course.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">
              {course.description}
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg">
                  <Star className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {course.rating?.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    ({course.reviewsCount})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <Users className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {course.enrolledCount?.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {course.duration}h
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                  <BookOpen className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {course.lessonsCount} lessons
                </span>
              </div>
            </div>

            {/* Features Pills */}
            <div className="flex flex-wrap gap-2 mb-5">
              {course.difficulty && (
                <Badge variant="outline" className="text-xs border-slate-200 dark:border-slate-700">
                  {course.difficulty}
                </Badge>
              )}
              {course.hasCertificate && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="text-xs border-slate-200 dark:border-slate-700">
                        <Award className="w-3 h-3 mr-1" />
                        Certificate
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>Certificate of Completion</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {course.hasExercises && (
                <Badge variant="outline" className="text-xs border-slate-200 dark:border-slate-700">
                  <Code2 className="w-3 h-3 mr-1" />
                  Exercises
                </Badge>
              )}
            </div>

            {/* Progress (if enrolled) */}
            {course.isEnrolled && course.progress !== null && (
              <div className="mb-5">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Your Progress</span>
                  <span className="text-slate-900 dark:text-white font-bold">{course.progress}%</span>
                </div>
                <Progress value={course.progress} className="h-2 bg-slate-100 dark:bg-slate-700" />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2.5 mt-auto">
              <Button
                className={cn(
                  "flex-1 group/btn shadow-md transition-all duration-300",
                  course.isEnrolled
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                    : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                )}
              >
                {course.isEnrolled ? "Continue Learning" : "Enroll Now"}
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700"
                aria-label={course.isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart className={cn("w-4 h-4", course.isWishlisted && "fill-red-500 text-red-500")} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
};

// Coursera-Style Hero Section Content (just the hero carousel and actions)
const CourseraStyleHeroSectionContent = ({ totalLearners }: { totalLearners?: number }) => {
  const heroSlides = [
    {
      id: "1",
      variant: "primary" as const,
      tag: "From Industry Leaders",
      title: "Learn people management skills from industry leaders",
      description: "Become a confident and effective leader with courses from top organizations.",
      ctaLabel: "Enroll Now",
      ctaHref: "/courses?category=management",
    },
    {
      id: "2",
      variant: "secondary" as const,
      tag: "Career Growth",
      title: "Start, switch, or advance your career",
      description: `Grow with ${totalLearners ? (totalLearners >= 1000 ? `${Math.floor(totalLearners / 1000)}k+` : `${totalLearners}+`) : '5,000+'} courses from top organizations.`,
      ctaLabel: "Join for Free",
      ctaHref: "/auth/register",
    },
    {
      id: "3",
      variant: "primary" as const,
      tag: "AI & Data Science",
      title: "Master AI and Machine Learning",
      description: "Learn cutting-edge AI skills from leading experts and build real-world projects.",
      ctaLabel: "Explore Courses",
      ctaHref: "/courses?category=ai",
    },
  ];

  return (
    <div className="pt-20 bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 md:py-12 lg:py-16">
        {/* Hero Carousel */}
        <HeroCarousel slides={heroSlides} autoPlayInterval={6000} />

        {/* Quick Action Tiles */}
        <QuickActions className="mt-8 md:mt-12" />
      </div>
    </div>
  );
};

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
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {statsData.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <Card className="text-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-md hover:shadow-xl transition-all duration-300 p-6 rounded-2xl">
                <div className={cn("w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br shadow-lg flex items-center justify-center", stat.gradient)}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                {isLoading ? (
                  <div className="text-3xl font-bold text-slate-400 animate-pulse">--</div>
                ) : (
                  <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                    {stat.value}
                  </div>
                )}
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
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
  userId
}: {
  initialCourses: CourseData[];
  filterOptions: FilterOptions;
  totalCourses: number;
  userId?: string;
}) {
  const [courses] = useState(initialCourses);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<any>(null);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [statistics, setStatistics] = useState<PlatformStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

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
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleDifficultyToggle = (difficulty: string) => {
    setSelectedDifficulties(prev =>
      prev.includes(difficulty)
        ? prev.filter(d => d !== difficulty)
        : [...prev, difficulty]
    );
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedPriceRange(null);
    setSelectedDifficulties([]);
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
        onPriceRangeChange={setSelectedPriceRange}
        selectedDifficulties={selectedDifficulties}
        onDifficultyToggle={handleDifficultyToggle}
        onClearAll={clearAllFilters}
      />

      {/* Coursera-Style Hero Section (without navbar) */}
      <CourseraStyleHeroSectionContent totalLearners={statistics?.totalLearners} />

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
          className="flex flex-wrap gap-3 mb-10"
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
              className="group bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className={cn("p-1.5 rounded-lg bg-gradient-to-br mr-2", action.color)}>
                <action.icon className="w-4 h-4 text-white" />
              </div>
              {action.label}
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
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
            {courses.slice(0, 6).map((course, index) => (
              <Link key={course.id} href={`/courses/${course.id}`} className="block group">
                <Card className="overflow-hidden border-0 bg-white dark:bg-slate-800 shadow-md hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-0">
                    <div className="flex gap-4">
                      {/* Course Image */}
                      <div className="relative w-32 h-32 flex-shrink-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600">
                        {course.imageUrl && (
                          <Image
                            src={course.imageUrl.replace(/^http:\/\//i, 'https://')}
                            alt={course.title}
                            fill
                            sizes="128px"
                            className="object-cover"
                          />
                        )}

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
                      <div className="flex-1 py-4 pr-4 min-w-0">
                        {/* Instructor/Category */}
                        <div className="flex items-center gap-2 mb-2">
                          {course.instructor?.avatar ? (
                            <div className="relative w-5 h-5 rounded-full overflow-hidden">
                              <Image
                                src={course.instructor.avatar.replace(/^http:\/\//i, 'https://')}
                                alt={course.instructor.name}
                                fill
                                sizes="20px"
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                              <span className="text-white text-[10px] font-bold">
                                {course.instructor?.name?.charAt(0).toUpperCase() || course.category.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate">
                            {course.instructor?.name || course.category.name}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-base mb-2 line-clamp-2 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {course.title}
                        </h3>

                        {/* Type Badge */}
                        <Badge variant="outline" className="mb-3 text-xs border-slate-200 dark:border-slate-700">
                          {course.difficulty || "Specialization"}
                        </Badge>

                        {/* Stats Row */}
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {course.rating?.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                            <Users className="w-3.5 h-3.5" />
                            <span>{course.enrolledCount?.toLocaleString()}</span>
                          </div>
                          {course.duration && (
                            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{course.duration}h</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* All Courses Grid */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-6">
            All Courses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {courses.map((course, index) => (
              <ProfessionalCourseCard
                key={course.id}
                course={course}
                isPriority={index === 0}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
