"use client";

import { useCourseAnalytics } from "@/hooks/use-course-analytics";
import { CourseWithRelations } from "@/types/course";
import { MetricCard } from "./metric-card";
import { RevenueChart } from "./revenue-chart";
import { CategoryBreakdownChart } from "./category-breakdown-chart";
import { DollarSign, Users, TrendingUp, Star, BookOpen, Target } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface AnalyticsSectionProps {
  courses: CourseWithRelations[];
}

export const AnalyticsSection = ({ courses }: AnalyticsSectionProps) => {
  const {
    isLoading,
    analytics,
    recentActivity,
    insights,
    performanceIndicators,
    aggregateMetrics,
    refreshAnalytics,
  } = useCourseAnalytics(courses);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAnalytics();
    setIsRefreshing(false);
  };

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Analytics Dashboard
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Comprehensive insights and performance metrics
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          className="gap-2 flex-shrink-0 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Enhanced Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={`$${analytics.revenue.total.toLocaleString()}`}
          change={analytics.revenue.growth}
          trend={analytics.revenue.trend}
          icon={DollarSign}
          iconColor="text-white"
          iconBgColor="from-emerald-500 to-emerald-600"
          isLoading={isLoading}
          delay={0}
        />

        <MetricCard
          title="Active Students"
          value={analytics.engagement.activeStudents.toLocaleString()}
          change={analytics.growth.growthRate}
          trend={analytics.growth.growthRate > 0 ? 'up' : 'stable'}
          icon={Users}
          iconColor="text-white"
          iconBgColor="from-blue-500 to-blue-600"
          isLoading={isLoading}
          delay={0.1}
        />

        <MetricCard
          title="Avg Completion"
          value={`${analytics.engagement.avgCompletionRate.toFixed(1)}%`}
          change={5.2}
          trend="up"
          icon={Target}
          iconColor="text-white"
          iconBgColor="from-purple-500 to-purple-600"
          isLoading={isLoading}
          delay={0.2}
        />

        <MetricCard
          title="Student Rating"
          value={`${analytics.performance.avgRating.toFixed(1)}/5.0`}
          subtitle={`${analytics.performance.totalReviews} reviews`}
          icon={Star}
          iconColor="text-white"
          iconBgColor="from-yellow-500 to-amber-500"
          isLoading={isLoading}
          delay={0.3}
        />
      </div>

      {/* Performance Indicators */}
      {performanceIndicators && performanceIndicators.length > 0 && (
        <Card className="border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg rounded-3xl hover:shadow-xl transition-all duration-300">
          <CardHeader className="p-5 md:p-6">
            <CardTitle className="text-slate-900 dark:text-white text-lg font-semibold">Performance Indicators</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300 text-sm">
              Track your progress towards key goals
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 md:p-6 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {performanceIndicators.map((indicator, index) => (
                <motion.div
                  key={indicator.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-3 sm:p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 truncate pr-2">
                      {indicator.label}
                    </p>
                    <Badge
                      variant={
                        indicator.status === 'excellent' ? 'default' :
                        indicator.status === 'good' ? 'secondary' :
                        'destructive'
                      }
                      className="text-xs flex-shrink-0"
                    >
                      {indicator.status}
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                      {indicator.unit === '$' && indicator.unit}
                      {indicator.value.toLocaleString()}
                      {indicator.unit !== '$' && indicator.unit}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                      / {indicator.target.toLocaleString()}{indicator.unit !== '$' && indicator.unit}
                    </p>
                  </div>
                  <div className="mt-2 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((indicator.value / indicator.target) * 100, 100)}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className={cn(
                        "h-full rounded-full",
                        indicator.status === 'excellent' ? 'bg-green-500' :
                        indicator.status === 'good' ? 'bg-blue-500' :
                        'bg-amber-500'
                      )}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <RevenueChart
          data={analytics.revenue.chart}
          isLoading={isLoading}
          height={250}
        />

        {/* Category Breakdown */}
        <CategoryBreakdownChart
          data={analytics.revenue.breakdown}
          isLoading={isLoading}
          height={250}
        />
      </div>

      {/* Insights & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insights Panel */}
        {insights && insights.length > 0 && (
          <Card className="border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg rounded-3xl hover:shadow-xl transition-all duration-300">
            <CardHeader className="p-5 md:p-6">
              <CardTitle className="text-slate-900 dark:text-white text-lg font-semibold">Insights</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300 text-sm">
                AI-powered recommendations for growth
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 md:p-6 pt-0">
              <div className="space-y-3">
                {insights.slice(0, 5).map((insight, index) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={cn(
                      "p-2.5 sm:p-3 rounded-lg border",
                      insight.type === 'success' && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
                      insight.type === 'warning' && "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
                      insight.type === 'info' && "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
                      insight.type === 'critical' && "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                    )}
                  >
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white">
                          {insight.title}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {insight.description}
                        </p>
                      </div>
                      {insight.actionLabel && insight.actionUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs flex-shrink-0 self-end sm:self-auto"
                          onClick={() => window.location.href = insight.actionUrl!}
                        >
                          {insight.actionLabel}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        {recentActivity && recentActivity.length > 0 && (
          <Card className="border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg rounded-3xl hover:shadow-xl transition-all duration-300">
            <CardHeader className="p-5 md:p-6">
              <CardTitle className="text-slate-900 dark:text-white text-lg font-semibold">Recent Activity</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300 text-sm">
                Latest updates from your courses
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 md:p-6 pt-0">
              <div className="space-y-3">
                {recentActivity.slice(0, 5).map((activity, index) => {
                  const getActivityIcon = () => {
                    switch (activity.type) {
                      case 'enrollment': return Users;
                      case 'review': return Star;
                      case 'completion': return Target;
                      case 'payment': return DollarSign;
                      default: return BookOpen;
                    }
                  };

                  const ActivityIcon = getActivityIcon();

                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="p-1.5 sm:p-2 rounded-lg bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                        <ActivityIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {activity.message}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {new Date(activity.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
