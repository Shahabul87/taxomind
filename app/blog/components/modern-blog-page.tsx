"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import MyPostCard from "../blog-card";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  X,
  Star,
  ArrowRight,
  BookOpen,
  Hash,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Extracted components
import { ModernHeroSectionOptimized } from "./blog-hero-section-optimized";
import { TrendingSidebar } from "./blog-sidebar";
import { NewsletterSection } from "./blog-newsletter";
import { BlogCardSkeleton, HeroSkeleton } from "./blog-skeleton";

// Shared types
import type { BlogPost, ModernBlogPageProps, BlogStatistics } from "./types";

/**
 * Main Modern Blog Page Component
 * Provides blog listing with filtering, search, and responsive layout
 */
export function ModernBlogPage({
  featuredPosts,
  initialPosts,
  categories,
  trendingPosts
}: ModernBlogPageProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "trending">("latest");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [statistics, setStatistics] = useState<BlogStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Advanced filter states
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [minViews, setMinViews] = useState<number>(0);
  const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month" | "year">("all");

  // Fetch blog statistics on mount - optimized with error handling
  useEffect(() => {
    let mounted = true;
    
    const fetchStatistics = async () => {
      try {
        setStatsLoading(true);
        const response = await fetch('/api/blog/statistics', {
          cache: 'force-cache',
          next: { revalidate: 3600 }, // Cache for 1 hour
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }
        
        const result = await response.json();

        if (mounted && result.success && result.data) {
          setStatistics(result.data);
        }
      } catch (error) {
        // Silently fallback to default values - no console.error in production
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch blog statistics:', error);
        }
        
        if (mounted) {
          setStatistics({
            totalArticles: initialPosts.length,
            publishedArticles: initialPosts.length,
            totalReaders: 50000,
            totalAuthors: 100,
            totalViews: 0,
            totalComments: 0,
            averageViews: 0,
            popularCategories: [],
          });
        }
      } finally {
        if (mounted) {
          setStatsLoading(false);
        }
      }
    };

    // Defer stats fetch to idle time to reduce TBT
    let idleId: number | null = null;
    if (typeof (window as any).requestIdleCallback === 'function') {
      idleId = (window as any).requestIdleCallback(fetchStatistics, { timeout: 1500 });
    } else {
      // Fallback with a slightly longer delay
      const timeoutId = setTimeout(fetchStatistics, 300);
      idleId = timeoutId as unknown as number;
    }

    return () => {
      mounted = false;
      if (typeof (window as any).cancelIdleCallback === 'function' && idleId) {
        (window as any).cancelIdleCallback(idleId);
      } else if (idleId) {
        clearTimeout(idleId as unknown as number);
      }
    };
  }, [initialPosts.length]);

  // Filter posts by category and search
  const filteredPosts = useMemo(() => {
    let filtered = posts;

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        post => post.category?.toLowerCase().replace(/\s+/g, '-') === selectedCategory
      );
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        post =>
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Views filter
    if (minViews > 0) {
      filtered = filtered.filter(post => post.views >= minViews);
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

      filtered = filtered.filter(post => new Date(post.createdAt) >= filterDate);
    }

    // Sorting
    switch (sortBy) {
      case "popular":
        filtered = [...filtered].sort((a, b) => b.views - a.views);
        break;
      case "trending":
        filtered = [...filtered].sort((a, b) => {
          // Combine recency and views for trending
          const aScore = a.views / Math.max(1, Math.floor((Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
          const bScore = b.views / Math.max(1, Math.floor((Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
          return bScore - aScore;
        });
        break;
      case "latest":
      default:
        filtered = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return filtered;
  }, [posts, selectedCategory, searchQuery, minViews, dateRange, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      {/* Hero Section - Optimized */}
      <ModernHeroSectionOptimized
        featuredPosts={featuredPosts}
        statistics={statistics}
        isLoading={statsLoading}
      />

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12">
        {/* Search and Filter Bar - Sticky */}
        <div className="sticky top-0 z-40 mb-6 sm:mb-8 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 pb-3 sm:pb-4 -mx-3 sm:-mx-4 px-3 sm:px-4 pt-3 sm:pt-4 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex flex-col gap-3 mb-4 sm:mb-6">
            {/* Search Input - Consistent Height */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 h-4 w-4 sm:h-5 sm:w-5" />
              <Label htmlFor="blog-search" className="sr-only">Search articles</Label>
              <Input
                id="blog-search"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 sm:pl-10 pr-9 sm:pr-10 h-10 sm:h-11 text-sm sm:text-base bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
                autoComplete="off"
                aria-label="Search articles"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2 -m-2"
                  aria-label="Clear search"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Sort Dropdown - Consistent Height */}
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger 
                  className="flex-1 sm:flex-none sm:w-[160px] h-10 sm:h-11 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-white text-sm sm:text-base"
                  aria-label="Sort articles by"
                >
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="trending">Trending</SelectItem>
                </SelectContent>
              </Select>

              {/* Advanced Filters Popover - Consistent Height */}
              <Popover open={isFilterPopoverOpen} onOpenChange={setIsFilterPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 sm:flex-none h-10 sm:h-11 px-3 sm:px-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700/80 text-sm sm:text-base">
                    <Filter className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Filters</span>
                    <span className="sm:hidden">Filter</span>
                    {(minViews > 0 || dateRange !== "all") && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                        {(minViews > 0 ? 1 : 0) + (dateRange !== "all" ? 1 : 0)}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Advanced Filters</h4>
                      <Separator />
                    </div>

                    {/* Date Range Filter */}
                    <div className="space-y-2">
                      <Label htmlFor="date-range">Date Range</Label>
                      <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
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
                    <div className="space-y-2">
                      <Label htmlFor="min-views">Minimum Views: {minViews > 0 ? minViews.toLocaleString() : "Any"}</Label>
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
                    <div className="flex justify-between pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9"
                        onClick={() => {
                          setMinViews(0);
                          setDateRange("all");
                        }}
                      >
                        Clear All
                      </Button>
                      <Button
                        size="sm"
                        className="h-9"
                        onClick={() => setIsFilterPopoverOpen(false)}
                      >
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* View Mode Toggle - Hidden on mobile, shown on tablet+ */}
              <div className="hidden md:flex items-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-lg h-11">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none h-11 w-11 text-slate-900 dark:text-white"
                  aria-label="Switch to grid view"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none h-11 w-11 text-slate-900 dark:text-white"
                  aria-label="Switch to list view"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchQuery || minViews > 0 || dateRange !== "all") && (
            <div className="mb-3 sm:mb-4 flex flex-wrap gap-2 items-center">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 hidden sm:inline">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <span className="hidden sm:inline">Search: &quot;</span>
                  <span className="sm:hidden">Search:</span>
                  <span className="max-w-[120px] sm:max-w-none truncate">{searchQuery}</span>
                  {searchQuery && <span className="hidden sm:inline">&quot;</span>}
                  <button
                    onClick={() => setSearchQuery("")}
                    className="ml-1 hover:text-slate-900 dark:hover:text-white p-2 -m-2"
                    aria-label="Clear search filter"
                    type="button"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {minViews > 0 && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <span className="hidden sm:inline">Min views: </span>
                  <span className="sm:hidden">Views: </span>
                  {minViews.toLocaleString()}
                  <button
                    onClick={() => setMinViews(0)}
                    className="ml-1 hover:text-slate-900 dark:hover:text-white p-2 -m-2"
                    aria-label="Clear minimum views filter"
                    type="button"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {dateRange !== "all" && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  Date: {dateRange}
                  <button
                    onClick={() => setDateRange("all")}
                    className="ml-1 hover:text-slate-900 dark:hover:text-white p-2 -m-2"
                    aria-label="Clear date range filter"
                    type="button"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Category Tabs - Non-Sticky, Below Search/Filter */}
        <div className="mb-6 sm:mb-8 -mx-3 sm:-mx-4 px-3 sm:px-4">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 h-11 scrollbar-hide">
              {categories.map(category => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="whitespace-nowrap h-11 px-4 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
                  aria-label={`Filter by ${category.name} category`}
                >
                  {category.name}
                  <Badge variant="secondary" className="ml-1.5 sm:ml-2 h-5 px-1 sm:px-1.5 text-[10px] sm:text-xs">
                    {category.count}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
            {categories.map(category => (
              <TabsContent key={`panel-${category.id}`} value={category.id} className="sr-only">
                Currently filtering by {category.name}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Featured Section */}
            {selectedCategory === "all" && featuredPosts.length > 0 && (
              <div className="mb-8 sm:mb-12">
                <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                    Editor&apos;s Picks
                  </h2>
                  <Link href="/blog/featured">
                    <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                      View All
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {featuredPosts.slice(1, 3).map((post, index) => (
                    <MyPostCard
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
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Posts Grid */}
            <div>
              <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2 sm:gap-3">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
                    {selectedCategory === "all" ? "Latest Articles" : `${categories.find(c => c.id === selectedCategory)?.name} Articles`}
                  </h2>
                  <Badge variant="secondary" className="text-xs sm:text-sm">
                    {filteredPosts.length} {filteredPosts.length === 1 ? "article" : "articles"}
                  </Badge>
                </div>

                {/* Active Filters Indicator */}
                {(searchQuery || selectedCategory !== "all" || minViews > 0 || dateRange !== "all" || sortBy !== "latest") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                      setMinViews(0);
                      setDateRange("all");
                      setSortBy("latest");
                    }}
                    className="h-8 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    <X className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">Reset all filters</span>
                    <span className="sm:hidden">Reset</span>
                  </Button>
                )}
              </div>

              <Suspense fallback={
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <BlogCardSkeleton key={i} />
                  ))}
                </div>
              }>
                {filteredPosts.length > 0 ? (
                  <div className={cn(
                    viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6" : "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
                  )}>
                    {filteredPosts.map((post, index) => (
                      <MyPostCard
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
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 sm:p-12 text-center">
                    <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-base sm:text-lg font-semibold mb-2">No articles found</h3>
                    <p className="text-sm sm:text-base text-slate-500">Try adjusting your search or filters</p>
                  </Card>
                )}
              </Suspense>

              {/* Load More */}
              {filteredPosts.length > 9 && (
                <div className="text-center mt-6 sm:mt-8">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Load More Articles
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Hidden on mobile, shown on desktop */}
          <aside className="hidden lg:block space-y-6">
            {/* Trending Posts */}
            <TrendingSidebar posts={trendingPosts} />

            {/* Newsletter */}
            <NewsletterSection />

            {/* Popular Tags */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm rounded-xl">
              <CardHeader>
                <h3 className="font-semibold flex items-center gap-2">
                  <Hash className="w-5 h-5" />
                  Popular Topics
                </h3>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {["React", "TypeScript", "Next.js", "AI", "Web3", "Design", "Performance", "Security"].map(tag => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Authors */}
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm rounded-xl">
              <CardHeader>
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top Contributors
                </h3>
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3].map((_, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                        {String.fromCharCode(65 + index)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Author Name</p>
                      <p className="text-xs text-slate-500">{10 - index * 2} articles</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Follow
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>
        </div>

        {/* Mobile Sidebar - Shown below content on mobile */}
        <div className="lg:hidden mt-8 space-y-6">
          {/* Trending Posts */}
          <TrendingSidebar posts={trendingPosts} />

          {/* Newsletter */}
          <NewsletterSection />

          {/* Popular Tags */}
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm rounded-xl">
            <CardHeader>
              <h3 className="font-semibold flex items-center gap-2 text-base sm:text-lg">
                <Hash className="w-4 h-4 sm:w-5 sm:h-5" />
                Popular Topics
              </h3>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {["React", "TypeScript", "Next.js", "AI", "Web3", "Design", "Performance", "Security"].map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all text-xs"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
