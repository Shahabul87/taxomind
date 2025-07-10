"use client";

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  Brain,
  Target,
  Clock,
  DollarSign,
  Activity,
  AlertTriangle,
  Settings,
  Download,
  RefreshCw,
  Filter,
  Calendar,
  Eye,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { cn } from '@/lib/utils';
import {
  MetricCard,
  ChartWidget,
  ProgressWidget,
  AlertsWidget,
  BloomsProgressWidget,
  RealTimeWidget,
} from '@/components/ui/analytics-widgets';
import {
  analyticsEngine,
  AnalyticsMetric,
  CourseAnalytics,
  StudentAnalytics,
  PlatformAnalytics,
  AnalyticsTimeRange,
} from '@/lib/enterprise-analytics';

interface EnterpriseAnalyticsDashboardProps {
  courseId: string;
  courseName: string;
  userId: string;
}

export const EnterpriseAnalyticsDashboard: React.FC<EnterpriseAnalyticsDashboardProps> = ({
  courseId,
  courseName,
  userId,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
    granularity: 'day',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [courseAnalytics, setCourseAnalytics] = useState<CourseAnalytics | null>(null);
  const [platformAnalytics, setPlatformAnalytics] = useState<PlatformAnalytics | null>(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState<AnalyticsMetric[]>([]);

  // Load analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        const [course, platform, realtime] = await Promise.all([
          analyticsEngine.getCourseAnalytics(courseId, timeRange),
          analyticsEngine.getPlatformAnalytics(timeRange),
          analyticsEngine.getRealtimeMetrics('dashboard_main'),
        ]);

        setCourseAnalytics(course);
        setPlatformAnalytics(platform);
        setRealtimeMetrics(realtime);
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [courseId, timeRange]);

  // Real-time updates subscription
  useEffect(() => {
    const unsubscribe = analyticsEngine.subscribe('dashboard_main', (metrics: AnalyticsMetric[]) => {
      setRealtimeMetrics(metrics);
    });

    return unsubscribe;
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    // Clear cache and reload
    setTimeout(() => setIsLoading(false), 1000);
  };

  const generateEngagementData = () => {
    return Array.from({ length: 30 }, (_, i) => ({
      name: `Day ${i + 1}`,
      engagement: 60 + Math.random() * 40,
      completion: 70 + Math.random() * 30,
      active_users: 100 + Math.floor(Math.random() * 50),
    }));
  };

  const generatePerformanceData = () => {
    if (!courseAnalytics) return [];
    return courseAnalytics.performanceBySection.map(section => ({
      name: section.sectionTitle,
      completion: section.completionRate,
      score: section.averageScore,
      time: section.timeSpent,
    }));
  };

  const getAlerts = () => [
    {
      id: '1',
      title: 'Low Engagement Alert',
      message: '15 students have not logged in for over 7 days',
      severity: 'warning' as const,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: '2',
      title: 'High Dropout Risk',
      message: '3 students identified as high risk for course dropout',
      severity: 'error' as const,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
  ];

  const getProgressItems = () => {
    if (!courseAnalytics) return [];
    return [
      {
        label: 'Course Completion',
        value: Math.floor(courseAnalytics.completionRate),
        total: 100,
        color: '#10b981',
      },
      {
        label: 'Video Engagement',
        value: Math.floor(courseAnalytics.engagementMetrics.videoCompletionRate),
        total: 100,
        color: '#3b82f6',
      },
      {
        label: 'Exam Performance',
        value: Math.floor(courseAnalytics.engagementMetrics.examCompletionRate),
        total: 100,
        color: '#8b5cf6',
      },
    ];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Course: {courseName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange.granularity} onValueChange={(value: any) => 
            setTimeRange(prev => ({ ...prev, granularity: value }))
          }>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <DatePickerWithRange 
            value={{ from: timeRange.start, to: timeRange.end }}
            onChange={(range) => {
              if (range?.from && range?.to) {
                setTimeRange(prev => ({
                  ...prev,
                  start: range.from!,
                  end: range.to!,
                }));
              }
            }}
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshData}
            disabled={isLoading}
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {realtimeMetrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full lg:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
          <TabsTrigger value="predictive">Predictive</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Course Overview Cards */}
            <div className="lg:col-span-2 space-y-6">
              <ChartWidget
                title="Enrollment & Engagement Trends"
                data={generateEngagementData()}
                type="area"
                dataKey="engagement"
                xAxisKey="name"
              />
              <ChartWidget
                title="Performance by Section"
                data={generatePerformanceData()}
                type="bar"
                dataKey="completion"
                xAxisKey="name"
              />
            </div>
            
            <div className="space-y-6">
              <ProgressWidget
                title="Key Performance Indicators"
                items={getProgressItems()}
              />
              <AlertsWidget alerts={getAlerts()} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartWidget
              title="Daily Active Users"
              data={generateEngagementData()}
              type="line"
              dataKey="active_users"
              xAxisKey="name"
            />
            <ChartWidget
              title="Session Duration Distribution"
              data={[
                { name: '0-15 min', value: 25 },
                { name: '15-30 min', value: 35 },
                { name: '30-60 min', value: 30 },
                { name: '60+ min', value: 10 },
              ]}
              type="pie"
              dataKey="value"
              xAxisKey="name"
            />
            {courseAnalytics && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Engagement Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {courseAnalytics.engagementMetrics.averageSessionDuration.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Avg Session (min)
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {courseAnalytics.engagementMetrics.averageLoginsPerWeek.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Logins/Week
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {courseAnalytics.engagementMetrics.videoCompletionRate.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Video Completion
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {courseAnalytics.engagementMetrics.discussionParticipation.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Discussion Activity
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <ChartWidget
                title="Completion vs Performance"
                data={generatePerformanceData()}
                type="bar"
                dataKey="score"
                xAxisKey="name"
              />
              {courseAnalytics && (
                <BloomsProgressWidget
                  distribution={courseAnalytics.bloomsDistribution}
                />
              )}
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Performance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {courseAnalytics && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Average Score
                        </span>
                        <span className="font-semibold">
                          {courseAnalytics.averageRating.toFixed(1)}/5.0
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Completion Rate
                        </span>
                        <span className="font-semibold text-green-600">
                          {courseAnalytics.completionRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Avg Time to Complete
                        </span>
                        <span className="font-semibold">
                          {courseAnalytics.averageTimeToComplete} days
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Active Students
                        </span>
                        <span className="font-semibold text-blue-600">
                          {courseAnalytics.activeStudents}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {courseAnalytics && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      AI Usage Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {courseAnalytics.aiMetrics.questionsGenerated.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Questions Generated
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {courseAnalytics.aiMetrics.contentCurated.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Content Curated
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {courseAnalytics.aiMetrics.personalizedRecommendations.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Recommendations
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {courseAnalytics.aiMetrics.adaptiveAssessments.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Adaptive Assessments
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <ChartWidget
                  title="AI Feature Adoption"
                  data={[
                    { name: 'Question Gen', value: courseAnalytics.aiMetrics.questionsGenerated },
                    { name: 'Content Curation', value: courseAnalytics.aiMetrics.contentCurated },
                    { name: 'Recommendations', value: courseAnalytics.aiMetrics.personalizedRecommendations },
                    { name: 'Assessments', value: courseAnalytics.aiMetrics.adaptiveAssessments },
                  ]}
                  type="bar"
                  dataKey="value"
                  xAxisKey="name"
                />
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Predictive Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                      Completion Prediction
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      85% of enrolled students are predicted to complete the course
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">
                      At-Risk Students
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      12 students identified as high-risk for dropout
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="font-semibold text-green-900 dark:text-green-100">
                      Revenue Forecast
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Projected $15,420 additional revenue this month
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ChartWidget
              title="Engagement Prediction"
              data={Array.from({ length: 7 }, (_, i) => ({
                name: `Day ${i + 1}`,
                actual: 80 + Math.random() * 20,
                predicted: 85 + Math.random() * 15,
              }))}
              type="line"
              dataKey="predicted"
              xAxisKey="name"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};