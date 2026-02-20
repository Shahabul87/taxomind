"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import Link from "next/link";
import type { DateRange } from "react-day-picker";
import type { CreatorAnalytics, CreatorTimeframe } from "./creator-types";
import { CreatorDashboardSkeleton } from "./creator-dashboard-skeleton";
import { CreatorKpiCards } from "./creator-kpi-cards";
import { CreatorCoursesTab } from "./creator-courses-tab";
import { CreatorLearnersTab } from "./creator-learners-tab";
import { CreatorEngagementTab } from "./creator-engagement-tab";
import { CreatorFeedbackTab } from "./creator-feedback-tab";
import { CreatorSuggestionsTab } from "./creator-suggestions-tab";

interface CourseCreatorDashboardProps {
  creatorId: string;
}

export const CourseCreatorDashboard = ({ creatorId }: CourseCreatorDashboardProps) => {
  const [analytics, setAnalytics] = useState<CreatorAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState<CreatorTimeframe>("month");
  const [activeTab, setActiveTab] = useState("overview");
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [showCustomRange, setShowCustomRange] = useState(false);

  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    try {
      const response = await fetch("/api/creator-analytics/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeframe }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setAnalytics(data.analytics);
      setGeneratedAt(data.metadata?.generatedAt ?? null);
    } catch (error: unknown) {
      logger.error("Error fetching creator analytics:", error);
      toast.error("Failed to load creator analytics");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleTimeframeChange = (value: string) => {
    if (value === "custom") {
      setShowCustomRange(true);
      return;
    }
    setShowCustomRange(false);
    setTimeframe(value as CreatorTimeframe);
  };

  const handleExport = () => {
    if (!analytics) return;

    const rows: string[] = ["Metric,Value"];
    rows.push(`Total Learners,${analytics.overview.totalLearners}`);
    rows.push(`Average Rating,${analytics.overview.averageRating.toFixed(1)}`);
    rows.push(`Total Views,${analytics.overview.totalViews}`);
    rows.push(`Completions,${analytics.overview.totalCompletions}`);
    rows.push(`Total Courses,${analytics.overview.totalCourses}`);
    rows.push(`Growth,${analytics.overview.monthlyGrowth.toFixed(1)}%`);
    rows.push("");
    rows.push("Course,Learners,Completion Rate,Rating,Views");
    analytics.coursePerformance.forEach((c) => {
      rows.push(`"${c.courseTitle}",${c.learners},${c.completionRate.toFixed(1)}%,${c.averageRating.toFixed(1)},${c.views}`);
    });

    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `creator-analytics-${timeframe}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Analytics exported");
  };

  if (isLoading) {
    return <CreatorDashboardSkeleton />;
  }

  if (!analytics) {
    return (
      <div className="text-center py-8 sm:py-10 md:py-12 px-4">
        <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-3 sm:mb-4" />
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">No courses created yet</p>
        <p className="text-xs sm:text-sm text-slate-500 mt-2">Create your first course to see analytics</p>
        <Link href="/create-course">
          <Button className="mt-4 h-9 sm:h-10 text-sm sm:text-base">Create Your First Course</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
            Creator Dashboard
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
            See how your shared courses are helping others learn and grow
            {generatedAt && (
              <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 ml-2">
                Last updated {new Date(generatedAt).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <Select value={showCustomRange ? "custom" : timeframe} onValueChange={handleTimeframeChange}>
            <SelectTrigger className="w-full sm:w-32 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm h-9 sm:h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          {showCustomRange && (
            <DatePickerWithRange
              value={customRange}
              onChange={setCustomRange}
              className="w-auto"
            />
          )}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
            onClick={() => fetchAnalytics(true)}
            disabled={isRefreshing}
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
            onClick={handleExport}
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <CreatorKpiCards overview={analytics.overview} onCardClick={setActiveTab} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="grid w-full min-w-[600px] sm:min-w-0 grid-cols-5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-sm p-1">
            <TabsTrigger value="overview" className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              <span className="hidden xs:inline">My Courses</span>
              <span className="xs:hidden">Courses</span>
            </TabsTrigger>
            <TabsTrigger value="learners" className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              <span className="hidden sm:inline">Learner Insights</span>
              <span className="sm:hidden">Learners</span>
            </TabsTrigger>
            <TabsTrigger value="engagement" className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              Engagement
            </TabsTrigger>
            <TabsTrigger value="feedback" className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              <span className="hidden sm:inline">Community Feedback</span>
              <span className="sm:hidden">Feedback</span>
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
              <span className="hidden sm:inline">AI Suggestions</span>
              <span className="sm:hidden">AI</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-4 sm:mt-5 md:mt-6">
          <CreatorCoursesTab courses={analytics.coursePerformance} />
        </TabsContent>

        <TabsContent value="learners" className="mt-4 sm:mt-5 md:mt-6">
          <CreatorLearnersTab
            learnerInsights={analytics.learnerInsights}
            totalLearners={analytics.overview.totalLearners}
          />
        </TabsContent>

        <TabsContent value="engagement" className="mt-4 sm:mt-5 md:mt-6">
          <CreatorEngagementTab engagementMetrics={analytics.learnerInsights.engagementMetrics} />
        </TabsContent>

        <TabsContent value="feedback" className="mt-4 sm:mt-5 md:mt-6">
          <CreatorFeedbackTab feedback={analytics.communityFeedback} />
        </TabsContent>

        <TabsContent value="suggestions" className="mt-4 sm:mt-5 md:mt-6">
          <CreatorSuggestionsTab suggestions={analytics.suggestions} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
