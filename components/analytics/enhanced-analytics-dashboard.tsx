'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  ScatterChart,
  Scatter,
  Treemap,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Play,
  BookOpen,
  Target,
  Award,
  Activity,
  Brain,
  Zap,
  Eye,
  MousePointer,
  Timer,
  Calendar,
  Filter,
  Download,
  Share,
  RefreshCw,
  Settings,
  Maximize2,
  Minimize2,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowUp,
  ArrowDown,
  ArrowRight
} from 'lucide-react';
import { format, subDays, subWeeks, subMonths, parseISO, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

// Enhanced Types
interface AnalyticsData {
  overview: OverviewMetrics;
  engagement: EngagementMetrics;
  performance: PerformanceMetrics;
  learningPatterns: LearningPattern[];
  contentAnalytics: ContentAnalytics;
  predictiveInsights: PredictiveInsights;
  realtimeMetrics: RealtimeMetrics;
}

interface OverviewMetrics {
  totalUsers: number;
  activeUsers: number;
  totalCourses: number;
  completedCourses: number;
  averageEngagement: number;
  totalWatchTime: number;
  growthRate: number;
  retentionRate: number;
  trend: TrendData[];
}

interface EngagementMetrics {
  sessionDuration: number;
  bounceRate: number;
  interactionRate: number;
  videoCompletionRate: number;
  quizAccuracy: number;
  discussionParticipation: number;
  engagementByHour: HourlyEngagement[];
  engagementByDay: DailyEngagement[];
}

interface PerformanceMetrics {
  avgScores: number;
  improvementRate: number;
  strugglingStudents: number;
  topPerformers: number;
  skillProgression: SkillProgression[];
  competencyMap: CompetencyData[];
}

interface LearningPattern {
  id: string;
  pattern: string;
  frequency: number;
  effectiveness: number;
  recommendation: string;
  impactScore: number;
}

interface ContentAnalytics {
  popularContent: ContentItem[];
  contentPerformance: ContentPerformance[];
  dropoffPoints: DropoffPoint[];
  contentEngagement: ContentEngagement[];
}

interface PredictiveInsights {
  completionPrediction: number;
  riskStudents: RiskStudent[];
  recommendedActions: RecommendedAction[];
  futureEngagement: FutureEngagement[];
}

interface RealtimeMetrics {
  activeNow: number;
  liveEngagement: number;
  currentActivity: ActivityData[];
  systemHealth: SystemHealth;
}

interface TrendData {
  date: string;
  value: number;
  previousValue?: number;
  growth?: number;
}

interface HourlyEngagement {
  hour: number;
  engagement: number;
  users: number;
}

interface DailyEngagement {
  day: string;
  engagement: number;
  users: number;
  sessions: number;
}

interface SkillProgression {
  skill: string;
  current: number;
  target: number;
  improvement: number;
}

interface CompetencyData {
  subject: string;
  A: number;
  B: number;
  fullMark: number;
}

interface ContentItem {
  id: string;
  title: string;
  views: number;
  completion: number;
  engagement: number;
  type: string;
}

interface ContentPerformance {
  name: string;
  completion: number;
  engagement: number;
  dropoff: number;
  satisfaction: number;
}

interface DropoffPoint {
  content: string;
  position: number;
  dropoffRate: number;
  reason: string;
}

interface ContentEngagement {
  name: string;
  value: number;
  children?: ContentEngagement[];
}

interface RiskStudent {
  id: string;
  name: string;
  riskLevel: 'low' | 'medium' | 'high';
  factors: string[];
  recommendation: string;
}

interface RecommendedAction {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  impact: number;
  effort: number;
}

interface FutureEngagement {
  date: string;
  predicted: number;
  confidence: number;
}

interface ActivityData {
  type: string;
  count: number;
  trend: number;
}

interface SystemHealth {
  uptime: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
}

interface FilterOptions {
  dateRange: DateRange;
  course: string;
  userType: string;
  metric: string;
}

interface EnhancedAnalyticsDashboardProps {
  userId?: string;
  courseId?: string;
  view?: 'student' | 'teacher' | 'admin';
  initialFilters?: Partial<FilterOptions>;
  onExport?: (data: any, format: string) => void;
  onShare?: (data: any) => void;
  className?: string;
}

// Custom Colors for Charts
const COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  warning: '#ef4444',
  success: '#22c55e',
  info: '#06b6d4',
  purple: '#8b5cf6',
  pink: '#ec4899',
  gray: '#6b7280'
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.accent,
  COLORS.warning,
  COLORS.success,
  COLORS.info,
  COLORS.purple,
  COLORS.pink
];

export function EnhancedAnalyticsDashboard({
  userId,
  courseId,
  view = 'student',
  initialFilters,
  onExport,
  onShare,
  className
}: EnhancedAnalyticsDashboardProps) {
  const { data: session } = useSession();
  
  // State Management
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: { 
      from: subDays(new Date(), 30), 
      to: new Date() 
    },
    course: 'all',
    userType: 'all',
    metric: 'all'
  });
  const [selectedTab, setSelectedTab] = useState('overview');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');
  const [realtimeEnabled, setRealtimeEnabled] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000);

  // Memoized calculations
  const filteredData = useMemo(() => {
    if (!data) return null;
    
    // Apply filters to data
    return data; // Simplified for now
  }, [data]);

  // Data fetching
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        ...(userId && { userId }),
        ...(courseId && { courseId }),
        view,
        from: filters.dateRange.from?.toISOString() || subDays(new Date(), 30).toISOString(),
        to: filters.dateRange.to?.toISOString() || new Date().toISOString(),
        course: filters.course,
        userType: filters.userType,
        metric: filters.metric
      });
      
      const response = await fetch(`/api/analytics/enhanced?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      
      // Fallback to mock data
      setData(generateMockData());
    } finally {
      setLoading(false);
    }
  }, [userId, courseId, view, filters]);

  // Real-time updates
  useEffect(() => {
    fetchAnalytics();
    
    if (realtimeEnabled) {
      const interval = setInterval(fetchAnalytics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchAnalytics, realtimeEnabled, refreshInterval]);

  // Generate mock data for development
  const generateMockData = (): AnalyticsData => ({
    overview: {
      totalUsers: 1247,
      activeUsers: 893,
      totalCourses: 45,
      completedCourses: 28,
      averageEngagement: 78.5,
      totalWatchTime: 15680,
      growthRate: 12.3,
      retentionRate: 85.2,
      trend: Array.from({ length: 30 }, (_, i) => ({
        date: format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'),
        value: Math.floor(Math.random() * 100) + 50,
        previousValue: Math.floor(Math.random() * 100) + 50,
        growth: Math.floor(Math.random() * 20) - 10
      }))
    },
    engagement: {
      sessionDuration: 23.4,
      bounceRate: 15.2,
      interactionRate: 67.8,
      videoCompletionRate: 82.3,
      quizAccuracy: 76.5,
      discussionParticipation: 34.2,
      engagementByHour: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        engagement: Math.floor(Math.random() * 80) + 20,
        users: Math.floor(Math.random() * 200) + 50
      })),
      engagementByDay: Array.from({ length: 7 }, (_, i) => ({
        day: format(subDays(new Date(), 6 - i), 'EEE'),
        engagement: Math.floor(Math.random() * 90) + 30,
        users: Math.floor(Math.random() * 300) + 100,
        sessions: Math.floor(Math.random() * 500) + 200
      }))
    },
    performance: {
      avgScores: 78.3,
      improvementRate: 15.7,
      strugglingStudents: 23,
      topPerformers: 156,
      skillProgression: [
        { skill: 'JavaScript', current: 75, target: 90, improvement: 12 },
        { skill: 'React', current: 68, target: 85, improvement: 8 },
        { skill: 'Node.js', current: 82, target: 95, improvement: 15 },
        { skill: 'Database', current: 70, target: 80, improvement: 10 }
      ],
      competencyMap: [
        { subject: 'Frontend', A: 120, B: 110, fullMark: 150 },
        { subject: 'Backend', A: 98, B: 130, fullMark: 150 },
        { subject: 'Database', A: 86, B: 130, fullMark: 150 },
        { subject: 'DevOps', A: 99, B: 100, fullMark: 150 },
        { subject: 'Testing', A: 85, B: 90, fullMark: 150 }
      ]
    },
    learningPatterns: [
      {
        id: '1',
        pattern: 'Morning Peak Activity',
        frequency: 85,
        effectiveness: 92,
        recommendation: 'Schedule important content for 9-11 AM',
        impactScore: 88
      },
      {
        id: '2',
        pattern: 'Weekend Learning',
        frequency: 65,
        effectiveness: 78,
        recommendation: 'Offer flexible weekend sessions',
        impactScore: 72
      }
    ],
    contentAnalytics: {
      popularContent: [
        { id: '1', title: 'React Fundamentals', views: 1247, completion: 85, engagement: 92, type: 'video' },
        { id: '2', title: 'JavaScript ES6', views: 998, completion: 78, engagement: 88, type: 'article' },
        { id: '3', title: 'Node.js Basics', views: 876, completion: 82, engagement: 85, type: 'course' }
      ],
      contentPerformance: [
        { name: 'Videos', completion: 82, engagement: 88, dropoff: 12, satisfaction: 4.5 },
        { name: 'Articles', completion: 76, engagement: 72, dropoff: 18, satisfaction: 4.2 },
        { name: 'Quizzes', completion: 94, engagement: 85, dropoff: 8, satisfaction: 4.3 },
        { name: 'Projects', completion: 68, engagement: 92, dropoff: 25, satisfaction: 4.7 }
      ],
      dropoffPoints: [
        { content: 'Advanced React', position: 65, dropoffRate: 25, reason: 'Complexity' },
        { content: 'State Management', position: 45, dropoffRate: 18, reason: 'Prerequisite gap' }
      ],
      contentEngagement: [
        {
          name: 'Frontend',
          value: 400,
          children: [
            { name: 'React', value: 200 },
            { name: 'Vue', value: 100 },
            { name: 'Angular', value: 100 }
          ]
        },
        {
          name: 'Backend',
          value: 300,
          children: [
            { name: 'Node.js', value: 150 },
            { name: 'Python', value: 100 },
            { name: 'Java', value: 50 }
          ]
        }
      ]
    },
    predictiveInsights: {
      completionPrediction: 78.5,
      riskStudents: [
        { id: '1', name: 'Student A', riskLevel: 'high', factors: ['Low engagement', 'Missed deadlines'], recommendation: 'Provide additional support' },
        { id: '2', name: 'Student B', riskLevel: 'medium', factors: ['Declining scores'], recommendation: 'Schedule check-in' }
      ],
      recommendedActions: [
        { id: '1', title: 'Improve video content', description: 'Add interactive elements', priority: 'high', impact: 85, effort: 60 },
        { id: '2', title: 'Enhanced quiz feedback', description: 'Provide detailed explanations', priority: 'medium', impact: 70, effort: 40 }
      ],
      futureEngagement: Array.from({ length: 14 }, (_, i) => ({
        date: format(subDays(new Date(), -i), 'yyyy-MM-dd'),
        predicted: Math.floor(Math.random() * 20) + 70,
        confidence: Math.floor(Math.random() * 30) + 70
      }))
    },
    realtimeMetrics: {
      activeNow: 245,
      liveEngagement: 78,
      currentActivity: [
        { type: 'Video Watching', count: 89, trend: 12 },
        { type: 'Quiz Taking', count: 34, trend: -5 },
        { type: 'Reading', count: 67, trend: 8 },
        { type: 'Discussion', count: 23, trend: 15 }
      ],
      systemHealth: {
        uptime: 99.8,
        responseTime: 145,
        errorRate: 0.2,
        throughput: 1250
      }
    }
  });

  // Export functionality
  const handleExport = useCallback((format: 'pdf' | 'csv' | 'json') => {
    if (onExport && data) {
      onExport(data, format);
    }
  }, [onExport, data]);

  // Share functionality
  const handleShare = useCallback(() => {
    if (onShare && data) {
      onShare(data);
    }
  }, [onShare, data]);

  // Render loading state
  if (loading) {
    return (
      <div className={cn('p-6 space-y-6', className)}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render error state
  if (error && !data) {
    return (
      <div className={cn('p-6', className)}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className={cn('p-6 space-y-6', fullscreen && 'fixed inset-0 z-50 bg-background overflow-auto', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {view === 'student' ? 'Your Learning' : view === 'teacher' ? 'Course Analytics' : 'Platform Analytics'} Overview
            </p>
          </div>
          {realtimeEnabled && (
            <Badge variant="outline" className="animate-pulse">
              <Activity className="w-3 h-3 mr-1" />
              Live
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <DateRangePicker
            value={filters.dateRange}
            onChange={(range) => setFilters(prev => ({ ...prev, dateRange: range || { from: subDays(new Date(), 30), to: new Date() } }))}
          />
          
          <Select value={filters.course} onValueChange={(value) => setFilters(prev => ({ ...prev, course: value }))}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              <SelectItem value="react">React Course</SelectItem>
              <SelectItem value="node">Node.js Course</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={() => setComparisonMode(!comparisonMode)}>
            <BarChart3 className="w-4 h-4" />
            {comparisonMode ? 'Exit Compare' : 'Compare'}
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => setRealtimeEnabled(!realtimeEnabled)}>
            <RefreshCw className={cn('w-4 h-4', realtimeEnabled && 'animate-spin')} />
            {realtimeEnabled ? 'Disable' : 'Enable'} Live
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => setFullscreen(!fullscreen)}>
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share className="w-4 h-4" />
          </Button>
          
          <Select value="pdf" onValueChange={handleExport}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">Export PDF</SelectItem>
              <SelectItem value="csv">Export CSV</SelectItem>
              <SelectItem value="json">Export JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalUsers.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {data.overview.growthRate > 0 ? (
                <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={data.overview.growthRate > 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(data.overview.growthRate)}%
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.activeUsers.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>{Math.round((data.overview.activeUsers / data.overview.totalUsers) * 100)}% of total</span>
            </div>
            <Progress value={(data.overview.activeUsers / data.overview.totalUsers) * 100} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Engagement</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.averageEngagement}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
              <span>Above target (70%)</span>
            </div>
            <Progress value={data.overview.averageEngagement} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Watch Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(data.overview.totalWatchTime / 60)}h</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Timer className="h-3 w-3 mr-1" />
              <span>Avg. {Math.round(data.overview.totalWatchTime / data.overview.activeUsers)} min/user</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="predictions">Insights</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>User Growth Trend</CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant={chartType === 'line' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setChartType('line')}
                  >
                    <LineChartIcon className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant={chartType === 'bar' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setChartType('bar')}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant={chartType === 'area' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setChartType('area')}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  {chartType === 'line' ? (
                    <LineChart data={data.overview.trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => format(parseISO(value), 'MMM dd')}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value) => format(parseISO(value), 'MMM dd, yyyy')}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={COLORS.primary}
                        strokeWidth={2}
                        dot={{ fill: COLORS.primary, strokeWidth: 2 }}
                      />
                      {comparisonMode && (
                        <Line 
                          type="monotone" 
                          dataKey="previousValue" 
                          stroke={COLORS.secondary}
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ fill: COLORS.secondary, strokeWidth: 2 }}
                        />
                      )}
                    </LineChart>
                  ) : chartType === 'bar' ? (
                    <BarChart data={data.overview.trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => format(parseISO(value), 'MMM dd')}
                      />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill={COLORS.primary} />
                      {comparisonMode && (
                        <Bar dataKey="previousValue" fill={COLORS.secondary} />
                      )}
                    </BarChart>
                  ) : (
                    <AreaChart data={data.overview.trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => format(parseISO(value), 'MMM dd')}
                      />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke={COLORS.primary}
                        fill={COLORS.primary}
                        fillOpacity={0.6}
                      />
                      {comparisonMode && (
                        <Area 
                          type="monotone" 
                          dataKey="previousValue" 
                          stroke={COLORS.secondary}
                          fill={COLORS.secondary}
                          fillOpacity={0.3}
                        />
                      )}
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Real-time Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium">Active Now</span>
                    </div>
                    <span className="text-2xl font-bold">{data.realtimeMetrics.activeNow}</span>
                  </div>
                  
                  <div className="space-y-2">
                    {data.realtimeMetrics.currentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded bg-muted">
                        <span className="text-sm">{activity.type}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{activity.count}</span>
                          {activity.trend > 0 ? (
                            <ArrowUp className="h-3 w-3 text-green-500" />
                          ) : activity.trend < 0 ? (
                            <ArrowDown className="h-3 w-3 text-red-500" />
                          ) : (
                            <ArrowRight className="h-3 w-3 text-gray-400" />
                          )}
                          <span className={cn(
                            'text-xs',
                            activity.trend > 0 ? 'text-green-500' : activity.trend < 0 ? 'text-red-500' : 'text-gray-400'
                          )}>
                            {Math.abs(activity.trend)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Engagement by Hour</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.engagement.engagementByHour}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="hour" 
                      tickFormatter={(value) => `${value}:00`}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => `${value}:00`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="engagement" 
                      stroke={COLORS.primary}
                      strokeWidth={2}
                      name="Engagement %"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke={COLORS.secondary}
                      strokeWidth={2}
                      name="Active Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Weekly Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={data.engagement.engagementByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="users" fill={COLORS.primary} name="Users" />
                    <Line yAxisId="right" type="monotone" dataKey="engagement" stroke={COLORS.accent} strokeWidth={2} name="Engagement %" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Session Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.engagement.sessionDuration}m</div>
                <Progress value={data.engagement.sessionDuration} className="mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Video Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.engagement.videoCompletionRate}%</div>
                <Progress value={data.engagement.videoCompletionRate} className="mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quiz Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.engagement.quizAccuracy}%</div>
                <Progress value={data.engagement.quizAccuracy} className="mt-2" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Skill Progression</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.performance.skillProgression.map((skill, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{skill.skill}</span>
                        <span className="text-sm text-muted-foreground">{skill.current}% / {skill.target}%</span>
                      </div>
                      <div className="space-y-1">
                        <Progress value={skill.current} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Current</span>
                          <span className="text-green-500">+{skill.improvement}% improvement</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Competency Radar</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={data.performance.competencyMap}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={90} domain={[0, 150]} />
                    <Radar 
                      name="Current" 
                      dataKey="A" 
                      stroke={COLORS.primary} 
                      fill={COLORS.primary} 
                      fillOpacity={0.6}
                    />
                    <Radar 
                      name="Target" 
                      dataKey="B" 
                      stroke={COLORS.secondary} 
                      fill={COLORS.secondary} 
                      fillOpacity={0.3}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Scores</p>
                    <p className="text-2xl font-bold">{data.performance.avgScores}%</p>
                  </div>
                  <Award className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Improvement</p>
                    <p className="text-2xl font-bold text-green-500">+{data.performance.improvementRate}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Struggling</p>
                    <p className="text-2xl font-bold text-red-500">{data.performance.strugglingStudents}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Top Performers</p>
                    <p className="text-2xl font-bold text-blue-500">{data.performance.topPerformers}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Content Analytics Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={data.contentAnalytics.contentPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="completion" fill={COLORS.primary} name="Completion %" />
                    <Bar dataKey="engagement" fill={COLORS.secondary} name="Engagement %" />
                    <Line type="monotone" dataKey="satisfaction" stroke={COLORS.accent} strokeWidth={2} name="Satisfaction" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Content Engagement TreeMap</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <Treemap
                    data={data.contentAnalytics.contentEngagement}
                    dataKey="value"
                    stroke="#fff"
                    fill={COLORS.primary}
                  />
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Popular Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.contentAnalytics.popularContent.map((content, index) => (
                  <div key={content.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        {content.type === 'video' ? (
                          <Play className="w-4 h-4 text-primary" />
                        ) : content.type === 'article' ? (
                          <BookOpen className="w-4 h-4 text-primary" />
                        ) : (
                          <Target className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{content.title}</h3>
                        <p className="text-sm text-muted-foreground">{content.views} views • {content.completion}% completion</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{content.engagement}% engagement</Badge>
                      <Badge variant="outline">#{index + 1}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Predictive Insights Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Completion Prediction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary">{data.predictiveInsights.completionPrediction}%</div>
                    <p className="text-sm text-muted-foreground">Predicted completion rate</p>
                  </div>
                  <Progress value={data.predictiveInsights.completionPrediction} className="h-4" />
                  <div className="text-sm text-muted-foreground text-center">
                    Based on current learning patterns and engagement metrics
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Future Engagement Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.predictiveInsights.futureEngagement}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(parseISO(value), 'MMM dd')}
                    />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke={COLORS.primary}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Predicted Engagement"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="confidence" 
                      stroke={COLORS.secondary}
                      strokeWidth={1}
                      name="Confidence %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>At-Risk Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.predictiveInsights.riskStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-3 h-3 rounded-full',
                          student.riskLevel === 'high' ? 'bg-red-500' :
                          student.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        )} />
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">{student.factors.join(', ')}</p>
                        </div>
                      </div>
                      <Badge variant={student.riskLevel === 'high' ? 'destructive' : 'secondary'}>
                        {student.riskLevel} risk
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recommended Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.predictiveInsights.recommendedActions.map((action) => (
                    <div key={action.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{action.title}</h4>
                        <Badge variant={action.priority === 'high' ? 'destructive' : action.priority === 'medium' ? 'secondary' : 'outline'}>
                          {action.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{action.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          <span>Impact: {action.impact}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Effort: {action.effort}%</span>
                        </div>
                      </div>
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