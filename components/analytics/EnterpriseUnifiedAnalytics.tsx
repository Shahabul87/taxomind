"use client";

import { ExtendedUser } from "@/next-auth";
import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { RefreshCw, ChevronLeft, LayoutDashboard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStableAnalytics, useStablePerformanceMetrics, useStableRealtimePulse } from "@/hooks/use-stable-analytics";
import { cn } from "@/lib/utils";
import Link from "next/link";
import dynamic from "next/dynamic";

// Enterprise components (keep eager - used on initial load)
import { AnalyticsDashboardSkeleton } from "./enterprise/Skeleton";
import { EnterpriseOverviewTab } from "./enterprise/EnterpriseOverviewTab";
import { EmptyState } from "./enterprise/EmptyState";

// Tab Loading Skeleton
const TabLoadingSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/3" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-48 bg-slate-200 dark:bg-slate-700 rounded-xl" />
      ))}
    </div>
    <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl" />
  </div>
);

// Lazy-loaded tab components for better code splitting
const CognitiveAnalytics = dynamic(
  () => import("./CognitiveAnalytics").then(mod => ({ default: mod.CognitiveAnalytics })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

const PredictiveAnalytics = dynamic(
  () => import("@/app/dashboard/user/_components/smart-dashboard/PredictiveAnalytics").then(mod => ({ default: mod.PredictiveAnalytics })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

const RealtimePulse = dynamic(
  () => import("@/app/dashboard/user/_components/smart-dashboard/RealtimePulse").then(mod => ({ default: mod.RealtimePulse })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

const CoursesTab = dynamic(
  () => import("./tabs/CoursesTab").then(mod => ({ default: mod.CoursesTab })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

const PerformanceTab = dynamic(
  () => import("./tabs/PerformanceTab").then(mod => ({ default: mod.PerformanceTab })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

const JobMarketTab = dynamic(
  () => import("./tabs/JobMarketTab").then(mod => ({ default: mod.JobMarketTab })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

const IntelligentFeaturesTab = dynamic(
  () => import("./tabs/IntelligentFeaturesTab").then(mod => ({ default: mod.IntelligentFeaturesTab })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

const StudentFeaturesTab = dynamic(
  () => import("./tabs/StudentFeaturesTab").then(mod => ({ default: mod.StudentFeaturesTab })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

const TeacherFeaturesTab = dynamic(
  () => import("./tabs/TeacherFeaturesTab").then(mod => ({ default: mod.TeacherFeaturesTab })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

const PostAnalyticsTab = dynamic(
  () => import("./tabs/PostAnalyticsTab").then(mod => ({ default: mod.PostAnalyticsTab })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

// Phase 4 Analytics Components - Lazy loaded
const PersonalLearningProgress = dynamic(
  () => import("./personal-learning-progress").then(mod => ({ default: mod.PersonalLearningProgress })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

const AIInsightsPanel = dynamic(
  () => import("./ai-insights-panel").then(mod => ({ default: mod.AIInsightsPanel })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

// SAM AI Unified Analytics Dashboard - Full SAM engine integration
const SAMInsightsDashboard = dynamic(
  () => import("./SAMInsightsDashboard").then(mod => ({ default: mod.SAMInsightsDashboard })),
  { loading: () => <TabLoadingSkeleton />, ssr: false }
);

// Storage utilities
import { getStoredTab, getStoredPeriod, storeTab, storePeriod } from "./storage-utils";

/**
 * Props for the Enterprise Unified Analytics Dashboard
 */
interface EnterpriseUnifiedAnalyticsProps {
  user: ExtendedUser;
  variant?: "dashboard" | "fullpage";
  className?: string;
}

/**
 * Consolidated tab structure - 6 main tabs with SAM AI integration
 */
const CONSOLIDATED_TABS = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "sam-ai", label: "SAM AI", icon: "🧠" },
  { id: "learning", label: "Learning", icon: "📚" },
  { id: "insights", label: "Insights", icon: "💡" },
  { id: "activity", label: "Activity", icon: "⚡" },
  { id: "tools", label: "Tools", icon: "🛠️" },
] as const;

/**
 * Sub-tab mappings for consolidated navigation
 */
const SUB_TABS: Record<string, { id: string; label: string }[]> = {
  "sam-ai": [
    { id: "sam-dashboard", label: "Dashboard" },
    { id: "sam-practice", label: "Practice" },
    { id: "sam-style", label: "Learning Style" },
    { id: "sam-predictions", label: "Predictions" },
    { id: "sam-achievements", label: "Achievements" },
  ],
  learning: [
    { id: "my-progress", label: "My Progress" },
    { id: "courses", label: "Courses" },
    { id: "cognitive", label: "Cognitive" },
    { id: "performance", label: "Performance" },
  ],
  insights: [
    { id: "ai-insights", label: "AI Insights" },
    { id: "ai-features", label: "AI Features" },
    { id: "predictions", label: "Predictions" },
    { id: "job-market", label: "Job Market" },
  ],
  activity: [
    { id: "realtime", label: "Real-time" },
    { id: "posts", label: "Posts" },
  ],
  tools: [
    { id: "student", label: "Student" },
    { id: "teacher", label: "Teacher" },
  ],
};

/**
 * Enterprise Unified Analytics Dashboard
 *
 * A redesigned analytics dashboard with:
 * - Consolidated navigation (5 main tabs instead of 11)
 * - Enterprise-level design system
 * - Proper loading states with skeletons
 * - Improved empty states
 * - Better performance with memoization
 */
export function EnterpriseUnifiedAnalytics({
  user,
  variant = "dashboard",
  className,
}: EnterpriseUnifiedAnalyticsProps) {
  // State management
  const [selectedPeriod, setSelectedPeriod] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("DAILY");
  const [activeMainTab, setActiveMainTab] = useState("overview");
  const [activeSubTab, setActiveSubTab] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const storedPeriod = getStoredPeriod();
    const storedTab = getStoredTab();

    // Map old tab names to new structure
    const tabMapping: Record<string, { main: string; sub?: string }> = {
      overview: { main: "overview" },
      // SAM AI tab mappings
      "sam-ai": { main: "sam-ai", sub: "sam-dashboard" },
      "sam-dashboard": { main: "sam-ai", sub: "sam-dashboard" },
      "sam-practice": { main: "sam-ai", sub: "sam-practice" },
      "sam-style": { main: "sam-ai", sub: "sam-style" },
      "sam-predictions": { main: "sam-ai", sub: "sam-predictions" },
      "sam-achievements": { main: "sam-ai", sub: "sam-achievements" },
      // Learning tab mappings
      "my-progress": { main: "learning", sub: "my-progress" },
      performance: { main: "learning", sub: "performance" },
      cognitive: { main: "learning", sub: "cognitive" },
      courses: { main: "learning", sub: "courses" },
      posts: { main: "activity", sub: "posts" },
      "ai-insights": { main: "insights", sub: "ai-insights" },
      jobmarket: { main: "insights", sub: "job-market" },
      features: { main: "insights", sub: "ai-features" },
      "student-features": { main: "tools", sub: "student" },
      "teacher-features": { main: "tools", sub: "teacher" },
      insights: { main: "insights", sub: "ai-insights" },
      realtime: { main: "activity", sub: "realtime" },
    };

    const mapped = tabMapping[storedTab] || { main: "overview" };
    setActiveMainTab(mapped.main);
    setActiveSubTab(mapped.sub || null);
    setSelectedPeriod(storedPeriod);
    setIsInitialized(true);
  }, []);

  // Data fetching hooks
  const {
    data: analytics,
    loading: analyticsLoading,
    error: analyticsError,
    refreshAnalytics,
  } = useStableAnalytics(selectedPeriod);

  const {
    data: performance,
    loading: performanceLoading,
    error: performanceError,
    refreshPerformance,
  } = useStablePerformanceMetrics(selectedPeriod, 30);

  const {
    pulse,
    loading: pulseLoading,
    error: pulseError,
    refreshPulse,
  } = useStableRealtimePulse();

  // Handlers
  const handlePeriodChange = useCallback((period: "DAILY" | "WEEKLY" | "MONTHLY") => {
    setSelectedPeriod(period);
    storePeriod(period);
  }, []);

  const handleMainTabChange = useCallback((tab: string) => {
    setActiveMainTab(tab);
    // Set default sub-tab for tabs that have sub-navigation
    const subTabs = SUB_TABS[tab];
    if (subTabs && subTabs.length > 0) {
      setActiveSubTab(subTabs[0].id);
    } else {
      setActiveSubTab(null);
    }
    // Store for persistence - store the sub-tab if applicable
    const subTab = subTabs?.[0]?.id;
    storeTab(subTab || tab);
  }, []);

  const handleSubTabChange = useCallback((tab: string) => {
    setActiveSubTab(tab);
    storeTab(tab);
  }, []);

  const handleRefreshAll = useCallback(() => {
    refreshAnalytics();
    refreshPerformance();
    refreshPulse();
  }, [refreshAnalytics, refreshPerformance, refreshPulse]);

  // Computed loading state - only block on initial load
  const isInitialLoading = !isInitialized || (analyticsLoading && !analytics);

  // Memoized sub-tabs for current main tab
  const currentSubTabs = useMemo(() => SUB_TABS[activeMainTab] || [], [activeMainTab]);

  // Show skeleton during initial load
  if (isInitialLoading) {
    return (
      <div className={cn("min-h-screen bg-slate-50 dark:bg-slate-900", className)}>
        <div className="w-full px-3 sm:px-4 md:px-6 py-6">
          <AnalyticsDashboardSkeleton />
        </div>
      </div>
    );
  }

  // Error state
  if (analyticsError && performanceError && pulseError && !analytics) {
    return (
      <div className={cn("min-h-screen bg-slate-50 dark:bg-slate-900", className)}>
        <div className="w-full px-3 sm:px-4 md:px-6 py-6">
          <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
            <CardContent className="py-12">
              <EmptyState
                title="Unable to Load Analytics"
                description="We encountered an issue loading your analytics data. This is usually temporary."
                action={{
                  label: "Try Again",
                  onClick: handleRefreshAll,
                }}
                secondaryAction={{
                  label: "Go to Dashboard",
                  href: "/dashboard",
                }}
                size="lg"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen bg-slate-50 dark:bg-slate-900",
        className
      )}
    >
      <div className="w-full px-3 sm:px-4 md:px-6 py-6 space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              aria-label="Back to Dashboard"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Learning Analytics
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Track your progress and gain insights into your learning journey
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Period Selector */}
            <div
              className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-1"
              role="group"
              aria-label="Select time period"
            >
              {(["DAILY", "WEEKLY", "MONTHLY"] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => handlePeriodChange(period)}
                  aria-pressed={selectedPeriod === period}
                  aria-label={`Show ${period.toLowerCase()} analytics`}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                    selectedPeriod === period
                      ? "bg-blue-500 text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  {period.charAt(0) + period.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefreshAll}
              className="h-9 w-9"
              aria-label="Refresh analytics data"
            >
              <RefreshCw
                className={cn(
                  "w-4 h-4",
                  (analyticsLoading || performanceLoading || pulseLoading) && "animate-spin"
                )}
              />
            </Button>

            {/* Full Analytics Link (if in dashboard mode) */}
            {variant === "dashboard" && (
              <Button asChild variant="outline" size="sm" className="hidden sm:flex">
                <Link href="/analytics/user">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Full View
                </Link>
              </Button>
            )}
          </div>
        </header>

        {/* Main Navigation Tabs */}
        <Tabs value={activeMainTab} onValueChange={handleMainTabChange} className="w-full">
          <TabsList className="w-full justify-start bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded-xl h-auto flex-wrap">
            {CONSOLIDATED_TABS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium rounded-lg transition-all",
                  "data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm",
                  "data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400",
                  "data-[state=inactive]:hover:text-slate-900 dark:data-[state=inactive]:hover:text-white"
                )}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Sub-navigation for tabs with sub-sections */}
          {currentSubTabs.length > 0 && (
            <nav
              className="flex items-center gap-2 mt-4 overflow-x-auto pb-2"
              role="tablist"
              aria-label={`${activeMainTab} sub-sections`}
            >
              {currentSubTabs.map((subTab) => (
                <button
                  key={subTab.id}
                  onClick={() => handleSubTabChange(subTab.id)}
                  role="tab"
                  aria-selected={activeSubTab === subTab.id}
                  aria-controls={`${subTab.id}-panel`}
                  tabIndex={activeSubTab === subTab.id ? 0 : -1}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-full transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                    activeSubTab === subTab.id
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  )}
                >
                  {subTab.label}
                </button>
              ))}
            </nav>
          )}

          {/* Tab Contents */}
          <div className="mt-6">
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0">
              <EnterpriseOverviewTab
                analytics={analytics}
                performance={performance}
                pulse={pulse}
              />
            </TabsContent>

            {/* SAM AI Tab - Full SAM Engine Integration */}
            <TabsContent value="sam-ai" className="mt-0">
              {activeSubTab === "sam-dashboard" && <SAMInsightsDashboard />}
              {activeSubTab === "sam-practice" && <SAMInsightsDashboard />}
              {activeSubTab === "sam-style" && <SAMInsightsDashboard />}
              {activeSubTab === "sam-predictions" && <SAMInsightsDashboard />}
              {activeSubTab === "sam-achievements" && <SAMInsightsDashboard />}
              {!activeSubTab && <SAMInsightsDashboard />}
            </TabsContent>

            {/* Learning Tab */}
            <TabsContent value="learning" className="mt-0">
              {activeSubTab === "my-progress" && <PersonalLearningProgress />}
              {activeSubTab === "courses" && <CoursesTab analytics={analytics} />}
              {activeSubTab === "cognitive" && <CognitiveAnalytics user={user} className="" />}
              {activeSubTab === "performance" && (
                <PerformanceTab analytics={analytics} performance={performance} />
              )}
            </TabsContent>

            {/* Insights Tab */}
            <TabsContent value="insights" className="mt-0">
              {activeSubTab === "ai-insights" && <AIInsightsPanel view="all" />}
              {activeSubTab === "ai-features" && (
                <IntelligentFeaturesTab analytics={analytics} performance={performance} />
              )}
              {activeSubTab === "predictions" && <PredictiveAnalytics user={user} />}
              {activeSubTab === "job-market" && (
                <JobMarketTab user={user} analytics={analytics} />
              )}
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="mt-0">
              {activeSubTab === "realtime" && <RealtimePulse user={user} />}
              {activeSubTab === "posts" && <PostAnalyticsTab />}
            </TabsContent>

            {/* Tools Tab */}
            <TabsContent value="tools" className="mt-0">
              {activeSubTab === "student" && (
                <StudentFeaturesTab analytics={analytics} performance={performance} />
              )}
              {activeSubTab === "teacher" && (
                <TeacherFeaturesTab analytics={analytics} performance={performance} />
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
