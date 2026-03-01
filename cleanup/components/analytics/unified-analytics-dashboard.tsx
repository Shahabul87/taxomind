"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Users, BookOpen, Clock, Target,
  Award, Activity, Brain, Zap, Eye, MessageCircle, Download,
  RefreshCw, Filter, Calendar, MoreHorizontal
} from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalCourses: number;
    completionRate: number;
    totalWatchTime: number;
    engagementScore: number;
  };
  trends: {
    userGrowth: Array<{ date: string; users: number; active: number }>;
    courseProgress: Array<{ date: string; completed: number; started: number }>;
    engagement: Array<{ date: string; score: number; interactions: number }>;
  };
  performance: {
    topCourses: Array<{ name: string; enrollments: number; rating: number; completion: number }>;
    strugglingAreas: Array<{ topic: string; difficultyScore: number; dropoffRate: number }>;
    learningVelocity: Array<{ week: string; avgHours: number; efficiency: number }>;
  };
  realtime: {
    currentUsers: number;
    activeClassrooms: number;
    liveInteractions: number;
    systemLoad: number;
  };
}

const COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  gray: '#6b7280'
};

const CHART_COLORS = [COLORS.primary, COLORS.secondary, COLORS.success, COLORS.warning, COLORS.info];

export function UnifiedAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('overview');

  // Simulated data - replace with actual API calls
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: AnalyticsData = {
        overview: {
          totalUsers: 12845,
          activeUsers: 8234,
          totalCourses: 156,
          completionRate: 73.5,
          totalWatchTime: 45678,
          engagementScore: 87.2
        },
        trends: {
          userGrowth: Array.from({ length: 30 }, (_, i) => ({
            date: format(subDays(new Date(), 29 - i), 'MMM dd'),
            users: Math.floor(Math.random() * 100 + 900),
            active: Math.floor(Math.random() * 80 + 600)
          })),
          courseProgress: Array.from({ length: 7 }, (_, i) => ({
            date: format(subDays(new Date(), 6 - i), 'EEE'),
            completed: Math.floor(Math.random() * 50 + 20),
            started: Math.floor(Math.random() * 80 + 40)
          })),
          engagement: Array.from({ length: 24 }, (_, i) => ({
            date: `${i}:00`,
            score: Math.floor(Math.random() * 40 + 60),
            interactions: Math.floor(Math.random() * 200 + 100)
          }))
        },
        performance: {
          topCourses: [
            { name: 'Advanced React Patterns', enrollments: 1234, rating: 4.8, completion: 89 },
            { name: 'Machine Learning Fundamentals', enrollments: 987, rating: 4.6, completion: 76 },
            { name: 'Data Science with Python', enrollments: 856, rating: 4.7, completion: 82 },
            { name: 'Cloud Architecture', enrollments: 743, rating: 4.5, completion: 68 },
            { name: 'DevOps Essentials', enrollments: 634, rating: 4.4, completion: 71 }
          ],
          strugglingAreas: [
            { topic: 'Advanced Algorithms', difficultyScore: 8.2, dropoffRate: 23 },
            { topic: 'System Design', difficultyScore: 7.8, dropoffRate: 19 },
            { topic: 'Database Optimization', difficultyScore: 7.5, dropoffRate: 16 },
            { topic: 'Security Concepts', difficultyScore: 7.1, dropoffRate: 14 }
          ],
          learningVelocity: Array.from({ length: 12 }, (_, i) => ({
            week: `Week ${i + 1}`,
            avgHours: Math.floor(Math.random() * 10 + 15),
            efficiency: Math.floor(Math.random() * 20 + 70)
          }))
        },
        realtime: {
          currentUsers: 234,
          activeClassrooms: 12,
          liveInteractions: 1567,
          systemLoad: 67
        }
      };
      
      setData(mockData);
      setLoading(false);
    };

    fetchData();
  }, [timeRange]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    trend = 'up',
    format = 'number'
  }: {
    title: string;
    value: number;
    change: number;
    icon: React.ComponentType<{ className?: string }>;
    trend?: 'up' | 'down';
    format?: 'number' | 'percentage' | 'time';
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'percentage':
          return `${val}%`;
        case 'time':
          return `${Math.floor(val / 60)}h ${val % 60}m`;
        default:
          return val.toLocaleString();
      }
    };

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatValue(value)}</div>
          <div className="flex items-center text-xs text-muted-foreground">
            {trend === 'up' ? (
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
            )}
            <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
              {change > 0 ? '+' : ''}{change}%
            </span>
            <span className="ml-1">from last week</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse" />
            <div className="h-8 bg-gray-200 rounded w-16 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-80 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your learning platform performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      {/* Real-time Status */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{data.realtime.currentUsers}</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.realtime.activeClassrooms}</div>
              <div className="text-sm text-muted-foreground">Live Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{data.realtime.liveInteractions}</div>
              <div className="text-sm text-muted-foreground">Interactions/hour</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{data.realtime.systemLoad}%</div>
              <div className="text-sm text-muted-foreground">System Load</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Total Users"
          value={data.overview.totalUsers}
          change={12.5}
          icon={Users}
          trend="up"
        />
        <MetricCard
          title="Active Learners"
          value={data.overview.activeUsers}
          change={8.3}
          icon={Activity}
          trend="up"
        />
        <MetricCard
          title="Course Completion"
          value={data.overview.completionRate}
          change={-2.1}
          icon={Target}
          trend="down"
          format="percentage"
        />
        <MetricCard
          title="Total Courses"
          value={data.overview.totalCourses}
          change={5.7}
          icon={BookOpen}
          trend="up"
        />
        <MetricCard
          title="Watch Time (hrs)"
          value={data.overview.totalWatchTime}
          change={15.2}
          icon={Clock}
          trend="up"
        />
        <MetricCard
          title="Engagement Score"
          value={data.overview.engagementScore}
          change={3.4}
          icon={Brain}
          trend="up"
          format="percentage"
        />
      </div>

      {/* Analytics Tabs */}
      <Tabs value={selectedMetric} onValueChange={setSelectedMetric}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>User Growth Trend</CardTitle>
                <CardDescription>Total and active users over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.trends.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="users" 
                      stackId="1"
                      stroke={COLORS.primary} 
                      fill={COLORS.primary}
                      fillOpacity={0.6}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="active" 
                      stackId="1"
                      stroke={COLORS.success} 
                      fill={COLORS.success}
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Course Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Course Progress</CardTitle>
                <CardDescription>Courses started vs completed</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.trends.courseProgress}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="started" fill={COLORS.info} name="Started" />
                    <Bar dataKey="completed" fill={COLORS.success} name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Engagement */}
            <Card>
              <CardHeader>
                <CardTitle>24-Hour Engagement Pattern</CardTitle>
                <CardDescription>User activity throughout the day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.trends.engagement}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke={COLORS.primary} 
                      strokeWidth={2}
                      dot={{ fill: COLORS.primary }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Courses */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Courses</CardTitle>
                <CardDescription>By enrollment and completion rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.performance.topCourses.slice(0, 5).map((course, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{course.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {course.enrollments} enrollments • {course.rating}⭐
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{course.completion}%</div>
                        <Progress value={course.completion} className="w-16 h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Learning Velocity */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Velocity Trends</CardTitle>
                <CardDescription>Average study hours and efficiency over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.performance.learningVelocity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="avgHours" 
                      stroke={COLORS.primary} 
                      name="Avg Hours"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="efficiency" 
                      stroke={COLORS.success} 
                      name="Efficiency %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Struggling Areas */}
            <Card>
              <CardHeader>
                <CardTitle>Areas for Improvement</CardTitle>
                <CardDescription>Topics with high difficulty and dropout rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.performance.strugglingAreas.map((area, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{area.topic}</div>
                        <Badge variant={area.dropoffRate > 20 ? 'destructive' : 'secondary'}>
                          {area.dropoffRate}% dropout
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Difficulty:</span>
                        <Progress value={area.difficultyScore * 10} className="flex-1 h-2" />
                        <span className="text-sm font-medium">{area.difficultyScore}/10</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI-Powered Insights
                </CardTitle>
                <CardDescription>Machine learning recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                    <div className="font-medium text-blue-800">📈 Growth Opportunity</div>
                    <div className="text-sm text-blue-700">
                      Mobile engagement is 40% higher during evening hours. Consider promoting mobile learning.
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                    <div className="font-medium text-yellow-800">⚠️ Attention Needed</div>
                    <div className="text-sm text-yellow-700">
                      Advanced Algorithm course has 23% dropout rate. Review content difficulty curve.
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 border-l-4 border-green-400 rounded">
                    <div className="font-medium text-green-800">✅ Success Pattern</div>
                    <div className="text-sm text-green-700">
                      Interactive coding exercises increase completion rates by 35%. Expand to more courses.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Recommended Actions
                </CardTitle>
                <CardDescription>Priority improvements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { priority: 'High', action: 'Optimize mobile experience for evening learners', impact: '+15% engagement' },
                    { priority: 'High', action: 'Add prerequisites to Advanced Algorithms course', impact: '-10% dropout' },
                    { priority: 'Medium', action: 'Create more interactive coding challenges', impact: '+20% completion' },
                    { priority: 'Medium', action: 'Implement peer learning features', impact: '+12% retention' },
                    { priority: 'Low', action: 'Expand gamification elements', impact: '+8% motivation' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.action}</div>
                        <div className="text-xs text-muted-foreground">Expected: {item.impact}</div>
                      </div>
                      <Badge 
                        variant={
                          item.priority === 'High' ? 'destructive' : 
                          item.priority === 'Medium' ? 'default' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {item.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}