"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import { ProfessionalCoursesPage } from "./professional-courses-page";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  LayoutGrid,
  Table2,
  ChevronDown,
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
  Route
} from "lucide-react";

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
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import { EnhancedCourseCard } from "./enhanced-course-card";
import { FilterSidebar } from "./filter-sidebar";
import { QuickStatsBar } from "./quick-stats-bar";
import { Pagination } from "./pagination";
import { EmptyState } from "./empty-state";
import { CourseComparisonTool } from "./course-comparison-tool";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface CourseData {
  id: string;
  title: string;
  subtitle?: string | null;
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

interface CoursesPageClientProps {
  initialCourses: CourseData[];
  filterOptions: FilterOptions;
  totalCourses: number;
  userId?: string;
}

type ViewMode = "grid" | "list" | "compact" | "card";
type SortOption =
  | "relevance"
  | "popular"
  | "rating"
  | "newest"
  | "price-low"
  | "price-high"
  | "duration-short"
  | "duration-long";

export function CoursesPageClient({
  initialCourses,
  filterOptions,
  totalCourses,
  userId
}: CoursesPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State Management
  const [courses, setCourses] = useState<CourseData[]>(initialCourses);
  const [totalCount, setTotalCount] = useState(totalCourses); // Track dynamic count
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [comparisonCourses, setComparisonCourses] = useState<CourseData[]>([]);

  // Filters State
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<{ min: number; max: number } | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Initialize from URL params
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    // Initialize search
    const search = params.get("search");
    if (search) setSearchQuery(search);

    // Initialize view mode
    const view = params.get("view") as ViewMode;
    if (view) setViewMode(view);

    // Initialize sort
    const sort = params.get("sort") as SortOption;
    if (sort) setSortBy(sort);

    // Initialize page
    const page = params.get("page");
    if (page) setCurrentPage(parseInt(page));

    // Initialize items per page
    const limit = params.get("limit");
    if (limit) setItemsPerPage(parseInt(limit));

    // Initialize filters
    const categories = params.get("categories");
    if (categories) setSelectedCategories(categories.split(","));

    const difficulties = params.get("difficulties");
    if (difficulties) setSelectedDifficulties(difficulties.split(","));

    const rating = params.get("rating");
    if (rating) setSelectedRating(parseFloat(rating));

    // Initialize price range
    const minPrice = params.get("minPrice");
    const maxPrice = params.get("maxPrice");
    if (minPrice || maxPrice) {
      setSelectedPriceRange({
        min: minPrice ? parseFloat(minPrice) : 0,
        max: maxPrice ? parseFloat(maxPrice) : 99999
      });
    }

    // Initialize duration
    const minDuration = params.get("minDuration");
    const maxDuration = params.get("maxDuration");
    if (minDuration || maxDuration) {
      setSelectedDuration({
        min: minDuration ? parseInt(minDuration) : 0,
        max: maxDuration ? parseInt(maxDuration) : 99999
      });
    }

    // Initialize features
    const features = params.get("features");
    if (features) setSelectedFeatures(features.split(","));
  }, [searchParams]);

  // Update URL when filters change
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();

    if (searchQuery) params.set("search", searchQuery);
    if (viewMode !== "grid") params.set("view", viewMode);
    if (sortBy !== "relevance") params.set("sort", sortBy);
    if (currentPage > 1) params.set("page", currentPage.toString());
    if (itemsPerPage !== 12) params.set("limit", itemsPerPage.toString());

    if (selectedCategories.length > 0) {
      params.set("categories", selectedCategories.join(","));
    }

    if (selectedDifficulties.length > 0) {
      params.set("difficulties", selectedDifficulties.join(","));
    }

    if (selectedRating) {
      params.set("rating", selectedRating.toString());
    }

    if (selectedPriceRange) {
      params.set("minPrice", selectedPriceRange.min.toString());
      params.set("maxPrice", selectedPriceRange.max.toString());
    }

    if (selectedDuration) {
      params.set("minDuration", selectedDuration.min.toString());
      params.set("maxDuration", selectedDuration.max.toString());
    }

    if (selectedFeatures.length > 0) {
      params.set("features", selectedFeatures.join(","));
    }

    const queryString = params.toString();
    router.push(`/courses${queryString ? `?${queryString}` : ""}`, { scroll: false });
  }, [
    searchQuery,
    viewMode,
    sortBy,
    currentPage,
    itemsPerPage,
    selectedCategories,
    selectedDifficulties,
    selectedRating,
    selectedPriceRange,
    selectedDuration,
    selectedFeatures,
    router
  ]);

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

      if (selectedFeatures.length > 0) {
        params.set("features", selectedFeatures.join(","));
      }

      const response = await fetch(`/api/courses/search?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setCourses(data.data.courses);
        setTotalCount(data.data.pagination.totalCount); // Update dynamic count
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
    selectedFeatures
  ]);

  // Reset page to 1 when filters/search/sort change (but not when page itself changes)
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
    selectedFeatures,
  ]);

  // Trigger fetch when dependencies change
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Update URL when state changes
  useEffect(() => {
    updateURL();
  }, [updateURL]);

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedPriceRange(null);
    setSelectedDifficulties([]);
    setSelectedDuration(null);
    setSelectedRating(null);
    setSelectedFeatures([]);
    setSearchQuery("");
    setSortBy("relevance");
    setCurrentPage(1);
  };

  // Compare courses functionality
  const addToComparison = (course: CourseData) => {
    if (comparisonCourses.length < 3 && !comparisonCourses.find(c => c.id === course.id)) {
      setComparisonCourses([...comparisonCourses, course]);
    }
  };

  const removeFromComparison = (courseId: string) => {
    setComparisonCourses(comparisonCourses.filter(c => c.id !== courseId));
  };

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategories.length > 0) count += selectedCategories.length;
    if (selectedPriceRange) count++;
    if (selectedDifficulties.length > 0) count += selectedDifficulties.length;
    if (selectedDuration) count++;
    if (selectedRating) count++;
    if (selectedFeatures.length > 0) count += selectedFeatures.length;
    return count;
  }, [
    selectedCategories,
    selectedPriceRange,
    selectedDifficulties,
    selectedDuration,
    selectedRating,
    selectedFeatures
  ]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Use professional design
  return (
    <ProfessionalCoursesPage
      initialCourses={courses}
      filterOptions={filterOptions}
      totalCourses={totalCount}
      userId={userId}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      isLoading={isLoading}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
    />
  );
}