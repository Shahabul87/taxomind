"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Search,
  Filter,
  Star,
  Clock,
  BookOpen,
  Users,
  Award,
  TrendingUp,
  Sparkles,
  Grid3x3,
  List,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  Heart,
  Play,
  GraduationCap,
  Flame,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";
import { CoursePreviewModal, type MarketplaceCourse } from "./CoursePreviewModal";

/**
 * Filter options from the API
 */
interface FilterOptions {
  categories: { id: string; name: string; count: number }[];
  priceRanges: { label: string; min: number; max: number }[];
  difficulties: { value: string; label: string; count: number }[];
  durations: { label: string; min: number; max: number }[];
  ratings: { value: number; label: string }[];
  features: { value: string; label: string }[];
}

/**
 * Active filters state
 */
interface ActiveFilters {
  search: string;
  categories: string[];
  priceRange: [number, number];
  difficulties: string[];
  durationRange: [number, number];
  minRating: number;
  features: string[];
  sort: string;
}

export interface CourseMarketplaceProps {
  className?: string;
  compact?: boolean;
  showHeader?: boolean;
  showFilters?: boolean;
  maxCourses?: number;
  defaultCategory?: string;
  onCourseSelect?: (course: MarketplaceCourse) => void;
  onEnroll?: (courseId: string) => void;
}

/**
 * CourseMarketplace Component
 *
 * A comprehensive course discovery and browsing interface with advanced filtering,
 * search, and multiple view modes.
 */
export function CourseMarketplace({
  className,
  compact = false,
  showHeader = true,
  showFilters = true,
  maxCourses,
  defaultCategory,
  onCourseSelect,
  onEnroll,
}: CourseMarketplaceProps) {
  // Refs for mutable values to avoid dependency issues
  const pageRef = useRef(1);
  const sortRef = useRef("relevance");

  // State
  const [courses, setCourses] = useState<MarketplaceCourse[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // UI State
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"all" | "featured" | "trending" | "new">("all");
  const [showFilterPanel, setShowFilterPanel] = useState(!compact);
  const [previewCourse, setPreviewCourse] = useState<MarketplaceCourse | null>(null);

  // Filter State
  const [filters, setFilters] = useState<ActiveFilters>({
    search: "",
    categories: defaultCategory ? [defaultCategory] : [],
    priceRange: [0, 1000],
    difficulties: [],
    durationRange: [0, 600],
    minRating: 0,
    features: [],
    sort: "relevance",
  });

  // Debounced search
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  /**
   * Fetch courses from the API
   */
  const fetchCourses = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setIsLoading(true);
        pageRef.current = 1;
      } else {
        setIsLoadingMore(true);
      }

      const params = new URLSearchParams();
      params.set("page", pageRef.current.toString());
      params.set("limit", (maxCourses || 12).toString());
      params.set("sort", filters.sort);

      if (filters.search) {
        params.set("search", filters.search);
      }

      if (filters.categories.length > 0) {
        params.set("categories", filters.categories.join(","));
      }

      if (filters.difficulties.length > 0) {
        params.set("difficulties", filters.difficulties.join(","));
      }

      if (filters.priceRange[0] > 0) {
        params.set("minPrice", filters.priceRange[0].toString());
      }

      if (filters.priceRange[1] < 1000) {
        params.set("maxPrice", filters.priceRange[1].toString());
      }

      if (filters.minRating > 0) {
        params.set("minRating", filters.minRating.toString());
      }

      if (filters.features.length > 0) {
        params.set("features", filters.features.join(","));
      }

      const response = await fetch(`/api/courses/search?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        const newCourses: MarketplaceCourse[] = data.data.courses.map((course: Record<string, unknown>) => ({
          id: course.id as string,
          title: course.title as string,
          subtitle: course.subtitle as string | undefined,
          description: course.description as string,
          imageUrl: course.imageUrl as string || "/images/course-placeholder.svg",
          price: course.price as number || 0,
          originalPrice: course.originalPrice as number | undefined,
          category: course.category as { id: string; name: string },
          instructor: course.instructor as MarketplaceCourse["instructor"],
          chaptersCount: course.chaptersCount as number || 0,
          lessonsCount: course.lessonsCount as number || 0,
          duration: course.duration as number || 0,
          difficulty: course.difficulty as string || "Beginner",
          rating: course.rating as number || 0,
          reviewsCount: course.reviewsCount as number || 0,
          enrolledCount: course.enrolledCount as number || 0,
          completionRate: course.completionRate as number | undefined,
          hasCertificate: course.hasCertificate as boolean ?? true,
          hasExercises: course.hasExercises as boolean ?? true,
          badges: (course.badges || []) as MarketplaceCourse["badges"],
          isEnrolled: course.isEnrolled as boolean ?? false,
          isWishlisted: course.isWishlisted as boolean ?? false,
          lastUpdated: course.lastUpdated as string || new Date().toISOString(),
        }));

        if (reset) {
          setCourses(newCourses);
        } else {
          setCourses((prev) => [...prev, ...newCourses]);
        }

        setFilterOptions(data.data.filterOptions);
        setTotalCount(data.data.pagination.totalCount);
        setHasMore(pageRef.current < data.data.pagination.totalPages);
      } else {
        toast.error("Failed to load courses");
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to load courses");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [filters, maxCourses]);

  // Initial load
  useEffect(() => {
    fetchCourses(true);
  }, [fetchCourses]);

  // Handle search with debounce
  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchCourses(true);
    }, 300);
  };

  // Handle filter changes
  const handleFilterChange = <K extends keyof ActiveFilters>(
    key: K,
    value: ActiveFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Apply filters
  const applyFilters = () => {
    fetchCourses(true);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: "",
      categories: [],
      priceRange: [0, 1000],
      difficulties: [],
      durationRange: [0, 600],
      minRating: 0,
      features: [],
      sort: "relevance",
    });
    fetchCourses(true);
  };

  // Load more courses
  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      pageRef.current += 1;
      fetchCourses(false);
    }
  };

  // Handle course preview
  const handleCourseClick = (course: MarketplaceCourse) => {
    if (onCourseSelect) {
      onCourseSelect(course);
    } else {
      setPreviewCourse(course);
    }
  };

  // Handle enrollment
  const handleEnroll = (courseId: string) => {
    if (onEnroll) {
      onEnroll(courseId);
    } else {
      // Default: Navigate to course page
      window.location.href = `/courses/${courseId}`;
    }
  };

  // Format duration
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  // Filter courses by tab
  const getFilteredCourses = () => {
    let filtered = [...courses];

    switch (activeTab) {
      case "featured":
        filtered = filtered.filter((c) => c.badges.includes("Bestseller") || c.badges.includes("Top Rated"));
        break;
      case "trending":
        filtered = filtered.filter((c) => c.badges.includes("Popular")).sort((a, b) => b.enrolledCount - a.enrolledCount);
        break;
      case "new":
        filtered = filtered.filter((c) => c.badges.includes("New")).sort((a, b) =>
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
        );
        break;
    }

    return filtered;
  };

  const filteredCourses = getFilteredCourses();

  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-3.5 w-3.5",
              star <= Math.floor(rating)
                ? "fill-amber-400 text-amber-400"
                : "fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700"
            )}
          />
        ))}
      </div>
    );
  };

  // Render course card (Grid View)
  const renderCourseCard = (course: MarketplaceCourse, index: number) => (
    <motion.div
      key={course.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card
        className="group cursor-pointer overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-700/50"
        onClick={() => handleCourseClick(course)}
      >
        {/* Image */}
        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
          <Image
            src={course.imageUrl}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Button size="sm" className="gap-2">
              <Play className="h-4 w-4" />
              Preview
            </Button>
          </div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {course.badges.slice(0, 2).map((badge) => (
              <Badge
                key={badge}
                className={cn(
                  "text-[10px] px-1.5 py-0.5",
                  badge === "Bestseller" && "bg-amber-500 text-white border-0",
                  badge === "New" && "bg-emerald-500 text-white border-0",
                  badge === "Popular" && "bg-blue-500 text-white border-0",
                  badge === "Top Rated" && "bg-purple-500 text-white border-0"
                )}
              >
                {badge}
              </Badge>
            ))}
          </div>

          {/* Wishlist */}
          <button
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 dark:bg-slate-900/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-slate-900"
            onClick={(e) => {
              e.stopPropagation();
              toast.success(course.isWishlisted ? "Removed from wishlist" : "Added to wishlist");
            }}
          >
            <Heart
              className={cn(
                "h-4 w-4",
                course.isWishlisted ? "fill-red-500 text-red-500" : "text-slate-600"
              )}
            />
          </button>

          {/* Price Badge */}
          <div className="absolute bottom-2 right-2">
            <Badge
              variant={course.price === 0 ? "default" : "secondary"}
              className={cn(
                "font-bold",
                course.price === 0 && "bg-emerald-500 text-white"
              )}
            >
              {course.price === 0 ? "Free" : formatPrice(course.price)}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Category */}
          <Badge variant="outline" className="text-[10px]">
            {course.category.name}
          </Badge>

          {/* Title */}
          <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>

          {/* Instructor */}
          {course.instructor && (
            <p className="text-xs text-muted-foreground">
              by {course.instructor.name}
            </p>
          )}

          {/* Stats Row */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(course.duration)}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {course.lessonsCount} lessons
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {course.enrolledCount.toLocaleString()}
            </span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {renderStars(course.rating)}
            <span className="text-sm font-medium">{course.rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">
              ({course.reviewsCount} reviews)
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // Render course card (List View)
  const renderCourseListItem = (course: MarketplaceCourse, index: number) => (
    <motion.div
      key={course.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card
        className="group cursor-pointer hover:shadow-lg transition-all duration-300 bg-white dark:bg-slate-900"
        onClick={() => handleCourseClick(course)}
      >
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Image */}
            <div className="relative w-48 aspect-video flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
              <Image
                src={course.imageUrl}
                alt={course.title}
                fill
                className="object-cover"
              />
              {/* Badges */}
              <div className="absolute top-1 left-1 flex flex-wrap gap-1">
                {course.badges.slice(0, 1).map((badge) => (
                  <Badge
                    key={badge}
                    className={cn(
                      "text-[10px] px-1.5 py-0.5",
                      badge === "Bestseller" && "bg-amber-500 text-white border-0",
                      badge === "New" && "bg-emerald-500 text-white border-0",
                      badge === "Popular" && "bg-blue-500 text-white border-0",
                      badge === "Top Rated" && "bg-purple-500 text-white border-0"
                    )}
                  >
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge variant="outline" className="text-[10px] mb-2">
                    {course.category.name}
                  </Badge>
                  <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  {course.subtitle && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {course.subtitle}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  {course.price === 0 ? (
                    <Badge className="bg-emerald-500 text-white">Free</Badge>
                  ) : (
                    <div>
                      <span className="font-bold text-lg">{formatPrice(course.price)}</span>
                      {course.originalPrice && course.originalPrice > course.price && (
                        <span className="text-sm text-muted-foreground line-through ml-2">
                          {formatPrice(course.originalPrice)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {course.instructor && (
                <p className="text-xs text-muted-foreground">
                  by {course.instructor.name}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(course.duration)}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {course.lessonsCount} lessons
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {course.enrolledCount.toLocaleString()} students
                </span>
                <div className="flex items-center gap-1">
                  {renderStars(course.rating)}
                  <span className="font-medium">{course.rating.toFixed(1)}</span>
                  <span>({course.reviewsCount})</span>
                </div>
              </div>

              {/* Features */}
              <div className="flex items-center gap-2 pt-2">
                <Badge variant="secondary" className="text-[10px]">
                  {course.difficulty}
                </Badge>
                {course.hasCertificate && (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Award className="h-3 w-3" />
                    Certificate
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // Render loading skeleton
  const renderSkeleton = () => (
    <div className={cn(
      viewMode === "grid"
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        : "space-y-4"
    )}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          {viewMode === "grid" ? (
            <>
              <Skeleton className="aspect-video w-full" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="p-4">
              <div className="flex gap-4">
                <Skeleton className="w-48 aspect-video flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      {showHeader && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              Course Marketplace
            </h2>
            <p className="text-muted-foreground">
              Discover {totalCount.toLocaleString()} courses to accelerate your learning
            </p>
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            {showFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className="gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Search & Quick Filters */}
      <Card className="border-slate-200/50 dark:border-slate-700/50">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort */}
            <Select
              value={filters.sort}
              onValueChange={(value) => {
                handleFilterChange("sort", value);
                sortRef.current = value;
                fetchCourses(true);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Filter Panel */}
        {showFilters && showFilterPanel && (
          <Card className="w-64 flex-shrink-0 h-fit sticky top-4">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Categories */}
              {filterOptions?.categories && filterOptions.categories.length > 0 && (
                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium">
                    Categories
                    <ChevronDown className="h-4 w-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2 space-y-2">
                    {filterOptions.categories.slice(0, 8).map((cat) => (
                      <div key={cat.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`cat-${cat.id}`}
                          checked={filters.categories.includes(cat.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              handleFilterChange("categories", [...filters.categories, cat.id]);
                            } else {
                              handleFilterChange(
                                "categories",
                                filters.categories.filter((c) => c !== cat.id)
                              );
                            }
                          }}
                        />
                        <label
                          htmlFor={`cat-${cat.id}`}
                          className="text-sm flex-1 cursor-pointer"
                        >
                          {cat.name}
                        </label>
                        <span className="text-xs text-muted-foreground">
                          ({cat.count})
                        </span>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Difficulty */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium">
                  Difficulty
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 space-y-2">
                  {["Beginner", "Intermediate", "Advanced", "Expert"].map((level) => (
                    <div key={level} className="flex items-center gap-2">
                      <Checkbox
                        id={`diff-${level}`}
                        checked={filters.difficulties.includes(level)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleFilterChange("difficulties", [...filters.difficulties, level]);
                          } else {
                            handleFilterChange(
                              "difficulties",
                              filters.difficulties.filter((d) => d !== level)
                            );
                          }
                        }}
                      />
                      <label
                        htmlFor={`diff-${level}`}
                        className="text-sm cursor-pointer"
                      >
                        {level}
                      </label>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              {/* Price Range */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium">
                  Price Range
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4">
                  <Slider
                    value={filters.priceRange}
                    min={0}
                    max={500}
                    step={10}
                    onValueChange={(value) => handleFilterChange("priceRange", value as [number, number])}
                    className="mb-2"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>${filters.priceRange[0]}</span>
                    <span>${filters.priceRange[1]}+</span>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Rating */}
              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium">
                  Rating
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 space-y-2">
                  {[4.5, 4.0, 3.5, 3.0].map((rating) => (
                    <div key={rating} className="flex items-center gap-2">
                      <Checkbox
                        id={`rating-${rating}`}
                        checked={filters.minRating === rating}
                        onCheckedChange={(checked) => {
                          handleFilterChange("minRating", checked ? rating : 0);
                        }}
                      />
                      <label
                        htmlFor={`rating-${rating}`}
                        className="text-sm cursor-pointer flex items-center gap-1"
                      >
                        {renderStars(rating)}
                        <span>{rating}+</span>
                      </label>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              {/* Apply Button */}
              <Button onClick={applyFilters} className="w-full">
                Apply Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Course Grid */}
        <div className="flex-1 space-y-6">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList>
              <TabsTrigger value="all" className="gap-2">
                <BookOpen className="h-4 w-4" />
                All Courses
              </TabsTrigger>
              <TabsTrigger value="featured" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Featured
              </TabsTrigger>
              <TabsTrigger value="trending" className="gap-2">
                <Flame className="h-4 w-4" />
                Trending
              </TabsTrigger>
              <TabsTrigger value="new" className="gap-2">
                <Zap className="h-4 w-4" />
                New
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {isLoading ? (
                renderSkeleton()
              ) : filteredCourses.length === 0 ? (
                <Card className="p-12 text-center">
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold mb-2">No courses found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Try adjusting your filters or search terms
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </Card>
              ) : (
                <>
                  <div
                    className={cn(
                      viewMode === "grid"
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        : "space-y-4"
                    )}
                  >
                    {filteredCourses.map((course, index) =>
                      viewMode === "grid"
                        ? renderCourseCard(course, index)
                        : renderCourseListItem(course, index)
                    )}
                  </div>

                  {/* Load More */}
                  {hasMore && (
                    <div className="flex justify-center pt-6">
                      <Button
                        variant="outline"
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        className="gap-2"
                      >
                        {isLoadingMore ? (
                          <>Loading...</>
                        ) : (
                          <>
                            Load More Courses
                            <ChevronDown className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Course Preview Modal */}
      <CoursePreviewModal
        course={previewCourse}
        open={!!previewCourse}
        onOpenChange={(open) => !open && setPreviewCourse(null)}
        onEnroll={handleEnroll}
        onWishlist={(id) => toast.success("Added to wishlist")}
        onShare={(id) => {
          navigator.clipboard.writeText(`${window.location.origin}/courses/${id}`);
          toast.success("Course link copied to clipboard");
        }}
      />
    </div>
  );
}
