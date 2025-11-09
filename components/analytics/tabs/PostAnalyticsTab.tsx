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
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-800/30 rounded-xl h-32 animate-pulse" />
          ))}
        </div>
        <div className="bg-slate-800/30 rounded-xl h-64 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="text-red-600 dark:text-red-400 mb-2">Error loading post analytics</div>
        <div className="text-sm text-slate-600 dark:text-slate-400">{error}</div>
      </div>
    );
  }

  const totalPublished = analytics?.totalPublished || 0;
  const totalDrafts = analytics?.totalDrafts || 0;
  const totalViews = analytics?.totalViews || 0;
  const totalLikes = analytics?.totalLikes || 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
            <Edit3 className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Post Analytics</h2>
            <p className="text-slate-600 dark:text-slate-400">Track your content performance and engagement</p>
          </div>
        </div>
        <Link href="/post/create-post">
          <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500">
            <Plus className="h-4 w-4 mr-2" />
            Create Post
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Published Posts</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalPublished}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {totalPublished > 0 ? 'Active content' : 'Start writing!'}
                  </p>
                </div>
                <Edit3 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-600 dark:text-amber-400 text-sm font-medium">Draft Posts</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalDrafts}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {totalDrafts > 0 ? 'In progress' : 'No drafts'}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-600 dark:text-cyan-400 text-sm font-medium">Total Views</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalViews.toLocaleString()}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {totalViews > 100 ? '+14% vs last month' : 'Keep writing!'}
                  </p>
                </div>
                <Eye className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-600 dark:text-pink-400 text-sm font-medium">Total Likes</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalLikes.toLocaleString()}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {totalLikes > 50 ? '+23% growth' : 'Keep engaging!'}
                  </p>
                </div>
                <Heart className="h-8 w-8 text-pink-600 dark:text-pink-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Performing Posts */}
      {analytics && (analytics.mostViewedPost || analytics.mostLikedPost || analytics.mostCommentedPost) ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {analytics.mostViewedPost && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-slate-800/30 dark:bg-slate-800/30 bg-white/50 border-slate-300/50 dark:border-slate-700/50">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 rounded-lg bg-teal-500/20 border border-teal-500/30">
                      <TrendingUp className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <Badge variant="secondary" className="bg-teal-900/30 text-teal-600 dark:text-teal-400">
                      Most Popular
                    </Badge>
                  </div>
                  <h3 className="text-sm text-slate-600 dark:text-slate-400 mb-2">Most Viewed Post</h3>
                  <p className="text-slate-900 dark:text-white font-medium mb-3 line-clamp-2">
                    {analytics.mostViewedPost.title}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
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
              <Card className="bg-slate-800/30 dark:bg-slate-800/30 bg-white/50 border-slate-300/50 dark:border-slate-700/50">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 rounded-lg bg-pink-500/20 border border-pink-500/30">
                      <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                    </div>
                    <Badge variant="secondary" className="bg-pink-900/30 text-pink-600 dark:text-pink-400">
                      Most Liked
                    </Badge>
                  </div>
                  <h3 className="text-sm text-slate-600 dark:text-slate-400 mb-2">Most Liked Post</h3>
                  <p className="text-slate-900 dark:text-white font-medium mb-3 line-clamp-2">
                    {analytics.mostLikedPost.title}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
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
              <Card className="bg-slate-800/30 dark:bg-slate-800/30 bg-white/50 border-slate-300/50 dark:border-slate-700/50">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                      <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <Badge variant="secondary" className="bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                      Most Discussed
                    </Badge>
                  </div>
                  <h3 className="text-sm text-slate-600 dark:text-slate-400 mb-2">Most Commented Post</h3>
                  <p className="text-slate-900 dark:text-white font-medium mb-3 line-clamp-2">
                    {analytics.mostCommentedPost.title}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
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
        <Card className="bg-slate-800/30 dark:bg-slate-800/30 bg-white/50 border-slate-300/50 dark:border-slate-700/50">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              Monthly Engagement Trend
            </h3>
            <div className="relative h-64 w-full">
              <div className="flex items-end absolute inset-0 pt-8">
                {[35, 45, 30, 65, 85, 75, 60, 40, 50, 70, 60, 55].map((height, i) => (
                  <div key={i} className="flex-1 mx-1">
                    <div 
                      className="bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-sm transition-all duration-300 hover:from-emerald-500 hover:to-teal-300"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                ))}
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-slate-600 dark:text-slate-500 pt-2 border-t border-slate-300 dark:border-slate-700">
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
          <Card className="bg-slate-800/30 dark:bg-slate-800/30 bg-white/50 border-slate-300/50 dark:border-slate-700/50">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Popular Topics
              </h3>
              <div className="flex flex-wrap gap-3">
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
                      className={`px-4 py-2 rounded-full ${colorSet.bg} ${colorSet.text} border ${colorSet.border} text-sm flex items-center gap-2`}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {category.name}
                      <span className="text-xs opacity-70">
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
          <Card className="bg-slate-800/30 dark:bg-slate-800/30 bg-white/50 border-slate-300/50 dark:border-slate-700/50">
            <CardContent className="p-8 text-center">
              <Sparkles className="h-12 w-12 text-slate-500 dark:text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No Topic Data Yet</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">Add tags to your posts to see which topics are popular</p>
              <Link href="/post/create-post">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
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
          <Card className="bg-slate-800/30 dark:bg-slate-800/30 bg-white/50 border-slate-300/50 dark:border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Recent Posts
                </h3>
                <Link href="/my-posts">
                  <Button variant="outline" size="sm">
                    View All Posts
                  </Button>
                </Link>
              </div>
              
              <div className="space-y-4">
                {publishedPosts.slice(0, 3).map((post, index) => (
                  <div key={post.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-200/50 dark:bg-slate-700/30 border border-slate-300/50 dark:border-slate-600/30">
                    <div className="flex-1">
                      <h4 className="text-slate-900 dark:text-white font-medium mb-1 line-clamp-1">{post.title}</h4>
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-2 line-clamp-2">{post.excerpt}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-500">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post.views} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {post.likes} likes
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {post.comments} comments
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-600 dark:text-slate-500">
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
          <Card className="bg-slate-800/30 dark:bg-slate-800/30 bg-white/50 border-slate-300/50 dark:border-slate-700/50">
            <CardContent className="p-12 text-center">
              <Edit3 className="h-16 w-16 text-slate-500 dark:text-slate-400 mx-auto mb-6" />
              <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-3">Start Your Writing Journey</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                Share your thoughts, insights, and expertise with the world. Create your first post to begin tracking your content analytics.
              </p>
              <Link href="/post/create-post">
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500">
                  <Plus className="h-4 w-4 mr-2" />
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