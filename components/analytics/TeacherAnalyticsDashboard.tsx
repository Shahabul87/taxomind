// Teacher Analytics Dashboard - Focused on classroom management and teaching insights

'use client';

import { User } from "next-auth";
import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Loader2, RefreshCw, Users, BarChart, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useStableAnalytics, useStablePerformanceMetrics } from '@/hooks/use-stable-analytics';
import { cn } from '@/lib/utils';

// Import teacher-specific tabs
import { TeacherFeaturesTab } from './tabs/TeacherFeaturesTab';
import { OverviewTab } from './tabs/OverviewTab';
import { PerformanceTab } from './tabs/PerformanceTab';

interface TeacherAnalyticsDashboardProps {
  user: User;
  className?: string;
}

export function TeacherAnalyticsDashboard({ user, className }: TeacherAnalyticsDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [activeTab, setActiveTab] = useState('overview');

  // Data hooks
  const { 
    data: analytics, 
    loading: analyticsLoading, 
    error: analyticsError,
    refreshAnalytics 
  } = useStableAnalytics(selectedPeriod);

  const { 
    data: performance, 
    loading: performanceLoading, 
    error: performanceError,
    refreshPerformance 
  } = useStablePerformanceMetrics(selectedPeriod, 30);

  const handlePeriodChange = useCallback((period: 'DAILY' | 'WEEKLY' | 'MONTHLY') => {
    setSelectedPeriod(period);
  }, []);

  const handleRefreshAll = useCallback(() => {
    refreshAnalytics();
    refreshPerformance();
  }, [refreshAnalytics, refreshPerformance]);

  const isLoading = analyticsLoading || performanceLoading;
  const hasError = analyticsError || performanceError;

  if (isLoading) {
    return (
      <div className={cn("p-6 space-y-6 max-w-7xl mx-auto", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading teacher analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (hasError && !analytics && !performance) {
    return (
      <div className={cn("p-6 space-y-6 max-w-7xl mx-auto", className)}>
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Error loading teacher analytics</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {analyticsError || performanceError}
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

  return (
    <div className={cn("min-h-screen", className)}>
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Teacher Analytics</h1>
              <p className="text-muted-foreground">Classroom management and teaching insights</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>7 Teaching Tools</span>
              </Badge>
              <Button variant="outline" onClick={handleRefreshAll}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex items-center space-x-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 rounded-lg border border-slate-200/50 dark:border-slate-700/50 w-fit">
            {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? "default" : "ghost"}
                size="sm"
                onClick={() => handlePeriodChange(period)}
                className={cn(
                  "transition-all duration-200",
                  selectedPeriod === period && "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                )}
              >
                {period.charAt(0) + period.slice(1).toLowerCase()}
              </Button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Active Students</p>
                  <p className="text-3xl font-bold">24</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Avg Engagement</p>
                  <p className="text-3xl font-bold">87%</p>
                </div>
                <BarChart className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Completion Rate</p>
                  <p className="text-3xl font-bold">94%</p>
                </div>
                <Eye className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">At-Risk Students</p>
                  <p className="text-3xl font-bold">3</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
            >
              Class Overview
            </TabsTrigger>
            <TabsTrigger 
              value="teaching-tools" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
            >
              Teaching Tools
            </TabsTrigger>
            <TabsTrigger 
              value="performance" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
            >
              Student Performance
            </TabsTrigger>
            <TabsTrigger 
              value="insights" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
            >
              AI Insights
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6 pt-6">
            <OverviewTab analytics={analytics} performance={performance} pulse={null} />
          </TabsContent>
          
          <TabsContent value="teaching-tools" className="space-y-6 pt-6">
            <TeacherFeaturesTab analytics={analytics} performance={performance} />
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-6 pt-6">
            <PerformanceTab analytics={analytics} performance={performance} />
          </TabsContent>
          
          <TabsContent value="insights" className="space-y-6 pt-6">
            <div className="grid gap-6">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-4">AI-Powered Teaching Insights</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">Engagement Optimization</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Students show 23% higher engagement with interactive video content. Consider adding more interactive elements.
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                      <h4 className="font-medium text-green-900 dark:text-green-100">Content Difficulty</h4>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Chapter 5 content is optimally balanced for your class skill level. Maintain current pacing.
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                      <h4 className="font-medium text-orange-900 dark:text-orange-100">At-Risk Alert</h4>
                      <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                        3 students may need additional support. Consider one-on-one sessions or supplementary materials.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}