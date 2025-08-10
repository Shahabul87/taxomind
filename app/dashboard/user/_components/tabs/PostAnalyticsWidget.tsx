"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { logger } from '@/lib/logger';
import { 
  Edit3, Eye, Heart, MessageSquare, TrendingUp, 
  Plus, ArrowRight
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUserPostsAnalytics, getUserPublishedPosts } from "@/actions/get-user-posts";
import { User } from "next-auth";

interface PostAnalyticsWidgetProps {
  user: User;
  className?: string;
}

export function PostAnalyticsWidget({ user, className }: PostAnalyticsWidgetProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [analyticsResult, postsResult] = await Promise.all([
          getUserPostsAnalytics(),
          getUserPublishedPosts()
        ]);

        if (!analyticsResult.error) {
          setAnalytics(analyticsResult.analytics);
        }

        if (!postsResult.error) {
          setRecentPosts(postsResult.posts.slice(0, 3));
        }
      } catch (err) {
        logger.error("Failed to load post analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="bg-slate-800/30 rounded-xl h-32 animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-800/30 rounded-lg h-20 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const totalPublished = analytics?.totalPublished || 0;
  const totalViews = analytics?.totalViews || 0;
  const totalLikes = analytics?.totalLikes || 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                <Edit3 className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-white">Content Analytics</CardTitle>
                <p className="text-sm text-slate-400">Your writing performance</p>
              </div>
            </div>
            <Link href="/analytics/user">
              <Button variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                View All
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {totalPublished > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">{totalPublished}</div>
                <div className="text-xs text-slate-400">Published</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{totalViews.toLocaleString()}</div>
                <div className="text-xs text-slate-400">Views</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-400">{totalLikes}</div>
                <div className="text-xs text-slate-400">Likes</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Edit3 className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-400 text-sm mb-3">No posts yet</p>
              <Link href="/post/create-post">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Performing Post */}
      {analytics?.mostViewedPost && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <Badge variant="secondary" className="bg-teal-900/30 text-teal-400">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Top Post
                </Badge>
                <div className="text-xs text-slate-500">
                  {analytics.mostViewedPost.views.toLocaleString()} views
                </div>
              </div>
              <h4 className="text-white font-medium text-sm line-clamp-2 mb-2">
                {analytics.mostViewedPost.title}
              </h4>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {analytics.mostViewedPost.likes || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {analytics.mostViewedPost.comments || 0}
                  </span>
                </div>
                <Link href="/my-posts" className="text-emerald-400 hover:text-emerald-300">
                  View all →
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Posts */}
      {recentPosts.length > 0 && (
        <Card className="bg-slate-800/30 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-emerald-400" />
              Recent Posts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {recentPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30 border border-slate-600/30"
                >
                  <div className="flex-1 min-w-0">
                    <h5 className="text-white text-sm font-medium truncate">{post.title}</h5>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {post.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {post.likes}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(post.updatedAt).toLocaleDateString()}
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link href="/my-posts">
                <Button variant="outline" size="sm" className="w-full">
                  View All Posts
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Popular Topics */}
      {analytics?.popularCategories && analytics.popularCategories.length > 0 && (
        <Card className="bg-slate-800/30 border-slate-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white">Popular Topics</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {analytics.popularCategories.slice(0, 4).map((category: any, index: number) => {
                const colors = [
                  "bg-emerald-900/30 text-emerald-400",
                  "bg-teal-900/30 text-teal-400",
                  "bg-cyan-900/30 text-cyan-400",
                  "bg-indigo-900/30 text-indigo-400"
                ];
                
                return (
                  <div 
                    key={category.name} 
                    className={`px-2 py-1 rounded-full text-xs ${colors[index % colors.length]}`}
                  >
                    {category.name} ({category.count})
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}