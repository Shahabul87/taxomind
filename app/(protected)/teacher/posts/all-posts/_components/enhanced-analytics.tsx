"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Eye,
  Heart,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowUpRight,
  BookOpen,
  BarChart3,
  FileText,
  Lightbulb,
  Target,
  Zap,
} from "lucide-react";
import { format, subDays, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Sparkline, TrendIndicator, ProgressRing } from "./sparkline";
import type { Post, DashboardStats } from "./types";

interface EnhancedAnalyticsProps {
  posts: Post[];
  stats: DashboardStats;
}

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
            {entry.dataKey}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Date range options
type DateRange = '7d' | '14d' | '30d' | '90d';

const dateRangeOptions: { value: DateRange; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '14d', label: '14 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

export const EnhancedAnalytics = ({ posts, stats }: EnhancedAnalyticsProps) => {
  const [dateRange, setDateRange] = useState<DateRange>('30d');

  const daysCount = parseInt(dateRange);

  // Calculate daily views data
  const dailyData = useMemo(() => {
    const data: { date: string; views: number; posts: number; engagement: number }[] = [];
    const today = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayPosts = posts.filter(post => {
        const postDate = new Date(post.createdAt);
        return postDate >= dayStart && postDate <= dayEnd;
      });

      const views = dayPosts.reduce((sum, post) => sum + post.views, 0);
      const comments = dayPosts.reduce((sum, post) => sum + post.comments.length, 0);
      const likes = dayPosts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);

      data.push({
        date: format(new Date(dateStr), 'MMM d'),
        views,
        posts: dayPosts.length,
        engagement: comments + likes,
      });
    }

    return data;
  }, [posts, daysCount]);

  // Category performance
  const categoryData = useMemo(() => {
    const categories: Record<string, { views: number; posts: number; engagement: number }> = {};

    posts.forEach(post => {
      const category = post.category || 'Uncategorized';
      if (!categories[category]) {
        categories[category] = { views: 0, posts: 0, engagement: 0 };
      }
      categories[category].views += post.views;
      categories[category].posts += 1;
      categories[category].engagement += post.comments.length + (post.likes?.length || 0);
    });

    return Object.entries(categories)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  }, [posts]);

  // Week over week comparison
  const weekComparison = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = subDays(now, 7);
    const twoWeeksAgo = subDays(now, 14);

    const thisWeekPosts = posts.filter(post => new Date(post.createdAt) >= oneWeekAgo);
    const lastWeekPosts = posts.filter(post => {
      const date = new Date(post.createdAt);
      return date >= twoWeeksAgo && date < oneWeekAgo;
    });

    const thisWeek = {
      posts: thisWeekPosts.length,
      views: thisWeekPosts.reduce((sum, post) => sum + post.views, 0),
      engagement: thisWeekPosts.reduce((sum, post) => sum + post.comments.length + (post.likes?.length || 0), 0),
    };

    const lastWeek = {
      posts: lastWeekPosts.length,
      views: lastWeekPosts.reduce((sum, post) => sum + post.views, 0),
      engagement: lastWeekPosts.reduce((sum, post) => sum + post.comments.length + (post.likes?.length || 0), 0),
    };

    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      posts: { value: thisWeek.posts, change: calcChange(thisWeek.posts, lastWeek.posts) },
      views: { value: thisWeek.views, change: calcChange(thisWeek.views, lastWeek.views) },
      engagement: { value: thisWeek.engagement, change: calcChange(thisWeek.engagement, lastWeek.engagement) },
    };
  }, [posts]);

  // Top performing posts
  const topPosts = useMemo(() => {
    return [...posts]
      .filter(post => post.published)
      .sort((a, b) => (b.views + b.comments.length * 5) - (a.views + a.comments.length * 5))
      .slice(0, 5);
  }, [posts]);

  // Engagement rate
  const engagementRate = useMemo(() => {
    if (stats.views === 0) return 0;
    return ((stats.likes + stats.comments) / stats.views) * 100;
  }, [stats]);

  // Activity score (custom metric)
  const activityScore = useMemo(() => {
    return Math.min(
      Math.round((stats.views * 0.1) + (stats.likes * 2) + (stats.comments * 3) + (stats.published * 10)),
      100
    );
  }, [stats]);

  const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-6 p-6">
      {/* Date Range Selector */}
      <div className="flex justify-end gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit ml-auto">
        {dateRangeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setDateRange(option.value)}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
              dateRange === option.value
                ? "bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Views */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative overflow-hidden border-slate-200/60 dark:border-slate-700/60">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between text-slate-600 dark:text-slate-400">
                Total Views
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                  <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardTitle>
              <CardDescription>All-time post views</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {stats.views.toLocaleString()}
                  </p>
                  <TrendIndicator value={weekComparison.views.change} suffix="% vs last week" />
                </div>
                <Sparkline
                  data={dailyData.slice(-7).map(d => d.views)}
                  width={80}
                  height={40}
                  color="#3b82f6"
                  showDots
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Engagement Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="relative overflow-hidden border-slate-200/60 dark:border-slate-700/60">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-500/10 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between text-slate-600 dark:text-slate-400">
                Engagement Rate
                <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/40">
                  <Heart className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                </div>
              </CardTitle>
              <CardDescription>Likes + Comments / Views</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {engagementRate.toFixed(1)}%
                  </p>
                  <TrendIndicator value={weekComparison.engagement.change} suffix="% vs last week" />
                </div>
                <ProgressRing
                  progress={Math.min(engagementRate * 10, 100)}
                  size={56}
                  strokeWidth={5}
                  color="#f43f5e"
                >
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    {Math.round(engagementRate * 10)}%
                  </span>
                </ProgressRing>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="relative overflow-hidden border-slate-200/60 dark:border-slate-700/60">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between text-slate-600 dark:text-slate-400">
                Activity Score
                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/40">
                  <Zap className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
              </CardTitle>
              <CardDescription>Overall content performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{activityScore}</p>
                  <span className="text-xs text-slate-500">out of 100</span>
                </div>
                <ProgressRing
                  progress={activityScore}
                  size={56}
                  strokeWidth={5}
                  color="#8b5cf6"
                >
                  <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                    {activityScore}
                  </span>
                </ProgressRing>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Views Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-slate-200/60 dark:border-slate-700/60">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-violet-600" />
              Views Over Time
            </CardTitle>
            <CardDescription>Daily view counts for the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    className="text-slate-500"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    className="text-slate-500"
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fill="url(#viewsGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="h-full border-slate-200/60 dark:border-slate-700/60">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-rose-500" />
                Category Performance
              </CardTitle>
              <CardDescription>Views by content category</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <div className="space-y-4">
                  {categoryData.map((category, index) => {
                    const maxViews = categoryData[0]?.views || 1;
                    const percentage = (category.views / maxViews) * 100;

                    return (
                      <div key={category.name} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {category.name}
                          </span>
                          <div className="flex items-center gap-3 text-slate-500">
                            <span>{category.posts} posts</span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {category.views.toLocaleString()} views
                            </span>
                          </div>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-slate-500">
                  No category data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Performing Posts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="h-full border-slate-200/60 dark:border-slate-700/60">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Top Performing Posts
              </CardTitle>
              <CardDescription>Your most engaging content</CardDescription>
            </CardHeader>
            <CardContent>
              {topPosts.length > 0 ? (
                <div className="space-y-3">
                  {topPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Rank */}
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                        index === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" :
                        index === 1 ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300" :
                        index === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400" :
                        "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      )}>
                        {index + 1}
                      </div>

                      {/* Thumbnail */}
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-700">
                        {post.imageUrl ? (
                          <Image
                            src={post.imageUrl}
                            alt={post.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-slate-400" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {post.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {post.views}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {post.likes?.length || 0}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {post.comments.length}
                          </span>
                        </div>
                      </div>

                      {/* Link */}
                      <Link href={`/teacher/posts/${post.id}`}>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 rounded-full">
                          <ArrowUpRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                  <BookOpen className="w-8 h-8 mb-2 opacity-50" />
                  <p>No published posts yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Content Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="border-slate-200/60 dark:border-slate-700/60">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              Content Recommendations
            </CardTitle>
            <CardDescription>Personalized suggestions to improve your content performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {posts.length < 5 && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-800/50">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-blue-900 dark:text-blue-200">Create more content</h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Publishing regularly increases visibility and audience engagement.
                    </p>
                  </div>
                </div>
              )}

              {posts.some(post => !post.imageUrl) && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50">
                  <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-800/50">
                    <Target className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-rose-900 dark:text-rose-200">Add featured images</h4>
                    <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                      Posts with images receive 94% more views on average.
                    </p>
                  </div>
                </div>
              )}

              {stats.views > 0 && stats.comments === 0 && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-800/50">
                    <MessageCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-amber-900 dark:text-amber-200">Encourage discussion</h4>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      End posts with questions to spark conversation and boost engagement.
                    </p>
                  </div>
                </div>
              )}

              {engagementRate < 1 && stats.views > 100 && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/50">
                  <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-800/50">
                    <TrendingUp className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-violet-900 dark:text-violet-200">Boost engagement</h4>
                    <p className="text-xs text-violet-700 dark:text-violet-300 mt-1">
                      Add CTAs and interactive elements to convert readers into engaged followers.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
