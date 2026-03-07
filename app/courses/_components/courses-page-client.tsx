"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";
import { ProfessionalCoursesPage } from "./professional-courses-page";

import { logger } from "@/lib/logger";

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

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string | null;
}

interface CoursesPageClientProps {
  initialCourses: CourseData[];
  filterOptions: FilterOptions;
  totalCourses: number;
  userId?: string;
  user?: UserData;
}

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
  userId,
  user
}: CoursesPageClientProps) {
  const searchParams = useSearchParams();

  // State Management
  const [courses, setCourses] = useState<CourseData[]>(initialCourses);
  const [totalCount, setTotalCount] = useState(totalCourses);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Filters State
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<{ min: number; max: number } | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Track if component has been initialized
  const hasInitialized = useRef(false);

  // Initialize from URL params on mount (proper dependency tracking)
  useEffect(() => {
    // Only initialize once
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const params = new URLSearchParams(searchParams.toString());

    // Batch all state updates
    const updates: Array<() => void> = [];

    // Initialize search
    const search = params.get("search");
    if (search) updates.push(() => setSearchQuery(search));

    // Initialize sort
    const sort = params.get("sort") as SortOption;
    if (sort) updates.push(() => setSortBy(sort));

    // Initialize page
    const page = params.get("page");
    if (page) updates.push(() => setCurrentPage(parseInt(page)));

    // Initialize items per page
    const limit = params.get("limit");
    if (limit) updates.push(() => setItemsPerPage(parseInt(limit)));

    // Initialize filters
    const categories = params.get("categories");
    if (categories) updates.push(() => setSelectedCategories(categories.split(",")));

    const difficulties = params.get("difficulties");
    if (difficulties) updates.push(() => setSelectedDifficulties(difficulties.split(",")));

    const rating = params.get("rating");
    if (rating) updates.push(() => setSelectedRating(parseFloat(rating)));

    // Initialize price range
    const minPrice = params.get("minPrice");
    const maxPrice = params.get("maxPrice");
    if (minPrice || maxPrice) {
      updates.push(() => setSelectedPriceRange({
        min: minPrice ? parseFloat(minPrice) : 0,
        max: maxPrice ? parseFloat(maxPrice) : 99999
      }));
    }

    // Initialize duration
    const minDuration = params.get("minDuration");
    const maxDuration = params.get("maxDuration");
    if (minDuration || maxDuration) {
      updates.push(() => setSelectedDuration({
        min: minDuration ? parseInt(minDuration) : 0,
        max: maxDuration ? parseInt(maxDuration) : 99999
      }));
    }

    // Initialize features
    const features = params.get("features");
    if (features) updates.push(() => setSelectedFeatures(features.split(",")));

    // Apply all updates
    updates.forEach(update => update());
  }, [searchParams]);

  // Update URL when filters change (without page reload)
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();

    if (searchQuery) params.set("search", searchQuery);
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
    const newUrl = `/courses${queryString ? `?${queryString}` : ""}`;

    // Use window.history.replaceState to update URL without page reload
    window.history.replaceState(null, "", newUrl);
  }, [
    searchQuery,
    sortBy,
    currentPage,
    itemsPerPage,
    selectedCategories,
    selectedDifficulties,
    selectedRating,
    selectedPriceRange,
    selectedDuration,
    selectedFeatures
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
        setTotalCount(data.data.pagination.totalCount);
      }
    } catch (error) {
      logger.error("Error fetching courses:", error);
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

  // Update URL when state changes (but skip first render to avoid loop)
  useEffect(() => {
    if (hasInitialized.current) {
      updateURL();
    }
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
      user={user}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      isLoading={isLoading}
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
      selectedCategories={selectedCategories}
      onCategoriesChange={setSelectedCategories}
      selectedPriceRange={selectedPriceRange}
      onPriceRangeChange={setSelectedPriceRange}
      selectedDifficulties={selectedDifficulties}
      onDifficultiesChange={setSelectedDifficulties}
      onClearFilters={clearAllFilters}
    />
  );
}