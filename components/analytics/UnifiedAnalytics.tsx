"use client";

import { motion } from "framer-motion";
import { User } from "next-auth";
import { useState } from 'react';
import { 
  TrendingUp, BarChart3, Activity, Target, 
  Clock, Zap, BookOpen, Award, AlertCircle,
  RefreshCw, Loader2, Calendar, Brain
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardCard } from '@/components/ui/dashboard-card';
import { PredictiveAnalytics } from '@/app/dashboard/user/_components/smart-dashboard/PredictiveAnalytics';
import { RealtimePulse } from '@/app/dashboard/user/_components/smart-dashboard/RealtimePulse';
import { AnalyticsNavigation } from './AnalyticsNavigation';
import { CognitiveAnalytics } from './CognitiveAnalytics';
import { useDashboardAnalytics, usePerformanceMetrics, useRealtimePulse } from '@/hooks/use-dashboard-analytics';
import { cn } from '@/lib/utils';

interface UnifiedAnalyticsProps {
  user: User;
  variant?: 'dashboard' | 'fullpage'; // dashboard for compact view, fullpage for dedicated analytics page
  className?: string;
}

export function UnifiedAnalytics({ user, variant = 'dashboard', className }: UnifiedAnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [selectedCourse, setSelectedCourse] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('overview');

  // Add error boundary for API calls
  const { 
    data: analytics, 
    loading: analyticsLoading, 
    error: analyticsError,
    refreshAnalytics 
  } = useDashboardAnalytics(selectedPeriod, selectedCourse);

  const { 
    data: performance, 
    loading: performanceLoading, 
    error: performanceError,
    refreshPerformance 
  } = usePerformanceMetrics(selectedPeriod, 30);

  const { 
    pulse, 
    loading: pulseLoading, 
    error: pulseError,
    refreshPulse 
  } = useRealtimePulse();

  const handlePeriodChange = (period: 'DAILY' | 'WEEKLY' | 'MONTHLY') => {
    setSelectedPeriod(period);
  };

  const handleRefreshAll = () => {
    refreshAnalytics();
    refreshPerformance();
    refreshPulse();
  };

  const isLoading = analyticsLoading || performanceLoading || pulseLoading;
  const hasError = analyticsError || performanceError || pulseError;

  if (isLoading) {
    return (
      <div className={cn("p-6 space-y-6", variant === 'fullpage' ? 'max-w-7xl mx-auto' : 'max-w-6xl mx-auto', className)}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
            <p className="text-slate-600 dark:text-slate-400">Loading your analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (hasError && !analytics && !performance && !pulse) {
    return (
      <div className={cn("p-6 space-y-6", variant === 'fullpage' ? 'max-w-7xl mx-auto' : 'max-w-6xl mx-auto', className)}>
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Error loading analytics</span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
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
      <div className={cn("container mx-auto px-4 py-8", className)}>
        <AnalyticsNavigation variant="fullpage" />
        
        {/* Header with Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Learning Analytics</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Comprehensive insights into your learning progress and performance
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Period Selector */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => handlePeriodChange(period)}
                  className={cn(
                    "px-3 py-1 text-sm font-medium rounded-md transition-colors",
                    selectedPeriod === period
                      ? "bg-purple-600 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  {period.charAt(0) + period.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            
            <Button variant="outline" size="sm" onClick={handleRefreshAll}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="cognitive">Cognitive</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
            <TabsTrigger value="realtime">Real-time</TabsTrigger>
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
          
          <TabsContent value="insights" className="space-y-6 pt-6">
            <PredictiveAnalytics user={user} />
          </TabsContent>
          
          <TabsContent value="realtime" className="space-y-6 pt-6">
            <RealtimePulse user={user} />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Dashboard compact view (original AnalyticsTab)
  return (
    <div className={cn("p-6 space-y-6 max-w-6xl mx-auto", className)}>
      <AnalyticsNavigation variant="dashboard" />
      
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Learning Analytics</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Real-time insights into your learning progress and performance
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            {(['DAILY', 'WEEKLY', 'MONTHLY'] as const).map((period) => (
              <button
                key={period}
                onClick={() => handlePeriodChange(period)}
                className={cn(
                  "px-3 py-1 text-sm font-medium rounded-md transition-colors",
                  selectedPeriod === period
                    ? "bg-purple-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                {period.charAt(0) + period.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          
          <Button variant="outline" size="sm" onClick={handleRefreshAll}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      {analytics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Time</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(analytics.summary.totalLearningTime / 60)}h
              </div>
              <div className="text-xs text-gray-500">
                {analytics.summary.totalLearningTime % 60}m
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Engagement</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.summary.averageEngagementScore}%
              </div>
              <div className="text-xs text-gray-500">Average score</div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Progress</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.summary.overallProgress}%
              </div>
              <div className="text-xs text-gray-500">Overall completion</div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Streak</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.summary.currentStreak}
              </div>
              <div className="text-xs text-gray-500">Days</div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Courses</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.summary.activeCourses}
              </div>
              <div className="text-xs text-gray-500">Active</div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Achievements</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.summary.totalAchievements}
              </div>
              <div className="text-xs text-gray-500">Unlocked</div>
            </Card>
          </div>
        </motion.div>
      )}

      {/* Performance Trends */}
      {performance && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Learning Velocity</span>
                    <Badge variant={performance.trends.learningVelocity === 'IMPROVING' ? 'default' : 
                                   performance.trends.learningVelocity === 'DECLINING' ? 'destructive' : 'secondary'}>
                      {performance.trends.learningVelocity}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold">
                    {performance.summary.totalLearningTime > 0 
                      ? Math.round(performance.summary.totalLearningTime / Math.max(performance.summary.totalSessions, 1))
                      : 0}min
                  </div>
                  <div className="text-xs text-gray-500">Per session</div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Engagement</span>
                    <Badge variant={performance.trends.engagement === 'IMPROVING' ? 'default' : 
                                   performance.trends.engagement === 'DECLINING' ? 'destructive' : 'secondary'}>
                      {performance.trends.engagement}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold">
                    {performance.summary.averageEngagementScore}%
                  </div>
                  <div className="text-xs text-gray-500">Average</div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Quiz Performance</span>
                    <Badge variant={performance.trends.performance === 'IMPROVING' ? 'default' : 
                                   performance.trends.performance === 'DECLINING' ? 'destructive' : 'secondary'}>
                      {performance.trends.performance}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold">
                    {performance.summary.averageQuizPerformance}%
                  </div>
                  <div className="text-xs text-gray-500">Average score</div>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium">Improvement Rate</span>
                  <div className={cn(
                    "text-2xl font-bold",
                    performance.trends.improvementRate > 0 ? "text-green-600" : 
                    performance.trends.improvementRate < 0 ? "text-red-600" : "text-gray-600"
                  )}>
                    {performance.trends.improvementRate > 0 ? '+' : ''}
                    {Math.round(performance.trends.improvementRate)}%
                  </div>
                  <div className="text-xs text-gray-500">This period</div>
                </div>
              </div>

              {performance.insights && performance.insights.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">AI Insights</h4>
                  {performance.insights.map((insight: any, index: number) => (
                    <div 
                      key={index}
                      className={cn(
                        "p-3 rounded-lg border",
                        insight.type === 'success' ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800" :
                        insight.type === 'warning' ? "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800" :
                        insight.type === 'info' ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800" :
                        "bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                          insight.priority === 'high' ? "bg-red-500" :
                          insight.priority === 'medium' ? "bg-orange-500" : "bg-green-500"
                        )} />
                        <div>
                          <h5 className="font-medium text-sm">{insight.title}</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {insight.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Enhanced Predictive Analytics with Real Data */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <DashboardCard 
          title="Predictive Analytics" 
          icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
        >
          <PredictiveAnalytics user={user} />
        </DashboardCard>
      </motion.div>

      {/* Enhanced Real-time Pulse with Real Data */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <DashboardCard 
          title="Real-time Learning Pulse" 
          icon={<BarChart3 className="w-5 h-5 text-green-600" />}
        >
          <RealtimePulse user={user} />
        </DashboardCard>
      </motion.div>

      {/* Current Learning Metrics */}
      {analytics && analytics.learningMetrics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Course Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.learningMetrics.slice(0, 5).map((metric) => (
                  <div key={metric.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    {metric.course?.imageUrl && (
                      <img 
                        src={metric.course.imageUrl} 
                        alt={metric.course.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {metric.course?.title || 'Unknown Course'}
                      </h4>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Progress:</span>
                          <Progress value={metric.overallProgress} className="w-20" />
                          <span className="text-sm font-medium">{Math.round(metric.overallProgress)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Engagement:</span>
                          <span className="text-sm font-medium">{Math.round(metric.averageEngagementScore)}%</span>
                        </div>
                        <Badge variant={metric.riskScore > 70 ? 'destructive' : 
                                       metric.riskScore > 40 ? 'secondary' : 'default'}>
                          {metric.riskScore > 70 ? 'At Risk' : 
                           metric.riskScore > 40 ? 'Moderate' : 'On Track'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// Individual tab components for full-page view
function OverviewTab({ analytics, performance, pulse }: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {analytics && (
          <>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Time</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(analytics.summary.totalLearningTime / 60)}h
              </div>
              <div className="text-xs text-gray-500">
                {analytics.summary.totalLearningTime % 60}m
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Engagement</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.summary.averageEngagementScore}%
              </div>
              <div className="text-xs text-gray-500">Average score</div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Progress</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.summary.overallProgress}%
              </div>
              <div className="text-xs text-gray-500">Overall completion</div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Streak</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.summary.currentStreak}
              </div>
              <div className="text-xs text-gray-500">Days</div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Courses</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.summary.activeCourses}
              </div>
              <div className="text-xs text-gray-500">Active</div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Achievements</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.summary.totalAchievements}
              </div>
              <div className="text-xs text-gray-500">Unlocked</div>
            </Card>
          </>
        )}
      </div>

      {pulse && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              Today's Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(pulse.todayStats.totalStudyTime / 60)}h
                </div>
                <div className="text-sm text-gray-500">Study Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {pulse.todayStats.sessionCount}
                </div>
                <div className="text-sm text-gray-500">Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {pulse.todayStats.averageEngagement}%
                </div>
                <div className="text-sm text-gray-500">Engagement</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {pulse.weeklyMomentum.streak}
                </div>
                <div className="text-sm text-gray-500">Day Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PerformanceTab({ analytics, performance }: any) {
  return (
    <div className="space-y-6">
      {performance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Performance Trends & Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Learning Velocity</span>
                  <Badge variant={performance.trends.learningVelocity === 'IMPROVING' ? 'default' : 
                                 performance.trends.learningVelocity === 'DECLINING' ? 'destructive' : 'secondary'}>
                    {performance.trends.learningVelocity}
                  </Badge>
                </div>
                <div className="text-2xl font-bold">
                  {performance.summary.totalLearningTime > 0 
                    ? Math.round(performance.summary.totalLearningTime / Math.max(performance.summary.totalSessions, 1))
                    : 0}min
                </div>
                <div className="text-xs text-gray-500">Per session</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Engagement</span>
                  <Badge variant={performance.trends.engagement === 'IMPROVING' ? 'default' : 
                                 performance.trends.engagement === 'DECLINING' ? 'destructive' : 'secondary'}>
                    {performance.trends.engagement}
                  </Badge>
                </div>
                <div className="text-2xl font-bold">
                  {performance.summary.averageEngagementScore}%
                </div>
                <div className="text-xs text-gray-500">Average</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Quiz Performance</span>
                  <Badge variant={performance.trends.performance === 'IMPROVING' ? 'default' : 
                                 performance.trends.performance === 'DECLINING' ? 'destructive' : 'secondary'}>
                    {performance.trends.performance}
                  </Badge>
                </div>
                <div className="text-2xl font-bold">
                  {performance.summary.averageQuizPerformance}%
                </div>
                <div className="text-xs text-gray-500">Average score</div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Improvement Rate</span>
                <div className={cn(
                  "text-2xl font-bold",
                  performance.trends.improvementRate > 0 ? "text-green-600" : 
                  performance.trends.improvementRate < 0 ? "text-red-600" : "text-gray-600"
                )}>
                  {performance.trends.improvementRate > 0 ? '+' : ''}
                  {Math.round(performance.trends.improvementRate)}%
                </div>
                <div className="text-xs text-gray-500">This period</div>
              </div>
            </div>

            {performance.insights && performance.insights.length > 0 && (
              <div className="mt-6 space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">AI Performance Insights</h4>
                {performance.insights.map((insight: any, index: number) => (
                  <div 
                    key={index}
                    className={cn(
                      "p-3 rounded-lg border",
                      insight.type === 'success' ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800" :
                      insight.type === 'warning' ? "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800" :
                      insight.type === 'info' ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800" :
                      "bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                        insight.priority === 'high' ? "bg-red-500" :
                        insight.priority === 'medium' ? "bg-orange-500" : "bg-green-500"
                      )} />
                      <div>
                        <h5 className="font-medium text-sm">{insight.title}</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {insight.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CoursesTab({ analytics }: any) {
  return (
    <div className="space-y-6">
      {analytics && analytics.learningMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Course Progress & Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.learningMetrics.map((metric: any) => (
                <div key={metric.id} className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border">
                  {metric.course?.imageUrl && (
                    <img 
                      src={metric.course.imageUrl} 
                      alt={metric.course.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white text-lg">
                      {metric.course?.title || 'Unknown Course'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Progress:</span>
                        <Progress value={metric.overallProgress} className="w-24" />
                        <span className="text-sm font-medium">{Math.round(metric.overallProgress)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Engagement:</span>
                        <span className="text-sm font-medium">{Math.round(metric.averageEngagementScore)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Study Time:</span>
                        <span className="text-sm font-medium">{Math.round(metric.totalStudyTime / 60)}h</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Badge variant={metric.riskScore > 70 ? 'destructive' : 
                                     metric.riskScore > 40 ? 'secondary' : 'default'}>
                        {metric.riskScore > 70 ? 'At Risk' : 
                         metric.riskScore > 40 ? 'Moderate Risk' : 'On Track'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}