"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Search,
  X,
  Grid,
  List,
  CheckCircle,
  Clock,
  BarChart2,
  SlidersHorizontal,
  ArrowUpDown,
  Download,
  Filter,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { StatsCards } from "./stats-cards";
import { EnhancedPostCard } from "./enhanced-post-card";
import { EnhancedEmptyState } from "./enhanced-empty-state";
import dynamic from 'next/dynamic';
const EnhancedAnalytics = dynamic(
  () => import('./enhanced-analytics').then(mod => ({ default: mod.EnhancedAnalytics })),
  { ssr: false, loading: () => <div className="animate-pulse h-64 bg-muted rounded-lg" /> }
);
import { BulkActionsBar } from "./bulk-actions-bar";
import { DashboardSkeleton, AnalyticsSkeleton } from "./shimmer-skeleton";
import type { Post, DashboardStats, DashboardUser, ViewMode, TabValue, SortOption } from "./types";

interface EnhancedDashboardProps {
  posts: Post[];
  categories: string[];
  stats: DashboardStats;
  user: DashboardUser;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'most-views', label: 'Most Views' },
  { value: 'least-views', label: 'Least Views' },
  { value: 'most-engagement', label: 'Most Engagement' },
  { value: 'alphabetical', label: 'Alphabetical' },
];

export const EnhancedDashboard = ({
  posts,
  categories,
  stats,
  user,
}: EnhancedDashboardProps) => {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [tab, setTab] = useState<TabValue>("published");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const router = useRouter();

  // Computed values
  const isSelectionMode = selectedIds.size > 0;

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    let result = posts.filter(post => {
      const matchesSearch =
        post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" ||
        post.category?.toLowerCase() === selectedCategory.toLowerCase();

      const matchesTab =
        tab === "analytics" ||
        (tab === "published" && post.published) ||
        (tab === "drafts" && !post.published);

      return matchesSearch && matchesCategory && matchesTab;
    });

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'most-views':
        result.sort((a, b) => b.views - a.views);
        break;
      case 'least-views':
        result.sort((a, b) => a.views - b.views);
        break;
      case 'most-engagement':
        result.sort((a, b) => {
          const engagementA = a.comments.length + (a.likes?.length || 0);
          const engagementB = b.comments.length + (b.likes?.length || 0);
          return engagementB - engagementA;
        });
        break;
      case 'alphabetical':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [posts, searchQuery, selectedCategory, tab, sortBy]);

  // Handlers
  const handleDeletePost = useCallback(async (postId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete post");
      }

      toast.success("Post deleted successfully");
      router.refresh();
    } catch (error) {
      toast.error("Error deleting post");
      logger.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.size} post${selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsLoading(true);
    try {
      const deletePromises = Array.from(selectedIds).map(id =>
        fetch(`/api/posts/${id}`, { method: "DELETE" })
      );

      await Promise.all(deletePromises);

      toast.success(`${selectedIds.size} post${selectedIds.size > 1 ? 's' : ''} deleted`);
      setSelectedIds(new Set());
      router.refresh();
    } catch (error) {
      toast.error("Error deleting posts");
      logger.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, [selectedIds, router]);

  const handleBulkPublish = useCallback(async () => {
    const drafts = filteredPosts.filter(p => selectedIds.has(p.id) && !p.published);
    if (drafts.length === 0) return;

    setIsLoading(true);
    try {
      const updatePromises = drafts.map(post =>
        fetch(`/api/posts/${post.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ published: true }),
        })
      );

      await Promise.all(updatePromises);

      toast.success(`${drafts.length} post${drafts.length > 1 ? 's' : ''} published`);
      setSelectedIds(new Set());
      router.refresh();
    } catch (error) {
      toast.error("Error publishing posts");
      logger.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, [selectedIds, filteredPosts, router]);

  const handleBulkUnpublish = useCallback(async () => {
    const published = filteredPosts.filter(p => selectedIds.has(p.id) && p.published);
    if (published.length === 0) return;

    setIsLoading(true);
    try {
      const updatePromises = published.map(post =>
        fetch(`/api/posts/${post.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ published: false }),
        })
      );

      await Promise.all(updatePromises);

      toast.success(`${published.length} post${published.length > 1 ? 's' : ''} unpublished`);
      setSelectedIds(new Set());
      router.refresh();
    } catch (error) {
      toast.error("Error unpublishing posts");
      logger.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, [selectedIds, filteredPosts, router]);

  const handleExport = useCallback(() => {
    const exportPosts = filteredPosts.filter(p => selectedIds.has(p.id));
    const csvContent = [
      ["Title", "Category", "Status", "Views", "Comments", "Created At"].join(","),
      ...exportPosts.map(post =>
        [
          `"${post.title.replace(/"/g, '""')}"`,
          post.category || "Uncategorized",
          post.published ? "Published" : "Draft",
          post.views,
          post.comments.length,
          new Date(post.createdAt).toISOString(),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `posts-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${exportPosts.length} posts`);
  }, [selectedIds, filteredPosts]);

  const toggleSelection = useCallback((postId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredPosts.map(p => p.id)));
  }, [filteredPosts]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 },
    },
  };

  return (
    <div className="w-full py-6 md:py-10">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full px-4 sm:px-6 lg:px-8 mb-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 dark:from-violet-400 dark:via-purple-400 dark:to-indigo-400 text-transparent bg-clip-text">
              My Content Hub
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1.5">
              Manage and analyze all your blog posts in one place
            </p>
          </div>

          <Link href="/teacher/posts/create-post">
            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-300">
              <Plus className="w-4 h-4 mr-2" />
              Create New Post
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <StatsCards stats={stats} posts={posts} />
      </motion.div>

      {/* Main Content Area */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-slate-800/90 rounded-2xl shadow-xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden"
        >
          {/* Bulk Actions Bar */}
          <BulkActionsBar
            selectedIds={selectedIds}
            totalCount={filteredPosts.length}
            posts={filteredPosts}
            onSelectAll={selectAll}
            onDeselectAll={deselectAll}
            onDelete={handleBulkDelete}
            onPublish={handleBulkPublish}
            onUnpublish={handleBulkUnpublish}
            onExport={handleExport}
            isLoading={isLoading}
          />

          <Tabs
            value={tab}
            onValueChange={(value) => {
              setTab(value as TabValue);
              setSelectedIds(new Set());
            }}
            className="w-full"
          >
            {/* Tab Header with Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between px-4 sm:px-6 pt-6 gap-4">
              <TabsList className="rounded-xl bg-slate-100 dark:bg-slate-700/50 p-1 h-auto">
                <TabsTrigger
                  value="published"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-600 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400 rounded-lg px-4 py-2 data-[state=active]:shadow-sm transition-all"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Published
                  {stats.published > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 rounded-full">
                      {stats.published}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="drafts"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-600 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400 rounded-lg px-4 py-2 data-[state=active]:shadow-sm transition-all"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Drafts
                  {stats.drafts > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-full">
                      {stats.drafts}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-600 data-[state=active]:text-violet-600 dark:data-[state=active]:text-violet-400 rounded-lg px-4 py-2 data-[state=active]:shadow-sm transition-all"
                >
                  <BarChart2 className="w-4 h-4 mr-2" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              {/* View Mode Toggle */}
              {tab !== "analytics" && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setViewMode("grid")}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-9 px-3 border-slate-200 dark:border-slate-700",
                      viewMode === "grid" && "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-700/50"
                    )}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => setViewMode("list")}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-9 px-3 border-slate-200 dark:border-slate-700",
                      viewMode === "list" && "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-700/50"
                    )}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Filters */}
            {tab !== "analytics" && (
              <div className="p-4 sm:px-6 border-b border-slate-200/60 dark:border-slate-700/60">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      placeholder="Search posts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-10 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:border-violet-500 dark:focus:border-violet-500 transition-colors"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Category Filter */}
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-[180px] h-10 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700">
                      <Filter className="w-4 h-4 mr-2 text-slate-400" />
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category.toLowerCase()}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Sort */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-10 px-3 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                        <ArrowUpDown className="w-4 h-4 mr-2" />
                        Sort
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {sortOptions.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => setSortBy(option.value)}
                          className={cn(
                            "cursor-pointer",
                            sortBy === option.value && "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400"
                          )}
                        >
                          {option.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}

            {/* Published Tab Content */}
            <TabsContent value="published" className="mt-0">
              {isLoading ? (
                <div className="p-6">
                  <DashboardSkeleton viewMode={viewMode} />
                </div>
              ) : filteredPosts.length === 0 ? (
                <EnhancedEmptyState
                  type={searchQuery ? 'no-results' : 'no-published'}
                  searchQuery={searchQuery}
                  onClearSearch={() => setSearchQuery("")}
                />
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className={cn(
                    "p-4 sm:p-6",
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5"
                      : "space-y-4"
                  )}
                >
                  <AnimatePresence mode="popLayout">
                    {filteredPosts.map((post) => (
                      <motion.div key={post.id} variants={itemVariants} layout>
                        <EnhancedPostCard
                          post={post}
                          viewMode={viewMode}
                          isSelected={selectedIds.has(post.id)}
                          isSelectionMode={isSelectionMode}
                          onSelect={() => toggleSelection(post.id)}
                          onDelete={() => handleDeletePost(post.id)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </TabsContent>

            {/* Drafts Tab Content */}
            <TabsContent value="drafts" className="mt-0">
              {isLoading ? (
                <div className="p-6">
                  <DashboardSkeleton viewMode={viewMode} />
                </div>
              ) : filteredPosts.length === 0 ? (
                <EnhancedEmptyState
                  type={searchQuery ? 'no-results' : 'no-drafts'}
                  searchQuery={searchQuery}
                  onClearSearch={() => setSearchQuery("")}
                />
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className={cn(
                    "p-4 sm:p-6",
                    viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5"
                      : "space-y-4"
                  )}
                >
                  <AnimatePresence mode="popLayout">
                    {filteredPosts.map((post) => (
                      <motion.div key={post.id} variants={itemVariants} layout>
                        <EnhancedPostCard
                          post={post}
                          viewMode={viewMode}
                          isSelected={selectedIds.has(post.id)}
                          isSelectionMode={isSelectionMode}
                          onSelect={() => toggleSelection(post.id)}
                          onDelete={() => handleDeletePost(post.id)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </TabsContent>

            {/* Analytics Tab Content */}
            <TabsContent value="analytics" className="mt-0">
              {isLoading ? (
                <div className="p-6">
                  <AnalyticsSkeleton />
                </div>
              ) : (
                <EnhancedAnalytics posts={posts} stats={stats} />
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};
