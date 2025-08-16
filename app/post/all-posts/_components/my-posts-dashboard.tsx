"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@/hooks/use-media-query";
import { logger } from '@/lib/logger';
import { 
  Layout, 
  List, 
  Grid, 
  BarChart2, 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2, 
  Clock, 
  Eye, 
  MessageCircle, 
  Heart, 
  CheckCircle, 
  FileText, 
  X, 
  ArrowUpRight,
  BookOpen
} from "lucide-react";

import { cn } from "@/lib/utils";
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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "./empty-state";
import { PostCard } from "./post-card";

interface MyPostsDashboardProps {
  posts: any[];
  categories: string[];
  stats: {
    published: number;
    drafts: number;
    views: number;
    likes: number;
    comments: number;
  };
  user: any;
}

export const MyPostsDashboard = ({ posts, categories, stats, user }: MyPostsDashboardProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [tab, setTab] = useState("published");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Filter posts based on search query, category, and tab
  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === "all" || 
      post.category?.toLowerCase() === selectedCategory.toLowerCase();
    
    const matchesTab = 
      (tab === "published" && post.published) ||
      (tab === "drafts" && !post.published) ||
      (tab === "analytics");

    return matchesSearch && matchesCategory && matchesTab;
  });

  // Delete post handler
  const handleDeletePost = async (postId: string) => {
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
    } catch (error: any) {
      toast.error("Error deleting post");
      logger.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      {/* Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-500 dark:to-pink-500 text-transparent bg-clip-text">
              My Content Hub
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Manage and analyze all your blog posts in one place
            </p>
          </div>
          
          <Link href="/post/create-post">
            <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create New Post
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Published</span>
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.published}</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Drafts</span>
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.drafts}</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Views</span>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.views}</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Likes</span>
              <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                <Heart className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.likes}</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Comments</span>
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                <MessageCircle className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.comments}</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
        <Tabs
          defaultValue="published"
          value={tab}
          onValueChange={setTab}
          className="w-full"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between px-6 pt-6 gap-4">
            <TabsList className="rounded-lg bg-gray-100 dark:bg-gray-700/50 p-1">
              <TabsTrigger 
                value="published" 
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 rounded-md data-[state=active]:shadow"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Published
              </TabsTrigger>
              <TabsTrigger 
                value="drafts" 
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 rounded-md data-[state=active]:shadow"
              >
                <Clock className="w-4 h-4 mr-2" />
                Drafts
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 rounded-md data-[state=active]:shadow"
              >
                <BarChart2 className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setViewMode("grid")}
                variant="outline"
                size="sm"
                className={cn(
                  "border-gray-200 dark:border-gray-700",
                  viewMode === "grid" && "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-700/50"
                )}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setViewMode("list")}
                variant="outline"
                size="sm"
                className={cn(
                  "border-gray-200 dark:border-gray-700",
                  viewMode === "list" && "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-700/50"
                )}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                <Input
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full md:w-[180px] bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category.toLowerCase()}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(tab === "published" || tab === "drafts") && (
            <>
              {isLoading ? (
                // Skeleton loader
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="bg-gray-800/30 rounded-xl h-64 animate-pulse"></div>
                  ))}
                </div>
              ) : filteredPosts.length === 0 ? (
                // Empty state
                <EmptyState 
                  title={tab === "published" ? "No published posts yet" : "No drafts found"}
                  description={
                    searchQuery 
                      ? "Try adjusting your search or filters" 
                      : tab === "published" 
                        ? "Start sharing your knowledge by publishing your first post" 
                        : "Start writing a new draft to continue your creative journey"
                  }
                  icon={tab === "published" ? <FileText className="w-10 h-10 text-gray-500" /> : <Clock className="w-10 h-10 text-gray-500" />}
                  actionLink="/post/create-post"
                  actionText="Create New Post"
                />
              ) : (
                // Posts grid
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className={cn(
                    "p-6",
                    viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "space-y-4"
                  )}
                >
                  {filteredPosts.map((post) => (
                    <motion.div 
                      key={post.id}
                      variants={itemVariants}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    >
                      <PostCard 
                        post={post} 
                        viewMode={viewMode}
                        onDelete={() => handleDeletePost(post.id)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </>
          )}
          
          {tab === "analytics" && (
            <>
              {isLoading ? (
                // Analytics skeleton loader
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="bg-gray-800/30 rounded-xl h-36 animate-pulse"></div>
                    ))}
                  </div>
                  <div className="bg-gray-800/30 rounded-xl h-64 animate-pulse"></div>
                  <div className="bg-gray-800/30 rounded-xl h-40 animate-pulse"></div>
                </div>
              ) : (
                <div className="space-y-8 p-6">
                  {/* Featured Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium flex items-center justify-between">
                          <span>Total Views</span>
                          <Eye className="w-4 h-4 text-blue-500" />
                        </CardTitle>
                        <CardDescription>All-time post views</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.views}</div>
                        <div className="mt-2 h-2 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 dark:bg-blue-400 rounded-full w-3/4"></div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium flex items-center justify-between">
                          <span>Engagement Rate</span>
                          <Heart className="w-4 h-4 text-pink-500" />
                        </CardTitle>
                        <CardDescription>Likes and comments</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {stats.views > 0 
                            ? ((Number(stats.likes) + Number(stats.comments)) / Number(stats.views) * 100).toFixed(1) 
                            : "0.0"}%
                        </div>
                        <div className="mt-2 h-2 bg-pink-100 dark:bg-pink-900/30 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-pink-500 dark:bg-pink-400 rounded-full"
                            style={{ 
                              width: stats.views > 0 
                                ? `${Math.min(((Number(stats.likes) + Number(stats.comments)) / Number(stats.views) * 100), 100)}%` 
                                : "0%" 
                            }}
                          ></div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium flex items-center justify-between">
                          <span>Activity Score</span>
                          <BarChart2 className="w-4 h-4 text-purple-500" />
                        </CardTitle>
                        <CardDescription>Overall content performance</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {Math.min(Math.round((Number(stats.views) * 0.1) + (Number(stats.likes) * 2) + (Number(stats.comments) * 3)), 100)}
                        </div>
                        <div className="mt-2 h-2 bg-purple-100 dark:bg-purple-900/30 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 dark:bg-purple-400 rounded-full"
                            style={{ 
                              width: `${Math.min(Math.round((Number(stats.views) * 0.1) + (Number(stats.likes) * 2) + (Number(stats.comments) * 3)), 100)}%` 
                            }}
                          ></div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Top Performing Posts */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Top Performing Posts</CardTitle>
                      <CardDescription>Your most engaging content</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {posts
                          .filter(post => post.published)
                          .sort((a, b) => (b.views || 0) - (a.views || 0))
                          .slice(0, 5)
                          .map((post) => (
                            <div key={post.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                              <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                                {post.imageUrl && post.imageUrl.trim() ? (
                                  <Image
                                    src={post.imageUrl}
                                    alt={post.title}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <BookOpen className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">{post.title}</h4>
                                <div className="flex items-center gap-4 mt-1">
                                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                    <Eye className="w-3 h-3 mr-1" />
                                    {post.views || 0}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                    <Heart className="w-3 h-3 mr-1" />
                                    {post.likes?.length || 0}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                    <MessageCircle className="w-3 h-3 mr-1" />
                                    {post.comments?.length || 0}
                                  </span>
                                </div>
                              </div>
                              <Link href={`/post/${post.id}`}>
                                <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0">
                                  <ArrowUpRight className="h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Content Recommendations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Content Recommendations</CardTitle>
                      <CardDescription>Suggestions to improve your blog</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {posts.length < 5 && (
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50">
                            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-800/50">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">Create more content</h4>
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                                Publishing more posts can increase your audience reach and engagement
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {posts.some(post => !post.imageUrl) && (
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 border border-pink-100 dark:border-pink-800/50">
                            <div className="p-2 rounded-full bg-pink-100 dark:bg-pink-800/50">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">Add images to all posts</h4>
                              <p className="text-xs text-pink-600 dark:text-pink-400 mt-0.5">
                                Posts with images get 94% more views than those without
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {stats.views > 0 && stats.comments === 0 && (
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-800/50">
                            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-800/50">
                              <MessageCircle className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-medium text-sm">Encourage comments</h4>
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                                End posts with questions to spark discussion and boost engagement
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}; 