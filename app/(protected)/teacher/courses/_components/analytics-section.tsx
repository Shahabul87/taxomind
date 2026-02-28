"use client";

import { useCourseAnalytics } from "@/hooks/use-course-analytics";
import { SerializedCourseWithRelations } from "@/types/course";
import { MetricCard, MetricCardSkeleton } from "./metric-card";
import dynamic from 'next/dynamic';
const RevenueChart = dynamic(
  () => import('./revenue-chart').then(mod => ({ default: mod.RevenueChart })),
  { ssr: false, loading: () => <div className="animate-pulse h-64 bg-muted rounded-lg" /> }
);
const CategoryBreakdownChart = dynamic(
  () => import('./category-breakdown-chart').then(mod => ({ default: mod.CategoryBreakdownChart })),
  { ssr: false, loading: () => <div className="animate-pulse h-64 bg-muted rounded-lg" /> }
);
import {
  DollarSign,
  Users,
  Star,
  BookOpen,
  Target,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Activity,
  Lightbulb,
  ArrowUpRight,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export interface AnalyticsSectionProps {
  courses: SerializedCourseWithRelations[];
}

export const AnalyticsSection = ({ courses }: AnalyticsSectionProps) => {
  const {
    isLoading,
    analytics,
    recentActivity,
    insights,
    performanceIndicators,
    refreshAnalytics,
  } = useCourseAnalytics(courses);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAnalytics();
    setIsRefreshing(false);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-5 lg:space-y-6">
        <AnalyticsHeader isRefreshing={false} onRefresh={() => {}} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Show empty state if no analytics
  if (!analytics) {
    return (
      <div className="space-y-5 lg:space-y-6">
        <AnalyticsHeader isRefreshing={isRefreshing} onRefresh={handleRefresh} />
        <EmptyAnalyticsState hasNoCourses={courses.length === 0} />
      </div>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* Section Header */}
      <AnalyticsHeader isRefreshing={isRefreshing} onRefresh={handleRefresh} />

      {/* Enhanced Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Total Revenue"
          value={`$${analytics.revenue.total.toLocaleString()}`}
          change={analytics.revenue.growth}
          trend={analytics.revenue.trend}
          icon={DollarSign}
          variant="success"
          index={0}
        />

        <MetricCard
          title="Active Students"
          value={analytics.engagement.activeStudents.toLocaleString()}
          change={analytics.growth.growthRate}
          trend={analytics.growth.growthRate > 0 ? "up" : "stable"}
          icon={Users}
          variant="teal"
          index={1}
        />

        <MetricCard
          title="Avg Completion"
          value={`${analytics.engagement.avgCompletionRate.toFixed(1)}%`}
          change={5.2}
          trend="up"
          icon={Target}
          variant="primary"
          index={2}
        />

        <MetricCard
          title="Student Rating"
          value={`${analytics.performance.avgRating.toFixed(1)}/5.0`}
          subtitle={`${analytics.performance.totalReviews} reviews`}
          icon={Star}
          variant="coral"
          index={3}
        />
      </div>

      {/* Performance Indicators */}
      {performanceIndicators && performanceIndicators.length > 0 && (
        <div className="teacher-card-premium overflow-hidden">
          <div className="flex items-center gap-3 p-5 lg:p-6 border-b border-[hsl(var(--teacher-border-subtle))]">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[hsl(var(--teacher-teal))] to-[hsl(195,75%,45%)]">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[hsl(var(--teacher-text))]">
                Performance Indicators
              </h3>
              <p className="text-xs text-[hsl(var(--teacher-text-muted))]">
                Track your progress towards key goals
              </p>
            </div>
          </div>
          <div className="p-4 sm:p-5 lg:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {performanceIndicators.map((indicator, index) => (
                <motion.div
                  key={indicator.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-4 rounded-xl bg-[hsl(var(--teacher-surface-hover))] border border-[hsl(var(--teacher-border-subtle))]"
                >
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <p className="text-xs sm:text-sm font-medium text-[hsl(var(--teacher-text))] truncate flex-1">
                      {indicator.label}
                    </p>
                    <Badge
                      className={cn(
                        "text-[10px] sm:text-xs flex-shrink-0 px-2",
                        indicator.status === "excellent" &&
                          "teacher-badge-success",
                        indicator.status === "good" && "teacher-badge-primary",
                        indicator.status !== "excellent" &&
                          indicator.status !== "good" &&
                          "teacher-badge-warning"
                      )}
                    >
                      {indicator.status}
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <p className="text-xl sm:text-2xl font-bold text-[hsl(var(--teacher-text))]">
                      {indicator.unit === "$" && indicator.unit}
                      {indicator.value.toLocaleString()}
                      {indicator.unit !== "$" && indicator.unit}
                    </p>
                    <p className="text-xs text-[hsl(var(--teacher-text-muted))]">
                      / {indicator.target.toLocaleString()}
                      {indicator.unit !== "$" && indicator.unit}
                    </p>
                  </div>
                  <div className="mt-3 teacher-progress">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min((indicator.value / indicator.target) * 100, 100)}%`,
                      }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className={cn(
                        "teacher-progress-bar",
                        indicator.status === "excellent" &&
                          "teacher-progress-success",
                        indicator.status === "good" && "teacher-progress-teal",
                        indicator.status !== "excellent" &&
                          indicator.status !== "good" &&
                          "teacher-progress-primary"
                      )}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
        <div className="teacher-card-premium overflow-hidden">
          <RevenueChart
            data={analytics.revenue.chart}
            isLoading={isLoading}
            height={250}
          />
        </div>
        <div className="teacher-card-premium overflow-hidden">
          <CategoryBreakdownChart
            data={analytics.revenue.breakdown}
            isLoading={isLoading}
            height={250}
          />
        </div>
      </div>

      {/* Insights & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
        {/* Insights Panel */}
        {insights && insights.length > 0 && (
          <div className="teacher-card-premium overflow-hidden">
            <div className="flex items-center gap-3 p-5 lg:p-6 border-b border-[hsl(var(--teacher-border-subtle))]">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[hsl(var(--teacher-coral))] to-[hsl(35,85%,55%)]">
                <Lightbulb className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[hsl(var(--teacher-text))]">
                  AI Insights
                </h3>
                <p className="text-xs text-[hsl(var(--teacher-text-muted))]">
                  Smart recommendations for growth
                </p>
              </div>
            </div>
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="space-y-3">
                {insights.slice(0, 5).map((insight, index) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={cn(
                      "p-4 rounded-xl border",
                      insight.type === "success" &&
                        "bg-[hsl(var(--teacher-success-muted))] border-[hsl(var(--teacher-success))]/20",
                      insight.type === "warning" &&
                        "bg-[hsl(var(--teacher-coral-muted))] border-[hsl(var(--teacher-coral))]/20",
                      insight.type === "info" &&
                        "bg-[hsl(var(--teacher-teal-muted))] border-[hsl(var(--teacher-teal))]/20",
                      insight.type === "critical" &&
                        "bg-[hsl(var(--teacher-coral-muted))] border-[hsl(var(--teacher-coral))]/30"
                    )}
                  >
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[hsl(var(--teacher-text))]">
                          {insight.title}
                        </p>
                        <p className="text-xs text-[hsl(var(--teacher-text-muted))] mt-1 leading-relaxed">
                          {insight.description}
                        </p>
                      </div>
                      {insight.actionLabel && insight.actionUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs flex-shrink-0 h-8 px-3 text-[hsl(var(--teacher-primary))] hover:bg-[hsl(var(--teacher-primary-muted))]"
                          onClick={() =>
                            (window.location.href = insight.actionUrl!)
                          }
                        >
                          {insight.actionLabel}
                          <ArrowUpRight className="w-3 h-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {recentActivity && recentActivity.length > 0 && (
          <div className="teacher-card-premium overflow-hidden">
            <div className="flex items-center gap-3 p-5 lg:p-6 border-b border-[hsl(var(--teacher-border-subtle))]">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[hsl(var(--teacher-primary))] to-[hsl(280,70%,55%)]">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[hsl(var(--teacher-text))]">
                  Recent Activity
                </h3>
                <p className="text-xs text-[hsl(var(--teacher-text-muted))]">
                  Latest updates from your courses
                </p>
              </div>
            </div>
            <div className="p-4 sm:p-5 lg:p-6">
              <div className="space-y-2">
                {recentActivity.slice(0, 5).map((activity, index) => {
                  const getActivityIcon = () => {
                    switch (activity.type) {
                      case "enrollment":
                        return Users;
                      case "review":
                        return Star;
                      case "completion":
                        return Target;
                      case "payment":
                        return DollarSign;
                      default:
                        return BookOpen;
                    }
                  };

                  const ActivityIcon = getActivityIcon();

                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-[hsl(var(--teacher-surface-hover))] transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-[hsl(var(--teacher-surface-hover))] border border-[hsl(var(--teacher-border-subtle))] flex-shrink-0">
                        <ActivityIcon className="w-4 h-4 text-[hsl(var(--teacher-text-muted))]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[hsl(var(--teacher-text))] truncate">
                          {activity.message}
                        </p>
                        <p className="text-xs text-[hsl(var(--teacher-text-subtle))] mt-0.5">
                          {new Date(activity.timestamp).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Header component
const AnalyticsHeader = ({
  isRefreshing,
  onRefresh,
}: {
  isRefreshing: boolean;
  onRefresh: () => void;
}) => (
  <div className="teacher-card-premium p-5 lg:p-6">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-[hsl(var(--teacher-teal))] to-[hsl(195,75%,45%)] shadow-lg shadow-[hsl(var(--teacher-teal))]/20">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[hsl(var(--teacher-text))]">
            Analytics Dashboard
          </h2>
          <p className="text-sm text-[hsl(var(--teacher-text-muted))]">
            Comprehensive insights and performance metrics
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="gap-2 border-[hsl(var(--teacher-border))] hover:border-[hsl(var(--teacher-primary))] hover:text-[hsl(var(--teacher-primary))] hover:bg-[hsl(var(--teacher-primary-muted))] h-10 text-sm"
      >
        <RefreshCw
          className={cn("w-4 h-4", isRefreshing && "animate-spin")}
        />
        Refresh
      </Button>
    </div>
  </div>
);

// Empty state component
const EmptyAnalyticsState = ({
  hasNoCourses,
}: {
  hasNoCourses: boolean;
}) => (
  <div className="teacher-card-premium p-10 sm:p-14 text-center">
    {/* Decorative gradient orbs */}
    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-[hsl(var(--teacher-primary))] to-[hsl(var(--teacher-coral))] opacity-5 blur-3xl pointer-events-none" />

    <div className="relative z-10">
      <div className="inline-flex p-4 rounded-2xl bg-[hsl(var(--teacher-surface-hover))] border border-[hsl(var(--teacher-border-subtle))] mb-6">
        <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-[hsl(var(--teacher-text-muted))]" />
      </div>

      <h3 className="text-xl font-semibold text-[hsl(var(--teacher-text))] mb-2">
        No Analytics Available
      </h3>
      <p className="text-sm text-[hsl(var(--teacher-text-muted))] mb-6 max-w-md mx-auto">
        {hasNoCourses
          ? "Create your first course to unlock powerful analytics and insights"
          : "Analytics data is being processed. Please try refreshing."}
      </p>
      {hasNoCourses && (
        <Link href="/teacher/create">
          <Button className="gap-2 h-12 px-6 bg-gradient-to-r from-[hsl(var(--teacher-primary))] to-[hsl(280,70%,55%)] text-white hover:shadow-lg hover:shadow-[hsl(var(--teacher-primary))]/25 transition-all">
            <Sparkles className="w-4 h-4" />
            Create Your First Course
          </Button>
        </Link>
      )}
    </div>
  </div>
);
