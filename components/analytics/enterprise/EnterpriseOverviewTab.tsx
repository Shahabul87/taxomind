"use client";

import { motion } from "framer-motion";
import { Clock, Activity, Target, Zap, BookOpen, Award, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard, ActivityStat } from "./MetricCard";
import { ProgressSparkline } from "./Sparkline";
import { EmptyState, metricEmptyStates } from "./EmptyState";
import { cn } from "@/lib/utils";
import { AnalyticsData, PerformanceData, PulseData } from "@/lib/stable-analytics-data";

interface EnterpriseOverviewTabProps {
  analytics: AnalyticsData | null;
  performance: PerformanceData | null;
  pulse: PulseData | null;
}

/**
 * Enterprise Overview Tab
 *
 * A clean, professional analytics overview with:
 * - Consistent 5-color palette
 * - Proper empty states
 * - Sparkline trends
 * - Progress indicators
 * - Clear typography hierarchy
 */
export function EnterpriseOverviewTab({
  analytics,
  performance,
  pulse,
}: EnterpriseOverviewTabProps) {
  const hasData = analytics && analytics.summary.totalLearningTime > 0;

  // Generate mock trend data based on current values
  // In production, this would come from historical API data
  const generateTrend = (currentValue: number, variance: number = 0.3): number[] => {
    if (currentValue === 0) return [];
    return Array.from({ length: 7 }, (_, i) => {
      const base = currentValue * (0.7 + Math.random() * 0.3);
      const trend = (i / 6) * currentValue * 0.2;
      return Math.max(0, base + trend + (Math.random() - 0.5) * currentValue * variance);
    });
  };

  if (!analytics) {
    return (
      <EmptyState
        icon={metricEmptyStates.insights.icon}
        title="Loading your analytics"
        description="We&apos;re preparing your personalized learning insights..."
        size="lg"
        className="min-h-[400px]"
      />
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Key Metrics Grid */}
      <section aria-labelledby="key-metrics-heading">
        <h2 id="key-metrics-heading" className="sr-only">
          Key Learning Metrics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <MetricCard
            label="Total Time"
            value={Math.round(analytics.summary.totalLearningTime / 60)}
            unit="h"
            subtitle={`${analytics.summary.totalLearningTime % 60}m this period`}
            icon={<Clock className="w-full h-full" />}
            variant="primary"
            trend={generateTrend(analytics.summary.totalLearningTime)}
            showTrend
          />

          <MetricCard
            label="Engagement"
            value={analytics.summary.averageEngagementScore}
            unit="%"
            subtitle="Average score"
            icon={<Activity className="w-full h-full" />}
            variant="success"
            progress={analytics.summary.averageEngagementScore}
          />

          <MetricCard
            label="Progress"
            value={analytics.summary.overallProgress}
            unit="%"
            subtitle="Overall completion"
            icon={<Target className="w-full h-full" />}
            variant="primary"
            progress={analytics.summary.overallProgress}
          />

          <MetricCard
            label="Streak"
            value={analytics.summary.currentStreak}
            unit=" days"
            subtitle="Keep it up!"
            icon={<Zap className="w-full h-full" />}
            variant="warning"
            trend={generateTrend(analytics.summary.currentStreak, 0.1)}
          />

          <MetricCard
            label="Courses"
            value={analytics.summary.activeCourses}
            subtitle="Active learning"
            icon={<BookOpen className="w-full h-full" />}
            variant="accent"
          />

          <MetricCard
            label="Achievements"
            value={analytics.summary.totalAchievements}
            subtitle="Unlocked"
            icon={<Award className="w-full h-full" />}
            variant="success"
          />
        </div>
      </section>

      {/* Today&apos;s Activity Section */}
      {pulse && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          aria-labelledby="today-activity-heading"
        >
          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-800 dark:text-slate-100">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                Today&apos;s Learning Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <ActivityStat
                  label="Study Time"
                  value={
                    pulse.todayStats.totalStudyTime > 0
                      ? `${Math.round(pulse.todayStats.totalStudyTime / 60)}h`
                      : 0
                  }
                  icon={<Clock className="w-full h-full" />}
                  variant="primary"
                />

                <ActivityStat
                  label="Sessions"
                  value={pulse.todayStats.sessionCount}
                  icon={<TrendingUp className="w-full h-full" />}
                  variant="success"
                />

                <ActivityStat
                  label="Engagement"
                  value={
                    pulse.todayStats.averageEngagement > 0
                      ? `${pulse.todayStats.averageEngagement}%`
                      : 0
                  }
                  icon={<Activity className="w-full h-full" />}
                  variant="accent"
                />

                <ActivityStat
                  label="Day Streak"
                  value={pulse.weeklyMomentum.streak}
                  icon={<Zap className="w-full h-full" />}
                  variant="warning"
                />
              </div>
            </CardContent>
          </Card>
        </motion.section>
      )}

      {/* Performance Insights */}
      {performance && performance.insights.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          aria-labelledby="insights-heading"
        >
          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-800 dark:text-slate-100">
                <div className="p-2 bg-violet-50 dark:bg-violet-900/30 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {performance.insights.slice(0, 3).map((insight, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-4 rounded-lg border-l-4",
                      insight.type === "success" &&
                        "bg-emerald-50 dark:bg-emerald-900/20 border-l-emerald-500",
                      insight.type === "warning" &&
                        "bg-amber-50 dark:bg-amber-900/20 border-l-amber-500",
                      insight.type === "info" &&
                        "bg-blue-50 dark:bg-blue-900/20 border-l-blue-500"
                    )}
                  >
                    <h4
                      className={cn(
                        "font-medium mb-1",
                        insight.type === "success" && "text-emerald-800 dark:text-emerald-200",
                        insight.type === "warning" && "text-amber-800 dark:text-amber-200",
                        insight.type === "info" && "text-blue-800 dark:text-blue-200"
                      )}
                    >
                      {insight.title}
                    </h4>
                    <p
                      className={cn(
                        "text-sm",
                        insight.type === "success" && "text-emerald-700 dark:text-emerald-300",
                        insight.type === "warning" && "text-amber-700 dark:text-amber-300",
                        insight.type === "info" && "text-blue-700 dark:text-blue-300"
                      )}
                    >
                      {insight.message}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>
      )}

      {/* Course Progress Overview */}
      {analytics.learningMetrics.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          aria-labelledby="course-progress-heading"
        >
          <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-800 dark:text-slate-100">
                <div className="p-2 bg-violet-50 dark:bg-violet-900/30 rounded-lg">
                  <BookOpen className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                Course Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.learningMetrics.slice(0, 4).map((metric) => (
                  <div
                    key={metric.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {metric.course?.title || "Unknown Course"}
                      </h4>
                      <div className="flex items-center gap-4 mt-2">
                        <ProgressSparkline
                          value={metric.overallProgress}
                          variant="primary"
                          size="sm"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {Math.round(metric.totalStudyTime / 60)}h
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>
      )}

      {/* Empty state when no learning data */}
      {!hasData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-dashed border-2 border-slate-300 dark:border-slate-600">
            <CardContent className="py-12">
              <EmptyState
                icon={metricEmptyStates.courses.icon}
                title="Start Your Learning Journey"
                description="Enroll in courses and complete lessons to see your progress, engagement metrics, and personalized insights here."
                action={{
                  label: "Browse Courses",
                  href: "/search",
                }}
                secondaryAction={{
                  label: "View Dashboard",
                  href: "/dashboard/user",
                }}
                size="lg"
              />
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
