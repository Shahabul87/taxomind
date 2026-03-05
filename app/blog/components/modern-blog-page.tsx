"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import {
  X,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

// Enhanced components
import { BlogHeroBroadsheet } from "./blog-hero-broadsheet";
import { BlogSidebarEnhanced } from "./blog-sidebar-enhanced";
import { BlogCardEnhanced } from "./blog-card-enhanced";
import { BlogEmptyState } from "./blog-empty-state";
import { BlogCardSkeleton } from "./blog-skeleton";
import { HomeFooter } from "@/app/(homepage)/HomeFooter";

// Shared types
import type { BlogPost, ModernBlogPageProps, BlogStatistics } from "./types";

// ============================================================================
// Shared editorial styles
// ============================================================================

const fonts = {
  headline: "'Crimson Text', 'Georgia', 'Times New Roman', serif",
  body: "'Libre Baskerville', 'Georgia', serif",
  mono: "'JetBrains Mono', 'Courier New', monospace",
};

const colors = {
  cream: "#f5f0e8",
  ink: "#1a1a1a",
  accent: "#8b1a1a",
  muted: "#5c5c5c",
  rule: "#c4b9a8",
  lightRule: "#d8d0c4",
  warmBg: "#eee7db",
};

// Paper texture SVG data URI
const paperTexture = `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`;

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

  // Filter posts
  const filteredPosts = useMemo(() => {
    let filtered = posts;

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (post) =>
          post.category?.toLowerCase().replace(/\s+/g, "-") === selectedCategory
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.description.toLowerCase().includes(query)
      );
    }

    if (minViews > 0) {
      filtered = filtered.filter((post) => post.views >= minViews);
    }

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

  const hasActiveFilters =
    searchQuery ||
    selectedCategory !== "all" ||
    minViews > 0 ||
    dateRange !== "all" ||
    sortBy !== "latest";

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setMinViews(0);
    setDateRange("all");
    setSortBy("latest");
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const articlesSection = document.getElementById("articles-section");
    if (articlesSection) {
      articlesSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const getCurrentCategoryName = () => {
    if (selectedCategory === "all") return "Latest Articles";
    const cat = categories.find((c) => c.id === selectedCategory);
    return cat ? `${cat.name} Articles` : "Articles";
  };

  const getEmptyStateVariant = () => {
    if (initialPosts.length === 0) return "no-posts";
    if (searchQuery) return "no-results";
    if (selectedCategory !== "all") return "no-category";
    return "no-results";
  };

  const showEditorsPicks =
    selectedCategory === "all" && featuredPosts.length >= 2;

  return (
    <div style={{ minHeight: "100vh", background: colors.cream, backgroundImage: paperTexture }}>
      {/* Hero Section */}
      <BlogHeroBroadsheet
        featuredPosts={featuredPosts}
        statistics={statistics}
        isLoading={statsLoading}
        userId={userId}
      />

      {/* Main Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 16px 48px" }}>
        {/* ============================================================ */}
        {/* Search & Filter Bar — Editorial Style */}
        {/* ============================================================ */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 40,
            background: colors.cream,
            paddingBottom: 20,
            marginBottom: 24,
            borderBottom: `2px solid ${colors.ink}`,
          }}
        >
          {/* Double rule at top */}
          <div style={{ height: 1, background: colors.ink, marginBottom: 2 }} />
          <div style={{ height: 2, background: colors.ink, marginBottom: 16 }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Sort & View Controls */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              {/* Sort Select */}
              <div style={{ position: "relative" }}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "latest" | "popular" | "trending")}
                  aria-label="Sort articles by"
                  style={{
                    padding: "10px 32px 10px 12px",
                    fontFamily: fonts.mono,
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: colors.ink,
                    background: "transparent",
                    border: `1px solid ${colors.rule}`,
                    appearance: "none",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <option value="latest">Latest</option>
                  <option value="popular">Most Read</option>
                  <option value="trending">Trending</option>
                </select>
                <ChevronDown style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 14,
                  height: 14,
                  color: colors.muted,
                  pointerEvents: "none",
                }} />
              </div>

              {/* View Mode Toggle — Desktop only */}
              <div className="hidden md:flex" style={{
                border: `1px solid ${colors.rule}`,
                overflow: "hidden",
              }}>
                <button
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                  style={{
                    padding: "9px 14px",
                    fontFamily: fonts.mono,
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: viewMode === "grid" ? colors.cream : colors.ink,
                    background: viewMode === "grid" ? colors.ink : "transparent",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  Grid
                </button>
                <div style={{ width: 1, background: colors.rule }} />
                <button
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                  style={{
                    padding: "9px 14px",
                    fontFamily: fonts.mono,
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: viewMode === "list" ? colors.cream : colors.ink,
                    background: viewMode === "list" ? colors.ink : "transparent",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  List
                </button>
              </div>
            </div>

            {/* Category Tabs — Newspaper section labels */}
            <div style={{
              display: "flex",
              gap: 0,
              overflowX: "auto",
              borderBottom: `1px solid ${colors.rule}`,
              scrollbarWidth: "none",
            }}>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  aria-label={`Filter by ${category.name} category`}
                  style={{
                    padding: "8px 16px",
                    fontFamily: fonts.mono,
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    whiteSpace: "nowrap",
                    color: selectedCategory === category.id ? colors.cream : colors.ink,
                    background: selectedCategory === category.id ? colors.ink : "transparent",
                    border: "none",
                    borderBottom: selectedCategory === category.id ? `2px solid ${colors.accent}` : "2px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {category.name}
                  <span style={{
                    marginLeft: 6,
                    fontSize: 9,
                    opacity: 0.6,
                  }}>
                    ({category.count})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
              paddingTop: 10,
              marginTop: 10,
              borderTop: `1px dotted ${colors.rule}`,
            }}>
              <span style={{
                fontFamily: fonts.mono,
                fontSize: 10,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: colors.muted,
              }}>
                Active:
              </span>
              {searchQuery && (
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "3px 10px",
                  fontFamily: fonts.mono,
                  fontSize: 10,
                  color: colors.ink,
                  background: colors.warmBg,
                  border: `1px solid ${colors.rule}`,
                }}>
                  &ldquo;{searchQuery.slice(0, 20)}{searchQuery.length > 20 ? "..." : ""}&rdquo;
                  <button
                    onClick={() => setSearchQuery("")}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: colors.muted }}
                    aria-label="Clear search filter"
                    type="button"
                  >
                    <X style={{ width: 10, height: 10 }} />
                  </button>
                </span>
              )}
              {selectedCategory !== "all" && (
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "3px 10px",
                  fontFamily: fonts.mono,
                  fontSize: 10,
                  color: colors.ink,
                  background: colors.warmBg,
                  border: `1px solid ${colors.rule}`,
                }}>
                  {categories.find((c) => c.id === selectedCategory)?.name}
                  <button
                    onClick={() => setSelectedCategory("all")}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: colors.muted }}
                    aria-label="Clear category filter"
                    type="button"
                  >
                    <X style={{ width: 10, height: 10 }} />
                  </button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 10,
                  color: colors.accent,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: 0,
                }}
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* Content Grid — Main Articles + Sidebar */}
        {/* ============================================================ */}
        <div
          id="articles-section"
          className="grid lg:grid-cols-4"
          style={{ gap: 32 }}
        >
          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Editor&apos;s Picks — Only when we have enough featured content */}
            {showEditorsPicks && !hasActiveFilters && (
              <div style={{ marginBottom: 40 }}>
                {/* Section header with double rule */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}>
                    <h2 style={{
                      fontFamily: fonts.headline,
                      fontSize: 22,
                      fontWeight: 700,
                      color: colors.ink,
                    }}>
                      Editor&apos;s Picks
                    </h2>
                    <Link
                      href="/blog/featured"
                      style={{
                        fontFamily: fonts.body,
                        fontSize: 12,
                        fontStyle: "italic",
                        color: colors.accent,
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      View All
                      <ArrowRight style={{ width: 12, height: 12 }} />
                    </Link>
                  </div>
                  <div style={{ height: 2, background: colors.ink }} />
                  <div style={{ height: 1, background: colors.ink, marginTop: 2 }} />
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
              {/* Section header */}
              <div style={{ marginBottom: 20 }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                  flexWrap: "wrap",
                  gap: 8,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <h2 style={{
                      fontFamily: fonts.headline,
                      fontSize: 22,
                      fontWeight: 700,
                      color: colors.ink,
                    }}>
                      {getCurrentCategoryName()}
                    </h2>
                    <span style={{
                      fontFamily: fonts.mono,
                      fontSize: 10,
                      color: colors.muted,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}>
                      {filteredPosts.length}{" "}
                      {filteredPosts.length === 1 ? "article" : "articles"}
                    </span>
                  </div>

                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      style={{
                        fontFamily: fonts.mono,
                        fontSize: 10,
                        color: colors.accent,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <X style={{ width: 10, height: 10 }} />
                      Reset filters
                    </button>
                  )}
                </div>
                <div style={{ height: 2, background: colors.ink }} />
                <div style={{ height: 1, background: colors.ink, marginTop: 2 }} />
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

              {/* Load More */}
              {filteredPosts.length > 9 && (
                <div style={{ textAlign: "center", marginTop: 40 }}>
                  <button
                    style={{
                      padding: "14px 36px",
                      fontFamily: fonts.mono,
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      color: colors.ink,
                      background: "transparent",
                      border: `1px solid ${colors.ink}`,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.ink;
                      e.currentTarget.style.color = colors.cream;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = colors.ink;
                    }}
                  >
                    Load More Articles
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar — Desktop */}
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

        {/* Sidebar — Mobile (below content) */}
        <div className="lg:hidden" style={{ marginTop: 40 }}>
          {/* Divider before mobile sidebar */}
          <div style={{
            height: 2,
            background: colors.ink,
            marginBottom: 2,
          }} />
          <div style={{
            height: 1,
            background: colors.ink,
            marginBottom: 24,
          }} />
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
