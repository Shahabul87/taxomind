"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Search,
  Filter,
  Grid3x3,
  List,
  X,
  SlidersHorizontal,
  BookOpen,
  Users,
  Star,
  Clock,
  DollarSign,
  Loader2,
  ChevronDown,
  TrendingUp,
  Award,
  Play,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
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
    rating?: number;
  };
  rating?: number;
  reviewsCount?: number;
  enrolledCount?: number;
  hasCertificate?: boolean;
  hasExercises?: boolean;
  badges?: Array<"New" | "Bestseller" | "Hot" | "Updated" | "Featured">;
  isEnrolled?: boolean;
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

interface ElegantCoursesPageProps {
  initialCourses: CourseData[];
  filterOptions: FilterOptions;
  totalCourses: number;
  userId?: string;
}

type ViewMode = "grid" | "list";
type SortOption =
  | "relevance"
  | "popular"
  | "rating"
  | "newest"
  | "price-low"
  | "price-high";

export function ElegantCoursesPage({
  initialCourses,
  filterOptions,
  totalCourses,
  userId,
}: ElegantCoursesPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  // Filters State
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<{
    min: number;
    max: number;
  } | null>(null);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(
    []
  );
  const [selectedDuration, setSelectedDuration] = useState<{
    min: number;
    max: number;
  } | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

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

      if (selectedDuration) {
        params.set("minDuration", selectedDuration.min.toString());
        params.set("maxDuration", selectedDuration.max.toString());
      }

      if (selectedRating) {
        params.set("minRating", selectedRating.toString());
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
    selectedDuration,
    selectedRating,
  ]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearchQuery,
    sortBy,
    selectedCategories,
    selectedPriceRange,
    selectedDifficulties,
    selectedDuration,
    selectedRating,
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
    setSelectedDuration(null);
    setSelectedRating(null);
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
    if (selectedDuration) count++;
    if (selectedRating) count++;
    return count;
  }, [
    selectedCategories,
    selectedPriceRange,
    selectedDifficulties,
    selectedDuration,
    selectedRating,
  ]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Filter Panel Component
  const FilterPanel = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="space-y-6">
      {/* Categories Filter */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Categories
        </h3>
        <div className="space-y-3">
          {filterOptions.categories.slice(0, 8).map((category) => (
            <div key={category.id} className="flex items-center">
              <Checkbox
                id={`cat-${category.id}`}
                checked={selectedCategories.includes(category.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedCategories([...selectedCategories, category.id]);
                  } else {
                    setSelectedCategories(
                      selectedCategories.filter((id) => id !== category.id)
                    );
                  }
                }}
              />
              <Label
                htmlFor={`cat-${category.id}`}
                className="ml-3 text-sm text-slate-600 dark:text-slate-300 cursor-pointer flex-1"
              >
                {category.name}
                <span className="ml-2 text-xs text-slate-400">
                  ({category.count})
                </span>
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-slate-200/50 dark:bg-slate-700/50" />

      {/* Price Range Filter */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Price Range
        </h3>
        <RadioGroup
          value={
            selectedPriceRange
              ? `${selectedPriceRange.min}-${selectedPriceRange.max}`
              : ""
          }
          onValueChange={(value) => {
            if (!value) {
              setSelectedPriceRange(null);
              return;
            }
            const [min, max] = value.split("-").map(Number);
            setSelectedPriceRange({ min, max });
          }}
        >
          <div className="space-y-3">
            {filterOptions.priceRanges.map((range) => (
              <div key={range.label} className="flex items-center">
                <RadioGroupItem
                  value={`${range.min}-${range.max}`}
                  id={`price-${range.label}`}
                />
                <Label
                  htmlFor={`price-${range.label}`}
                  className="ml-3 text-sm text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  {range.label}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>

      <Separator className="bg-slate-200/50 dark:bg-slate-700/50" />

      {/* Difficulty Filter */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Difficulty Level
        </h3>
        <div className="space-y-3">
          {filterOptions.difficulties.map((difficulty) => (
            <div key={difficulty.value} className="flex items-center">
              <Checkbox
                id={`diff-${difficulty.value}`}
                checked={selectedDifficulties.includes(difficulty.value)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedDifficulties([
                      ...selectedDifficulties,
                      difficulty.value,
                    ]);
                  } else {
                    setSelectedDifficulties(
                      selectedDifficulties.filter(
                        (d) => d !== difficulty.value
                      )
                    );
                  }
                }}
              />
              <Label
                htmlFor={`diff-${difficulty.value}`}
                className="ml-3 text-sm text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                {difficulty.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-slate-200/50 dark:bg-slate-700/50" />

      {/* Rating Filter */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Minimum Rating
        </h3>
        <RadioGroup
          value={selectedRating?.toString() || ""}
          onValueChange={(value) => {
            setSelectedRating(value ? parseFloat(value) : null);
          }}
        >
          <div className="space-y-3">
            {filterOptions.ratings.map((rating) => (
              <div key={rating.value} className="flex items-center">
                <RadioGroupItem
                  value={rating.value.toString()}
                  id={`rating-${rating.value}`}
                />
                <Label
                  htmlFor={`rating-${rating.value}`}
                  className="ml-3 text-sm text-slate-600 dark:text-slate-300 cursor-pointer flex items-center"
                >
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                  {rating.label}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>

      {/* Clear Filters Button */}
      {activeFiltersCount > 0 && (
        <Button
          variant="outline"
          onClick={clearAllFilters}
          className="w-full border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-4 h-4 mr-2" />
          Clear All Filters ({activeFiltersCount})
        </Button>
      )}
    </div>
  );

  // Course Card Component
  const CourseCard = ({ course }: { course: CourseData }) => (
    <Link href={`/courses/${course.id}`}>
      <Card className="group overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] h-full">
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={course.imageUrl}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />
          {course.badges && course.badges.length > 0 && (
            <div className="absolute top-3 left-3 flex gap-2">
              {course.badges.map((badge) => (
                <Badge
                  key={badge}
                  className={cn(
                    "text-xs font-semibold",
                    badge === "New" &&
                      "bg-gradient-to-r from-blue-500 to-indigo-500",
                    badge === "Bestseller" &&
                      "bg-gradient-to-r from-emerald-500 to-teal-500",
                    badge === "Hot" &&
                      "bg-gradient-to-r from-orange-500 to-red-500"
                  )}
                >
                  {badge}
                </Badge>
              ))}
            </div>
          )}
          {course.isEnrolled && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Enrolled
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-5">
          {/* Category & Difficulty */}
          <div className="flex items-center justify-between mb-3">
            <Badge
              variant="outline"
              className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs"
            >
              {course.category.name}
            </Badge>
            {course.difficulty && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {course.difficulty}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {course.title}
          </h3>

          {/* Instructor */}
          {course.instructor && (
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold">
                {course.instructor.name.charAt(0)}
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-300">
                {course.instructor.name}
              </span>
            </div>
          )}

          {/* Rating & Students */}
          <div className="flex items-center gap-4 mb-4">
            {course.rating !== undefined && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {course.rating.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  ({course.reviewsCount})
                </span>
              </div>
            )}
            {course.enrolledCount !== undefined && (
              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <Users className="w-4 h-4" />
                <span className="text-sm">
                  {course.enrolledCount.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="flex items-center gap-3 mb-4 text-xs text-slate-600 dark:text-slate-300">
            {course.duration && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{Math.floor(course.duration / 60)}h</span>
              </div>
            )}
            {course.lessonsCount && (
              <div className="flex items-center gap-1">
                <Play className="w-3 h-3" />
                <span>{course.lessonsCount} lessons</span>
              </div>
            )}
            {course.hasCertificate && (
              <div className="flex items-center gap-1">
                <Award className="w-3 h-3" />
                <span>Certificate</span>
              </div>
            )}
          </div>

          <Separator className="my-4 bg-slate-200/50 dark:bg-slate-700/50" />

          {/* Price & CTA */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                ${course.price}
              </div>
              {course.originalPrice && course.originalPrice > course.price && (
                <div className="text-sm text-slate-500 dark:text-slate-400 line-through">
                  ${course.originalPrice}
                </div>
              )}
            </div>
            <Button
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
            >
              {course.isEnrolled ? "Continue" : "Enroll Now"}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-8 sm:py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
              Explore Our Courses
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8">
              Learn at your own pace with expert-led courses. AI-powered
              adaptive learning and industry-recognized certificates.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              <div>
                <div className="text-2xl sm:text-3xl font-bold">{totalCourses}+</div>
                <div className="text-xs sm:text-sm text-white/80">Courses</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold">50K+</div>
                <div className="text-xs sm:text-sm text-white/80">Students</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold">4.8</div>
                <div className="text-xs sm:text-sm text-white/80">Avg Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Search & Controls Bar */}
      <div className="sticky top-0 z-40 w-full -mt-12 mb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="mx-auto max-w-7xl">
            {/* Floating Navbar */}
            <div className="bg-gradient-to-r from-sky-500/95 via-sky-600/95 to-sky-500/95 dark:from-slate-800/95 dark:via-slate-700/95 dark:to-slate-800/95 backdrop-blur-sm border border-sky-400/30 dark:border-slate-600/30 rounded-md px-2 sm:px-4 py-2 sm:py-3 shadow-[0_8px_30px_rgb(0,0,0,0.12),0_2px_6px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3),0_2px_6px_rgb(0,0,0,0.2)] transition-all duration-300">
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-[200px] sm:max-w-md">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-sky-800 dark:text-slate-300">
                    <Search className="w-4 h-4" />
                  </div>
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 !bg-white/95 dark:!bg-slate-700/90 border-sky-300 dark:border-slate-600 rounded-md text-sm text-slate-900 dark:text-white placeholder:text-sky-700 dark:placeholder:text-slate-500 focus:border-white dark:focus:border-blue-400 focus:ring-2 focus:ring-white/50 dark:focus:ring-blue-400 transition-colors"
                  />
                </div>

                {/* Filters Dropdown */}
                <div className="hidden md:flex items-center gap-2">
                  <Select
                    value={selectedCategories[0] || "all"}
                    onValueChange={(value) => {
                      if (value && value !== "all") {
                        setSelectedCategories([value]);
                      } else {
                        setSelectedCategories([]);
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 w-[140px] bg-white/95 dark:bg-slate-700/90 border-sky-300 dark:border-slate-600 rounded-md text-sm text-slate-900 dark:text-white focus:border-white dark:focus:border-blue-400 focus:ring-2 focus:ring-white/50 dark:focus:ring-blue-400 transition-colors">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {filterOptions.categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={selectedDifficulties[0] || "all"}
                    onValueChange={(value) => {
                      if (value && value !== "all") {
                        setSelectedDifficulties([value]);
                      } else {
                        setSelectedDifficulties([]);
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 w-[130px] bg-white/95 dark:bg-slate-700/90 border-sky-300 dark:border-slate-600 rounded-md text-sm text-slate-900 dark:text-white focus:border-white dark:focus:border-blue-400 focus:ring-2 focus:ring-white/50 dark:focus:ring-blue-400 transition-colors">
                      <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      {filterOptions.difficulties.map((diff) => (
                        <SelectItem key={diff.value} value={diff.value}>
                          {diff.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={
                      selectedPriceRange
                        ? `${selectedPriceRange.min}-${selectedPriceRange.max}`
                        : "all"
                    }
                    onValueChange={(value) => {
                      if (value && value !== "all") {
                        const [min, max] = value.split("-").map(Number);
                        setSelectedPriceRange({ min, max });
                      } else {
                        setSelectedPriceRange(null);
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 w-[120px] bg-white/95 dark:bg-slate-700/90 border-sky-300 dark:border-slate-600 rounded-md text-sm text-slate-900 dark:text-white focus:border-white dark:focus:border-blue-400 focus:ring-2 focus:ring-white/50 dark:focus:ring-blue-400 transition-colors">
                      <SelectValue placeholder="Price" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Price</SelectItem>
                      {filterOptions.priceRanges.map((range) => (
                        <SelectItem
                          key={range.label}
                          value={`${range.min}-${range.max}`}
                        >
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort */}
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger className="h-9 w-[100px] sm:w-[140px] md:w-[180px] bg-white/95 dark:bg-slate-700/90 border-sky-300 dark:border-slate-600 rounded-md text-sm text-slate-900 dark:text-white focus:border-white dark:focus:border-blue-400 focus:ring-2 focus:ring-white/50 dark:focus:ring-blue-400 transition-colors">
                    <TrendingUp className="w-4 h-4 mr-1 sm:mr-2 hidden sm:inline" />
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Most Relevant</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode */}
                <div className="hidden sm:flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "h-9 w-9 rounded-md text-white hover:bg-white/20 dark:hover:bg-white/20",
                      viewMode === "grid" &&
                        "bg-white/30 hover:bg-white/40 dark:bg-white/30 dark:hover:bg-white/40"
                    )}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "h-9 w-9 rounded-md text-white hover:bg-white/20 dark:hover:bg-white/20",
                      viewMode === "list" &&
                        "bg-white/30 hover:bg-white/40 dark:bg-white/30 dark:hover:bg-white/40"
                    )}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>

                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="h-9 rounded-md text-xs hidden lg:flex text-white hover:bg-white/20 dark:hover:bg-white/20"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                )}

                {/* Mobile Filter Button */}
                <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden h-9 w-9 rounded-md text-white hover:bg-white/20 dark:hover:bg-white/20"
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      {activeFiltersCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-white text-sky-600 text-[10px] p-0 flex items-center justify-center font-bold">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:w-[400px] overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-6">
                      {/* Mobile Filters Content */}
                      <div className="grid grid-cols-1 gap-4">
                  {/* Categories Quick Filter */}
                  <div>
                    <Label className="text-sm font-semibold text-slate-900 dark:text-white mb-2 block">
                      Category
                    </Label>
                    <Select
                      value={selectedCategories[0] || "all"}
                      onValueChange={(value) => {
                        if (value && value !== "all") {
                          setSelectedCategories([value]);
                        } else {
                          setSelectedCategories([]);
                        }
                      }}
                    >
                      <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-700/50">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {filterOptions.categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name} ({cat.count})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Range Quick Filter */}
                  <div>
                    <Label className="text-sm font-semibold text-slate-900 dark:text-white mb-2 block">
                      Price Range
                    </Label>
                    <Select
                      value={
                        selectedPriceRange
                          ? `${selectedPriceRange.min}-${selectedPriceRange.max}`
                          : "all"
                      }
                      onValueChange={(value) => {
                        if (value && value !== "all") {
                          const [min, max] = value.split("-").map(Number);
                          setSelectedPriceRange({ min, max });
                        } else {
                          setSelectedPriceRange(null);
                        }
                      }}
                    >
                      <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-700/50">
                        <SelectValue placeholder="Any Price" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Price</SelectItem>
                        {filterOptions.priceRanges.map((range) => (
                          <SelectItem
                            key={range.label}
                            value={`${range.min}-${range.max}`}
                          >
                            {range.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Difficulty Quick Filter */}
                  <div>
                    <Label className="text-sm font-semibold text-slate-900 dark:text-white mb-2 block">
                      Difficulty
                    </Label>
                    <Select
                      value={selectedDifficulties[0] || "all"}
                      onValueChange={(value) => {
                        if (value && value !== "all") {
                          setSelectedDifficulties([value]);
                        } else {
                          setSelectedDifficulties([]);
                        }
                      }}
                    >
                      <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-700/50">
                        <SelectValue placeholder="All Levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        {filterOptions.difficulties.map((diff) => (
                          <SelectItem key={diff.value} value={diff.value}>
                            {diff.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Rating Quick Filter */}
                  <div>
                    <Label className="text-sm font-semibold text-slate-900 dark:text-white mb-2 block">
                      Min Rating
                    </Label>
                    <Select
                      value={selectedRating?.toString() || "all"}
                      onValueChange={(value) => {
                        if (value && value !== "all") {
                          setSelectedRating(parseFloat(value));
                        } else {
                          setSelectedRating(null);
                        }
                      }}
                    >
                      <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-700/50">
                        <SelectValue placeholder="Any Rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any Rating</SelectItem>
                        {filterOptions.ratings.map((rating) => (
                          <SelectItem
                            key={rating.value}
                            value={rating.value.toString()}
                          >
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              {rating.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                      {/* Clear Filters Button */}
                      {activeFiltersCount > 0 && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            clearAllFilters();
                            setIsMobileFilterOpen(false);
                          }}
                          className="w-full"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Clear All Filters ({activeFiltersCount})
                        </Button>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Content Area */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <main className="w-full">
            {/* Results Header */}
            <div className="mb-6">
              <p className="text-slate-600 dark:text-slate-300">
                Showing{" "}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {courses.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {totalCount}
                </span>{" "}
                courses
              </p>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            )}

            {/* Empty State */}
            {!isLoading && courses.length === 0 && (
              <div className="text-center py-20">
                <BookOpen className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                  No courses found
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Try adjusting your filters or search query
                </p>
                <Button
                  onClick={clearAllFilters}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                >
                  Clear All Filters
                </Button>
              </div>
            )}

            {/* Courses Grid */}
            {!isLoading && courses.length > 0 && (
              <>
                <div
                  className={cn(
                    "grid gap-4 sm:gap-6",
                    viewMode === "grid"
                      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
                      : "grid-cols-1"
                  )}
                >
                  {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex flex-wrap justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="border-slate-200/50 dark:border-slate-700/50"
                    >
                      <span className="hidden sm:inline">Previous</span>
                      <span className="sm:hidden">Prev</span>
                    </Button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            "w-9 h-9",
                            currentPage === page &&
                              "bg-gradient-to-r from-blue-500 to-indigo-500"
                          )}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="border-slate-200/50 dark:border-slate-700/50"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
    </div>
  );
}
