"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Edit3, Eye, Heart, MessageSquare, TrendingUp, 
  BarChart2, Clock, Sparkles, Plus
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUserPostsAnalytics, getUserPublishedPosts, getUserDraftPosts } from "@/actions/get-user-posts";

interface PostAnalyticsTabProps {
  className?: string;
}

export function PostAnalyticsTab({ className }: PostAnalyticsTabProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [publishedPosts, setPublishedPosts] = useState<any[]>([]);
  const [draftPosts, setDraftPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [analyticsResult, publishedResult, draftsResult] = await Promise.all([
          getUserPostsAnalytics(),
          getUserPublishedPosts(),
          getUserDraftPosts()
        ]);

        if (analyticsResult.error) {
          setError(analyticsResult.error);
        } else {
          setAnalytics(analyticsResult.analytics);
        }

        if (publishedResult.error) {
          setError(publishedResult.error);
        } else {
          setPublishedPosts(publishedResult.posts);
        }

        if (draftsResult.error) {
          setError(draftsResult.error);
        } else {
          setDraftPosts(draftsResult.posts);
        }
      } catch (err) {
        setError("Failed to load post analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className={`space-y-4 sm:space-y-5 md:space-y-6 ${className}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-800/30 rounded-lg sm:rounded-xl h-24 sm:h-28 md:h-32 animate-pulse" />
          ))}
        </div>
        <div className="bg-slate-800/30 rounded-lg sm:rounded-xl h-48 sm:h-56 md:h-64 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 sm:p-6 text-center ${className}`}>
        <div className="text-sm sm:text-base text-red-600 dark:text-red-400 mb-2 break-words">Error loading post analytics</div>
        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 break-words">{error}</div>
      </div>
    );
  }

  const totalPublished = analytics?.totalPublished || 0;
  const totalDrafts = analytics?.totalDrafts || 0;
  const totalViews = analytics?.totalViews || 0;
  const totalLikes = analytics?.totalLikes || 0;

  return (
    <div className={`space-y-4 sm:space-y-5 md:space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex-shrink-0">
            <Edit3 className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white break-words">Post Analytics</h2>
            <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed break-words">Track your content performance and engagement</p>
          </div>
        </div>
        <Link href="/post/create-post" className="w-full sm:w-auto">
          <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 w-full sm:w-auto min-h-[44px] sm:min-h-[40px] text-sm sm:text-base font-medium touch-manipulation">
            <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
            Create Post
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20 rounded-xl sm:rounded-2xl">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-medium break-words">Published Posts</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{totalPublished}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed break-words">
                    {totalPublished > 0 ? 'Active content' : 'Start writing!'}
                  </p>
                </div>
                <Edit3 className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-emerald-600 dark:text-emerald-400 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20 rounded-xl sm:rounded-2xl">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-amber-600 dark:text-amber-400 text-xs sm:text-sm font-medium break-words">Draft Posts</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{totalDrafts}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed break-words">
                    {totalDrafts > 0 ? 'In progress' : 'No drafts'}
                  </p>
                </div>
                <Clock className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-amber-600 dark:text-amber-400 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20 rounded-xl sm:rounded-2xl">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-cyan-600 dark:text-cyan-400 text-xs sm:text-sm font-medium break-words">Total Views</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{totalViews.toLocaleString()}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed break-words">
                    {totalViews > 100 ? '+14% vs last month' : 'Keep writing!'}
                  </p>
                </div>
                <Eye className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-cyan-600 dark:text-cyan-400 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-500/20 rounded-xl sm:rounded-2xl">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-pink-600 dark:text-pink-400 text-xs sm:text-sm font-medium break-words">Total Likes</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{totalLikes.toLocaleString()}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed break-words">
                    {totalLikes > 50 ? '+23% growth' : 'Keep engaging!'}
                  </p>
                </div>
                <Heart className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-pink-600 dark:text-pink-400 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Performing Posts */}
      {analytics && (analytics.mostViewedPost || analytics.mostLikedPost || analytics.mostCommentedPost) ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {analytics.mostViewedPost && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-slate-800/30 dark:bg-slate-800/30 bg-white/50 border-slate-300/50 dark:border-slate-700/50 rounded-xl sm:rounded-2xl">
                <CardContent className="p-4 sm:p-5 md:p-6">
                  <div className="flex justify-between items-start mb-3 sm:mb-4">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-teal-500/20 border border-teal-500/30 flex-shrink-0">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <Badge variant="secondary" className="bg-teal-900/30 text-teal-600 dark:text-teal-400 text-xs sm:text-sm">
                      Most Popular
                    </Badge>
                  </div>
                  <h3 className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-2">Most Viewed Post</h3>
                  <p className="text-sm sm:text-base text-slate-900 dark:text-white font-medium mb-2 sm:mb-3 line-clamp-2 break-words leading-relaxed">
                    {analytics.mostViewedPost.title}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    {analytics.mostViewedPost.views.toLocaleString()} views
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {analytics.mostLikedPost && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="bg-slate-800/30 dark:bg-slate-800/30 bg-white/50 border-slate-300/50 dark:border-slate-700/50 rounded-xl sm:rounded-2xl">
                <CardContent className="p-4 sm:p-5 md:p-6">
                  <div className="flex justify-between items-start mb-3 sm:mb-4">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-pink-500/20 border border-pink-500/30 flex-shrink-0">
                      <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-pink-600 dark:text-pink-400" />
                    </div>
                    <Badge variant="secondary" className="bg-pink-900/30 text-pink-600 dark:text-pink-400 text-xs sm:text-sm">
                      Most Liked
                    </Badge>
                  </div>
                  <h3 className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-2">Most Liked Post</h3>
                  <p className="text-sm sm:text-base text-slate-900 dark:text-white font-medium mb-2 sm:mb-3 line-clamp-2 break-words leading-relaxed">
                    {analytics.mostLikedPost.title}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    {analytics.mostLikedPost.likes.toLocaleString()} likes
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {analytics.mostCommentedPost && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="bg-slate-800/30 dark:bg-slate-800/30 bg-white/50 border-slate-300/50 dark:border-slate-700/50 rounded-xl sm:rounded-2xl">
                <CardContent className="p-4 sm:p-5 md:p-6">
                  <div className="flex justify-between items-start mb-3 sm:mb-4">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex-shrink-0">
                      <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <Badge variant="secondary" className="bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm">
                      Most Discussed
                    </Badge>
                  </div>
                  <h3 className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-2">Most Commented Post</h3>
                  <p className="text-sm sm:text-base text-slate-900 dark:text-white font-medium mb-2 sm:mb-3 line-clamp-2 break-words leading-relaxed">
                    {analytics.mostCommentedPost.title}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                    {analytics.mostCommentedPost.comments.toLocaleString()} comments
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      ) : null}

      {/* Engagement Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="bg-slate-800/30 dark:bg-slate-800/30 bg-white/50 border-slate-300/50 dark:border-slate-700/50 rounded-xl sm:rounded-2xl">
          <CardContent className="p-4 sm:p-5 md:p-6">
            <h3 className="text-base sm:text-lg font-medium text-slate-900 dark:text-white mb-4 sm:mb-5 md:mb-6 flex items-center gap-2 break-words">
              <BarChart2 className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
              Monthly Engagement Trend
            </h3>
            <div className="relative h-48 sm:h-56 md:h-64 w-full overflow-x-auto">
              <div className="flex items-end absolute inset-0 pt-6 sm:pt-8 min-w-[600px] sm:min-w-0">
                {[35, 45, 30, 65, 85, 75, 60, 40, 50, 70, 60, 55].map((height, i) => (
                  <div key={i} className="flex-1 mx-0.5 sm:mx-1">
                    <div 
                      className="bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-sm transition-all duration-300 hover:from-emerald-500 hover:to-teal-300"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                ))}
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] sm:text-xs text-slate-600 dark:text-slate-500 pt-2 border-t border-slate-300 dark:border-slate-700 min-w-[600px] sm:min-w-0">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (
                  <div key={i} className="flex-1 text-center">{month}</div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Popular Topics */}
      {analytics?.popularCategories && analytics.popularCategories.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="bg-slate-800/30 dark:bg-slate-800/30 bg-white/50 border-slate-300/50 dark:border-slate-700/50 rounded-xl sm:rounded-2xl">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <h3 className="text-base sm:text-lg font-medium text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2 break-words">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                Popular Topics
              </h3>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {analytics.popularCategories.map((category: any, index: number) => {
                  const colors = [
                    { bg: "bg-emerald-900/30", text: "text-emerald-400", border: "border-emerald-500/30" },
                    { bg: "bg-teal-900/30", text: "text-teal-400", border: "border-teal-500/30" },
                    { bg: "bg-cyan-900/30", text: "text-cyan-400", border: "border-cyan-500/30" },
                    { bg: "bg-indigo-900/30", text: "text-indigo-400", border: "border-indigo-500/30" },
                    { bg: "bg-purple-900/30", text: "text-purple-400", border: "border-purple-500/30" }
                  ];
                  const colorSet = colors[index % colors.length];
                  
                  return (
                    <div 
                      key={category.name} 
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full ${colorSet.bg} ${colorSet.text} border ${colorSet.border} text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 break-words`}
                    >
                      <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                      <span className="break-words">{category.name}</span>
                      <span className="text-[10px] sm:text-xs opacity-70 whitespace-nowrap">
                        {category.count > 1 ? `${category.count} posts` : '1 post'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="bg-slate-800/30 dark:bg-slate-800/30 bg-white/50 border-slate-300/50 dark:border-slate-700/50 rounded-xl sm:rounded-2xl">
            <CardContent className="p-6 sm:p-8 text-center">
              <Sparkles className="h-10 w-10 sm:h-12 sm:w-12 text-slate-500 dark:text-slate-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-slate-900 dark:text-white mb-2 break-words">No Topic Data Yet</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed px-2 break-words">Add tags to your posts to see which topics are popular</p>
              <Link href="/post/create-post">
                <Button variant="outline" size="sm" className="min-h-[40px] sm:min-h-[36px] text-xs sm:text-sm px-3 sm:px-4 touch-manipulation">
                  <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                  Create Your First Post
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Posts */}
      {publishedPosts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <Card className="bg-slate-800/30 dark:bg-slate-800/30 bg-white/50 border-slate-300/50 dark:border-slate-700/50 rounded-xl sm:rounded-2xl">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-5 md:mb-6 gap-3 sm:gap-0">
                <h3 className="text-base sm:text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2 break-words">
                  <Edit3 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  Recent Posts
                </h3>
                <Link href="/my-posts" className="w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto min-h-[40px] sm:min-h-[36px] text-xs sm:text-sm px-3 sm:px-4 touch-manipulation">
                    View All Posts
                  </Button>
                </Link>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                {publishedPosts.slice(0, 3).map((post, index) => (
                  <div key={post.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-3 sm:p-4 rounded-lg bg-slate-200/50 dark:bg-slate-700/30 border border-slate-300/50 dark:border-slate-600/30">
                    <div className="flex-1 min-w-0 w-full sm:w-auto">
                      <h4 className="text-sm sm:text-base text-slate-900 dark:text-white font-medium mb-1 line-clamp-1 break-words">{post.title}</h4>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-2 sm:mb-3 line-clamp-2 leading-relaxed break-words">{post.excerpt}</p>
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-slate-600 dark:text-slate-500">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3 flex-shrink-0" />
                          {post.views} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3 flex-shrink-0" />
                          {post.likes} likes
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3 flex-shrink-0" />
                          {post.comments} comments
                        </span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right text-xs text-slate-600 dark:text-slate-500 whitespace-nowrap w-full sm:w-auto">
                      {new Date(post.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Empty State */}
      {totalPublished === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-slate-800/30 dark:bg-slate-800/30 bg-white/50 border-slate-300/50 dark:border-slate-700/50 rounded-xl sm:rounded-2xl">
            <CardContent className="p-6 sm:p-8 md:p-12 text-center">
              <Edit3 className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-slate-500 dark:text-slate-400 mx-auto mb-4 sm:mb-5 md:mb-6" />
              <h3 className="text-lg sm:text-xl font-medium text-slate-900 dark:text-white mb-2 sm:mb-3 break-words">Start Your Writing Journey</h3>
              <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 mb-4 sm:mb-5 md:mb-6 max-w-md mx-auto leading-relaxed px-2 break-words">
                Share your thoughts, insights, and expertise with the world. Create your first post to begin tracking your content analytics.
              </p>
              <Link href="/post/create-post" className="inline-block w-full sm:w-auto">
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 w-full sm:w-auto min-h-[44px] sm:min-h-[40px] text-sm sm:text-base font-medium touch-manipulation">
                  <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                  Create Your First Post
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}