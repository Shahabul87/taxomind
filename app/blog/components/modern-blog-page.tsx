"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  X,
  Star,
  ArrowRight,
  BookOpen,
  SlidersHorizontal,
  Sparkles,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

// Enhanced components
import { ModernHeroSectionOptimized } from "./blog-hero-section-optimized";
import { BlogSidebarEnhanced } from "./blog-sidebar-enhanced";
import { BlogCardEnhanced } from "./blog-card-enhanced";
import { BlogEmptyState } from "./blog-empty-state";
import { BlogCardSkeleton, HeroSkeleton } from "./blog-skeleton";
import { HomeFooter } from "@/app/(homepage)/HomeFooter";

// Shared types
import type { BlogPost, ModernBlogPageProps, BlogStatistics } from "./types";

// ============================================================================
// Main Modern Blog Page Component
// ============================================================================

export function ModernBlogPage({
  featuredPosts,
  initialPosts,
  categories,
  trendingPosts,
  userId,
}: ModernBlogPageProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "trending">(
    "latest"
  );
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [statistics, setStatistics] = useState<BlogStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Advanced filter states
  const [minViews, setMinViews] = useState<number>(0);
  const [dateRange, setDateRange] = useState<
    "all" | "today" | "week" | "month" | "year"
  >("all");

  // Fetch blog statistics on mount
  useEffect(() => {
    let mounted = true;

    const fetchStatistics = async () => {
      try {
        setStatsLoading(true);
        const response = await fetch("/api/blog/statistics", {
          cache: "force-cache",
          next: { revalidate: 3600 },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch statistics");
        }

        const result = await response.json();

        if (mounted && result.success && result.data) {
          setStatistics(result.data);
        }
      } catch (error) {
        logger.error("Failed to fetch blog statistics:", error);

        if (mounted) {
          setStatistics({
            totalArticles: initialPosts.length,
            publishedArticles: initialPosts.length,
            totalReaders: initialPosts.reduce((sum, p) => sum + p.views, 0),
            totalAuthors: new Set(initialPosts.map((p) => p.user.name)).size,
            totalViews: initialPosts.reduce((sum, p) => sum + p.views, 0),
            totalComments: initialPosts.reduce(
              (sum, p) => sum + p.comments.length,
              0
            ),
            averageViews:
              initialPosts.length > 0
                ? Math.round(
                    initialPosts.reduce((sum, p) => sum + p.views, 0) /
                      initialPosts.length
                  )
                : 0,
            popularCategories: [],
          });
        }
      } finally {
        if (mounted) {
          setStatsLoading(false);
        }
      }
    };

    // Defer stats fetch to idle time
    let idleId: ReturnType<typeof setTimeout> | null = null;
    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(fetchStatistics, { timeout: 1500 }) as unknown as ReturnType<typeof setTimeout>;
    } else {
      idleId = setTimeout(fetchStatistics, 300);
    }

    return () => {
      mounted = false;
      if (idleId !== null) {
        if ("cancelIdleCallback" in window) {
          window.cancelIdleCallback(idleId as unknown as number);
        } else {
          clearTimeout(idleId);
        }
      }
    };
  }, [initialPosts]);

  // Filter posts by category and search
  const filteredPosts = useMemo(() => {
    let filtered = posts;

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (post) =>
          post.category?.toLowerCase().replace(/\s+/g, "-") === selectedCategory
      );
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.description.toLowerCase().includes(query)
      );
    }

    // Views filter
    if (minViews > 0) {
      filtered = filtered.filter((post) => post.views >= minViews);
    }

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (dateRange) {
        case "today":
          filterDate.setDate(now.getDate() - 1);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case "year":
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter(
        (post) => new Date(post.createdAt) >= filterDate
      );
    }

    // Sorting
    switch (sortBy) {
      case "popular":
        filtered = [...filtered].sort((a, b) => b.views - a.views);
        break;
      case "trending":
        filtered = [...filtered].sort((a, b) => {
          const aScore =
            a.views /
            Math.max(
              1,
              Math.floor(
                (Date.now() - new Date(a.createdAt).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            );
          const bScore =
            b.views /
            Math.max(
              1,
              Math.floor(
                (Date.now() - new Date(b.createdAt).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            );
          return bScore - aScore;
        });
        break;
      case "latest":
      default:
        filtered = [...filtered].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    return filtered;
  }, [posts, selectedCategory, searchQuery, minViews, dateRange, sortBy]);

  // Check if any filters are active
  const hasActiveFilters =
    searchQuery ||
    selectedCategory !== "all" ||
    minViews > 0 ||
    dateRange !== "all" ||
    sortBy !== "latest";

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setMinViews(0);
    setDateRange("all");
    setSortBy("latest");
  };

  // Handle category selection from sidebar
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // Scroll to articles section
    const articlesSection = document.getElementById("articles-section");
    if (articlesSection) {
      articlesSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Get the current category name for display
  const getCurrentCategoryName = () => {
    if (selectedCategory === "all") return "Latest Articles";
    const cat = categories.find((c) => c.id === selectedCategory);
    return cat ? `${cat.name} Articles` : "Articles";
  };

  // Determine empty state variant
  const getEmptyStateVariant = () => {
    if (initialPosts.length === 0) return "no-posts";
    if (searchQuery) return "no-results";
    if (selectedCategory !== "all") return "no-category";
    return "no-results";
  };

  // Check if we should show Editor's Picks (need at least 2 posts beyond the first)
  const showEditorsPicks =
    selectedCategory === "all" && featuredPosts.length >= 2;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Hero Section */}
      <ModernHeroSectionOptimized
        featuredPosts={featuredPosts}
        statistics={statistics}
        isLoading={statsLoading}
        userId={userId}
      />

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12">
        {/* Search and Filter Bar - Sticky */}
        <div className="sticky top-0 z-40 mb-6 sm:mb-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl pb-4 -mx-3 sm:-mx-4 px-3 sm:px-4 pt-4 border-b border-slate-200/50 dark:border-slate-700/50 rounded-b-2xl shadow-lg shadow-slate-200/20 dark:shadow-slate-900/20">
          <div className="flex flex-col gap-4 mb-4">
            {/* Search Input */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 via-indigo-500/20 to-purple-500/20 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 h-5 w-5 transition-colors group-focus-within:text-violet-500" />
              <Label htmlFor="blog-search" className="sr-only">
                Search articles
              </Label>
              <Input
                id="blog-search"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="relative pl-12 pr-12 h-12 text-base bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 rounded-xl focus:border-violet-400 dark:focus:border-violet-500 focus:ring-violet-400/20 shadow-sm transition-all duration-300"
                autoComplete="off"
                aria-label="Search articles"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                  aria-label="Clear search"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter Controls Row */}
            <div className="flex flex-wrap gap-3">
              {/* Sort Dropdown */}
              <Select
                value={sortBy}
                onValueChange={(value: "latest" | "popular" | "trending") =>
                  setSortBy(value)
                }
              >
                <SelectTrigger
                  className="flex-1 sm:flex-none sm:w-[160px] h-11 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-white rounded-xl shadow-sm hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
                  aria-label="Sort articles by"
                >
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="trending">Trending</SelectItem>
                </SelectContent>
              </Select>

              {/* Advanced Filters Popover */}
              <Popover
                open={isFilterPopoverOpen}
                onOpenChange={setIsFilterPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 sm:flex-none h-11 px-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/80 rounded-xl shadow-sm transition-all",
                      (minViews > 0 || dateRange !== "all") &&
                        "border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-950/30"
                    )}
                  >
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Filters</span>
                    <span className="sm:hidden">Filter</span>
                    {(minViews > 0 || dateRange !== "all") && (
                      <Badge
                        variant="secondary"
                        className="ml-2 h-5 px-1.5 text-xs bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300"
                      >
                        {(minViews > 0 ? 1 : 0) + (dateRange !== "all" ? 1 : 0)}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm flex items-center gap-2 text-slate-900 dark:text-white">
                        <Filter className="w-4 h-4 text-violet-500" />
                        Advanced Filters
                      </h4>
                      <Separator className="bg-slate-200 dark:bg-slate-700" />
                    </div>

                    {/* Date Range Filter */}
                    <div className="space-y-3">
                      <Label
                        htmlFor="date-range"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Date Range
                      </Label>
                      <Select
                        value={dateRange}
                        onValueChange={(
                          value: "all" | "today" | "week" | "month" | "year"
                        ) => setDateRange(value)}
                      >
                        <SelectTrigger id="date-range" className="h-10">
                          <SelectValue placeholder="Select date range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                          <SelectItem value="year">This Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Minimum Views Filter */}
                    <div className="space-y-3">
                      <Label
                        htmlFor="min-views"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Minimum Views:{" "}
                        <span className="text-violet-600 dark:text-violet-400 font-bold">
                          {minViews > 0 ? minViews.toLocaleString() : "Any"}
                        </span>
                      </Label>
                      <Slider
                        id="min-views"
                        min={0}
                        max={10000}
                        step={100}
                        value={[minViews]}
                        onValueChange={(value) => setMinViews(value[0])}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>0</span>
                        <span>10K+</span>
                      </div>
                    </div>

                    {/* Clear Filters Button */}
                    <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        onClick={() => {
                          setMinViews(0);
                          setDateRange("all");
                        }}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Clear All
                      </Button>
                      <Button
                        size="sm"
                        className="h-9 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
                        onClick={() => setIsFilterPopoverOpen(false)}
                      >
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* View Mode Toggle */}
              <div className="hidden md:flex items-center bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60 rounded-xl h-11 shadow-sm overflow-hidden">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "rounded-none h-11 w-11 transition-all",
                    viewMode === "grid"
                      ? "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                  aria-label="Switch to grid view"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "rounded-none h-11 w-11 transition-all",
                    viewMode === "list"
                      ? "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                  aria-label="Switch to list view"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Active:
              </span>
              {searchQuery && (
                <Badge
                  variant="secondary"
                  className="gap-1.5 text-xs bg-violet-100/80 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-0"
                >
                  Search: &quot;{searchQuery.slice(0, 20)}
                  {searchQuery.length > 20 ? "..." : ""}&quot;
                  <button
                    onClick={() => setSearchQuery("")}
                    className="ml-1 hover:text-indigo-900 dark:hover:text-white"
                    aria-label="Clear search filter"
                    type="button"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {selectedCategory !== "all" && (
                <Badge
                  variant="secondary"
                  className="gap-1.5 text-xs bg-purple-100/80 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-0"
                >
                  {categories.find((c) => c.id === selectedCategory)?.name}
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className="ml-1 hover:text-purple-900 dark:hover:text-white"
                    aria-label="Clear category filter"
                    type="button"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {minViews > 0 && (
                <Badge
                  variant="secondary"
                  className="gap-1.5 text-xs bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-0"
                >
                  Min views: {minViews.toLocaleString()}
                  <button
                    onClick={() => setMinViews(0)}
                    className="ml-1 hover:text-emerald-900 dark:hover:text-white"
                    aria-label="Clear minimum views filter"
                    type="button"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {dateRange !== "all" && (
                <Badge
                  variant="secondary"
                  className="gap-1.5 text-xs bg-amber-100/80 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-0"
                >
                  Date: {dateRange}
                  <button
                    onClick={() => setDateRange("all")}
                    className="ml-1 hover:text-amber-900 dark:hover:text-white"
                    aria-label="Clear date range filter"
                    type="button"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-6 px-2 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Category Tabs */}
        <div className="mb-8 -mx-3 sm:-mx-4 px-3 sm:px-4">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 h-12 rounded-xl scrollbar-hide shadow-sm p-1">
              {categories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="whitespace-nowrap h-10 px-4 text-sm font-medium rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-violet-500/25 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-300"
                  aria-label={`Filter by ${category.name} category`}
                >
                  {category.name}
                  <Badge
                    variant="secondary"
                    className="ml-2 h-5 px-1.5 text-[11px] font-semibold bg-slate-200/80 dark:bg-slate-700/80 data-[state=active]:bg-white/20 data-[state=active]:text-white"
                  >
                    {category.count}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
            {categories.map((category) => (
              <TabsContent
                key={`panel-${category.id}`}
                value={category.id}
                className="sr-only"
              >
                Currently filtering by {category.name}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Content Grid */}
        <div
          id="articles-section"
          className="grid lg:grid-cols-4 gap-6 sm:gap-8"
        >
          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Editor&apos;s Picks Section - Only show when we have enough featured content */}
            {showEditorsPicks && !hasActiveFilters && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3 text-slate-900 dark:text-white">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      Editor&apos;s Picks
                    </span>
                  </h2>
                  <Link href="/blog/featured">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 group"
                    >
                      View All
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {featuredPosts.slice(0, 2).map((post, index) => (
                    <BlogCardEnhanced
                      key={post.id}
                      post={{
                        id: post.id,
                        title: post.title,
                        description: post.description,
                        imageUrl: post.imageUrl || null,
                        published: true,
                        category: post.category || null,
                        createdAt: post.createdAt.toISOString(),
                        views: post.views,
                        comments: post.comments,
                        user: post.user,
                        readingTime: post.readingTime,
                      }}
                      variant={index === 0 ? "featured" : "grid"}
                      priority={index === 0}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Posts Section */}
            <div>
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-violet-500" />
                    {getCurrentCategoryName()}
                  </h2>
                  <Badge
                    variant="secondary"
                    className="text-sm bg-violet-100/80 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                  >
                    {filteredPosts.length}{" "}
                    {filteredPosts.length === 1 ? "article" : "articles"}
                  </Badge>
                </div>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="h-8 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Reset filters
                  </Button>
                )}
              </div>

              <Suspense
                fallback={
                  <div
                    className={cn(
                      viewMode === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                        : "flex flex-col gap-6"
                    )}
                  >
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <BlogCardSkeleton key={i} />
                    ))}
                  </div>
                }
              >
                {filteredPosts.length > 0 ? (
                  <div
                    className={cn(
                      viewMode === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
                        : "flex flex-col gap-6"
                    )}
                  >
                    {filteredPosts.map((post, index) => (
                      <BlogCardEnhanced
                        key={post.id}
                        post={{
                          id: post.id,
                          title: post.title,
                          description: post.description,
                          imageUrl: post.imageUrl || null,
                          published: true,
                          category: post.category || null,
                          createdAt: post.createdAt.toISOString(),
                          views: post.views,
                          comments: post.comments,
                          user: post.user,
                          readingTime: post.readingTime,
                        }}
                        variant={viewMode}
                        priority={index < 3}
                      />
                    ))}
                  </div>
                ) : (
                  <BlogEmptyState
                    variant={getEmptyStateVariant()}
                    searchQuery={searchQuery}
                    categoryName={
                      categories.find((c) => c.id === selectedCategory)?.name
                    }
                    userId={userId}
                    onClearFilters={clearAllFilters}
                  />
                )}
              </Suspense>

              {/* Load More - Only show if we have many posts */}
              {filteredPosts.length > 9 && (
                <div className="text-center mt-10">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto px-8 py-6 text-base font-medium border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/30 rounded-xl shadow-sm group transition-all"
                  >
                    <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                    Load More Articles
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block">
            <BlogSidebarEnhanced
              trendingPosts={trendingPosts}
              statistics={statistics}
              categories={categories}
              onCategorySelect={handleCategorySelect}
              variant="desktop"
            />
          </aside>
        </div>

        {/* Mobile Sidebar - Below content on mobile */}
        <div className="lg:hidden mt-10">
          <BlogSidebarEnhanced
            trendingPosts={trendingPosts}
            statistics={statistics}
            categories={categories}
            onCategorySelect={handleCategorySelect}
            variant="mobile"
          />
        </div>
      </div>

      {/* Footer */}
      <HomeFooter />
    </div>
  );
}
