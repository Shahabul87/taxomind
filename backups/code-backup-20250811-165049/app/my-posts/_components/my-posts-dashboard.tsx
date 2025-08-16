"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  Edit3, Trash2, Eye, Plus, Search, Filter, 
  MessageSquare, Heart, BookmarkPlus, Share2, BarChart2,
  Sparkles, Clock, Flag, TrendingUp, Zap, ThumbsUp
} from "lucide-react";

import { EmptyState } from "./empty-state";
import { PostsFilterMenu } from "./posts-filter-menu";
import { PostStats } from "./post-stats";
import { PostCard } from "./post-card";

interface MyPostsDashboardProps {
  publishedPosts: any[];
  draftPosts: any[];
  analytics: any;
  publishedPostsError: string | null;
  draftPostsError: string | null;
  analyticsError: string | null;
}

export const MyPostsDashboard = ({
  publishedPosts = [],
  draftPosts = [],
  analytics = null,
  publishedPostsError,
  draftPostsError,
  analyticsError,
}: MyPostsDashboardProps) => {
  const [tab, setTab] = useState<"published" | "drafts" | "analytics">("published");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: "all",
    sortBy: "recent"
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Combine all available categories from the posts for filtering
  const availableCategories = Array.from(new Set([
    ...publishedPosts.flatMap(post => post.categories || []),
    ...draftPosts.flatMap(post => post.categories || [])
  ]));
  
  // Filter posts based on search and filter settings
  const filteredPosts = (tab === "published" ? publishedPosts : draftPosts)
    .filter(post => {
      // Search filter
      if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Category filter
      if (filters.category !== "all" && !(post.categories || []).includes(filters.category)) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort based on filter
      if (filters.sortBy === "recent") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (filters.sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      if (filters.sortBy === "popular") {
        return (b.views || 0) - (a.views || 0);
      }
      if (filters.sortBy === "engagement") {
        return ((b.likes || 0) + (b.comments || 0)) - ((a.likes || 0) + (a.comments || 0));
      }
      return 0;
    });
  
  // Stats for the dashboard
  const totalPublished = publishedPosts.length;
  const totalDrafts = draftPosts.length;
  const totalViews = analytics?.totalViews || publishedPosts.reduce((acc, post) => acc + (post.views || 0), 0);
  const totalLikes = analytics?.totalLikes || publishedPosts.reduce((acc, post) => acc + (post.likes || 0), 0);
  
  // Dynamic header text based on tab
  const getHeaderText = () => {
    switch(tab) {
      case "published": return "Published Articles";
      case "drafts": return "Draft Articles";
      case "analytics": return "Content Analytics";
      default: return "My Content";
    }
  };

  // Get error for current tab
  const getCurrentError = () => {
    if (tab === "published") return publishedPostsError;
    if (tab === "drafts") return draftPostsError;
    if (tab === "analytics") return analyticsError;
    return null;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Unique Hexagon Pattern Header */}
      <div className="relative py-20 mb-8 overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/90 via-teal-900/90 to-cyan-900/90"></div>
        
        {/* Hexagon Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15L30 0z' fill='%23ffffff' fill-opacity='0.2' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        
        {/* Glowing Effects */}
        <div className="absolute top-1/4 -right-20 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-[120px] opacity-20"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-[120px] opacity-20"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center mb-4"
          >
            <div className="p-3 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
              <Edit3 className="h-8 w-8 text-emerald-400" />
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-center"
          >
            Your Writing Journey
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-lg text-gray-300 max-w-3xl mx-auto text-center"
          >
            Share your thoughts, track engagement, and build your audience all in one place.
          </motion.p>
        </div>
      </div>

      {/* Stats Overview Cards */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10"
      >
        <PostStats 
          title="Published Posts"
          value={totalPublished}
          icon={<Edit3 className="w-5 h-5 text-emerald-400" />}
          change={`${totalPublished > 0 ? 'Active posts' : 'No posts yet'}`}
          positive={totalPublished > 0}
          color="emerald"
        />
        
        <PostStats 
          title="Draft Posts"
          value={totalDrafts}
          icon={<Clock className="w-5 h-5 text-amber-400" />}
          change={`${totalDrafts > 0 ? 'In progress' : 'No drafts'}`}
          positive={totalDrafts > 0}
          color="amber"
        />
        
        <PostStats 
          title="Total Views"
          value={totalViews.toLocaleString()}
          icon={<Eye className="w-5 h-5 text-cyan-400" />}
          change={totalViews > 100 ? "+14% vs last month" : "Keep writing!"}
          positive={totalViews > 0}
          color="cyan"
        />
        
        <PostStats 
          title="Engagement"
          value={totalLikes.toLocaleString()}
          icon={<ThumbsUp className="w-5 h-5 text-pink-400" />}
          change={totalLikes > 50 ? "+23% growth" : "Keep engaging!"}
          positive={totalLikes > 0}
          color="pink"
        />
      </motion.div>

      {/* Main Content Area */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800/50 overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-800/50 overflow-x-auto">
          <button
            onClick={() => setTab("published")}
            className={`px-6 py-4 font-medium text-sm flex items-center ${
              tab === "published"
                ? "text-white border-b-2 border-emerald-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Published
            <span className="ml-2 py-0.5 px-2 rounded-full bg-emerald-900/30 text-emerald-400 text-xs">
              {publishedPosts.length}
            </span>
          </button>
          
          <button
            onClick={() => setTab("drafts")}
            className={`px-6 py-4 font-medium text-sm flex items-center ${
              tab === "drafts"
                ? "text-white border-b-2 border-amber-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Clock className="w-4 h-4 mr-2" />
            Drafts
            <span className="ml-2 py-0.5 px-2 rounded-full bg-amber-900/30 text-amber-400 text-xs">
              {draftPosts.length}
            </span>
          </button>
          
          <button
            onClick={() => setTab("analytics")}
            className={`px-6 py-4 font-medium text-sm flex items-center ${
              tab === "analytics"
                ? "text-white border-b-2 border-cyan-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <BarChart2 className="w-4 h-4 mr-2" />
            Analytics
          </button>
          
          <div className="flex-1"></div>
          
          {/* Search & Filter */}
          <div className="flex items-center px-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-64"
              />
              <Search className="h-4 w-4 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
            
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="ml-2 p-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-400 hover:text-white"
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Filter Dropdown */}
        {filterOpen && (
          <PostsFilterMenu 
            filters={filters}
            setFilters={setFilters}
            onClose={() => setFilterOpen(false)}
            activeTab={tab}
            availableCategories={availableCategories}
          />
        )}

        {/* Content Section */}
        <div className="p-6">
          {/* Error display */}
          {getCurrentError() && (
            <div className="p-4 mb-6 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400">
              {getCurrentError()}
            </div>
          )}
          
          {/* Section Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center">
              {tab === "published" && <Edit3 className="w-5 h-5 mr-2 text-emerald-400" />}
              {tab === "drafts" && <Clock className="w-5 h-5 mr-2 text-amber-400" />}
              {tab === "analytics" && <BarChart2 className="w-5 h-5 mr-2 text-cyan-400" />}
              {getHeaderText()}
            </h2>
            
            <Link href="/editor/new">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium text-sm hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Post
              </motion.button>
            </Link>
          </div>
          
          {/* Conditionally render content based on tab */}
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
                  icon={tab === "published" ? <Edit3 className="w-10 h-10 text-gray-500" /> : <Clock className="w-10 h-10 text-gray-500" />}
                  actionLink="/editor/new"
                  actionText="Create New Post"
                />
              ) : (
                // Posts grid
                <motion.div 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                >
                  {filteredPosts.map((post) => (
                    <motion.div 
                      key={post.id}
                      variants={itemVariants}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    >
                      <PostCard post={post} />
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
              ) : analytics ? (
                <div className="space-y-8">
                  {/* Featured Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {analytics.mostViewedPost && (
                      <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-800/80">
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-2 rounded-lg bg-teal-500/20 border border-teal-500/30">
                            <TrendingUp className="h-5 w-5 text-teal-400" />
                          </div>
                          <span className="text-xs text-teal-400 bg-teal-900/30 px-2 py-1 rounded-full">
                            Most Popular
                          </span>
                        </div>
                        <h3 className="text-sm text-gray-400">Most Viewed Post</h3>
                        <p className="text-white font-medium mt-1 truncate">{analytics.mostViewedPost.title}</p>
                        <p className="text-gray-500 text-sm mt-2">{analytics.mostViewedPost.views.toLocaleString()} views</p>
                      </div>
                    )}
                    
                    {analytics.mostLikedPost && (
                      <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-800/80">
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-2 rounded-lg bg-pink-500/20 border border-pink-500/30">
                            <Heart className="h-5 w-5 text-pink-400" />
                          </div>
                          <span className="text-xs text-pink-400 bg-pink-900/30 px-2 py-1 rounded-full">
                            Most Liked
                          </span>
                        </div>
                        <h3 className="text-sm text-gray-400">Most Liked Post</h3>
                        <p className="text-white font-medium mt-1 truncate">{analytics.mostLikedPost.title}</p>
                        <p className="text-gray-500 text-sm mt-2">{analytics.mostLikedPost.likes.toLocaleString()} likes</p>
                      </div>
                    )}
                    
                    {analytics.mostCommentedPost && (
                      <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-800/80">
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                            <MessageSquare className="h-5 w-5 text-indigo-400" />
                          </div>
                          <span className="text-xs text-indigo-400 bg-indigo-900/30 px-2 py-1 rounded-full">
                            Most Discussed
                          </span>
                        </div>
                        <h3 className="text-sm text-gray-400">Most Commented Post</h3>
                        <p className="text-white font-medium mt-1 truncate">{analytics.mostCommentedPost.title}</p>
                        <p className="text-gray-500 text-sm mt-2">{analytics.mostCommentedPost.comments.toLocaleString()} comments</p>
                      </div>
                    )}
                    
                    {/* Fallback if no stats */}
                    {!analytics.mostViewedPost && !analytics.mostLikedPost && !analytics.mostCommentedPost && (
                      <div className="col-span-3 p-10 text-center">
                        <h3 className="text-gray-400 mb-2">No analytics data available yet</h3>
                        <p className="text-gray-500 text-sm">Publish more content to see your analytics</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Engagement Chart Placeholder */}
                  <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-800/80">
                    <h3 className="text-lg font-medium text-white mb-6">Monthly Engagement</h3>
                    <div className="relative h-64 w-full">
                      {/* This would be a chart in a real app */}
                      <div className="flex items-end absolute inset-0 pt-8">
                        {[35, 45, 30, 65, 85, 75, 60, 40, 50, 70, 60, 55].map((height, i) => (
                          <div key={i} className="flex-1 mx-1">
                            <div 
                              className="bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-sm"
                              style={{ height: `${height}%` }}
                            ></div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Month labels */}
                      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-800">
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (
                          <div key={i} className="flex-1 text-center">{month}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Popular Topics */}
                  {analytics.popularCategories && analytics.popularCategories.length > 0 ? (
                    <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-800/80">
                      <h3 className="text-lg font-medium text-white mb-4">Popular Topics</h3>
                      <div className="flex flex-wrap gap-2">
                        {analytics.popularCategories.map((category, index) => {
                          // Use different colors for different categories
                          const colors = [
                            { bg: "bg-emerald-900/30", text: "text-emerald-400", accent: "text-emerald-500/80" },
                            { bg: "bg-teal-900/30", text: "text-teal-400", accent: "text-teal-500/80" },
                            { bg: "bg-cyan-900/30", text: "text-cyan-400", accent: "text-cyan-500/80" },
                            { bg: "bg-indigo-900/30", text: "text-indigo-400", accent: "text-indigo-500/80" },
                            { bg: "bg-purple-900/30", text: "text-purple-400", accent: "text-purple-500/80" }
                          ];
                          const colorSet = colors[index % colors.length];
                          
                          return (
                            <div 
                              key={category.name} 
                              className={`px-3 py-1.5 ${colorSet.bg} ${colorSet.text} rounded-full text-sm flex items-center`}
                            >
                              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                              {category.name}
                              <span className={`ml-1.5 text-xs ${colorSet.accent}`}>
                                {category.count > 1 ? `${category.count} posts` : '1 post'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-800/80 text-center">
                      <h3 className="text-lg font-medium text-white mb-2">No Topic Data Yet</h3>
                      <p className="text-gray-400">Add tags to your posts to see which topics are popular</p>
                    </div>
                  )}
                </div>
              ) : (
                // Empty analytics state
                <EmptyState 
                  title="No analytics data available"
                  description="Start publishing content to see your analytics and insights"
                  icon={<BarChart2 className="w-10 h-10 text-gray-500" />}
                  actionLink="/editor/new"
                  actionText="Create New Post"
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}; 