"use client";

import { Post } from "@/lib/types/post";
import { format, subDays, startOfDay } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface AnalyticsChartsProps {
  posts: Post[];
}

export const AnalyticsCharts = ({ posts }: AnalyticsChartsProps) => {
  // Calculate posting frequency over last 30 days
  const getLast30DaysActivity = () => {
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return {
        date: startOfDay(date),
        label: format(date, "MMM dd"),
        count: 0,
      };
    });

    posts.forEach((post) => {
      const postDate = startOfDay(new Date(post.createdAt));
      const dayIndex = days.findIndex(
        (day) => day.date.getTime() === postDate.getTime()
      );
      if (dayIndex !== -1) {
        days[dayIndex].count++;
      }
    });

    return days;
  };

  // Calculate growth metrics
  const getGrowthMetrics = () => {
    const now = new Date();
    const last7Days = subDays(now, 7);
    const last14Days = subDays(now, 14);

    const postsLast7Days = posts.filter(
      (p) => new Date(p.createdAt) >= last7Days
    ).length;
    const postsLast14Days = posts.filter(
      (p) => new Date(p.createdAt) >= last14Days && new Date(p.createdAt) < last7Days
    ).length;

    const viewsLast7Days = posts
      .filter((p) => new Date(p.createdAt) >= last7Days)
      .reduce((sum, p) => sum + p.views, 0);
    const viewsLast14Days = posts
      .filter((p) => new Date(p.createdAt) >= last14Days && new Date(p.createdAt) < last7Days)
      .reduce((sum, p) => sum + p.views, 0);

    const postsGrowth = postsLast14Days > 0
      ? ((postsLast7Days - postsLast14Days) / postsLast14Days) * 100
      : postsLast7Days > 0 ? 100 : 0;

    const viewsGrowth = viewsLast14Days > 0
      ? ((viewsLast7Days - viewsLast14Days) / viewsLast14Days) * 100
      : viewsLast7Days > 0 ? 100 : 0;

    return { postsGrowth, viewsGrowth, postsLast7Days, viewsLast7Days };
  };

  // Category performance
  const getCategoryPerformance = () => {
    const categoryStats = new Map<string, { count: number; views: number; category: string }>();

    posts.forEach((post) => {
      const category = post.category || "Uncategorized";
      const existing = categoryStats.get(category) || { count: 0, views: 0, category };
      categoryStats.set(category, {
        category,
        count: existing.count + 1,
        views: existing.views + post.views,
      });
    });

    return Array.from(categoryStats.values())
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);
  };

  // Average engagement metrics
  const getAverageMetrics = () => {
    if (posts.length === 0) {
      return { avgViews: 0, avgComments: 0, avgLikes: 0 };
    }

    const totalViews = posts.reduce((sum, p) => sum + p.views, 0);
    const totalComments = posts.reduce((sum, p) => sum + (p._count?.comments || 0), 0);
    const totalLikes = posts.reduce((sum, p) => sum + (p._count?.likes || 0), 0);

    return {
      avgViews: Math.round(totalViews / posts.length),
      avgComments: (totalComments / posts.length).toFixed(1),
      avgLikes: (totalLikes / posts.length).toFixed(1),
    };
  };

  const activityData = getLast30DaysActivity();
  const growthMetrics = getGrowthMetrics();
  const categoryPerformance = getCategoryPerformance();
  const averageMetrics = getAverageMetrics();
  const maxActivity = Math.max(...activityData.map((d) => d.count), 1);

  const TrendIcon = ({ value }: { value: number }) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Growth Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Growth Trends (Last 7 Days)</CardTitle>
          <CardDescription>Compared to previous 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Posts Published</span>
                <TrendIcon value={growthMetrics.postsGrowth} />
              </div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {growthMetrics.postsLast7Days}
              </div>
              <div className={`text-xs mt-1 ${
                growthMetrics.postsGrowth > 0
                  ? "text-green-600 dark:text-green-400"
                  : growthMetrics.postsGrowth < 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}>
                {growthMetrics.postsGrowth > 0 ? "+" : ""}
                {growthMetrics.postsGrowth.toFixed(1)}% vs last week
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-900 dark:text-purple-100">Total Views</span>
                <TrendIcon value={growthMetrics.viewsGrowth} />
              </div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {growthMetrics.viewsLast7Days}
              </div>
              <div className={`text-xs mt-1 ${
                growthMetrics.viewsGrowth > 0
                  ? "text-green-600 dark:text-green-400"
                  : growthMetrics.viewsGrowth < 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}>
                {growthMetrics.viewsGrowth > 0 ? "+" : ""}
                {growthMetrics.viewsGrowth.toFixed(1)}% vs last week
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Publishing Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Publishing Activity (Last 30 Days)</CardTitle>
          <CardDescription>Posts published per day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-end justify-between gap-1">
            {activityData.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-purple-600 to-purple-400 dark:from-purple-500 dark:to-purple-300 rounded-t-sm transition-all hover:opacity-80 relative group"
                  style={{
                    height: `${(day.count / maxActivity) * 100}%`,
                    minHeight: day.count > 0 ? "4px" : "0px",
                  }}
                  title={`${day.label}: ${day.count} post(s)`}
                >
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {day.label}: {day.count}
                  </div>
                </div>
                {index % 5 === 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 rotate-0 whitespace-nowrap">
                    {format(day.date, "MMM dd")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Category Performance</CardTitle>
          <CardDescription>Top performing categories by views</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categoryPerformance.length > 0 ? (
              categoryPerformance.map((category, index) => (
                <div key={category.category} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {category.category}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {category.views} views
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
                          style={{
                            width: `${(category.views / categoryPerformance[0].views) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {category.count} {category.count === 1 ? "post" : "posts"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No category data available yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Average Engagement */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Average Engagement Per Post</CardTitle>
          <CardDescription>Mean performance across all posts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {averageMetrics.avgViews}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Avg Views</div>
            </div>
            <div className="text-center p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
              <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                {averageMetrics.avgLikes}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Avg Likes</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {averageMetrics.avgComments}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Avg Comments</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
