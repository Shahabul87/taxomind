"use client";

import { User } from "next-auth";
import { useState, useEffect, useCallback } from 'react';
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

interface UnifiedAnalyticsProps {
  user: User;
  variant?: 'dashboard' | 'fullpage';
  className?: string;
}

export function ImprovedUnifiedAnalytics({ user, variant = 'dashboard', className }: UnifiedAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>(getStoredPeriod);
  const [selectedCourse, setSelectedCourse] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState(getStoredTab);
  
  // Check user role for conditional tab rendering
  const isAdmin = user?.role === 'ADMIN';
  const isUser = user?.role === 'USER';

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

  const isLoading = analyticsLoading || performanceLoading || pulseLoading;
  const hasError = analyticsError || performanceError || pulseError;

  if (isLoading) {
    return (
      <div className={cn("p-6 space-y-6", variant === 'fullpage' ? 'max-w-7xl mx-auto' : 'max-w-6xl mx-auto', className)}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading your analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (hasError && !analytics && !performance && !pulse) {
    return (
      <div className={cn("p-6 space-y-6", variant === 'fullpage' ? 'max-w-7xl mx-auto' : 'max-w-6xl mx-auto', className)}>
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
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
            >
              <RefreshCw className="w-4 h-4 mr-2" />
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
        <div className="container mx-auto px-4 py-8">
          <AnalyticsNavigation variant="fullpage" />
          
          <AnalyticsHeader
            variant="fullpage"
            selectedPeriod={selectedPeriod}
            onPeriodChange={handlePeriodChange}
            onRefreshAll={handleRefreshAll}
          />

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className={`grid w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm ${
              isAdmin ? 'grid-cols-11' : 'grid-cols-10'
            }`}>
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="performance" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
              >
                Performance
              </TabsTrigger>
              <TabsTrigger 
                value="cognitive" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
              >
                Cognitive
              </TabsTrigger>
              <TabsTrigger 
                value="courses" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
              >
                Courses
              </TabsTrigger>
              <TabsTrigger 
                value="posts" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
              >
                Posts
              </TabsTrigger>
              <TabsTrigger 
                value="jobmarket" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
              >
                Job Market
              </TabsTrigger>
              <TabsTrigger 
                value="features" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
              >
                AI Features
              </TabsTrigger>
              <TabsTrigger 
                value="student-features" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
              >
                Student Tools
              </TabsTrigger>
              
              {/* Teacher Tools - Show for all users (both USER and ADMIN) */}
              <TabsTrigger 
                value="teacher-features" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
              >
                Teacher Tools
              </TabsTrigger>
              
              {/* Admin Tools - Only show for admins */}
              {isAdmin && (
                <TabsTrigger 
                  value="admin-features" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
                >
                  Admin Tools
                </TabsTrigger>
              )}
              
              <TabsTrigger 
                value="insights" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
              >
                Insights
              </TabsTrigger>
              <TabsTrigger 
                value="realtime" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
              >
                Real-time
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6 pt-6">
              <OverviewTab analytics={analytics} performance={performance} pulse={pulse} />
            </TabsContent>
            
            <TabsContent value="performance" className="space-y-6 pt-6">
              <PerformanceTab analytics={analytics} performance={performance} />
            </TabsContent>
            
            <TabsContent value="cognitive" className="space-y-6 pt-6">
              <CognitiveAnalytics user={user} className="" />
            </TabsContent>
            
            <TabsContent value="courses" className="space-y-6 pt-6">
              <CoursesTab analytics={analytics} />
            </TabsContent>
            
            <TabsContent value="posts" className="space-y-6 pt-6">
              <PostAnalyticsTab />
            </TabsContent>
            
            <TabsContent value="jobmarket" className="space-y-6 pt-6">
              <JobMarketTab user={user} analytics={analytics} />
            </TabsContent>
            
            <TabsContent value="features" className="space-y-6 pt-6">
              <IntelligentFeaturesTab analytics={analytics} performance={performance} />
            </TabsContent>
            
            <TabsContent value="student-features" className="space-y-6 pt-6">
              <StudentFeaturesTab analytics={analytics} performance={performance} />
            </TabsContent>
            
            {/* Teacher Features - Show for all users (both USER and ADMIN) */}
            <TabsContent value="teacher-features" className="space-y-6 pt-6">
              <TeacherFeaturesTab analytics={analytics} performance={performance} />
            </TabsContent>
            
            {/* Admin Features - Only render for admins */}
            {isAdmin && (
              <TabsContent value="admin-features" className="space-y-6 pt-6">
                <AdminFeaturesTab analytics={analytics} performance={performance} />
              </TabsContent>
            )}
            
            <TabsContent value="insights" className="space-y-6 pt-6">
              <PredictiveAnalytics user={user} />
            </TabsContent>
            
            <TabsContent value="realtime" className="space-y-6 pt-6">
              <RealtimePulse user={user} />
            </TabsContent>
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