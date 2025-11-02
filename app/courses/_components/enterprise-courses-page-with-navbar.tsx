"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useDebounce } from "@/hooks/use-debounce";
import { motion, AnimatePresence, useReducedMotion, useInView } from "framer-motion";
import Image from "next/image";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  X,
  SlidersHorizontal,
  TrendingUp,
  BookOpen,
  Users,
  Star,
  Clock,
  DollarSign,
  Loader2,
  BarChart3,
  Sparkles,
  Route,
  Shield,
  Award,
  Zap,
  Brain,
  Target,
  Activity,
  ArrowRight,
  CheckCircle2,
  Heart,
  LayoutGrid,
  Code2,
  ChevronDown,
  Flame,
  Trophy,
  Rocket
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Import resizable navbar components
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavbarLogo,
  NavbarButton,
} from "@/components/ui/resizable-navbar";

interface CourseData {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  previewVideo?: string;
  price: number;
  originalPrice?: number;
  category: { id: string; name: string };
  subCategory?: string;
  chaptersCount: number;
  lessonsCount?: number;
  duration?: number;
  difficulty?: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  instructor?: {
    id: string;
    name: string;
    avatar?: string;
    rating?: number;
  };
  rating?: number;
  reviewsCount?: number;
  enrolledCount?: number;
  completionRate?: number;
  hasCertificate?: boolean;
  hasExercises?: boolean;
  badges?: Array<"New" | "Bestseller" | "Hot" | "Updated" | "Featured">;
  progress?: number | null;
  isEnrolled?: boolean;
  isWishlisted?: boolean;
  lastUpdated?: Date;
}

interface FilterOptions {
  categories: Array<{ id: string; name: string; count: number }>;
  priceRanges: Array<{ label: string; min: number; max: number }>;
  difficulties: Array<{ value: string; label: string; count: number }>;
  durations: Array<{ label: string; min: number; max: number }>;
  ratings: Array<{ value: number; label: string }>;
  features: Array<{ value: string; label: string }>;
}

interface EnterpriseCoursesPageProps {
  initialCourses: CourseData[];
  filterOptions: FilterOptions;
  totalCourses: number;
  userId?: string;
}

type ViewMode = "grid" | "list" | "compact";
type SortOption =
  | "relevance"
  | "popular"
  | "rating"
  | "newest"
  | "price-low"
  | "price-high"
  | "duration-short"
  | "duration-long";

// Modern Course Card Component (matching the redesigned style)
const EnterpriseCourseCard = ({ course, viewMode, isPriority = false }: any) => {
  const [isHovered, setIsHovered] = useState(false);

  // Ensure image URLs use HTTPS for Next.js Image component
  const secureImageUrl = course.imageUrl?.replace(/^http:\/\//i, 'https://') || '/default-course.webp';
  const secureInstructorAvatar = course.instructor?.avatar?.replace(/^http:\/\//i, 'https://');

  // Get category gradient
  const getCategoryGradient = (categoryName: string) => {
    const cat = categoryName.toLowerCase();
    if (cat.includes('programming') || cat.includes('code') || cat.includes('development')) {
      return 'from-emerald-500 to-teal-500';
    }
    if (cat.includes('design') || cat.includes('ui') || cat.includes('ux')) {
      return 'from-purple-500 to-pink-500';
    }
    if (cat.includes('business') || cat.includes('management')) {
      return 'from-orange-500 to-red-500';
    }
    return 'from-blue-500 to-indigo-500';
  };

  const categoryGradient = getCategoryGradient(course.category.name);

  return (
    <Link href={`/courses/${course.id}`} prefetch={false} className="group block h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -4 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="h-full"
      >
        <Card className="h-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.02] hover:border-blue-300/50 dark:hover:border-blue-500/50">
          {/* Image Section with Gradient Overlay */}
          <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-700 flex-shrink-0">
            <Image
              src={secureImageUrl}
              alt={course.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={isPriority}
              className="object-cover group-hover:scale-110 transition-transform duration-700"
              unoptimized={!course.imageUrl}
            />

            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Badges */}
            <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
              {course.badges?.map((badge: string, index: number) => (
                <Badge
                  key={index}
                  className={cn(
                    "backdrop-blur-sm shadow-lg",
                    badge === "Hot" && "bg-red-500/90 text-white",
                    badge === "New" && "bg-emerald-500/90 text-white",
                    badge === "Bestseller" && "bg-purple-500/90 text-white",
                    badge === "Featured" && "bg-amber-500/90 text-white"
                  )}
                >
                  {badge === "Hot" && <Flame className="w-3 h-3 mr-1" />}
                  {badge === "New" && <Sparkles className="w-3 h-3 mr-1" />}
                  {badge === "Bestseller" && <Trophy className="w-3 h-3 mr-1" />}
                  {badge === "Featured" && <Star className="w-3 h-3 mr-1" />}
                  {badge}
                </Badge>
              ))}
            </div>

            {/* Category Badge with Gradient */}
            <div className="absolute top-3 right-3">
              <div className={`px-3 py-1.5 bg-gradient-to-r ${categoryGradient} text-white text-xs font-semibold rounded-full shadow-lg backdrop-blur-sm border border-white/20`}>
                {course.category.name}
              </div>
            </div>

            {/* Trending Badge - Bottom Left (appears on hover) */}
            <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-full shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Popular</span>
              </div>
            </div>
          </div>

          {/* Content Section - Enhanced Spacing */}
          <CardContent className="flex-1 p-5 flex flex-col min-h-0">
            {/* Instructor Info */}
            <div className="flex items-center gap-3 mb-3">
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400">
                {secureInstructorAvatar ? (
                  <Image
                    src={secureInstructorAvatar}
                    alt=""
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-xs font-semibold">
                    {course.instructor?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-600 dark:text-slate-400">{course.instructor?.name}</p>
              </div>
              {course.isEnrolled && (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Enrolled
                </Badge>
              )}
            </div>

            {/* Title - Premium Typography */}
            <h3 className="text-lg font-bold mb-2.5 line-clamp-2 leading-snug text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
              {course.title}
            </h3>

            {/* Description - Clean and Readable */}
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-2 mb-4 flex-grow-0">
              {course.description || "No description available for this course."}
            </p>

            {/* Rating Section */}
            <div className="flex items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < Math.floor(course.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`}
                />
              ))}
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 ml-1">
                {course.rating?.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-500">
                ({course.reviewsCount || 0})
              </span>
            </div>

            {/* Course Meta - Glassmorphic Container */}
            <div className="mt-auto space-y-3 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
              {/* Stats Row - Enhanced Design */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {course.chaptersCount || 0} {course.chaptersCount === 1 ? 'Chapter' : 'Chapters'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50">
                  <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {course.duration ? `${course.duration}h` : 'Self-paced'}
                  </span>
                </div>
              </div>

              {/* Progress Bar (if enrolled) */}
              {course.isEnrolled && course.progress !== null && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 dark:text-slate-400">Progress</span>
                    <span className="font-medium text-slate-900 dark:text-white">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>
              )}

              {/* Call to Action - Premium Button */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 dark:text-slate-500">Starting at</span>
                  <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {course.price === 0 ? "Free" : `$${course.price}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-300 shadow-md group-hover:shadow-lg">
                  <span className="text-sm font-semibold">
                    {course.isEnrolled ? 'Continue' : 'Enroll'}
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
};

// Enterprise Filter Sidebar
const EnterpriseFilterSidebar = ({
  filterOptions,
  selectedCategories,
  setSelectedCategories,
  selectedPriceRange,
  setSelectedPriceRange,
  selectedDifficulties,
  setSelectedDifficulties,
  selectedRating,
  setSelectedRating,
  selectedFeatures,
  setSelectedFeatures,
  onClearAll,
  activeFiltersCount
}: any) => {
  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-lg rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full" />
          Filters
        </h3>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            Clear All ({activeFiltersCount})
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Categories */}
        <div>
          <h4 className="font-medium mb-3 text-slate-900 dark:text-white">Categories</h4>
          <div className="space-y-2">
            {filterOptions.categories.map((category: any) => {
              const isActive = selectedCategories.includes(category.id);
              return (
                <label key={category.id} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories([...selectedCategories, category.id]);
                      } else {
                        setSelectedCategories(selectedCategories.filter((c: string) => c !== category.id));
                      }
                    }}
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    {category.name}
                  </span>
                  <Badge variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                    {category.count}
                  </Badge>
                </label>
              );
            })}
          </div>
        </div>

        <Separator className="bg-slate-200/50 dark:bg-slate-700/50" />

        {/* Price Range */}
        <div>
          <h4 className="font-medium mb-3 text-slate-900 dark:text-white">Price Range</h4>
          <div className="space-y-2">
            {filterOptions.priceRanges.map((range: any) => (
              <label key={range.label} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="priceRange"
                  checked={selectedPriceRange?.min === range.min && selectedPriceRange?.max === range.max}
                  onChange={() => setSelectedPriceRange({ min: range.min, max: range.max })}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  {range.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <Separator className="bg-slate-200/50 dark:bg-slate-700/50" />

        {/* Difficulty */}
        <div>
          <h4 className="font-medium mb-3 text-slate-900 dark:text-white">Difficulty Level</h4>
          <div className="space-y-2">
            {filterOptions.difficulties.map((diff: any) => (
              <label key={diff.value} className="flex items-center gap-3 cursor-pointer group">
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
                <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  {diff.label}
                </span>
                <Badge variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                  {diff.count}
                </Badge>
              </label>
            ))}
          </div>
        </div>

        <Separator className="bg-slate-200/50 dark:bg-slate-700/50" />

        {/* Rating Filter */}
        <div>
          <h4 className="font-medium mb-3 text-slate-900 dark:text-white">Minimum Rating</h4>
          <div className="space-y-2">
            {filterOptions.ratings.map((ratingOption: any) => (
              <label key={ratingOption.value} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="rating"
                  checked={selectedRating === ratingOption.value}
                  onChange={() => setSelectedRating(ratingOption.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{ratingOption.label}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <Separator className="bg-slate-200/50 dark:bg-slate-700/50" />

        {/* Features */}
        <div>
          <h4 className="font-medium mb-3 text-slate-900 dark:text-white">Features</h4>
          <div className="space-y-2">
            {filterOptions.features.map((feature: any) => (
              <label key={feature.value} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedFeatures.includes(feature.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedFeatures([...selectedFeatures, feature.value]);
                    } else {
                      setSelectedFeatures(selectedFeatures.filter((f: string) => f !== feature.value));
                    }
                  }}
                  className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  {feature.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Course count info with gradient background */}
        <div className="mt-6 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700/50 dark:to-slate-600/50 border border-blue-100 dark:border-slate-600">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Filtering results
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Enterprise Courses Page Component
export function EnterpriseCoursesPageWithNavbar({
  initialCourses,
  filterOptions,
  totalCourses,
  userId
}: EnterpriseCoursesPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-50px' });

  // State Management
  const [courses, setCourses] = useState<CourseData[]>(initialCourses);
  const [totalCount, setTotalCount] = useState(totalCourses);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Filters State
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Navigation items
  const navItems = [
    { name: "All Courses", link: "/courses" },
    { name: "Learning Paths", link: "/learning-paths" },
    { name: "My Learning", link: "/my-courses" },
    { name: "Categories", link: "/categories" },
  ];

  // Fetch courses when filters change
  const fetchCourses = useCallback(async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams();

      if (debouncedSearchQuery) params.set("search", debouncedSearchQuery);
      if (sortBy) params.set("sort", sortBy);
      params.set("page", currentPage.toString());
      params.set("limit", itemsPerPage.toString());

      if (selectedCategories.length > 0) {
        params.set("categories", selectedCategories.join(","));
      }

      if (selectedPriceRange) {
        params.set("minPrice", selectedPriceRange.min.toString());
        params.set("maxPrice", selectedPriceRange.max.toString());
      }

      if (selectedDifficulties.length > 0) {
        params.set("difficulties", selectedDifficulties.join(","));
      }

      if (selectedRating) {
        params.set("minRating", selectedRating.toString());
      }

      if (selectedFeatures.length > 0) {
        params.set("features", selectedFeatures.join(","));
      }

      const response = await fetch(`/api/courses/search?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setCourses(data.data.courses);
        setTotalCount(data.data.pagination.totalCount);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    debouncedSearchQuery,
    sortBy,
    currentPage,
    itemsPerPage,
    selectedCategories,
    selectedPriceRange,
    selectedDifficulties,
    selectedRating,
    selectedFeatures
  ]);

  // Reset page to 1 when filters/search/sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchQuery,
    sortBy,
    selectedCategories,
    selectedPriceRange,
    selectedDifficulties,
    selectedRating,
    selectedFeatures,
  ]);

  // Trigger fetch when dependencies change
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedPriceRange(null);
    setSelectedDifficulties([]);
    setSelectedRating(null);
    setSelectedFeatures([]);
    setSearchQuery("");
    setSortBy("relevance");
    setCurrentPage(1);
  };

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategories.length > 0) count += selectedCategories.length;
    if (selectedPriceRange) count++;
    if (selectedDifficulties.length > 0) count += selectedDifficulties.length;
    if (selectedRating) count++;
    if (selectedFeatures.length > 0) count += selectedFeatures.length;
    return count;
  }, [
    selectedCategories,
    selectedPriceRange,
    selectedDifficulties,
    selectedRating,
    selectedFeatures
  ]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      {/* Enterprise Resizable Navbar */}
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody className="hidden lg:flex">
          <NavbarLogo />
          <NavItems items={navItems} />
          <div className="relative z-20 flex items-center gap-4">
            {userId ? (
              <Link href="/dashboard">
                <NavbarButton variant="gradient">Dashboard</NavbarButton>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <NavbarButton variant="secondary">Sign In</NavbarButton>
                </Link>
                <Link href="/auth/register">
                  <NavbarButton variant="gradient">Get Started</NavbarButton>
                </Link>
              </>
            )}
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav className="lg:hidden">
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle isOpen={isMobileNavOpen} onClick={() => setIsMobileNavOpen(!isMobileNavOpen)} />
          </MobileNavHeader>

          <MobileNavMenu isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)}>
            <div className="flex flex-col gap-4 w-full">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.link}
                  className="text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Separator />
              {userId ? (
                <Link href="/dashboard" onClick={() => setIsMobileNavOpen(false)}>
                  <NavbarButton variant="gradient" className="w-full">Dashboard</NavbarButton>
                </Link>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/auth/login" onClick={() => setIsMobileNavOpen(false)}>
                    <NavbarButton variant="secondary" className="w-full">Sign In</NavbarButton>
                  </Link>
                  <Link href="/auth/register" onClick={() => setIsMobileNavOpen(false)}>
                    <NavbarButton variant="gradient" className="w-full">Get Started</NavbarButton>
                  </Link>
                </div>
              )}
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      {/* Hero Section with Search Bar */}
      <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-20">
        {/* Subtle animated background pattern */}
        <div className="absolute inset-0 opacity-30" aria-hidden="true">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 dark:bg-blue-900/20 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-3xl animate-pulse" />
          <div className="absolute top-40 right-20 w-96 h-96 bg-indigo-200 dark:bg-indigo-900/20 rounded-full mix-blend-multiply dark:mix-blend-overlay filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-blue-200/50 dark:border-blue-500/30 shadow-sm mb-4">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {totalCount} Courses Available
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.1] tracking-tight text-slate-900 dark:text-white mb-4">
              <span className="block">Master New Skills</span>
              <span className="block bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                Advance Your Career
              </span>
            </h1>
            <p className="mt-4 text-base sm:text-lg md:text-xl leading-relaxed text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Learn from industry experts with AI-powered personalized learning paths
            </p>
          </motion.div>

          {/* Enterprise Search Bar */}
          <motion.div
            className="max-w-4xl mx-auto"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
          >
            <div className="relative">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                type="search"
                placeholder="Search for courses by topic, skill, or instructor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 pr-40 py-6 text-lg bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
              />
              <Button
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl px-6"
              >
                <Brain className="w-4 h-4 mr-2" />
                AI Search
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content Section */}
      <section ref={sectionRef} className="container relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        {/* Controls Bar */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Results Info */}
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {isLoading ? 'Loading...' : `${totalCount} Courses`}
            </h2>
            {activeFiltersCount > 0 && (
              <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                {activeFiltersCount} active {activeFiltersCount === 1 ? 'filter' : 'filters'}
              </Badge>
            )}
          </div>

          {/* View Controls */}
          <div className="flex gap-3 items-center">
            {/* Mobile Filter Button */}
            <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filter Courses</SheetTitle>
                  <SheetDescription>Refine your course search</SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-full mt-4">
                  <EnterpriseFilterSidebar
                    filterOptions={filterOptions}
                    selectedCategories={selectedCategories}
                    setSelectedCategories={setSelectedCategories}
                    selectedPriceRange={selectedPriceRange}
                    setSelectedPriceRange={setSelectedPriceRange}
                    selectedDifficulties={selectedDifficulties}
                    setSelectedDifficulties={setSelectedDifficulties}
                    selectedRating={selectedRating}
                    setSelectedRating={setSelectedRating}
                    selectedFeatures={selectedFeatures}
                    setSelectedFeatures={setSelectedFeatures}
                    onClearAll={clearAllFilters}
                    activeFiltersCount={activeFiltersCount}
                  />
                </ScrollArea>
              </SheetContent>
            </Sheet>

            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-48 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Most Relevant</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="duration-short">Duration: Short to Long</SelectItem>
                <SelectItem value="duration-long">Duration: Long to Short</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="hidden md:flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
                aria-label="Grid view"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
                className="rounded-none border-x border-slate-200 dark:border-slate-700"
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "compact" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("compact")}
                className="rounded-l-none"
                aria-label="Compact view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Grid with Sidebar and Courses */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Left Column: Filter Sidebar (1/4 width) - Desktop Only */}
          <motion.div
            className="hidden lg:block lg:col-span-1"
            variants={fadeInUp}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            transition={{ delay: 0.2 }}
          >
            <div className="sticky top-24">
              <EnterpriseFilterSidebar
                filterOptions={filterOptions}
                selectedCategories={selectedCategories}
                setSelectedCategories={setSelectedCategories}
                selectedPriceRange={selectedPriceRange}
                setSelectedPriceRange={setSelectedPriceRange}
                selectedDifficulties={selectedDifficulties}
                setSelectedDifficulties={setSelectedDifficulties}
                selectedRating={selectedRating}
                setSelectedRating={setSelectedRating}
                selectedFeatures={selectedFeatures}
                setSelectedFeatures={setSelectedFeatures}
                onClearAll={clearAllFilters}
                activeFiltersCount={activeFiltersCount}
              />
            </div>
          </motion.div>

          {/* Right Column: Course Cards Grid (3/4 width) */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(9)].map((_, i) => (
                  <Skeleton key={i} className="h-96 rounded-3xl" />
                ))}
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${sortBy}-${activeFiltersCount}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: shouldReduceMotion ? 0.01 : 0.3 }}
                >
                  {courses.length > 0 ? (
                    <motion.div
                      className={cn(
                        "grid gap-6",
                        viewMode === "grid" && "sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
                        viewMode === "list" && "grid-cols-1",
                        viewMode === "compact" && "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                      )}
                      variants={staggerContainer}
                      initial="hidden"
                      animate={isInView ? 'visible' : 'hidden'}
                    >
                      {courses.map((course, index) => (
                        <motion.div
                          key={course.id}
                          variants={fadeInUp}
                          transition={{ delay: index * 0.05 }}
                        >
                          <EnterpriseCourseCard
                            course={course}
                            viewMode={viewMode}
                            isPriority={index === 0}
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
                        <p className="text-lg font-medium text-slate-600 dark:text-slate-400">No courses found matching your filters.</p>
                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">Try adjusting your search criteria</p>
                        <Button
                          variant="outline"
                          className="mt-6"
                          onClick={clearAllFilters}
                        >
                          Clear All Filters
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
