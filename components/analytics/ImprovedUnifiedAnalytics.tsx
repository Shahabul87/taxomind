"use client";

import { ExtendedUser } from "@/next-auth";
import { useState, useEffect, useCallback, useRef } from 'react';
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsNavigation } from './AnalyticsNavigation';
import { CognitiveAnalytics } from './CognitiveAnalytics';
import { PredictiveAnalytics } from '@/app/dashboard/user/_components/smart-dashboard/PredictiveAnalytics';
import { RealtimePulse } from '@/app/dashboard/user/_components/smart-dashboard/RealtimePulse';
import { useStableAnalytics, useStablePerformanceMetrics, useStableRealtimePulse } from '@/hooks/use-stable-analytics';
import { cn } from '@/lib/utils';

// Import modular components
import { getStoredTab, getStoredPeriod, storeTab, storePeriod } from './storage-utils';
import { AnalyticsHeader } from './AnalyticsHeader';
import { DashboardView } from './DashboardView';
import { OverviewTab } from './tabs/OverviewTab';
import { PerformanceTab } from './tabs/PerformanceTab';
import { CoursesTab } from './tabs/CoursesTab';
import { IntelligentFeaturesTab } from './tabs/IntelligentFeaturesTab';
import { JobMarketTab } from './tabs/JobMarketTab';
import { StudentFeaturesTab } from './tabs/StudentFeaturesTab';
import { TeacherFeaturesTab } from './tabs/TeacherFeaturesTab';
import { AdminFeaturesTab } from './tabs/AdminFeaturesTab';
import { PostAnalyticsTab } from './tabs/PostAnalyticsTab';

/**
 * Props for the Unified Analytics Dashboard Component
 */
interface UnifiedAnalyticsProps {
  /** The authenticated user object with extended fields (role, 2FA status, etc.) */
  user: ExtendedUser;

  /** Display variant - 'dashboard' for embedded view, 'fullpage' for standalone page
   * @default 'dashboard'
   */
  variant?: 'dashboard' | 'fullpage';

  /** Additional CSS classes to apply to the root container */
  className?: string;
}

/**
 * Unified Analytics Dashboard Component
 *
 * Displays comprehensive user analytics including performance metrics,
 * course progress, cognitive analytics, and real-time insights.
 *
 * Features:
 * - Multiple analytics tabs (Overview, Performance, Cognitive, Courses, etc.)
 * - Period selection (Daily, Weekly, Monthly)
 * - Real-time data refresh
 * - Role-based tab visibility (Admin features for admins only)
 * - LocalStorage persistence for selected tab and period
 * - Error handling with fallback UI
 *
 * @component
 * @example
 * ```tsx
 * // Embedded in dashboard
 * <ImprovedUnifiedAnalytics
 *   user={currentUser}
 *   variant="dashboard"
 * />
 *
 * // Fullpage view
 * <ImprovedUnifiedAnalytics
 *   user={currentUser}
 *   variant="fullpage"
 *   className="min-h-screen"
 * />
 * ```
 */

export function ImprovedUnifiedAnalytics({ user, variant = 'dashboard', className }: UnifiedAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>(getStoredPeriod);
  const [selectedCourse, setSelectedCourse] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState(getStoredTab);

  // Users don't have roles anymore - admin auth is separate
  // This component is for regular users only
  const isAdmin = false;
  const isUser = true;

  // Initialize from localStorage only once and validate tab access
  useEffect(() => {
    const storedTab = getStoredTab();
    const storedPeriod = getStoredPeriod();
    
    // Check if user has access to the stored tab
    const hasAccessToTab = (tab: string) => {
      if (tab === 'admin-features') return isAdmin;
      return true; // All other tabs are accessible to everyone (including teacher tools)
    };
    
    // If user doesn't have access to stored tab, default to overview
    const validTab = hasAccessToTab(storedTab) ? storedTab : 'overview';
    
    if (validTab !== activeTab) {
      setActiveTab(validTab);
      if (validTab !== storedTab) {
        storeTab(validTab); // Store the valid tab
      }
    }
    if (storedPeriod !== selectedPeriod) {
      setSelectedPeriod(storedPeriod);
    }
  }, [isAdmin, activeTab, selectedPeriod]); // Depend on admin role check and state values

  // Stable data hooks that won't cause errors or reloads
  const { 
    data: analytics, 
    loading: analyticsLoading, 
    error: analyticsError,
    refreshAnalytics 
  } = useStableAnalytics(selectedPeriod, selectedCourse);

  const { 
    data: performance, 
    loading: performanceLoading, 
    error: performanceError,
    refreshPerformance 
  } = useStablePerformanceMetrics(selectedPeriod, 30);

  const { 
    pulse, 
    loading: pulseLoading, 
    error: pulseError,
    refreshPulse 
  } = useStableRealtimePulse();

  const handlePeriodChange = useCallback((period: 'DAILY' | 'WEEKLY' | 'MONTHLY') => {
    setSelectedPeriod(period);
    storePeriod(period);
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    storeTab(tab);
  }, []);

  const handleRefreshAll = useCallback(() => {
    refreshAnalytics();
    refreshPerformance();
    refreshPulse();
  }, [refreshAnalytics, refreshPerformance, refreshPulse]);

  // Swipe gesture handling for mobile tab navigation
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Don't handle swipe if touch started on a nested tab or interactive element
    const target = e.target as HTMLElement;
    // Check if touch started on nested tabs (any tablist that's inside another tablist)
    const nestedTabList = target.closest('[role="tablist"]');
    if (nestedTabList && nestedTabList.parentElement?.closest('[role="tablist"]')) {
      return; // Ignore touches on nested tabs
    }
    // Check for Radix UI nested tabs
    if (target.closest('[data-radix-tabs-trigger]')?.parentElement?.closest('[data-radix-tabs-list]')?.parentElement?.closest('[data-radix-tabs-root]')) {
      return; // Ignore touches on nested Radix tabs
    }
    // Check for buttons in nested tab containers
    if (target.closest('button')?.closest('[role="tablist"]')?.parentElement?.closest('[role="tablist"]')) {
      return; // Ignore touches on buttons in nested tabs
    }
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Don't handle swipe if touch is moving on a nested tab or interactive element
    const target = e.target as HTMLElement;
    const nestedTabList = target.closest('[role="tablist"]');
    if (nestedTabList && nestedTabList.parentElement?.closest('[role="tablist"]')) {
      return; // Ignore touches on nested tabs
    }
    if (target.closest('[data-radix-tabs-trigger]')?.parentElement?.closest('[data-radix-tabs-list]')?.parentElement?.closest('[data-radix-tabs-root]')) {
      return; // Ignore touches on nested Radix tabs
    }
    if (target.closest('button')?.closest('[role="tablist"]')?.parentElement?.closest('[role="tablist"]')) {
      return; // Ignore touches on buttons in nested tabs
    }
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    // Don't handle swipe if touch ended on a nested tab or interactive element
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      const nestedTabList = activeElement.closest('[role="tablist"]');
      if (nestedTabList && nestedTabList.parentElement?.closest('[role="tablist"]')) {
        return; // Ignore touches on nested tabs
      }
      if (activeElement.closest('[data-radix-tabs-trigger]')?.parentElement?.closest('[data-radix-tabs-list]')?.parentElement?.closest('[data-radix-tabs-root]')) {
        return; // Ignore touches on nested Radix tabs
      }
      if (activeElement.closest('button')?.closest('[role="tablist"]')?.parentElement?.closest('[role="tablist"]')) {
        return; // Ignore touches on buttons in nested tabs
      }
    }

    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50; // Minimum distance for a swipe to be registered

    if (Math.abs(swipeDistance) < minSwipeDistance) {
      return; // Not a significant swipe
    }

    const tabs = [
      'overview',
      'performance',
      'cognitive',
      'courses',
      'posts',
      'jobmarket',
      'features',
      'student-features',
      'teacher-features',
      ...(isAdmin ? ['admin-features'] : []),
      'insights',
      'realtime',
    ];

    const currentIndex = tabs.indexOf(activeTab);

    if (swipeDistance > 0 && currentIndex < tabs.length - 1) {
      // Swipe left - go to next tab
      handleTabChange(tabs[currentIndex + 1]);
    } else if (swipeDistance < 0 && currentIndex > 0) {
      // Swipe right - go to previous tab
      handleTabChange(tabs[currentIndex - 1]);
    }
  }, [activeTab, isAdmin, handleTabChange]);

  /**
   * Keyboard navigation handler for tab switching
   * Supports: Arrow Left/Right, Home, End keys
   */
  const handleKeyboardNavigation = useCallback((e: React.KeyboardEvent) => {
    const tabs = [
      'overview',
      'performance',
      'cognitive',
      'courses',
      'posts',
      'jobmarket',
      'intelligent-features',
      'student-features',
      'teacher-features',
      ...(isAdmin ? ['admin-features'] : []),
    ];

    const currentIndex = tabs.indexOf(activeTab);

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        if (currentIndex > 0) {
          handleTabChange(tabs[currentIndex - 1]);
        }
        break;

      case 'ArrowRight':
        e.preventDefault();
        if (currentIndex < tabs.length - 1) {
          handleTabChange(tabs[currentIndex + 1]);
        }
        break;

      case 'Home':
        e.preventDefault();
        handleTabChange(tabs[0]);
        break;

      case 'End':
        e.preventDefault();
        handleTabChange(tabs[tabs.length - 1]);
        break;
    }
  }, [activeTab, isAdmin, handleTabChange]);

  const isLoading = analyticsLoading || performanceLoading || pulseLoading;
  const hasError = analyticsError || performanceError || pulseError;

  if (isLoading) {
    return (
      <div className={cn("p-6 space-y-6", variant === 'fullpage' ? 'max-w-7xl mx-auto' : 'max-w-6xl mx-auto', className)}>
        <div
          className="flex items-center justify-center py-12"
          role="status"
          aria-live="polite"
          aria-label="Loading analytics data"
        >
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" aria-hidden="true" />
            <p className="text-muted-foreground">Loading your analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (hasError && !analytics && !performance && !pulse) {
    return (
      <div className={cn("p-6 space-y-6", variant === 'fullpage' ? 'max-w-7xl mx-auto' : 'max-w-6xl mx-auto', className)}>
        <Card className="border-destructive/50 bg-destructive/10" role="alert" aria-live="assertive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" aria-hidden="true" />
              <span className="font-medium">Error loading analytics</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {analyticsError || performanceError || pulseError}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              className="mt-4"
              aria-label="Retry loading analytics data"
            >
              <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Full page view with tabs
  if (variant === 'fullpage') {
    return (
      <div className={cn("min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700", className)}>
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
          <AnalyticsNavigation variant="fullpage" />

          <AnalyticsHeader
            variant="fullpage"
            selectedPeriod={selectedPeriod}
            onPeriodChange={handlePeriodChange}
            onRefreshAll={handleRefreshAll}
          />

          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            {/* Mobile: Horizontal scrollable tabs */}
            <div className="relative w-full overflow-x-auto scrollbar-hide -mx-2 px-2 sm:mx-0 sm:px-0">
              <TabsList
                onKeyDown={handleKeyboardNavigation}
                role="tablist"
                aria-label="Analytics dashboard sections"
                className="inline-flex md:grid w-auto md:w-full min-w-max md:min-w-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm md:grid-cols-10 gap-1"
              >
              <TabsTrigger
                value="overview"
                aria-label="View analytics overview and summary"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 whitespace-nowrap px-3 py-2 text-sm"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="performance"
                aria-label="View performance metrics and trends"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 whitespace-nowrap px-3 py-2 text-sm"
              >
                Performance
              </TabsTrigger>
              <TabsTrigger
                value="cognitive"
                aria-label="View cognitive analytics and learning patterns"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 whitespace-nowrap px-3 py-2 text-sm"
              >
                Cognitive
              </TabsTrigger>
              <TabsTrigger
                value="courses"
                aria-label="View course enrollment and progress"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 whitespace-nowrap px-3 py-2 text-sm"
              >
                Courses
              </TabsTrigger>
              <TabsTrigger
                value="posts"
                aria-label="View post analytics and engagement metrics"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 whitespace-nowrap px-3 py-2 text-sm"
              >
                Posts
              </TabsTrigger>
              <TabsTrigger
                value="jobmarket"
                aria-label="View job market readiness and career analytics"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 whitespace-nowrap px-3 py-2 text-sm"
              >
                Job Market
              </TabsTrigger>
              <TabsTrigger
                value="features"
                aria-label="View AI-powered intelligent features"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 whitespace-nowrap px-3 py-2 text-sm"
              >
                AI Features
              </TabsTrigger>
              <TabsTrigger
                value="student-features"
                aria-label="View student learning tools and resources"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 whitespace-nowrap px-3 py-2 text-sm"
              >
                Student Tools
              </TabsTrigger>

              {/* Teacher Tools - Show for all users (both USER and ADMIN) */}
              <TabsTrigger
                value="teacher-features"
                aria-label="View teacher content creation and management tools"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 whitespace-nowrap px-3 py-2 text-sm"
              >
                Teacher Tools
              </TabsTrigger>

              {/* Admin Tools - Only show for admins */}
              {isAdmin && (
                <TabsTrigger
                  value="admin-features"
                  aria-label="View admin platform management tools"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 whitespace-nowrap px-3 py-2 text-sm"
                >
                  Admin Tools
                </TabsTrigger>
              )}

              <TabsTrigger
                value="insights"
                aria-label="View predictive insights and recommendations"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 whitespace-nowrap px-3 py-2 text-sm"
              >
                Insights
              </TabsTrigger>
              <TabsTrigger
                value="realtime"
                aria-label="View real-time activity pulse and live data"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200 whitespace-nowrap"
              >
                Real-time
              </TabsTrigger>
            </TabsList>
            </div>

            {/* Swipe-enabled tab content container */}
            <div
              ref={tabsContainerRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="touch-pan-y"
              onTouchStartCapture={(e) => {
                // Stop propagation for nested tabs to prevent parent swipe handler interference
                const target = e.target as HTMLElement;
                if (
                  target.closest('[role="tablist"]')?.parentElement?.closest('[role="tablist"]') ||
                  target.closest('button[role="tab"]')?.parentElement?.closest('[role="tablist"]') ||
                  target.closest('[data-radix-tabs-trigger]')?.parentElement?.closest('[data-radix-tabs-list]') ||
                  target.closest('.overflow-x-auto')?.querySelector('[role="tablist"]')
                ) {
                  e.stopPropagation();
                }
              }}
            >
            <TabsContent value="overview" className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
              <OverviewTab analytics={analytics} performance={performance} pulse={pulse} />
            </TabsContent>

            <TabsContent value="performance" className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
              <PerformanceTab analytics={analytics} performance={performance} />
            </TabsContent>

            <TabsContent value="cognitive" className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
              <CognitiveAnalytics user={user} className="" />
            </TabsContent>

            <TabsContent value="courses" className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
              <CoursesTab analytics={analytics} />
            </TabsContent>

            <TabsContent value="posts" className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
              <PostAnalyticsTab />
            </TabsContent>

            <TabsContent value="jobmarket" className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
              <JobMarketTab user={user} analytics={analytics} />
            </TabsContent>

            <TabsContent value="features" className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
              <IntelligentFeaturesTab analytics={analytics} performance={performance} />
            </TabsContent>

            <TabsContent value="student-features" className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
              <StudentFeaturesTab analytics={analytics} performance={performance} />
            </TabsContent>

            {/* Teacher Features - Show for all users (both USER and ADMIN) */}
            <TabsContent value="teacher-features" className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
              <TeacherFeaturesTab analytics={analytics} performance={performance} />
            </TabsContent>

            {/* Admin Features - Only render for admins */}
            {isAdmin && (
              <TabsContent value="admin-features" className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
                <AdminFeaturesTab analytics={analytics} performance={performance} />
              </TabsContent>
            )}

            <TabsContent value="insights" className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
              <PredictiveAnalytics user={user} />
            </TabsContent>

            <TabsContent value="realtime" className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
              <RealtimePulse user={user} />
            </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    );
  }

  // Dashboard compact view
  return (
    <>
      <AnalyticsNavigation variant="dashboard" />
      
      <AnalyticsHeader
        variant="dashboard"
        selectedPeriod={selectedPeriod}
        onPeriodChange={handlePeriodChange}
        onRefreshAll={handleRefreshAll}
      />

      <DashboardView
        user={user}
        analytics={analytics}
        performance={performance}
        className={className}
      />
    </>
  );
}